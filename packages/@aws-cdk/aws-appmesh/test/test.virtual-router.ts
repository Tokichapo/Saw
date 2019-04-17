import { expect, haveResourceLike } from '@aws-cdk/assert';
import ec2 = require('@aws-cdk/aws-ec2');
import cloudmap = require('@aws-cdk/aws-servicediscovery');
import cdk = require('@aws-cdk/cdk');
import { Test } from 'nodeunit';

import appmesh = require('../lib');

export = {
  'When adding route to existing VirtualRouter': {
    'should create route resource'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      const mesh = new appmesh.Mesh(stack, 'mesh', {
        meshName: 'test-mesh',
      });

      const router = mesh.addVirtualRouter('router', {
        portMappings: [
          {
            port: 8080,
            protocol: appmesh.Protocol.HTTP,
          },
        ],
      });

      const vpc = new ec2.VpcNetwork(stack, 'vpc');
      const namespace = new cloudmap.PrivateDnsNamespace(stack, 'test-namespace', {
        vpc,
        name: 'domain.local',
      });

      const node = mesh.addVirtualNode('test-node', {
        hostname: 'test',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
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

      // THEN
      expect(stack).to(
        haveResourceLike('AWS::AppMesh::Route', {
          RouteName: 'route-1',
          Spec: {
            HttpRoute: {
              Action: {
                WeightedTargets: [
                  {
                    VirtualNode: {
                      'Fn::GetAtt': ['meshtestnodeVirtualNodeDC4F77E5', 'VirtualNodeName'],
                    },
                    Weight: 50,
                  },
                ],
              },
              Match: {
                Prefix: '/',
              },
            },
          },
          VirtualRouterName: {
            'Fn::GetAtt': ['meshrouterVirtualRouter7C7DE72C', 'VirtualRouterName'],
          },
        })
      );

      test.done();
    },
  },
  'When adding routes to a VirtualRouter with existing routes': {
    'should add routes and not overwrite'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      const mesh = new appmesh.Mesh(stack, 'mesh', {
        meshName: 'test-mesh',
      });

      const router = mesh.addVirtualRouter('router', {
        portMappings: [
          {
            port: 8080,
            protocol: appmesh.Protocol.HTTP,
          },
        ],
      });

      const vpc = new ec2.VpcNetwork(stack, 'vpc');
      const namespace = new cloudmap.PrivateDnsNamespace(stack, 'test-namespace', {
        vpc,
        name: 'domain.local',
      });

      const node = mesh.addVirtualNode('test-node', {
        hostname: 'test',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
      });
      const node2 = mesh.addVirtualNode('test-node2', {
        hostname: 'test',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
      });
      const node3 = mesh.addVirtualNode('test-node3', {
        hostname: 'test',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
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
            prefix: '/path3',
            isHttpRoute: true,
          },
        ]
      );

      // THEN
      expect(stack).to(
        haveResourceLike('AWS::AppMesh::Route', {
          RouteName: 'route-1',
          Spec: {
            HttpRoute: {
              Action: {
                WeightedTargets: [
                  {
                    VirtualNode: {
                      'Fn::GetAtt': ['meshtestnodeVirtualNodeDC4F77E5', 'VirtualNodeName'],
                    },
                    Weight: 50,
                  },
                ],
              },
              Match: {
                Prefix: '/',
              },
            },
          },
        })
      );
      expect(stack).to(
        haveResourceLike('AWS::AppMesh::Route', {
          RouteName: 'route-2',
          Spec: {
            HttpRoute: {
              Action: {
                WeightedTargets: [
                  {
                    VirtualNode: {
                      'Fn::GetAtt': ['meshtestnode2VirtualNodeB854548C', 'VirtualNodeName'],
                    },
                    Weight: 30,
                  },
                ],
              },
              Match: {
                Prefix: '/path2',
              },
            },
          },
        })
      );
      expect(stack).to(
        haveResourceLike('AWS::AppMesh::Route', {
          RouteName: 'route-3',
          Spec: {
            HttpRoute: {
              Action: {
                WeightedTargets: [
                  {
                    VirtualNode: {
                      'Fn::GetAtt': ['meshtestnode3VirtualNode74A3FFF9', 'VirtualNodeName'],
                    },
                    Weight: 20,
                  },
                ],
              },
              Match: {
                Prefix: '/path3',
              },
            },
          },
        })
      );

      test.done();
    },
  },
  'When adding a TCP route to existing VirtualRouter': {
    'should create route resource'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      const mesh = new appmesh.Mesh(stack, 'mesh', {
        meshName: 'test-mesh',
      });

      const router = mesh.addVirtualRouter('router', {
        portMappings: [
          {
            port: 8080,
            protocol: appmesh.Protocol.TCP,
          },
        ],
      });

      const vpc = new ec2.VpcNetwork(stack, 'vpc');
      const namespace = new cloudmap.PrivateDnsNamespace(stack, 'test-namespace', {
        vpc,
        name: 'domain.local',
      });

      const node = mesh.addVirtualNode('test-node', {
        hostname: 'test',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
      });

      router.addRoute('route-tcp-1', {
        routeTargets: [
          {
            virtualNode: node,
            weight: 50,
          },
        ],
      });

      // THEN
      expect(stack).to(
        haveResourceLike('AWS::AppMesh::Route', {
          RouteName: 'route-tcp-1',
          Spec: {
            TcpRoute: {
              Action: {
                WeightedTargets: [
                  {
                    VirtualNode: {
                      'Fn::GetAtt': ['meshtestnodeVirtualNodeDC4F77E5', 'VirtualNodeName'],
                    },
                    Weight: 50,
                  },
                ],
              },
            },
          },
          VirtualRouterName: {
            'Fn::GetAtt': ['meshrouterVirtualRouter7C7DE72C', 'VirtualRouterName'],
          },
        })
      );

      test.done();
    },
  },
  'When adding multiple routes with empty id array': {
    'should throw error'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      const mesh = new appmesh.Mesh(stack, 'mesh', {
        meshName: 'test-mesh',
      });

      const router = mesh.addVirtualRouter('router', {
        portMappings: [
          {
            port: 8080,
            protocol: appmesh.Protocol.HTTP,
          },
        ],
      });

      const vpc = new ec2.VpcNetwork(stack, 'vpc');
      const namespace = new cloudmap.PrivateDnsNamespace(stack, 'test-namespace', {
        vpc,
        name: 'domain.local',
      });

      const node = mesh.addVirtualNode('test-node', {
        hostname: 'test',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
      });

      const node2 = mesh.addVirtualNode('test-node2', {
        hostname: 'test2',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
      });

      // THEN
      test.throws(() => {
        router.addRoutes(
          [],
          [
            {
              routeTargets: [
                {
                  virtualNode: node,
                  weight: 30,
                },
              ],
              prefix: '/path2',
              isHttpRoute: true,
            },
            {
              routeTargets: [
                {
                  virtualNode: node2,
                  weight: 20,
                },
              ],
              prefix: '/path3',
              isHttpRoute: true,
            },
          ]
        );
      });

      test.done();
    },
  },
  'When adding multiple routes with empty route props array': {
    'should throw error'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      const mesh = new appmesh.Mesh(stack, 'mesh', {
        meshName: 'test-mesh',
      });

      const router = mesh.addVirtualRouter('router', {
        portMappings: [
          {
            port: 8080,
            protocol: appmesh.Protocol.HTTP,
          },
        ],
      });

      // THEN
      test.throws(() => {
        router.addRoutes(['route-1', 'route-2'], []);
      });

      test.done();
    },
  },
  'When adding multiple routes with unequal ids and route properties': {
    'should throw error'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      const mesh = new appmesh.Mesh(stack, 'mesh', {
        meshName: 'test-mesh',
      });

      const router = mesh.addVirtualRouter('router', {
        portMappings: [
          {
            port: 8080,
            protocol: appmesh.Protocol.HTTP,
          },
        ],
      });

      const vpc = new ec2.VpcNetwork(stack, 'vpc');
      const namespace = new cloudmap.PrivateDnsNamespace(stack, 'test-namespace', {
        vpc,
        name: 'domain.local',
      });

      const node = mesh.addVirtualNode('test-node', {
        hostname: 'test',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
      });

      const node2 = mesh.addVirtualNode('test-node2', {
        hostname: 'test2',
        namespace,
        listener: {
          portMappings: [
            {
              port: 8080,
              protocol: appmesh.Protocol.HTTP,
            },
          ],
        },
        backends: [
          {
            virtualServiceName: `test.service.backend`,
          },
        ],
      });

      // THEN
      test.throws(() => {
        router.addRoutes(
          ['route-1'],
          [
            {
              routeTargets: [
                {
                  virtualNode: node,
                  weight: 30,
                },
              ],
              prefix: '/path2',
              isHttpRoute: true,
            },
            {
              routeTargets: [
                {
                  virtualNode: node2,
                  weight: 20,
                },
              ],
              prefix: '/path3',
              isHttpRoute: true,
            },
          ]
        );
      });
      test.throws(() => {
        router.addRoutes(
          ['route-1', 'route-2'],
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
          ]
        );
      });

      test.done();
    },
  },
};
