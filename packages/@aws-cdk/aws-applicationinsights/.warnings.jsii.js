function _aws_cdk_aws_applicationinsights_CfnApplicationProps(p) {
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
function _aws_cdk_aws_applicationinsights_CfnApplication(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_AlarmProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_AlarmMetricProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_ComponentConfigurationProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_ComponentMonitoringSettingProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_ConfigurationDetailsProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_CustomComponentProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_HAClusterPrometheusExporterProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_HANAPrometheusExporterProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_JMXPrometheusExporterProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_LogProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_LogPatternProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_LogPatternSetProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_SubComponentConfigurationDetailsProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_SubComponentTypeConfigurationProperty(p) {
}
function _aws_cdk_aws_applicationinsights_CfnApplication_WindowsEventProperty(p) {
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
module.exports = { print, getPropertyDescriptor, DeprecationError, _aws_cdk_aws_applicationinsights_CfnApplicationProps, _aws_cdk_aws_applicationinsights_CfnApplication, _aws_cdk_aws_applicationinsights_CfnApplication_AlarmProperty, _aws_cdk_aws_applicationinsights_CfnApplication_AlarmMetricProperty, _aws_cdk_aws_applicationinsights_CfnApplication_ComponentConfigurationProperty, _aws_cdk_aws_applicationinsights_CfnApplication_ComponentMonitoringSettingProperty, _aws_cdk_aws_applicationinsights_CfnApplication_ConfigurationDetailsProperty, _aws_cdk_aws_applicationinsights_CfnApplication_CustomComponentProperty, _aws_cdk_aws_applicationinsights_CfnApplication_HAClusterPrometheusExporterProperty, _aws_cdk_aws_applicationinsights_CfnApplication_HANAPrometheusExporterProperty, _aws_cdk_aws_applicationinsights_CfnApplication_JMXPrometheusExporterProperty, _aws_cdk_aws_applicationinsights_CfnApplication_LogProperty, _aws_cdk_aws_applicationinsights_CfnApplication_LogPatternProperty, _aws_cdk_aws_applicationinsights_CfnApplication_LogPatternSetProperty, _aws_cdk_aws_applicationinsights_CfnApplication_SubComponentConfigurationDetailsProperty, _aws_cdk_aws_applicationinsights_CfnApplication_SubComponentTypeConfigurationProperty, _aws_cdk_aws_applicationinsights_CfnApplication_WindowsEventProperty };
