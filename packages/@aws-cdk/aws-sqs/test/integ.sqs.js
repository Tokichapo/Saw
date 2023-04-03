"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_kms_1 = require("@aws-cdk/aws-kms");
const core_1 = require("@aws-cdk/core");
const integ = require("@aws-cdk/integ-tests");
const lib_1 = require("../lib");
const app = new core_1.App();
const stack = new core_1.Stack(app, 'aws-cdk-sqs');
const dlq = new lib_1.Queue(stack, 'DeadLetterQueue');
const queue = new lib_1.Queue(stack, 'Queue', {
    deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
    encryption: lib_1.QueueEncryption.KMS_MANAGED,
});
const fifo = new lib_1.Queue(stack, 'FifoQueue', {
    fifo: true,
    encryptionMasterKey: new aws_kms_1.Key(stack, 'EncryptionKey', { removalPolicy: core_1.RemovalPolicy.DESTROY }),
});
const highThroughputFifo = new lib_1.Queue(stack, 'HighThroughputFifoQueue', {
    fifo: true,
    fifoThroughputLimit: lib_1.FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
    deduplicationScope: lib_1.DeduplicationScope.MESSAGE_GROUP,
});
const sqsManagedEncryptedQueue = new lib_1.Queue(stack, 'SqsManagedEncryptedQueue', {
    encryption: lib_1.QueueEncryption.SQS_MANAGED,
});
const unencryptedQueue = new lib_1.Queue(stack, 'UnencryptedQueue', {
    encryption: lib_1.QueueEncryption.UNENCRYPTED,
});
const ssl = new lib_1.Queue(stack, 'SSLQueue', { enforceSSL: true });
const role = new aws_iam_1.Role(stack, 'Role', {
    assumedBy: new aws_iam_1.AccountRootPrincipal(),
});
dlq.grantConsumeMessages(role);
queue.grantConsumeMessages(role);
fifo.grantConsumeMessages(role);
highThroughputFifo.grantConsumeMessages(role);
sqsManagedEncryptedQueue.grantConsumeMessages(role);
unencryptedQueue.grantConsumeMessages(role);
ssl.grantConsumeMessages(role);
new core_1.CfnOutput(stack, 'QueueUrl', { value: queue.queueUrl });
new integ.IntegTest(app, 'SqsTest', {
    testCases: [stack],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuc3FzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuc3FzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsOENBQThEO0FBQzlELDhDQUF1QztBQUN2Qyx3Q0FBcUU7QUFDckUsOENBQThDO0FBQzlDLGdDQUF5RjtBQUV6RixNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQUcsRUFBRSxDQUFDO0FBRXRCLE1BQU0sS0FBSyxHQUFHLElBQUksWUFBSyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUU1QyxNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQUssQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUNoRCxNQUFNLEtBQUssR0FBRyxJQUFJLFdBQUssQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFO0lBQ3RDLGVBQWUsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLENBQUMsRUFBRTtJQUNuRCxVQUFVLEVBQUUscUJBQWUsQ0FBQyxXQUFXO0NBQ3hDLENBQUMsQ0FBQztBQUNILE1BQU0sSUFBSSxHQUFHLElBQUksV0FBSyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUU7SUFDekMsSUFBSSxFQUFFLElBQUk7SUFDVixtQkFBbUIsRUFBRSxJQUFJLGFBQUcsQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFLEVBQUUsYUFBYSxFQUFFLG9CQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7Q0FDL0YsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLFdBQUssQ0FBQyxLQUFLLEVBQUUseUJBQXlCLEVBQUU7SUFDckUsSUFBSSxFQUFFLElBQUk7SUFDVixtQkFBbUIsRUFBRSx5QkFBbUIsQ0FBQyxvQkFBb0I7SUFDN0Qsa0JBQWtCLEVBQUUsd0JBQWtCLENBQUMsYUFBYTtDQUNyRCxDQUFDLENBQUM7QUFDSCxNQUFNLHdCQUF3QixHQUFHLElBQUksV0FBSyxDQUFDLEtBQUssRUFBRSwwQkFBMEIsRUFBRTtJQUM1RSxVQUFVLEVBQUUscUJBQWUsQ0FBQyxXQUFXO0NBQ3hDLENBQUMsQ0FBQztBQUNILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxXQUFLLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFO0lBQzVELFVBQVUsRUFBRSxxQkFBZSxDQUFDLFdBQVc7Q0FDeEMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxXQUFLLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBRS9ELE1BQU0sSUFBSSxHQUFHLElBQUksY0FBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDbkMsU0FBUyxFQUFFLElBQUksOEJBQW9CLEVBQUU7Q0FDdEMsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9CLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUMsd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEQsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBRS9CLElBQUksZ0JBQVMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBRTVELElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFO0lBQ2xDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQztDQUNuQixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY2NvdW50Um9vdFByaW5jaXBhbCwgUm9sZSB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuaW1wb3J0IHsgS2V5IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWttcyc7XG5pbXBvcnQgeyBBcHAsIENmbk91dHB1dCwgUmVtb3ZhbFBvbGljeSwgU3RhY2sgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGludGVnIGZyb20gJ0Bhd3MtY2RrL2ludGVnLXRlc3RzJztcbmltcG9ydCB7IERlZHVwbGljYXRpb25TY29wZSwgRmlmb1Rocm91Z2hwdXRMaW1pdCwgUXVldWUsIFF1ZXVlRW5jcnlwdGlvbiB9IGZyb20gJy4uL2xpYic7XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcblxuY29uc3Qgc3RhY2sgPSBuZXcgU3RhY2soYXBwLCAnYXdzLWNkay1zcXMnKTtcblxuY29uc3QgZGxxID0gbmV3IFF1ZXVlKHN0YWNrLCAnRGVhZExldHRlclF1ZXVlJyk7XG5jb25zdCBxdWV1ZSA9IG5ldyBRdWV1ZShzdGFjaywgJ1F1ZXVlJywge1xuICBkZWFkTGV0dGVyUXVldWU6IHsgcXVldWU6IGRscSwgbWF4UmVjZWl2ZUNvdW50OiA1IH0sXG4gIGVuY3J5cHRpb246IFF1ZXVlRW5jcnlwdGlvbi5LTVNfTUFOQUdFRCxcbn0pO1xuY29uc3QgZmlmbyA9IG5ldyBRdWV1ZShzdGFjaywgJ0ZpZm9RdWV1ZScsIHtcbiAgZmlmbzogdHJ1ZSxcbiAgZW5jcnlwdGlvbk1hc3RlcktleTogbmV3IEtleShzdGFjaywgJ0VuY3J5cHRpb25LZXknLCB7IHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSB9KSxcbn0pO1xuY29uc3QgaGlnaFRocm91Z2hwdXRGaWZvID0gbmV3IFF1ZXVlKHN0YWNrLCAnSGlnaFRocm91Z2hwdXRGaWZvUXVldWUnLCB7XG4gIGZpZm86IHRydWUsXG4gIGZpZm9UaHJvdWdocHV0TGltaXQ6IEZpZm9UaHJvdWdocHV0TGltaXQuUEVSX01FU1NBR0VfR1JPVVBfSUQsXG4gIGRlZHVwbGljYXRpb25TY29wZTogRGVkdXBsaWNhdGlvblNjb3BlLk1FU1NBR0VfR1JPVVAsXG59KTtcbmNvbnN0IHNxc01hbmFnZWRFbmNyeXB0ZWRRdWV1ZSA9IG5ldyBRdWV1ZShzdGFjaywgJ1Nxc01hbmFnZWRFbmNyeXB0ZWRRdWV1ZScsIHtcbiAgZW5jcnlwdGlvbjogUXVldWVFbmNyeXB0aW9uLlNRU19NQU5BR0VELFxufSk7XG5jb25zdCB1bmVuY3J5cHRlZFF1ZXVlID0gbmV3IFF1ZXVlKHN0YWNrLCAnVW5lbmNyeXB0ZWRRdWV1ZScsIHtcbiAgZW5jcnlwdGlvbjogUXVldWVFbmNyeXB0aW9uLlVORU5DUllQVEVELFxufSk7XG5jb25zdCBzc2wgPSBuZXcgUXVldWUoc3RhY2ssICdTU0xRdWV1ZScsIHsgZW5mb3JjZVNTTDogdHJ1ZSB9KTtcblxuY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHN0YWNrLCAnUm9sZScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgQWNjb3VudFJvb3RQcmluY2lwYWwoKSxcbn0pO1xuXG5kbHEuZ3JhbnRDb25zdW1lTWVzc2FnZXMocm9sZSk7XG5xdWV1ZS5ncmFudENvbnN1bWVNZXNzYWdlcyhyb2xlKTtcbmZpZm8uZ3JhbnRDb25zdW1lTWVzc2FnZXMocm9sZSk7XG5oaWdoVGhyb3VnaHB1dEZpZm8uZ3JhbnRDb25zdW1lTWVzc2FnZXMocm9sZSk7XG5zcXNNYW5hZ2VkRW5jcnlwdGVkUXVldWUuZ3JhbnRDb25zdW1lTWVzc2FnZXMocm9sZSk7XG51bmVuY3J5cHRlZFF1ZXVlLmdyYW50Q29uc3VtZU1lc3NhZ2VzKHJvbGUpO1xuc3NsLmdyYW50Q29uc3VtZU1lc3NhZ2VzKHJvbGUpO1xuXG5uZXcgQ2ZuT3V0cHV0KHN0YWNrLCAnUXVldWVVcmwnLCB7IHZhbHVlOiBxdWV1ZS5xdWV1ZVVybCB9KTtcblxubmV3IGludGVnLkludGVnVGVzdChhcHAsICdTcXNUZXN0Jywge1xuICB0ZXN0Q2FzZXM6IFtzdGFja10sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=