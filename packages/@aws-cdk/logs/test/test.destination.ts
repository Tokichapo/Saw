import { Arn, PolicyStatement, ServicePrincipal, Stack } from '@aws-cdk/cdk';
import { expect, haveResource } from '@aws-cdk/cdk-assert';
import { Role } from '@aws-cdk/iam';
import { Test } from 'nodeunit';
import { CrossAccountDestination } from '../lib';

export = {
    'simple destination'(test: Test) {
        // GIVEN
        const stack = new Stack();
        const role = new Role(stack, 'Role', {
            assumedBy: new ServicePrincipal('logs.us-east-2.amazonaws.com')
        });

        // WHEN
        new CrossAccountDestination(stack, 'Dest', {
            destinationName: 'MyDestination',
            role,
            targetArn: new Arn('arn:bogus')
        });

        // THEN
        expect(stack).to(haveResource('AWS::Logs::Destination', {
            DestinationName: 'MyDestination',
            RoleArn: { "Fn::GetAtt": [ "Role1ABCC5F0", "Arn" ] },
            TargetArn: 'arn:bogus',
        }));

        test.done();
    },

    'add policy to destination'(test: Test) {
        // GIVEN
        const stack = new Stack();
        const role = new Role(stack, 'Role', {
            assumedBy: new ServicePrincipal('logs.us-east-2.amazonaws.com')
        });

        const dest = new CrossAccountDestination(stack, 'Dest', {
            destinationName: 'MyDestination',
            role,
            targetArn: new Arn('arn:bogus')
        });

        // WHEN
        dest.addToPolicy(new PolicyStatement()
            .addAction('logs:TalkToMe'));

        // THEN
        expect(stack).to(haveResource('AWS::Logs::Destination', (props: any) => {
            // tslint:disable-next-line:no-console
            const pol = JSON.parse(props.DestinationPolicy);

            return pol.Statement[0].action[0] === 'logs:TalkToMe';
        }));

        test.done();
    }
};
