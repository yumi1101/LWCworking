@IsTest
public class FxRateServiceTest {
    private class SuccessMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"base":"USD","date":"2024-01-10","rates":{"JPY":150.12}}');
            return res;
        }
    }

    @IsTest
    static void testGetLatestRateWithAmount() {
        Test.setMock(HttpCalloutMock.class, new SuccessMock());
        Test.startTest();
        FxRateService.FxRateResult result = FxRateService.getLatestRate('USD', 'JPY', 100);
        Test.stopTest();

        System.assertEquals('USD', result.baseCcy);
        System.assertEquals('JPY', result.quoteCcy);
        System.assertEquals(150.12, result.rate);
        System.assertEquals('2024-01-10', result.rateDate);
        System.assertEquals(15012, result.convertedAmount);
        System.assertEquals('Frankfurter', result.provider);
    }

    @IsTest
    static void testValidationSameCurrency() {
        try {
            FxRateService.getLatestRate('USD', 'USD', null);
            System.assert(false, 'Expected exception');
        } catch (AuraHandledException ex) {
            System.assert(ex.getMessage().contains('同一'));
        }
    }
}
