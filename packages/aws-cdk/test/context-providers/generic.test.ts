import { ISDK } from '../../lib/api/util/sdk';
import * as contextproviders from '../../lib/context-providers';
import { Context, TRANSIENT_CONTEXT_KEY } from '../../lib/settings';

const mockSDK: ISDK = {
  defaultAccount: () => Promise.resolve('123456789012'),
  defaultRegion: () => Promise.resolve('bermuda-triangle-1337'),
  cloudFormation: () => { throw new Error('Not Mocked'); },
  ec2: () => { throw new Error('Not Mocked'); },
  ecr: () => { throw new Error('Not Mocked'); },
  route53: () => { throw new Error('Not Mocked'); },
  s3: () => { throw new Error('Not Mocked'); },
  ssm: () => { throw new Error('Not Mocked'); },
};

test('errors are reported into the context value', async () => {
  // GIVEN
  contextproviders.registerContextProvider('testprovider', class {
    public async getValue(_: {[key: string]: any}): Promise<any> {
      throw new Error('Something went wrong');
    }
  });
  const context = new Context();

  // WHEN
  await contextproviders.provideContextValues([
    { key: 'asdf', props: {}, provider: 'testprovider' }
  ], context, mockSDK);

  // THEN - error is now in context

  // NOTE: error key is inlined here because it's part of the CX-API
  // compatibility surface.
  expect(context.get('asdf').$providerError).toBe('Something went wrong');
});

test('errors are marked transient', async () => {
  // GIVEN
  contextproviders.registerContextProvider('testprovider', class {
    public async getValue(_: {[key: string]: any}): Promise<any> {
      throw new Error('Something went wrong');
    }
  });
  const context = new Context();

  // WHEN
  await contextproviders.provideContextValues([
    { key: 'asdf', props: {}, provider: 'testprovider' }
  ], context, mockSDK);

  // THEN - error is marked transient
  expect(context.get('asdf')[TRANSIENT_CONTEXT_KEY]).toBeTruthy();
});
