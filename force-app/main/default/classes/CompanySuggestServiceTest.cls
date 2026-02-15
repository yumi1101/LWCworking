@IsTest
private class CompanySuggestServiceTest {
    private class SuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{' +
                '"results":{' +
                  '"companies":[' +
                    '{"company":{"name":"Acme Inc","jurisdiction_code":"us_ca","company_number":"12345","current_status":"active","registered_address":"1 Main St"}}' +
                  ']' +
                '}' +
              '}');
            return res;
        }
    }

    @IsTest
    static void testSearchCompanies() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());
        Test.startTest();
        List<CompanySuggestService.CompanyCandidate> res = CompanySuggestService.searchCompanies('Acme', null, 5);
        Test.stopTest();
        System.assert(!res.isEmpty());
        System.assertEquals('Acme Inc', res[0].name);
    }
}
