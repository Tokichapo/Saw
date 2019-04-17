import ec2 = require('@aws-cdk/aws-ec2');
import cloudmap = require('@aws-cdk/aws-servicediscovery');
import cdk = require('@aws-cdk/cdk');

import * as appmesh from '../lib/';

export const app = new cdk.App();

const stack = new cdk.Stack(app, 'mesh-stack', {});

const vpc = new ec2.VpcNetwork(stack, 'vpc', {
  natGateways: 1,
});

const namespace = new cloudmap.PrivateDnsNamespace(stack, 'test-namespace', {
  vpc,
  name: 'domain.local',
});

const mesh = new appmesh.Mesh(stack, 'mesh');
const router = mesh.addVirtualRouter('router', {
  portMappings: [
    {
      port: 8080,
      protocol: appmesh.Protocol.HTTP,
    },
  ],
});

mesh.addVirtualService('service', {
  virtualRouter: router,
  virtualServiceName: `service1.domain.local`,
});

const node = mesh.addVirtualNode('node', {
  hostname: 'node1',
  namespace,
  listener: {
    portMappings: [
      {
        port: 8080,
        protocol: appmesh.Protocol.HTTP,
      },
    ],
    healthChecks: [
      {
        healthyThreshold: 3,
        intervalMillis: 5000,
        path: '/check-path',
        port: 8080,
        protocol: appmesh.Protocol.HTTP,
        timeoutMillis: 2000,
        unhealthyThreshold: 2,
      },
    ],
  },
  backends: [
    {
      virtualServiceName: `service2.domain.local`,
    },
  ],
});

node.addBackend({
  virtualServiceName: `service3.domain.local`,
});

router.addRoute('route-1', {
  routeTargets: [
    {
      virtualNode: node,
      weight: 50,
    },
  ],
  prefix: '/',
  isHttpRoute: true,
});

const node2 = mesh.addVirtualNode('node2', {
  hostname: 'node2',
  namespace,
  listener: {
    portMappings: [
      {
        port: 8080,
        protocol: appmesh.Protocol.HTTP,
      },
    ],
    healthChecks: [
      {
        healthyThreshold: 3,
        intervalMillis: 5000,
        path: '/check-path2',
        port: 8080,
        protocol: appmesh.Protocol.HTTP,
        timeoutMillis: 2000,
        unhealthyThreshold: 2,
      },
    ],
  },
  backends: [
    {
      virtualServiceName: `service2.domain.local`,
    },
  ],
});

const node3 = mesh.addVirtualNode('node3', {
  hostname: 'node3',
  namespace,
  listener: {
    portMappings: [
      {
        port: 8080,
        protocol: appmesh.Protocol.HTTP,
      },
    ],
    healthChecks: [
      {
        healthyThreshold: 3,
        intervalMillis: 5000,
        path: '/check-path3',
        port: 8080,
        protocol: appmesh.Protocol.HTTP,
        timeoutMillis: 2000,
        unhealthyThreshold: 2,
      },
    ],
  },
});

router.addRoutes(
  ['route-2', 'route-3'],
  [
    {
      routeTargets: [
        {
          virtualNode: node2,
          weight: 30,
        },
      ],
      prefix: '/path2',
      isHttpRoute: true,
    },
    {
      routeTargets: [
        {
          virtualNode: node3,
          weight: 20,
        },
      ],
    },
  ]
);
