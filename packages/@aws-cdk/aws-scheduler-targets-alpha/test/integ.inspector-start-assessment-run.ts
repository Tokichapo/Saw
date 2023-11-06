import * as scheduler from '@aws-cdk/aws-scheduler-alpha';
import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import { CfnAssessmentTarget, CfnAssessmentTemplate } from 'aws-cdk-lib/aws-inspector';
import { InspectorStartAssessmentRun } from '../lib';

/*
 * Stack verification steps:
 * An inspector assessment run by the scheduler
 * The assertion checks whether the assessment run
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-scheduler-targets-inspector-start-assessment-run');

const assessmentTarget = new CfnAssessmentTarget(stack, 'MyAssessmentTarget');
const assessmentTemplate = new CfnAssessmentTemplate(stack, 'MyAssessmentTemplate', {
  assessmentTargetArn: assessmentTarget.attrArn,
  durationInSeconds: 3600,
  rulesPackageArns: ['arn:aws:inspector:us-east-1:316112463485:rulespackage/0-gEjTy7T7'],
});

new scheduler.Schedule(stack, 'Schedule', {
  schedule: scheduler.ScheduleExpression.rate(cdk.Duration.minutes(10)),
  target: new InspectorStartAssessmentRun(assessmentTemplate, {}),
});

const integrationTest = new IntegTest(app, 'integrationtest-inspector-start-assessment-run', {
  testCases: [stack],
  stackUpdateWorkflow: false, // this would cause the schedule to trigger with the old code
});

// Verifies that an object was delivered to the S3 bucket by the firehose
integrationTest.assertions.awsApiCall('Inspector', 'listAssessmentRuns', {
  AssessmentTemplateArns: [assessmentTemplate.attrArn],
}).assertAtPath(
  'assessmentRunArns.0',
  ExpectedResult.stringLikeRegexp(assessmentTemplate.attrArn),
).waitForAssertions({
  interval: cdk.Duration.seconds(30),
  totalTimeout: cdk.Duration.minutes(10),
});

app.synth();