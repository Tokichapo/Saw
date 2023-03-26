"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderGraph = exports.render = void 0;
const cdk = require("@aws-cdk/core");
const sfn = require("../../lib");
/**
 * Renders a state machine definition
 *
 * @param stack stack for the state machine
 * @param definition state machine definition
 */
function render(stack, definition) {
    return stack.resolve(new sfn.StateGraph(definition.startState, 'Test Graph').toGraphJson());
}
exports.render = render;
function renderGraph(definition) {
    return render(new cdk.Stack(), definition);
}
exports.renderGraph = renderGraph;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLXV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZW5kZXItdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsaUNBQWlDO0FBRWpDOzs7OztHQUtHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLEtBQWdCLEVBQUUsVUFBMEI7SUFDakUsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDOUYsQ0FBQztBQUZELHdCQUVDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLFVBQTBCO0lBQ3BELE9BQU8sTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUFGRCxrQ0FFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIHNmbiBmcm9tICcuLi8uLi9saWInO1xuXG4vKipcbiAqIFJlbmRlcnMgYSBzdGF0ZSBtYWNoaW5lIGRlZmluaXRpb25cbiAqXG4gKiBAcGFyYW0gc3RhY2sgc3RhY2sgZm9yIHRoZSBzdGF0ZSBtYWNoaW5lXG4gKiBAcGFyYW0gZGVmaW5pdGlvbiBzdGF0ZSBtYWNoaW5lIGRlZmluaXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcihzdGFjazogY2RrLlN0YWNrLCBkZWZpbml0aW9uOiBzZm4uSUNoYWluYWJsZSkge1xuICByZXR1cm4gc3RhY2sucmVzb2x2ZShuZXcgc2ZuLlN0YXRlR3JhcGgoZGVmaW5pdGlvbi5zdGFydFN0YXRlLCAnVGVzdCBHcmFwaCcpLnRvR3JhcGhKc29uKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyR3JhcGgoZGVmaW5pdGlvbjogc2ZuLklDaGFpbmFibGUpIHtcbiAgcmV0dXJuIHJlbmRlcihuZXcgY2RrLlN0YWNrKCksIGRlZmluaXRpb24pO1xufVxuIl19