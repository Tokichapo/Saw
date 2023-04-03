"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGeneratedWhenNeededMarker = exports.GeneratedWhenNeededMarker = exports.generatePhysicalName = void 0;
const crypto = require("crypto");
const constructs_1 = require("constructs");
const token_map_1 = require("./token-map");
const names_1 = require("../names");
const stack_1 = require("../stack");
const token_1 = require("../token");
function generatePhysicalName(resource) {
    const stack = stack_1.Stack.of(resource);
    const stackPart = new PrefixNamePart(stack.stackName, 25);
    const idPart = new SuffixNamePart(names_1.Names.nodeUniqueId(resource.node), 24);
    const region = stack.region;
    if (token_1.Token.isUnresolved(region) || !region) {
        throw new Error(`Cannot generate a physical name for ${constructs_1.Node.of(resource).path}, because the region is un-resolved or missing`);
    }
    const account = stack.account;
    if (token_1.Token.isUnresolved(account) || !account) {
        throw new Error(`Cannot generate a physical name for ${constructs_1.Node.of(resource).path}, because the account is un-resolved or missing`);
    }
    const parts = [stackPart, idPart]
        .map(part => part.generate());
    const hashLength = 12;
    const sha256 = crypto.createHash('sha256')
        .update(stackPart.bareStr)
        .update(idPart.bareStr)
        .update(region)
        .update(account);
    const hash = sha256.digest('hex').slice(0, hashLength);
    const ret = [...parts, hash].join('');
    return ret.toLowerCase();
}
exports.generatePhysicalName = generatePhysicalName;
class NamePart {
    constructor(bareStr) {
        this.bareStr = bareStr;
    }
}
class PrefixNamePart extends NamePart {
    constructor(bareStr, prefixLength) {
        super(bareStr);
        this.prefixLength = prefixLength;
    }
    generate() {
        return this.bareStr.slice(0, this.prefixLength);
    }
}
class SuffixNamePart extends NamePart {
    constructor(str, suffixLength) {
        super(str);
        this.suffixLength = suffixLength;
    }
    generate() {
        const strLen = this.bareStr.length;
        const startIndex = Math.max(strLen - this.suffixLength, 0);
        return this.bareStr.slice(startIndex, strLen);
    }
}
const GENERATE_IF_NEEDED_SYMBOL = Symbol.for('@aws-cdk/core.<private>.GenerateIfNeeded');
/**
 * This marker token is used by PhysicalName.GENERATE_IF_NEEDED. When that token is passed to the
 * physicalName property of a Resource, it triggers different behavior in the Resource constructor
 * that will allow emission of a generated physical name (when the resource is used across
 * environments) or undefined (when the resource is not shared).
 *
 * This token throws an Error when it is resolved, as a way to prevent inadvertent mis-uses of it.
 */
class GeneratedWhenNeededMarker {
    constructor() {
        this.creationStack = [];
        Object.defineProperty(this, GENERATE_IF_NEEDED_SYMBOL, { value: true });
    }
    resolve(_ctx) {
        throw new Error('Invalid physical name passed to CloudFormation. Use "this.physicalName" instead');
    }
    toString() {
        return 'PhysicalName.GENERATE_IF_NEEDED';
    }
}
exports.GeneratedWhenNeededMarker = GeneratedWhenNeededMarker;
/**
 * Checks whether a stringified token resolves to a `GeneratedWhenNeededMarker`.
 */
