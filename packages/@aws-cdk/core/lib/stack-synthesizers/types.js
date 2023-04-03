"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReusableStackSynthesizer = void 0;
/**
 * Whether the given Stack Synthesizer is reusable or not
 */
function isReusableStackSynthesizer(x) {
    return !!x.reusableBind;
}
exports.isReusableStackSynthesizer = isReusableStackSynthesizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUEyRkE7O0dBRUc7QUFDSCxTQUFnQiwwQkFBMEIsQ0FBQyxDQUFvQjtJQUM3RCxPQUFPLENBQUMsQ0FBRSxDQUFTLENBQUMsWUFBWSxDQUFDO0FBQ25DLENBQUM7QUFGRCxnRUFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENsb3VkQXNzZW1ibHlCdWlsZGVyIH0gZnJvbSAnQGF3cy1jZGsvY3gtYXBpJztcbmltcG9ydCB7IERvY2tlckltYWdlQXNzZXRMb2NhdGlvbiwgRG9ja2VySW1hZ2VBc3NldFNvdXJjZSwgRmlsZUFzc2V0TG9jYXRpb24sIEZpbGVBc3NldFNvdXJjZSB9IGZyb20gJy4uL2Fzc2V0cyc7XG5pbXBvcnQgeyBTdGFjayB9IGZyb20gJy4uL3N0YWNrJztcblxuLyoqXG4gKiBFbmNvZGVzIGluZm9ybWF0aW9uIGhvdyBhIGNlcnRhaW4gU3RhY2sgc2hvdWxkIGJlIGRlcGxveWVkXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSVN0YWNrU3ludGhlc2l6ZXIge1xuICAvKipcbiAgICogVGhlIHF1YWxpZmllciB1c2VkIHRvIGJvb3RzdHJhcCB0aGlzIHN0YWNrXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gbm8gcXVhbGlmaWVyXG4gICAqL1xuICByZWFkb25seSBib290c3RyYXBRdWFsaWZpZXI/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEJpbmQgdG8gdGhlIHN0YWNrIHRoaXMgZW52aXJvbm1lbnQgaXMgZ29pbmcgdG8gYmUgdXNlZCBvblxuICAgKlxuICAgKiBNdXN0IGJlIGNhbGxlZCBiZWZvcmUgYW55IG9mIHRoZSBvdGhlciBtZXRob2RzIGFyZSBjYWxsZWQsIGFuZCBjYW4gb25seSBiZSBjYWxsZWQgb25jZS5cbiAgICovXG4gIGJpbmQoc3RhY2s6IFN0YWNrKTogdm9pZDtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBGaWxlIEFzc2V0XG4gICAqXG4gICAqIFJldHVybnMgdGhlIHBhcmFtZXRlcnMgdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlciB0byB0aGUgYXNzZXQgaW5zaWRlIHRoZSB0ZW1wbGF0ZS5cbiAgICovXG4gIGFkZEZpbGVBc3NldChhc3NldDogRmlsZUFzc2V0U291cmNlKTogRmlsZUFzc2V0TG9jYXRpb247XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgRG9ja2VyIEltYWdlIEFzc2V0XG4gICAqXG4gICAqIFJldHVybnMgdGhlIHBhcmFtZXRlcnMgdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlciB0byB0aGUgYXNzZXQgaW5zaWRlIHRoZSB0ZW1wbGF0ZS5cbiAgICovXG4gIGFkZERvY2tlckltYWdlQXNzZXQoYXNzZXQ6IERvY2tlckltYWdlQXNzZXRTb3VyY2UpOiBEb2NrZXJJbWFnZUFzc2V0TG9jYXRpb247XG5cbiAgLyoqXG4gICAqIFN5bnRoZXNpemUgdGhlIGFzc29jaWF0ZWQgc3RhY2sgdG8gdGhlIHNlc3Npb25cbiAgICovXG4gIHN5bnRoZXNpemUoc2Vzc2lvbjogSVN5bnRoZXNpc1Nlc3Npb24pOiB2b2lkO1xufVxuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgU3RhY2sgU3ludGhlc2l6ZXJzIHRoYXQgY2FuIGJlIHVzZWQgZm9yIG1vcmUgdGhhbiBvbmUgc3RhY2suXG4gKlxuICogUmVndWxhciBgSVN0YWNrU3ludGhlc2l6ZXJgIGluc3RhbmNlcyBjYW4gb25seSBiZSBib3VuZCB0byBhIFN0YWNrIG9uY2UuXG4gKiBgSVJldXNhYmxlU3RhY2tTeW50aGVzaXplcmAgaW5zdGFuY2VzLlxuICpcbiAqIEZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSByZWFzb25zLCB0aGlzIGNsYXNzIGluaGVyaXRzIGZyb21cbiAqIGBJU3RhY2tTeW50aGVzaXplcmAsIGJ1dCBpZiBhbiBvYmplY3QgaW1wbGVtZW50cyBgSVJldXNhYmxlU3RhY2tTeW50aGVzaXplcmAsXG4gKiBubyBvdGhlciBtZXRob2RzIHRoYW4gYHJldXNhYmxlQmluZCgpYCB3aWxsIGJlIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJUmV1c2FibGVTdGFja1N5bnRoZXNpemVyIGV4dGVuZHMgSVN0YWNrU3ludGhlc2l6ZXIge1xuICAvKipcbiAgICogUHJvZHVjZSBhIGJvdW5kIFN0YWNrIFN5bnRoZXNpemVyIGZvciB0aGUgZ2l2ZW4gc3RhY2suXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIG1heSBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2Ugb24gdGhlIHNhbWUgb2JqZWN0LlxuICAgKi9cbiAgcmV1c2FibGVCaW5kKHN0YWNrOiBTdGFjayk6IElCb3VuZFN0YWNrU3ludGhlc2l6ZXI7XG59XG5cbi8qKlxuICogQSBTdGFjayBTeW50aGVzaXplciwgb2J0YWluZWQgZnJvbSBgSVJldXNhYmxlU3RhY2tTeW50aGVzaXplci5gXG4gKlxuICogSnVzdCBhIHR5cGUgYWxpYXMgd2l0aCBhIHZlcnkgY29uY3JldGUgY29udHJhY3QuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUJvdW5kU3RhY2tTeW50aGVzaXplciBleHRlbmRzIElTdGFja1N5bnRoZXNpemVyIHtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgc2luZ2xlIHNlc3Npb24gb2Ygc3ludGhlc2lzLiBQYXNzZWQgaW50byBgQ29uc3RydWN0LnN5bnRoZXNpemUoKWAgbWV0aG9kcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJU3ludGhlc2lzU2Vzc2lvbiB7XG4gIC8qKlxuICAgKiBUaGUgb3V0cHV0IGRpcmVjdG9yeSBmb3IgdGhpcyBzeW50aGVzaXMgc2Vzc2lvbi5cbiAgICovXG4gIG91dGRpcjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDbG91ZCBhc3NlbWJseSBidWlsZGVyLlxuICAgKi9cbiAgYXNzZW1ibHk6IENsb3VkQXNzZW1ibHlCdWlsZGVyO1xuXG4gIC8qKlxuICAqIFdoZXRoZXIgdGhlIHN0YWNrIHNob3VsZCBiZSB2YWxpZGF0ZWQgYWZ0ZXIgc3ludGhlc2lzIHRvIGNoZWNrIGZvciBlcnJvciBtZXRhZGF0YVxuICAqXG4gICogQGRlZmF1bHQgLSBmYWxzZVxuICAqL1xuICB2YWxpZGF0ZU9uU3ludGg/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGdpdmVuIFN0YWNrIFN5bnRoZXNpemVyIGlzIHJldXNhYmxlIG9yIG5vdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZXVzYWJsZVN0YWNrU3ludGhlc2l6ZXIoeDogSVN0YWNrU3ludGhlc2l6ZXIpOiB4IGlzIElSZXVzYWJsZVN0YWNrU3ludGhlc2l6ZXIge1xuICByZXR1cm4gISEoeCBhcyBhbnkpLnJldXNhYmxlQmluZDtcbn0iXX0=