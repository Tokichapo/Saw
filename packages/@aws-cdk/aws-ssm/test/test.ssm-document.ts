import { expect, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/cdk');
import { Test } from 'nodeunit';
import ssm = require('../lib');

export = {
  'association name is rendered properly in L1 construct'(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new ssm.cloudformation.AssociationResource(stack, 'Assoc', {
      documentName: 'document',
    });

    // THEN
    expect(stack).to(haveResource('AWS::SSM::Association', {
      Name: 'document',
    }));

    test.done();
  }
};