import * as cdk from '@aws-cdk/core';
import { CfnListenerRule } from '../elasticloadbalancingv2.generated';
import { IListenerAction } from '../shared/listener-action';
import { IApplicationListener } from './application-listener';
import { ApplicationListenerAction } from './application-listener-action';
import { IApplicationTargetGroup } from './application-target-group';

/**
 * Basic properties for defining a rule on a listener
 */
export interface BaseApplicationListenerRuleProps {
  /**
   * Priority of the rule
   *
   * The rule with the lowest priority will be used for every request.
   *
   * Priorities must be unique.
   */
  readonly priority: number;

  /**
   * Target groups to forward requests to.
   *
   * Only one of `action`, `fixedResponse`, `redirectResponse` or `targetGroups` can be specified.
   *
   * Implies a `forward` action.
   *
   * @default - No target groups.
   */
  readonly targetGroups?: IApplicationTargetGroup[];

  /**
   * Action to perform when requests are received
   *
   * Only one of `action`, `fixedResponse`, `redirectResponse` or `targetGroups` can be specified.
   *
   * @default - No action
   */
  readonly action?: ApplicationListenerAction;

  /**
   * Fixed response to return.
   *
   * Only one of `action`, `fixedResponse`, `redirectResponse` or `targetGroups` can be specified.
   *
   * @default - No fixed response.
   * @deprecated Use `action` instead.
   */
  readonly fixedResponse?: FixedResponse;

  /**
   * Redirect response to return.
   *
   * Only one of `action`, `fixedResponse`, `redirectResponse` or `targetGroups` can be specified.
   *
   * @default - No redirect response.
   * @deprecated Use `action` instead.
   */
  readonly redirectResponse?: RedirectResponse;

  /**
   * Rule applies if the requested host matches the indicated host
   *
   * May contain up to three '*' wildcards.
   *
   * @see https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html#host-conditions
   *
   * @default - No host condition.
   */
  readonly hostHeader?: string;

  /**
   * Rule applies if the requested path matches the given path pattern
   *
   * @see https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html#path-conditions
   * @default - No path condition.
   * @deprecated Use `pathPatterns` instead.
   */
  readonly pathPattern?: string;

  /**
   * Rule applies if the requested path matches any of the given patterns.
   *
   * Paths may contain up to three '*' wildcards.
   *
   * @see https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html#path-conditions
   * @default - No path conditions.
   */
  readonly pathPatterns?: string[];
}

/**
 * Properties for defining a listener rule
 */
export interface ApplicationListenerRuleProps extends BaseApplicationListenerRuleProps {
  /**
   * The listener to attach the rule to
   */
  readonly listener: IApplicationListener;
}

/**
 * The content type for a fixed response
 */
export enum ContentType {
  TEXT_PLAIN = 'text/plain',
  TEXT_CSS = 'text/css',
  TEXT_HTML =  'text/html',
  APPLICATION_JAVASCRIPT = 'application/javascript',
  APPLICATION_JSON = 'application/json'
}

/**
 * A fixed response
 */
export interface FixedResponse {
  /**
   * The HTTP response code (2XX, 4XX or 5XX)
   */
  readonly statusCode: string;

  /**
   * The content type
   *
   * @default text/plain
   */
  readonly contentType?: ContentType;

  /**
   * The message
   *
   * @default no message
   */
  readonly messageBody?: string;
}

/**
 * A redirect response
 */
export interface RedirectResponse {
  /**
   * The hostname. This component is not percent-encoded. The hostname can contain #{host}.
   *
   * @default origin host of request
   */
  readonly host?: string;
  /**
   * The absolute path, starting with the leading "/". This component is not percent-encoded.
   * The path can contain #{host}, #{path}, and #{port}.
   *
   * @default origin path of request
   */
  readonly path?: string;
  /**
   * The port. You can specify a value from 1 to 65535 or #{port}.
   *
   * @default origin port of request
   */
  readonly port?: string;
  /**
   * The protocol. You can specify HTTP, HTTPS, or #{protocol}. You can redirect HTTP to HTTP,
   * HTTP to HTTPS, and HTTPS to HTTPS. You cannot redirect HTTPS to HTTP.
   *
   * @default origin protocol of request
   */
  readonly protocol?: string;
  /**
   * The query parameters, URL-encoded when necessary, but not percent-encoded.
   * Do not include the leading "?", as it is automatically added.
   * You can specify any of the reserved keywords.
   *
   * @default origin query string of request
   */
  readonly query?: string;
  /**
   * The HTTP redirect code (HTTP_301 or HTTP_302)
   */
  readonly statusCode: string;
}

/**
 * Define a new listener rule
 */
export class ApplicationListenerRule extends cdk.Construct {
  /**
   * The ARN of this rule
   */
  public readonly listenerRuleArn: string;

  private readonly conditions: {[key: string]: string[] | undefined} = {};

  private readonly listener: IApplicationListener;
  private action?: IListenerAction;

