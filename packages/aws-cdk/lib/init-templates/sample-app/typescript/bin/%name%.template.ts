#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { %name.PascalCased%Stack } from '../lib/%name%-stack';

const app = new cdk.App();
new %name.PascalCased%Stack(app, '%stackname%');
