/**
 * All known Lambda runtime families.
 */
export declare enum RuntimeFamily {
    /**
     * All Lambda runtimes that depend on Node.js.
     */
    NODEJS = 0,
    /**
     * All lambda runtimes that depend on Python.
     */
    PYTHON = 1,
    /**
     * Any future runtime family.
     */
    OTHER = 2
}
/**
 * Runtime options for a canary
 */
export declare class Runtime {
    readonly name: string;
    readonly family: RuntimeFamily;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-1.0` includes the following:
     *
     * - Synthetics library 1.0
     * - Synthetics handler code 1.0
     * - Lambda runtime Node.js 10.x
     * - Puppeteer-core version 1.14.0
     * - The Chromium version that matches Puppeteer-core 1.14.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-1.0
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_1_0: Runtime;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-nodejs-2.0` includes the following:
     * - Lambda runtime Node.js 10.x
     * - Puppeteer-core version 3.3.0
     * - Chromium version 83.0.4103.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-2.0
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_2_0: Runtime;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-nodejs-2.1` includes the following:
     * - Lambda runtime Node.js 10.x
     * - Puppeteer-core version 3.3.0
     * - Chromium version 83.0.4103.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-2.1
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_2_1: Runtime;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-nodejs-2.2` includes the following:
     * - Lambda runtime Node.js 10.x
     * - Puppeteer-core version 3.3.0
     * - Chromium version 83.0.4103.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-2.2
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_2_2: Runtime;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-nodejs-puppeteer-3.0` includes the following:
     * - Lambda runtime Node.js 12.x
     * - Puppeteer-core version 5.5.0
     * - Chromium version 88.0.4298.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.0
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_0: Runtime;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-nodejs-puppeteer-3.1` includes the following:
     * - Lambda runtime Node.js 12.x
     * - Puppeteer-core version 5.5.0
     * - Chromium version 88.0.4298.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.1
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_1: Runtime;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-nodejs-puppeteer-3.2` includes the following:
     * - Lambda runtime Node.js 12.x
     * - Puppeteer-core version 5.5.0
     * - Chromium version 88.0.4298.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.2
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_2: Runtime;
    /**
     * `syn-nodejs-puppeteer-3.3` includes the following:
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * - Lambda runtime Node.js 12.x
     * - Puppeteer-core version 5.5.0
     * - Chromium version 88.0.4298.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.3
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_3: Runtime;
    /**
     * **Deprecated by AWS Synthetics. You can't create canaries with deprecated runtimes.**
     *
     * `syn-nodejs-puppeteer-3.4` includes the following:
     * - Lambda runtime Node.js 12.x
     * - Puppeteer-core version 5.5.0
     * - Chromium version 88.0.4298.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.4
     * @deprecated Use the latest version instead
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_4: Runtime;
    /**
     * `syn-nodejs-puppeteer-3.5` includes the following:
     * - Lambda runtime Node.js 14.x
     * - Puppeteer-core version 10.1.0
     * - Chromium version 92.0.4512
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.5
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_5: Runtime;
    /**
     * `syn-nodejs-puppeteer-3.6` includes the following:
     * - Lambda runtime Node.js 14.x
     * - Puppeteer-core version 10.1.0
     * - Chromium version 92.0.4512
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.6
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_6: Runtime;
    /**
     * `syn-nodejs-puppeteer-3.7` includes the following:
     * - Lambda runtime Node.js 14.x
     * - Puppeteer-core version 10.1.0
     * - Chromium version 92.0.4512
     *
     * New Features:
     * - **Logging enhancement**: The canary will upload logs to Amazon S3 even if it times out or crashes.
     * - **Lambda layer size reduced**: The size of the Lambda layer used for canaries is reduced by 34%.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.7
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_7: Runtime;
    /**
     * `syn-nodejs-puppeteer-3.8` includes the following:
     * - Lambda runtime Node.js 14.x
     * - Puppeteer-core version 10.1.0
     * - Chromium version 92.0.4512
     *
     * New Features:
     * - **Profile cleanup**: Chromium profiles are now cleaned up after each canary run.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.8
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_8: Runtime;
    /**
     * `syn-nodejs-puppeteer-3.9` includes the following:
     *
     * - Lambda runtime Node.js 14.x
     * - Puppeteer-core version 5.5.0
     * - Chromium version 92.0.4512
     *
     * New Features:
     * - **Dependency upgrades**: Upgrades some third-party dependency packages.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-3.9
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_3_9: Runtime;
    /**
     * `syn-nodejs-puppeteer-4.0` includes the following:
     * - Lambda runtime Node.js 16.x
     * - Puppeteer-core version 5.5.0
     * - Chromium version 92.0.4512
     *
     * New Features:
     * - **Dependency upgrades**: The Node.js dependency is updated to 16.x.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-4.0
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_4_0: Runtime;
    /**
     * `syn-nodejs-puppeteer-5.0` includes the following:
     * - Lambda runtime Node.js 16.x
     * - Puppeteer-core version 19.7.0
     * - Chromium version 111.0.5563.146
     *
     * New Features:
     * - **Dependency upgrade**: The Puppeteer-core version is updated to 19.7.0. The Chromium version is upgraded to 111.0.5563.146.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-5.0
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_5_0: Runtime;
    /**
     * `syn-nodejs-puppeteer-5.1` includes the following:
     * - Lambda runtime Node.js 16.x
     * - Puppeteer-core version 19.7.0
     * - Chromium version 111.0.5563.146
     *
     * Bug fixes:
     * - **Bug fix**: This runtime fixes a bug in `syn-nodejs-puppeteer-5.0` where the HAR files created by the canaries were missing request headers.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_nodejs_puppeteer.html#CloudWatch_Synthetics_runtimeversion-nodejs-puppeteer-5.1
     */
    static readonly SYNTHETICS_NODEJS_PUPPETEER_5_1: Runtime;
    /**
     * `syn-python-selenium-1.0` includes the following:
     * - Lambda runtime Python 3.8
     * - Selenium version 3.141.0
     * - Chromium version 83.0.4103.0
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_python_selenium.html#CloudWatch_Synthetics_runtimeversion-syn-python-selenium-1.0
     */
    static readonly SYNTHETICS_PYTHON_SELENIUM_1_0: Runtime;
    /**
     * `syn-python-selenium-1.1` includes the following:
     * - Lambda runtime Python 3.8
     * - Selenium version 3.141.0
     * - Chromium version 83.0.4103.0
     *
     * New Features:
     * - **Custom handler function**: You can now use a custom handler function for your canary scripts.
     * - **Configuration options for adding metrics and step failure configurations**: These options were already available in runtimes for Node.js canaries.
     * - **Custom arguments in Chrome**: You can now open a browser in incognito mode or pass in proxy server configuration.
     * - **Cross-Region artifact buckets**: A canary can store its artifacts in an Amazon S3 bucket in a different Region.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_python_selenium.html#CloudWatch_Synthetics_runtimeversion-syn-python-selenium-1.1
     */
    static readonly SYNTHETICS_PYTHON_SELENIUM_1_1: Runtime;
    /**
     * `syn-python-selenium-1.2` includes the following:
     * - Lambda runtime Python 3.8
     * - Selenium version 3.141.0
     * - Chromium version 92.0.4512.0
     *
     * New Features:
     * - **Updated dependencies**: The only new features in this runtime are the updated dependencies.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_python_selenium.html#CloudWatch_Synthetics_runtimeversion-syn-python-selenium-1.2
     */
    static readonly SYNTHETICS_PYTHON_SELENIUM_1_2: Runtime;
    /**
     * `syn-python-selenium-1.3` includes the following:
     * - Lambda runtime Python 3.8
     * - Selenium version 3.141.0
     * - Chromium version 92.0.4512.0
     *
     * New Features:
     * - **More precise timestamps**: The start time and stop time of canary runs are now precise to the millisecond.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Library_python_selenium.html#CloudWatch_Synthetics_runtimeversion-syn-python-selenium-1.3
     */
    static readonly SYNTHETICS_PYTHON_SELENIUM_1_3: Runtime;
    /**
      * @param name The name of the runtime version
      * @param family The Lambda runtime family
      */
    constructor(name: string, family: RuntimeFamily);
}
