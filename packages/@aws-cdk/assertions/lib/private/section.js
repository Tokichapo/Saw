"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterLogicalId = exports.formatFailure = exports.formatSectionMatchFailure = exports.formatAllMismatches = exports.formatAllMatches = exports.matchSection = void 0;
const sorting_1 = require("./sorting");
const match_1 = require("../match");
const matcher_1 = require("../matcher");
function matchSection(section, props) {
    const matcher = matcher_1.Matcher.isMatcher(props) ? props : match_1.Match.objectLike(props);
    const matching = {};
    const analyzed = {};
    const failures = new Array();
    eachEntryInSection(section, (logicalId, entry) => {
        analyzed[logicalId] = entry;
        const result = matcher.test(entry);
        result.finished();
        if (!result.hasFailed()) {
            matching[logicalId] = entry;
        }
        else {
            failures.push([logicalId, result]);
        }
    });
    if (Object.keys(matching).length > 0) {
        return { match: true, matches: matching, analyzedCount: Object.keys(analyzed).length, analyzed: analyzed };
    }
    else {
        // Sort by cost, use logicalId as a tie breaker. Take the 3 closest
        // matches (helps debugging in case we get the top pick wrong).
        failures.sort((0, sorting_1.sortKeyComparator)(([logicalId, result]) => [result.failCost, logicalId]));
        const closestResults = Object.fromEntries(failures.slice(0, 3));
        return { match: false, closestResults, analyzedCount: Object.keys(analyzed).length, analyzed: analyzed };
    }
}
exports.matchSection = matchSection;
function eachEntryInSection(section, cb) {
    for (const logicalId of Object.keys(section ?? {})) {
        const resource = section[logicalId];
        cb(logicalId, resource);
    }
}
function formatAllMatches(matches) {
    return [
        leftPad(JSON.stringify(matches, undefined, 2)),
    ].join('\n');
}
exports.formatAllMatches = formatAllMatches;
function formatAllMismatches(analyzed, matches = {}) {
    return [
        'The following resources do not match the given definition:',
        ...Object.keys(analyzed).filter(id => !(id in matches)).map(id => `\t${id}`),
    ].join('\n');
}
exports.formatAllMismatches = formatAllMismatches;
function formatSectionMatchFailure(qualifier, result, what = 'Template') {
    return [
        `${what} has ${result.analyzedCount} ${qualifier}`,
        result.analyzedCount > 0 ? ', but none match as expected' : '',
        '.\n',
        formatFailure(result.closestResults),
    ].join('');
}
exports.formatSectionMatchFailure = formatSectionMatchFailure;
function formatFailure(closestResults) {
    const keys = Object.keys(closestResults);
    if (keys.length === 0) {
        return 'No matches found';
    }
    return [
        `The ${keys.length} closest matches:`,
        ...keys.map(key => `${key} :: ${closestResults[key].renderMismatch()}`),
    ].join('\n');
}
exports.formatFailure = formatFailure;
function leftPad(x, indent = 2) {
    const pad = ' '.repeat(indent);
    return pad + x.split('\n').join(`\n${pad}`);
}
function filterLogicalId(section, logicalId) {
    // default signal for all logicalIds is '*'
    if (logicalId === '*')
        return section;
    return Object.entries(section ?? {})
        .filter(([k, _]) => k === logicalId)
        .reduce((agg, [k, v]) => { return { ...agg, [k]: v }; }, {});
}
exports.filterLogicalId = filterLogicalId;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQThDO0FBQzlDLG9DQUFpQztBQUNqQyx3Q0FBa0Q7QUFLbEQsU0FBZ0IsWUFBWSxDQUFDLE9BQVksRUFBRSxLQUFVO0lBQ25ELE1BQU0sT0FBTyxHQUFHLGlCQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0UsTUFBTSxRQUFRLEdBQTJCLEVBQUUsQ0FBQztJQUM1QyxNQUFNLFFBQVEsR0FBMkIsRUFBRSxDQUFDO0lBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksS0FBSyxFQUF5QixDQUFDO0lBRXBELGtCQUFrQixDQUNoQixPQUFPLEVBQ1AsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDbkIsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUM1QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQ3ZCLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDN0I7YUFBTTtZQUNMLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUNwQztJQUNILENBQUMsQ0FDRixDQUFDO0lBQ0YsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDcEMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUs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O0FBQ2YsQ0FBQztBQVZELHNDQVVDO0FBRUQsU0FBUyxPQUFPLENBQUMsQ0FBUyxFQUFFLFNBQWlCLENBQUM7SUFDNUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQixPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxPQUE4QixFQUFFLFNBQWlCO0lBQy9FLDJDQUEyQztJQUMzQyxJQUFJLFNBQVMsS0FBSyxHQUFHO1FBQUUsT0FBTyxPQUFPLENBQUM7SUFFdEMsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7U0FDakMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUM7U0FDbkMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBUEQsMENBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzb3J0S2V5Q29tcGFyYXRvciB9IGZyb20gJy4vc29ydGluZyc7XG5pbXBvcnQgeyBNYXRjaCB9IGZyb20gJy4uL21hdGNoJztcbmltcG9ydCB7IE1hdGNoZXIsIE1hdGNoUmVzdWx0IH0gZnJvbSAnLi4vbWF0Y2hlcic7XG5cbmV4cG9ydCB0eXBlIE1hdGNoU3VjY2VzcyA9IHsgbWF0Y2g6IHRydWUsIG1hdGNoZXM6IHsgW2tleTogc3RyaW5nXTogYW55IH0sIGFuYWx5emVkOiB7IFtrZXk6IHN0cmluZ106IGFueSB9LCBhbmFseXplZENvdW50OiBudW1iZXIgfTtcbmV4cG9ydCB0eXBlIE1hdGNoRmFpbHVyZSA9IHsgbWF0Y2g6IGZhbHNlLCBjbG9zZXN0UmVzdWx0czogUmVjb3JkPHN0cmluZywgTWF0Y2hSZXN1bHQ+LCBhbmFseXplZDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSwgYW5hbHl6ZWRDb3VudDogbnVtYmVyIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaFNlY3Rpb24oc2VjdGlvbjogYW55LCBwcm9wczogYW55KTogTWF0Y2hTdWNjZXNzIHwgTWF0Y2hGYWlsdXJlIHtcbiAgY29uc3QgbWF0Y2hlciA9IE1hdGNoZXIuaXNNYXRjaGVyKHByb3BzKSA/IHByb3BzIDogTWF0Y2gub2JqZWN0TGlrZShwcm9wcyk7XG4gIGNvbnN0IG1hdGNoaW5nOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XG4gIGNvbnN0IGFuYWx5emVkOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XG4gIGNvbnN0IGZhaWx1cmVzID0gbmV3IEFycmF5PFtzdHJpbmcsIE1hdGNoUmVzdWx0XT4oKTtcblxuICBlYWNoRW50cnlJblNlY3Rpb24oXG4gICAgc2VjdGlvbixcbiAgICAobG9naWNhbElkLCBlbnRyeSkgPT4ge1xuICAgICAgYW5hbHl6ZWRbbG9naWNhbElkXSA9IGVudHJ5O1xuICAgICAgY29uc3QgcmVzdWx0ID0gbWF0Y2hlci50ZXN0KGVudHJ5KTtcbiAgICAgIHJlc3VsdC5maW5pc2hlZCgpO1xuICAgICAgaWYgKCFyZXN1bHQuaGFzRmFpbGVkKCkpIHtcbiAgICAgICAgbWF0Y2hpbmdbbG9naWNhbElkXSA9IGVudHJ5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbHVyZXMucHVzaChbbG9naWNhbElkLCByZXN1bHRdKTtcbiAgICAgIH1cbiAgICB9LFxuICApO1xuICBpZiAoT2JqZWN0LmtleXMobWF0Y2hpbmcpLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBtYXRjaDogdHJ1ZSwgbWF0Y2hlczogbWF0Y2hpbmcsIGFuYWx5emVkQ291bnQ6IE9iamVjdC5rZXlzKGFuYWx5emVkKS5sZW5ndGgsIGFuYWx5emVkOiBhbmFseXplZCB9O1xuICB9IGVsc2Uge1xuICAgIC8vIFNvcnQgYnkgY29zdCwgdXNlIGxvZ2ljYWxJZCBhcyBhIHRpZSBicmVha2VyLiBUYWtlIHRoZSAzIGNsb3Nlc3RcbiAgICAvLyBtYXRjaGVzIChoZWxwcyBkZWJ1Z2dpbmcgaW4gY2FzZSB3ZSBnZXQgdGhlIHRvcCBwaWNrIHdyb25nKS5cbiAgICBmYWlsdXJlcy5zb3J0KHNvcnRLZXlDb21wYXJhdG9yKChbbG9naWNhbElkLCByZXN1bHRdKSA9PiBbcmVzdWx0LmZhaWxDb3N0LCBsb2dpY2FsSWRdKSk7XG4gICAgY29uc3QgY2xvc2VzdFJlc3VsdHMgPSBPYmplY3QuZnJvbUVudHJpZXMoZmFpbHVyZXMuc2xpY2UoMCwgMykpO1xuICAgIHJldHVybiB7IG1hdGNoOiBmYWxzZSwgY2xvc2VzdFJlc3VsdHMsIGFuYWx5emVkQ291bnQ6IE9iamVjdC5rZXlzKGFuYWx5emVkKS5sZW5ndGgsIGFuYWx5emVkOiBhbmFseXplZCB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGVhY2hFbnRyeUluU2VjdGlvbihcbiAgc2VjdGlvbjogYW55LFxuICBjYjogKGxvZ2ljYWxJZDogc3RyaW5nLCBlbnRyeTogeyBba2V5OiBzdHJpbmddOiBhbnkgfSkgPT4gdm9pZCk6IHZvaWQge1xuXG4gIGZvciAoY29uc3QgbG9naWNhbElkIG9mIE9iamVjdC5rZXlzKHNlY3Rpb24gPz8ge30pKSB7XG4gICAgY29uc3QgcmVzb3VyY2U6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSBzZWN0aW9uW2xvZ2ljYWxJZF07XG4gICAgY2IobG9naWNhbElkLCByZXNvdXJjZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEFsbE1hdGNoZXMobWF0Y2hlczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSk6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgbGVmdFBhZChKU09OLnN0cmluZ2lmeShtYXRjaGVzLCB1bmRlZmluZWQsIDIpKSxcbiAgXS5qb2luKCdcXG4nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEFsbE1pc21hdGNoZXMoYW5hbHl6ZWQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0sIG1hdGNoZXM6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7fSk6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgJ1RoZSBmb2xsb3dpbmcgcmVzb3VyY2VzIGRvIG5vdCBtYXRjaCB0aGUgZ2l2ZW4gZGVmaW5pdGlvbjonLFxuICAgIC4uLk9iamVjdC5rZXlzKGFuYWx5emVkKS5maWx0ZXIoaWQgPT4gIShpZCBpbiBtYXRjaGVzKSkubWFwKGlkID0+IGBcXHQke2lkfWApLFxuICBdLmpvaW4oJ1xcbicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0U2VjdGlvbk1hdGNoRmFpbHVyZShxdWFsaWZpZXI6IHN0cmluZywgcmVzdWx0OiBNYXRjaEZhaWx1cmUsIHdoYXQ9J1RlbXBsYXRlJyk6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgYCR7d2hhdH0gaGFzICR7cmVzdWx0LmFuYWx5emVkQ291bnR9ICR7cXVhbGlmaWVyfWAsXG4gICAgcmVzdWx0LmFuYWx5emVkQ291bnQgPiAwID8gJywgYnV0IG5vbmUgbWF0Y2ggYXMgZXhwZWN0ZWQnIDogJycsXG4gICAgJy5cXG4nLFxuICAgIGZvcm1hdEZhaWx1cmUocmVzdWx0LmNsb3Nlc3RSZXN1bHRzKSxcbiAgXS5qb2luKCcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEZhaWx1cmUoY2xvc2VzdFJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIE1hdGNoUmVzdWx0Pik6IHN0cmluZyB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhjbG9zZXN0UmVzdWx0cyk7XG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAnTm8gbWF0Y2hlcyBmb3VuZCc7XG4gIH1cblxuICByZXR1cm4gW1xuICAgIGBUaGUgJHtrZXlzLmxlbmd0aH0gY2xvc2VzdCBtYXRjaGVzOmAsXG4gICAgLi4ua2V5cy5tYXAoa2V5ID0+IGAke2tleX0gOjogJHtjbG9zZXN0UmVzdWx0c1trZXldLnJlbmRlck1pc21hdGNoKCl9YCksXG4gIF0uam9pbignXFxuJyk7XG59XG5cbmZ1bmN0aW9uIGxlZnRQYWQoeDogc3RyaW5nLCBpbmRlbnQ6IG51bWJlciA9IDIpOiBzdHJpbmcge1xuICBjb25zdCBwYWQgPSAnICcucmVwZWF0KGluZGVudCk7XG4gIHJldHVybiBwYWQgKyB4LnNwbGl0KCdcXG4nKS5qb2luKGBcXG4ke3BhZH1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckxvZ2ljYWxJZChzZWN0aW9uOiB7IFtrZXk6IHN0cmluZ106IHt9IH0sIGxvZ2ljYWxJZDogc3RyaW5nKTogeyBba2V5OiBzdHJpbmddOiB7fSB9IHtcbiAgLy8gZGVmYXVsdCBzaWduYWwgZm9yIGFsbCBsb2dpY2FsSWRzIGlzICcqJ1xuICBpZiAobG9naWNhbElkID09PSAnKicpIHJldHVybiBzZWN0aW9uO1xuXG4gIHJldHVybiBPYmplY3QuZW50cmllcyhzZWN0aW9uID8/IHt9KVxuICAgIC5maWx0ZXIoKFtrLCBfXSkgPT4gayA9PT0gbG9naWNhbElkKVxuICAgIC5yZWR1Y2UoKGFnZywgW2ssIHZdKSA9PiB7IHJldHVybiB7IC4uLmFnZywgW2tdOiB2IH07IH0sIHt9KTtcbn1cbiJdfQ==