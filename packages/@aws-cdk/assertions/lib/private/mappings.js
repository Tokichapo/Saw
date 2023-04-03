"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMapping = exports.findMappings = void 0;
const section_1 = require("./section");
function findMappings(template, logicalId, props = {}) {
    const section = template.Mappings ?? {};
    const result = (0, section_1.matchSection)((0, section_1.filterLogicalId)(section, logicalId), props);
    if (!result.match) {
        return {};
    }
    return result.matches;
}
exports.findMappings = findMappings;
function hasMapping(template, logicalId, props) {
    const section = template.Mappings ?? {};
    const result = (0, section_1.matchSection)((0, section_1.filterLogicalId)(section, logicalId), props);
    if (result.match) {
        return;
    }
    return (0, section_1.formatSectionMatchFailure)(`mappings with logicalId ${logicalId}`, result);
}
exports.hasMapping = hasMapping;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtYXBwaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1Q0FBcUY7QUFHckYsU0FBZ0IsWUFBWSxDQUFDLFFBQWtCLEVBQUUsU0FBaUIsRUFBRSxRQUFhLEVBQUU7SUFDakYsTUFBTSxPQUFPLEdBQTJCLFFBQVEsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO0lBQ2hFLE1BQU0sTUFBTSxHQUFHLElBQUEsc0JBQVksRUFBQyxJQUFBLHlCQUFlLEVBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXhFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2pCLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFFRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDeEIsQ0FBQztBQVRELG9DQVNDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLFFBQWtCLEVBQUUsU0FBaUIsRUFBRSxLQUFVO0lBQzFFLE1BQU0sT0FBTyxHQUEwQixRQUFRLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztJQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFBLHNCQUFZLEVBQUMsSUFBQSx5QkFBZSxFQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4RSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDaEIsT0FBTztLQUNSO0lBRUQsT0FBTyxJQUFBLG1DQUF5QixFQUFDLDJCQUEyQixTQUFTLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNuRixDQUFDO0FBUkQsZ0NBUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmaWx0ZXJMb2dpY2FsSWQsIG1hdGNoU2VjdGlvbiwgZm9ybWF0U2VjdGlvbk1hdGNoRmFpbHVyZSB9IGZyb20gJy4vc2VjdGlvbic7XG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJy4vdGVtcGxhdGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gZmluZE1hcHBpbmdzKHRlbXBsYXRlOiBUZW1wbGF0ZSwgbG9naWNhbElkOiBzdHJpbmcsIHByb3BzOiBhbnkgPSB7fSk6IHsgW2tleTogc3RyaW5nXTogeyBba2V5OiBzdHJpbmddOiBhbnkgfSB9IHtcbiAgY29uc3Qgc2VjdGlvbjogeyBba2V5OiBzdHJpbmddIDoge30gfSA9IHRlbXBsYXRlLk1hcHBpbmdzID8/IHt9O1xuICBjb25zdCByZXN1bHQgPSBtYXRjaFNlY3Rpb24oZmlsdGVyTG9naWNhbElkKHNlY3Rpb24sIGxvZ2ljYWxJZCksIHByb3BzKTtcblxuICBpZiAoIXJlc3VsdC5tYXRjaCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQubWF0Y2hlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc01hcHBpbmcodGVtcGxhdGU6IFRlbXBsYXRlLCBsb2dpY2FsSWQ6IHN0cmluZywgcHJvcHM6IGFueSk6IHN0cmluZyB8IHZvaWQge1xuICBjb25zdCBzZWN0aW9uOiB7IFtrZXk6IHN0cmluZ106IHt9IH0gPSB0ZW1wbGF0ZS5NYXBwaW5ncyA/PyB7fTtcbiAgY29uc3QgcmVzdWx0ID0gbWF0Y2hTZWN0aW9uKGZpbHRlckxvZ2ljYWxJZChzZWN0aW9uLCBsb2dpY2FsSWQpLCBwcm9wcyk7XG4gIGlmIChyZXN1bHQubWF0Y2gpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gZm9ybWF0U2VjdGlvbk1hdGNoRmFpbHVyZShgbWFwcGluZ3Mgd2l0aCBsb2dpY2FsSWQgJHtsb2dpY2FsSWR9YCwgcmVzdWx0KTtcbn0iXX0=