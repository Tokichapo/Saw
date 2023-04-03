"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lambda = require("aws-cdk-lib/aws-lambda");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
const cdk = require("aws-cdk-lib");
const integ = require("@aws-cdk/integ-tests-alpha");
const test_function_1 = require("./test-function");
const aws_lambda_event_sources_1 = require("aws-cdk-lib/aws-lambda-event-sources");
class KafkaSelfManagedEventSourceTest extends cdk.Stack {
    constructor(scope, id) {
        super(scope, id);
        const dummyCertString = `-----BEGIN CERTIFICATE-----
MIIE5DCCAsygAwIBAgIRAPJdwaFaNRrytHBto0j5BA0wDQYJKoZIhvcNAQELBQAw
cmUuiAii9R0=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIFgjCCA2qgAwIBAgIQdjNZd6uFf9hbNC5RdfmHrzANBgkqhkiG9w0BAQsFADBb
c8PH3PSoAaRwMMgOSA2ALJvbRz8mpg==
-----END CERTIFICATE-----"
`;
        const dummyPrivateKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----
zp2mwJn2NYB7AZ7+imp0azDZb+8YG2aUCiyqb6PnnA==
-----END ENCRYPTED PRIVATE KEY-----`;
        const fn = new test_function_1.TestFunction(this, 'F');
        const rootCASecret = new secretsmanager.Secret(this, 'S', {
            secretObjectValue: {
                certificate: cdk.SecretValue.unsafePlainText(dummyCertString),
            },
        });
        const clientCertificatesSecret = new secretsmanager.Secret(this, 'SC', {
            secretObjectValue: {
                certificate: cdk.SecretValue.unsafePlainText(dummyCertString),
                privateKey: cdk.SecretValue.unsafePlainText(dummyPrivateKey),
            },
        });
        rootCASecret.grantRead(fn);
        clientCertificatesSecret.grantRead(fn);
        const bootstrapServers = [
            'my-self-hosted-kafka-broker-1:9092',
            'my-self-hosted-kafka-broker-2:9092',
            'my-self-hosted-kafka-broker-3:9092',
        ];
        fn.addEventSource(new aws_lambda_event_sources_1.SelfManagedKafkaEventSource({
            bootstrapServers,
            topic: 'my-test-topic',
            consumerGroupId: 'myTestConsumerGroup',
            secret: clientCertificatesSecret,
            authenticationMethod: aws_lambda_event_sources_1.AuthenticationMethod.CLIENT_CERTIFICATE_TLS_AUTH,
            rootCACertificate: rootCASecret,
            startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        }));
    }
}
const app = new cdk.App();
const stack = new KafkaSelfManagedEventSourceTest(app, 'lambda-event-source-kafka-self-managed');
new integ.IntegTest(app, 'LambdaEventSourceKafkaSelfManagedTest', {
    testCases: [stack],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcua2Fma2Etc2VsZm1hbmFnZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5rYWZrYS1zZWxmbWFuYWdlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUFpRDtBQUNqRCxpRUFBaUU7QUFDakUsbUNBQW1DO0FBQ25DLG9EQUFvRDtBQUNwRCxtREFBK0M7QUFDL0MsbUZBQXlHO0FBRXpHLE1BQU0sK0JBQWdDLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckQsWUFBWSxLQUFjLEVBQUUsRUFBVTtRQUNwQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sZUFBZSxHQUFHOzs7Ozs7OztDQVEzQixDQUFDO1FBRUUsTUFBTSxlQUFlLEdBQUc7O29DQUVRLENBQUM7UUFFakMsTUFBTSxFQUFFLEdBQUcsSUFBSSw0QkFBWSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLFlBQVksR0FBRyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUN4RCxpQkFBaUIsRUFBRTtnQkFDakIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQzthQUM5RDtTQUNGLENBQUMsQ0FBQztRQUNILE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7WUFDckUsaUJBQWlCLEVBQUU7Z0JBQ2pCLFdBQVcsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUM7Z0JBQzdELFVBQVUsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUM7YUFDN0Q7U0FDRixDQUFDLENBQUM7UUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzNCLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV2QyxNQUFNLGdCQUFnQixHQUFHO1lBQ3ZCLG9DQUFvQztZQUNwQyxvQ0FBb0M7WUFDcEMsb0NBQW9DO1NBQ3JDLENBQUM7UUFFRixFQUFFLENBQUMsY0FBYyxDQUNmLElBQUksc0RBQTJCLENBQUM7WUFDOUIsZ0JBQWdCO1lBQ2hCLEtBQUssRUFBRSxlQUFlO1lBQ3RCLGVBQWUsRUFBRSxxQkFBcUI7WUFDdEMsTUFBTSxFQUFFLHdCQUF3QjtZQUNoQyxvQkFBb0IsRUFBRSwrQ0FBb0IsQ0FBQywyQkFBMkI7WUFDdEUsaUJBQWlCLEVBQUUsWUFBWTtZQUMvQixnQkFBZ0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsWUFBWTtTQUN2RCxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQUVELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksK0JBQStCLENBQy9DLEdBQUcsRUFDSCx3Q0FBd0MsQ0FDekMsQ0FBQztBQUNGLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsdUNBQXVDLEVBQUU7SUFDaEUsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO0NBQ25CLENBQUMsQ0FBQztBQUNILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgaW50ZWcgZnJvbSAnQGF3cy1jZGsvaW50ZWctdGVzdHMtYWxwaGEnO1xuaW1wb3J0IHsgVGVzdEZ1bmN0aW9uIH0gZnJvbSAnLi90ZXN0LWZ1bmN0aW9uJztcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uTWV0aG9kLCBTZWxmTWFuYWdlZEthZmthRXZlbnRTb3VyY2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLWV2ZW50LXNvdXJjZXMnO1xuXG5jbGFzcyBLYWZrYVNlbGZNYW5hZ2VkRXZlbnRTb3VyY2VUZXN0IGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgZHVtbXlDZXJ0U3RyaW5nID0gYC0tLS0tQkVHSU4gQ0VSVElGSUNBVEUtLS0tLVxuTUlJRTVEQ0NBc3lnQXdJQkFnSVJBUEpkd2FGYU5Scnl0SEJ0bzBqNUJBMHdEUVlKS29aSWh2Y05BUUVMQlFBd1xuY21VdWlBaWk5UjA9XG4tLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tXG4tLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS1cbk1JSUZnakNDQTJxZ0F3SUJBZ0lRZGpOWmQ2dUZmOWhiTkM1UmRmbUhyekFOQmdrcWhraUc5dzBCQVFzRkFEQmJcbmM4UEgzUFNvQWFSd01NZ09TQTJBTEp2YlJ6OG1wZz09XG4tLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tXCJcbmA7XG5cbiAgICBjb25zdCBkdW1teVByaXZhdGVLZXkgPSBgLS0tLS1CRUdJTiBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLVxuenAybXdKbjJOWUI3QVo3K2ltcDBhekRaYis4WUcyYVVDaXlxYjZQbm5BPT1cbi0tLS0tRU5EIEVOQ1JZUFRFRCBQUklWQVRFIEtFWS0tLS0tYDtcblxuICAgIGNvbnN0IGZuID0gbmV3IFRlc3RGdW5jdGlvbih0aGlzLCAnRicpO1xuICAgIGNvbnN0IHJvb3RDQVNlY3JldCA9IG5ldyBzZWNyZXRzbWFuYWdlci5TZWNyZXQodGhpcywgJ1MnLCB7XG4gICAgICBzZWNyZXRPYmplY3RWYWx1ZToge1xuICAgICAgICBjZXJ0aWZpY2F0ZTogY2RrLlNlY3JldFZhbHVlLnVuc2FmZVBsYWluVGV4dChkdW1teUNlcnRTdHJpbmcpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBjbGllbnRDZXJ0aWZpY2F0ZXNTZWNyZXQgPSBuZXcgc2VjcmV0c21hbmFnZXIuU2VjcmV0KHRoaXMsICdTQycsIHtcbiAgICAgIHNlY3JldE9iamVjdFZhbHVlOiB7XG4gICAgICAgIGNlcnRpZmljYXRlOiBjZGsuU2VjcmV0VmFsdWUudW5zYWZlUGxhaW5UZXh0KGR1bW15Q2VydFN0cmluZyksXG4gICAgICAgIHByaXZhdGVLZXk6IGNkay5TZWNyZXRWYWx1ZS51bnNhZmVQbGFpblRleHQoZHVtbXlQcml2YXRlS2V5KSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcm9vdENBU2VjcmV0LmdyYW50UmVhZChmbik7XG4gICAgY2xpZW50Q2VydGlmaWNhdGVzU2VjcmV0LmdyYW50UmVhZChmbik7XG5cbiAgICBjb25zdCBib290c3RyYXBTZXJ2ZXJzID0gW1xuICAgICAgJ215LXNlbGYtaG9zdGVkLWthZmthLWJyb2tlci0xOjkwOTInLFxuICAgICAgJ215LXNlbGYtaG9zdGVkLWthZmthLWJyb2tlci0yOjkwOTInLFxuICAgICAgJ215LXNlbGYtaG9zdGVkLWthZmthLWJyb2tlci0zOjkwOTInLFxuICAgIF07XG5cbiAgICBmbi5hZGRFdmVudFNvdXJjZShcbiAgICAgIG5ldyBTZWxmTWFuYWdlZEthZmthRXZlbnRTb3VyY2Uoe1xuICAgICAgICBib290c3RyYXBTZXJ2ZXJzLFxuICAgICAgICB0b3BpYzogJ215LXRlc3QtdG9waWMnLFxuICAgICAgICBjb25zdW1lckdyb3VwSWQ6ICdteVRlc3RDb25zdW1lckdyb3VwJyxcbiAgICAgICAgc2VjcmV0OiBjbGllbnRDZXJ0aWZpY2F0ZXNTZWNyZXQsXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uTWV0aG9kOiBBdXRoZW50aWNhdGlvbk1ldGhvZC5DTElFTlRfQ0VSVElGSUNBVEVfVExTX0FVVEgsXG4gICAgICAgIHJvb3RDQUNlcnRpZmljYXRlOiByb290Q0FTZWNyZXQsXG4gICAgICAgIHN0YXJ0aW5nUG9zaXRpb246IGxhbWJkYS5TdGFydGluZ1Bvc2l0aW9uLlRSSU1fSE9SSVpPTixcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbn1cblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IEthZmthU2VsZk1hbmFnZWRFdmVudFNvdXJjZVRlc3QoXG4gIGFwcCxcbiAgJ2xhbWJkYS1ldmVudC1zb3VyY2Uta2Fma2Etc2VsZi1tYW5hZ2VkJyxcbik7XG5uZXcgaW50ZWcuSW50ZWdUZXN0KGFwcCwgJ0xhbWJkYUV2ZW50U291cmNlS2Fma2FTZWxmTWFuYWdlZFRlc3QnLCB7XG4gIHRlc3RDYXNlczogW3N0YWNrXSxcbn0pO1xuYXBwLnN5bnRoKCk7XG4iXX0=