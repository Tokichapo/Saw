"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_secretsmanager_1 = require("aws-cdk-lib/aws-secretsmanager");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_cognito_1 = require("aws-cdk-lib/aws-cognito");
/*
 * Stack verification steps
 * * Visit the URL provided by stack output 'SignInLink' in a browser, and verify the 'Google' sign in link shows up.
 * * If you plug in valid 'Google' credentials, the federated log in should work.
 */
const app = new aws_cdk_lib_1.App();
const stack = new aws_cdk_lib_1.Stack(app, 'integ-user-pool-idp-google');
const userpool = new aws_cognito_1.UserPool(stack, 'pool', {
    removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
});
const secret = new aws_secretsmanager_1.Secret(stack, 'GoogleClientSecretValue', {
    secretName: 'GoogleClientSecretValueName',
    generateSecretString: {
        excludePunctuation: true,
        passwordLength: 20,
    },
});
const clientSecret = aws_secretsmanager_1.Secret.fromSecretAttributes(stack, 'GoogleClientSecretValue2', {
    secretCompleteArn: secret.secretArn,
}).secretValue;
new aws_cognito_1.UserPoolIdentityProviderGoogle(stack, 'google', {
    userPool: userpool,
    clientId: 'google-client-id',
    clientSecretValue: clientSecret,
    attributeMapping: {
        givenName: aws_cognito_1.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: aws_cognito_1.ProviderAttribute.GOOGLE_FAMILY_NAME,
        email: aws_cognito_1.ProviderAttribute.GOOGLE_EMAIL,
        gender: aws_cognito_1.ProviderAttribute.GOOGLE_GENDER,
        custom: {
            names: aws_cognito_1.ProviderAttribute.GOOGLE_NAMES,
        },
    },
});
const client = userpool.addClient('client');
const domain = userpool.addDomain('domain', {
    cognitoDomain: {
        domainPrefix: 'nija-test-pool',
    },
});
new aws_cdk_lib_1.CfnOutput(stack, 'SignInLink', {
    value: domain.signInUrl(client, {
        redirectUri: 'https://example.com',
    }),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcudXNlci1wb29sLWlkcC5nb29nbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlZy51c2VyLXBvb2wtaWRwLmdvb2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVFQUF3RDtBQUN4RCw2Q0FBbUU7QUFDbkUseURBQXNHO0FBR3RHOzs7O0dBSUc7QUFFSCxNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLG1CQUFLLENBQUMsR0FBRyxFQUFFLDRCQUE0QixDQUFDLENBQUM7QUFFM0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxzQkFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDM0MsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztDQUNyQyxDQUFDLENBQUM7QUFFSCxNQUFNLE1BQU0sR0FBRyxJQUFJLDJCQUFNLENBQUMsS0FBSyxFQUFFLHlCQUF5QixFQUFFO0lBQzFELFVBQVUsRUFBRSw2QkFBNkI7SUFDekMsb0JBQW9CLEVBQUU7UUFDcEIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixjQUFjLEVBQUUsRUFBRTtLQUNuQjtDQUNGLENBQUMsQ0FBQztBQUVILE1BQU0sWUFBWSxHQUFHLDJCQUFNLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLDBCQUEwQixFQUFFO0lBQ2xGLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxTQUFTO0NBQ3BDLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFFZixJQUFJLDRDQUE4QixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUU7SUFDbEQsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixpQkFBaUIsRUFBRSxZQUFZO0lBQy9CLGdCQUFnQixFQUFFO1FBQ2hCLFNBQVMsRUFBRSwrQkFBaUIsQ0FBQyxpQkFBaUI7UUFDOUMsVUFBVSxFQUFFLCtCQUFpQixDQUFDLGtCQUFrQjtRQUNoRCxLQUFLLEVBQUUsK0JBQWlCLENBQUMsWUFBWTtRQUNyQyxNQUFNLEVBQUUsK0JBQWlCLENBQUMsYUFBYTtRQUN2QyxNQUFNLEVBQUU7WUFDTixLQUFLLEVBQUUsK0JBQWlCLENBQUMsWUFBWTtTQUN0QztLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUU1QyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRTtJQUMxQyxhQUFhLEVBQUU7UUFDYixZQUFZLEVBQUUsZ0JBQWdCO0tBQy9CO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsSUFBSSx1QkFBUyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUU7SUFDakMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO1FBQzlCLFdBQVcsRUFBRSxxQkFBcUI7S0FDbkMsQ0FBQztDQUNILENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlY3JldCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5pbXBvcnQgeyBBcHAsIENmbk91dHB1dCwgUmVtb3ZhbFBvbGljeSwgU3RhY2sgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBQcm92aWRlckF0dHJpYnV0ZSwgVXNlclBvb2wsIFVzZXJQb29sSWRlbnRpdHlQcm92aWRlckdvb2dsZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcblxuXG4vKlxuICogU3RhY2sgdmVyaWZpY2F0aW9uIHN0ZXBzXG4gKiAqIFZpc2l0IHRoZSBVUkwgcHJvdmlkZWQgYnkgc3RhY2sgb3V0cHV0ICdTaWduSW5MaW5rJyBpbiBhIGJyb3dzZXIsIGFuZCB2ZXJpZnkgdGhlICdHb29nbGUnIHNpZ24gaW4gbGluayBzaG93cyB1cC5cbiAqICogSWYgeW91IHBsdWcgaW4gdmFsaWQgJ0dvb2dsZScgY3JlZGVudGlhbHMsIHRoZSBmZWRlcmF0ZWQgbG9nIGluIHNob3VsZCB3b3JrLlxuICovXG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcbmNvbnN0IHN0YWNrID0gbmV3IFN0YWNrKGFwcCwgJ2ludGVnLXVzZXItcG9vbC1pZHAtZ29vZ2xlJyk7XG5cbmNvbnN0IHVzZXJwb29sID0gbmV3IFVzZXJQb29sKHN0YWNrLCAncG9vbCcsIHtcbiAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxufSk7XG5cbmNvbnN0IHNlY3JldCA9IG5ldyBTZWNyZXQoc3RhY2ssICdHb29nbGVDbGllbnRTZWNyZXRWYWx1ZScsIHtcbiAgc2VjcmV0TmFtZTogJ0dvb2dsZUNsaWVudFNlY3JldFZhbHVlTmFtZScsXG4gIGdlbmVyYXRlU2VjcmV0U3RyaW5nOiB7XG4gICAgZXhjbHVkZVB1bmN0dWF0aW9uOiB0cnVlLFxuICAgIHBhc3N3b3JkTGVuZ3RoOiAyMCxcbiAgfSxcbn0pO1xuXG5jb25zdCBjbGllbnRTZWNyZXQgPSBTZWNyZXQuZnJvbVNlY3JldEF0dHJpYnV0ZXMoc3RhY2ssICdHb29nbGVDbGllbnRTZWNyZXRWYWx1ZTInLCB7XG4gIHNlY3JldENvbXBsZXRlQXJuOiBzZWNyZXQuc2VjcmV0QXJuLFxufSkuc2VjcmV0VmFsdWU7XG5cbm5ldyBVc2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUoc3RhY2ssICdnb29nbGUnLCB7XG4gIHVzZXJQb29sOiB1c2VycG9vbCxcbiAgY2xpZW50SWQ6ICdnb29nbGUtY2xpZW50LWlkJyxcbiAgY2xpZW50U2VjcmV0VmFsdWU6IGNsaWVudFNlY3JldCxcbiAgYXR0cmlidXRlTWFwcGluZzoge1xuICAgIGdpdmVuTmFtZTogUHJvdmlkZXJBdHRyaWJ1dGUuR09PR0xFX0dJVkVOX05BTUUsXG4gICAgZmFtaWx5TmFtZTogUHJvdmlkZXJBdHRyaWJ1dGUuR09PR0xFX0ZBTUlMWV9OQU1FLFxuICAgIGVtYWlsOiBQcm92aWRlckF0dHJpYnV0ZS5HT09HTEVfRU1BSUwsXG4gICAgZ2VuZGVyOiBQcm92aWRlckF0dHJpYnV0ZS5HT09HTEVfR0VOREVSLFxuICAgIGN1c3RvbToge1xuICAgICAgbmFtZXM6IFByb3ZpZGVyQXR0cmlidXRlLkdPT0dMRV9OQU1FUyxcbiAgICB9LFxuICB9LFxufSk7XG5cbmNvbnN0IGNsaWVudCA9IHVzZXJwb29sLmFkZENsaWVudCgnY2xpZW50Jyk7XG5cbmNvbnN0IGRvbWFpbiA9IHVzZXJwb29sLmFkZERvbWFpbignZG9tYWluJywge1xuICBjb2duaXRvRG9tYWluOiB7XG4gICAgZG9tYWluUHJlZml4OiAnbmlqYS10ZXN0LXBvb2wnLFxuICB9LFxufSk7XG5cbm5ldyBDZm5PdXRwdXQoc3RhY2ssICdTaWduSW5MaW5rJywge1xuICB2YWx1ZTogZG9tYWluLnNpZ25JblVybChjbGllbnQsIHtcbiAgICByZWRpcmVjdFVyaTogJ2h0dHBzOi8vZXhhbXBsZS5jb20nLFxuICB9KSxcbn0pOyJdfQ==