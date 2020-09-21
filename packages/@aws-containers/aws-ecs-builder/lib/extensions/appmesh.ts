import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { Service } from '../service';
import { Container } from './container';
import { ServiceExtension, ServiceBuild } from './extension-interfaces';

// A map of AWS account ID's which hold the App Mesh image in various
// regions
const APPMESH_ECR_ACCOUNTS = {
  ME_SOUTH_1: { accountID: 772975370895 },
  AP_EAST_1: { accountID: 856666278305 },
  DEFAULT: { accountID: 840364872350 },
};

// The version of the App Mesh envoy sidecar to add to the task.
const APP_MESH_ENVOY_SIDECAR_VERSION = 'v1.15.0.0-prod';

/**
 * The settings for the App Mesh extension.
 */
export interface MeshProps {
  /**
   * The service mesh into which to register the service
   */
  readonly mesh: appmesh.Mesh;

  /**
   * The protocol of the service.
   * Valid values are Protocol.HTTP, Protocol.HTTP2, Protocol.TCP, Protocol.GRPC
   * @default - Protocol.HTTP
   */
  readonly protocol?: appmesh.Protocol;
}

/**
 * This extension adds an Envoy sidecar to the task definition and
 * creates the App Mesh resources required to route network traffic
 * to the container in a service mesh.
 *
 * The service will then be available to other App Mesh services at the
 * address `<service name>.<environment name>`. For example a service called
 * `orders` deploying in an environment called `production` would be accessible
 * to other App Mesh enabled services at the address `http://orders.production`
 */
export class AppMeshExtension extends ServiceExtension {
  protected virtualNode!: appmesh.VirtualNode;
  protected virtualService!: appmesh.VirtualService;
  protected virtualRouter!: appmesh.VirtualRouter;
  protected route!: appmesh.Route;
  private mesh: appmesh.Mesh;

  /**
   * The protocol used for AppMesh routing.
   * default - Protocol.HTTP
   */
  public readonly protocol: appmesh.Protocol;

  constructor(props: MeshProps) {
    super('appmesh');
    this.mesh = props.mesh;

    if (props.protocol) {
      this.protocol = props.protocol;
    } else {
      this.protocol = appmesh.Protocol.HTTP;
    }
  }

  public prehook(service: Service, scope: cdk.Construct) {
    this.parentService = service;
    this.scope = scope;

    // Make sure that the parent cluster for this service has
    // a namespace attached.
    if (!this.parentService.cluster.defaultCloudMapNamespace) {
      this.parentService.cluster.addDefaultCloudMapNamespace({
        // Name the namespace after the environment name.
        // Service DNS will be like <service id>.<environment id>
        name: this.parentService.environment.id,
      });
    }
  }

  public modifyTaskDefinitionProps(props: ecs.TaskDefinitionProps) {
    // Find the app extension, to get its port
    const containerextension = this.parentService.serviceDescription.get('service-container') as Container;

    if (!containerextension) {
      throw new Error('Appmesh extension requires an application extension');
    }

    return {
      ...props,

      // App Mesh requires AWS VPC networking mode so that each
      // task can have its own IP address
      networkMode: ecs.NetworkMode.AWS_VPC,

      // This configures the envoy container as a proxy for all
      // traffic going into and out of the task, with a few exceptions
      // for metadata endpoints or other ports that need direct
      // communication
      proxyConfiguration: new ecs.AppMeshProxyConfiguration({
        containerName: 'envoy',
        properties: {
          appPorts: [containerextension.trafficPort],
          proxyEgressPort: 15001,
          proxyIngressPort: 15000,

          // The App Mesh proxy runs with this user ID, and this keeps its
          // own outbound connections from recursively attempting to infinitely proxy.
          ignoredUID: 1337,

          // This GID is ignored and any outbound traffic originating from containers that
          // use this group ID will be ignored by the proxy. This is primarily utilized by
          // the FireLens extension, so that outbound application logs don't have to go through Envoy
          // and therefore add extra burden to the proxy sidecar. Instead the logs can go directly
          // to CloudWatch
          ignoredGID: 1338,

          egressIgnoredIPs: [
            '169.254.170.2', // Allow services to talk directly to ECS metadata endpoints
            '169.254.169.254', // and EC2 instance endpoint
          ],

          // If there is outbound traffic to specific ports that you want to
          // ignore the proxy those ports can be added here.
          egressIgnoredPorts: [],
        },
      }),
    } as ecs.TaskDefinitionProps;
  }

