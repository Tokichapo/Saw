"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// !cdk-integ *
const iam = require("@aws-cdk/aws-iam");
const cdk = require("@aws-cdk/core");
const s3 = require("../lib");
const app = new cdk.App();
/// !show
/**
 * Stack that defines the bucket
 */
class Producer extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const bucket = new s3.Bucket(this, 'MyBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        this.myBucket = bucket;
    }
}
/**
 * Stack that consumes the bucket
 */
class Consumer extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const user = new iam.User(this, 'MyUser');
        props.userBucket.grantReadWrite(user);
    }
}
const producer = new Producer(app, 'ProducerStack');
new Consumer(app, 'ConsumerStack', { userBucket: producer.myBucket });
/// !hide
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuYnVja2V0LXNoYXJpbmcubGl0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuYnVja2V0LXNoYXJpbmcubGl0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsZ0JBQWdCO0FBQ2hCLHdDQUF3QztBQUN4QyxxQ0FBcUM7QUFDckMsNkJBQTZCO0FBRTdCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLFNBQVM7QUFFVDs7R0FFRztBQUNILE1BQU0sUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBRzlCLFlBQVksS0FBYyxFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUM3QyxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQ3pDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO0tBQ3hCO0NBQ0Y7QUFNRDs7R0FFRztBQUNILE1BQU0sUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzlCLFlBQVksS0FBYyxFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLEtBQUssQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZDO0NBQ0Y7QUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFDcEQsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUN0RSxTQUFTO0FBRVQsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vICFjZGstaW50ZWcgKlxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnLi4vbGliJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8vICFzaG93XG5cbi8qKlxuICogU3RhY2sgdGhhdCBkZWZpbmVzIHRoZSBidWNrZXRcbiAqL1xuY2xhc3MgUHJvZHVjZXIgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgbXlCdWNrZXQ6IHMzLkJ1Y2tldDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnTXlCdWNrZXQnLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuICAgIHRoaXMubXlCdWNrZXQgPSBidWNrZXQ7XG4gIH1cbn1cblxuaW50ZXJmYWNlIENvbnN1bWVyUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHVzZXJCdWNrZXQ6IHMzLklCdWNrZXQ7XG59XG5cbi8qKlxuICogU3RhY2sgdGhhdCBjb25zdW1lcyB0aGUgYnVja2V0XG4gKi9cbmNsYXNzIENvbnN1bWVyIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIGlkOiBzdHJpbmcsIHByb3BzOiBDb25zdW1lclByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB1c2VyID0gbmV3IGlhbS5Vc2VyKHRoaXMsICdNeVVzZXInKTtcbiAgICBwcm9wcy51c2VyQnVja2V0LmdyYW50UmVhZFdyaXRlKHVzZXIpO1xuICB9XG59XG5cbmNvbnN0IHByb2R1Y2VyID0gbmV3IFByb2R1Y2VyKGFwcCwgJ1Byb2R1Y2VyU3RhY2snKTtcbm5ldyBDb25zdW1lcihhcHAsICdDb25zdW1lclN0YWNrJywgeyB1c2VyQnVja2V0OiBwcm9kdWNlci5teUJ1Y2tldCB9KTtcbi8vLyAhaGlkZVxuXG5hcHAuc3ludGgoKTtcbiJdfQ==