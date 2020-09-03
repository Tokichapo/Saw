import * as core from '@aws-cdk/core';
import * as cfn_parse from '@aws-cdk/core/lib/cfn-parse';
import * as cfn_type_to_l1_mapping from './cfn-type-to-l1-mapping';
import * as futils from './file-utils';

/**
 * Construction properties of {@link CfnInclude}.
 */
export interface CfnIncludeProps {
  /**
   * Path to the template file.
   *
   * Both JSON and YAML template formats are supported.
   */
  readonly templateFile: string;

  /**
   * Specifies the template files that define nested stacks that should be included.
   *
   * If your template specifies a stack that isn't included here, it won't be created as a NestedStack
   * resource, and it won't be accessible from {@link CfnInclude.getNestedStack}.
   *
   * If you include a stack here with an ID that isn't in the template,
   * or is in the template but is not a nested stack,
   * template creation will fail and an error will be thrown.
   *
   * @default - no nested stacks will be included
   */
  readonly nestedStacks?: { [stackName: string]: CfnIncludeProps };

  /**
   * Specifies parameters to be replaced by the values in this mapping.
   * Any parameters in the template that aren't specified here will be left unmodified.
   * If you include a parameter here with an ID that isn't in the template,
   * template creation will fail and an error will be thrown.
   *
   * @default - no parameters will be replaced
   */
  readonly parameters?: { [parameterName: string]: any };
}

/**
 * The type returned from {@link CfnInclude.getNestedStack}.
 * Contains both the NestedStack object and
 * CfnInclude representations of the child stack.
 */
export interface IncludedNestedStack {
  /**
   * The NestedStack object which respresents the scope of the template.
   */
  readonly stack: core.NestedStack;

  /**
   * The CfnInclude that respresents the template, which can
   * be used to access Resources and other template elements.
   */
  readonly includedTemplate: CfnInclude;
}

/**
 * Construct to import an existing CloudFormation template file into a CDK application.
 * All resources defined in the template file can be retrieved by calling the {@link getResource} method.
 * Any modifications made on the returned resource objects will be reflected in the resulting CDK template.
 */
export class CfnInclude extends core.CfnElement {
  private readonly conditions: { [conditionName: string]: core.CfnCondition } = {};
  private readonly conditionsScope: core.Construct;
  private readonly resources: { [logicalId: string]: core.CfnResource } = {};
  private readonly parameters: { [logicalId: string]: core.CfnParameter } = {};
  private readonly parametersToReplace: { [parameterName: string]: any };
  private readonly mappingsScope: core.Construct;
  private readonly mappings: { [mappingName: string]: core.CfnMapping } = {};
  private readonly rules: { [ruleName: string]: core.CfnRule } = {};
  private readonly rulesScope: core.Construct;
  private readonly hooks: { [hookName: string]: core.CfnHook } = {};
  private readonly hooksScope: core.Construct;
  private readonly outputs: { [logicalId: string]: core.CfnOutput } = {};
  private readonly nestedStacks: { [logicalId: string]: IncludedNestedStack } = {};
  private readonly nestedStacksToInclude: { [name: string]: CfnIncludeProps };
  private readonly template: any;
  private readonly preserveLogicalIds: boolean;

