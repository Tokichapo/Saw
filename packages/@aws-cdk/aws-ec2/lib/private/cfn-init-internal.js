"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitPlatform = exports.InitElementType = void 0;
/**
 * The type of the init element.
 */
var InitElementType;
(function (InitElementType) {
    InitElementType["PACKAGE"] = "PACKAGE";
    InitElementType["GROUP"] = "GROUP";
    InitElementType["USER"] = "USER";
    InitElementType["SOURCE"] = "SOURCE";
    InitElementType["FILE"] = "FILE";
    InitElementType["COMMAND"] = "COMMAND";
    InitElementType["SERVICE"] = "SERVICE";
})(InitElementType = exports.InitElementType || (exports.InitElementType = {}));
/**
 * The platform to which the init template applies.
 */
var InitPlatform;
(function (InitPlatform) {
    InitPlatform["WINDOWS"] = "WINDOWS";
    InitPlatform["LINUX"] = "LINUX";
})(InitPlatform = exports.InitPlatform || (exports.InitPlatform = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2ZuLWluaXQtaW50ZXJuYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZm4taW5pdC1pbnRlcm5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQTs7R0FFRztBQUNILElBQVksZUFRWDtBQVJELFdBQVksZUFBZTtJQUN6QixzQ0FBbUIsQ0FBQTtJQUNuQixrQ0FBZSxDQUFBO0lBQ2YsZ0NBQWEsQ0FBQTtJQUNiLG9DQUFpQixDQUFBO0lBQ2pCLGdDQUFhLENBQUE7SUFDYixzQ0FBbUIsQ0FBQTtJQUNuQixzQ0FBbUIsQ0FBQTtBQUNyQixDQUFDLEVBUlcsZUFBZSxHQUFmLHVCQUFlLEtBQWYsdUJBQWUsUUFRMUI7QUFFRDs7R0FFRztBQUNILElBQVksWUFHWDtBQUhELFdBQVksWUFBWTtJQUN0QixtQ0FBbUIsQ0FBQTtJQUNuQiwrQkFBZSxDQUFBO0FBQ2pCLENBQUMsRUFIVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQUd2QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vKipcbiAqIFRoZSB0eXBlIG9mIHRoZSBpbml0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBlbnVtIEluaXRFbGVtZW50VHlwZSB7XG4gIFBBQ0tBR0UgPSAnUEFDS0FHRScsXG4gIEdST1VQID0gJ0dST1VQJyxcbiAgVVNFUiA9ICdVU0VSJyxcbiAgU09VUkNFID0gJ1NPVVJDRScsXG4gIEZJTEUgPSAnRklMRScsXG4gIENPTU1BTkQgPSAnQ09NTUFORCcsXG4gIFNFUlZJQ0UgPSAnU0VSVklDRScsXG59XG5cbi8qKlxuICogVGhlIHBsYXRmb3JtIHRvIHdoaWNoIHRoZSBpbml0IHRlbXBsYXRlIGFwcGxpZXMuXG4gKi9cbmV4cG9ydCBlbnVtIEluaXRQbGF0Zm9ybSB7XG4gIFdJTkRPV1MgPSAnV0lORE9XUycsXG4gIExJTlVYID0gJ0xJTlVYJyxcbn1cblxuLyoqXG4gKiBDb250ZXh0IGluZm9ybWF0aW9uIHBhc3NlZCB3aGVuIGFuIEluaXRFbGVtZW50IGlzIGJlaW5nIGNvbnN1bWVkXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbml0QmluZE9wdGlvbnMge1xuICAvKipcbiAgICogU2NvcGUgaW4gd2hpY2ggdG8gZGVmaW5lIGFueSByZXNvdXJjZXMsIGlmIG5lY2Vzc2FyeS5cbiAgICovXG4gIHJlYWRvbmx5IHNjb3BlOiBDb25zdHJ1Y3Q7XG5cbiAgLyoqXG4gICAqIFdoaWNoIE9TIHBsYXRmb3JtIChMaW51eCwgV2luZG93cykgdGhlIGluaXQgYmxvY2sgd2lsbCBiZSBmb3IuXG4gICAqIEltcGFjdHMgd2hpY2ggY29uZmlnIHR5cGVzIGFyZSBhdmFpbGFibGUgYW5kIGhvdyB0aGV5IGFyZSBjcmVhdGVkLlxuICAgKi9cbiAgcmVhZG9ubHkgcGxhdGZvcm06IEluaXRQbGF0Zm9ybTtcblxuICAvKipcbiAgICogT3JkZXJlZCBpbmRleCBvZiBjdXJyZW50IGVsZW1lbnQgdHlwZS4gUHJpbWFyaWx5IHVzZWQgdG8gYXV0by1nZW5lcmF0ZVxuICAgKiBjb21tYW5kIGtleXMgYW5kIHJldGFpbiBvcmRlcmluZy5cbiAgICovXG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEluc3RhbmNlIHJvbGUgb2YgdGhlIGNvbnN1bWluZyBpbnN0YW5jZSBvciBmbGVldFxuICAgKi9cbiAgcmVhZG9ubHkgaW5zdGFuY2VSb2xlOiBpYW0uSVJvbGU7XG59XG5cbi8qKlxuICogQSByZXR1cm4gdHlwZSBmb3IgYSBjb25maWd1cmVkIEluaXRFbGVtZW50LiBCb3RoIGl0cyBDbG91ZEZvcm1hdGlvbiByZXByZXNlbnRhdGlvbiwgYW5kIGFueVxuICogYWRkaXRpb25hbCBtZXRhZGF0YSBuZWVkZWQgdG8gY3JlYXRlIHRoZSBDbG91ZEZvcm1hdGlvbjo6SW5pdC5cbiAqXG4gKiBNYXJrZWQgaW50ZXJuYWwgc28gYXMgbm90IHRvIGxlYWsgdGhlIHVuZGVybHlpbmcgTDEgcmVwcmVzZW50YXRpb24uXG4gKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5pdEVsZW1lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIENsb3VkRm9ybWF0aW9uIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIGFuIEluaXRFbGVtZW50LlxuICAgKi9cbiAgcmVhZG9ubHkgY29uZmlnOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBhdXRoZW50aWNhdGlvbiBibG9ja3MgdG8gYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBJbml0IENvbmZpZ1xuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIGF1dGhlbnRpY2F0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29uZmlnXG4gICAqL1xuICByZWFkb25seSBhdXRoZW50aWNhdGlvbj86IFJlY29yZDxzdHJpbmcsIGFueT47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsIHN0cmluZyByZXByZXNlbnRpbmcgYSBoYXNoIG9mIHRoZSBhc3NldCBhc3NvY2lhdGVkIHdpdGggdGhpcyBlbGVtZW50IChpZiBhbnkpLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIGhhc2ggaXMgcHJvdmlkZWRcbiAgICovXG4gIHJlYWRvbmx5IGFzc2V0SGFzaD86IHN0cmluZztcbn1cbiJdfQ==