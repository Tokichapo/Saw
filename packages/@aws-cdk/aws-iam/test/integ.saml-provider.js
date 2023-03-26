"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// !cdk-integ saml*
const path = require("path");
const core_1 = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const iam = require("../lib");
class TestStack extends core_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const provider = new iam.SamlProvider(this, 'Provider', {
            metadataDocument: iam.SamlMetadataDocument.fromFile(path.join(__dirname, 'saml-metadata-document.xml')),
        });
        new iam.Role(this, 'Role', {
            assumedBy: new iam.SamlConsolePrincipal(provider),
        });
    }
}
const app = new core_1.App();
new integ_tests_1.IntegTest(app, 'saml-provider-test', {
    testCases: [new TestStack(app, 'cdk-saml-provider')],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuc2FtbC1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLnNhbWwtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvQkFBb0I7QUFDcEIsNkJBQTZCO0FBQzdCLHdDQUF1RDtBQUN2RCxzREFBaUQ7QUFFakQsOEJBQThCO0FBRTlCLE1BQU0sU0FBVSxTQUFRLFlBQUs7SUFDM0IsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUN0RCxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLENBQUM7U0FDeEcsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUU7WUFDekIsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQztTQUNsRCxDQUFDLENBQUM7S0FDSjtDQUNGO0FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFHLEVBQUUsQ0FBQztBQUV0QixJQUFJLHVCQUFTLENBQUMsR0FBRyxFQUFFLG9CQUFvQixFQUFFO0lBQ3ZDLFNBQVMsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0NBQ3JELENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyAhY2RrLWludGVnIHNhbWwqXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQXBwLCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHsgSW50ZWdUZXN0IH0gZnJvbSAnQGF3cy1jZGsvaW50ZWctdGVzdHMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnLi4vbGliJztcblxuY2xhc3MgVGVzdFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHByb3ZpZGVyID0gbmV3IGlhbS5TYW1sUHJvdmlkZXIodGhpcywgJ1Byb3ZpZGVyJywge1xuICAgICAgbWV0YWRhdGFEb2N1bWVudDogaWFtLlNhbWxNZXRhZGF0YURvY3VtZW50LmZyb21GaWxlKHBhdGguam9pbihfX2Rpcm5hbWUsICdzYW1sLW1ldGFkYXRhLWRvY3VtZW50LnhtbCcpKSxcbiAgICB9KTtcblxuICAgIG5ldyBpYW0uUm9sZSh0aGlzLCAnUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TYW1sQ29uc29sZVByaW5jaXBhbChwcm92aWRlciksXG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuXG5uZXcgSW50ZWdUZXN0KGFwcCwgJ3NhbWwtcHJvdmlkZXItdGVzdCcsIHtcbiAgdGVzdENhc2VzOiBbbmV3IFRlc3RTdGFjayhhcHAsICdjZGstc2FtbC1wcm92aWRlcicpXSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==