  constructor(scope: core.Construct, id: string, props: CfnIncludeProps) {
    super(scope, id);

    this.parametersToReplace = props.parameters || {};

    // read the template into a JS object
    this.template = futils.readYamlSync(props.templateFile);

    // ToDo implement preserveLogicalIds=false
    this.preserveLogicalIds = true;

    // check if all user specified parameter values exist in the template
    for (const logicalId of Object.keys(this.parametersToReplace)) {
      if (!(logicalId in (this.template.Parameters || {}))) {
        throw new Error(`Parameter with logical ID '${logicalId}' was not found in the template`);
      }
    }

    // instantiate the Mappings
    this.mappingsScope = new core.Construct(this, '$Mappings');
    for (const mappingName of Object.keys(this.template.Mappings || {})) {
      this.createMapping(mappingName);
    }

    // instantiate all parameters
    for (const logicalId of Object.keys(this.template.Parameters || {})) {
      this.createParameter(logicalId);
    }

    // instantiate the conditions
    this.conditionsScope = new core.Construct(this, '$Conditions');
    for (const conditionName of Object.keys(this.template.Conditions || {})) {
      this.getOrCreateCondition(conditionName);
    }

    // instantiate the rules
    this.rulesScope = new core.Construct(this, '$Rules');
    for (const ruleName of Object.keys(this.template.Rules || {})) {
      this.createRule(ruleName);
    }

    this.nestedStacksToInclude = props.nestedStacks || {};
    // instantiate all resources as CDK L1 objects
    for (const logicalId of Object.keys(this.template.Resources || {})) {
      this.getOrCreateResource(logicalId);
    }
    // verify that all nestedStacks have been instantiated
    for (const nestedStackId of Object.keys(props.nestedStacks || {})) {
      if (!(nestedStackId in this.resources)) {
        throw new Error(`Nested Stack with logical ID '${nestedStackId}' was not found in the template`);
      }
    }

    // instantiate the Hooks
    this.hooksScope = new core.Construct(this, '$Hooks');
    for (const hookName of Object.keys(this.template.Hooks || {})) {
      this.createHook(hookName);
    }

    const outputScope = new core.Construct(this, '$Ouputs');
    for (const logicalId of Object.keys(this.template.Outputs || {})) {
      this.createOutput(logicalId, outputScope);
    }
  }

  /**
   * Returns the low-level CfnResource from the template with the given logical ID.
   * Any modifications performed on that resource will be reflected in the resulting CDK template.
   *
   * The returned object will be of the proper underlying class;
   * you can always cast it to the correct type in your code:
   *
   *     // assume the template contains an AWS::S3::Bucket with logical ID 'Bucket'
   *     const cfnBucket = cfnTemplate.getResource('Bucket') as s3.CfnBucket;
   *     // cfnBucket is of type s3.CfnBucket
   *
   * If the template does not contain a resource with the given logical ID,
   * an exception will be thrown.
   *
   * @param logicalId the logical ID of the resource in the CloudFormation template file
   */
  public getResource(logicalId: string): core.CfnResource {
    const ret = this.resources[logicalId];
    if (!ret) {
      throw new Error(`Resource with logical ID '${logicalId}' was not found in the template`);
    }
    return ret;
  }

  /**
   * Returns the CfnCondition object from the 'Conditions'
   * section of the CloudFormation template with the given name.
   * Any modifications performed on that object will be reflected in the resulting CDK template.
   *
   * If a Condition with the given name is not present in the template,
   * throws an exception.
   *
   * @param conditionName the name of the Condition in the CloudFormation template file
   */
  public getCondition(conditionName: string): core.CfnCondition {
    const ret = this.conditions[conditionName];
    if (!ret) {
      throw new Error(`Condition with name '${conditionName}' was not found in the template`);
    }
    return ret;
  }

  /**
   * Returns the CfnParameter object from the 'Parameters'
   * section of the included template.
   * Any modifications performed on that object will be reflected in the resulting CDK template.
   *
   * If a Parameter with the given name is not present in the template,
   * throws an exception.
   *
   * @param parameterName the name of the parameter to retrieve
   */
  public getParameter(parameterName: string): core.CfnParameter {
    const ret = this.parameters[parameterName];
    if (!ret) {
      throw new Error(`Parameter with name '${parameterName}' was not found in the template`);
    }
    return ret;
  }

  /**
   * Returns the CfnMapping object from the 'Mappings' section of the included template.
   * Any modifications performed on that object will be reflected in the resulting CDK template.
   *
   * If a Mapping with the given name is not present in the template,
   * an exception will be thrown.
   *
   * @param mappingName the name of the Mapping in the template to retrieve
   */
  public getMapping(mappingName: string): core.CfnMapping {
    const ret = this.mappings[mappingName];
    if (!ret) {
      throw new Error(`Mapping with name '${mappingName}' was not found in the template`);
    }
    return ret;
  }

