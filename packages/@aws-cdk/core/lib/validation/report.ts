/**
 * Violation produced by the validation plugin.
 */
export interface PolicyViolation {
  /**
   * The name of the rule.
   */
  readonly ruleName: string;

  /**
   * The description of the violation.
   */
  readonly description: string;

  /**
   * The resources violating this rule.
   */
  readonly violatingResources: PolicyViolatingResource[];

  /**
   * How to fix the violation.
   *
   * @default - no fix is provided
   */
  readonly fix?: string;

  /**
   * The severity of the violation, only used for reporting purposes.
   * This is useful for helping the user discriminate between warnings,
   * errors, information, etc.
   *
   * @default - no severity
   */
  readonly severity?: string;

  /**
   * Additional metadata to include with the rule results.
   * This can be used to provide additional information that is
   * plugin specific. The data provided here will be rendered as is.
   *
   * @default - no rule metadata
   */
  readonly ruleMetadata?: { readonly [key: string]: string }
}

/**
 * Resource violating a specific rule.
 */
export interface PolicyViolatingResource {
  /**
   * The logical ID of the resource in the CloudFormation template.
   */
  readonly resourceLogicalId: string;

  /**
   * The locations in the CloudFormation template that pose the violations.
   */
  readonly locations: string[];

  /**
   * The path to the CloudFormation template that contains this resource
   */
  readonly templatePath: string;
}

/**
 * The final status of the validation report
 */
export enum PolicyValidationReportStatus {
  /**
   * No violations were found
   */
  SUCCESS = 'success',

  /**
   * At least one violation was found
   */
  FAILURE = 'failure',
}

/**
 * The report emitted by the plugin after evaluation.
 */
export interface PolicyValidationPluginReport {
  /**
   * List of violations in the report.
   */
  readonly violations: PolicyViolation[];

  /**
   * Whether or not the report was successful.
   */
  readonly success: boolean;

  /**
   * Arbitrary information about the report.
   *
   * @default - no metadata
   */
  readonly metadata?: { readonly [key: string]: string }
}
