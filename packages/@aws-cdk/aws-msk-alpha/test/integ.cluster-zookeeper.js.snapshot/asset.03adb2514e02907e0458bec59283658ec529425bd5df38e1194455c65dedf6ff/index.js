"use strict";var ue=Object.create;var k=Object.defineProperty;var pe=Object.getOwnPropertyDescriptor;var de=Object.getOwnPropertyNames;var me=Object.getPrototypeOf,ge=Object.prototype.hasOwnProperty;var d=(e,t)=>()=>(e&&(t=e(e=0)),t);var ye=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),S=(e,t)=>{for(var a in t)k(e,a,{get:t[a],enumerable:!0})},W=(e,t,a,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of de(t))!ge.call(e,i)&&i!==a&&k(e,i,{get:()=>t[i],enumerable:!(r=pe(t,i))||r.enumerable});return e};var M=(e,t,a)=>(a=e!=null?ue(me(e)):{},W(t||!e||!e.__esModule?k(a,"default",{value:e,enumerable:!0}):a,e)),f=e=>W(k({},"__esModule",{value:!0}),e);function fe(e){return Buffer.isBuffer(e)?e.toString("utf8"):ArrayBuffer.isView(e)?Se.decode(e.buffer):e}function B(e){function t(a,r=[]){return[].concat(...Object.keys(a).map(i=>{let o=fe(a[i]);return typeof o=="object"&&o!==null?t(o,r.concat([i])):{[r.concat([i]).join(".")]:o}}))}return Object.assign({},...t(e))}function V(e,t){return JSON.parse(JSON.stringify(e),(a,r)=>{switch(r){case P:return t;default:return r}})}function I(e,t){return Object.entries(e).reduce((a,[r,i])=>t(r)?{...a,[r]:i}:a,{})}function b(e,t,a,r,i){let o=JSON.stringify({Status:t,Reason:a,PhysicalResourceId:r,StackId:e.StackId,RequestId:e.RequestId,LogicalResourceId:e.LogicalResourceId,NoEcho:!1,Data:i});console.log("Responding",o);let n=require("url").parse(e.ResponseURL),s={hostname:n.hostname,path:n.path,method:"PUT",headers:{"content-type":"","content-length":Buffer.byteLength(o,"utf8")}};return new Promise((u,p)=>{try{let c=require("https").request(s,u);c.on("error",p),c.write(o),c.end()}catch(c){p(c)}})}function y(e){if(e)return JSON.parse(e)}function E(e){return function(t){for(let a of e)if(t.startsWith(a))return!0;return!1}}var P,Se,D=d(()=>{"use strict";P="PHYSICAL:RESOURCEID:",Se=new TextDecoder});var _={};S(_,{forceSdkInstallation:()=>be,handler:()=>Re});function be(){v=!1}function Ce(){console.log("Installing latest AWS SDK v2"),(0,q.execSync)("HOME=/tmp npm install aws-sdk@2 --production --no-package-lock --no-save --prefix /tmp"),v=!0}function he(e){let t=e.apiLoader;return Ae.forEach(({serviceName:a,apiVersions:r})=>{let i=a.toLowerCase();e.Service.hasService(i)?e.Service.addVersions(e[a],r):(t.services[i]={},e[a]=e.Service.defineService(i,r)),r.forEach(o=>{Object.defineProperty(t.services[i],o,{get:function(){let s=`aws-sdk-patch/${i}-${o}`,u=JSON.parse(w.readFileSync((0,L.join)(__dirname,`${s}.service.json`),"utf-8"));return u.paginators=JSON.parse(w.readFileSync((0,L.join)(__dirname,`${s}.paginators.json`),"utf-8")).pagination,u},enumerable:!0,configurable:!0})})}),e}async function Re(e,t){try{let a;if(!v&&e.ResourceProperties.InstallLatestAwsSdk==="true")try{Ce(),a=require("/tmp/node_modules/aws-sdk")}catch(s){console.log(`Failed to install latest AWS SDK v2: ${s}`),a=require("aws-sdk")}else v?a=require("/tmp/node_modules/aws-sdk"):a=require("aws-sdk");try{a=he(a)}catch(s){console.log(`Failed to patch AWS SDK: ${s}. Proceeding with the installed copy.`)}console.log(JSON.stringify({...e,ResponseURL:"..."})),console.log("AWS SDK VERSION: "+a.VERSION),e.ResourceProperties.Create=y(e.ResourceProperties.Create),e.ResourceProperties.Update=y(e.ResourceProperties.Update),e.ResourceProperties.Delete=y(e.ResourceProperties.Delete);let r;switch(e.RequestType){case"Create":r=e.ResourceProperties.Create?.physicalResourceId?.id??e.ResourceProperties.Update?.physicalResourceId?.id??e.ResourceProperties.Delete?.physicalResourceId?.id??e.LogicalResourceId;break;case"Update":case"Delete":r=e.ResourceProperties[e.RequestType]?.physicalResourceId?.id??e.PhysicalResourceId;break}let i={},o={},n=e.ResourceProperties[e.RequestType];if(n){let s;if(n.assumedRoleArn){let p=new Date().getTime(),c={RoleArn:n.assumedRoleArn,RoleSessionName:`${p}-${r}`.substring(0,64)};s=new a.ChainableTemporaryCredentials({params:c,stsConfig:{stsRegionalEndpoints:"regional"}})}if(!Object.prototype.hasOwnProperty.call(a,n.service))throw Error(`Service ${n.service} does not exist in AWS SDK version ${a.VERSION}.`);let u=new a[n.service]({apiVersion:n.apiVersion,credentials:s,region:n.region});try{let p=await u[n.action](n.parameters&&V(n.parameters,r)).promise();i={apiVersion:u.config.apiVersion,region:u.config.region,...B(p)};let c;n.outputPath?c=[n.outputPath]:n.outputPaths&&(c=n.outputPaths),c?o=I(i,E(c)):o=i}catch(p){if(!n.ignoreErrorCodesMatching||!new RegExp(n.ignoreErrorCodesMatching).test(p.code))throw p}n.physicalResourceId?.responsePath&&(r=i[n.physicalResourceId.responsePath])}await b(e,"SUCCESS","OK",r,o)}catch(a){console.log(a),await b(e,"FAILED",a.message||"Internal Error",t.logStreamName,{})}}var q,w,L,v,Ae,N=d(()=>{"use strict";q=require("child_process"),w=M(require("fs")),L=require("path");D();v=!1;Ae=[]});var j,G=d(()=>{"use strict";j={acm:{exportcertificate:["Passphrase"],importcertificate:["Certificate","CertificateChain","PrivateKey"]},"acm-pca":{importcertificateauthoritycertificate:["Certificate","CertificateChain"],issuecertificate:["Csr"]},apigateway:{importapikeys:["body"],importdocumentationparts:["body"],importrestapi:["body"],putrestapi:["body"],posttoconnection:["Data"]},appconfig:{createhostedconfigurationversion:["Content"]},appsync:{startschemacreation:["definition"]},awsmobilehubservice:{createproject:["contents"],updateproject:["contents"]},"backup-storage":{notifyobjectcomplete:["MetadataBlob"],putchunk:["Data"],putobject:["InlineChunk"]},clouddirectory:{addfacettoobject:["ObjectAttributeList.*.Value.BinaryValue"],attachtypedlink:["Attributes.*.Value.BinaryValue"],batchread:["Operations.*.GetLinkAttributes.TypedLinkSpecifier.IdentityAttributeValues.*.Value.BinaryValue","Operations.*.ListIncomingTypedLinks.FilterAttributeRanges.*.Range.EndValue.BinaryValue","Operations.*.ListIncomingTypedLinks.FilterAttributeRanges.*.Range.StartValue.BinaryValue","Operations.*.ListIndex.RangesOnIndexedValues.*.Range.EndValue.BinaryValue","Operations.*.ListIndex.RangesOnIndexedValues.*.Range.StartValue.BinaryValue","Operations.*.ListOutgoingTypedLinks.FilterAttributeRanges.*.Range.EndValue.BinaryValue","Operations.*.ListOutgoingTypedLinks.FilterAttributeRanges.*.Range.StartValue.BinaryValue"],batchwrite:["Operations.*.AddFacetToObject.ObjectAttributeList.*.Value.BinaryValue","Operations.*.AttachTypedLink.Attributes.*.Value.BinaryValue","Operations.*.CreateObject.ObjectAttributeList.*.Value.BinaryValue","Operations.*.DetachTypedLink.TypedLinkSpecifier.IdentityAttributeValues.*.Value.BinaryValue","Operations.*.UpdateLinkAttributes.AttributeUpdates.*.AttributeAction.AttributeUpdateValue.BinaryValue","Operations.*.UpdateLinkAttributes.TypedLinkSpecifier.IdentityAttributeValues.*.Value.BinaryValue","Operations.*.UpdateObjectAttributes.AttributeUpdates.*.ObjectAttributeAction.ObjectAttributeUpdateValue.BinaryValue"],createfacet:["Attributes.*.AttributeDefinition.DefaultValue.BinaryValue"],createobject:["ObjectAttributeList.*.Value.BinaryValue"],createtypedlinkfacet:["Facet.Attributes.*.DefaultValue.BinaryValue"],detachtypedlink:["TypedLinkSpecifier.IdentityAttributeValues.*.Value.BinaryValue"],getlinkattributes:["TypedLinkSpecifier.IdentityAttributeValues.*.Value.BinaryValue"],listincomingtypedlinks:["FilterAttributeRanges.*.Range.EndValue.BinaryValue","FilterAttributeRanges.*.Range.StartValue.BinaryValue"],listindex:["RangesOnIndexedValues.*.Range.EndValue.BinaryValue","RangesOnIndexedValues.*.Range.StartValue.BinaryValue"],listoutgoingtypedlinks:["FilterAttributeRanges.*.Range.EndValue.BinaryValue","FilterAttributeRanges.*.Range.StartValue.BinaryValue"],updatefacet:["AttributeUpdates.*.Attribute.AttributeDefinition.DefaultValue.BinaryValue"],updatelinkattributes:["AttributeUpdates.*.AttributeAction.AttributeUpdateValue.BinaryValue","TypedLinkSpecifier.IdentityAttributeValues.*.Value.BinaryValue"],updateobjectattributes:["AttributeUpdates.*.ObjectAttributeAction.ObjectAttributeUpdateValue.BinaryValue"],updatetypedlinkfacet:["AttributeUpdates.*.Attribute.DefaultValue.BinaryValue"]},cloudfront:{createfunction:["FunctionCode"],testfunction:["EventObject"],updatefunction:["FunctionCode"]},cloudsearch:{uploaddocuments:["documents"]},codeartifact:{publishpackageversion:["assetContent"]},codecommit:{createcommit:["putFiles.*.fileContent"],createunreferencedmergecommit:["conflictResolution.replaceContents.*.content"],mergebranchesbysquash:["conflictResolution.replaceContents.*.content"],mergebranchesbythreeway:["conflictResolution.replaceContents.*.content"],mergepullrequestbysquash:["conflictResolution.replaceContents.*.content"],mergepullrequestbythreeway:["conflictResolution.replaceContents.*.content"],putfile:["fileContent"]},"cognito-idp":{setuicustomization:["ImageFile"]},comprehend:{classifydocument:["Bytes"],detectentities:["Bytes"]},datasync:{createlocationhdfs:["KerberosKeytab","KerberosKrb5Conf"],createlocationobjectstorage:["ServerCertificate"],updatelocationhdfs:["KerberosKeytab","KerberosKrb5Conf"],updatelocationobjectstorage:["ServerCertificate"]},dms:{importcertificate:["CertificateWallet"]},dynamodb:{batchexecutestatement:["Statements.*.Parameters.*.B","Statements.*.Parameters.*.BS.*"],batchgetitem:["RequestItems.*.Keys.*.*.B","RequestItems.*.Keys.*.*.BS.*"],batchwriteitem:["RequestItems.*.*.DeleteRequest.Key.*.B","RequestItems.*.*.DeleteRequest.Key.*.BS.*","RequestItems.*.*.PutRequest.Item.*.B","RequestItems.*.*.PutRequest.Item.*.BS.*"],deleteitem:["Expected.*.AttributeValueList.*.B","Expected.*.AttributeValueList.*.BS.*","Expected.*.Value.B","Expected.*.Value.BS.*","ExpressionAttributeValues.*.B","ExpressionAttributeValues.*.BS.*","Key.*.B","Key.*.BS.*"],executestatement:["Parameters.*.B","Parameters.*.BS.*"],executetransaction:["TransactStatements.*.Parameters.*.B","TransactStatements.*.Parameters.*.BS.*"],getitem:["Key.*.B","Key.*.BS.*"],putitem:["Expected.*.AttributeValueList.*.B","Expected.*.AttributeValueList.*.BS.*","Expected.*.Value.B","Expected.*.Value.BS.*","ExpressionAttributeValues.*.B","ExpressionAttributeValues.*.BS.*","Item.*.B","Item.*.BS.*"],query:["ExclusiveStartKey.*.B","ExclusiveStartKey.*.BS.*","ExpressionAttributeValues.*.B","ExpressionAttributeValues.*.BS.*","KeyConditions.*.AttributeValueList.*.B","KeyConditions.*.AttributeValueList.*.BS.*","QueryFilter.*.AttributeValueList.*.B","QueryFilter.*.AttributeValueList.*.BS.*"],scan:["ExclusiveStartKey.*.B","ExclusiveStartKey.*.BS.*","ExpressionAttributeValues.*.B","ExpressionAttributeValues.*.BS.*","ScanFilter.*.AttributeValueList.*.B","ScanFilter.*.AttributeValueList.*.BS.*"],transactgetitems:["TransactItems.*.Get.Key.*.B","TransactItems.*.Get.Key.*.BS.*"],transactwriteitems:["TransactItems.*.ConditionCheck.ExpressionAttributeValues.*.B","TransactItems.*.ConditionCheck.ExpressionAttributeValues.*.BS.*","TransactItems.*.ConditionCheck.Key.*.B","TransactItems.*.ConditionCheck.Key.*.BS.*","TransactItems.*.Delete.ExpressionAttributeValues.*.B","TransactItems.*.Delete.ExpressionAttributeValues.*.BS.*","TransactItems.*.Delete.Key.*.B","TransactItems.*.Delete.Key.*.BS.*","TransactItems.*.Put.ExpressionAttributeValues.*.B","TransactItems.*.Put.ExpressionAttributeValues.*.BS.*","TransactItems.*.Put.Item.*.B","TransactItems.*.Put.Item.*.BS.*","TransactItems.*.Update.ExpressionAttributeValues.*.B","TransactItems.*.Update.ExpressionAttributeValues.*.BS.*","TransactItems.*.Update.Key.*.B","TransactItems.*.Update.Key.*.BS.*"],updateitem:["AttributeUpdates.*.Value.B","AttributeUpdates.*.Value.BS.*","Expected.*.AttributeValueList.*.B","Expected.*.AttributeValueList.*.BS.*","Expected.*.Value.B","Expected.*.Value.BS.*","ExpressionAttributeValues.*.B","ExpressionAttributeValues.*.BS.*","Key.*.B","Key.*.BS.*"]},ebs:{putsnapshotblock:["BlockData"]},ec2:{bundleinstance:["Storage.S3.UploadPolicy"],importkeypair:["PublicKeyMaterial"],modifyinstanceattribute:["UserData.Value"]},ecr:{uploadlayerpart:["layerPartBlob"]},"ecr-public":{createrepository:["catalogData.logoImageBlob"],putrepositorycatalogdata:["catalogData.logoImageBlob"],uploadlayerpart:["layerPartBlob"]},firehose:{putrecord:["Record.Data"],putrecordbatch:["Records.*.Data"]},frauddetector:{geteventprediction:["externalModelEndpointDataBlobs.*.byteBuffer"]},gamelift:{createscript:["ZipFile"],updatescript:["ZipFile"]},gamesparks:{importgameconfiguration:["ImportSource.File"]},glacier:{uploadarchive:["body"],uploadmultipartpart:["body"]},glue:{updatecolumnstatisticsforpartition:["ColumnStatisticsList.*.StatisticsData.DecimalColumnStatisticsData.MaximumValue.UnscaledValue","ColumnStatisticsList.*.StatisticsData.DecimalColumnStatisticsData.MinimumValue.UnscaledValue"],updatecolumnstatisticsfortable:["ColumnStatisticsList.*.StatisticsData.DecimalColumnStatisticsData.MaximumValue.UnscaledValue","ColumnStatisticsList.*.StatisticsData.DecimalColumnStatisticsData.MinimumValue.UnscaledValue"]},greengrass:{createcomponentversion:["inlineRecipe"]},iot:{createotaupdate:["files.*.codeSigning.customCodeSigning.signature.inlineDocument"],testinvokeauthorizer:["mqttContext.password"]},iotanalytics:{batchputmessage:["messages.*.payload"],runpipelineactivity:["payloads.*"]},iotdata:{publish:["payload"],updatethingshadow:["payload"]},ioteventsdata:{batchputmessage:["messages.*.payload"]},iotsitewise:{createportal:["portalLogoImageFile.data"],updateportal:["portalLogoImage.file.data"]},iotwireless:{updateresourceposition:["GeoJsonPayload"]},kafka:{createconfiguration:["ServerProperties"],updateconfiguration:["ServerProperties"]},kendra:{batchputdocument:["Documents.*.Blob"]},kinesis:{putrecord:["Data"],putrecords:["Records.*.Data"]},kinesisanalytics:{createapplication:["ApplicationConfiguration.ApplicationCodeConfiguration.CodeContent.ZipFileContent"],updateapplication:["ApplicationConfigurationUpdate.ApplicationCodeConfigurationUpdate.CodeContentUpdate.ZipFileContentUpdate"]},kms:{decrypt:["CiphertextBlob","Recipient.AttestationDocument"],encrypt:["Plaintext"],generatedatakey:["Recipient.AttestationDocument"],generatedatakeypair:["Recipient.AttestationDocument"],generatemac:["Message"],generaterandom:["Recipient.AttestationDocument"],importkeymaterial:["EncryptedKeyMaterial","ImportToken"],reencrypt:["CiphertextBlob"],sign:["Message"],verify:["Message","Signature"],verifymac:["Mac","Message"]},lambda:{createfunction:["Code.ZipFile"],invoke:["Payload"],invokeasync:["InvokeArgs"],invokewithresponsestream:["Payload"],publishlayerversion:["Content.ZipFile"],updatefunctioncode:["ZipFile"]},lex:{startimport:["payload"],postcontent:["inputStream"],recognizeutterance:["inputStream"],startconversation:["requestEventStream.AudioInputEvent.audioChunk"]},lookoutvision:{detectanomalies:["Body"],updatedatasetentries:["Changes"]},mediastore:{putobject:["Body"]},"medical-imaging":{updateimagesetmetadata:["updateImageSetMetadataUpdates.DICOMUpdates.removableAttributes","updateImageSetMetadataUpdates.DICOMUpdates.updatableAttributes"]},mobiletargeting:{sendmessages:["MessageRequest.MessageConfiguration.EmailMessage.RawEmail.Data"],sendusersmessages:["SendUsersMessageRequest.MessageConfiguration.EmailMessage.RawEmail.Data"]},qldb:{sendcommand:["CommitTransaction.CommitDigest","ExecuteStatement.Parameters.*.IonBinary"]},quicksight:{startassetbundleimportjob:["AssetBundleImportSource.Body"]},"rds-data":{batchexecutestatement:["parameterSets.*.*.value.blobValue"],executestatement:["parameters.*.value.blobValue"]},rekognition:{comparefaces:["SourceImage.Bytes","TargetImage.Bytes"],detectcustomlabels:["Image.Bytes"],detectfaces:["Image.Bytes"],detectlabels:["Image.Bytes"],detectmoderationlabels:["Image.Bytes"],detectprotectiveequipment:["Image.Bytes"],detecttext:["Image.Bytes"],indexfaces:["Image.Bytes"],recognizecelebrities:["Image.Bytes"],searchfacesbyimage:["Image.Bytes"],searchusersbyimage:["Image.Bytes"],updatedatasetentries:["Changes.GroundTruth"],startfacelivenesssession:["LivenessRequestStream.VideoEvent.VideoChunk"]},s3:{putobject:["Body"],uploadpart:["Body"],writegetobjectresponse:["Body"]},sagemaker:{invokeendpoint:["Body"],invokeendpointwithresponsestream:["Body"]},secretsmanager:{createsecret:["SecretBinary"],putsecretvalue:["SecretBinary"],updatesecret:["SecretBinary"]},ses:{createdeliverabilitytestreport:["Content.Raw.Data","Content.Raw.Data"],sendemail:["Content.Raw.Data","Content.Raw.Data"],sendrawemail:["RawMessage.Data"]},signer:{signpayload:["payload"]},sns:{publish:["MessageAttributes.*.BinaryValue"],publishbatch:["PublishBatchRequestEntries.*.MessageAttributes.*.BinaryValue"]},sqs:{sendmessage:["MessageAttributes.*.BinaryListValues.*","MessageAttributes.*.BinaryValue","MessageSystemAttributes.*.BinaryListValues.*","MessageSystemAttributes.*.BinaryValue"],sendmessagebatch:["Entries.*.MessageAttributes.*.BinaryListValues.*","Entries.*.MessageAttributes.*.BinaryValue","Entries.*.MessageSystemAttributes.*.BinaryListValues.*","Entries.*.MessageSystemAttributes.*.BinaryValue"]},ssm:{registertaskwithmaintenancewindow:["TaskInvocationParameters.Lambda.Payload"],updatemaintenancewindowtask:["TaskInvocationParameters.Lambda.Payload"]},support:{addattachmentstoset:["attachments.*.data"]},synthetics:{createcanary:["Code.ZipFile"],updatecanary:["Code.ZipFile"]},textract:{analyzedocument:["Document.Bytes"],analyzeexpense:["Document.Bytes"],analyzeid:["DocumentPages.*.Bytes"],detectdocumenttext:["Document.Bytes"]},transcribe:{startcallanalyticsstreamtranscription:["AudioStream.AudioEvent.AudioChunk"],startmedicalstreamtranscription:["AudioStream.AudioEvent.AudioChunk"],startstreamtranscription:["AudioStream.AudioEvent.AudioChunk"]},translate:{importterminology:["TerminologyData.File"],translatedocument:["Document.Content"]},waf:{updatebytematchset:["Updates.*.ByteMatchTuple.TargetString"]},"waf-regional":{updatebytematchset:["Updates.*.ByteMatchTuple.TargetString"]},wafv2:{checkcapacity:["Rules.*.Statement.ByteMatchStatement.SearchString"],createrulegroup:["Rules.*.Statement.ByteMatchStatement.SearchString"],createwebacl:["Rules.*.Statement.ByteMatchStatement.SearchString"],updaterulegroup:["Rules.*.Statement.ByteMatchStatement.SearchString"],updatewebacl:["Rules.*.Statement.ByteMatchStatement.SearchString"]},workspaces:{importclientbranding:["DeviceTypeAndroid.Logo","DeviceTypeIos.Logo","DeviceTypeIos.Logo2x","DeviceTypeIos.Logo3x","DeviceTypeLinux.Logo","DeviceTypeOsx.Logo","DeviceTypeWeb.Logo","DeviceTypeWindows.Logo"]}}});var $={};S($,{coerceApiParametersToUint8Array:()=>ke,coerceToUint8Array:()=>A});function ke(e,t,a={}){let r=j?.[e.toLowerCase()]?.[t.toLowerCase()]??[];for(let i of r)A(a,i.split("."));return a}function A(e,t){return t.length===0?Be(e):t[0]==="*"?Array.isArray(e)?e.map(a=>A(a,t.slice(1))):e&&typeof e=="object"?Object.fromEntries(Object.entries(e).map(([a,r])=>[a,A(r,t.slice(1))])):e:(e&&typeof e=="object"&&t[0]in e&&(e[t[0]]=A(e[t[0]],t.slice(1))),e)}function Be(e){return e instanceof Uint8Array?e:typeof e=="string"||typeof e=="number"?new TextEncoder().encode(e.toString()):e}var H=d(()=>{"use strict";G()});var z={};S(z,{findV3ClientConstructor:()=>T});function T(e){let[t,a]=Object.entries(e).find(([r])=>r.endsWith("Client")&&r!=="__Client");return a}var x=d(()=>{"use strict"});var Q,Z=d(()=>{"use strict";Q=["ACM","ACMPCA","APIGateway","ARCZonalShift","AccessAnalyzer","Account","AlexaForBusiness","Amp","Amplify","AmplifyBackend","AmplifyUIBuilder","ApiGatewayManagementApi","ApiGatewayV2","AppConfig","AppConfigData","AppIntegrations","AppMesh","AppRunner","AppStream","AppSync","Appflow","ApplicationAutoScaling","ApplicationCostProfiler","ApplicationInsights","Athena","AuditManager","AugmentedAIRuntime","AutoScaling","AutoScalingPlans","Backup","BackupGateway","BackupStorage","Batch","Billingconductor","Braket","Budgets","CUR","Chime","ChimeSDKIdentity","ChimeSDKMediaPipelines","ChimeSDKMeetings","ChimeSDKMessaging","ChimeSDKVoice","Cloud9","CloudControl","CloudDirectory","CloudFormation","CloudFront","CloudHSM","CloudHSMV2","CloudSearch","CloudSearchDomain","CloudTrail","CloudWatch","CloudWatchEvents","CloudWatchLogs","CodeArtifact","CodeBuild","CodeCatalyst","CodeCommit","CodeDeploy","CodeGuruProfiler","CodeGuruReviewer","CodePipeline","CodeStar","CodeStarNotifications","CodeStarconnections","CognitoIdentity","CognitoIdentityServiceProvider","CognitoSync","Comprehend","ComprehendMedical","ComputeOptimizer","ConfigService","Connect","ConnectCampaigns","ConnectCases","ConnectContactLens","ConnectParticipant","ControlTower","CostExplorer","CustomerProfiles","DAX","DLM","DMS","DataBrew","DataExchange","DataPipeline","DataSync","Detective","DevOpsGuru","DeviceFarm","DirectConnect","DirectoryService","Discovery","DocDB","DocDBElastic","Drs","DynamoDB","DynamoDBStreams","EBS","EC2","EC2InstanceConnect","ECR","ECRPUBLIC","ECS","EFS","EKS","ELB","ELBv2","EMR","EMRServerless","EMRcontainers","ES","ElastiCache","ElasticBeanstalk","ElasticInference","ElasticTranscoder","EventBridge","Evidently","FMS","FSx","Finspace","Finspacedata","Firehose","Fis","ForecastQueryService","ForecastService","FraudDetector","GameLift","GameSparks","Glacier","GlobalAccelerator","Glue","Grafana","Greengrass","GreengrassV2","GroundStation","GuardDuty","Health","HealthLake","Honeycode","IAM","IVS","IdentityStore","Imagebuilder","Inspector","Inspector2","IoT1ClickDevicesService","IoT1ClickProjects","IoTAnalytics","IoTEvents","IoTEventsData","IoTFleetHub","IoTFleetWise","IoTJobsDataPlane","IoTRoboRunner","IoTSecureTunneling","IoTSiteWise","IoTThingsGraph","IoTTwinMaker","IoTWireless","Iot","IotData","IotDeviceAdvisor","Ivschat","KMS","Kafka","KafkaConnect","Kendra","Keyspaces","Kinesis","KinesisAnalytics","KinesisAnalyticsV2","KinesisVideo","KinesisVideoArchivedMedia","KinesisVideoMedia","KinesisVideoSignalingChannels","KinesisVideoWebRTCStorage","LakeFormation","Lambda","LexModelBuildingService","LexModelsV2","LexRuntime","LexRuntimeV2","LicenseManager","LicenseManagerLinuxSubscriptions","LicenseManagerUserSubscriptions","Lightsail","Location","LookoutEquipment","LookoutMetrics","LookoutVision","M2","MQ","MTurk","MWAA","MachineLearning","Macie","Macie2","ManagedBlockchain","MarketplaceCatalog","MarketplaceCommerceAnalytics","MarketplaceEntitlementService","MarketplaceMetering","MediaConnect","MediaConvert","MediaLive","MediaPackage","MediaPackageVod","MediaStore","MediaStoreData","MediaTailor","MemoryDB","Mgn","MigrationHub","MigrationHubConfig","MigrationHubOrchestrator","MigrationHubRefactorSpaces","MigrationHubStrategy","Mobile","Neptune","NetworkFirewall","NetworkManager","Nimble","OAM","Omics","OpenSearch","OpenSearchServerless","OpsWorks","OpsWorksCM","Organizations","Outposts","PI","Panorama","Personalize","PersonalizeEvents","PersonalizeRuntime","Pinpoint","PinpointEmail","PinpointSMSVoice","PinpointSMSVoiceV2","Pipes","Polly","Pricing","PrivateNetworks","Proton","QLDB","QLDBSession","QuickSight","RAM","RDS","RDSDataService","RUM","Rbin","Redshift","RedshiftData","RedshiftServerless","Rekognition","Resiliencehub","ResourceExplorer2","ResourceGroups","ResourceGroupsTaggingAPI","RoboMaker","RolesAnywhere","Route53","Route53Domains","Route53RecoveryCluster","Route53RecoveryControlConfig","Route53RecoveryReadiness","Route53Resolver","S3","S3Control","S3Outposts","SES","SESV2","SMS","SNS","SQS","SSM","SSMContacts","SSMIncidents","SSO","SSOAdmin","SSOOIDC","STS","SWF","SageMaker","SageMakerFeatureStoreRuntime","SageMakerGeospatial","SageMakerMetrics","SageMakerRuntime","SagemakerEdge","SavingsPlans","Scheduler","Schemas","SecretsManager","SecurityHub","SecurityLake","ServerlessApplicationRepository","ServiceCatalog","ServiceCatalogAppRegistry","ServiceDiscovery","ServiceQuotas","Shield","Signer","SimSpaceWeaver","SnowDeviceManagement","Snowball","SsmSap","StepFunctions","StorageGateway","Support","SupportApp","Synthetics","Textract","TimestreamQuery","TimestreamWrite","TranscribeService","Transfer","Translate","VoiceID","WAF","WAFRegional","WAFV2","WellArchitected","Wisdom","WorkDocs","WorkLink","WorkMail","WorkMailMessageFlow","WorkSpaces","WorkSpacesWeb","XRay"]});var O,J=d(()=>{"use strict";Z();O={...Q.reduce((e,t)=>({...e,[t]:`client-${t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}`.replace("-chime-sdk","-chime-sdk-").replace("client-amplify-","client-amplify").replace("client-cloud-","client-cloud").replace("client-code-","client-code").replace("client-connect-","client-connect").replace("client-data-","client-data").replace("client-io-t","client-iot-").replace("client-iot-fleet-","client-iotfleet").replace("client-lookout-","client-lookout").replace("client-media-","client-media").replace("client-migration-hub-","client-migrationhub").replace("client-pinpoint-sms","client-pinpoint-sms-").replace("client-route53","client-route53-").replace("client-sage-maker","client-sagemaker").replace("client-security-","client-security").replace("client-work-","client-work")}),{}),AccessAnalyzer:"client-accessanalyzer",ACMPCA:"client-acm-pca",APIGateway:"client-api-gateway",ApiGatewayManagementApi:"client-apigatewaymanagementapi",ApiGatewayV2:"client-apigatewayv2",AppConfig:"client-appconfig",AppConfigData:"client-appconfigdata",AppIntegrations:"client-appintegrations",AppRunner:"client-apprunner",AppStream:"client-appstream",AppSync:"client-appsync",ApplicationCostProfiler:"client-applicationcostprofiler",ARCZonalShift:"client-arc-zonal-shift",AugmentedAIRuntime:"client-sage-maker-a2iruntime",AuditManager:"client-auditmanager",BackupStorage:"client-backupstorage",CUR:"client-cost-and-usage-report-service",CloudHSMV2:"client-cloudhsm-v2",CodeGuruProfiler:"client-codeguruprofiler",CodeStarconnections:"client-codestar-connections",CognitoIdentityServiceProvider:"client-cognito-identity-provider",ComprehendMedical:"client-comprehendmedical",ConnectContactLens:"client-connect-contact-lens",ControlTower:"client-controltower",DMS:"client-database-migration-service",DataPipeline:"client-data-pipeline",Discovery:"client-application-discovery-service",DevOpsGuru:"client-devops-guru",DynamoDB:"client-dynamodb",DynamoDBStreams:"client-dynamodb-streams",DocDB:"client-docdb",DocDBElastic:"client-docdb-elastic",EC2InstanceConnect:"client-ec2-instance-connect",ECRPUBLIC:"client-ecr-public",ELB:"client-elastic-load-balancing",ELBv2:"client-elastic-load-balancing-v2",ElastiCache:"client-elasticache",EMRcontainers:"client-emr-containers",EMRServerless:"client-emr-serverless",ES:"client-elasticsearch-service",EventBridge:"client-eventbridge",Finspacedata:"client-finspace-data",ForecastQueryService:"client-forecastquery",ForecastService:"client-forecast",FraudDetector:"client-frauddetector",GameLift:"client-gamelift",GameSparks:"client-gamesparks",GreengrassV2:"client-greengrassv2",GroundStation:"client-groundstation",GuardDuty:"client-guardduty",HealthLake:"client-healthlake",IdentityStore:"client-identitystore",IoTAnalytics:"client-iotanalytics",IotData:"client-iot-data-plane",IotDeviceAdvisor:"client-iotdeviceadvisor",IoTSecureTunneling:"client-iotsecuretunneling",IoTSiteWise:"client-iotsitewise",IoTThingsGraph:"client-iotthingsgraph",IoTTwinMaker:"client-iottwinmaker",IoTRoboRunner:"client-iot-roborunner",KafkaConnect:"client-kafkaconnect",KinesisVideoSignalingChannels:"client-kinesis-video-signaling",KinesisVideoWebRTCStorage:"client-kinesis-video-webrtc-storage",LakeFormation:"client-lakeformation",LexRuntime:"client-lex-runtime-service",ManagedBlockchain:"client-managedblockchain",MigrationHubConfig:"client-migrationhub-config",MigrationHubRefactorSpaces:"client-migration-hub-refactor-spaces",NetworkManager:"client-networkmanager",OpenSearch:"client-opensearch",OpenSearchServerless:"client-opensearchserverless",OpsWorks:"client-opsworks",OpsWorksCM:"client-opsworkscm",PrivateNetworks:"client-privatenetworks",QLDBSession:"client-qldb-session",QuickSight:"client-quicksight",ResourceExplorer2:"client-resource-explorer-2",RDSDataService:"client-rds-data",RoboMaker:"client-robomaker",RolesAnywhere:"client-rolesanywhere",Route53:"client-route-53",Route53Domains:"client-route-53-domains",Route53Resolver:"client-route53resolver",S3Control:"client-s3-control",SageMakerFeatureStoreRuntime:"client-sagemaker-featurestore-runtime",SavingsPlans:"client-savingsplans",SecurityHub:"client-securityhub",ServerlessApplicationRepository:"client-serverlessapplicationrepository",ServiceCatalogAppRegistry:"client-service-catalog-appregistry",ServiceDiscovery:"client-servicediscovery",SimSpaceWeaver:"client-simspaceweaver",SSMContacts:"client-ssm-contacts",SSMIncidents:"client-ssm-incidents",SSOAdmin:"client-sso-admin",SSOOIDC:"client-sso-oidc",StepFunctions:"client-sfn",TranscribeService:"client-transcribe",WAFRegional:"client-waf-regional",WellArchitected:"client-wellarchitected",WorkMailMessageFlow:"client-workmailmessageflow"}});var Y={};S(Y,{getV3ClientPackageName:()=>F});var F,U=d(()=>{"use strict";J();F=e=>{if(e in O)return`@aws-sdk/${O[e]}`;throw new Error(`Client '${e}' is either deprecated or newly added. Please consider using the v3 package format (@aws-sdk/client-xxx).`)}});var X={};S(X,{getV3Client:()=>Ie,getV3Command:()=>Ee,loadV3ClientPackage:()=>Ve});function Ve(e){let t=e.startsWith("@aws-sdk/")?e:F(e);try{let a=require(t),{version:r}=require(t+"/package.json");return{service:t.replace("@aws-sdk/client-",""),pkg:a,packageName:t,packageVersion:r}}catch{throw Error(`Service ${e} client package with name '${t}' does not exist.`)}}function Ie(e,t={}){try{let a=T(e.pkg);return new a(t)}catch{throw Error(`No client constructor found within package: ${e.packageName}`)}}function Ee(e,t){let a=t.endsWith("Command")?t:`${t}Command`,r=Object.entries(e.pkg).find(([i])=>i.toLowerCase()===a.toLowerCase())?.[1];if(!r)throw new Error(`Unable to find command named: ${a} for api: ${t} in service package`);return r}var ee=d(()=>{"use strict";x();U()});var te=ye(l=>{"use strict";var De=l&&l.__createBinding||(Object.create?function(e,t,a,r){r===void 0&&(r=a);var i=Object.getOwnPropertyDescriptor(t,a);(!i||("get"in i?!t.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return t[a]}}),Object.defineProperty(e,r,i)}:function(e,t,a,r){r===void 0&&(r=a),e[r]=t[a]}),ve=l&&l.__exportStar||function(e,t){for(var a in e)a!=="default"&&!Object.prototype.hasOwnProperty.call(t,a)&&De(t,e,a)};Object.defineProperty(l,"__esModule",{value:!0});l.getV3ClientPackageName=l.findV3ClientConstructor=l.coerceApiParametersToUint8Array=void 0;var Me=(H(),f($));Object.defineProperty(l,"coerceApiParametersToUint8Array",{enumerable:!0,get:function(){return Me.coerceApiParametersToUint8Array}});var Pe=(x(),f(z));Object.defineProperty(l,"findV3ClientConstructor",{enumerable:!0,get:function(){return Pe.findV3ClientConstructor}});var we=(U(),f(Y));Object.defineProperty(l,"getV3ClientPackageName",{enumerable:!0,get:function(){return we.getV3ClientPackageName}});ve((ee(),f(X)),l)});var ie={};S(ie,{forceSdkInstallation:()=>Le,handler:()=>Oe});function Le(){h={}}function Te(e){console.log(`Installing latest AWS SDK v3: ${e}`),(0,ae.execSync)(`NPM_CONFIG_UPDATE_NOTIFIER=false HOME=/tmp npm install ${e} --omit=dev --no-package-lock --no-save --prefix /tmp`),h={...h,[e]:!0}}async function xe(e,t){let a;try{if(!h[e]&&t==="true")try{Te(e),a=require(`/tmp/node_modules/${e}`)}catch(r){return console.log(`Failed to install latest AWS SDK v3. Falling back to pre-installed version. Error: ${r}`),require(e)}else h[e]?a=require(`/tmp/node_modules/${e}`):a=require(e)}catch{throw Error(`Package ${e} does not exist.`)}return a}async function Oe(e,t){try{e.ResourceProperties.Create=y(e.ResourceProperties.Create),e.ResourceProperties.Update=y(e.ResourceProperties.Update),e.ResourceProperties.Delete=y(e.ResourceProperties.Delete);let a={},r;switch(e.RequestType){case"Create":r=e.ResourceProperties.Create?.physicalResourceId?.id??e.ResourceProperties.Update?.physicalResourceId?.id??e.ResourceProperties.Delete?.physicalResourceId?.id??e.LogicalResourceId;break;case"Update":case"Delete":r=e.ResourceProperties[e.RequestType]?.physicalResourceId?.id??e.PhysicalResourceId;break}let i=e.ResourceProperties[e.RequestType];if(i){let o=i.service.startsWith("@aws-sdk/")?i.service:(0,C.getV3ClientPackageName)(i.service),n=o.split("/client-")[1],s=xe(o,e.ResourceProperties.InstallLatestAwsSdk);console.log(JSON.stringify({...e,ResponseURL:"..."}));let u;if(i.assumedRoleArn){let m=new Date().getTime(),g={RoleArn:i.assumedRoleArn,RoleSessionName:`${m}-${r}`.substring(0,64)},{fromTemporaryCredentials:le}=await import("@aws-sdk/credential-providers");u=le({params:g,clientConfig:i.region!==void 0?{region:i.region}:void 0})}s=await s;let p=(0,C.findV3ClientConstructor)(s),c=new p({apiVersion:i.apiVersion,credentials:u,region:i.region}),K=i.action.endsWith("Command")?i.action:`${i.action}Command`,se=K.replace(/Command$/,""),ce=Object.entries(s).find(([m])=>m.toLowerCase()===K.toLowerCase())?.[1],R={};try{let m=await c.send(new ce(i.parameters?(0,C.coerceApiParametersToUint8Array)(n,se,V(i.parameters,r)):{}));R={apiVersion:c.config.apiVersion,region:await c.config.region().catch(()=>{}),...B(m)};let g;i.outputPath?g=[i.outputPath]:i.outputPaths&&(g=i.outputPaths),g?a=I(R,E(g)):a=R}catch(m){let g=m.name??m.constructor.name;if(!i.ignoreErrorCodesMatching||!new RegExp(i.ignoreErrorCodesMatching).test(g))throw m}i.physicalResourceId?.responsePath&&(r=R[i.physicalResourceId.responsePath])}await b(e,"SUCCESS","OK",r,a)}catch(a){console.log(a),await b(e,"FAILED",a.message||"Internal Error",t.logStreamName,{})}}var ae,C,h,re=d(()=>{"use strict";ae=require("child_process"),C=M(te());D();h={}});var Ue={};S(Ue,{PHYSICAL_RESOURCE_ID_REFERENCE:()=>P,handler:()=>Fe,v2handler:()=>ne,v3handler:()=>oe});module.exports=f(Ue);D();function ne(e,t){return(N(),f(_)).handler(e,t)}function oe(e,t){return(re(),f(ie)).handler(e,t)}function Fe(e,t){let a=process.env.AWS_EXECUTION_ENV;return a&&a>="AWS_Lambda_nodejs18.x"?oe(e,t):ne(e,t)}0&&(module.exports={PHYSICAL_RESOURCE_ID_REFERENCE,handler,v2handler,v3handler});
