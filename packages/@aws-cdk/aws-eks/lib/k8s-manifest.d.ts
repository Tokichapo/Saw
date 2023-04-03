import { Construct } from 'constructs';
import { AlbScheme } from './alb-controller';
import { ICluster } from './cluster';
/**
 * Options for `KubernetesManifest`.
 */
export interface KubernetesManifestOptions {
    /**
     * When a resource is removed from a Kubernetes manifest, it no longer appears
     * in the manifest, and there is no way to know that this resource needs to be
     * deleted. To address this, `kubectl apply` has a `--prune` option which will
     * query the cluster for all resources with a specific label and will remove
     * all the labeld resources that are not part of the applied manifest. If this
     * option is disabled and a resource is removed, it will become "orphaned" and
     * will not be deleted from the cluster.
     *
     * When this option is enabled (default), the construct will inject a label to
     * all Kubernetes resources included in this manifest which will be used to
     * prune resources when the manifest changes via `kubectl apply --prune`.
     *
     * The label name will be `aws.cdk.eks/prune-<ADDR>` where `<ADDR>` is the
     * 42-char unique address of this construct in the construct tree. Value is
     * empty.
     *
     * @see
     * https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/#alternative-kubectl-apply-f-directory-prune-l-your-label
     *
     * @default - based on the prune option of the cluster, which is `true` unless
     * otherwise specified.
     */
    readonly prune?: boolean;
    /**
     * A flag to signify if the manifest validation should be skipped
     *
     * @default false
     */
    readonly skipValidation?: boolean;
    /**
     * Automatically detect `Ingress` resources in the manifest and annotate them so they
     * are picked up by an ALB Ingress Controller.
     *
     * @default false
     */
    readonly ingressAlb?: boolean;
    /**
     * Specify the ALB scheme that should be applied to `Ingress` resources.
     * Only applicable if `ingressAlb` is set to `true`.
     *
     * @default AlbScheme.INTERNAL
     */
    readonly ingressAlbScheme?: AlbScheme;
}
/**
 * Properties for KubernetesManifest
 */
export interface KubernetesManifestProps extends KubernetesManifestOptions {
    /**
     * The EKS cluster to apply this manifest to.
     *
     * [disable-awslint:ref-via-interface]
     */
    readonly cluster: ICluster;
    /**
     * The manifest to apply.
     *
     * Consists of any number of child resources.
     *
     * When the resources are created/updated, this manifest will be applied to the
     * cluster through `kubectl apply` and when the resources or the stack is
     * deleted, the resources in the manifest will be deleted through `kubectl delete`.
     *
     * @example
     *
     * [{
     *   apiVersion: 'v1',
     *   kind: 'Pod',
     *   metadata: { name: 'mypod' },
     *   spec: {
     *     containers: [ { name: 'hello', image: 'paulbouwer/hello-kubernetes:1.5', ports: [ { containerPort: 8080 } ] } ]
     *   }
     * }]
     *
     */
    readonly manifest: Record<string, any>[];
    /**
     * Overwrite any existing resources.
     *
     * If this is set, we will use `kubectl apply` instead of `kubectl create`
     * when the resource is created. Otherwise, if there is already a resource
     * in the cluster with the same name, the operation will fail.
     *
     * @default false
     */
    readonly overwrite?: boolean;
}
/**
 * Represents a manifest within the Kubernetes system.
 *
 * Alternatively, you can use `cluster.addManifest(resource[, resource, ...])`
 * to define resources on this cluster.
 *
 * Applies/deletes the manifest using `kubectl`.
 */
export declare class KubernetesManifest extends Construct {
    /**
     * The CloudFormation reosurce type.
     */
    static readonly RESOURCE_TYPE = "Custom::AWSCDK-EKS-KubernetesResource";
    constructor(scope: Construct, id: string, props: KubernetesManifestProps);
    /**
     * Injects a generated prune label to all resources in this manifest. The
     * label name will be `awscdk.eks/manifest-ADDR` where `ADDR` is the address
     * of the construct in the construct tree.
     *
     * @returns the label name
     */
    private injectPruneLabel;
    /**
     * Inject the necessary ingress annontations if possible (and requested).
     *
     * @see https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/guide/ingress/annotations/
     */
    private injectIngressAlbAnnotations;
}