  /**
   * Returns the CfnOutput object from the 'Outputs'
   * section of the included template.
   * Any modifications performed on that object will be reflected in the resulting CDK template.
   *
   * If an Output with the given name is not present in the template,
   * throws an exception.
   *
   * @param logicalId the name of the output to retrieve
   */
  public getOutput(logicalId: string): core.CfnOutput {
    const ret = this.outputs[logicalId];
    if (!ret) {
      throw new Error(`Output with logical ID '${logicalId}' was not found in the template`);
    }
    return ret;
  }

  /**
   * Returns the CfnRule object from the 'Rules'
   * section of the CloudFormation template with the given name.
   * Any modifications performed on that object will be reflected in the resulting CDK template.
   *
   * If a Rule with the given name is not present in the template,
   * an exception will be thrown.
   *
   * @param ruleName the name of the Rule in the CloudFormation template
   */
  public getRule(ruleName: string): core.CfnRule {
    const ret = this.rules[ruleName];
    if (!ret) {
      throw new Error(`Rule with name '${ruleName}' was not found in the template`);
    }
    return ret;
  }

  /**
   * Returns the CfnHook object from the 'Hooks'
   * section of the included CloudFormation template with the given logical ID.
   * Any modifications performed on the returned object will be reflected in the resulting CDK template.
   *
   * If a Hook with the given logical ID is not present in the template,
   * an exception will be thrown.
   *
   * @param hookLogicalId the logical ID of the Hook in the included CloudFormation template's 'Hooks' section
   */
  public getHook(hookLogicalId: string): core.CfnHook {
    const ret = this.hooks[hookLogicalId];
    if (!ret) {
      throw new Error(`Hook with logical ID '${hookLogicalId}' was not found in the template`);
    }
    return ret;
  }

  /**
   * Returns the NestedStack with name logicalId.
   * For a nested stack to be returned by this method, it must be specified in the {@link CfnIncludeProps.nestedStacks}
   * property.
   *
   * @param logicalId the ID of the stack to retrieve, as it appears in the template
   */
  public getNestedStack(logicalId: string): IncludedNestedStack {
    if (!this.nestedStacks[logicalId]) {
      if (!this.template.Resources[logicalId]) {
        throw new Error(`Nested Stack with logical ID '${logicalId}' was not found in the template`);
      } else if (this.template.Resources[logicalId].Type !== 'AWS::CloudFormation::Stack') {
        throw new Error(`Resource with logical ID '${logicalId}' is not a CloudFormation Stack`);
      } else {
        throw new Error(`Nested Stack '${logicalId}' was not included in the nestedStacks property when including the parent template`);
      }
    }
    return this.nestedStacks[logicalId];
  }

  /** @internal */
  public _toCloudFormation(): object {
    const ret: { [section: string]: any } = {};

    for (const section of Object.keys(this.template)) {
      const self = this;
      const finder: cfn_parse.ICfnFinder = {
        findResource(lId): core.CfnResource | undefined {
          return self.resources[lId];
        },
        findRefTarget(elementName: string): core.CfnElement | undefined {
          return self.resources[elementName] ?? self.parameters[elementName];
        },
        findCondition(conditionName: string): core.CfnCondition | undefined {
          return self.conditions[conditionName];
        },
        findMapping(mappingName): core.CfnMapping | undefined {
          return self.mappings[mappingName];
        },
      };
      const cfnParser = new cfn_parse.CfnParser({
        finder,
        parameters: this.parametersToReplace,
      });

      switch (section) {
        case 'Conditions':
        case 'Mappings':
        case 'Resources':
        case 'Parameters':
        case 'Rules':
        case 'Hooks':
        case 'Outputs':
          // these are rendered as a side effect of instantiating the L1s
          break;
        default:
          ret[section] = cfnParser.parseValue(this.template[section]);
      }
    }

    return ret;
  }

