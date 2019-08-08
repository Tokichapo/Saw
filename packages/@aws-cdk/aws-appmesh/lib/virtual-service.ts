import cdk = require('@aws-cdk/core');

import { CfnVirtualService } from './appmesh.generated';
import { IMesh } from './mesh';
import { IVirtualNode } from './virtual-node';
import { IVirtualRouter } from './virtual-router';

/**
 * Represents the interface which all VirtualService based classes MUST implement
 */
export interface IVirtualService extends cdk.IResource {
  /**
   * The name of the VirtualService, it is recommended this follows the fully-qualified domain name format.
   *
   * @attribute
   */
  readonly virtualServiceName: string;

  /**
   * The Amazon Resource Name (ARN) for the virtual service
   *
   * @attribute
   */
  readonly virtualServiceArn: string;
}

/**
 * The base properties which all classes in VirtualService will inherit from
 */
export interface VirtualServiceBaseProps {
  /**
   * The name of the VirtualService, it is recommended this follows the fully-qualified domain name format.
   *
   * @example service.domain.local
   */
  readonly virtualServiceName: string;

  /**
   * The VirtualRouter which the VirtualService uses as provider
   *
   * @default - At most one of virtualRouter and virtualNode is allowed.
   */
  readonly virtualRouter?: IVirtualRouter;

  /**
   * The VirtualNode attached to the virtual service
   *
   * @default - At most one of virtualRouter and virtualNode is allowed.
   */
  readonly virtualNode?: IVirtualNode;
}

/**
 * The properties applied to the VirtualService being define
 */
export interface VirtualServiceProps extends VirtualServiceBaseProps {
  /**
   * The AppMesh mesh name for whiich the VirtualService belongs to
   */
  readonly mesh: IMesh;
}

/**
 * VirtualService represents a service inside an AppMesh
 *
 * @see https://docs.aws.amazon.com/app-mesh/latest/userguide/virtual_services.html
 */
export class VirtualService extends cdk.Resource implements IVirtualService {
  /**
   * Import an existing VirtualService given an ARN
   */
  public static fromVirtualServiceArn(scope: cdk.Construct, id: string, virtualServiceArn: string): IVirtualService {
    return new  ImportedVirtualService(scope, id,  {
      virtualServiceArn,
    });
  }

  /**
   * Import an existing VirtualService given mesh and service names
   */
  public static fromVirtualServiceName(scope: cdk.Construct, id: string, meshName: string, virtualServiceName: string): IVirtualService {
    return new ImportedVirtualService(scope, id, {
      meshName,
      virtualServiceName,
    });
  }

  /**
   * The name of the VirtualService, it is recommended this follows the fully-qualified domain name format.
   */
  public readonly virtualServiceName: string;

  /**
   * The Amazon Resource Name (ARN) for the virtual service
   */
  public readonly virtualServiceArn: string;

  /**
   * The name of the VirtualRouter which the VirtualService uses as provider
   */
  // public readonly virtualRouter?: IVirtualRouter;

  /**
   * The name of the VirtualNode attached to the virtual service
   */
  // public readonly virtualNode?: IVirtualNode;

  private readonly virtualServiceProvider?: CfnVirtualService.VirtualServiceProviderProperty;
  private readonly mesh: IMesh;

  constructor(scope: cdk.Construct, id: string, props: VirtualServiceProps) {
    super(scope, id);

    if (props.virtualNode && props.virtualRouter) {
      throw new Error('Must provide only one of virtualNode or virtualRouter for the provider');
    }

    this.mesh = props.mesh;

    // Check which provider to use node or router
    if (props.virtualRouter) {
      this.virtualServiceProvider = this.addVirtualRouter(props.virtualRouter.virtualRouterName);
    } else if (props.virtualNode) {
      this.virtualServiceProvider = this.addVirtualNode(props.virtualNode.virtualNodeName);
    }

    const name = props.virtualServiceName;

    const svc = new CfnVirtualService(this, 'VirtualService', {
      meshName: this.mesh.meshName,
      virtualServiceName: name,
      spec: {
        provider: this.virtualServiceProvider,
      },
    });

    this.virtualServiceArn = svc.ref;
    this.virtualServiceName = svc.virtualServiceName;
  }

  private addVirtualRouter(name: string): CfnVirtualService.VirtualServiceProviderProperty {
    return {
      virtualRouter: {
        virtualRouterName: name,
      },
    };
  }

  private addVirtualNode(name: string): CfnVirtualService.VirtualServiceProviderProperty {
    return {
      virtualNode: {
        virtualNodeName: name,
      },
    };
  }
}

/**
 * Interface with properties ncecessary to import a reusable VirtualService
 */
interface VirtualServiceAttributes {
  /**
   * The Amazon Resource Name (ARN) for the virtual service
   *
   * @default - Required if virtualServiceName and virtualMeshName are not supplied.
   */
  readonly virtualServiceArn?: string;

  /**
   * The name of the VirtualService, it is recommended this follows the fully-qualified domain name format.
   *
   * @default - Required if virtualServiceArn is not supplied.
   */
  readonly virtualServiceName?: string;

  /**
   * The name of the service mesh that the virtual service resides in
   *
   * Used to derive ARN from mesh name if ARN not provided
   *
   * @default - Required if virtualServiceArn is not supplied.
   */
  readonly meshName?: string;
}

/**
 * Returns properties that allows a VirtualService to be imported
 */
class ImportedVirtualService extends cdk.Resource implements IVirtualService {
  /**
   * The name of the VirtualService, it is recommended this follows the fully-qualified domain name format.
   */
  public readonly virtualServiceName: string;

  /**
   * The Amazon Resource Name (ARN) for the virtual service
   */
  public readonly virtualServiceArn: string;

  constructor(scope: cdk.Construct, id: string, props: VirtualServiceAttributes) {
    super(scope, id);

    if (props.virtualServiceArn) {
      this.virtualServiceArn = props.virtualServiceArn;
      this.virtualServiceName = cdk.Fn.select(2, cdk.Fn.split('/', cdk.Stack.of(scope).parseArn(props.virtualServiceArn).resourceName!));
    } else if (props.virtualServiceName && props.meshName) {
      this.virtualServiceName = props.virtualServiceName;
      this.virtualServiceArn = cdk.Stack.of(this).formatArn({
        service: 'appmesh',
        resource: `mesh/${props.meshName}/virtualService`,
        resourceName: this.virtualServiceName,
      });
    } else {
      throw new Error('Need either arn or both names');
    }
  }
}
