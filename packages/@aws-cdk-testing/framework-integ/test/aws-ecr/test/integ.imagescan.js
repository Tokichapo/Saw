"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const ecr = require("aws-cdk-lib/aws-ecr");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-ecr-integ-stack');
const repo = new ecr.Repository(stack, 'Repo', {
    imageScanOnPush: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
});
repo.onImageScanCompleted('ImageScanComplete');
new cdk.CfnOutput(stack, 'RepositoryURI', {
    value: repo.repositoryUri,
});
new integ_tests_alpha_1.IntegTest(app, 'cdk-integ-ecr-image-scan', {
    testCases: [stack],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuaW1hZ2VzY2FuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuaW1hZ2VzY2FuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQW1DO0FBQ25DLGtFQUF1RDtBQUN2RCwyQ0FBMkM7QUFFM0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0FBRXhELE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFO0lBQzdDLGVBQWUsRUFBRSxJQUFJO0lBQ3JCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87Q0FDekMsQ0FBQyxDQUFDO0FBRUgsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFFL0MsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUU7SUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhO0NBQzFCLENBQUMsQ0FBQztBQUVILElBQUksNkJBQVMsQ0FBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUU7SUFDN0MsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDO0NBQ25CLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBJbnRlZ1Rlc3QgfSBmcm9tICdAYXdzLWNkay9pbnRlZy10ZXN0cy1hbHBoYSc7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcic7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnYXdzLWVjci1pbnRlZy1zdGFjaycpO1xuXG5jb25zdCByZXBvID0gbmV3IGVjci5SZXBvc2l0b3J5KHN0YWNrLCAnUmVwbycsIHtcbiAgaW1hZ2VTY2FuT25QdXNoOiB0cnVlLFxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxufSk7XG5cbnJlcG8ub25JbWFnZVNjYW5Db21wbGV0ZWQoJ0ltYWdlU2NhbkNvbXBsZXRlJyk7XG5cbm5ldyBjZGsuQ2ZuT3V0cHV0KHN0YWNrLCAnUmVwb3NpdG9yeVVSSScsIHtcbiAgdmFsdWU6IHJlcG8ucmVwb3NpdG9yeVVyaSxcbn0pO1xuXG5uZXcgSW50ZWdUZXN0KGFwcCwgJ2Nkay1pbnRlZy1lY3ItaW1hZ2Utc2NhbicsIHtcbiAgdGVzdENhc2VzOiBbc3RhY2tdLFxufSk7XG4iXX0=