  private createMapping(mappingName: string): void {
    const cfnParser = new cfn_parse.CfnParser({
      finder: {
        findCondition() { throw new Error('Referring to Conditions in Mapping definitions is not allowed'); },
        findMapping() { throw new Error('Referring to other Mappings in Mapping definitions is not allowed'); },
        findRefTarget() { throw new Error('Using Ref expressions in Mapping definitions is not allowed'); },
        findResource() { throw new Error('Using GetAtt expressions in Mapping definitions is not allowed'); },
      },
      parameters: {},
    });
    const cfnMapping = new core.CfnMapping(this.mappingsScope, mappingName, {
      mapping: cfnParser.parseValue(this.template.Mappings[mappingName]),
    });
    this.mappings[mappingName] = cfnMapping;
    cfnMapping.overrideLogicalId(mappingName);
  }

  private createParameter(logicalId: string): void {
    if (logicalId in this.parametersToReplace) {
      return;
    }

    const expression = new cfn_parse.CfnParser({
      finder: {
        findResource() { throw new Error('Using GetAtt expressions in Parameter definitions is not allowed'); },
        findRefTarget() { throw new Error('Using Ref expressions in Parameter definitions is not allowed'); },
        findCondition() { throw new Error('Referring to Conditions in Parameter definitions is not allowed'); },
        findMapping() { throw new Error('Referring to Mappings in Parameter definitions is not allowed'); },
      },
      parameters: {},
    }).parseValue(this.template.Parameters[logicalId]);
    const cfnParameter = new core.CfnParameter(this, logicalId, {
      type: expression.Type,
      default: expression.Default,
      allowedPattern: expression.AllowedPattern,
      allowedValues: expression.AllowedValues,
      constraintDescription: expression.ConstraintDescription,
      description: expression.Description,
      maxLength: expression.MaxLength,
      maxValue: expression.MaxValue,
      minLength: expression.MinLength,
      minValue: expression.MinValue,
      noEcho: expression.NoEcho,
    });

    cfnParameter.overrideLogicalId(logicalId);
    this.parameters[logicalId] = cfnParameter;
  }

  private createRule(ruleName: string): void {
    const self = this;
    const cfnParser = new cfn_parse.CfnParser({
      finder: {
        findRefTarget(refTarget: string): core.CfnElement | undefined {
          // only parameters can be referenced in Rules
          return self.parameters[refTarget];
        },
        findResource() { throw new Error('Using GetAtt expressions in Rule definitions is not allowed'); },
        findCondition() { throw new Error('Referring to Conditions in Rule definitions is not allowed'); },
        findMapping(mappingName: string): core.CfnMapping | undefined {
          return self.mappings[mappingName];
        },
      },
      parameters: this.parametersToReplace,
      context: cfn_parse.CfnParsingContext.RULES,
    });
    const ruleProperties = cfnParser.parseValue(this.template.Rules[ruleName]);
    const rule = new core.CfnRule(this.rulesScope, ruleName, {
      ruleCondition: ruleProperties.RuleCondition,
      assertions: ruleProperties.Assertions,
    });
    this.rules[ruleName] = rule;
    rule.overrideLogicalId(ruleName);
  }

  private createHook(hookName: string): void {
    const self = this;
    const cfnParser = new cfn_parse.CfnParser({
      finder: {
        findResource(lId): core.CfnResource | undefined {
          return self.resources[lId];
        },
        findRefTarget(elementName: string): core.CfnElement | undefined {
          return self.resources[elementName] ?? self.parameters[elementName];
        },
        findCondition(conditionName: string): core.CfnCondition | undefined {
          return self.conditions[conditionName];
        },
        findMapping(mappingName): core.CfnMapping | undefined {
          return self.mappings[mappingName];
        },
      },
      parameters: this.parametersToReplace,
    });
    const hookAttributes = this.template.Hooks[hookName];

    let hook: core.CfnHook;
    switch (hookAttributes.Type) {
      case 'AWS::CodeDeploy::BlueGreen':
        hook = (core.CfnCodeDeployBlueGreenHook as any)._fromCloudFormation(this.hooksScope, hookName, hookAttributes, {
          parser: cfnParser,
        });
        break;
      default: {
        const hookProperties = cfnParser.parseValue(hookAttributes.Properties) ?? {};
        hook = new core.CfnHook(this.hooksScope, hookName, {
          type: hookAttributes.Type,
          properties: hookProperties,
        });
      }
    }
    this.hooks[hookName] = hook;
    hook.overrideLogicalId(hookName);
  }

