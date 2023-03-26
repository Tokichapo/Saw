function _aws_cdk_aws_appintegrations_CfnDataIntegrationProps(p) {
    if (p == null)
        return;
    visitedObjects.add(p);
    try {
        if (!visitedObjects.has(p.scheduleConfig))
            _aws_cdk_aws_appintegrations_CfnDataIntegration_ScheduleConfigProperty(p.scheduleConfig);
        if (p.tags != null)
            for (const o of p.tags)
                if (!visitedObjects.has(o))
                    require("@aws-cdk/core/.warnings.jsii.js")._aws_cdk_core_CfnTag(o);
    }
    finally {
        visitedObjects.delete(p);
    }
}
function _aws_cdk_aws_appintegrations_CfnDataIntegration(p) {
}
function _aws_cdk_aws_appintegrations_CfnDataIntegration_ScheduleConfigProperty(p) {
}
function _aws_cdk_aws_appintegrations_CfnEventIntegrationProps(p) {
    if (p == null)
        return;
    visitedObjects.add(p);
    try {
        if (p.tags != null)
            for (const o of p.tags)
                if (!visitedObjects.has(o))
                    require("@aws-cdk/core/.warnings.jsii.js")._aws_cdk_core_CfnTag(o);
    }
    finally {
        visitedObjects.delete(p);
    }
}
function _aws_cdk_aws_appintegrations_CfnEventIntegration(p) {
}
function _aws_cdk_aws_appintegrations_CfnEventIntegration_EventFilterProperty(p) {
}
function _aws_cdk_aws_appintegrations_CfnEventIntegration_EventIntegrationAssociationProperty(p) {
}
function _aws_cdk_aws_appintegrations_CfnEventIntegration_MetadataProperty(p) {
}
function print(name, deprecationMessage) {
    const deprecated = process.env.JSII_DEPRECATED;
    const deprecationMode = ["warn", "fail", "quiet"].includes(deprecated) ? deprecated : "warn";
    const message = `${name} is deprecated.\n  ${deprecationMessage.trim()}\n  This API will be removed in the next major release.`;
    switch (deprecationMode) {
        case "fail":
            throw new DeprecationError(message);
        case "warn":
            console.warn("[WARNING]", message);
            break;
    }
}
function getPropertyDescriptor(obj, prop) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (descriptor) {
        return descriptor;
    }
    const proto = Object.getPrototypeOf(obj);
    const prototypeDescriptor = proto && getPropertyDescriptor(proto, prop);
    if (prototypeDescriptor) {
        return prototypeDescriptor;
    }
    return {};
}
const visitedObjects = new Set();
class DeprecationError extends Error {
    constructor(...args) {
        super(...args);
        Object.defineProperty(this, "name", {
            configurable: false,
            enumerable: true,
            value: "DeprecationError",
            writable: false,
        });
    }
}
module.exports = { print, getPropertyDescriptor, DeprecationError, _aws_cdk_aws_appintegrations_CfnDataIntegrationProps, _aws_cdk_aws_appintegrations_CfnDataIntegration, _aws_cdk_aws_appintegrations_CfnDataIntegration_ScheduleConfigProperty, _aws_cdk_aws_appintegrations_CfnEventIntegrationProps, _aws_cdk_aws_appintegrations_CfnEventIntegration, _aws_cdk_aws_appintegrations_CfnEventIntegration_EventFilterProperty, _aws_cdk_aws_appintegrations_CfnEventIntegration_EventIntegrationAssociationProperty, _aws_cdk_aws_appintegrations_CfnEventIntegration_MetadataProperty };
