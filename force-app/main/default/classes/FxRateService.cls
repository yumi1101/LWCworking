public with sharing class FxRateService {
    // LWCへ返すためのDTO（必要項目のみ保持）
    public class FxRateResult {
        @AuraEnabled public String baseCcy;
        @AuraEnabled public String quoteCcy;
        @AuraEnabled public Decimal rate;
        @AuraEnabled public String rateDate;
        @AuraEnabled public Decimal convertedAmount;
        @AuraEnabled public String provider;
    }

    @AuraEnabled(cacheable=false)
    public static FxRateResult getLatestRate(String baseCcy, String quoteCcy, Decimal amountOpt) {
        baseCcy = normalizeCcy(baseCcy);
        quoteCcy = normalizeCcy(quoteCcy);

        // 入力バリデーション（ユーザ向けに簡潔なメッセージ）
        if (String.isBlank(baseCcy) || String.isBlank(quoteCcy)) {
            throw new AuraHandledException('通貨を選択してください。');
        }
        if (baseCcy == quoteCcy) {
            throw new AuraHandledException('基軸通貨と相手通貨は同一にできません。');
        }
        if (amountOpt != null && amountOpt <= 0) {
            throw new AuraHandledException('金額は0より大きい値を入力してください。');
        }

        // Frankfurterの最新レート取得URLを組み立て
        String endpoint = 'https://api.frankfurter.dev/v1/latest?base='
            + EncodingUtil.urlEncode(baseCcy, 'UTF-8')
            + '&symbols=' + EncodingUtil.urlEncode(quoteCcy, 'UTF-8');

        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        req.setEndpoint(endpoint);
        req.setTimeout(10000);

        HttpResponse res;
        try {
            res = new Http().send(req);
        } catch (Exception e) {
            throw new AuraHandledException('レートの取得に失敗しました。時間をおいて再試行してください。');
        }

        if (res.getStatusCode() != 200) {
            System.debug('FxRateService status=' + res.getStatusCode() + ' body=' + res.getBody());
            throw new AuraHandledException('レートの取得に失敗しました。時間をおいて再試行してください。');
        }

        // JSONをMap化して必要なキーだけ取得
        Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        Map<String, Object> rates = (Map<String, Object>) payload.get('rates');
        if (rates == null || !rates.containsKey(quoteCcy)) {
            throw new AuraHandledException('未対応通貨のためレートを取得できません。');
        }

        Decimal rate = toDecimal(rates.get(quoteCcy));
        FxRateResult result = new FxRateResult();
        result.baseCcy = baseCcy;
        result.quoteCcy = quoteCcy;
        result.rate = rate;
        result.rateDate = (String) payload.get('date');
        result.provider = 'Frankfurter';
        if (amountOpt != null) {
            result.convertedAmount = amountOpt * rate;
        }
        return result;
    }

    // 通貨コードの正規化（空白除去＋大文字化）
    private static String normalizeCcy(String ccy) {
        return String.isBlank(ccy) ? null : ccy.trim().toUpperCase();
    }

    // JSONから取得した値を安全にDecimalへ変換
    private static Decimal toDecimal(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Decimal) return (Decimal) raw;
        return Decimal.valueOf(String.valueOf(raw));
    }
}