  private createOutput(logicalId: string, scope: core.Construct): void {
    const self = this;
    const outputAttributes = new cfn_parse.CfnParser({
      finder: {
        findResource(lId): core.CfnResource | undefined {
          return self.resources[lId];
        },
        findRefTarget(elementName: string): core.CfnElement | undefined {
          return self.resources[elementName] ?? self.parameters[elementName];
        },
        findCondition(): undefined {
          return undefined;
        },
        findMapping(mappingName): core.CfnMapping | undefined {
          return self.mappings[mappingName];
        },
      },
      parameters: this.parametersToReplace,
    }).parseValue(this.template.Outputs[logicalId]);
    const cfnOutput = new core.CfnOutput(scope, logicalId, {
      value: outputAttributes.Value,
      description: outputAttributes.Description,
      exportName: outputAttributes.Export ? outputAttributes.Export.Name : undefined,
      condition: (() => {
        if (!outputAttributes.Condition) {
          return undefined;
        } else if (this.conditions[outputAttributes.Condition]) {
          return self.getCondition(outputAttributes.Condition);
        }

        throw new Error(`Output with name '${logicalId}' refers to a Condition with name ` +
          `'${outputAttributes.Condition}' which was not found in this template`);
      })(),
    });

    cfnOutput.overrideLogicalId(logicalId);
    this.outputs[logicalId] = cfnOutput;
  }

  private getOrCreateCondition(conditionName: string): core.CfnCondition {
    if (conditionName in this.conditions) {
      return this.conditions[conditionName];
    }

    const self = this;
    const cfnParser = new cfn_parse.CfnParser({
      finder: {
        findResource() { throw new Error('Using GetAtt in Condition definitions is not allowed'); },
        findRefTarget(elementName: string): core.CfnElement | undefined {
          // only Parameters can be referenced in the 'Conditions' section
          return self.parameters[elementName];
        },
        findCondition(cName: string): core.CfnCondition | undefined {
          return cName in (self.template.Conditions || {})
            ? self.getOrCreateCondition(cName)
            : undefined;
        },
        findMapping(mappingName: string): core.CfnMapping | undefined {
          return self.mappings[mappingName];
        },
      },
      context: cfn_parse.CfnParsingContext.CONDITIONS,
      parameters: this.parametersToReplace,
    });
    const cfnCondition = new core.CfnCondition(this.conditionsScope, conditionName, {
      expression: cfnParser.parseValue(this.template.Conditions[conditionName]),
    });

    // ToDo handle renaming of the logical IDs of the conditions
    cfnCondition.overrideLogicalId(conditionName);
    this.conditions[conditionName] = cfnCondition;
    return cfnCondition;
  }

