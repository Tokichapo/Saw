import * as cxschema from '@aws-cdk/cloud-assembly-schema';
import * as cxapi from '@aws-cdk/cx-api';
import { Mode } from '../../api/aws-auth/credentials';
import { SdkProvider } from '../../api/aws-auth/sdk-provider';
import { ContextProviderPlugin } from '../../api/plugin';

export class ThemeContextProviderPlugin implements ContextProviderPlugin {
  constructor(private readonly aws: SdkProvider) {
  }

  async getValue(args: cxschema.QuickSightThemeContextQuery): Promise<cxapi.ThemeContextResponse> {

    const options = { assumeRoleArn: args.lookupRoleArn };

    const quickSight = (await this.aws.forEnvironment(
      cxapi.EnvironmentUtils.make(args.account, args.region),
      Mode.ForReading,
      options,
    )).sdk.quickSight();

    const response = await quickSight.describeTheme({
      AwsAccountId: args.account,
      ThemeId: args.themeId,
    }).promise();

    const theme = response.Theme;

    if (!theme) {
      throw new Error(`No Theme found in account ${args.account} with id ${args.themeId}`);
    }

    return theme;
  }
}