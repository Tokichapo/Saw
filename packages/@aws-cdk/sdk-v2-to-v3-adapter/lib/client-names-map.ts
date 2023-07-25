import { CLIENT_NAMES } from './client-names';

export const CLIENT_NAMES_MAP: Record<string, string> = {
  ...CLIENT_NAMES.reduce((acc, name) => ({ ...acc, [name]: name }), {}),
  AugmentedAIRuntime: 'SageMakerA2IRuntime',
  CUR: 'CostAndUsageReportService',
  CodeArtifact: 'Codeartifact',
  CodeStarNotifications: 'CodestarNotifications',
  CodeStarconnections: 'CodeStarConnections',
  CognitoIdentityServiceProvider: 'CognitoIdentityProvider',
  DMS: 'DatabaseMigrationService',
  Discovery: 'ApplicationDiscoveryService',
  ELB: 'ElasticLoadBalancing',
  ELBv2: 'ElasticLoadBalancingV2',
  EMRcontainers: 'EMRContainers',
  ES: 'ElasticsearchService',
  Finspacedata: 'FinspaceData',
  ForecastQueryService: 'Forecastquery',
  ForecastService: 'Forecast',
  IVS: 'Ivs',
  IdentityStore: 'Identitystore',
  Iot: 'IoT',
  IotData: 'IoTDataPlane',
  KinesisVideoSignalingChannels: 'KinesisVideoSignaling',
  LexRuntime: 'LexRuntimeService',
  MQ: 'Mq',
  RDSDataService: 'RDSData',
  SESV2: 'SESv2',
  SavingsPlans: 'Savingsplans',
  StepFunctions: 'SFN',
  TranscribeService: 'Transcribe',
};
