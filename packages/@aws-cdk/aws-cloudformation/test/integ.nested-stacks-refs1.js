"use strict";
/// !cdk-integ *
Object.defineProperty(exports, "__esModule", { value: true });
// nested stack references a resource from a non-nested non-parent stack
const sns = require("@aws-cdk/aws-sns");
const core_1 = require("@aws-cdk/core");
class ConsumerNestedStack extends core_1.NestedStack {
    constructor(scope, id, topic) {
        super(scope, id);
        new sns.Topic(this, 'ConsumerTopic', {
            displayName: `Consumer of ${topic.topicName}`,
        });
    }
}
class ProducerStack extends core_1.Stack {
    constructor(scope, id) {
        super(scope, id);
        this.topic = new sns.Topic(this, 'MyTopic');
    }
}
class ParentStack extends core_1.Stack {
    constructor(scope, id, topic) {
        super(scope, id);
        new ConsumerNestedStack(this, 'Nested1', topic);
    }
}
const app = new core_1.App();
const producer = new ProducerStack(app, 'nest-stacks-refs1-producer');
new ParentStack(app, 'nested-stacks-refs1-parent-with-consumer', producer.topic);
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcubmVzdGVkLXN0YWNrcy1yZWZzMS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLm5lc3RlZC1zdGFja3MtcmVmczEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdCQUFnQjs7QUFFaEIsd0VBQXdFO0FBRXhFLHdDQUF3QztBQUN4Qyx3Q0FBd0Q7QUFHeEQsTUFBTSxtQkFBb0IsU0FBUSxrQkFBVztJQUMzQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWdCO1FBQ3hELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDbkMsV0FBVyxFQUFFLGVBQWUsS0FBSyxDQUFDLFNBQVMsRUFBRTtTQUM5QyxDQUFDLENBQUM7S0FDSjtDQUNGO0FBRUQsTUFBTSxhQUFjLFNBQVEsWUFBSztJQUUvQixZQUFZLEtBQWdCLEVBQUUsRUFBVTtRQUN0QyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM3QztDQUNGO0FBRUQsTUFBTSxXQUFZLFNBQVEsWUFBSztJQUM3QixZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWdCO1FBQ3hELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pEO0NBQ0Y7QUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQUcsRUFBRSxDQUFDO0FBQ3RCLE1BQU0sUUFBUSxHQUFHLElBQUksYUFBYSxDQUFDLEdBQUcsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0FBQ3RFLElBQUksV0FBVyxDQUFDLEdBQUcsRUFBRSwwQ0FBMEMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakYsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vICFjZGstaW50ZWcgKlxuXG4vLyBuZXN0ZWQgc3RhY2sgcmVmZXJlbmNlcyBhIHJlc291cmNlIGZyb20gYSBub24tbmVzdGVkIG5vbi1wYXJlbnQgc3RhY2tcblxuaW1wb3J0ICogYXMgc25zIGZyb20gJ0Bhd3MtY2RrL2F3cy1zbnMnO1xuaW1wb3J0IHsgQXBwLCBOZXN0ZWRTdGFjaywgU3RhY2sgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5jbGFzcyBDb25zdW1lck5lc3RlZFN0YWNrIGV4dGVuZHMgTmVzdGVkU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCB0b3BpYzogc25zLlRvcGljKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIG5ldyBzbnMuVG9waWModGhpcywgJ0NvbnN1bWVyVG9waWMnLCB7XG4gICAgICBkaXNwbGF5TmFtZTogYENvbnN1bWVyIG9mICR7dG9waWMudG9waWNOYW1lfWAsXG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgUHJvZHVjZXJTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHRvcGljOiBzbnMuVG9waWM7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgdGhpcy50b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ015VG9waWMnKTtcbiAgfVxufVxuXG5jbGFzcyBQYXJlbnRTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgdG9waWM6IHNucy5Ub3BpYykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBuZXcgQ29uc3VtZXJOZXN0ZWRTdGFjayh0aGlzLCAnTmVzdGVkMScsIHRvcGljKTtcbiAgfVxufVxuXG5jb25zdCBhcHAgPSBuZXcgQXBwKCk7XG5jb25zdCBwcm9kdWNlciA9IG5ldyBQcm9kdWNlclN0YWNrKGFwcCwgJ25lc3Qtc3RhY2tzLXJlZnMxLXByb2R1Y2VyJyk7XG5uZXcgUGFyZW50U3RhY2soYXBwLCAnbmVzdGVkLXN0YWNrcy1yZWZzMS1wYXJlbnQtd2l0aC1jb25zdW1lcicsIHByb2R1Y2VyLnRvcGljKTtcbmFwcC5zeW50aCgpO1xuIl19