  public useTaskDefinition(taskDefinition: ecs.TaskDefinition) {
    var region = cdk.Stack.of(this.scope).region;
    var appMeshRepo;

    // This is currently necessary because App Mesh has different images in each region,
    // and some regions have their images in a different account. See:
    // https://docs.aws.amazon.com/app-mesh/latest/userguide/envoy.html
    const mapping = new cdk.CfnMapping(this.scope, `${this.parentService.id}-envoy-image-account-mapping`, {
      mapping: {
        'af-south-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'eu-north-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'ap-south-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'eu-west-3': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'eu-west-2': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'eu-south-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'eu-west-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'ap-northeast-3': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'ap-northeast-2': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'ap-northeast-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'sa-east-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'ca-central-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'ap-southeast-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'ap-southeast-2': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'eu-central-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'us-east-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'us-east-2': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'us-west-1': APPMESH_ECR_ACCOUNTS.DEFAULT,
        'us-west-2': APPMESH_ECR_ACCOUNTS.DEFAULT,

        // These two region have different account IDs
        'me-south-1': APPMESH_ECR_ACCOUNTS.ME_SOUTH_1,
        'ap-east-1': APPMESH_ECR_ACCOUNTS.AP_EAST_1,
      },
    });

    // WHEN
    const ownerAccount = mapping.findInMap(region, 'accountID');

    appMeshRepo = ecr.Repository.fromRepositoryAttributes(
      this.scope,
      `${this.parentService.id}-envoy-repo`,
      {
        repositoryName: 'aws-appmesh-envoy',
        repositoryArn: `arn:aws:ecr:${region}:${ownerAccount}:repository/aws-appmesh-envoy`,
      },
    );

    this.container = taskDefinition.addContainer('envoy', {
      image: ecs.ContainerImage.fromEcrRepository(appMeshRepo, APP_MESH_ENVOY_SIDECAR_VERSION),
      essential: true,
      environment: {
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${this.mesh.meshName}/virtualNode/${this.parentService.id}`,
        AWS_REGION: cdk.Stack.of(this.parentService).region,
        ENABLE_ENVOY_STATS_TAGS: '1',
        ENABLE_ENVOY_DOG_STATSD: '1',
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE',
        ],
        startPeriod: cdk.Duration.seconds(10),
        interval: cdk.Duration.seconds(5),
        timeout: cdk.Duration.seconds(2),
      },
      memoryReservationMiB: 128,
      user: '1337',
      logging: new ecs.AwsLogDriver({ streamPrefix: 'envoy' }),
    });

    // Modify the task definition role to allow the Envoy sidecar to get
    // configuration from the Envoy control plane, for this particular
    // mesh only.
    const policy = new iam.Policy(this.scope, `${this.parentService.id}-envoy-to-appmesh`);

    const statement = new iam.PolicyStatement();
    statement.addResources(this.mesh.meshArn);
    statement.addActions('appmesh:StreamAggregatedResources');

    policy.addStatements(statement);
    policy.attachToRole(taskDefinition.taskRole);

    // Raise the number of open file descriptors allowed. This is
    // necessary when the Envoy proxy is handling large amounts of
    // traffic.
    this.container.addUlimits({
      softLimit: 1024000,
      hardLimit: 1024000,
      name: ecs.UlimitName.NOFILE,
    });
  }

  // Enable CloudMap for the service.
  public modifyServiceProps(props: ServiceBuild) {
    return {
      ...props,

      // Ensure that service tasks are registered into
      // CloudMap so that the App Mesh proxy can find them.
      cloudMapOptions: {
        dnsRecordType: 'A',
        dnsTtl: cdk.Duration.seconds(10),
        failureThreshold: 2,
        name: this.parentService.id,
      },

      // These specific deployment settings are currently required in order to
      // maintain availability during a rolling deploy of the service with App Mesh
      // https://docs.aws.amazon.com/app-mesh/latest/userguide/best-practices.html#reduce-deployment-velocity
      minHealthyPercent: 100,
      maxHealthyPercent: 125, // Note that at low task count the Service will boost this setting higher
    } as ServiceBuild;
  }

  // Now that the service is defined we can create the AppMesh virtual service
  // and virtual node for the real service
  public useService(service: ecs.Ec2Service | ecs.FargateService) {
    const containerextension = this.parentService.serviceDescription.get('service-container') as Container;

    if (!containerextension) {
      throw new Error('Firelens extension requires an application extension');
    }

    const cloudmapNamespace = this.parentService.cluster.defaultCloudMapNamespace;

    if (!cloudmapNamespace) {
      throw new Error('You must add a CloudMap namespace to the ECS cluster in order to use the AppMesh extension');
    }

    // Create a virtual node for the name service
    this.virtualNode = new appmesh.VirtualNode(this.scope, `${this.parentService.id}-virtual-node`, {
      mesh: this.mesh,
      virtualNodeName: this.parentService.id,
      cloudMapService: service.cloudMapService,
      listener: {
        portMapping: {
          port: containerextension.trafficPort,
          protocol: this.protocol,
        },
      },
    });

    // Create a virtual router for this service. This allows for retries
    // and other similar behaviors.
    this.virtualRouter = new appmesh.VirtualRouter(this.scope, `${this.parentService.id}-virtual-router`, {
      mesh: this.mesh,
      listener: {
        portMapping: {
          port: containerextension.trafficPort,
          protocol: this.protocol,
        },
      },
      virtualRouterName: `${this.parentService.id}`,
    });

    // Now add the virtual node as a route in the virtual router
    this.route = this.virtualRouter.addRoute(`${this.parentService.id}-route`, {
      routeTargets: [{
        virtualNode: this.virtualNode,
        weight: 1,
      }],
      // Ensure that the route type matches the protocol type.
      routeType: this.protocol == appmesh.Protocol.HTTP ? appmesh.RouteType.HTTP : appmesh.RouteType.TCP,
    });

    // Now create a virtual service. Relationship goes like this:
    // virtual service -> virtual router -> virtual node
    this.virtualService = new appmesh.VirtualService(this.scope, `${this.parentService.id}-virtual-service`, {
      mesh: this.mesh,
      virtualRouter: this.virtualRouter,
      virtualServiceName: `${this.parentService.id}.${cloudmapNamespace.namespaceName}`,
    });
  }

  // Connect the app mesh extension for this service to an app mesh
  // extension on another service.
  public connectToService(otherService: Service) {
    const otherAppMesh = otherService.serviceDescription.get('appmesh') as AppMeshExtension;
    const otherContainer = otherService.serviceDescription.get('service-container') as Container;

    // Do a check to ensure that these services are in the same environment.
    // Currently this extension only supports connecting services within
    // the same VPC, same App Mesh service mesh, and same Cloud Map namespace
    if (otherAppMesh.parentService.environment.id !== this.parentService.environment.id) {
      throw new Error(`Unable to connect service '${this.parentService.id}' in environment '${this.parentService.environment.id}' to service '${otherService.id}' in environment '${otherAppMesh.parentService.environment.id}' because services can not be connected across environment boundaries`);
    }

    // First allow this service to talk to the other service
    // at a network level. This opens the security groups so that
    // the security groups of these two services to each other
    this.parentService.service.connections.allowTo(
      otherService.service,
      ec2.Port.tcp(otherContainer.trafficPort),
      `Accept inbound traffic from ${this.parentService.id}`,
    );

    // Next update the app mesh config so that the local Envoy
    // proxy on this service knows how to route traffic to
    // nodes from the other service.
    this.virtualNode.addBackends(otherAppMesh.virtualService);
  }
}
