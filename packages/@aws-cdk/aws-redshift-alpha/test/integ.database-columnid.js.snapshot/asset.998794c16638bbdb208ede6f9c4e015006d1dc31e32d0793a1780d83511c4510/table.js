"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const redshift_data_1 = require("./redshift-data");
const types_1 = require("./types");
const util_1 = require("./util");
async function handler(props, event) {
    const tableNamePrefix = props.tableName.prefix;
    const getTableNameSuffix = (generateSuffix) => generateSuffix === 'true' ? `${event.StackId.substring(event.StackId.length - 12)}` : '';
    const tableColumns = props.tableColumns;
    const tableAndClusterProps = props;
    const useColumnIds = props.useColumnIds;
    let tableName = tableNamePrefix + getTableNameSuffix(props.tableName.generateSuffix);
    if (event.RequestType === 'Create') {
        tableName = await createTable(tableNamePrefix, getTableNameSuffix(props.tableName.generateSuffix), tableColumns, tableAndClusterProps);
        return { PhysicalResourceId: (0, util_1.makePhysicalId)(tableNamePrefix, tableAndClusterProps, event.StackId.substring(event.StackId.length - 12)) };
    }
    else if (event.RequestType === 'Delete') {
        await dropTable(event.PhysicalResourceId.includes(event.StackId.substring(event.StackId.length - 12)) ? tableName : event.PhysicalResourceId, tableAndClusterProps);
        return;
    }
    else if (event.RequestType === 'Update') {
        const isTableV2 = event.PhysicalResourceId.includes(event.StackId.substring(event.StackId.length - 12));
        const oldTableName = event.OldResourceProperties.tableName.prefix + getTableNameSuffix(event.OldResourceProperties.tableName.generateSuffix);
        tableName = await updateTable(isTableV2 ? oldTableName : event.PhysicalResourceId, tableNamePrefix, getTableNameSuffix(props.tableName.generateSuffix), tableColumns, useColumnIds, tableAndClusterProps, event.OldResourceProperties, isTableV2);
        return { PhysicalResourceId: event.PhysicalResourceId };
    }
    else {
        /* eslint-disable-next-line dot-notation */
        throw new Error(`Unrecognized event type: ${event['RequestType']}`);
    }
}
exports.handler = handler;
async function createTable(tableNamePrefix, tableNameSuffix, tableColumns, tableAndClusterProps) {
    const tableName = tableNamePrefix + tableNameSuffix;
    const tableColumnsString = tableColumns.map(column => `${column.name} ${column.dataType}${getEncodingColumnString(column)}`).join();
    let statement = `CREATE TABLE ${tableName} (${tableColumnsString})`;
    if (tableAndClusterProps.distStyle) {
        statement += ` DISTSTYLE ${tableAndClusterProps.distStyle}`;
    }
    const distKeyColumn = (0, util_1.getDistKeyColumn)(tableColumns);
    if (distKeyColumn) {
        statement += ` DISTKEY(${distKeyColumn.name})`;
    }
    const sortKeyColumns = (0, util_1.getSortKeyColumns)(tableColumns);
    if (sortKeyColumns.length > 0) {
        const sortKeyColumnsString = getSortKeyColumnsString(sortKeyColumns);
        statement += ` ${tableAndClusterProps.sortStyle} SORTKEY(${sortKeyColumnsString})`;
    }
    await (0, redshift_data_1.executeStatement)(statement, tableAndClusterProps);
    for (const column of tableColumns) {
        if (column.comment) {
            await (0, redshift_data_1.executeStatement)(`COMMENT ON COLUMN ${tableName}.${column.name} IS '${column.comment}'`, tableAndClusterProps);
        }
    }
    if (tableAndClusterProps.tableComment) {
        await (0, redshift_data_1.executeStatement)(`COMMENT ON TABLE ${tableName} IS '${tableAndClusterProps.tableComment}'`, tableAndClusterProps);
    }
    return tableName;
}
async function dropTable(tableName, clusterProps) {
    await (0, redshift_data_1.executeStatement)(`DROP TABLE ${tableName}`, clusterProps);
}
async function updateTable(tableName, tableNamePrefix, tableNameSuffix, tableColumns, useColumnIds, tableAndClusterProps, oldResourceProperties, isTableV2) {
    const alterationStatements = [];
    const newTableName = tableNamePrefix + tableNameSuffix;
    const oldClusterProps = oldResourceProperties;
    if (tableAndClusterProps.clusterName !== oldClusterProps.clusterName || tableAndClusterProps.databaseName !== oldClusterProps.databaseName) {
        return createTable(tableNamePrefix, tableNameSuffix, tableColumns, tableAndClusterProps);
    }
    const oldTableColumns = oldResourceProperties.tableColumns;
    const columnDeletions = oldTableColumns.filter(oldColumn => (tableColumns.every(column => {
        if (useColumnIds) {
            return oldColumn.id ? oldColumn.id !== column.id : oldColumn.name !== column.name;
        }
        return oldColumn.name !== column.name;
    })));
    if (columnDeletions.length > 0) {
        alterationStatements.push(...columnDeletions.map(column => `ALTER TABLE ${tableName} DROP COLUMN ${column.name}`));
    }
    const columnAdditions = tableColumns.filter(column => {
        return !oldTableColumns.some(oldColumn => {
            if (useColumnIds) {
                return oldColumn.id ? oldColumn.id === column.id : oldColumn.name === column.name;
            }
            return oldColumn.name === column.name;
        });
    }).map(column => `ADD ${column.name} ${column.dataType}`);
    if (columnAdditions.length > 0) {
        alterationStatements.push(...columnAdditions.map(addition => `ALTER TABLE ${tableName} ${addition}`));
    }
    const columnEncoding = tableColumns.filter(column => {
        return oldTableColumns.some(oldColumn => column.name === oldColumn.name && column.encoding !== oldColumn.encoding);
    }).map(column => `ALTER COLUMN ${column.name} ENCODE ${column.encoding || 'AUTO'}`);
    if (columnEncoding.length > 0) {
        alterationStatements.push(`ALTER TABLE ${tableName} ${columnEncoding.join(', ')}`);
    }
    const columnComments = tableColumns.filter(column => {
        return oldTableColumns.some(oldColumn => column.name === oldColumn.name && column.comment !== oldColumn.comment);
    }).map(column => `COMMENT ON COLUMN ${tableName}.${column.name} IS ${column.comment ? `'${column.comment}'` : 'NULL'}`);
    if (columnComments.length > 0) {
        alterationStatements.push(...columnComments);
    }
    if (useColumnIds) {
        const columnNameUpdates = tableColumns.reduce((updates, column) => {
            const oldColumn = oldTableColumns.find(oldCol => oldCol.id && oldCol.id === column.id);
            if (oldColumn && oldColumn.name !== column.name) {
                updates[oldColumn.name] = column.name;
            }
            return updates;
        }, {});
        if (Object.keys(columnNameUpdates).length > 0) {
            alterationStatements.push(...Object.entries(columnNameUpdates).map(([oldName, newName]) => (`ALTER TABLE ${tableName} RENAME COLUMN ${oldName} TO ${newName}`)));
        }
    }
    const oldDistStyle = oldResourceProperties.distStyle;
    if ((!oldDistStyle && tableAndClusterProps.distStyle) ||
        (oldDistStyle && !tableAndClusterProps.distStyle)) {
        return createTable(tableNamePrefix, tableNameSuffix, tableColumns, tableAndClusterProps);
    }
    else if (oldDistStyle !== tableAndClusterProps.distStyle) {
        alterationStatements.push(`ALTER TABLE ${tableName} ALTER DISTSTYLE ${tableAndClusterProps.distStyle}`);
    }
    const oldDistKey = (0, util_1.getDistKeyColumn)(oldTableColumns)?.name;
    const newDistKey = (0, util_1.getDistKeyColumn)(tableColumns)?.name;
    if (!oldDistKey && newDistKey) {
        // Table has no existing distribution key, add a new one
        alterationStatements.push(`ALTER TABLE ${tableName} ALTER DISTSTYLE KEY DISTKEY ${newDistKey}`);
    }
    else if (oldDistKey && !newDistKey) {
        // Table has a distribution key, remove and set to AUTO
        alterationStatements.push(`ALTER TABLE ${tableName} ALTER DISTSTYLE AUTO`);
    }
    else if (oldDistKey !== newDistKey) {
        // Table has an existing distribution key, change it
        alterationStatements.push(`ALTER TABLE ${tableName} ALTER DISTKEY ${newDistKey}`);
    }
    const oldSortKeyColumns = (0, util_1.getSortKeyColumns)(oldTableColumns);
    const newSortKeyColumns = (0, util_1.getSortKeyColumns)(tableColumns);
    const oldSortStyle = oldResourceProperties.sortStyle;
    const newSortStyle = tableAndClusterProps.sortStyle;
    if ((oldSortStyle === newSortStyle && !(0, util_1.areColumnsEqual)(oldSortKeyColumns, newSortKeyColumns))
        || (oldSortStyle !== newSortStyle)) {
        switch (newSortStyle) {
            case types_1.TableSortStyle.INTERLEAVED:
                // INTERLEAVED sort key addition requires replacement.
                // https://docs.aws.amazon.com/redshift/latest/dg/r_ALTER_TABLE.html
                return createTable(tableNamePrefix, tableNameSuffix, tableColumns, tableAndClusterProps);
            case types_1.TableSortStyle.COMPOUND: {
                const sortKeyColumnsString = getSortKeyColumnsString(newSortKeyColumns);
                alterationStatements.push(`ALTER TABLE ${tableName} ALTER ${newSortStyle} SORTKEY(${sortKeyColumnsString})`);
                break;
            }
            case types_1.TableSortStyle.AUTO: {
                alterationStatements.push(`ALTER TABLE ${tableName} ALTER SORTKEY ${newSortStyle}`);
                break;
            }
        }
    }
    const oldComment = oldResourceProperties.tableComment;
    const newComment = tableAndClusterProps.tableComment;
    if (oldComment !== newComment) {
        alterationStatements.push(`COMMENT ON TABLE ${tableName} IS ${newComment ? `'${newComment}'` : 'NULL'}`);
    }
    // Limited by human input
    // eslint-disable-next-line @cdklabs/promiseall-no-unbounded-parallelism
    await Promise.all(alterationStatements.map(statement => (0, redshift_data_1.executeStatement)(statement, tableAndClusterProps)));
    if (isTableV2) {
        const oldTableNamePrefix = oldResourceProperties.tableName.prefix;
        if (tableNamePrefix !== oldTableNamePrefix) {
            await (0, redshift_data_1.executeStatement)(`ALTER TABLE ${tableName} RENAME TO ${newTableName}`, tableAndClusterProps);
            return tableNamePrefix + tableNameSuffix;
        }
    }
    return tableName;
}
function getSortKeyColumnsString(sortKeyColumns) {
    return sortKeyColumns.map(column => column.name).join();
}
function getEncodingColumnString(column) {
    if (column.encoding) {
        return ` ENCODE ${column.encoding}`;
    }
    return '';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0YWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxtREFBbUQ7QUFDbkQsbUNBQTZFO0FBQzdFLGlDQUE4RjtBQUV2RixLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCLEVBQUUsS0FBa0Q7SUFDM0csTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7SUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLGNBQXNCLEVBQUUsRUFBRSxDQUFDLGNBQWMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ2hKLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7SUFDeEMsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7SUFDbkMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztJQUN4QyxJQUFJLFNBQVMsR0FBRyxlQUFlLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUVyRixJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDbkMsU0FBUyxHQUFHLE1BQU0sV0FBVyxDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxFQUFFLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3ZJLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxJQUFBLHFCQUFjLEVBQUMsZUFBZSxFQUFFLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FB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UUFDcEIsT0FBTyxXQUFXLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby11bnJlc29sdmVkICovXG5pbXBvcnQgKiBhcyBBV1NMYW1iZGEgZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBDb2x1bW4gfSBmcm9tICcuLi8uLi90YWJsZSc7XG5pbXBvcnQgeyBleGVjdXRlU3RhdGVtZW50IH0gZnJvbSAnLi9yZWRzaGlmdC1kYXRhJztcbmltcG9ydCB7IENsdXN0ZXJQcm9wcywgVGFibGVBbmRDbHVzdGVyUHJvcHMsIFRhYmxlU29ydFN0eWxlIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBhcmVDb2x1bW5zRXF1YWwsIGdldERpc3RLZXlDb2x1bW4sIGdldFNvcnRLZXlDb2x1bW5zLCBtYWtlUGh5c2ljYWxJZCB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHByb3BzOiBUYWJsZUFuZENsdXN0ZXJQcm9wcywgZXZlbnQ6IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlRXZlbnQpIHtcbiAgY29uc3QgdGFibGVOYW1lUHJlZml4ID0gcHJvcHMudGFibGVOYW1lLnByZWZpeDtcbiAgY29uc3QgZ2V0VGFibGVOYW1lU3VmZml4ID0gKGdlbmVyYXRlU3VmZml4OiBzdHJpbmcpID0+IGdlbmVyYXRlU3VmZml4ID09PSAndHJ1ZScgPyBgJHtldmVudC5TdGFja0lkLnN1YnN0cmluZyhldmVudC5TdGFja0lkLmxlbmd0aCAtIDEyKX1gIDogJyc7XG4gIGNvbnN0IHRhYmxlQ29sdW1ucyA9IHByb3BzLnRhYmxlQ29sdW1ucztcbiAgY29uc3QgdGFibGVBbmRDbHVzdGVyUHJvcHMgPSBwcm9wcztcbiAgY29uc3QgdXNlQ29sdW1uSWRzID0gcHJvcHMudXNlQ29sdW1uSWRzO1xuICBsZXQgdGFibGVOYW1lID0gdGFibGVOYW1lUHJlZml4ICsgZ2V0VGFibGVOYW1lU3VmZml4KHByb3BzLnRhYmxlTmFtZS5nZW5lcmF0ZVN1ZmZpeCk7XG5cbiAgaWYgKGV2ZW50LlJlcXVlc3RUeXBlID09PSAnQ3JlYXRlJykge1xuICAgIHRhYmxlTmFtZSA9IGF3YWl0IGNyZWF0ZVRhYmxlKHRhYmxlTmFtZVByZWZpeCwgZ2V0VGFibGVOYW1lU3VmZml4KHByb3BzLnRhYmxlTmFtZS5nZW5lcmF0ZVN1ZmZpeCksIHRhYmxlQ29sdW1ucywgdGFibGVBbmRDbHVzdGVyUHJvcHMpO1xuICAgIHJldHVybiB7IFBoeXNpY2FsUmVzb3VyY2VJZDogbWFrZVBoeXNpY2FsSWQodGFibGVOYW1lUHJlZml4LCB0YWJsZUFuZENsdXN0ZXJQcm9wcywgZXZlbnQuU3RhY2tJZC5zdWJzdHJpbmcoZXZlbnQuU3RhY2tJZC5sZW5ndGggLSAxMikpIH07XG4gIH0gZWxzZSBpZiAoZXZlbnQuUmVxdWVzdFR5cGUgPT09ICdEZWxldGUnKSB7XG4gICAgYXdhaXQgZHJvcFRhYmxlKFxuICAgICAgZXZlbnQuUGh5c2ljYWxSZXNvdXJjZUlkLmluY2x1ZGVzKGV2ZW50LlN0YWNrSWQuc3Vic3RyaW5nKGV2ZW50LlN0YWNrSWQubGVuZ3RoIC0gMTIpKSA/IHRhYmxlTmFtZSA6IGV2ZW50LlBoeXNpY2FsUmVzb3VyY2VJZCxcbiAgICAgIHRhYmxlQW5kQ2x1c3RlclByb3BzLFxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKGV2ZW50LlJlcXVlc3RUeXBlID09PSAnVXBkYXRlJykge1xuICAgIGNvbnN0IGlzVGFibGVWMiA9IGV2ZW50LlBoeXNpY2FsUmVzb3VyY2VJZC5pbmNsdWRlcyhldmVudC5TdGFja0lkLnN1YnN0cmluZyhldmVudC5TdGFja0lkLmxlbmd0aCAtIDEyKSk7XG4gICAgY29uc3Qgb2xkVGFibGVOYW1lID0gZXZlbnQuT2xkUmVzb3VyY2VQcm9wZXJ0aWVzLnRhYmxlTmFtZS5wcmVmaXggKyBnZXRUYWJsZU5hbWVTdWZmaXgoZXZlbnQuT2xkUmVzb3VyY2VQcm9wZXJ0aWVzLnRhYmxlTmFtZS5nZW5lcmF0ZVN1ZmZpeCk7XG4gICAgdGFibGVOYW1lID0gYXdhaXQgdXBkYXRlVGFibGUoXG4gICAgICBpc1RhYmxlVjIgPyBvbGRUYWJsZU5hbWUgOiBldmVudC5QaHlzaWNhbFJlc291cmNlSWQsXG4gICAgICB0YWJsZU5hbWVQcmVmaXgsXG4gICAgICBnZXRUYWJsZU5hbWVTdWZmaXgocHJvcHMudGFibGVOYW1lLmdlbmVyYXRlU3VmZml4KSxcbiAgICAgIHRhYmxlQ29sdW1ucyxcbiAgICAgIHVzZUNvbHVtbklkcyxcbiAgICAgIHRhYmxlQW5kQ2x1c3RlclByb3BzLFxuICAgICAgZXZlbnQuT2xkUmVzb3VyY2VQcm9wZXJ0aWVzIGFzIHVua25vd24gYXMgVGFibGVBbmRDbHVzdGVyUHJvcHMsXG4gICAgICBpc1RhYmxlVjIsXG4gICAgKTtcbiAgICByZXR1cm4geyBQaHlzaWNhbFJlc291cmNlSWQ6IGV2ZW50LlBoeXNpY2FsUmVzb3VyY2VJZCB9O1xuICB9IGVsc2Uge1xuICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBkb3Qtbm90YXRpb24gKi9cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBldmVudCB0eXBlOiAke2V2ZW50WydSZXF1ZXN0VHlwZSddfWApO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVRhYmxlKFxuICB0YWJsZU5hbWVQcmVmaXg6IHN0cmluZyxcbiAgdGFibGVOYW1lU3VmZml4OiBzdHJpbmcsXG4gIHRhYmxlQ29sdW1uczogQ29sdW1uW10sXG4gIHRhYmxlQW5kQ2x1c3RlclByb3BzOiBUYWJsZUFuZENsdXN0ZXJQcm9wcyxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHRhYmxlTmFtZSA9IHRhYmxlTmFtZVByZWZpeCArIHRhYmxlTmFtZVN1ZmZpeDtcbiAgY29uc3QgdGFibGVDb2x1bW5zU3RyaW5nID0gdGFibGVDb2x1bW5zLm1hcChjb2x1bW4gPT4gYCR7Y29sdW1uLm5hbWV9ICR7Y29sdW1uLmRhdGFUeXBlfSR7Z2V0RW5jb2RpbmdDb2x1bW5TdHJpbmcoY29sdW1uKX1gKS5qb2luKCk7XG5cbiAgbGV0IHN0YXRlbWVudCA9IGBDUkVBVEUgVEFCTEUgJHt0YWJsZU5hbWV9ICgke3RhYmxlQ29sdW1uc1N0cmluZ30pYDtcblxuICBpZiAodGFibGVBbmRDbHVzdGVyUHJvcHMuZGlzdFN0eWxlKSB7XG4gICAgc3RhdGVtZW50ICs9IGAgRElTVFNUWUxFICR7dGFibGVBbmRDbHVzdGVyUHJvcHMuZGlzdFN0eWxlfWA7XG4gIH1cblxuICBjb25zdCBkaXN0S2V5Q29sdW1uID0gZ2V0RGlzdEtleUNvbHVtbih0YWJsZUNvbHVtbnMpO1xuICBpZiAoZGlzdEtleUNvbHVtbikge1xuICAgIHN0YXRlbWVudCArPSBgIERJU1RLRVkoJHtkaXN0S2V5Q29sdW1uLm5hbWV9KWA7XG4gIH1cblxuICBjb25zdCBzb3J0S2V5Q29sdW1ucyA9IGdldFNvcnRLZXlDb2x1bW5zKHRhYmxlQ29sdW1ucyk7XG4gIGlmIChzb3J0S2V5Q29sdW1ucy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3Qgc29ydEtleUNvbHVtbnNTdHJpbmcgPSBnZXRTb3J0S2V5Q29sdW1uc1N0cmluZyhzb3J0S2V5Q29sdW1ucyk7XG4gICAgc3RhdGVtZW50ICs9IGAgJHt0YWJsZUFuZENsdXN0ZXJQcm9wcy5zb3J0U3R5bGV9IFNPUlRLRVkoJHtzb3J0S2V5Q29sdW1uc1N0cmluZ30pYDtcbiAgfVxuXG4gIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoc3RhdGVtZW50LCB0YWJsZUFuZENsdXN0ZXJQcm9wcyk7XG5cbiAgZm9yIChjb25zdCBjb2x1bW4gb2YgdGFibGVDb2x1bW5zKSB7XG4gICAgaWYgKGNvbHVtbi5jb21tZW50KSB7XG4gICAgICBhd2FpdCBleGVjdXRlU3RhdGVtZW50KGBDT01NRU5UIE9OIENPTFVNTiAke3RhYmxlTmFtZX0uJHtjb2x1bW4ubmFtZX0gSVMgJyR7Y29sdW1uLmNvbW1lbnR9J2AsIHRhYmxlQW5kQ2x1c3RlclByb3BzKTtcbiAgICB9XG4gIH1cbiAgaWYgKHRhYmxlQW5kQ2x1c3RlclByb3BzLnRhYmxlQ29tbWVudCkge1xuICAgIGF3YWl0IGV4ZWN1dGVTdGF0ZW1lbnQoYENPTU1FTlQgT04gVEFCTEUgJHt0YWJsZU5hbWV9IElTICcke3RhYmxlQW5kQ2x1c3RlclByb3BzLnRhYmxlQ29tbWVudH0nYCwgdGFibGVBbmRDbHVzdGVyUHJvcHMpO1xuICB9XG5cbiAgcmV0dXJuIHRhYmxlTmFtZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHJvcFRhYmxlKHRhYmxlTmFtZTogc3RyaW5nLCBjbHVzdGVyUHJvcHM6IENsdXN0ZXJQcm9wcykge1xuICBhd2FpdCBleGVjdXRlU3RhdGVtZW50KGBEUk9QIFRBQkxFICR7dGFibGVOYW1lfWAsIGNsdXN0ZXJQcm9wcyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVRhYmxlKFxuICB0YWJsZU5hbWU6IHN0cmluZyxcbiAgdGFibGVOYW1lUHJlZml4OiBzdHJpbmcsXG4gIHRhYmxlTmFtZVN1ZmZpeDogc3RyaW5nLFxuICB0YWJsZUNvbHVtbnM6IENvbHVtbltdLFxuICB1c2VDb2x1bW5JZHM6IGJvb2xlYW4sXG4gIHRhYmxlQW5kQ2x1c3RlclByb3BzOiBUYWJsZUFuZENsdXN0ZXJQcm9wcyxcbiAgb2xkUmVzb3VyY2VQcm9wZXJ0aWVzOiBUYWJsZUFuZENsdXN0ZXJQcm9wcyxcbiAgaXNUYWJsZVYyOiBib29sZWFuLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgYWx0ZXJhdGlvblN0YXRlbWVudHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IG5ld1RhYmxlTmFtZSA9IHRhYmxlTmFtZVByZWZpeCArIHRhYmxlTmFtZVN1ZmZpeDtcblxuICBjb25zdCBvbGRDbHVzdGVyUHJvcHMgPSBvbGRSZXNvdXJjZVByb3BlcnRpZXM7XG4gIGlmICh0YWJsZUFuZENsdXN0ZXJQcm9wcy5jbHVzdGVyTmFtZSAhPT0gb2xkQ2x1c3RlclByb3BzLmNsdXN0ZXJOYW1lIHx8IHRhYmxlQW5kQ2x1c3RlclByb3BzLmRhdGFiYXNlTmFtZSAhPT0gb2xkQ2x1c3RlclByb3BzLmRhdGFiYXNlTmFtZSkge1xuICAgIHJldHVybiBjcmVhdGVUYWJsZSh0YWJsZU5hbWVQcmVmaXgsIHRhYmxlTmFtZVN1ZmZpeCwgdGFibGVDb2x1bW5zLCB0YWJsZUFuZENsdXN0ZXJQcm9wcyk7XG4gIH1cblxuICBjb25zdCBvbGRUYWJsZUNvbHVtbnMgPSBvbGRSZXNvdXJjZVByb3BlcnRpZXMudGFibGVDb2x1bW5zO1xuICBjb25zdCBjb2x1bW5EZWxldGlvbnMgPSBvbGRUYWJsZUNvbHVtbnMuZmlsdGVyKG9sZENvbHVtbiA9PiAoXG4gICAgdGFibGVDb2x1bW5zLmV2ZXJ5KGNvbHVtbiA9PiB7XG4gICAgICBpZiAodXNlQ29sdW1uSWRzKSB7XG4gICAgICAgIHJldHVybiBvbGRDb2x1bW4uaWQgPyBvbGRDb2x1bW4uaWQgIT09IGNvbHVtbi5pZCA6IG9sZENvbHVtbi5uYW1lICE9PSBjb2x1bW4ubmFtZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvbGRDb2x1bW4ubmFtZSAhPT0gY29sdW1uLm5hbWU7XG4gICAgfSlcbiAgKSk7XG4gIGlmIChjb2x1bW5EZWxldGlvbnMubGVuZ3RoID4gMCkge1xuICAgIGFsdGVyYXRpb25TdGF0ZW1lbnRzLnB1c2goLi4uY29sdW1uRGVsZXRpb25zLm1hcChjb2x1bW4gPT4gYEFMVEVSIFRBQkxFICR7dGFibGVOYW1lfSBEUk9QIENPTFVNTiAke2NvbHVtbi5uYW1lfWApKTtcbiAgfVxuXG4gIGNvbnN0IGNvbHVtbkFkZGl0aW9ucyA9IHRhYmxlQ29sdW1ucy5maWx0ZXIoY29sdW1uID0+IHtcbiAgICByZXR1cm4gIW9sZFRhYmxlQ29sdW1ucy5zb21lKG9sZENvbHVtbiA9PiB7XG4gICAgICBpZiAodXNlQ29sdW1uSWRzKSB7XG4gICAgICAgIHJldHVybiBvbGRDb2x1bW4uaWQgPyBvbGRDb2x1bW4uaWQgPT09IGNvbHVtbi5pZCA6IG9sZENvbHVtbi5uYW1lID09PSBjb2x1bW4ubmFtZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvbGRDb2x1bW4ubmFtZSA9PT0gY29sdW1uLm5hbWU7XG4gICAgfSk7XG4gIH0pLm1hcChjb2x1bW4gPT4gYEFERCAke2NvbHVtbi5uYW1lfSAke2NvbHVtbi5kYXRhVHlwZX1gKTtcbiAgaWYgKGNvbHVtbkFkZGl0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgYWx0ZXJhdGlvblN0YXRlbWVudHMucHVzaCguLi5jb2x1bW5BZGRpdGlvbnMubWFwKGFkZGl0aW9uID0+IGBBTFRFUiBUQUJMRSAke3RhYmxlTmFtZX0gJHthZGRpdGlvbn1gKSk7XG4gIH1cblxuICBjb25zdCBjb2x1bW5FbmNvZGluZyA9IHRhYmxlQ29sdW1ucy5maWx0ZXIoY29sdW1uID0+IHtcbiAgICByZXR1cm4gb2xkVGFibGVDb2x1bW5zLnNvbWUob2xkQ29sdW1uID0+IGNvbHVtbi5uYW1lID09PSBvbGRDb2x1bW4ubmFtZSAmJiBjb2x1bW4uZW5jb2RpbmcgIT09IG9sZENvbHVtbi5lbmNvZGluZyk7XG4gIH0pLm1hcChjb2x1bW4gPT4gYEFMVEVSIENPTFVNTiAke2NvbHVtbi5uYW1lfSBFTkNPREUgJHtjb2x1bW4uZW5jb2RpbmcgfHwgJ0FVVE8nfWApO1xuICBpZiAoY29sdW1uRW5jb2RpbmcubGVuZ3RoID4gMCkge1xuICAgIGFsdGVyYXRpb25TdGF0ZW1lbnRzLnB1c2goYEFMVEVSIFRBQkxFICR7dGFibGVOYW1lfSAke2NvbHVtbkVuY29kaW5nLmpvaW4oJywgJyl9YCk7XG4gIH1cblxuICBjb25zdCBjb2x1bW5Db21tZW50cyA9IHRhYmxlQ29sdW1ucy5maWx0ZXIoY29sdW1uID0+IHtcbiAgICByZXR1cm4gb2xkVGFibGVDb2x1bW5zLnNvbWUob2xkQ29sdW1uID0+IGNvbHVtbi5uYW1lID09PSBvbGRDb2x1bW4ubmFtZSAmJiBjb2x1bW4uY29tbWVudCAhPT0gb2xkQ29sdW1uLmNvbW1lbnQpO1xuICB9KS5tYXAoY29sdW1uID0+IGBDT01NRU5UIE9OIENPTFVNTiAke3RhYmxlTmFtZX0uJHtjb2x1bW4ubmFtZX0gSVMgJHtjb2x1bW4uY29tbWVudCA/IGAnJHtjb2x1bW4uY29tbWVudH0nYCA6ICdOVUxMJ31gKTtcbiAgaWYgKGNvbHVtbkNvbW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICBhbHRlcmF0aW9uU3RhdGVtZW50cy5wdXNoKC4uLmNvbHVtbkNvbW1lbnRzKTtcbiAgfVxuXG4gIGlmICh1c2VDb2x1bW5JZHMpIHtcbiAgICBjb25zdCBjb2x1bW5OYW1lVXBkYXRlcyA9IHRhYmxlQ29sdW1ucy5yZWR1Y2UoKHVwZGF0ZXMsIGNvbHVtbikgPT4ge1xuICAgICAgY29uc3Qgb2xkQ29sdW1uID0gb2xkVGFibGVDb2x1bW5zLmZpbmQob2xkQ29sID0+IG9sZENvbC5pZCAmJiBvbGRDb2wuaWQgPT09IGNvbHVtbi5pZCk7XG4gICAgICBpZiAob2xkQ29sdW1uICYmIG9sZENvbHVtbi5uYW1lICE9PSBjb2x1bW4ubmFtZSkge1xuICAgICAgICB1cGRhdGVzW29sZENvbHVtbi5uYW1lXSA9IGNvbHVtbi5uYW1lO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHVwZGF0ZXM7XG4gICAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPik7XG4gICAgaWYgKE9iamVjdC5rZXlzKGNvbHVtbk5hbWVVcGRhdGVzKS5sZW5ndGggPiAwKSB7XG4gICAgICBhbHRlcmF0aW9uU3RhdGVtZW50cy5wdXNoKC4uLk9iamVjdC5lbnRyaWVzKGNvbHVtbk5hbWVVcGRhdGVzKS5tYXAoKFtvbGROYW1lLCBuZXdOYW1lXSkgPT4gKFxuICAgICAgICBgQUxURVIgVEFCTEUgJHt0YWJsZU5hbWV9IFJFTkFNRSBDT0xVTU4gJHtvbGROYW1lfSBUTyAke25ld05hbWV9YFxuICAgICAgKSkpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9sZERpc3RTdHlsZSA9IG9sZFJlc291cmNlUHJvcGVydGllcy5kaXN0U3R5bGU7XG4gIGlmICgoIW9sZERpc3RTdHlsZSAmJiB0YWJsZUFuZENsdXN0ZXJQcm9wcy5kaXN0U3R5bGUpIHx8XG4gICAgKG9sZERpc3RTdHlsZSAmJiAhdGFibGVBbmRDbHVzdGVyUHJvcHMuZGlzdFN0eWxlKSkge1xuICAgIHJldHVybiBjcmVhdGVUYWJsZSh0YWJsZU5hbWVQcmVmaXgsIHRhYmxlTmFtZVN1ZmZpeCwgdGFibGVDb2x1bW5zLCB0YWJsZUFuZENsdXN0ZXJQcm9wcyk7XG4gIH0gZWxzZSBpZiAob2xkRGlzdFN0eWxlICE9PSB0YWJsZUFuZENsdXN0ZXJQcm9wcy5kaXN0U3R5bGUpIHtcbiAgICBhbHRlcmF0aW9uU3RhdGVtZW50cy5wdXNoKGBBTFRFUiBUQUJMRSAke3RhYmxlTmFtZX0gQUxURVIgRElTVFNUWUxFICR7dGFibGVBbmRDbHVzdGVyUHJvcHMuZGlzdFN0eWxlfWApO1xuICB9XG5cbiAgY29uc3Qgb2xkRGlzdEtleSA9IGdldERpc3RLZXlDb2x1bW4ob2xkVGFibGVDb2x1bW5zKT8ubmFtZTtcbiAgY29uc3QgbmV3RGlzdEtleSA9IGdldERpc3RLZXlDb2x1bW4odGFibGVDb2x1bW5zKT8ubmFtZTtcbiAgaWYgKCFvbGREaXN0S2V5ICYmIG5ld0Rpc3RLZXkpIHtcbiAgICAvLyBUYWJsZSBoYXMgbm8gZXhpc3RpbmcgZGlzdHJpYnV0aW9uIGtleSwgYWRkIGEgbmV3IG9uZVxuICAgIGFsdGVyYXRpb25TdGF0ZW1lbnRzLnB1c2goYEFMVEVSIFRBQkxFICR7dGFibGVOYW1lfSBBTFRFUiBESVNUU1RZTEUgS0VZIERJU1RLRVkgJHtuZXdEaXN0S2V5fWApO1xuICB9IGVsc2UgaWYgKG9sZERpc3RLZXkgJiYgIW5ld0Rpc3RLZXkpIHtcbiAgICAvLyBUYWJsZSBoYXMgYSBkaXN0cmlidXRpb24ga2V5LCByZW1vdmUgYW5kIHNldCB0byBBVVRPXG4gICAgYWx0ZXJhdGlvblN0YXRlbWVudHMucHVzaChgQUxURVIgVEFCTEUgJHt0YWJsZU5hbWV9IEFMVEVSIERJU1RTVFlMRSBBVVRPYCk7XG4gIH0gZWxzZSBpZiAob2xkRGlzdEtleSAhPT0gbmV3RGlzdEtleSkge1xuICAgIC8vIFRhYmxlIGhhcyBhbiBleGlzdGluZyBkaXN0cmlidXRpb24ga2V5LCBjaGFuZ2UgaXRcbiAgICBhbHRlcmF0aW9uU3RhdGVtZW50cy5wdXNoKGBBTFRFUiBUQUJMRSAke3RhYmxlTmFtZX0gQUxURVIgRElTVEtFWSAke25ld0Rpc3RLZXl9YCk7XG4gIH1cblxuICBjb25zdCBvbGRTb3J0S2V5Q29sdW1ucyA9IGdldFNvcnRLZXlDb2x1bW5zKG9sZFRhYmxlQ29sdW1ucyk7XG4gIGNvbnN0IG5ld1NvcnRLZXlDb2x1bW5zID0gZ2V0U29ydEtleUNvbHVtbnModGFibGVDb2x1bW5zKTtcbiAgY29uc3Qgb2xkU29ydFN0eWxlID0gb2xkUmVzb3VyY2VQcm9wZXJ0aWVzLnNvcnRTdHlsZTtcbiAgY29uc3QgbmV3U29ydFN0eWxlID0gdGFibGVBbmRDbHVzdGVyUHJvcHMuc29ydFN0eWxlO1xuICBpZiAoKG9sZFNvcnRTdHlsZSA9PT0gbmV3U29ydFN0eWxlICYmICFhcmVDb2x1bW5zRXF1YWwob2xkU29ydEtleUNvbHVtbnMsIG5ld1NvcnRLZXlDb2x1bW5zKSlcbiAgICB8fCAob2xkU29ydFN0eWxlICE9PSBuZXdTb3J0U3R5bGUpKSB7XG4gICAgc3dpdGNoIChuZXdTb3J0U3R5bGUpIHtcbiAgICAgIGNhc2UgVGFibGVTb3J0U3R5bGUuSU5URVJMRUFWRUQ6XG4gICAgICAgIC8vIElOVEVSTEVBVkVEIHNvcnQga2V5IGFkZGl0aW9uIHJlcXVpcmVzIHJlcGxhY2VtZW50LlxuICAgICAgICAvLyBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vcmVkc2hpZnQvbGF0ZXN0L2RnL3JfQUxURVJfVEFCTEUuaHRtbFxuICAgICAgICByZXR1cm4gY3JlYXRlVGFibGUodGFibGVOYW1lUHJlZml4LCB0YWJsZU5hbWVTdWZmaXgsIHRhYmxlQ29sdW1ucywgdGFibGVBbmRDbHVzdGVyUHJvcHMpO1xuXG4gICAgICBjYXNlIFRhYmxlU29ydFN0eWxlLkNPTVBPVU5EOiB7XG4gICAgICAgIGNvbnN0IHNvcnRLZXlDb2x1bW5zU3RyaW5nID0gZ2V0U29ydEtleUNvbHVtbnNTdHJpbmcobmV3U29ydEtleUNvbHVtbnMpO1xuICAgICAgICBhbHRlcmF0aW9uU3RhdGVtZW50cy5wdXNoKGBBTFRFUiBUQUJMRSAke3RhYmxlTmFtZX0gQUxURVIgJHtuZXdTb3J0U3R5bGV9IFNPUlRLRVkoJHtzb3J0S2V5Q29sdW1uc1N0cmluZ30pYCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlIFRhYmxlU29ydFN0eWxlLkFVVE86IHtcbiAgICAgICAgYWx0ZXJhdGlvblN0YXRlbWVudHMucHVzaChgQUxURVIgVEFCTEUgJHt0YWJsZU5hbWV9IEFMVEVSIFNPUlRLRVkgJHtuZXdTb3J0U3R5bGV9YCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9sZENvbW1lbnQgPSBvbGRSZXNvdXJjZVByb3BlcnRpZXMudGFibGVDb21tZW50O1xuICBjb25zdCBuZXdDb21tZW50ID0gdGFibGVBbmRDbHVzdGVyUHJvcHMudGFibGVDb21tZW50O1xuICBpZiAob2xkQ29tbWVudCAhPT0gbmV3Q29tbWVudCkge1xuICAgIGFsdGVyYXRpb25TdGF0ZW1lbnRzLnB1c2goYENPTU1FTlQgT04gVEFCTEUgJHt0YWJsZU5hbWV9IElTICR7bmV3Q29tbWVudCA/IGAnJHtuZXdDb21tZW50fSdgIDogJ05VTEwnfWApO1xuICB9XG5cbiAgLy8gTGltaXRlZCBieSBodW1hbiBpbnB1dFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQGNka2xhYnMvcHJvbWlzZWFsbC1uby11bmJvdW5kZWQtcGFyYWxsZWxpc21cbiAgYXdhaXQgUHJvbWlzZS5hbGwoYWx0ZXJhdGlvblN0YXRlbWVudHMubWFwKHN0YXRlbWVudCA9PiBleGVjdXRlU3RhdGVtZW50KHN0YXRlbWVudCwgdGFibGVBbmRDbHVzdGVyUHJvcHMpKSk7XG5cbiAgaWYgKGlzVGFibGVWMikge1xuICAgIGNvbnN0IG9sZFRhYmxlTmFtZVByZWZpeCA9IG9sZFJlc291cmNlUHJvcGVydGllcy50YWJsZU5hbWUucHJlZml4O1xuICAgIGlmICh0YWJsZU5hbWVQcmVmaXggIT09IG9sZFRhYmxlTmFtZVByZWZpeCkge1xuICAgICAgYXdhaXQgZXhlY3V0ZVN0YXRlbWVudChgQUxURVIgVEFCTEUgJHt0YWJsZU5hbWV9IFJFTkFNRSBUTyAke25ld1RhYmxlTmFtZX1gLCB0YWJsZUFuZENsdXN0ZXJQcm9wcyk7XG4gICAgICByZXR1cm4gdGFibGVOYW1lUHJlZml4ICsgdGFibGVOYW1lU3VmZml4O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YWJsZU5hbWU7XG59XG5cbmZ1bmN0aW9uIGdldFNvcnRLZXlDb2x1bW5zU3RyaW5nKHNvcnRLZXlDb2x1bW5zOiBDb2x1bW5bXSkge1xuICByZXR1cm4gc29ydEtleUNvbHVtbnMubWFwKGNvbHVtbiA9PiBjb2x1bW4ubmFtZSkuam9pbigpO1xufVxuXG5mdW5jdGlvbiBnZXRFbmNvZGluZ0NvbHVtblN0cmluZyhjb2x1bW46IENvbHVtbik6IHN0cmluZyB7XG4gIGlmIChjb2x1bW4uZW5jb2RpbmcpIHtcbiAgICByZXR1cm4gYCBFTkNPREUgJHtjb2x1bW4uZW5jb2Rpbmd9YDtcbiAgfVxuICByZXR1cm4gJyc7XG59XG4iXX0=