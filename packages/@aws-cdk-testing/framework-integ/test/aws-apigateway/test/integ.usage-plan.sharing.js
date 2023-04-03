"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// !cdk-integ *
const cdk = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
class Create extends cdk.Stack {
    constructor(scope, id) {
        super(scope, id);
        this.usagePlan = new apigateway.UsagePlan(this, 'myusageplan');
    }
}
class Import extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id);
        const usageplan = apigateway.UsagePlan.fromUsagePlanId(this, 'myusageplan', props.usagePlan.usagePlanId);
        const apikey = new apigateway.ApiKey(this, 'myapikey');
        usageplan.addApiKey(apikey);
    }
}
const app = new cdk.App();
const test = new Create(app, 'test-apigateway-usageplan-create');
new Import(app, 'test-apigateway-usageplan-import', {
    usagePlan: test.usagePlan,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcudXNhZ2UtcGxhbi5zaGFyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcudXNhZ2UtcGxhbi5zaGFyaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsZ0JBQWdCO0FBQ2hCLG1DQUFtQztBQUNuQyx5REFBeUQ7QUFHekQsTUFBTSxNQUFPLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFHNUIsWUFBWSxLQUFjLEVBQUUsRUFBVTtRQUNwQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNqRSxDQUFDO0NBQ0Y7QUFNRCxNQUFNLE1BQU8sU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QixZQUFZLEtBQWMsRUFBRSxFQUFVLEVBQUUsS0FBdUI7UUFDN0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDekcsTUFBTSxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN2RCxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlCLENBQUM7Q0FDRjtBQUVELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO0FBQ2pFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxrQ0FBa0MsRUFBRTtJQUNsRCxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7Q0FDMUIsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vICFjZGstaW50ZWcgKlxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0IHsgSVVzYWdlUGxhbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcblxuY2xhc3MgQ3JlYXRlIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHVzYWdlUGxhbjogSVVzYWdlUGxhbjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgaWQ6IHN0cmluZykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICB0aGlzLnVzYWdlUGxhbiA9IG5ldyBhcGlnYXRld2F5LlVzYWdlUGxhbih0aGlzLCAnbXl1c2FnZXBsYW4nKTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgSW1wb3J0U3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgdXNhZ2VQbGFuOiBhcGlnYXRld2F5LklVc2FnZVBsYW47XG59XG5cbmNsYXNzIEltcG9ydCBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nLCBwcm9wczogSW1wb3J0U3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB1c2FnZXBsYW4gPSBhcGlnYXRld2F5LlVzYWdlUGxhbi5mcm9tVXNhZ2VQbGFuSWQodGhpcywgJ215dXNhZ2VwbGFuJywgcHJvcHMudXNhZ2VQbGFuLnVzYWdlUGxhbklkKTtcbiAgICBjb25zdCBhcGlrZXkgPSBuZXcgYXBpZ2F0ZXdheS5BcGlLZXkodGhpcywgJ215YXBpa2V5Jyk7XG4gICAgdXNhZ2VwbGFuLmFkZEFwaUtleShhcGlrZXkpO1xuICB9XG59XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNvbnN0IHRlc3QgPSBuZXcgQ3JlYXRlKGFwcCwgJ3Rlc3QtYXBpZ2F0ZXdheS11c2FnZXBsYW4tY3JlYXRlJyk7XG5uZXcgSW1wb3J0KGFwcCwgJ3Rlc3QtYXBpZ2F0ZXdheS11c2FnZXBsYW4taW1wb3J0Jywge1xuICB1c2FnZVBsYW46IHRlc3QudXNhZ2VQbGFuLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19