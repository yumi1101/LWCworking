public with sharing class CompanySuggestService {

    // LWCへ返す会社候補DTO
    public class CompanyCandidate {
        @AuraEnabled public String name;
        @AuraEnabled public String jurisdictionCode;
        @AuraEnabled public String companyNumber;
        @AuraEnabled public String status;
        @AuraEnabled public String rawAddress;
        @AuraEnabled public String source;
    }

    @AuraEnabled(cacheable=false)
    public static List<CompanyCandidate> searchCompanies(String query, String jurisdictionOpt, Integer limitOpt) {
        // 入力不足の検索は外部APIを呼ばず空配列を返す
        if (String.isBlank(query) || query.trim().length() < 2) {
            return new List<CompanyCandidate>();
        }

        // 取得件数は1〜50件に正規化し、デフォルトは10件
        Integer perPage = (limitOpt == null) ? 10 : Math.max(1, Math.min(50, limitOpt));
        // OpenCorporates APIトークン（Custom Label）を取得
        String apiToken = Label.OpenCorporatesApiToken;
        apiToken = (apiToken == null) ? null : apiToken.trim();
        if (String.isBlank(apiToken) && !Test.isRunningTest()) {
            throw new AuraHandledException('OpenCorporates APIトークンが未設定です。');
        }
        if (String.isBlank(apiToken) && Test.isRunningTest()) {
            apiToken = 'DUMMY_TOKEN';
        }
        // 検索条件をURLエンコードしてOpenCorporates検索エンドポイントを構築
        String q = EncodingUtil.urlEncode(query.trim(), 'UTF-8');
        String endpoint = 'callout:OpenCorporates/v0.4/companies/search?q=' + q + '&per_page=' + String.valueOf(perPage);
        if (!String.isBlank(jurisdictionOpt)) {
            endpoint += '&jurisdiction_code=' + EncodingUtil.urlEncode(jurisdictionOpt, 'UTF-8');
        }
        endpoint += '&api_token=' + EncodingUtil.urlEncode(apiToken, 'UTF-8');

        // 外部API呼び出しのHTTPリクエストを準備
        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        req.setEndpoint(endpoint);
        req.setHeader('X-API-TOKEN', apiToken);
        req.setTimeout(10000);

        Http http = new Http();
        HttpResponse res;
        try {
            res = http.send(req);
        } catch (Exception e) {
            throw new AuraHandledException('通信に失敗しました。');
        }

        // 正常応答(200)以外は検索失敗として通知
        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('検索に失敗しました。(' + res.getStatusCode() + ')');
        }

        // JSONを段階的に辿ってcompanies配列を取得
        Object parsed = JSON.deserializeUntyped(res.getBody());
        if (!(parsed instanceof Map<String, Object>)) {
            return new List<CompanyCandidate>();
        }
        Map<String, Object> root = (Map<String, Object>) parsed;
        if (!root.containsKey('results')) return new List<CompanyCandidate>();
        Map<String, Object> results = (Map<String, Object>) root.get('results');
        if (!results.containsKey('companies')) return new List<CompanyCandidate>();
        List<Object> companies = (List<Object>) results.get('companies');

        // APIレスポンスをLWC向けDTOへ変換
        List<CompanyCandidate> out = new List<CompanyCandidate>();
        for (Object o : companies) {
            if (!(o instanceof Map<String, Object>)) continue;
            Map<String, Object> companyWrap = (Map<String, Object>) o;
            // OpenCorporatesの各要素は通常 { "company": {...} } 形式
            Map<String, Object> comp = (Map<String, Object>) companyWrap.get('company');
            if (comp == null) continue;
            CompanyCandidate c = new CompanyCandidate();
            c.name = (String) comp.get('name');
            c.jurisdictionCode = (String) comp.get('jurisdiction_code');
            c.companyNumber = (String) comp.get('company_number');
            c.status = (String) comp.get('current_status');
            // 登録住所がある場合はそのまま文字列化して格納
            c.rawAddress = comp.containsKey('registered_address') ? String.valueOf(comp.get('registered_address')) : null;
            c.source = 'OpenCorporates';
            out.add(c);
        }
        // 変換済み候補リストを返却
        return out;
    }
}
