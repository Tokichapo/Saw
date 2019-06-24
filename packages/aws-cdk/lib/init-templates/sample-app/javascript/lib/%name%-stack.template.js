const sns = require('@aws-cdk/aws-sns');
const subs = require('@aws-cdk/aws-sns-subscribers');
const sqs = require('@aws-cdk/aws-sqs');
const cdk = require('@aws-cdk/core');

class %name.PascalCased%Stack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, '%name.PascalCased%Queue', {
      visibilityTimeoutSec: 300
    });

    const topic = new sns.Topic(this, '%name.PascalCased%Topic');

    topic.subscribe(new subs.SqsSubscriber(queue));
  }
}

module.exports = { %name.PascalCased%Stack }
