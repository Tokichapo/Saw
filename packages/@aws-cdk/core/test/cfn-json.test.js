"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const cfn_json_1 = require("../lib/cfn-json");
const index_1 = require("../lib/private/cfn-utils-provider/index");
describe('cfn json', () => {
    test('resolves to a fn::getatt', () => {
        // GIVEN
        const app = new lib_1.App();
        const stack = new lib_1.Stack(app, 'test');
        // WHEN
        const json = new cfn_json_1.CfnJson(stack, 'MyCfnJson', {
            value: {
                hello: 1234,
                world: { bar: 1234 },
            },
        });
        // THEN
        const template = app.synth().getStackArtifact(stack.artifactId).template;
        // input is stringified
        expect(template.Resources.MyCfnJson248769BB.Properties.Value).toEqual('{"hello":1234,"world":{"bar":1234}}');
        // output is basically an Fn::GetAtt
        expect(stack.resolve(json)).toEqual({ 'Fn::GetAtt': ['MyCfnJson248769BB', 'Value'] });
    });
    test('tokens and intrinsics can be used freely in keys or values', () => {
        // GIVEN
        const app = new lib_1.App();
        const stack = new lib_1.Stack(app, 'test');
        const other = new lib_1.CfnResource(stack, 'Other', { type: 'MyResource' });
        // WHEN
        new cfn_json_1.CfnJson(stack, 'MyCfnJson', {
            value: {
                [other.ref]: 1234,
                world: {
                    bar: `this is a ${lib_1.Lazy.string({ produce: () => 'I am lazy' })}`,
                },
            },
        });
        // THEN
        const template = app.synth().getStackArtifact(stack.artifactId).template;
        expect(template.Resources.MyCfnJson248769BB.Properties.Value).toEqual({
            'Fn::Join': ['', ['{"', { Ref: 'Other' }, '":1234,"world":{"bar":"this is a I am lazy"}}']],
        });
    });
    test('JSON.stringify() will return the CFN-stringified value to avoid circular references', () => {
        // GIVEN
        const stack = new lib_1.Stack();
        const res = new lib_1.CfnResource(stack, 'MyResource', { type: 'Foo' });
        const cfnjson = new cfn_json_1.CfnJson(stack, 'MyCfnJson', {
            value: {
                [`ref=${res.ref}`]: `this is a ${lib_1.Lazy.string({ produce: () => 'I am lazy' })}`,
            },
        });
        // WHEN
        const str = JSON.stringify(cfnjson);
        // THEN
        expect(typeof (str)).toEqual('string');
        expect(stack.resolve(str)).toEqual({
            'Fn::Join': ['', ['"{"ref=', { Ref: 'MyResource' }, '":"this is a I am lazy"}"']],
        });
    });
    test('resource provider simply parses json and reflects back as an attribute', async () => {
        const input = { foo: 1234 };
        const response = await (0, index_1.handler)({
            ResourceType: "Custom::AWSCDKCfnJson" /* CfnUtilsResourceType.CFN_JSON */,
            ResourceProperties: {
                Value: JSON.stringify(input),
            },
        });
        expect(input).toEqual(response.Data.Value);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2ZuLWpzb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNmbi1qc29uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxnQ0FBdUQ7QUFDdkQsOENBQTBDO0FBRTFDLG1FQUFrRTtBQUVsRSxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUV4QixJQUFJLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3BDLFFBQVE7UUFDUixNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQUcsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sS0FBSyxHQUFHLElBQUksV0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVyQyxPQUFPO1FBQ1AsTUFBTSxJQUFJLEdBQUcsSUFBSSxrQkFBTyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUU7WUFDM0MsS0FBSyxFQUFFO2dCQUNMLEtBQUssRUFBRSxJQUFJO2dCQUNYLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7YUFDckI7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPO1FBQ1AsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFFekUsdUJBQXVCO1FBQ3ZCLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUU3RyxvQ0FBb0M7UUFDcEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDeEYsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUUs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LENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0MsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgQ2ZuUmVzb3VyY2UsIExhenksIFN0YWNrIH0gZnJvbSAnLi4vbGliJztcbmltcG9ydCB7IENmbkpzb24gfSBmcm9tICcuLi9saWIvY2ZuLWpzb24nO1xuaW1wb3J0IHsgQ2ZuVXRpbHNSZXNvdXJjZVR5cGUgfSBmcm9tICcuLi9saWIvcHJpdmF0ZS9jZm4tdXRpbHMtcHJvdmlkZXIvY29uc3RzJztcbmltcG9ydCB7IGhhbmRsZXIgfSBmcm9tICcuLi9saWIvcHJpdmF0ZS9jZm4tdXRpbHMtcHJvdmlkZXIvaW5kZXgnO1xuXG5kZXNjcmliZSgnY2ZuIGpzb24nLCAoKSA9PiB7XG5cbiAgdGVzdCgncmVzb2x2ZXMgdG8gYSBmbjo6Z2V0YXR0JywgKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IFN0YWNrKGFwcCwgJ3Rlc3QnKTtcblxuICAgIC8vIFdIRU5cbiAgICBjb25zdCBqc29uID0gbmV3IENmbkpzb24oc3RhY2ssICdNeUNmbkpzb24nLCB7XG4gICAgICB2YWx1ZToge1xuICAgICAgICBoZWxsbzogMTIzNCxcbiAgICAgICAgd29ybGQ6IHsgYmFyOiAxMjM0IH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIGNvbnN0IHRlbXBsYXRlID0gYXBwLnN5bnRoKCkuZ2V0U3RhY2tBcnRpZmFjdChzdGFjay5hcnRpZmFjdElkKS50ZW1wbGF0ZTtcblxuICAgIC8vIGlucHV0IGlzIHN0cmluZ2lmaWVkXG4gICAgZXhwZWN0KHRlbXBsYXRlLlJlc291cmNlcy5NeUNmbkpzb24yNDg3NjlCQi5Qcm9wZXJ0aWVzLlZhbHVlKS50b0VxdWFsKCd7XCJoZWxsb1wiOjEyMzQsXCJ3b3JsZFwiOntcImJhclwiOjEyMzR9fScpO1xuXG4gICAgLy8gb3V0cHV0IGlzIGJhc2ljYWxseSBhbiBGbjo6R2V0QXR0XG4gICAgZXhwZWN0KHN0YWNrLnJlc29sdmUoanNvbikpLnRvRXF1YWwoeyAnRm46OkdldEF0dCc6IFsnTXlDZm5Kc29uMjQ4NzY5QkInLCAnVmFsdWUnXSB9KTtcbiAgfSk7XG5cbiAgdGVzdCgndG9rZW5zIGFuZCBpbnRyaW5zaWNzIGNhbiBiZSB1c2VkIGZyZWVseSBpbiBrZXlzIG9yIHZhbHVlcycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBTdGFjayhhcHAsICd0ZXN0Jyk7XG4gICAgY29uc3Qgb3RoZXIgPSBuZXcgQ2ZuUmVzb3VyY2Uoc3RhY2ssICdPdGhlcicsIHsgdHlwZTogJ015UmVzb3VyY2UnIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIG5ldyBDZm5Kc29uKHN0YWNrLCAnTXlDZm5Kc29uJywge1xuICAgICAgdmFsdWU6IHtcbiAgICAgICAgW290aGVyLnJlZl06IDEyMzQsXG4gICAgICAgIHdvcmxkOiB7XG4gICAgICAgICAgYmFyOiBgdGhpcyBpcyBhICR7TGF6eS5zdHJpbmcoeyBwcm9kdWNlOiAoKSA9PiAnSSBhbSBsYXp5JyB9KX1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFRIRU5cbiAgICBjb25zdCB0ZW1wbGF0ZSA9IGFwcC5zeW50aCgpLmdldFN0YWNrQXJ0aWZhY3Qoc3RhY2suYXJ0aWZhY3RJZCkudGVtcGxhdGU7XG5cbiAgICBleHBlY3QodGVtcGxhdGUuUmVzb3VyY2VzLk15Q2ZuSnNvbjI0ODc2OUJCLlByb3BlcnRpZXMuVmFsdWUpLnRvRXF1YWwoe1xuICAgICAgJ0ZuOjpKb2luJzogWycnLCBbJ3tcIicsIHsgUmVmOiAnT3RoZXInIH0sICdcIjoxMjM0LFwid29ybGRcIjp7XCJiYXJcIjpcInRoaXMgaXMgYSBJIGFtIGxhenlcIn19J11dLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdKU09OLnN0cmluZ2lmeSgpIHdpbGwgcmV0dXJuIHRoZSBDRk4tc3RyaW5naWZpZWQgdmFsdWUgdG8gYXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlcycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHN0YWNrID0gbmV3IFN0YWNrKCk7XG4gICAgY29uc3QgcmVzID0gbmV3IENmblJlc291cmNlKHN0YWNrLCAnTXlSZXNvdXJjZScsIHsgdHlwZTogJ0ZvbycgfSk7XG4gICAgY29uc3QgY2ZuanNvbiA9IG5ldyBDZm5Kc29uKHN0YWNrLCAnTXlDZm5Kc29uJywge1xuICAgICAgdmFsdWU6IHtcbiAgICAgICAgW2ByZWY9JHtyZXMucmVmfWBdOiBgdGhpcyBpcyBhICR7TGF6eS5zdHJpbmcoeyBwcm9kdWNlOiAoKSA9PiAnSSBhbSBsYXp5JyB9KX1gLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFdIRU5cbiAgICBjb25zdCBzdHIgPSBKU09OLnN0cmluZ2lmeShjZm5qc29uKTtcblxuICAgIC8vIFRIRU5cbiAgICBleHBlY3QodHlwZW9mKHN0cikpLnRvRXF1YWwoJ3N0cmluZycpO1xuICAgIGV4cGVjdChzdGFjay5yZXNvbHZlKHN0cikpLnRvRXF1YWwoe1xuICAgICAgJ0ZuOjpKb2luJzogWycnLCBbJ1wie1wicmVmPScsIHsgUmVmOiAnTXlSZXNvdXJjZScgfSwgJ1wiOlwidGhpcyBpcyBhIEkgYW0gbGF6eVwifVwiJ11dLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KCdyZXNvdXJjZSBwcm92aWRlciBzaW1wbHkgcGFyc2VzIGpzb24gYW5kIHJlZmxlY3RzIGJhY2sgYXMgYW4gYXR0cmlidXRlJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0geyBmb286IDEyMzQgfTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGhhbmRsZXIoe1xuICAgICAgUmVzb3VyY2VUeXBlOiBDZm5VdGlsc1Jlc291cmNlVHlwZS5DRk5fSlNPTixcbiAgICAgIFJlc291cmNlUHJvcGVydGllczoge1xuICAgICAgICBWYWx1ZTogSlNPTi5zdHJpbmdpZnkoaW5wdXQpLFxuICAgICAgfSxcbiAgICB9IGFzIGFueSk7XG4gICAgZXhwZWN0KGlucHV0KS50b0VxdWFsKHJlc3BvbnNlLkRhdGEuVmFsdWUpO1xuICB9KTtcbn0pO1xuIl19