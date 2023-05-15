"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerEnvironmentStagingFactory = void 0;
const app_global_1 = require("./private/app-global");
/**
 * Per-environment cache
 *
 * This is a global because we might have multiple instances of this class
 * in the app, but we want to cache across all of them.
 */
const ENVIRONMENT_CACHE = new app_global_1.AppScopedGlobal(() => new Map());
/**
 * Wraps another IStagingResources factory, and caches the result on a per-environment basis.
 */
class PerEnvironmentStagingFactory {
    constructor(wrapped) {
        this.wrapped = wrapped;
    }
    obtainStagingResources(stack, context) {
        const cacheKey = context.environmentString;
        const cache = ENVIRONMENT_CACHE.for(stack);
        const existing = cache.get(cacheKey);
        if (existing) {
            return existing;
        }
        const result = this.wrapped.obtainStagingResources(stack, context);
        cache.set(cacheKey, result);
        return result;
    }
}
exports.PerEnvironmentStagingFactory = PerEnvironmentStagingFactory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyLWVudi1zdGFnaW5nLWZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwZXItZW52LXN0YWdpbmctZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxREFBdUQ7QUFHdkQ7Ozs7O0dBS0c7QUFDSCxNQUFNLGlCQUFpQixHQUFHLElBQUksNEJBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEdBQUcsRUFBNkIsQ0FBQyxDQUFDO0FBRTFGOztHQUVHO0FBQ0gsTUFBYSw0QkFBNEI7SUFDdkMsWUFBNkIsT0FBaUM7UUFBakMsWUFBTyxHQUFQLE9BQU8sQ0FBMEI7SUFBSSxDQUFDO0lBRTVELHNCQUFzQixDQUFDLEtBQVksRUFBRSxPQUFzQztRQUNoRixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUM7UUFFM0MsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsSUFBSSxRQUFRLEVBQUU7WUFDWixPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ25FLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7Q0FDRjtBQWhCRCxvRUFnQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEFwcFNjb3BlZEdsb2JhbCB9IGZyb20gJy4vcHJpdmF0ZS9hcHAtZ2xvYmFsJztcbmltcG9ydCB7IElTdGFnaW5nUmVzb3VyY2VzLCBJU3RhZ2luZ1Jlc291cmNlc0ZhY3RvcnksIE9idGFpblN0YWdpbmdSZXNvdXJjZXNDb250ZXh0IH0gZnJvbSAnLi9zdGFnaW5nLXN0YWNrJztcblxuLyoqXG4gKiBQZXItZW52aXJvbm1lbnQgY2FjaGVcbiAqXG4gKiBUaGlzIGlzIGEgZ2xvYmFsIGJlY2F1c2Ugd2UgbWlnaHQgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBjbGFzc1xuICogaW4gdGhlIGFwcCwgYnV0IHdlIHdhbnQgdG8gY2FjaGUgYWNyb3NzIGFsbCBvZiB0aGVtLlxuICovXG5jb25zdCBFTlZJUk9OTUVOVF9DQUNIRSA9IG5ldyBBcHBTY29wZWRHbG9iYWwoKCkgPT4gbmV3IE1hcDxzdHJpbmcsIElTdGFnaW5nUmVzb3VyY2VzPigpKTtcblxuLyoqXG4gKiBXcmFwcyBhbm90aGVyIElTdGFnaW5nUmVzb3VyY2VzIGZhY3RvcnksIGFuZCBjYWNoZXMgdGhlIHJlc3VsdCBvbiBhIHBlci1lbnZpcm9ubWVudCBiYXNpcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFBlckVudmlyb25tZW50U3RhZ2luZ0ZhY3RvcnkgaW1wbGVtZW50cyBJU3RhZ2luZ1Jlc291cmNlc0ZhY3Rvcnkge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHdyYXBwZWQ6IElTdGFnaW5nUmVzb3VyY2VzRmFjdG9yeSkgeyB9XG5cbiAgcHVibGljIG9idGFpblN0YWdpbmdSZXNvdXJjZXMoc3RhY2s6IFN0YWNrLCBjb250ZXh0OiBPYnRhaW5TdGFnaW5nUmVzb3VyY2VzQ29udGV4dCk6IElTdGFnaW5nUmVzb3VyY2VzIHtcbiAgICBjb25zdCBjYWNoZUtleSA9IGNvbnRleHQuZW52aXJvbm1lbnRTdHJpbmc7XG5cbiAgICBjb25zdCBjYWNoZSA9IEVOVklST05NRU5UX0NBQ0hFLmZvcihzdGFjayk7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBjYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMud3JhcHBlZC5vYnRhaW5TdGFnaW5nUmVzb3VyY2VzKHN0YWNrLCBjb250ZXh0KTtcbiAgICBjYWNoZS5zZXQoY2FjaGVLZXksIHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIl19