export interface AwsSdkMetadata {
  readonly [service: string]: {
    readonly name: string;
    readonly cors?: boolean;
    readonly dualstackAvailable?: boolean;
    readonly prefix?: string;
    readonly versions?: readonly string[];
    readonly xmlNoDefaultLists?: boolean;
    readonly [key: string]: unknown;
  };
}

/* eslint-disable */
/* tslint:disable */

/**
 * Extracted from aws-sdk version 2.1292.0 (Apache-2.0).
 */
export const metadata: AwsSdkMetadata = {
  "acm": {
    "name": "ACM",
    "cors": true
  },
  "apigateway": {
    "name": "APIGateway",
    "cors": true
  },
  "applicationautoscaling": {
    "prefix": "application-autoscaling",
    "name": "ApplicationAutoScaling",
    "cors": true
  },
  "appstream": {
    "name": "AppStream"
  },
  "autoscaling": {
    "name": "AutoScaling",
    "cors": true
  },
  "batch": {
    "name": "Batch"
  },
  "budgets": {
    "name": "Budgets"
  },
  "clouddirectory": {
    "name": "CloudDirectory",
    "versions": [
      "2016-05-10*"
    ]
  },
  "cloudformation": {
    "name": "CloudFormation",
    "cors": true
  },
  "cloudfront": {
    "name": "CloudFront",
    "versions": [
      "2013-05-12*",
      "2013-11-11*",
      "2014-05-31*",
      "2014-10-21*",
      "2014-11-06*",
      "2015-04-17*",
      "2015-07-27*",
      "2015-09-17*",
      "2016-01-13*",
      "2016-01-28*",
      "2016-08-01*",
      "2016-08-20*",
      "2016-09-07*",
      "2016-09-29*",
      "2016-11-25*",
      "2017-03-25*",
      "2017-10-30*",
      "2018-06-18*",
      "2018-11-05*",
      "2019-03-26*"
    ],
    "cors": true
  },
  "cloudhsm": {
    "name": "CloudHSM",
    "cors": true
  },
  "cloudsearch": {
    "name": "CloudSearch"
  },
  "cloudsearchdomain": {
    "name": "CloudSearchDomain"
  },
  "cloudtrail": {
    "name": "CloudTrail",
    "cors": true
  },
  "cloudwatch": {
    "prefix": "monitoring",
    "name": "CloudWatch",
    "cors": true
  },
  "cloudwatchevents": {
    "prefix": "events",
    "name": "CloudWatchEvents",
    "versions": [
      "2014-02-03*"
    ],
    "cors": true
  },
  "cloudwatchlogs": {
    "prefix": "logs",
    "name": "CloudWatchLogs",
    "cors": true
  },
  "codebuild": {
    "name": "CodeBuild",
    "cors": true
  },
  "codecommit": {
    "name": "CodeCommit",
    "cors": true
  },
  "codedeploy": {
    "name": "CodeDeploy",
    "cors": true
  },
  "codepipeline": {
    "name": "CodePipeline",
    "cors": true
  },
  "cognitoidentity": {
    "prefix": "cognito-identity",
    "name": "CognitoIdentity",
    "cors": true
  },
  "cognitoidentityserviceprovider": {
    "prefix": "cognito-idp",
    "name": "CognitoIdentityServiceProvider",
    "cors": true
  },
  "cognitosync": {
    "prefix": "cognito-sync",
    "name": "CognitoSync",
    "cors": true
  },
  "configservice": {
    "prefix": "config",
    "name": "ConfigService",
    "cors": true
  },
  "cur": {
    "name": "CUR",
    "cors": true
  },
  "datapipeline": {
    "name": "DataPipeline"
  },
  "devicefarm": {
    "name": "DeviceFarm",
    "cors": true
  },
  "directconnect": {
    "name": "DirectConnect",
    "cors": true
  },
  "directoryservice": {
    "prefix": "ds",
    "name": "DirectoryService"
  },
  "discovery": {
    "name": "Discovery"
  },
  "dms": {
    "name": "DMS"
  },
  "dynamodb": {
    "name": "DynamoDB",
    "cors": true
  },
  "dynamodbstreams": {
    "prefix": "streams.dynamodb",
    "name": "DynamoDBStreams",
    "cors": true
  },
  "ec2": {
    "name": "EC2",
    "versions": [
      "2013-06-15*",
      "2013-10-15*",
      "2014-02-01*",
      "2014-05-01*",
      "2014-06-15*",
      "2014-09-01*",
      "2014-10-01*",
      "2015-03-01*",
      "2015-04-15*",
      "2015-10-01*",
      "2016-04-01*",
      "2016-09-15*"
    ],
    "cors": true
  },
  "ecr": {
    "name": "ECR",
    "cors": true
  },
  "ecs": {
    "name": "ECS",
    "cors": true
  },
  "efs": {
    "prefix": "elasticfilesystem",
    "name": "EFS",
    "cors": true
  },
  "elasticache": {
    "name": "ElastiCache",
    "versions": [
      "2012-11-15*",
      "2014-03-24*",
      "2014-07-15*",
      "2014-09-30*"
    ],
    "cors": true
  },
  "elasticbeanstalk": {
    "name": "ElasticBeanstalk",
    "cors": true
  },
  "elb": {
    "prefix": "elasticloadbalancing",
    "name": "ELB",
    "cors": true
  },
  "elbv2": {
    "prefix": "elasticloadbalancingv2",
    "name": "ELBv2",
    "cors": true
  },
  "emr": {
    "prefix": "elasticmapreduce",
    "name": "EMR",
    "cors": true
  },
  "es": {
    "name": "ES"
  },
  "elastictranscoder": {
    "name": "ElasticTranscoder",
    "cors": true
  },
  "firehose": {
    "name": "Firehose",
    "cors": true
  },
  "gamelift": {
    "name": "GameLift",
    "cors": true
  },
  "glacier": {
    "name": "Glacier"
  },
  "health": {
    "name": "Health"
  },
  "iam": {
    "name": "IAM",
    "cors": true
  },
  "importexport": {
    "name": "ImportExport"
  },
  "inspector": {
    "name": "Inspector",
    "versions": [
      "2015-08-18*"
    ],
    "cors": true
  },
  "iot": {
    "name": "Iot",
    "cors": true
  },
  "iotdata": {
    "prefix": "iot-data",
    "name": "IotData",
    "cors": true
  },
  "kinesis": {
    "name": "Kinesis",
    "cors": true
  },
  "kinesisanalytics": {
    "name": "KinesisAnalytics"
  },
  "kms": {
    "name": "KMS",
    "cors": true
  },
  "lambda": {
    "name": "Lambda",
    "cors": true
  },
  "lexruntime": {
    "prefix": "runtime.lex",
    "name": "LexRuntime",
    "cors": true
  },
  "lightsail": {
    "name": "Lightsail"
  },
  "machinelearning": {
    "name": "MachineLearning",
    "cors": true
  },
  "marketplacecommerceanalytics": {
    "name": "MarketplaceCommerceAnalytics",
    "cors": true
  },
  "marketplacemetering": {
    "prefix": "meteringmarketplace",
    "name": "MarketplaceMetering"
  },
  "mturk": {
    "prefix": "mturk-requester",
    "name": "MTurk",
    "cors": true
  },
  "mobileanalytics": {
    "name": "MobileAnalytics",
    "cors": true
  },
  "opsworks": {
    "name": "OpsWorks",
    "cors": true
  },
  "opsworkscm": {
    "name": "OpsWorksCM"
  },
  "organizations": {
    "name": "Organizations"
  },
  "pinpoint": {
    "name": "Pinpoint"
  },
  "polly": {
    "name": "Polly",
    "cors": true
  },
  "rds": {
    "name": "RDS",
    "versions": [
      "2014-09-01*"
    ],
    "cors": true
  },
  "redshift": {
    "name": "Redshift",
    "cors": true
  },
  "rekognition": {
    "name": "Rekognition",
    "cors": true
  },
  "resourcegroupstaggingapi": {
    "name": "ResourceGroupsTaggingAPI"
  },
  "route53": {
    "name": "Route53",
    "cors": true
  },
  "route53domains": {
    "name": "Route53Domains",
    "cors": true
  },
  "s3": {
    "name": "S3",
    "dualstackAvailable": true,
    "cors": true
  },
  "s3control": {
    "name": "S3Control",
    "dualstackAvailable": true,
    "xmlNoDefaultLists": true
  },
  "servicecatalog": {
    "name": "ServiceCatalog",
    "cors": true
  },
  "ses": {
    "prefix": "email",
    "name": "SES",
    "cors": true
  },
  "shield": {
    "name": "Shield"
  },
  "simpledb": {
    "prefix": "sdb",
    "name": "SimpleDB"
  },
  "sms": {
    "name": "SMS"
  },
  "snowball": {
    "name": "Snowball"
  },
  "sns": {
    "name": "SNS",
    "cors": true
  },
  "sqs": {
    "name": "SQS",
    "cors": true
  },
  "ssm": {
    "name": "SSM",
    "cors": true
  },
  "storagegateway": {
    "name": "StorageGateway",
    "cors": true
  },
  "stepfunctions": {
    "prefix": "states",
    "name": "StepFunctions"
  },
  "sts": {
    "name": "STS",
    "cors": true
  },
  "support": {
    "name": "Support"
  },
  "swf": {
    "name": "SWF"
  },
  "xray": {
    "name": "XRay",
    "cors": true
  },
  "waf": {
    "name": "WAF",
    "cors": true
  },
  "wafregional": {
    "prefix": "waf-regional",
    "name": "WAFRegional"
  },
  "workdocs": {
    "name": "WorkDocs",
    "cors": true
  },
  "workspaces": {
    "name": "WorkSpaces"
  },
  "codestar": {
    "name": "CodeStar"
  },
  "lexmodelbuildingservice": {
    "prefix": "lex-models",
    "name": "LexModelBuildingService",
    "cors": true
  },
  "marketplaceentitlementservice": {
    "prefix": "entitlement.marketplace",
    "name": "MarketplaceEntitlementService"
  },
  "athena": {
    "name": "Athena",
    "cors": true
  },
  "greengrass": {
    "name": "Greengrass"
  },
  "dax": {
    "name": "DAX"
  },
  "migrationhub": {
    "prefix": "AWSMigrationHub",
    "name": "MigrationHub"
  },
  "cloudhsmv2": {
    "name": "CloudHSMV2",
    "cors": true
  },
  "glue": {
    "name": "Glue"
  },
  "mobile": {
    "name": "Mobile"
  },
  "pricing": {
    "name": "Pricing",
    "cors": true
  },
  "costexplorer": {
    "prefix": "ce",
    "name": "CostExplorer",
    "cors": true
  },
  "mediaconvert": {
    "name": "MediaConvert"
  },
  "medialive": {
    "name": "MediaLive"
  },
  "mediapackage": {
    "name": "MediaPackage"
  },
  "mediastore": {
    "name": "MediaStore"
  },
  "mediastoredata": {
    "prefix": "mediastore-data",
    "name": "MediaStoreData",
    "cors": true
  },
  "appsync": {
    "name": "AppSync"
  },
  "guardduty": {
    "name": "GuardDuty"
  },
  "mq": {
    "name": "MQ"
  },
  "comprehend": {
    "name": "Comprehend",
    "cors": true
  },
  "iotjobsdataplane": {
    "prefix": "iot-jobs-data",
    "name": "IoTJobsDataPlane"
  },
  "kinesisvideoarchivedmedia": {
    "prefix": "kinesis-video-archived-media",
    "name": "KinesisVideoArchivedMedia",
    "cors": true
  },
  "kinesisvideomedia": {
    "prefix": "kinesis-video-media",
    "name": "KinesisVideoMedia",
    "cors": true
  },
  "kinesisvideo": {
    "name": "KinesisVideo",
    "cors": true
  },
  "sagemakerruntime": {
    "prefix": "runtime.sagemaker",
    "name": "SageMakerRuntime"
  },
  "sagemaker": {
    "name": "SageMaker"
  },
  "translate": {
    "name": "Translate",
    "cors": true
  },
  "resourcegroups": {
    "prefix": "resource-groups",
    "name": "ResourceGroups",
    "cors": true
  },
  "alexaforbusiness": {
    "name": "AlexaForBusiness"
  },
  "cloud9": {
    "name": "Cloud9"
  },
  "serverlessapplicationrepository": {
    "prefix": "serverlessrepo",
    "name": "ServerlessApplicationRepository"
  },
  "servicediscovery": {
    "name": "ServiceDiscovery"
  },
  "workmail": {
    "name": "WorkMail"
  },
  "autoscalingplans": {
    "prefix": "autoscaling-plans",
    "name": "AutoScalingPlans"
  },
  "transcribeservice": {
    "prefix": "transcribe",
    "name": "TranscribeService"
  },
  "connect": {
    "name": "Connect",
    "cors": true
  },
  "acmpca": {
    "prefix": "acm-pca",
    "name": "ACMPCA"
  },
  "fms": {
    "name": "FMS"
  },
  "secretsmanager": {
    "name": "SecretsManager",
    "cors": true
  },
  "iotanalytics": {
    "name": "IoTAnalytics",
    "cors": true
  },
  "iot1clickdevicesservice": {
    "prefix": "iot1click-devices",
    "name": "IoT1ClickDevicesService"
  },
  "iot1clickprojects": {
    "prefix": "iot1click-projects",
    "name": "IoT1ClickProjects"
  },
  "pi": {
    "name": "PI"
  },
  "neptune": {
    "name": "Neptune"
  },
  "mediatailor": {
    "name": "MediaTailor"
  },
  "eks": {
    "name": "EKS"
  },
  "macie": {
    "name": "Macie"
  },
  "dlm": {
    "name": "DLM"
  },
  "signer": {
    "name": "Signer"
  },
  "chime": {
    "name": "Chime"
  },
  "pinpointemail": {
    "prefix": "pinpoint-email",
    "name": "PinpointEmail"
  },
  "ram": {
    "name": "RAM"
  },
  "route53resolver": {
    "name": "Route53Resolver"
  },
  "pinpointsmsvoice": {
    "prefix": "sms-voice",
    "name": "PinpointSMSVoice"
  },
  "quicksight": {
    "name": "QuickSight"
  },
  "rdsdataservice": {
    "prefix": "rds-data",
    "name": "RDSDataService"
  },
  "amplify": {
    "name": "Amplify"
  },
  "datasync": {
    "name": "DataSync"
  },
  "robomaker": {
    "name": "RoboMaker"
  },
  "transfer": {
    "name": "Transfer"
  },
  "globalaccelerator": {
    "name": "GlobalAccelerator"
  },
  "comprehendmedical": {
    "name": "ComprehendMedical",
    "cors": true
  },
  "kinesisanalyticsv2": {
    "name": "KinesisAnalyticsV2"
  },
  "mediaconnect": {
    "name": "MediaConnect"
  },
  "fsx": {
    "name": "FSx"
  },
  "securityhub": {
    "name": "SecurityHub"
  },
  "appmesh": {
    "name": "AppMesh",
    "versions": [
      "2018-10-01*"
    ]
  },
  "licensemanager": {
    "prefix": "license-manager",
    "name": "LicenseManager"
  },
  "kafka": {
    "name": "Kafka"
  },
  "apigatewaymanagementapi": {
    "name": "ApiGatewayManagementApi"
  },
  "apigatewayv2": {
    "name": "ApiGatewayV2"
  },
  "docdb": {
    "name": "DocDB"
  },
  "backup": {
    "name": "Backup"
  },
  "worklink": {
    "name": "WorkLink"
  },
  "textract": {
    "name": "Textract"
  },
  "managedblockchain": {
    "name": "ManagedBlockchain"
  },
  "mediapackagevod": {
    "prefix": "mediapackage-vod",
    "name": "MediaPackageVod"
  },
  "groundstation": {
    "name": "GroundStation"
  },
  "iotthingsgraph": {
    "name": "IoTThingsGraph"
  },
  "iotevents": {
    "name": "IoTEvents"
  },
  "ioteventsdata": {
    "prefix": "iotevents-data",
    "name": "IoTEventsData"
  },
  "personalize": {
    "name": "Personalize",
    "cors": true
  },
  "personalizeevents": {
    "prefix": "personalize-events",
    "name": "PersonalizeEvents",
    "cors": true
  },
  "personalizeruntime": {
    "prefix": "personalize-runtime",
    "name": "PersonalizeRuntime",
    "cors": true
  },
  "applicationinsights": {
    "prefix": "application-insights",
    "name": "ApplicationInsights"
  },
  "servicequotas": {
    "prefix": "service-quotas",
    "name": "ServiceQuotas"
  },
  "ec2instanceconnect": {
    "prefix": "ec2-instance-connect",
    "name": "EC2InstanceConnect"
  },
  "eventbridge": {
    "name": "EventBridge"
  },
  "lakeformation": {
    "name": "LakeFormation"
  },
  "forecastservice": {
    "prefix": "forecast",
    "name": "ForecastService",
    "cors": true
  },
  "forecastqueryservice": {
    "prefix": "forecastquery",
    "name": "ForecastQueryService",
    "cors": true
  },
  "qldb": {
    "name": "QLDB"
  },
  "qldbsession": {
    "prefix": "qldb-session",
    "name": "QLDBSession"
  },
  "workmailmessageflow": {
    "name": "WorkMailMessageFlow"
  },
  "codestarnotifications": {
    "prefix": "codestar-notifications",
    "name": "CodeStarNotifications"
  },
  "savingsplans": {
    "name": "SavingsPlans"
  },
  "sso": {
    "name": "SSO"
  },
  "ssooidc": {
    "prefix": "sso-oidc",
    "name": "SSOOIDC"
  },
  "marketplacecatalog": {
    "prefix": "marketplace-catalog",
    "name": "MarketplaceCatalog",
    "cors": true
  },
  "dataexchange": {
    "name": "DataExchange"
  },
  "sesv2": {
    "name": "SESV2"
  },
  "migrationhubconfig": {
    "prefix": "migrationhub-config",
    "name": "MigrationHubConfig"
  },
  "connectparticipant": {
    "name": "ConnectParticipant"
  },
  "appconfig": {
    "name": "AppConfig"
  },
  "iotsecuretunneling": {
    "name": "IoTSecureTunneling"
  },
  "wafv2": {
    "name": "WAFV2"
  },
  "elasticinference": {
    "prefix": "elastic-inference",
    "name": "ElasticInference"
  },
  "imagebuilder": {
    "name": "Imagebuilder"
  },
  "schemas": {
    "name": "Schemas"
  },
  "accessanalyzer": {
    "name": "AccessAnalyzer"
  },
  "codegurureviewer": {
    "prefix": "codeguru-reviewer",
    "name": "CodeGuruReviewer"
  },
  "codeguruprofiler": {
    "name": "CodeGuruProfiler"
  },
  "computeoptimizer": {
    "prefix": "compute-optimizer",
    "name": "ComputeOptimizer"
  },
  "frauddetector": {
    "name": "FraudDetector"
  },
  "kendra": {
    "name": "Kendra"
  },
  "networkmanager": {
    "name": "NetworkManager"
  },
  "outposts": {
    "name": "Outposts"
  },
  "augmentedairuntime": {
    "prefix": "sagemaker-a2i-runtime",
    "name": "AugmentedAIRuntime"
  },
  "ebs": {
    "name": "EBS"
  },
  "kinesisvideosignalingchannels": {
    "prefix": "kinesis-video-signaling",
    "name": "KinesisVideoSignalingChannels",
    "cors": true
  },
  "detective": {
    "name": "Detective"
  },
  "codestarconnections": {
    "prefix": "codestar-connections",
    "name": "CodeStarconnections"
  },
  "synthetics": {
    "name": "Synthetics"
  },
  "iotsitewise": {
    "name": "IoTSiteWise"
  },
  "macie2": {
    "name": "Macie2"
  },
  "codeartifact": {
    "name": "CodeArtifact"
  },
  "honeycode": {
    "name": "Honeycode"
  },
  "ivs": {
    "name": "IVS"
  },
  "braket": {
    "name": "Braket"
  },
  "identitystore": {
    "name": "IdentityStore"
  },
  "appflow": {
    "name": "Appflow"
  },
  "redshiftdata": {
    "prefix": "redshift-data",
    "name": "RedshiftData"
  },
  "ssoadmin": {
    "prefix": "sso-admin",
    "name": "SSOAdmin"
  },
  "timestreamquery": {
    "prefix": "timestream-query",
    "name": "TimestreamQuery"
  },
  "timestreamwrite": {
    "prefix": "timestream-write",
    "name": "TimestreamWrite"
  },
  "s3outposts": {
    "name": "S3Outposts"
  },
  "databrew": {
    "name": "DataBrew"
  },
  "servicecatalogappregistry": {
    "prefix": "servicecatalog-appregistry",
    "name": "ServiceCatalogAppRegistry"
  },
  "networkfirewall": {
    "prefix": "network-firewall",
    "name": "NetworkFirewall"
  },
  "mwaa": {
    "name": "MWAA"
  },
  "amplifybackend": {
    "name": "AmplifyBackend"
  },
  "appintegrations": {
    "name": "AppIntegrations"
  },
  "connectcontactlens": {
    "prefix": "connect-contact-lens",
    "name": "ConnectContactLens"
  },
  "devopsguru": {
    "prefix": "devops-guru",
    "name": "DevOpsGuru"
  },
  "ecrpublic": {
    "prefix": "ecr-public",
    "name": "ECRPUBLIC"
  },
  "lookoutvision": {
    "name": "LookoutVision"
  },
  "sagemakerfeaturestoreruntime": {
    "prefix": "sagemaker-featurestore-runtime",
    "name": "SageMakerFeatureStoreRuntime"
  },
  "customerprofiles": {
    "prefix": "customer-profiles",
    "name": "CustomerProfiles"
  },
  "auditmanager": {
    "name": "AuditManager"
  },
  "emrcontainers": {
    "prefix": "emr-containers",
    "name": "EMRcontainers"
  },
  "healthlake": {
    "name": "HealthLake"
  },
  "sagemakeredge": {
    "prefix": "sagemaker-edge",
    "name": "SagemakerEdge"
  },
  "amp": {
    "name": "Amp"
  },
  "greengrassv2": {
    "name": "GreengrassV2"
  },
  "iotdeviceadvisor": {
    "name": "IotDeviceAdvisor"
  },
  "iotfleethub": {
    "name": "IoTFleetHub"
  },
  "iotwireless": {
    "name": "IoTWireless"
  },
  "location": {
    "name": "Location",
    "cors": true
  },
  "wellarchitected": {
    "name": "WellArchitected"
  },
  "lexmodelsv2": {
    "prefix": "models.lex.v2",
    "name": "LexModelsV2"
  },
  "lexruntimev2": {
    "prefix": "runtime.lex.v2",
    "name": "LexRuntimeV2",
    "cors": true
  },
  "fis": {
    "name": "Fis"
  },
  "lookoutmetrics": {
    "name": "LookoutMetrics"
  },
  "mgn": {
    "name": "Mgn"
  },
  "lookoutequipment": {
    "name": "LookoutEquipment"
  },
  "nimble": {
    "name": "Nimble"
  },
  "finspace": {
    "name": "Finspace"
  },
  "finspacedata": {
    "prefix": "finspace-data",
    "name": "Finspacedata"
  },
  "ssmcontacts": {
    "prefix": "ssm-contacts",
    "name": "SSMContacts"
  },
  "ssmincidents": {
    "prefix": "ssm-incidents",
    "name": "SSMIncidents"
  },
  "applicationcostprofiler": {
    "name": "ApplicationCostProfiler"
  },
  "apprunner": {
    "name": "AppRunner"
  },
  "proton": {
    "name": "Proton"
  },
  "route53recoverycluster": {
    "prefix": "route53-recovery-cluster",
    "name": "Route53RecoveryCluster"
  },
  "route53recoverycontrolconfig": {
    "prefix": "route53-recovery-control-config",
    "name": "Route53RecoveryControlConfig"
  },
  "route53recoveryreadiness": {
    "prefix": "route53-recovery-readiness",
    "name": "Route53RecoveryReadiness"
  },
  "chimesdkidentity": {
    "prefix": "chime-sdk-identity",
    "name": "ChimeSDKIdentity"
  },
  "chimesdkmessaging": {
    "prefix": "chime-sdk-messaging",
    "name": "ChimeSDKMessaging"
  },
  "snowdevicemanagement": {
    "prefix": "snow-device-management",
    "name": "SnowDeviceManagement"
  },
  "memorydb": {
    "name": "MemoryDB"
  },
  "opensearch": {
    "name": "OpenSearch"
  },
  "kafkaconnect": {
    "name": "KafkaConnect"
  },
  "voiceid": {
    "prefix": "voice-id",
    "name": "VoiceID"
  },
  "wisdom": {
    "name": "Wisdom"
  },
  "account": {
    "name": "Account"
  },
  "cloudcontrol": {
    "name": "CloudControl"
  },
  "grafana": {
    "name": "Grafana"
  },
  "panorama": {
    "name": "Panorama"
  },
  "chimesdkmeetings": {
    "prefix": "chime-sdk-meetings",
    "name": "ChimeSDKMeetings"
  },
  "resiliencehub": {
    "name": "Resiliencehub"
  },
  "migrationhubstrategy": {
    "name": "MigrationHubStrategy"
  },
  "appconfigdata": {
    "name": "AppConfigData"
  },
  "drs": {
    "name": "Drs"
  },
  "migrationhubrefactorspaces": {
    "prefix": "migration-hub-refactor-spaces",
    "name": "MigrationHubRefactorSpaces"
  },
  "evidently": {
    "name": "Evidently"
  },
  "inspector2": {
    "name": "Inspector2"
  },
  "rbin": {
    "name": "Rbin"
  },
  "rum": {
    "name": "RUM"
  },
  "backupgateway": {
    "prefix": "backup-gateway",
    "name": "BackupGateway"
  },
  "iottwinmaker": {
    "name": "IoTTwinMaker"
  },
  "workspacesweb": {
    "prefix": "workspaces-web",
    "name": "WorkSpacesWeb"
  },
  "amplifyuibuilder": {
    "name": "AmplifyUIBuilder"
  },
  "keyspaces": {
    "name": "Keyspaces"
  },
  "billingconductor": {
    "name": "Billingconductor"
  },
  "gamesparks": {
    "name": "GameSparks"
  },
  "pinpointsmsvoicev2": {
    "prefix": "pinpoint-sms-voice-v2",
    "name": "PinpointSMSVoiceV2"
  },
  "ivschat": {
    "name": "Ivschat"
  },
  "chimesdkmediapipelines": {
    "prefix": "chime-sdk-media-pipelines",
    "name": "ChimeSDKMediaPipelines"
  },
  "emrserverless": {
    "prefix": "emr-serverless",
    "name": "EMRServerless"
  },
  "m2": {
    "name": "M2"
  },
  "connectcampaigns": {
    "name": "ConnectCampaigns"
  },
  "redshiftserverless": {
    "prefix": "redshift-serverless",
    "name": "RedshiftServerless"
  },
  "rolesanywhere": {
    "name": "RolesAnywhere"
  },
  "licensemanagerusersubscriptions": {
    "prefix": "license-manager-user-subscriptions",
    "name": "LicenseManagerUserSubscriptions"
  },
  "backupstorage": {
    "name": "BackupStorage"
  },
  "privatenetworks": {
    "name": "PrivateNetworks"
  },
  "supportapp": {
    "prefix": "support-app",
    "name": "SupportApp"
  },
  "controltower": {
    "name": "ControlTower"
  },
  "iotfleetwise": {
    "name": "IoTFleetWise"
  },
  "migrationhuborchestrator": {
    "name": "MigrationHubOrchestrator"
  },
  "connectcases": {
    "name": "ConnectCases"
  },
  "resourceexplorer2": {
    "prefix": "resource-explorer-2",
    "name": "ResourceExplorer2"
  },
  "scheduler": {
    "name": "Scheduler"
  },
  "chimesdkvoice": {
    "prefix": "chime-sdk-voice",
    "name": "ChimeSDKVoice"
  },
  "iotroborunner": {
    "prefix": "iot-roborunner",
    "name": "IoTRoboRunner"
  },
  "ssmsap": {
    "prefix": "ssm-sap",
    "name": "SsmSap"
  },
  "oam": {
    "name": "OAM"
  },
  "arczonalshift": {
    "prefix": "arc-zonal-shift",
    "name": "ARCZonalShift"
  },
  "omics": {
    "name": "Omics"
  },
  "opensearchserverless": {
    "name": "OpenSearchServerless"
  },
  "securitylake": {
    "name": "SecurityLake"
  },
  "simspaceweaver": {
    "name": "SimSpaceWeaver"
  },
  "docdbelastic": {
    "prefix": "docdb-elastic",
    "name": "DocDBElastic"
  },
  "sagemakergeospatial": {
    "prefix": "sagemaker-geospatial",
    "name": "SageMakerGeospatial"
  },
  "codecatalyst": {
    "name": "CodeCatalyst"
  },
  "pipes": {
    "name": "Pipes"
  },
  "sagemakermetrics": {
    "prefix": "sagemaker-metrics",
    "name": "SageMakerMetrics"
  },
  "kinesisvideowebrtcstorage": {
    "prefix": "kinesis-video-webrtc-storage",
    "name": "KinesisVideoWebRTCStorage"
  },
  "licensemanagerlinuxsubscriptions": {
    "prefix": "license-manager-linux-subscriptions",
    "name": "LicenseManagerLinuxSubscriptions"
  },
  "kendraranking": {
    "prefix": "kendra-ranking",
    "name": "KendraRanking"
  }
};