function isGeneratedWhenNeededMarker(val) {
    const token = token_map_1.TokenMap.instance().lookupString(val);
    return !!token && GENERATE_IF_NEEDED_SYMBOL in token;
}
exports.isGeneratedWhenNeededMarker = isGeneratedWhenNeededMarker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljYWwtbmFtZS1nZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaHlzaWNhbC1uYW1lLWdlbmVyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBaUM7QUFDakMsMkNBQWtDO0FBQ2xDLDJDQUF1QztBQUN2QyxvQ0FBaUM7QUFHakMsb0NBQWlDO0FBQ2pDLG9DQUFpQztBQUVqQyxTQUFnQixvQkFBb0IsQ0FBQyxRQUFtQjtJQUN0RCxNQUFNLEtBQUssR0FBRyxhQUFLLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLE1BQU0sU0FBUyxHQUFHLElBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQUMsYUFBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFekUsTUFBTSxNQUFNLEdBQVcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNwQyxJQUFJLGFBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDekMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsaUJBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxnREFBZ0QsQ0FBQyxDQUFDO0tBQ2hJO0lBRUQsTUFBTSxPQUFPLEdBQVcsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUN0QyxJQUFJLGFBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsaUJBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxpREFBaUQsQ0FBQyxDQUFDO0tBQ2pJO0lBRUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO1NBQzlCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBRWhDLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUN0QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztTQUN2QyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztTQUN6QixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztTQUN0QixNQUFNLENBQUMsTUFBTSxDQUFDO1NBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25CLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUV2RCxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUV0QyxPQUFPLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMzQixDQUFDO0FBN0JELG9EQTZCQztBQUVELE1BQWUsUUFBUTtJQUdyQixZQUFZLE9BQWU7UUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztDQUdGO0FBRUQsTUFBTSxjQUFlLFNBQVEsUUFBUTtJQUNuQyxZQUFZLE9BQWUsRUFBbUIsWUFBb0I7UUFDaEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRDZCLGlCQUFZLEdBQVosWUFBWSxDQUFRO0lBRWxFLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDRjtBQUVELE1BQU0sY0FBZSxTQUFRLFFBQVE7SUFDbkMsWUFBWSxHQUFXLEVBQW1CLFlBQW9CO1FBQzVELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUQ2QixpQkFBWSxHQUFaLFlBQVksQ0FBUTtJQUU5RCxDQUFDO0lBRU0sUUFBUTtRQUNiLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ25DLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDaEQsQ0FBQztDQUNGO0FBRUQsTUFBTSx5QkFBeUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7QUFFekY7Ozs7Ozs7R0FPRztBQUNILE1BQWEseUJBQXlCO0lBR3BDO1FBRmdCLGtCQUFhLEdBQWEsRUFBRSxDQUFDO1FBRzNDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVNLE9BQU8sQ0FBQyxJQUFxQjtRQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLGlGQUFpRixDQUFDLENBQUM7SUFDckcsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLGlDQUFpQyxDQUFDO0lBQzNDLENBQUM7Q0FDRjtBQWRELDhEQWNDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQiwyQkFBMkIsQ0FBQyxHQUFXO0lBQ3JELE1BQU0sS0FBSyxHQUFHLG9CQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSx5QkFBeUIsSUFBSSxLQUFLLENBQUM7QUFDdkQsQ0FBQztBQUhELGtFQUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBUb2tlbk1hcCB9IGZyb20gJy4vdG9rZW4tbWFwJztcbmltcG9ydCB7IE5hbWVzIH0gZnJvbSAnLi4vbmFtZXMnO1xuaW1wb3J0IHsgSVJlc29sdmFibGUsIElSZXNvbHZlQ29udGV4dCB9IGZyb20gJy4uL3Jlc29sdmFibGUnO1xuaW1wb3J0IHsgSVJlc291cmNlIH0gZnJvbSAnLi4vcmVzb3VyY2UnO1xuaW1wb3J0IHsgU3RhY2sgfSBmcm9tICcuLi9zdGFjayc7XG5pbXBvcnQgeyBUb2tlbiB9IGZyb20gJy4uL3Rva2VuJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlUGh5c2ljYWxOYW1lKHJlc291cmNlOiBJUmVzb3VyY2UpOiBzdHJpbmcge1xuICBjb25zdCBzdGFjayA9IFN0YWNrLm9mKHJlc291cmNlKTtcbiAgY29uc3Qgc3RhY2tQYXJ0ID0gbmV3IFByZWZpeE5hbWVQYXJ0KHN0YWNrLnN0YWNrTmFtZSwgMjUpO1xuICBjb25zdCBpZFBhcnQgPSBuZXcgU3VmZml4TmFtZVBhcnQoTmFtZXMubm9kZVVuaXF1ZUlkKHJlc291cmNlLm5vZGUpLCAyNCk7XG5cbiAgY29uc3QgcmVnaW9uOiBzdHJpbmcgPSBzdGFjay5yZWdpb247XG4gIGlmIChUb2tlbi5pc1VucmVzb2x2ZWQocmVnaW9uKSB8fCAhcmVnaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZ2VuZXJhdGUgYSBwaHlzaWNhbCBuYW1lIGZvciAke05vZGUub2YocmVzb3VyY2UpLnBhdGh9LCBiZWNhdXNlIHRoZSByZWdpb24gaXMgdW4tcmVzb2x2ZWQgb3IgbWlzc2luZ2ApO1xuICB9XG5cbiAgY29uc3QgYWNjb3VudDogc3RyaW5nID0gc3RhY2suYWNjb3VudDtcbiAgaWYgKFRva2VuLmlzVW5yZXNvbHZlZChhY2NvdW50KSB8fCAhYWNjb3VudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGdlbmVyYXRlIGEgcGh5c2ljYWwgbmFtZSBmb3IgJHtOb2RlLm9mKHJlc291cmNlKS5wYXRofSwgYmVjYXVzZSB0aGUgYWNjb3VudCBpcyB1bi1yZXNvbHZlZCBvciBtaXNzaW5nYCk7XG4gIH1cblxuICBjb25zdCBwYXJ0cyA9IFtzdGFja1BhcnQsIGlkUGFydF1cbiAgICAubWFwKHBhcnQgPT4gcGFydC5nZW5lcmF0ZSgpKTtcblxuICBjb25zdCBoYXNoTGVuZ3RoID0gMTI7XG4gIGNvbnN0IHNoYTI1NiA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKVxuICAgIC51cGRhdGUoc3RhY2tQYXJ0LmJhcmVTdHIpXG4gICAgLnVwZGF0ZShpZFBhcnQuYmFyZVN0cilcbiAgICAudXBkYXRlKHJlZ2lvbilcbiAgICAudXBkYXRlKGFjY291bnQpO1xuICBjb25zdCBoYXNoID0gc2hhMjU2LmRpZ2VzdCgnaGV4Jykuc2xpY2UoMCwgaGFzaExlbmd0aCk7XG5cbiAgY29uc3QgcmV0ID0gWy4uLnBhcnRzLCBoYXNoXS5qb2luKCcnKTtcblxuICByZXR1cm4gcmV0LnRvTG93ZXJDYXNlKCk7XG59XG5cbmFic3RyYWN0IGNsYXNzIE5hbWVQYXJ0IHtcbiAgcHVibGljIHJlYWRvbmx5IGJhcmVTdHI6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihiYXJlU3RyOiBzdHJpbmcpIHtcbiAgICB0aGlzLmJhcmVTdHIgPSBiYXJlU3RyO1xuICB9XG5cbiAgcHVibGljIGFic3RyYWN0IGdlbmVyYXRlKCk6IHN0cmluZztcbn1cblxuY2xhc3MgUHJlZml4TmFtZVBhcnQgZXh0ZW5kcyBOYW1lUGFydCB7XG4gIGNvbnN0cnVjdG9yKGJhcmVTdHI6IHN0cmluZywgcHJpdmF0ZSByZWFkb25seSBwcmVmaXhMZW5ndGg6IG51bWJlcikge1xuICAgIHN1cGVyKGJhcmVTdHIpO1xuICB9XG5cbiAgcHVibGljIGdlbmVyYXRlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuYmFyZVN0ci5zbGljZSgwLCB0aGlzLnByZWZpeExlbmd0aCk7XG4gIH1cbn1cblxuY2xhc3MgU3VmZml4TmFtZVBhcnQgZXh0ZW5kcyBOYW1lUGFydCB7XG4gIGNvbnN0cnVjdG9yKHN0cjogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IHN1ZmZpeExlbmd0aDogbnVtYmVyKSB7XG4gICAgc3VwZXIoc3RyKTtcbiAgfVxuXG4gIHB1YmxpYyBnZW5lcmF0ZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHN0ckxlbiA9IHRoaXMuYmFyZVN0ci5sZW5ndGg7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IE1hdGgubWF4KHN0ckxlbiAtIHRoaXMuc3VmZml4TGVuZ3RoLCAwKTtcbiAgICByZXR1cm4gdGhpcy5iYXJlU3RyLnNsaWNlKHN0YXJ0SW5kZXgsIHN0ckxlbik7XG4gIH1cbn1cblxuY29uc3QgR0VORVJBVEVfSUZfTkVFREVEX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ0Bhd3MtY2RrL2NvcmUuPHByaXZhdGU+LkdlbmVyYXRlSWZOZWVkZWQnKTtcblxuLyoqXG4gKiBUaGlzIG1hcmtlciB0b2tlbiBpcyB1c2VkIGJ5IFBoeXNpY2FsTmFtZS5HRU5FUkFURV9JRl9ORUVERUQuIFdoZW4gdGhhdCB0b2tlbiBpcyBwYXNzZWQgdG8gdGhlXG4gKiBwaHlzaWNhbE5hbWUgcHJvcGVydHkgb2YgYSBSZXNvdXJjZSwgaXQgdHJpZ2dlcnMgZGlmZmVyZW50IGJlaGF2aW9yIGluIHRoZSBSZXNvdXJjZSBjb25zdHJ1Y3RvclxuICogdGhhdCB3aWxsIGFsbG93IGVtaXNzaW9uIG9mIGEgZ2VuZXJhdGVkIHBoeXNpY2FsIG5hbWUgKHdoZW4gdGhlIHJlc291cmNlIGlzIHVzZWQgYWNyb3NzXG4gKiBlbnZpcm9ubWVudHMpIG9yIHVuZGVmaW5lZCAod2hlbiB0aGUgcmVzb3VyY2UgaXMgbm90IHNoYXJlZCkuXG4gKlxuICogVGhpcyB0b2tlbiB0aHJvd3MgYW4gRXJyb3Igd2hlbiBpdCBpcyByZXNvbHZlZCwgYXMgYSB3YXkgdG8gcHJldmVudCBpbmFkdmVydGVudCBtaXMtdXNlcyBvZiBpdC5cbiAqL1xuZXhwb3J0IGNsYXNzIEdlbmVyYXRlZFdoZW5OZWVkZWRNYXJrZXIgaW1wbGVtZW50cyBJUmVzb2x2YWJsZSB7XG4gIHB1YmxpYyByZWFkb25seSBjcmVhdGlvblN0YWNrOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBHRU5FUkFURV9JRl9ORUVERURfU1lNQk9MLCB7IHZhbHVlOiB0cnVlIH0pO1xuICB9XG5cbiAgcHVibGljIHJlc29sdmUoX2N0eDogSVJlc29sdmVDb250ZXh0KTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwaHlzaWNhbCBuYW1lIHBhc3NlZCB0byBDbG91ZEZvcm1hdGlvbi4gVXNlIFwidGhpcy5waHlzaWNhbE5hbWVcIiBpbnN0ZWFkJyk7XG4gIH1cblxuICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ1BoeXNpY2FsTmFtZS5HRU5FUkFURV9JRl9ORUVERUQnO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBzdHJpbmdpZmllZCB0b2tlbiByZXNvbHZlcyB0byBhIGBHZW5lcmF0ZWRXaGVuTmVlZGVkTWFya2VyYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzR2VuZXJhdGVkV2hlbk5lZWRlZE1hcmtlcih2YWw6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCB0b2tlbiA9IFRva2VuTWFwLmluc3RhbmNlKCkubG9va3VwU3RyaW5nKHZhbCk7XG4gIHJldHVybiAhIXRva2VuICYmIEdFTkVSQVRFX0lGX05FRURFRF9TWU1CT0wgaW4gdG9rZW47XG59XG4iXX0=