public with sharing class ZipcodeLookupService {

    public class AddressDTO {
        @AuraEnabled public String zipcode;
        @AuraEnabled public String prefecture; // 都道府県（address1）
        @AuraEnabled public String city;       // 市区町村（address2）
        @AuraEnabled public String town;       // 町域（address3）
        @AuraEnabled public String full;       // 例：東京都千代田区丸の内
    }

    private class ZipcloudResponse {
        public Integer status;
        public String message;
        public List<ZipcloudResult> results;

    }

    private class ZipcloudResult {
        public String zipcode;
        public String prefcode;
        public String address1;
        public String address2;
        public String address3;
        public String kana1;
        public String kana2;
        public String kana3;
    }

    @AuraEnabled(cacheable=false)
    public static List<AddressDTO> lookup(String zipcode) {
        if (String.isBlank(zipcode)) {
            throw new AuraHandledException('郵便番号が空です。');
        }
        // 半角数字以外を除去＆7桁チェック
        String sanitized = zipcode.replaceAll('[^0-9]', '');
        if (sanitized.length() != 7) {
            throw new AuraHandledException('郵便番号は7桁で入力してください。');
        }

        //ZipCloud APIに通信
        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        req.setEndpoint('callout:ZipCloud/api/search?zipcode=' + sanitized);
        Http http = new Http();
        HttpResponse res = http.send(req);
        System.debug(res.getBody());

        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('外部APIエラー: ' + res.getStatus());
        }

        ZipcloudResponse zr = (ZipcloudResponse)JSON.deserialize(res.getBody(), ZipcloudResponse.class);
        if (zr == null) {
            throw new AuraHandledException('無効なレスポンスです。');
        }
        if (zr.status != 200) {
            // Zipcloud は存在しない郵便番号などで 200 以外＋message を返す
            throw new AuraHandledException(zr.message != null ? zr.message : '検索に失敗しました。');
        }
        if (zr.results == null || zr.results.isEmpty()) {
            return new List<AddressDTO>();
        }

        List<AddressDTO> out = new List<AddressDTO>();
        for (ZipcloudResult r : zr.results) {
            AddressDTO dto = new AddressDTO();
            dto.zipcode    = r.zipcode;
            dto.prefecture = r.address1;
            dto.city       = r.address2;
            dto.town       = r.address3;
            dto.full       = String.join(new List<String>{ r.address1, r.address2, r.address3 }, '');
            out.add(dto);
        }
        return out;
    }
}
