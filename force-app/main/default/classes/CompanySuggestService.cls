public with sharing class CompanySuggestService {

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
        if (String.isBlank(query) || query.trim().length() < 2) {
            return new List<CompanyCandidate>();
        }

        Integer perPage = (limitOpt == null) ? 10 : Math.max(1, Math.min(50, limitOpt));
        String q = EncodingUtil.urlEncode(query.trim(), 'UTF-8');
        String endpoint = 'callout:OpenCorporates/v0.4/companies/search?q=' + q + '&per_page=' + String.valueOf(perPage);
        if (!String.isBlank(jurisdictionOpt)) {
            endpoint += '&jurisdiction_code=' + EncodingUtil.urlEncode(jurisdictionOpt, 'UTF-8');
        }

        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        req.setEndpoint(endpoint);
        req.setTimeout(10000);

        Http http = new Http();
        HttpResponse res;
        try {
            res = http.send(req);
        } catch (Exception e) {
            throw new AuraHandledException('通信に失敗しました。');
        }

        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('検索に失敗しました。(' + res.getStatusCode() + ')');
        }

        // parse
        Object parsed = JSON.deserializeUntyped(res.getBody());
        if (!(parsed instanceof Map<String, Object>)) {
            return new List<CompanyCandidate>();
        }
        Map<String, Object> root = (Map<String, Object>) parsed;
        if (!root.containsKey('results')) return new List<CompanyCandidate>();
        Map<String, Object> results = (Map<String, Object>) root.get('results');
        if (!results.containsKey('companies')) return new List<CompanyCandidate>();
        List<Object> companies = (List<Object>) results.get('companies');

        List<CompanyCandidate> out = new List<CompanyCandidate>();
        for (Object o : companies) {
            if (!(o instanceof Map<String, Object>)) continue;
            Map<String, Object> companyWrap = (Map<String, Object>) o;
            // companyWrap usually has key 'company'
            Map<String, Object> comp = (Map<String, Object>) companyWrap.get('company');
            if (comp == null) continue;
            CompanyCandidate c = new CompanyCandidate();
            c.name = (String) comp.get('name');
            c.jurisdictionCode = (String) comp.get('jurisdiction_code');
            c.companyNumber = (String) comp.get('company_number');
            c.status = (String) comp.get('current_status');
            // address may be nested under registered_address or address
            c.rawAddress = comp.containsKey('registered_address') ? String.valueOf(comp.get('registered_address')) : null;
            c.source = 'OpenCorporates';
            out.add(c);
        }
        return out;
    }
}
