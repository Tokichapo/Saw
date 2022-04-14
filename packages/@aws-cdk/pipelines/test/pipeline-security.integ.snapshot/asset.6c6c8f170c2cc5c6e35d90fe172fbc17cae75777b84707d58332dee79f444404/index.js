"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require("aws-sdk");
const client = new AWS.CodePipeline({ apiVersion: '2015-07-09' });
const TIMEOUT_IN_MINUTES = 5;
const sleep = (seconds) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};
async function handler(event, _context) {
    const { PipelineName: pipelineName, StageName: stageName, ActionName: actionName, } = event;
    function parseState(response) {
        const stages = response.stageStates;
        const validStages = stages === null || stages === void 0 ? void 0 : stages.filter((s) => s.stageName === stageName);
        const manualApproval = validStages.length &&
            validStages[0].actionStates.filter((state) => state.actionName === actionName);
        const latest = manualApproval && manualApproval.length &&
            manualApproval[0].latestExecution;
        return latest ? latest.token : undefined;
    }
    const deadline = Date.now() + TIMEOUT_IN_MINUTES * 60000;
    while (Date.now() < deadline) {
        const response = await client.getPipelineState({ name: pipelineName }).promise();
        const token = parseState(response);
        if (token) {
            await client.putApprovalResult({
                pipelineName,
                actionName,
                stageName,
                result: {
                    summary: 'No security changes detected. Automatically approved by Lambda.',
                    status: 'Approved',
                },
                token,
            }).promise();
            return;
        }
        await sleep(5);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2REFBNkQ7QUFDN0QsK0JBQStCO0FBRS9CLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0FBRTdCLE1BQU0sS0FBSyxHQUFHLENBQUMsT0FBZSxFQUFFLEVBQUU7SUFDaEMsT0FBTyxJQUFJLE9BQU8sQ0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDM0UsQ0FBQyxDQUFDO0FBRUssS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUFVLEVBQUUsUUFBYTtJQUNyRCxNQUFNLEVBQ0osWUFBWSxFQUFFLFlBQVksRUFDMUIsU0FBUyxFQUFFLFNBQVMsRUFDcEIsVUFBVSxFQUFFLFVBQVUsR0FDdkIsR0FBRyxLQUFLLENBQUM7SUFFVixTQUFTLFVBQVUsQ0FBQyxRQUFhO1FBQy9CLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDcEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLE1BQU0sQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsQ0FBQztRQUMxRSxNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsTUFBTTtZQUN2QyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUMsQ0FBQztRQUN0RixNQUFNLE1BQU0sR0FBRyxjQUFjLElBQUksY0FBYyxDQUFDLE1BQU07WUFDcEQsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztRQUVwQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQzNDLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0lBQ3pELE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFFBQVEsRUFBRTtRQUM1QixNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pGLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxJQUFJLEtBQUssRUFBRTtZQUNULE1BQU0sTUFBTSxDQUFDLGlCQUFpQixDQUFDO2dCQUM3QixZQUFZO2dCQUNaLFVBQVU7Z0JBQ1YsU0FBUztnQkFDVCxNQUFNLEVBQUU7b0JBQ04sT0FBTyxFQUFFLGlFQUFpRTtvQkFDMUUsTUFBTSxFQUFFLFVBQVU7aUJBQ25CO2dCQUNELEtBQUs7YUFDTixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYixPQUFPO1NBQ1I7UUFDRCxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNoQjtBQUNILENBQUM7QUFyQ0QsMEJBcUNDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0ICogYXMgQVdTIGZyb20gJ2F3cy1zZGsnO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgQVdTLkNvZGVQaXBlbGluZSh7IGFwaVZlcnNpb246ICcyMDE1LTA3LTA5JyB9KTtcbmNvbnN0IFRJTUVPVVRfSU5fTUlOVVRFUyA9IDU7XG5cbmNvbnN0IHNsZWVwID0gKHNlY29uZHM6IG51bWJlcikgPT4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHNlY29uZHMgKiAxMDAwKSk7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogYW55LCBfY29udGV4dDogYW55KSB7XG4gIGNvbnN0IHtcbiAgICBQaXBlbGluZU5hbWU6IHBpcGVsaW5lTmFtZSxcbiAgICBTdGFnZU5hbWU6IHN0YWdlTmFtZSxcbiAgICBBY3Rpb25OYW1lOiBhY3Rpb25OYW1lLFxuICB9ID0gZXZlbnQ7XG5cbiAgZnVuY3Rpb24gcGFyc2VTdGF0ZShyZXNwb25zZTogYW55KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBzdGFnZXMgPSByZXNwb25zZS5zdGFnZVN0YXRlcztcbiAgICBjb25zdCB2YWxpZFN0YWdlcyA9IHN0YWdlcz8uZmlsdGVyKChzOiBhbnkpID0+IHMuc3RhZ2VOYW1lID09PSBzdGFnZU5hbWUpO1xuICAgIGNvbnN0IG1hbnVhbEFwcHJvdmFsID0gdmFsaWRTdGFnZXMubGVuZ3RoICYmXG4gICAgICB2YWxpZFN0YWdlc1swXS5hY3Rpb25TdGF0ZXMuZmlsdGVyKChzdGF0ZTogYW55KSA9PiBzdGF0ZS5hY3Rpb25OYW1lID09PSBhY3Rpb25OYW1lKTtcbiAgICBjb25zdCBsYXRlc3QgPSBtYW51YWxBcHByb3ZhbCAmJiBtYW51YWxBcHByb3ZhbC5sZW5ndGggJiZcbiAgICAgIG1hbnVhbEFwcHJvdmFsWzBdLmxhdGVzdEV4ZWN1dGlvbjtcblxuICAgIHJldHVybiBsYXRlc3QgPyBsYXRlc3QudG9rZW4gOiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBUSU1FT1VUX0lOX01JTlVURVMgKiA2MDAwMDtcbiAgd2hpbGUgKERhdGUubm93KCkgPCBkZWFkbGluZSkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LmdldFBpcGVsaW5lU3RhdGUoeyBuYW1lOiBwaXBlbGluZU5hbWUgfSkucHJvbWlzZSgpO1xuICAgIGNvbnN0IHRva2VuID0gcGFyc2VTdGF0ZShyZXNwb25zZSk7XG4gICAgaWYgKHRva2VuKSB7XG4gICAgICBhd2FpdCBjbGllbnQucHV0QXBwcm92YWxSZXN1bHQoe1xuICAgICAgICBwaXBlbGluZU5hbWUsXG4gICAgICAgIGFjdGlvbk5hbWUsXG4gICAgICAgIHN0YWdlTmFtZSxcbiAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgc3VtbWFyeTogJ05vIHNlY3VyaXR5IGNoYW5nZXMgZGV0ZWN0ZWQuIEF1dG9tYXRpY2FsbHkgYXBwcm92ZWQgYnkgTGFtYmRhLicsXG4gICAgICAgICAgc3RhdHVzOiAnQXBwcm92ZWQnLFxuICAgICAgICB9LFxuICAgICAgICB0b2tlbixcbiAgICAgIH0pLnByb21pc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgc2xlZXAoNSk7XG4gIH1cbn1cbiJdfQ==