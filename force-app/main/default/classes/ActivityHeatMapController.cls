// ファイル名: ActivityHeatmapController.cls
public with sharing class ActivityHeatMapController {

    public class DayCount {
        @AuraEnabled public Date   day;
        @AuraEnabled public Integer count;
        public DayCount(Date d, Integer c) { day = d; count = c; }
    }

    /**
     * 期間内の Task を日別にカウントして返します。
     * ownerId を渡すとそのユーザの Task のみ。null なら全体。
     */
    @AuraEnabled(cacheable=true)
    public static List<DayCount> getTaskCounts(Date startDate, Date endDate, Id ownerId) {
        if (startDate == null || endDate == null) {
            throw new AuraHandledException('startDate と endDate は必須です。');
        }

        // 条件に合う Task を取得（ActivityDate があるもの）
        List<Task> tasks;
        if (ownerId == null) {
            tasks = [
                SELECT ActivityDate
                FROM Task
                WHERE IsDeleted = false
                  AND ActivityDate != null
                  AND ActivityDate >= :startDate
                  AND ActivityDate <= :endDate
                LIMIT 50000
            ];
        } else {
            tasks = [
                SELECT ActivityDate
                FROM Task
                WHERE IsDeleted = false
                  AND ActivityDate != null
                  AND OwnerId = :ownerId
                  AND ActivityDate >= :startDate
                  AND ActivityDate <= :endDate
                LIMIT 50000
            ];
        }

        // 日別バケット
        Map<Date, Integer> bucket = new Map<Date, Integer>();
        for (Task t : tasks) {
            Date d = t.ActivityDate;
            Integer c = bucket.containsKey(d) ? bucket.get(d) : 0;
            bucket.put(d, c + 1);
        }

        // 期間全日を0埋めして返す
        List<DayCount> out = new List<DayCount>();
        for (Date d = startDate; d <= endDate; d = d.addDays(1)) {
            out.add(new DayCount(d, bucket.containsKey(d) ? bucket.get(d) : 0));
        }
        return out;
    }
}
