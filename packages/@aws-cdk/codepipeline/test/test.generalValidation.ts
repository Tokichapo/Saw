import { Stack } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/s3';
import { Test } from 'nodeunit';
import { AmazonS3Source, Pipeline, Stage } from '../lib';
import { validateName } from '../lib/validation';

interface NameValidationTestCase {
    name: string;
    shouldPassValidation: boolean;
    explanation: string;
}

export = {
    'name validation'(test: Test) {
        const cases: NameValidationTestCase[] = [
            { name: 'BlahBleep123.@-_', shouldPassValidation: true, explanation: 'should be valid' },
            { name: '', shouldPassValidation: false, explanation: 'the empty string should be invalid' },
            { name: ' BlahBleep', shouldPassValidation: false, explanation: 'spaces should be invalid' },
            { name: '!BlahBleep', shouldPassValidation: false, explanation: '\'!\' should be invalid' }
        ];

        cases.forEach(testCase => {
            const name = testCase.name;
            const validationBlock = () => { validateName('test thing', name); };
            if (testCase.shouldPassValidation) {
                test.doesNotThrow(validationBlock, Error, `${name} failed validation but ${testCase.explanation}`);
            } else {
                test.throws(validationBlock, Error, `${name} passed validation but ${testCase.explanation}`);
            }
        });

        test.done();
    },

    'Stage validation': {
        'should fail if Stage has no Actions'(test: Test) {
            const stage = stageForTesting();

            test.deepEqual(stage.validate().length, 1);

            test.done();
        }
    },

    'Pipeline validation': {
        'should fail if Pipeline has no Stages'(test: Test) {
            const stack = new Stack();
            const pipeline = new Pipeline(stack, 'Pipeline');

            test.deepEqual(pipeline.validate().length, 1);

            test.done();
        },

        'should fail if Pipeline has a Source Action in a non-first Stage'(test: Test) {
            const stack = new Stack();
            const pipeline = new Pipeline(stack, 'Pipeline');
            const firstStage = new Stage(pipeline, 'FirstStage');
            const secondStage = new Stage(pipeline, 'SecondStage');

            const bucket = new Bucket(stack, 'PipelineBucket');
            new AmazonS3Source(firstStage, 'FirstAction', {
                artifactName: 'FirstArtifact',
                bucket,
                bucketKey: 'key',
            });
            new AmazonS3Source(secondStage, 'SecondAction', {
                artifactName: 'SecondAction',
                bucket,
                bucketKey: 'key',
            });

            test.deepEqual(pipeline.validate().length, 1);

            test.done();
        }
    }
};

function stageForTesting(): Stage {
    const stack = new Stack();
    const pipeline = new Pipeline(stack, 'pipeline');
    return new Stage(pipeline, 'stage');
}
