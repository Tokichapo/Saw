"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iam = require("aws-cdk-lib/aws-iam");
const cdk = require("aws-cdk-lib");
const chatbot = require("aws-cdk-lib/aws-chatbot");
class ChatbotGuardrailsInteg extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const guardrailPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchReadOnlyAccess');
        new chatbot.SlackChannelConfiguration(this, 'MySlackChannel', {
            slackChannelConfigurationName: 'test-channel',
            slackWorkspaceId: 'T49239U4W',
            slackChannelId: 'C0187JABUE9',
            guardrailPolicies: [guardrailPolicy],
        });
    }
}
const app = new cdk.App();
new ChatbotGuardrailsInteg(app, 'ChatbotGuardrailsInteg');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuY2hhdGJvdC1ndWFyZHJhaWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuY2hhdGJvdC1ndWFyZHJhaWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkNBQTJDO0FBQzNDLG1DQUFtQztBQUNuQyxtREFBbUQ7QUFFbkQsTUFBTSxzQkFBdUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQWMsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBRS9GLElBQUksT0FBTyxDQUFDLHlCQUF5QixDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUM1RCw2QkFBNkIsRUFBRSxjQUFjO1lBQzdDLGdCQUFnQixFQUFFLFdBQVc7WUFDN0IsY0FBYyxFQUFFLGFBQWE7WUFDN0IsaUJBQWlCLEVBQUUsQ0FBQyxlQUFlLENBQUM7U0FDckMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsSUFBSSxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztBQUUxRCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgY2hhdGJvdCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2hhdGJvdCc7XG5cbmNsYXNzIENoYXRib3RHdWFyZHJhaWxzSW50ZWcgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgZ3VhcmRyYWlsUG9saWN5ID0gaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdDbG91ZFdhdGNoUmVhZE9ubHlBY2Nlc3MnKTtcblxuICAgIG5ldyBjaGF0Ym90LlNsYWNrQ2hhbm5lbENvbmZpZ3VyYXRpb24odGhpcywgJ015U2xhY2tDaGFubmVsJywge1xuICAgICAgc2xhY2tDaGFubmVsQ29uZmlndXJhdGlvbk5hbWU6ICd0ZXN0LWNoYW5uZWwnLFxuICAgICAgc2xhY2tXb3Jrc3BhY2VJZDogJ1Q0OTIzOVU0VycsIC8vIG1vZGlmeSB0byB5b3VyIHNsYWNrIHdvcmtzcGFjZSBpZFxuICAgICAgc2xhY2tDaGFubmVsSWQ6ICdDMDE4N0pBQlVFOScsIC8vIG1vZGlmeSB0byB5b3VyIHNsYWNrIGNoYW5uZWwgaWRcbiAgICAgIGd1YXJkcmFpbFBvbGljaWVzOiBbZ3VhcmRyYWlsUG9saWN5XSxcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG5uZXcgQ2hhdGJvdEd1YXJkcmFpbHNJbnRlZyhhcHAsICdDaGF0Ym90R3VhcmRyYWlsc0ludGVnJyk7XG5cbmFwcC5zeW50aCgpO1xuIl19