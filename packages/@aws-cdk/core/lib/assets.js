"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAssetPackaging = exports.AssetHashType = void 0;
/**
 * The type of asset hash
 *
 * NOTE: the hash is used in order to identify a specific revision of the asset, and
 * used for optimizing and caching deployment activities related to this asset such as
 * packaging, uploading to Amazon S3, etc.
 */
var AssetHashType;
(function (AssetHashType) {
    /**
     * Based on the content of the source path
     *
     * When bundling, use `SOURCE` when the content of the bundling output is not
     * stable across repeated bundling operations.
     */
    AssetHashType["SOURCE"] = "source";
    /**
     * Based on the content of the bundled path
     *
     * @deprecated use `OUTPUT` instead
     */
    AssetHashType["BUNDLE"] = "bundle";
    /**
     * Based on the content of the bundling output
     *
     * Use `OUTPUT` when the source of the asset is a top level folder containing
     * code and/or dependencies that are not directly linked to the asset.
     */
    AssetHashType["OUTPUT"] = "output";
    /**
     * Use a custom hash
     */
    AssetHashType["CUSTOM"] = "custom";
})(AssetHashType = exports.AssetHashType || (exports.AssetHashType = {}));
/**
 * Packaging modes for file assets.
 */
var FileAssetPackaging;
(function (FileAssetPackaging) {
    /**
     * The asset source path points to a directory, which should be archived using
     * zip and and then uploaded to Amazon S3.
     */
    FileAssetPackaging["ZIP_DIRECTORY"] = "zip";
    /**
     * The asset source path points to a single file, which should be uploaded
     * to Amazon S3.
     */
    FileAssetPackaging["FILE"] = "file";
})(FileAssetPackaging = exports.FileAssetPackaging || (exports.FileAssetPackaging = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNzZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTZEQTs7Ozs7O0dBTUc7QUFDSCxJQUFZLGFBNEJYO0FBNUJELFdBQVksYUFBYTtJQUN2Qjs7Ozs7T0FLRztJQUNILGtDQUFpQixDQUFBO0lBRWpCOzs7O09BSUc7SUFDSCxrQ0FBaUIsQ0FBQTtJQUVqQjs7Ozs7T0FLRztJQUNILGtDQUFpQixDQUFBO0lBRWpCOztPQUVHO0lBQ0gsa0NBQWlCLENBQUE7QUFDbkIsQ0FBQyxFQTVCVyxhQUFhLEdBQWIscUJBQWEsS0FBYixxQkFBYSxRQTRCeEI7QUFrS0Q7O0dBRUc7QUFDSCxJQUFZLGtCQVlYO0FBWkQsV0FBWSxrQkFBa0I7SUFDNUI7OztPQUdHO0lBQ0gsMkNBQXFCLENBQUE7SUFFckI7OztPQUdHO0lBQ0gsbUNBQWEsQ0FBQTtBQUNmLENBQUMsRUFaVyxrQkFBa0IsR0FBbEIsMEJBQWtCLEtBQWxCLDBCQUFrQixRQVk3QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1bmRsaW5nT3B0aW9ucyB9IGZyb20gJy4vYnVuZGxpbmcnO1xuXG4vKipcbiAqIENvbW1vbiBpbnRlcmZhY2UgZm9yIGFsbCBhc3NldHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSUFzc2V0IHtcbiAgLyoqXG4gICAqIEEgaGFzaCBvZiB0aGlzIGFzc2V0LCB3aGljaCBpcyBhdmFpbGFibGUgYXQgY29uc3RydWN0aW9uIHRpbWUuIEFzIHRoaXMgaXMgYSBwbGFpbiBzdHJpbmcsIGl0XG4gICAqIGNhbiBiZSB1c2VkIGluIGNvbnN0cnVjdCBJRHMgaW4gb3JkZXIgdG8gZW5mb3JjZSBjcmVhdGlvbiBvZiBhIG5ldyByZXNvdXJjZSB3aGVuIHRoZSBjb250ZW50XG4gICAqIGhhc2ggaGFzIGNoYW5nZWQuXG4gICAqL1xuICByZWFkb25seSBhc3NldEhhc2g6IHN0cmluZztcbn1cblxuLyoqXG4gKiBBc3NldCBoYXNoIG9wdGlvbnNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBc3NldE9wdGlvbnMge1xuICAvKipcbiAgICogU3BlY2lmeSBhIGN1c3RvbSBoYXNoIGZvciB0aGlzIGFzc2V0LiBJZiBgYXNzZXRIYXNoVHlwZWAgaXMgc2V0IGl0IG11c3RcbiAgICogYmUgc2V0IHRvIGBBc3NldEhhc2hUeXBlLkNVU1RPTWAuIEZvciBjb25zaXN0ZW5jeSwgdGhpcyBjdXN0b20gaGFzaCB3aWxsXG4gICAqIGJlIFNIQTI1NiBoYXNoZWQgYW5kIGVuY29kZWQgYXMgaGV4LiBUaGUgcmVzdWx0aW5nIGhhc2ggd2lsbCBiZSB0aGUgYXNzZXRcbiAgICogaGFzaC5cbiAgICpcbiAgICogTk9URTogdGhlIGhhc2ggaXMgdXNlZCBpbiBvcmRlciB0byBpZGVudGlmeSBhIHNwZWNpZmljIHJldmlzaW9uIG9mIHRoZSBhc3NldCwgYW5kXG4gICAqIHVzZWQgZm9yIG9wdGltaXppbmcgYW5kIGNhY2hpbmcgZGVwbG95bWVudCBhY3Rpdml0aWVzIHJlbGF0ZWQgdG8gdGhpcyBhc3NldCBzdWNoIGFzXG4gICAqIHBhY2thZ2luZywgdXBsb2FkaW5nIHRvIEFtYXpvbiBTMywgZXRjLiBJZiB5b3UgY2hvc2UgdG8gY3VzdG9taXplIHRoZSBoYXNoLCB5b3Ugd2lsbFxuICAgKiBuZWVkIHRvIG1ha2Ugc3VyZSBpdCBpcyB1cGRhdGVkIGV2ZXJ5IHRpbWUgdGhlIGFzc2V0IGNoYW5nZXMsIG9yIG90aGVyd2lzZSBpdCBpc1xuICAgKiBwb3NzaWJsZSB0aGF0IHNvbWUgZGVwbG95bWVudHMgd2lsbCBub3QgYmUgaW52YWxpZGF0ZWQuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gYmFzZWQgb24gYGFzc2V0SGFzaFR5cGVgXG4gICAqL1xuICByZWFkb25seSBhc3NldEhhc2g/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFNwZWNpZmllcyB0aGUgdHlwZSBvZiBoYXNoIHRvIGNhbGN1bGF0ZSBmb3IgdGhpcyBhc3NldC5cbiAgICpcbiAgICogSWYgYGFzc2V0SGFzaGAgaXMgY29uZmlndXJlZCwgdGhpcyBvcHRpb24gbXVzdCBiZSBgdW5kZWZpbmVkYCBvclxuICAgKiBgQXNzZXRIYXNoVHlwZS5DVVNUT01gLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIHRoZSBkZWZhdWx0IGlzIGBBc3NldEhhc2hUeXBlLlNPVVJDRWAsIGJ1dCBpZiBgYXNzZXRIYXNoYCBpc1xuICAgKiBleHBsaWNpdGx5IHNwZWNpZmllZCB0aGlzIHZhbHVlIGRlZmF1bHRzIHRvIGBBc3NldEhhc2hUeXBlLkNVU1RPTWAuXG4gICAqL1xuICByZWFkb25seSBhc3NldEhhc2hUeXBlPzogQXNzZXRIYXNoVHlwZTtcblxuICAvKipcbiAgICogQnVuZGxlIHRoZSBhc3NldCBieSBleGVjdXRpbmcgYSBjb21tYW5kIGluIGEgRG9ja2VyIGNvbnRhaW5lciBvciBhIGN1c3RvbSBidW5kbGluZyBwcm92aWRlci5cbiAgICpcbiAgICogVGhlIGFzc2V0IHBhdGggd2lsbCBiZSBtb3VudGVkIGF0IGAvYXNzZXQtaW5wdXRgLiBUaGUgRG9ja2VyXG4gICAqIGNvbnRhaW5lciBpcyByZXNwb25zaWJsZSBmb3IgcHV0dGluZyBjb250ZW50IGF0IGAvYXNzZXQtb3V0cHV0YC5cbiAgICogVGhlIGNvbnRlbnQgYXQgYC9hc3NldC1vdXRwdXRgIHdpbGwgYmUgemlwcGVkIGFuZCB1c2VkIGFzIHRoZVxuICAgKiBmaW5hbCBhc3NldC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSB1cGxvYWRlZCBhcy1pcyB0byBTMyBpZiB0aGUgYXNzZXQgaXMgYSByZWd1bGFyIGZpbGUgb3IgYSAuemlwIGZpbGUsXG4gICAqIGFyY2hpdmVkIGludG8gYSAuemlwIGZpbGUgYW5kIHVwbG9hZGVkIHRvIFMzIG90aGVyd2lzZVxuICAgKlxuICAgKlxuICAgKi9cbiAgcmVhZG9ubHkgYnVuZGxpbmc/OiBCdW5kbGluZ09wdGlvbnM7XG59XG5cbi8qKlxuICogVGhlIHR5cGUgb2YgYXNzZXQgaGFzaFxuICpcbiAqIE5PVEU6IHRoZSBoYXNoIGlzIHVzZWQgaW4gb3JkZXIgdG8gaWRlbnRpZnkgYSBzcGVjaWZpYyByZXZpc2lvbiBvZiB0aGUgYXNzZXQsIGFuZFxuICogdXNlZCBmb3Igb3B0aW1pemluZyBhbmQgY2FjaGluZyBkZXBsb3ltZW50IGFjdGl2aXRpZXMgcmVsYXRlZCB0byB0aGlzIGFzc2V0IHN1Y2ggYXNcbiAqIHBhY2thZ2luZywgdXBsb2FkaW5nIHRvIEFtYXpvbiBTMywgZXRjLlxuICovXG5leHBvcnQgZW51bSBBc3NldEhhc2hUeXBlIHtcbiAgLyoqXG4gICAqIEJhc2VkIG9uIHRoZSBjb250ZW50IG9mIHRoZSBzb3VyY2UgcGF0aFxuICAgKlxuICAgKiBXaGVuIGJ1bmRsaW5nLCB1c2UgYFNPVVJDRWAgd2hlbiB0aGUgY29udGVudCBvZiB0aGUgYnVuZGxpbmcgb3V0cHV0IGlzIG5vdFxuICAgKiBzdGFibGUgYWNyb3NzIHJlcGVhdGVkIGJ1bmRsaW5nIG9wZXJhdGlvbnMuXG4gICAqL1xuICBTT1VSQ0UgPSAnc291cmNlJyxcblxuICAvKipcbiAgICogQmFzZWQgb24gdGhlIGNvbnRlbnQgb2YgdGhlIGJ1bmRsZWQgcGF0aFxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCB1c2UgYE9VVFBVVGAgaW5zdGVhZFxuICAgKi9cbiAgQlVORExFID0gJ2J1bmRsZScsXG5cbiAgLyoqXG4gICAqIEJhc2VkIG9uIHRoZSBjb250ZW50IG9mIHRoZSBidW5kbGluZyBvdXRwdXRcbiAgICpcbiAgICogVXNlIGBPVVRQVVRgIHdoZW4gdGhlIHNvdXJjZSBvZiB0aGUgYXNzZXQgaXMgYSB0b3AgbGV2ZWwgZm9sZGVyIGNvbnRhaW5pbmdcbiAgICogY29kZSBhbmQvb3IgZGVwZW5kZW5jaWVzIHRoYXQgYXJlIG5vdCBkaXJlY3RseSBsaW5rZWQgdG8gdGhlIGFzc2V0LlxuICAgKi9cbiAgT1VUUFVUID0gJ291dHB1dCcsXG5cbiAgLyoqXG4gICAqIFVzZSBhIGN1c3RvbSBoYXNoXG4gICAqL1xuICBDVVNUT00gPSAnY3VzdG9tJyxcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBzb3VyY2UgZm9yIGEgZmlsZSBhc3NldC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGaWxlQXNzZXRTb3VyY2Uge1xuICAvKipcbiAgICogQSBoYXNoIG9uIHRoZSBjb250ZW50IHNvdXJjZS4gVGhpcyBoYXNoIGlzIHVzZWQgdG8gdW5pcXVlbHkgaWRlbnRpZnkgdGhpc1xuICAgKiBhc3NldCB0aHJvdWdob3V0IHRoZSBzeXN0ZW0uIElmIHRoaXMgdmFsdWUgZG9lc24ndCBjaGFuZ2UsIHRoZSBhc3NldCB3aWxsXG4gICAqIG5vdCBiZSByZWJ1aWx0IG9yIHJlcHVibGlzaGVkLlxuICAgKi9cbiAgcmVhZG9ubHkgc291cmNlSGFzaDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBbiBleHRlcm5hbCBjb21tYW5kIHRoYXQgd2lsbCBwcm9kdWNlIHRoZSBwYWNrYWdlZCBhc3NldC5cbiAgICpcbiAgICogVGhlIGNvbW1hbmQgc2hvdWxkIHByb2R1Y2UgdGhlIGxvY2F0aW9uIG9mIGEgWklQIGZpbGUgb24gYHN0ZG91dGAuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gRXhhY3RseSBvbmUgb2YgYGRpcmVjdG9yeWAgYW5kIGBleGVjdXRhYmxlYCBpcyByZXF1aXJlZFxuICAgKi9cbiAgcmVhZG9ubHkgZXhlY3V0YWJsZT86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBUaGUgcGF0aCwgcmVsYXRpdmUgdG8gdGhlIHJvb3Qgb2YgdGhlIGNsb3VkIGFzc2VtYmx5LCBpbiB3aGljaCB0aGlzIGFzc2V0XG4gICAqIHNvdXJjZSByZXNpZGVzLiBUaGlzIGNhbiBiZSBhIHBhdGggdG8gYSBmaWxlIG9yIGEgZGlyZWN0b3J5LCBkZXBlbmRpbmcgb24gdGhlXG4gICAqIHBhY2thZ2luZyB0eXBlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIEV4YWN0bHkgb25lIG9mIGBkaXJlY3RvcnlgIGFuZCBgZXhlY3V0YWJsZWAgaXMgcmVxdWlyZWRcbiAgICovXG4gIHJlYWRvbmx5IGZpbGVOYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBXaGljaCB0eXBlIG9mIHBhY2thZ2luZyB0byBwZXJmb3JtLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIFJlcXVpcmVkIGlmIGBmaWxlTmFtZWAgaXMgc3BlY2lmaWVkLlxuICAgKi9cbiAgcmVhZG9ubHkgcGFja2FnaW5nPzogRmlsZUFzc2V0UGFja2FnaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERvY2tlckltYWdlQXNzZXRTb3VyY2Uge1xuICAvKipcbiAgICogVGhlIGhhc2ggb2YgdGhlIGNvbnRlbnRzIG9mIHRoZSBkb2NrZXIgYnVpbGQgY29udGV4dC4gVGhpcyBoYXNoIGlzIHVzZWRcbiAgICogdGhyb3VnaG91dCB0aGUgc3lzdGVtIHRvIGlkZW50aWZ5IHRoaXMgaW1hZ2UgYW5kIGF2b2lkIGR1cGxpY2F0ZSB3b3JrXG4gICAqIGluIGNhc2UgdGhlIHNvdXJjZSBkaWQgbm90IGNoYW5nZS5cbiAgICpcbiAgICogTk9URTogdGhpcyBtZWFucyB0aGF0IGlmIHlvdSB3aXNoIHRvIHVwZGF0ZSB5b3VyIGRvY2tlciBpbWFnZSwgeW91XG4gICAqIG11c3QgbWFrZSBhIG1vZGlmaWNhdGlvbiB0byB0aGUgc291cmNlIChlLmcuIGFkZCBzb21lIG1ldGFkYXRhIHRvIHlvdXIgRG9ja2VyZmlsZSkuXG4gICAqL1xuICByZWFkb25seSBzb3VyY2VIYXNoOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEFuIGV4dGVybmFsIGNvbW1hbmQgdGhhdCB3aWxsIHByb2R1Y2UgdGhlIHBhY2thZ2VkIGFzc2V0LlxuICAgKlxuICAgKiBUaGUgY29tbWFuZCBzaG91bGQgcHJvZHVjZSB0aGUgbmFtZSBvZiBhIGxvY2FsIERvY2tlciBpbWFnZSBvbiBgc3Rkb3V0YC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBFeGFjdGx5IG9uZSBvZiBgZGlyZWN0b3J5TmFtZWAgYW5kIGBleGVjdXRhYmxlYCBpcyByZXF1aXJlZFxuICAgKi9cbiAgcmVhZG9ubHkgZXhlY3V0YWJsZT86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBUaGUgZGlyZWN0b3J5IHdoZXJlIHRoZSBEb2NrZXJmaWxlIGlzIHN0b3JlZCwgbXVzdCBiZSByZWxhdGl2ZVxuICAgKiB0byB0aGUgY2xvdWQgYXNzZW1ibHkgcm9vdC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBFeGFjdGx5IG9uZSBvZiBgZGlyZWN0b3J5TmFtZWAgYW5kIGBleGVjdXRhYmxlYCBpcyByZXF1aXJlZFxuICAgKi9cbiAgcmVhZG9ubHkgZGlyZWN0b3J5TmFtZT86IHN0cmluZztcblxuICAvKipcbiAgICogQnVpbGQgYXJncyB0byBwYXNzIHRvIHRoZSBgZG9ja2VyIGJ1aWxkYCBjb21tYW5kLlxuICAgKlxuICAgKiBTaW5jZSBEb2NrZXIgYnVpbGQgYXJndW1lbnRzIGFyZSByZXNvbHZlZCBiZWZvcmUgZGVwbG95bWVudCwga2V5cyBhbmRcbiAgICogdmFsdWVzIGNhbm5vdCByZWZlciB0byB1bnJlc29sdmVkIHRva2VucyAoc3VjaCBhcyBgbGFtYmRhLmZ1bmN0aW9uQXJuYCBvclxuICAgKiBgcXVldWUucXVldWVVcmxgKS5cbiAgICpcbiAgICogT25seSBhbGxvd2VkIHdoZW4gYGRpcmVjdG9yeU5hbWVgIGlzIHNwZWNpZmllZC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBubyBidWlsZCBhcmdzIGFyZSBwYXNzZWRcbiAgICovXG4gIHJlYWRvbmx5IGRvY2tlckJ1aWxkQXJncz86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG5cbiAgLyoqXG4gICAqIEJ1aWxkIHNlY3JldHMgdG8gcGFzcyB0byB0aGUgYGRvY2tlciBidWlsZGAgY29tbWFuZC5cbiAgICpcbiAgICogU2luY2UgRG9ja2VyIGJ1aWxkIHNlY3JldHMgYXJlIHJlc29sdmVkIGJlZm9yZSBkZXBsb3ltZW50LCBrZXlzIGFuZFxuICAgKiB2YWx1ZXMgY2Fubm90IHJlZmVyIHRvIHVucmVzb2x2ZWQgdG9rZW5zIChzdWNoIGFzIGBsYW1iZGEuZnVuY3Rpb25Bcm5gIG9yXG4gICAqIGBxdWV1ZS5xdWV1ZVVybGApLlxuICAgKlxuICAgKiBPbmx5IGFsbG93ZWQgd2hlbiBgZGlyZWN0b3J5TmFtZWAgaXMgc3BlY2lmaWVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIGJ1aWxkIHNlY3JldHMgYXJlIHBhc3NlZFxuICAgKi9cbiAgcmVhZG9ubHkgZG9ja2VyQnVpbGRTZWNyZXRzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcblxuICAvKipcbiAgICogRG9ja2VyIHRhcmdldCB0byBidWlsZCB0b1xuICAgKlxuICAgKiBPbmx5IGFsbG93ZWQgd2hlbiBgZGlyZWN0b3J5TmFtZWAgaXMgc3BlY2lmaWVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIHRhcmdldFxuICAgKi9cbiAgcmVhZG9ubHkgZG9ja2VyQnVpbGRUYXJnZXQ/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFBhdGggdG8gdGhlIERvY2tlcmZpbGUgKHJlbGF0aXZlIHRvIHRoZSBkaXJlY3RvcnkpLlxuICAgKlxuICAgKiBPbmx5IGFsbG93ZWQgd2hlbiBgZGlyZWN0b3J5TmFtZWAgaXMgc3BlY2lmaWVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIGZpbGVcbiAgICovXG4gIHJlYWRvbmx5IGRvY2tlckZpbGU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEVDUiByZXBvc2l0b3J5IG5hbWVcbiAgICpcbiAgICogU3BlY2lmeSB0aGlzIHByb3BlcnR5IGlmIHlvdSBuZWVkIHRvIHN0YXRpY2FsbHkgYWRkcmVzcyB0aGUgaW1hZ2UsIGUuZy5cbiAgICogZnJvbSBhIEt1YmVybmV0ZXMgUG9kLiBOb3RlLCB0aGlzIGlzIG9ubHkgdGhlIHJlcG9zaXRvcnkgbmFtZSwgd2l0aG91dCB0aGVcbiAgICogcmVnaXN0cnkgYW5kIHRoZSB0YWcgcGFydHMuXG4gICAqXG4gICAqIEBkZWZhdWx0IC0gYXV0b21hdGljYWxseSBkZXJpdmVkIGZyb20gdGhlIGFzc2V0J3MgSUQuXG4gICAqIEBkZXByZWNhdGVkIHJlcG9zaXRvcnkgbmFtZSBzaG91bGQgYmUgc3BlY2lmaWVkIGF0IHRoZSBlbnZpcm9ubWVudC1sZXZlbCBhbmQgbm90IGF0IHRoZSBpbWFnZSBsZXZlbFxuICAgKi9cbiAgcmVhZG9ubHkgcmVwb3NpdG9yeU5hbWU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE5ldHdvcmtpbmcgbW9kZSBmb3IgdGhlIFJVTiBjb21tYW5kcyBkdXJpbmcgYnVpbGQuIF9SZXF1aXJlcyBEb2NrZXIgRW5naW5lIEFQSSB2MS4yNStfLlxuICAgKlxuICAgKiBTcGVjaWZ5IHRoaXMgcHJvcGVydHkgdG8gYnVpbGQgaW1hZ2VzIG9uIGEgc3BlY2lmaWMgbmV0d29ya2luZyBtb2RlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIG5ldHdvcmtpbmcgbW9kZSBzcGVjaWZpZWRcbiAgICovXG4gIHJlYWRvbmx5IG5ldHdvcmtNb2RlPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBQbGF0Zm9ybSB0byBidWlsZCBmb3IuIF9SZXF1aXJlcyBEb2NrZXIgQnVpbGR4Xy5cbiAgICpcbiAgICogU3BlY2lmeSB0aGlzIHByb3BlcnR5IHRvIGJ1aWxkIGltYWdlcyBvbiBhIHNwZWNpZmljIHBsYXRmb3JtLlxuICAgKlxuICAgKiBAZGVmYXVsdCAtIG5vIHBsYXRmb3JtIHNwZWNpZmllZCAodGhlIGN1cnJlbnQgbWFjaGluZSBhcmNoaXRlY3R1cmUgd2lsbCBiZSB1c2VkKVxuICAgKi9cbiAgcmVhZG9ubHkgcGxhdGZvcm0/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE91dHB1dHMgdG8gcGFzcyB0byB0aGUgYGRvY2tlciBidWlsZGAgY29tbWFuZC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBubyBidWlsZCBhcmdzIGFyZSBwYXNzZWRcbiAgICovXG4gIHJlYWRvbmx5IGRvY2tlck91dHB1dHM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQ2FjaGUgZnJvbSBvcHRpb25zIHRvIHBhc3MgdG8gdGhlIGBkb2NrZXIgYnVpbGRgIGNvbW1hbmQuXG4gICAqIEBkZWZhdWx0IC0gbm8gY2FjaGUgZnJvbSBhcmdzIGFyZSBwYXNzZWRcbiAgICovXG4gIHJlYWRvbmx5IGRvY2tlckNhY2hlRnJvbT86IERvY2tlckNhY2hlT3B0aW9uW107XG5cbiAgLyoqXG4gICAqIENhY2hlIHRvIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgYGRvY2tlciBidWlsZGAgY29tbWFuZC5cbiAgICogQGRlZmF1bHQgLSBubyBjYWNoZSB0byBhcmdzIGFyZSBwYXNzZWRcbiAgICovXG4gIHJlYWRvbmx5IGRvY2tlckNhY2hlVG8/OiBEb2NrZXJDYWNoZU9wdGlvbjtcblxufVxuXG4vKipcbiAqIFBhY2thZ2luZyBtb2RlcyBmb3IgZmlsZSBhc3NldHMuXG4gKi9cbmV4cG9ydCBlbnVtIEZpbGVBc3NldFBhY2thZ2luZyB7XG4gIC8qKlxuICAgKiBUaGUgYXNzZXQgc291cmNlIHBhdGggcG9pbnRzIHRvIGEgZGlyZWN0b3J5LCB3aGljaCBzaG91bGQgYmUgYXJjaGl2ZWQgdXNpbmdcbiAgICogemlwIGFuZCBhbmQgdGhlbiB1cGxvYWRlZCB0byBBbWF6b24gUzMuXG4gICAqL1xuICBaSVBfRElSRUNUT1JZID0gJ3ppcCcsXG5cbiAgLyoqXG4gICAqIFRoZSBhc3NldCBzb3VyY2UgcGF0aCBwb2ludHMgdG8gYSBzaW5nbGUgZmlsZSwgd2hpY2ggc2hvdWxkIGJlIHVwbG9hZGVkXG4gICAqIHRvIEFtYXpvbiBTMy5cbiAgICovXG4gIEZJTEUgPSAnZmlsZSdcbn1cblxuLyoqXG4gKiBUaGUgbG9jYXRpb24gb2YgdGhlIHB1Ymxpc2hlZCBmaWxlIGFzc2V0LiBUaGlzIGlzIHdoZXJlIHRoZSBhc3NldFxuICogY2FuIGJlIGNvbnN1bWVkIGF0IHJ1bnRpbWUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUFzc2V0TG9jYXRpb24ge1xuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIEFtYXpvbiBTMyBidWNrZXQuXG4gICAqL1xuICByZWFkb25seSBidWNrZXROYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBBbWF6b24gUzMgb2JqZWN0IGtleS5cbiAgICovXG4gIHJlYWRvbmx5IG9iamVjdEtleTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgSFRUUCBVUkwgb2YgdGhpcyBhc3NldCBvbiBBbWF6b24gUzMuXG4gICAqIEBkZWZhdWx0IC0gdmFsdWUgc3BlY2lmaWVkIGluIGBodHRwVXJsYCBpcyB1c2VkLlxuICAgKiBAZGVwcmVjYXRlZCB1c2UgYGh0dHBVcmxgXG4gICAqL1xuICByZWFkb25seSBzM1VybD86IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIEhUVFAgVVJMIG9mIHRoaXMgYXNzZXQgb24gQW1hem9uIFMzLlxuICAgKlxuICAgKiBUaGlzIHZhbHVlIHN1aXRhYmxlIGZvciBpbmNsdXNpb24gaW4gYSBDbG91ZEZvcm1hdGlvbiB0ZW1wbGF0ZSwgYW5kXG4gICAqIG1heSBiZSBhbiBlbmNvZGVkIHRva2VuLlxuICAgKlxuICAgKiBFeGFtcGxlIHZhbHVlOiBgaHR0cHM6Ly9zMy11cy1lYXN0LTEuYW1hem9uYXdzLmNvbS9teWJ1Y2tldC9teW9iamVjdGBcbiAgICovXG4gIHJlYWRvbmx5IGh0dHBVcmw6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIFMzIFVSTCBvZiB0aGlzIGFzc2V0IG9uIEFtYXpvbiBTMy5cbiAgICpcbiAgICogVGhpcyB2YWx1ZSBzdWl0YWJsZSBmb3IgaW5jbHVzaW9uIGluIGEgQ2xvdWRGb3JtYXRpb24gdGVtcGxhdGUsIGFuZFxuICAgKiBtYXkgYmUgYW4gZW5jb2RlZCB0b2tlbi5cbiAgICpcbiAgICogRXhhbXBsZSB2YWx1ZTogYHMzOi8vbXlidWNrZXQvbXlvYmplY3RgXG4gICAqL1xuICByZWFkb25seSBzM09iamVjdFVybDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgQVJOIG9mIHRoZSBLTVMga2V5IHVzZWQgdG8gZW5jcnlwdCB0aGUgZmlsZSBhc3NldCBidWNrZXQsIGlmIGFueS5cbiAgICpcbiAgICogVGhlIENESyBib290c3RyYXAgc3RhY2sgY29tZXMgd2l0aCBhIGtleSBwb2xpY3kgdGhhdCBkb2VzIG5vdCByZXF1aXJlXG4gICAqIHNldHRpbmcgdGhpcyBwcm9wZXJ0eSwgc28geW91IG9ubHkgbmVlZCB0byBzZXQgdGhpcyBwcm9wZXJ0eSBpZiB5b3VcbiAgICogaGF2ZSBjdXN0b21pemVkIHRoZSBib290c3RyYXAgc3RhY2sgdG8gcmVxdWlyZSBpdC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBBc3NldCBidWNrZXQgaXMgbm90IGVuY3J5cHRlZCwgb3IgZGVjcnlwdGlvbiBwZXJtaXNzaW9ucyBhcmVcbiAgICogZGVmaW5lZCBieSBhIEtleSBQb2xpY3kuXG4gICAqL1xuICByZWFkb25seSBrbXNLZXlBcm4/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIExpa2UgYHMzT2JqZWN0VXJsYCwgYnV0IG5vdCBzdWl0YWJsZSBmb3IgQ2xvdWRGb3JtYXRpb24gY29uc3VtcHRpb25cbiAgICpcbiAgICogSWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycyBpbiB0aGUgUzMgVVJMLCB0aGV5IHdpbGwgYmUgcmV0dXJuZWQgdW4tcmVwbGFjZWRcbiAgICogYW5kIHVuLWV2YWx1YXRlZC5cbiAgICpcbiAgICogQGRlZmF1bHQgLSBUaGlzIGZlYXR1cmUgY2Fubm90IGJlIHVzZWRcbiAgICovXG4gIHJlYWRvbmx5IHMzT2JqZWN0VXJsV2l0aFBsYWNlaG9sZGVycz86IHN0cmluZztcbn1cblxuLyoqXG4gKiBUaGUgbG9jYXRpb24gb2YgdGhlIHB1Ymxpc2hlZCBkb2NrZXIgaW1hZ2UuIFRoaXMgaXMgd2hlcmUgdGhlIGltYWdlIGNhbiBiZVxuICogY29uc3VtZWQgYXQgcnVudGltZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEb2NrZXJJbWFnZUFzc2V0TG9jYXRpb24ge1xuICAvKipcbiAgICogVGhlIFVSSSBvZiB0aGUgaW1hZ2UgaW4gQW1hem9uIEVDUiAoaW5jbHVkaW5nIGEgdGFnKS5cbiAgICovXG4gIHJlYWRvbmx5IGltYWdlVXJpOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSBFQ1IgcmVwb3NpdG9yeS5cbiAgICovXG4gIHJlYWRvbmx5IHJlcG9zaXRvcnlOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSB0YWcgb2YgdGhlIGltYWdlIGluIEFtYXpvbiBFQ1IuXG4gICAqIEBkZWZhdWx0IC0gdGhlIGhhc2ggb2YgdGhlIGFzc2V0LCBvciB0aGUgYGRvY2tlclRhZ1ByZWZpeGAgY29uY2F0ZW5hdGVkIHdpdGggdGhlIGFzc2V0IGhhc2ggaWYgYSBgZG9ja2VyVGFnUHJlZml4YCBpcyBzcGVjaWZpZWQgaW4gdGhlIHN0YWNrIHN5bnRoZXNpemVyXG4gICAqL1xuICByZWFkb25seSBpbWFnZVRhZz86IHN0cmluZztcbn1cblxuLyoqXG4gKiBPcHRpb25zIGZvciBjb25maWd1cmluZyB0aGUgRG9ja2VyIGNhY2hlIGJhY2tlbmRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEb2NrZXJDYWNoZU9wdGlvbiB7XG4gIC8qKlxuICAgKiBUaGUgdHlwZSBvZiBjYWNoZSB0byB1c2UuXG4gICAqIFJlZmVyIHRvIGh0dHBzOi8vZG9jcy5kb2NrZXIuY29tL2J1aWxkL2NhY2hlL2JhY2tlbmRzLyBmb3IgZnVsbCBsaXN0IG9mIGJhY2tlbmRzLlxuICAgKiBAZGVmYXVsdCAtIHVuc3BlY2lmaWVkXG4gICAqXG4gICAqIEBleGFtcGxlICdyZWdpc3RyeSdcbiAgICovXG4gIHJlYWRvbmx5IHR5cGU6IHN0cmluZztcbiAgLyoqXG4gICAqIEFueSBwYXJhbWV0ZXJzIHRvIHBhc3MgaW50byB0aGUgZG9ja2VyIGNhY2hlIGJhY2tlbmQgY29uZmlndXJhdGlvbi5cbiAgICogUmVmZXIgdG8gaHR0cHM6Ly9kb2NzLmRvY2tlci5jb20vYnVpbGQvY2FjaGUvYmFja2VuZHMvIGZvciBjYWNoZSBiYWNrZW5kIGNvbmZpZ3VyYXRpb24uXG4gICAqIEBkZWZhdWx0IHt9IE5vIG9wdGlvbnMgcHJvdmlkZWRcbiAgICpcbiAgICogQGV4YW1wbGUgeyByZWY6IGAxMjM0NTY3OC5ka3IuZWNyLnVzLXdlc3QtMi5hbWF6b25hd3MuY29tL2NhY2hlOiR7YnJhbmNofWAsIG1vZGU6IFwibWF4XCIgfVxuICAgKi9cbiAgcmVhZG9ubHkgcGFyYW1zPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbn0iXX0=