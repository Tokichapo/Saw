"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const core_1 = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const s3 = require("../lib");
const PUT_OBJECTS_RESOURCE_TYPE = 'Custom::S3PutObjects';
class TestStack extends core_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const bucket = new s3.Bucket(this, 'Bucket', {
            removalPolicy: core_1.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // Put objects in the bucket to ensure auto delete works as expected
        const serviceToken = core_1.CustomResourceProvider.getOrCreate(this, PUT_OBJECTS_RESOURCE_TYPE, {
            codeDirectory: path.join(__dirname, 'put-objects-handler'),
            runtime: core_1.CustomResourceProviderRuntime.NODEJS_14_X,
            policyStatements: [{
                    Effect: 'Allow',
                    Action: 's3:PutObject',
                    Resource: bucket.arnForObjects('*'),
                }],
        });
        new core_1.CustomResource(this, 'PutObjectsCustomResource', {
            resourceType: PUT_OBJECTS_RESOURCE_TYPE,
            serviceToken,
            properties: {
                BucketName: bucket.bucketName,
            },
        });
    }
}
const app = new core_1.App();
new integ_tests_1.IntegTest(app, 'cdk-integ-s3-bucket-auto-delete-objects', {
    testCases: [new TestStack(app, 'cdk-s3-bucket-auto-delete-objects')],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYnVja2V0LWF1dG8tZGVsZXRlLW9iamVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5idWNrZXQtYXV0by1kZWxldGUtb2JqZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUE2QjtBQUM3Qix3Q0FBNkk7QUFDN0ksc0RBQWlEO0FBRWpELDZCQUE2QjtBQUU3QixNQUFNLHlCQUF5QixHQUFHLHNCQUFzQixDQUFDO0FBRXpELE1BQU0sU0FBVSxTQUFRLFlBQUs7SUFDM0IsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUMzQyxhQUFhLEVBQUUsb0JBQWEsQ0FBQyxPQUFPO1lBQ3BDLGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsb0VBQW9FO1FBQ3BFLE1BQU0sWUFBWSxHQUFHLDZCQUFzQixDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDdkYsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHFCQUFxQixDQUFDO1lBQzFELE9BQU8sRUFBRSxvQ0FBNkIsQ0FBQyxXQUFXO1lBQ2xELGdCQUFnQixFQUFFLENBQUM7b0JBQ2pCLE1BQU0sRUFBRSxPQUFPO29CQUNmLE1BQU0sRUFBRSxjQUFjO29CQUN0QixRQUFRLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUM7aUJBQ3BDLENBQUM7U0FDSCxDQUFDLENBQUM7UUFDSCxJQUFJLHFCQUFjLENBQUMsSUFBSSxFQUFFLDBCQUEwQixFQUFFO1lBQ25ELFlBQVksRUFBRSx5QkFBeUI7WUFDdkMsWUFBWTtZQUNaLFVBQVUsRUFBRTtnQkFDVixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7YUFDOUI7U0FDRixDQUFDLENBQUM7S0FDSjtDQUNGO0FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFHLEVBQUUsQ0FBQztBQUV0QixJQUFJLHVCQUFTLENBQUMsR0FBRyxFQUFFLHlDQUF5QyxFQUFFO0lBQzVELFNBQVMsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDO0NBQ3JFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBBcHAsIEN1c3RvbVJlc291cmNlLCBDdXN0b21SZXNvdXJjZVByb3ZpZGVyLCBDdXN0b21SZXNvdXJjZVByb3ZpZGVyUnVudGltZSwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEludGVnVGVzdCB9IGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnLi4vbGliJztcblxuY29uc3QgUFVUX09CSkVDVFNfUkVTT1VSQ0VfVFlQRSA9ICdDdXN0b206OlMzUHV0T2JqZWN0cyc7XG5cbmNsYXNzIFRlc3RTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdCdWNrZXQnLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIFB1dCBvYmplY3RzIGluIHRoZSBidWNrZXQgdG8gZW5zdXJlIGF1dG8gZGVsZXRlIHdvcmtzIGFzIGV4cGVjdGVkXG4gICAgY29uc3Qgc2VydmljZVRva2VuID0gQ3VzdG9tUmVzb3VyY2VQcm92aWRlci5nZXRPckNyZWF0ZSh0aGlzLCBQVVRfT0JKRUNUU19SRVNPVVJDRV9UWVBFLCB7XG4gICAgICBjb2RlRGlyZWN0b3J5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAncHV0LW9iamVjdHMtaGFuZGxlcicpLFxuICAgICAgcnVudGltZTogQ3VzdG9tUmVzb3VyY2VQcm92aWRlclJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBwb2xpY3lTdGF0ZW1lbnRzOiBbe1xuICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgIEFjdGlvbjogJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgIFJlc291cmNlOiBidWNrZXQuYXJuRm9yT2JqZWN0cygnKicpLFxuICAgICAgfV0sXG4gICAgfSk7XG4gICAgbmV3IEN1c3RvbVJlc291cmNlKHRoaXMsICdQdXRPYmplY3RzQ3VzdG9tUmVzb3VyY2UnLCB7XG4gICAgICByZXNvdXJjZVR5cGU6IFBVVF9PQkpFQ1RTX1JFU09VUkNFX1RZUEUsXG4gICAgICBzZXJ2aWNlVG9rZW4sXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIEJ1Y2tldE5hbWU6IGJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBhcHAgPSBuZXcgQXBwKCk7XG5cbm5ldyBJbnRlZ1Rlc3QoYXBwLCAnY2RrLWludGVnLXMzLWJ1Y2tldC1hdXRvLWRlbGV0ZS1vYmplY3RzJywge1xuICB0ZXN0Q2FzZXM6IFtuZXcgVGVzdFN0YWNrKGFwcCwgJ2Nkay1zMy1idWNrZXQtYXV0by1kZWxldGUtb2JqZWN0cycpXSxcbn0pO1xuIl19