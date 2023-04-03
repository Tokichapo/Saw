"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iam = require("aws-cdk-lib/aws-iam");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_kms_1 = require("aws-cdk-lib/aws-kms");
const app = new aws_cdk_lib_1.App();
const stack = new aws_cdk_lib_1.Stack(app, 'aws-cdk-kms-1');
const key = new aws_kms_1.Key(stack, 'MyKey', { removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY });
key.addToResourcePolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: ['kms:encrypt'],
    principals: [new iam.ArnPrincipal(stack.account)],
}));
key.addAlias('alias/bar');
new aws_kms_1.Key(stack, 'AsymmetricKey', {
    keySpec: aws_kms_1.KeySpec.ECC_NIST_P256,
    keyUsage: aws_kms_1.KeyUsage.SIGN_VERIFY,
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcua2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcua2V5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBQzNDLDZDQUF3RDtBQUN4RCxpREFBNkQ7QUFFN0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxFQUFFLENBQUM7QUFFdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxtQkFBSyxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUU5QyxNQUFNLEdBQUcsR0FBRyxJQUFJLGFBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUU5RSxHQUFHLENBQUMsbUJBQW1CLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO0lBQzlDLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNoQixPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUM7SUFDeEIsVUFBVSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztDQUNsRCxDQUFDLENBQUMsQ0FBQztBQUVKLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFMUIsSUFBSSxhQUFHLENBQUMsS0FBSyxFQUFFLGVBQWUsRUFBRTtJQUM5QixPQUFPLEVBQUUsaUJBQU8sQ0FBQyxhQUFhO0lBQzlCLFFBQVEsRUFBRSxrQkFBUSxDQUFDLFdBQVc7SUFDOUIsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztDQUNyQyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBBcHAsIFJlbW92YWxQb2xpY3ksIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgS2V5LCBLZXlTcGVjLCBLZXlVc2FnZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuXG5jb25zdCBhcHAgPSBuZXcgQXBwKCk7XG5cbmNvbnN0IHN0YWNrID0gbmV3IFN0YWNrKGFwcCwgJ2F3cy1jZGsta21zLTEnKTtcblxuY29uc3Qga2V5ID0gbmV3IEtleShzdGFjaywgJ015S2V5JywgeyByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1kgfSk7XG5cbmtleS5hZGRUb1Jlc291cmNlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgcmVzb3VyY2VzOiBbJyonXSxcbiAgYWN0aW9uczogWydrbXM6ZW5jcnlwdCddLFxuICBwcmluY2lwYWxzOiBbbmV3IGlhbS5Bcm5QcmluY2lwYWwoc3RhY2suYWNjb3VudCldLFxufSkpO1xuXG5rZXkuYWRkQWxpYXMoJ2FsaWFzL2JhcicpO1xuXG5uZXcgS2V5KHN0YWNrLCAnQXN5bW1ldHJpY0tleScsIHtcbiAga2V5U3BlYzogS2V5U3BlYy5FQ0NfTklTVF9QMjU2LFxuICBrZXlVc2FnZTogS2V5VXNhZ2UuU0lHTl9WRVJJRlksXG4gIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==