  private getOrCreateResource(logicalId: string): core.CfnResource {
    const ret = this.resources[logicalId];
    if (ret) {
      return ret;
    }

    const resourceAttributes: any = this.template.Resources[logicalId];

    // fail early for resource attributes we don't support yet
    const knownAttributes = [
      'Type', 'Properties', 'Condition', 'DependsOn', 'Metadata',
      'CreationPolicy', 'UpdatePolicy', 'DeletionPolicy', 'UpdateReplacePolicy',
    ];
    for (const attribute of Object.keys(resourceAttributes)) {
      if (!knownAttributes.includes(attribute)) {
        throw new Error(`The ${attribute} resource attribute is not supported by cloudformation-include yet. ` +
          'Either remove it from the template, or use the CdkInclude class from the core package instead.');
      }
    }

    const self = this;
    const finder: cfn_parse.ICfnFinder = {
      findCondition(conditionName: string): core.CfnCondition | undefined {
        return self.conditions[conditionName];
      },

      findMapping(mappingName): core.CfnMapping | undefined {
        return self.mappings[mappingName];
      },

      findResource(lId: string): core.CfnResource | undefined {
        if (!(lId in (self.template.Resources || {}))) {
          return undefined;
        }
        return self.getOrCreateResource(lId);
      },

      findRefTarget(elementName: string): core.CfnElement | undefined {
        if (elementName in self.parameters) {
          return self.parameters[elementName];
        }

        return this.findResource(elementName);
      },
    };
    const cfnParser = new cfn_parse.CfnParser({
      finder,
      parameters: this.parametersToReplace,
    });

    let l1Instance: core.CfnResource;
    if (this.nestedStacksToInclude[logicalId]) {
      l1Instance = this.createNestedStack(logicalId, cfnParser);
    } else {
      const l1ClassFqn = cfn_type_to_l1_mapping.lookup(resourceAttributes.Type);
      if (l1ClassFqn) {
        const options: cfn_parse.FromCloudFormationOptions = {
          parser: cfnParser,
        };
        const [moduleName, ...className] = l1ClassFqn.split('.');
        const module = require(moduleName); // eslint-disable-line @typescript-eslint/no-require-imports
        const jsClassFromModule = module[className.join('.')];
        l1Instance = jsClassFromModule._fromCloudFormation(this, logicalId, resourceAttributes, options);
      } else {
        l1Instance = new core.CfnResource(this, logicalId, {
          type: resourceAttributes.Type,
          properties: cfnParser.parseValue(resourceAttributes.Properties),
        });
        cfnParser.handleAttributes(l1Instance, resourceAttributes, logicalId);
      }
    }

    if (this.preserveLogicalIds) {
      // override the logical ID to match the original template
      l1Instance.overrideLogicalId(logicalId);
    }

    this.resources[logicalId] = l1Instance;
    return l1Instance;
  }

  private createNestedStack(nestedStackId: string, cfnParser: cfn_parse.CfnParser): core.CfnResource {
    const templateResources = this.template.Resources || {};
    const nestedStackAttributes = templateResources[nestedStackId] || {};

    if (nestedStackAttributes.Type !== 'AWS::CloudFormation::Stack') {
      throw new Error(`Nested Stack with logical ID '${nestedStackId}' is not an AWS::CloudFormation::Stack resource`);
    }
    if (nestedStackAttributes.CreationPolicy) {
      throw new Error('CreationPolicy is not supported by the AWS::CloudFormation::Stack resource');
    }
    if (nestedStackAttributes.UpdatePolicy) {
      throw new Error('UpdatePolicy is not supported by the AWS::CloudFormation::Stack resource');
    }

    const nestedStackProps = cfnParser.parseValue(nestedStackAttributes.Properties);
    const nestedStack = new core.NestedStack(this, nestedStackId, {
      parameters: this.parametersForNestedStack(nestedStackProps.Parameters, nestedStackId),
      notificationArns: nestedStackProps.NotificationArns,
      timeout: nestedStackProps.Timeout,
    });
    const template = new CfnInclude(nestedStack, nestedStackId, this.nestedStacksToInclude[nestedStackId]);
    this.nestedStacks[nestedStackId] = { stack: nestedStack, includedTemplate: template };

    // we know this is never undefined for nested stacks
    const nestedStackResource: core.CfnResource = nestedStack.nestedStackResource!;
    cfnParser.handleAttributes(nestedStackResource, nestedStackAttributes, nestedStackId);
    return nestedStackResource;
  }

  private parametersForNestedStack(parameters: any, nestedStackId: string): { [key: string]: any } | undefined {
    if (parameters == null) {
      return undefined;
    }

    const parametersToReplace = this.nestedStacksToInclude[nestedStackId].parameters ?? {};
    const ret: { [key: string]: string } = {};
    for (const paramName of Object.keys(parameters)) {
      if (!(paramName in parametersToReplace)) {
        ret[paramName] = parameters[paramName];
      }
    }
    return ret;
  }
}