  constructor(scope: cdk.Construct, id: string, props: ApplicationListenerRuleProps) {
    super(scope, id);

    const hasPathPatterns = props.pathPatterns || props.pathPattern;
    if (!props.hostHeader && !hasPathPatterns) {
      throw new Error('At least one of \'hostHeader\', \'pathPattern\' or \'pathPatterns\' is required when defining a load balancing rule.');
    }

    const possibleActions: Array<keyof ApplicationListenerRuleProps> = ['action', 'targetGroups', 'fixedResponse', 'redirectResponse'];
    const providedActions = possibleActions.filter(action => props[action] !== undefined);
    if (providedActions.length > 1) {
      throw new Error(`'${providedActions}' specified together, specify only one`);
    }

    if (props.priority <= 0) {
      throw new Error('Priority must have value greater than or equal to 1');
    }

    this.listener = props.listener;

    const resource = new CfnListenerRule(this, 'Resource', {
      listenerArn: props.listener.listenerArn,
      priority: props.priority,
      conditions: cdk.Lazy.anyValue({ produce: () => this.renderConditions() }),
      actions: cdk.Lazy.anyValue({ produce: () => this.action ? this.action.renderActions() : [] }),
    });

    if (props.hostHeader) {
      this.setCondition('host-header', [props.hostHeader]);
    }

    if (hasPathPatterns) {
      if (props.pathPattern && props.pathPatterns) {
        throw new Error('Both `pathPatterns` and `pathPattern` are specified, specify only one');
      }
      const pathPattern = props.pathPattern ? [props.pathPattern] : props.pathPatterns;
      this.setCondition('path-pattern', pathPattern);
    }

    if (props.action) {
      this.configureAction(props.action);
    }

    (props.targetGroups || []).forEach(this.addTargetGroup.bind(this));

    if (props.fixedResponse) {
      this.addFixedResponse(props.fixedResponse);
    } else if (props.redirectResponse) {
      this.addRedirectResponse(props.redirectResponse);
    }

    this.listenerRuleArn = resource.ref;
  }

  /**
   * Add a non-standard condition to this rule
   */
  public setCondition(field: string, values: string[] | undefined) {
    this.conditions[field] = values;
  }

  /**
   * Configure the action to perform for this rule
   */
  public configureAction(action: ApplicationListenerAction) {
    // I'd like to throw here but there might be existing programs that happen
    // to work even though they followed an illegal call pattern. Just add a warning.
    if (this.action) {
      this.node.addWarning('An Action already existed on this ListenerRule and was replaced. Configure exactly one default Action.');
    }

    action.bindToListener(this, this.listener, this);
    this.action = action;
  }

  /**
   * Add a TargetGroup to load balance to
   *
   * @deprecated Use configureAction instead
   */
  public addTargetGroup(targetGroup: IApplicationTargetGroup) {
    this.configureAction(ApplicationListenerAction.forward({
      targetGroups: [targetGroup],
    }));
  }

  /**
   * Add a fixed response
   *
   * @deprecated Use configureAction instead
   */
  public addFixedResponse(fixedResponse: FixedResponse) {
    validateFixedResponse(fixedResponse);

    this.configureAction(ApplicationListenerAction.fixedResponse({
      statusCode: cdk.Token.asNumber(fixedResponse.statusCode),
      contentType: fixedResponse.contentType,
      messageBody: fixedResponse.messageBody,
    }));
  }

  /**
   * Add a redirect response
   *
   * @deprecated Use configureAction instead
   */
  public addRedirectResponse(redirectResponse: RedirectResponse) {
    validateRedirectResponse(redirectResponse);

    this.configureAction(ApplicationListenerAction.redirect({
      host: redirectResponse.host,
      path: redirectResponse.path,
      permanent: redirectResponse.statusCode === 'HTTP_301',
      port: redirectResponse.port,
      protocol: redirectResponse.protocol,
      query: redirectResponse.query,
    }));
  }

  /**
   * Validate the rule
   */
  protected validate() {
    if (this.action === undefined) {
      return ['Listener rule needs at least one action'];
    }
    return [];
  }

  /**
   * Render the conditions for this rule
   */
  private renderConditions() {
    const ret = new Array<{ field: string, values: string[] }>();
    for (const [field, values] of Object.entries(this.conditions)) {
      if (values !== undefined) {
        ret.push({ field, values });
      }
    }
    return ret;
  }
}

/**
 * Validate the status code and message body of a fixed response
 *
 * @internal
 */
export function validateFixedResponse(fixedResponse: FixedResponse) {
  if (fixedResponse.statusCode && !/^(2|4|5)\d\d$/.test(fixedResponse.statusCode)) {
    throw new Error('`statusCode` must be 2XX, 4XX or 5XX.');
  }

  if (fixedResponse.messageBody && fixedResponse.messageBody.length > 1024) {
    throw new Error('`messageBody` cannot have more than 1024 characters.');
  }
}

/**
 * Validate the status code and message body of a redirect response
 *
 * @internal
 */
export function validateRedirectResponse(redirectResponse: RedirectResponse) {
  if (redirectResponse.protocol && !/^(HTTPS?|#\{protocol\})$/i.test(redirectResponse.protocol)) {
    throw new Error('`protocol` must be HTTP, HTTPS, or #{protocol}.');
  }

  if (!redirectResponse.statusCode || !/^HTTP_30[12]$/.test(redirectResponse.statusCode)) {
    throw new Error('`statusCode` must be HTTP_301 or HTTP_302.');
  }
}
