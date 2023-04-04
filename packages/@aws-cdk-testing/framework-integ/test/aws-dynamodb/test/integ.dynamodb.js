"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iam = require("aws-cdk-lib/aws-iam");
const kms = require("aws-cdk-lib/aws-kms");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_dynamodb_1 = require("aws-cdk-lib/aws-dynamodb");
// CDK parameters
const STACK_NAME = 'aws-cdk-dynamodb';
// DynamoDB table parameters
const TABLE = 'Table';
const TABLE_WITH_CMK = 'TableWithCustomerManagedKey';
const TABLE_WITH_GLOBAL_AND_LOCAL_SECONDARY_INDEX = 'TableWithGlobalAndLocalSecondaryIndex';
const TABLE_WITH_GLOBAL_SECONDARY_INDEX = 'TableWithGlobalSecondaryIndex';
const TABLE_WITH_LOCAL_SECONDARY_INDEX = 'TableWithLocalSecondaryIndex';
const TABLE_PARTITION_KEY = { name: 'hashKey', type: aws_dynamodb_1.AttributeType.STRING };
const TABLE_SORT_KEY = { name: 'sortKey', type: aws_dynamodb_1.AttributeType.NUMBER };
// DynamoDB global secondary index parameters
const GSI_TEST_CASE_1 = 'GSI-PartitionKeyOnly';
const GSI_TEST_CASE_2 = 'GSI-PartitionAndSortKeyWithReadAndWriteCapacity';
const GSI_TEST_CASE_3 = 'GSI-ProjectionTypeKeysOnly';
const GSI_TEST_CASE_4 = 'GSI-ProjectionTypeInclude';
const GSI_TEST_CASE_5 = 'GSI-InverseTableKeySchema';
const GSI_PARTITION_KEY = { name: 'gsiHashKey', type: aws_dynamodb_1.AttributeType.STRING };
const GSI_SORT_KEY = { name: 'gsiSortKey', type: aws_dynamodb_1.AttributeType.NUMBER };
const GSI_NON_KEY = [];
for (let i = 0; i < 10; i++) { // 'A' to 'J'
    GSI_NON_KEY.push(String.fromCharCode(65 + i));
}
// DynamoDB local secondary index parameters
const LSI_TEST_CASE_1 = 'LSI-PartitionAndSortKey';
const LSI_TEST_CASE_2 = 'LSI-PartitionAndTableSortKey';
const LSI_TEST_CASE_3 = 'LSI-ProjectionTypeKeysOnly';
const LSI_TEST_CASE_4 = 'LSI-ProjectionTypeInclude';
const LSI_SORT_KEY = { name: 'lsiSortKey', type: aws_dynamodb_1.AttributeType.NUMBER };
const LSI_NON_KEY = [];
for (let i = 0; i < 10; i++) { // 'K' to 'T'
    LSI_NON_KEY.push(String.fromCharCode(75 + i));
}
const app = new aws_cdk_lib_1.App();
const stack = new aws_cdk_lib_1.Stack(app, STACK_NAME);
const table = new aws_dynamodb_1.Table(stack, TABLE, {
    partitionKey: TABLE_PARTITION_KEY,
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
});
const tableWithGlobalAndLocalSecondaryIndex = new aws_dynamodb_1.Table(stack, TABLE_WITH_GLOBAL_AND_LOCAL_SECONDARY_INDEX, {
    pointInTimeRecovery: true,
    encryption: aws_dynamodb_1.TableEncryption.AWS_MANAGED,
    stream: aws_dynamodb_1.StreamViewType.KEYS_ONLY,
    timeToLiveAttribute: 'timeToLive',
    partitionKey: TABLE_PARTITION_KEY,
    sortKey: TABLE_SORT_KEY,
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
});
aws_cdk_lib_1.Tags.of(tableWithGlobalAndLocalSecondaryIndex).add('Environment', 'Production');
tableWithGlobalAndLocalSecondaryIndex.addGlobalSecondaryIndex({
    indexName: GSI_TEST_CASE_1,
    partitionKey: GSI_PARTITION_KEY,
});
tableWithGlobalAndLocalSecondaryIndex.addGlobalSecondaryIndex({
    indexName: GSI_TEST_CASE_2,
    partitionKey: GSI_PARTITION_KEY,
    sortKey: GSI_SORT_KEY,
    readCapacity: 10,
    writeCapacity: 10,
});
tableWithGlobalAndLocalSecondaryIndex.addGlobalSecondaryIndex({
    indexName: GSI_TEST_CASE_3,
    partitionKey: GSI_PARTITION_KEY,
    sortKey: GSI_SORT_KEY,
    projectionType: aws_dynamodb_1.ProjectionType.KEYS_ONLY,
});
tableWithGlobalAndLocalSecondaryIndex.addGlobalSecondaryIndex({
    indexName: GSI_TEST_CASE_4,
    partitionKey: GSI_PARTITION_KEY,
    sortKey: GSI_SORT_KEY,
    projectionType: aws_dynamodb_1.ProjectionType.INCLUDE,
    nonKeyAttributes: GSI_NON_KEY,
});
tableWithGlobalAndLocalSecondaryIndex.addGlobalSecondaryIndex({
    indexName: GSI_TEST_CASE_5,
    partitionKey: TABLE_SORT_KEY,
    sortKey: TABLE_PARTITION_KEY,
});
tableWithGlobalAndLocalSecondaryIndex.addLocalSecondaryIndex({
    indexName: LSI_TEST_CASE_2,
    sortKey: LSI_SORT_KEY,
});
tableWithGlobalAndLocalSecondaryIndex.addLocalSecondaryIndex({
    indexName: LSI_TEST_CASE_1,
    sortKey: TABLE_SORT_KEY,
});
tableWithGlobalAndLocalSecondaryIndex.addLocalSecondaryIndex({
    indexName: LSI_TEST_CASE_3,
    sortKey: LSI_SORT_KEY,
    projectionType: aws_dynamodb_1.ProjectionType.KEYS_ONLY,
});
tableWithGlobalAndLocalSecondaryIndex.addLocalSecondaryIndex({
    indexName: LSI_TEST_CASE_4,
    sortKey: LSI_SORT_KEY,
    projectionType: aws_dynamodb_1.ProjectionType.INCLUDE,
    nonKeyAttributes: LSI_NON_KEY,
});
const tableWithGlobalSecondaryIndex = new aws_dynamodb_1.Table(stack, TABLE_WITH_GLOBAL_SECONDARY_INDEX, {
    partitionKey: TABLE_PARTITION_KEY,
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
});
tableWithGlobalSecondaryIndex.addGlobalSecondaryIndex({
    indexName: GSI_TEST_CASE_1,
    partitionKey: GSI_PARTITION_KEY,
});
const tableWithLocalSecondaryIndex = new aws_dynamodb_1.Table(stack, TABLE_WITH_LOCAL_SECONDARY_INDEX, {
    partitionKey: TABLE_PARTITION_KEY,
    sortKey: TABLE_SORT_KEY,
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
});
tableWithLocalSecondaryIndex.addLocalSecondaryIndex({
    indexName: LSI_TEST_CASE_1,
    sortKey: LSI_SORT_KEY,
});
const encryptionKey = new kms.Key(stack, 'Key', {
    enableKeyRotation: true,
});
const tableWithCMK = new aws_dynamodb_1.Table(stack, TABLE_WITH_CMK, {
    partitionKey: TABLE_PARTITION_KEY,
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
    stream: aws_dynamodb_1.StreamViewType.NEW_AND_OLD_IMAGES,
    encryptionKey: encryptionKey,
});
const role = new iam.Role(stack, 'Role', {
    assumedBy: new iam.ServicePrincipal('sqs.amazonaws.com'),
});
tableWithCMK.grantStreamRead(role);
const user = new iam.User(stack, 'User');
table.grantReadData(user);
tableWithGlobalAndLocalSecondaryIndex.grantReadData(user);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZHluYW1vZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy5keW5hbW9kYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsNkNBQThEO0FBQzlELDJEQUE0SDtBQUU1SCxpQkFBaUI7QUFDakIsTUFBTSxVQUFVLEdBQUcsa0JBQWtCLENBQUM7QUFFdEMsNEJBQTRCO0FBQzVCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUN0QixNQUFNLGNBQWMsR0FBRyw2QkFBNkIsQ0FBQztBQUNyRCxNQUFNLDJDQUEyQyxHQUFHLHVDQUF1QyxDQUFDO0FBQzVGLE1BQU0saUNBQWlDLEdBQUcsK0JBQStCLENBQUM7QUFDMUUsTUFBTSxnQ0FBZ0MsR0FBRyw4QkFBOEIsQ0FBQztBQUN4RSxNQUFNLG1CQUFtQixHQUFjLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsNEJBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN2RixNQUFNLGNBQWMsR0FBYyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLDRCQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFbEYsNkNBQTZDO0FBQzdDLE1BQU0sZUFBZSxHQUFHLHNCQUFzQixDQUFDO0FBQy9DLE1BQU0sZUFBZSxHQUFHLGlEQUFpRCxDQUFDO0FBQzFFLE1BQU0sZUFBZSxHQUFHLDRCQUE0QixDQUFDO0FBQ3JELE1BQU0sZUFBZSxHQUFHLDJCQUEyQixDQUFDO0FBQ3BELE1BQU0sZUFBZSxHQUFHLDJCQUEyQixDQUFDO0FBQ3BELE1BQU0saUJBQWlCLEdBQWMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSw0QkFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3hGLE1BQU0sWUFBWSxHQUFjLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsNEJBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FB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QWU7SUFDMUIsT0FBTyxFQUFFLFlBQVk7Q0FDdEIsQ0FBQyxDQUFDO0FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7SUFDOUMsaUJBQWlCLEVBQUUsSUFBSTtDQUN4QixDQUFDLENBQUM7QUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFLLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRTtJQUNwRCxZQUFZLEVBQUUsbUJBQW1CO0lBQ2pDLGFBQWEsRUFBRSwyQkFBYSxDQUFDLE9BQU87SUFDcEMsTUFBTSxFQUFFLDZCQUFjLENBQUMsa0JBQWtCO0lBQ3pDLGFBQWEsRUFBRSxhQUFhO0NBQzdCLENBQUMsQ0FBQztBQUVILE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFO0lBQ3ZDLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQztDQUN6RCxDQUFDLENBQUM7QUFDSCxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRW5DLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDekMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQixxQ0FBcUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFMUQsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0IHsgQXBwLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgVGFncyB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEF0dHJpYnV0ZSwgQXR0cmlidXRlVHlwZSwgUHJvamVjdGlvblR5cGUsIFN0cmVhbVZpZXdUeXBlLCBUYWJsZSwgVGFibGVFbmNyeXB0aW9uIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcblxuLy8gQ0RLIHBhcmFtZXRlcnNcbmNvbnN0IFNUQUNLX05BTUUgPSAnYXdzLWNkay1keW5hbW9kYic7XG5cbi8vIER5bmFtb0RCIHRhYmxlIHBhcmFtZXRlcnNcbmNvbnN0IFRBQkxFID0gJ1RhYmxlJztcbmNvbnN0IFRBQkxFX1dJVEhfQ01LID0gJ1RhYmxlV2l0aEN1c3RvbWVyTWFuYWdlZEtleSc7XG5jb25zdCBUQUJMRV9XSVRIX0dMT0JBTF9BTkRfTE9DQUxfU0VDT05EQVJZX0lOREVYID0gJ1RhYmxlV2l0aEdsb2JhbEFuZExvY2FsU2Vjb25kYXJ5SW5kZXgnO1xuY29uc3QgVEFCTEVfV0lUSF9HTE9CQUxfU0VDT05EQVJZX0lOREVYID0gJ1RhYmxlV2l0aEdsb2JhbFNlY29uZGFyeUluZGV4JztcbmNvbnN0IFRBQkxFX1dJVEhfTE9DQUxfU0VDT05EQVJZX0lOREVYID0gJ1RhYmxlV2l0aExvY2FsU2Vjb25kYXJ5SW5kZXgnO1xuY29uc3QgVEFCTEVfUEFSVElUSU9OX0tFWTogQXR0cmlidXRlID0geyBuYW1lOiAnaGFzaEtleScsIHR5cGU6IEF0dHJpYnV0ZVR5cGUuU1RSSU5HIH07XG5jb25zdCBUQUJMRV9TT1JUX0tFWTogQXR0cmlidXRlID0geyBuYW1lOiAnc29ydEtleScsIHR5cGU6IEF0dHJpYnV0ZVR5cGUuTlVNQkVSIH07XG5cbi8vIER5bmFtb0RCIGdsb2JhbCBzZWNvbmRhcnkgaW5kZXggcGFyYW1ldGVyc1xuY29uc3QgR1NJX1RFU1RfQ0FTRV8xID0gJ0dTSS1QYXJ0aXRpb25LZXlPbmx5JztcbmNvbnN0IEdTSV9URVNUX0NBU0VfMiA9ICdHU0ktUGFydGl0aW9uQW5kU29ydEtleVdpdGhSZWFkQW5kV3JpdGVDYXBhY2l0eSc7XG5jb25zdCBHU0lfVEVTVF9DQVNFXzMgPSAnR1NJLVByb2plY3Rpb25UeXBlS2V5c09ubHknO1xuY29uc3QgR1NJX1RFU1RfQ0FTRV80ID0gJ0dTSS1Qcm9qZWN0aW9uVHlwZUluY2x1ZGUnO1xuY29uc3QgR1NJX1RFU1RfQ0FTRV81ID0gJ0dTSS1JbnZlcnNlVGFibGVLZXlTY2hlbWEnO1xuY29uc3QgR1NJX1BBUlRJVElPTl9LRVk6IEF0dHJpYnV0ZSA9IHsgbmFtZTogJ2dzaUhhc2hLZXknLCB0eXBlOiBBdHRyaWJ1dGVUeXBlLlNUUklORyB9O1xuY29uc3QgR1NJX1NPUlRfS0VZOiBBdHRyaWJ1dGUgPSB7IG5hbWU6ICdnc2lTb3J0S2V5JywgdHlwZTogQXR0cmlidXRlVHlwZS5OVU1CRVIgfTtcbmNvbnN0IEdTSV9OT05fS0VZOiBzdHJpbmdbXSA9IFtdO1xuZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7IC8vICdBJyB0byAnSidcbiAgR1NJX05PTl9LRVkucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgaSkpO1xufVxuXG4vLyBEeW5hbW9EQiBsb2NhbCBzZWNvbmRhcnkgaW5kZXggcGFyYW1ldGVyc1xuY29uc3QgTFNJX1RFU1RfQ0FTRV8xID0gJ0xTSS1QYXJ0aXRpb25BbmRTb3J0S2V5JztcbmNvbnN0IExTSV9URVNUX0NBU0VfMiA9ICdMU0ktUGFydGl0aW9uQW5kVGFibGVTb3J0S2V5JztcbmNvbnN0IExTSV9URVNUX0NBU0VfMyA9ICdMU0ktUHJvamVjdGlvblR5cGVLZXlzT25seSc7XG5jb25zdCBMU0lfVEVTVF9DQVNFXzQgPSAnTFNJLVByb2plY3Rpb25UeXBlSW5jbHVkZSc7XG5jb25zdCBMU0lfU09SVF9LRVk6IEF0dHJpYnV0ZSA9IHsgbmFtZTogJ2xzaVNvcnRLZXknLCB0eXBlOiBBdHRyaWJ1dGVUeXBlLk5VTUJFUiB9O1xuY29uc3QgTFNJX05PTl9LRVk6IHN0cmluZ1tdID0gW107XG5mb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHsgLy8gJ0snIHRvICdUJ1xuICBMU0lfTk9OX0tFWS5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoNzUgKyBpKSk7XG59XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcblxuY29uc3Qgc3RhY2sgPSBuZXcgU3RhY2soYXBwLCBTVEFDS19OQU1FKTtcblxuY29uc3QgdGFibGUgPSBuZXcgVGFibGUoc3RhY2ssIFRBQkxFLCB7XG4gIHBhcnRpdGlvbktleTogVEFCTEVfUEFSVElUSU9OX0tFWSxcbiAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxufSk7XG5cbmNvbnN0IHRhYmxlV2l0aEdsb2JhbEFuZExvY2FsU2Vjb25kYXJ5SW5kZXggPSBuZXcgVGFibGUoc3RhY2ssIFRBQkxFX1dJVEhfR0xPQkFMX0FORF9MT0NBTF9TRUNPTkRBUllfSU5ERVgsIHtcbiAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcbiAgZW5jcnlwdGlvbjogVGFibGVFbmNyeXB0aW9uLkFXU19NQU5BR0VELFxuICBzdHJlYW06IFN0cmVhbVZpZXdUeXBlLktFWVNfT05MWSxcbiAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3RpbWVUb0xpdmUnLFxuICBwYXJ0aXRpb25LZXk6IFRBQkxFX1BBUlRJVElPTl9LRVksXG4gIHNvcnRLZXk6IFRBQkxFX1NPUlRfS0VZLFxuICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG59KTtcblxuVGFncy5vZih0YWJsZVdpdGhHbG9iYWxBbmRMb2NhbFNlY29uZGFyeUluZGV4KS5hZGQoJ0Vudmlyb25tZW50JywgJ1Byb2R1Y3Rpb24nKTtcbnRhYmxlV2l0aEdsb2JhbEFuZExvY2FsU2Vjb25kYXJ5SW5kZXguYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICBpbmRleE5hbWU6IEdTSV9URVNUX0NBU0VfMSxcbiAgcGFydGl0aW9uS2V5OiBHU0lfUEFSVElUSU9OX0tFWSxcbn0pO1xudGFibGVXaXRoR2xvYmFsQW5kTG9jYWxTZWNvbmRhcnlJbmRleC5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gIGluZGV4TmFtZTogR1NJX1RFU1RfQ0FTRV8yLFxuICBwYXJ0aXRpb25LZXk6IEdTSV9QQVJUSVRJT05fS0VZLFxuICBzb3J0S2V5OiBHU0lfU09SVF9LRVksXG4gIHJlYWRDYXBhY2l0eTogMTAsXG4gIHdyaXRlQ2FwYWNpdHk6IDEwLFxufSk7XG50YWJsZVdpdGhHbG9iYWxBbmRMb2NhbFNlY29uZGFyeUluZGV4LmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgaW5kZXhOYW1lOiBHU0lfVEVTVF9DQVNFXzMsXG4gIHBhcnRpdGlvbktleTogR1NJX1BBUlRJVElPTl9LRVksXG4gIHNvcnRLZXk6IEdTSV9TT1JUX0tFWSxcbiAgcHJvamVjdGlvblR5cGU6IFByb2plY3Rpb25UeXBlLktFWVNfT05MWSxcbn0pO1xudGFibGVXaXRoR2xvYmFsQW5kTG9jYWxTZWNvbmRhcnlJbmRleC5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gIGluZGV4TmFtZTogR1NJX1RFU1RfQ0FTRV80LFxuICBwYXJ0aXRpb25LZXk6IEdTSV9QQVJUSVRJT05fS0VZLFxuICBzb3J0S2V5OiBHU0lfU09SVF9LRVksXG4gIHByb2plY3Rpb25UeXBlOiBQcm9qZWN0aW9uVHlwZS5JTkNMVURFLFxuICBub25LZXlBdHRyaWJ1dGVzOiBHU0lfTk9OX0tFWSxcbn0pO1xudGFibGVXaXRoR2xvYmFsQW5kTG9jYWxTZWNvbmRhcnlJbmRleC5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gIGluZGV4TmFtZTogR1NJX1RFU1RfQ0FTRV81LFxuICBwYXJ0aXRpb25LZXk6IFRBQkxFX1NPUlRfS0VZLFxuICBzb3J0S2V5OiBUQUJMRV9QQVJUSVRJT05fS0VZLFxufSk7XG5cbnRhYmxlV2l0aEdsb2JhbEFuZExvY2FsU2Vjb25kYXJ5SW5kZXguYWRkTG9jYWxTZWNvbmRhcnlJbmRleCh7XG4gIGluZGV4TmFtZTogTFNJX1RFU1RfQ0FTRV8yLFxuICBzb3J0S2V5OiBMU0lfU09SVF9LRVksXG59KTtcbnRhYmxlV2l0aEdsb2JhbEFuZExvY2FsU2Vjb25kYXJ5SW5kZXguYWRkTG9jYWxTZWNvbmRhcnlJbmRleCh7XG4gIGluZGV4TmFtZTogTFNJX1RFU1RfQ0FTRV8xLFxuICBzb3J0S2V5OiBUQUJMRV9TT1JUX0tFWSxcbn0pO1xudGFibGVXaXRoR2xvYmFsQW5kTG9jYWxTZWNvbmRhcnlJbmRleC5hZGRMb2NhbFNlY29uZGFyeUluZGV4KHtcbiAgaW5kZXhOYW1lOiBMU0lfVEVTVF9DQVNFXzMsXG4gIHNvcnRLZXk6IExTSV9TT1JUX0tFWSxcbiAgcHJvamVjdGlvblR5cGU6IFByb2plY3Rpb25UeXBlLktFWVNfT05MWSxcbn0pO1xudGFibGVXaXRoR2xvYmFsQW5kTG9jYWxTZWNvbmRhcnlJbmRleC5hZGRMb2NhbFNlY29uZGFyeUluZGV4KHtcbiAgaW5kZXhOYW1lOiBMU0lfVEVTVF9DQVNFXzQsXG4gIHNvcnRLZXk6IExTSV9TT1JUX0tFWSxcbiAgcHJvamVjdGlvblR5cGU6IFByb2plY3Rpb25UeXBlLklOQ0xVREUsXG4gIG5vbktleUF0dHJpYnV0ZXM6IExTSV9OT05fS0VZLFxufSk7XG5cbmNvbnN0IHRhYmxlV2l0aEdsb2JhbFNlY29uZGFyeUluZGV4ID0gbmV3IFRhYmxlKHN0YWNrLCBUQUJMRV9XSVRIX0dMT0JBTF9TRUNPTkRBUllfSU5ERVgsIHtcbiAgcGFydGl0aW9uS2V5OiBUQUJMRV9QQVJUSVRJT05fS0VZLFxuICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXG59KTtcbnRhYmxlV2l0aEdsb2JhbFNlY29uZGFyeUluZGV4LmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgaW5kZXhOYW1lOiBHU0lfVEVTVF9DQVNFXzEsXG4gIHBhcnRpdGlvbktleTogR1NJX1BBUlRJVElPTl9LRVksXG59KTtcblxuY29uc3QgdGFibGVXaXRoTG9jYWxTZWNvbmRhcnlJbmRleCA9IG5ldyBUYWJsZShzdGFjaywgVEFCTEVfV0lUSF9MT0NBTF9TRUNPTkRBUllfSU5ERVgsIHtcbiAgcGFydGl0aW9uS2V5OiBUQUJMRV9QQVJUSVRJT05fS0VZLFxuICBzb3J0S2V5OiBUQUJMRV9TT1JUX0tFWSxcbiAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxufSk7XG5cbnRhYmxlV2l0aExvY2FsU2Vjb25kYXJ5SW5kZXguYWRkTG9jYWxTZWNvbmRhcnlJbmRleCh7XG4gIGluZGV4TmFtZTogTFNJX1RFU1RfQ0FTRV8xLFxuICBzb3J0S2V5OiBMU0lfU09SVF9LRVksXG59KTtcblxuY29uc3QgZW5jcnlwdGlvbktleSA9IG5ldyBrbXMuS2V5KHN0YWNrLCAnS2V5Jywge1xuICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbn0pO1xuXG5jb25zdCB0YWJsZVdpdGhDTUsgPSBuZXcgVGFibGUoc3RhY2ssIFRBQkxFX1dJVEhfQ01LLCB7XG4gIHBhcnRpdGlvbktleTogVEFCTEVfUEFSVElUSU9OX0tFWSxcbiAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICBzdHJlYW06IFN0cmVhbVZpZXdUeXBlLk5FV19BTkRfT0xEX0lNQUdFUyxcbiAgZW5jcnlwdGlvbktleTogZW5jcnlwdGlvbktleSxcbn0pO1xuXG5jb25zdCByb2xlID0gbmV3IGlhbS5Sb2xlKHN0YWNrLCAnUm9sZScsIHtcbiAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ3Nxcy5hbWF6b25hd3MuY29tJyksXG59KTtcbnRhYmxlV2l0aENNSy5ncmFudFN0cmVhbVJlYWQocm9sZSk7XG5cbmNvbnN0IHVzZXIgPSBuZXcgaWFtLlVzZXIoc3RhY2ssICdVc2VyJyk7XG50YWJsZS5ncmFudFJlYWREYXRhKHVzZXIpO1xudGFibGVXaXRoR2xvYmFsQW5kTG9jYWxTZWNvbmRhcnlJbmRleC5ncmFudFJlYWREYXRhKHVzZXIpO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==