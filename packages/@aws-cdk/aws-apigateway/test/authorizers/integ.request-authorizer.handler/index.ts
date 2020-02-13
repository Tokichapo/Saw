// tslint:disable:no-console

export const handler = async (event: any, _context: any = {}): Promise<any> => {
  const arn = event.methodArn;
  if (arn) {
    return {
      principalId: 'user',
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: 'Allow',
            Resource: arn,
          }
        ]
      }
    };
  } else {
    throw new Error('Unauthorized');
  }
};
