import { UserPool } from '@aws-cdk/aws-cognito';
import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';
import { App, RemovalPolicy, Stack } from '@aws-cdk/core';
import { join } from 'path';
import { GraphQLApi, KeyCondition, MappingTemplate, PrimaryKey, UserPoolDefaultAction, Values, TypeName } from '../lib';

const app = new App();
const stack = new Stack(app, 'aws-appsync-integ');

const userPool = new UserPool(stack, 'Pool', {
  userPoolName: 'myPool',
});

const api = new GraphQLApi(stack, 'Api', {
  name: 'demoapi',
  schemaDefinitionFile: join(__dirname, 'schema.graphql'),
  authorizationConfig: {
    defaultAuthorization: {
      userPool,
      defaultAction: UserPoolDefaultAction.ALLOW,
    },
    additionalAuthorizationModes: [
      {
        apiKeyDesc: 'My API Key',
        // Can't specify a date because it will inevitably be in the past.
        // expires: '2019-02-05T12:00:00Z',
      },
    ],
  },
});

const noneDS = api.addNoneDataSource('None', 'Dummy data source');

noneDS.createResolver({
  typeName: TypeName.QUERY,
  fieldName: 'getServiceVersion',
  requestMappingTemplate: MappingTemplate.fromString(JSON.stringify({
    version: '2017-02-28',
  })),
  responseMappingTemplate: MappingTemplate.fromString(JSON.stringify({
    version: 'v1',
  })),
});

const customerTable = new Table(stack, 'CustomerTable', {
  billingMode: BillingMode.PAY_PER_REQUEST,
  partitionKey: {
    name: 'id',
    type: AttributeType.STRING,
  },
  removalPolicy: RemovalPolicy.DESTROY,
});
const orderTable = new Table(stack, 'OrderTable', {
  billingMode: BillingMode.PAY_PER_REQUEST,
  partitionKey: {
    name: 'customer',
    type: AttributeType.STRING,
  },
  sortKey: {
    name: 'order',
    type: AttributeType.STRING,
  },
  removalPolicy: RemovalPolicy.DESTROY,
});

const customerDS = api.addDynamoDbDataSource('Customer', 'The customer data source', customerTable);
const orderDS = api.addDynamoDbDataSource('Order', 'The order data source', orderTable);

customerDS.createResolver({
  typeName: TypeName.QUERY,
  fieldName: 'getCustomers',
  requestMappingTemplate: MappingTemplate.dynamoDbScanTable(),
  responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
});
customerDS.createResolver({
  typeName: TypeName.QUERY,
  fieldName: 'getCustomer',
  requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
  responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
});
customerDS.createResolver({
  typeName: TypeName.MUTATION,
  fieldName: 'addCustomer',
  requestMappingTemplate: MappingTemplate.dynamoDbPutItem(PrimaryKey.partition('id').auto(), Values.projecting('customer')),
  responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
});
customerDS.createResolver({
  typeName: TypeName.MUTATION,
  fieldName: 'saveCustomer',
  requestMappingTemplate: MappingTemplate.dynamoDbPutItem(PrimaryKey.partition('id').is('id'), Values.projecting('customer')),
  responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
});
customerDS.createResolver({
  typeName: TypeName.MUTATION,
  fieldName: 'saveCustomerWithFirstOrder',
  requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
    PrimaryKey
      .partition('order').auto()
      .sort('customer').is('customer.id'),
    Values
      .projecting('order')
      .attribute('referral').is('referral')),
  responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
});
customerDS.createResolver({
  typeName: TypeName.MUTATION,
  fieldName: 'removeCustomer',
  requestMappingTemplate: MappingTemplate.dynamoDbDeleteItem('id', 'id'),
  responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
});

const ops = [
  { suffix: 'Eq', op: KeyCondition.eq},
  { suffix: 'Lt', op: KeyCondition.lt},
  { suffix: 'Le', op: KeyCondition.le},
  { suffix: 'Gt', op: KeyCondition.gt},
  { suffix: 'Ge', op: KeyCondition.ge},
];
for (const {suffix, op} of ops) {
  orderDS.createResolver({
    typeName: TypeName.QUERY,
    fieldName: 'getCustomerOrders' + suffix,
    requestMappingTemplate: MappingTemplate.dynamoDbQuery(op('customer', 'customer')),
    responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
  });
}
orderDS.createResolver({
  typeName: TypeName.QUERY,
  fieldName: 'getCustomerOrdersFilter',
  requestMappingTemplate: MappingTemplate.dynamoDbQuery(
    KeyCondition.eq('customer', 'customer').and(KeyCondition.beginsWith('order', 'order'))),
  responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
});
orderDS.createResolver({
  typeName: TypeName.QUERY,
  fieldName: 'getCustomerOrdersBetween',
  requestMappingTemplate: MappingTemplate.dynamoDbQuery(
    KeyCondition.eq('customer', 'customer').and(KeyCondition.between('order', 'order1', 'order2'))),
  responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
});

app.synth();