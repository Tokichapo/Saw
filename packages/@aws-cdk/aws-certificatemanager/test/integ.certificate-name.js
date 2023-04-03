"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_route53_1 = require("@aws-cdk/aws-route53");
const core_1 = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const lib_1 = require("../lib");
/**
 * In order to test this you need to have a valid public hosted zone that you can use
 * to request certificates for.
 *
*/
const hostedZoneId = process.env.CDK_INTEG_HOSTED_ZONE_ID ?? process.env.HOSTED_ZONE_ID;
if (!hostedZoneId)
    throw new Error('For this test you must provide your own HostedZoneId as an env var "HOSTED_ZONE_ID"');
const hostedZoneName = process.env.CDK_INTEG_HOSTED_ZONE_NAME ?? process.env.HOSTED_ZONE_NAME;
if (!hostedZoneName)
    throw new Error('For this test you must provide your own HostedZoneName as an env var "HOSTED_ZONE_NAME"');
const domainName = process.env.CDK_INTEG_DOMAIN_NAME ?? process.env.DOMAIN_NAME;
if (!domainName)
    throw new Error('For this test you must provide your own Domain Name as an env var "DOMAIN_NAME"');
const app = new core_1.App();
const stack = new core_1.Stack(app, 'integ-certificate-name');
const hostedZone = aws_route53_1.PublicHostedZone.fromHostedZoneAttributes(stack, 'HostedZone', {
    hostedZoneId,
    zoneName: hostedZoneName,
});
new lib_1.Certificate(stack, 'Certificate', {
    domainName,
    certificateName: 'This is a test name',
    validation: lib_1.CertificateValidation.fromDns(hostedZone),
});
new integ_tests_1.IntegTest(app, 'integ-test', {
    testCases: [stack],
    diffAssets: true,
    enableLookups: true,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuY2VydGlmaWNhdGUtbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLmNlcnRpZmljYXRlLW5hbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBd0Q7QUFDeEQsd0NBQTJDO0FBQzNDLHNEQUFpRDtBQUNqRCxnQ0FBNEQ7QUFFNUQ7Ozs7RUFJRTtBQUNGLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7QUFDeEYsSUFBSSxDQUFDLFlBQVk7SUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHFGQUFxRixDQUFDLENBQUM7QUFDMUgsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO0FBQzlGLElBQUksQ0FBQyxjQUFjO0lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5RkFBeUYsQ0FBQyxDQUFDO0FBQ2hJLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7QUFDaEYsSUFBSSxDQUFDLFVBQVU7SUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGlGQUFpRixDQUFDLENBQUM7QUFFcEgsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLFlBQUssQ0FBQyxHQUFHLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztBQUN2RCxNQUFNLFVBQVUsR0FBRyw4QkFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFO0lBQ2hGLFlBQVk7SUFDWixRQUFRLEVBQUUsY0FBYztDQUN6QixDQUFDLENBQUM7QUFFSCxJQUFJLGlCQUFXLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRTtJQUNwQyxVQUFVO0lBQ1YsZUFBZSxFQUFFLHFCQUFxQjtJQUN0QyxVQUFVLEVBQUUsMkJBQXFCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztDQUN0RCxDQUFDLENBQUM7QUFFSCxJQUFJLHVCQUFTLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRTtJQUMvQixTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFDbEIsVUFBVSxFQUFFLElBQUk7SUFDaEIsYUFBYSxFQUFFLElBQUk7Q0FDcEIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHVibGljSG9zdGVkWm9uZSB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzJztcbmltcG9ydCB7IEFwcCwgU3RhY2sgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEludGVnVGVzdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzJztcbmltcG9ydCB7IENlcnRpZmljYXRlLCBDZXJ0aWZpY2F0ZVZhbGlkYXRpb24gfSBmcm9tICcuLi9saWInO1xuXG4vKipcbiAqIEluIG9yZGVyIHRvIHRlc3QgdGhpcyB5b3UgbmVlZCB0byBoYXZlIGEgdmFsaWQgcHVibGljIGhvc3RlZCB6b25lIHRoYXQgeW91IGNhbiB1c2VcbiAqIHRvIHJlcXVlc3QgY2VydGlmaWNhdGVzIGZvci5cbiAqXG4qL1xuY29uc3QgaG9zdGVkWm9uZUlkID0gcHJvY2Vzcy5lbnYuQ0RLX0lOVEVHX0hPU1RFRF9aT05FX0lEID8/IHByb2Nlc3MuZW52LkhPU1RFRF9aT05FX0lEO1xuaWYgKCFob3N0ZWRab25lSWQpIHRocm93IG5ldyBFcnJvcignRm9yIHRoaXMgdGVzdCB5b3UgbXVzdCBwcm92aWRlIHlvdXIgb3duIEhvc3RlZFpvbmVJZCBhcyBhbiBlbnYgdmFyIFwiSE9TVEVEX1pPTkVfSURcIicpO1xuY29uc3QgaG9zdGVkWm9uZU5hbWUgPSBwcm9jZXNzLmVudi5DREtfSU5URUdfSE9TVEVEX1pPTkVfTkFNRSA/PyBwcm9jZXNzLmVudi5IT1NURURfWk9ORV9OQU1FO1xuaWYgKCFob3N0ZWRab25lTmFtZSkgdGhyb3cgbmV3IEVycm9yKCdGb3IgdGhpcyB0ZXN0IHlvdSBtdXN0IHByb3ZpZGUgeW91ciBvd24gSG9zdGVkWm9uZU5hbWUgYXMgYW4gZW52IHZhciBcIkhPU1RFRF9aT05FX05BTUVcIicpO1xuY29uc3QgZG9tYWluTmFtZSA9IHByb2Nlc3MuZW52LkNES19JTlRFR19ET01BSU5fTkFNRSA/PyBwcm9jZXNzLmVudi5ET01BSU5fTkFNRTtcbmlmICghZG9tYWluTmFtZSkgdGhyb3cgbmV3IEVycm9yKCdGb3IgdGhpcyB0ZXN0IHlvdSBtdXN0IHByb3ZpZGUgeW91ciBvd24gRG9tYWluIE5hbWUgYXMgYW4gZW52IHZhciBcIkRPTUFJTl9OQU1FXCInKTtcblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgU3RhY2soYXBwLCAnaW50ZWctY2VydGlmaWNhdGUtbmFtZScpO1xuY29uc3QgaG9zdGVkWm9uZSA9IFB1YmxpY0hvc3RlZFpvbmUuZnJvbUhvc3RlZFpvbmVBdHRyaWJ1dGVzKHN0YWNrLCAnSG9zdGVkWm9uZScsIHtcbiAgaG9zdGVkWm9uZUlkLFxuICB6b25lTmFtZTogaG9zdGVkWm9uZU5hbWUsXG59KTtcblxubmV3IENlcnRpZmljYXRlKHN0YWNrLCAnQ2VydGlmaWNhdGUnLCB7XG4gIGRvbWFpbk5hbWUsXG4gIGNlcnRpZmljYXRlTmFtZTogJ1RoaXMgaXMgYSB0ZXN0IG5hbWUnLFxuICB2YWxpZGF0aW9uOiBDZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucyhob3N0ZWRab25lKSxcbn0pO1xuXG5uZXcgSW50ZWdUZXN0KGFwcCwgJ2ludGVnLXRlc3QnLCB7XG4gIHRlc3RDYXNlczogW3N0YWNrXSxcbiAgZGlmZkFzc2V0czogdHJ1ZSxcbiAgZW5hYmxlTG9va3VwczogdHJ1ZSxcbn0pO1xuIl19