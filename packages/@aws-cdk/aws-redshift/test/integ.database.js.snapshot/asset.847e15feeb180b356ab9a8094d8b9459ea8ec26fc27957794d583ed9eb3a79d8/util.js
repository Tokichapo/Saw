"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areColumnsEqual = exports.getSortKeyColumns = exports.getDistKeyColumn = exports.makePhysicalId = void 0;
function makePhysicalId(resourceName, clusterProps, requestId) {
    return `${clusterProps.clusterName}:${clusterProps.databaseName}:${resourceName}:${requestId}`;
}
exports.makePhysicalId = makePhysicalId;
function getDistKeyColumn(columns) {
    // string comparison is required for custom resource since everything is passed as string
    const distKeyColumns = columns.filter(column => column.distKey === true || column.distKey === 'true');
    if (distKeyColumns.length === 0) {
        return undefined;
    }
    else if (distKeyColumns.length > 1) {
        throw new Error('Multiple dist key columns found');
    }
    return distKeyColumns[0];
}
exports.getDistKeyColumn = getDistKeyColumn;
function getSortKeyColumns(columns) {
    // string comparison is required for custom resource since everything is passed as string
    return columns.filter(column => column.sortKey === true || column.sortKey === 'true');
}
exports.getSortKeyColumns = getSortKeyColumns;
function areColumnsEqual(columnsA, columnsB) {
    if (columnsA.length !== columnsB.length) {
        return false;
    }
    return columnsA.every(columnA => {
        return columnsB.find(column => column.name === columnA.name && column.dataType === columnA.dataType);
    });
}
exports.areColumnsEqual = areColumnsEqual;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsU0FBZ0IsY0FBYyxDQUFDLFlBQW9CLEVBQUUsWUFBMEIsRUFBRSxTQUFpQjtJQUNoRyxPQUFPLEdBQUcsWUFBWSxDQUFDLFdBQVcsSUFBSSxZQUFZLENBQUMsWUFBWSxJQUFJLFlBQVksSUFBSSxTQUFTLEVBQUUsQ0FBQztBQUNqRyxDQUFDO0FBRkQsd0NBRUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxPQUFpQjtJQUNoRCx5RkFBeUY7SUFDekYsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssSUFBSSxJQUFLLE1BQU0sQ0FBQyxPQUE2QixLQUFLLE1BQU0sQ0FBQyxDQUFDO0lBRTdILElBQUksY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDL0IsT0FBTyxTQUFTLENBQUM7S0FDbEI7U0FBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztLQUNwRDtJQUVELE9BQU8sY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUFYRCw0Q0FXQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWlCO0lBQ2pELHlGQUF5RjtJQUN6RixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxLQUFLLElBQUksSUFBSyxNQUFNLENBQUMsT0FBNkIsS0FBSyxNQUFNLENBQUMsQ0FBQztBQUMvRyxDQUFDO0FBSEQsOENBR0M7QUFFRCxTQUFnQixlQUFlLENBQUMsUUFBa0IsRUFBRSxRQUFrQjtJQUNwRSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLE1BQU0sRUFBRTtRQUN2QyxPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzlCLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2RyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFQRCwwQ0FPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENsdXN0ZXJQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgQ29sdW1uIH0gZnJvbSAnLi4vLi4vdGFibGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVBoeXNpY2FsSWQocmVzb3VyY2VOYW1lOiBzdHJpbmcsIGNsdXN0ZXJQcm9wczogQ2x1c3RlclByb3BzLCByZXF1ZXN0SWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtjbHVzdGVyUHJvcHMuY2x1c3Rlck5hbWV9OiR7Y2x1c3RlclByb3BzLmRhdGFiYXNlTmFtZX06JHtyZXNvdXJjZU5hbWV9OiR7cmVxdWVzdElkfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXN0S2V5Q29sdW1uKGNvbHVtbnM6IENvbHVtbltdKTogQ29sdW1uIHwgdW5kZWZpbmVkIHtcbiAgLy8gc3RyaW5nIGNvbXBhcmlzb24gaXMgcmVxdWlyZWQgZm9yIGN1c3RvbSByZXNvdXJjZSBzaW5jZSBldmVyeXRoaW5nIGlzIHBhc3NlZCBhcyBzdHJpbmdcbiAgY29uc3QgZGlzdEtleUNvbHVtbnMgPSBjb2x1bW5zLmZpbHRlcihjb2x1bW4gPT4gY29sdW1uLmRpc3RLZXkgPT09IHRydWUgfHwgKGNvbHVtbi5kaXN0S2V5IGFzIHVua25vd24gYXMgc3RyaW5nKSA9PT0gJ3RydWUnKTtcblxuICBpZiAoZGlzdEtleUNvbHVtbnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIGlmIChkaXN0S2V5Q29sdW1ucy5sZW5ndGggPiAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNdWx0aXBsZSBkaXN0IGtleSBjb2x1bW5zIGZvdW5kJyk7XG4gIH1cblxuICByZXR1cm4gZGlzdEtleUNvbHVtbnNbMF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3J0S2V5Q29sdW1ucyhjb2x1bW5zOiBDb2x1bW5bXSk6IENvbHVtbltdIHtcbiAgLy8gc3RyaW5nIGNvbXBhcmlzb24gaXMgcmVxdWlyZWQgZm9yIGN1c3RvbSByZXNvdXJjZSBzaW5jZSBldmVyeXRoaW5nIGlzIHBhc3NlZCBhcyBzdHJpbmdcbiAgcmV0dXJuIGNvbHVtbnMuZmlsdGVyKGNvbHVtbiA9PiBjb2x1bW4uc29ydEtleSA9PT0gdHJ1ZSB8fCAoY29sdW1uLnNvcnRLZXkgYXMgdW5rbm93biBhcyBzdHJpbmcpID09PSAndHJ1ZScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJlQ29sdW1uc0VxdWFsKGNvbHVtbnNBOiBDb2x1bW5bXSwgY29sdW1uc0I6IENvbHVtbltdKTogYm9vbGVhbiB7XG4gIGlmIChjb2x1bW5zQS5sZW5ndGggIT09IGNvbHVtbnNCLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gY29sdW1uc0EuZXZlcnkoY29sdW1uQSA9PiB7XG4gICAgcmV0dXJuIGNvbHVtbnNCLmZpbmQoY29sdW1uID0+IGNvbHVtbi5uYW1lID09PSBjb2x1bW5BLm5hbWUgJiYgY29sdW1uLmRhdGFUeXBlID09PSBjb2x1bW5BLmRhdGFUeXBlKTtcbiAgfSk7XG59XG4iXX0=