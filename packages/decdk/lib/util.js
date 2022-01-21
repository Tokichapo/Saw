"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stackNameFromFileName = exports.loadTypeSystem = exports.readTemplate = void 0;
const fs = require("fs-extra");
const jsiiReflect = require("jsii-reflect");
const path = require("path");
const YAML = require("yaml");
/**
 * Reads a YAML/JSON template file.
 */
async function readTemplate(templateFile) {
    const str = await fs.readFile(templateFile, { encoding: 'utf-8' });
    const template = YAML.parse(str, { schema: 'yaml-1.1' });
    return template;
}
exports.readTemplate = readTemplate;
async function loadTypeSystem(validate = true) {
    const typeSystem = new jsiiReflect.TypeSystem();
    await typeSystem.loadNpmDependencies(path.resolve(__dirname, '..'), { validate });
    return typeSystem;
}
exports.loadTypeSystem = loadTypeSystem;
function stackNameFromFileName(fileName) {
    return path.parse(fileName).name.replace('.', '-');
}
exports.stackNameFromFileName = stackNameFromFileName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQStCO0FBQy9CLDRDQUE0QztBQUM1Qyw2QkFBNkI7QUFDN0IsNkJBQTZCO0FBRTdCOztHQUVHO0FBQ0ksS0FBSyxVQUFVLFlBQVksQ0FBQyxZQUFvQjtJQUNyRCxNQUFNLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDbkUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUN6RCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBSkQsb0NBSUM7QUFFTSxLQUFLLFVBQVUsY0FBYyxDQUFDLFFBQVEsR0FBRyxJQUFJO0lBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUksV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ2hELE1BQU0sVUFBVSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNsRixPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBSkQsd0NBSUM7QUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxRQUFnQjtJQUNwRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUZELHNEQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMganNpaVJlZmxlY3QgZnJvbSAnanNpaS1yZWZsZWN0JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBZQU1MIGZyb20gJ3lhbWwnO1xuXG4vKipcbiAqIFJlYWRzIGEgWUFNTC9KU09OIHRlbXBsYXRlIGZpbGUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkVGVtcGxhdGUodGVtcGxhdGVGaWxlOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3RyID0gYXdhaXQgZnMucmVhZEZpbGUodGVtcGxhdGVGaWxlLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xuICBjb25zdCB0ZW1wbGF0ZSA9IFlBTUwucGFyc2Uoc3RyLCB7IHNjaGVtYTogJ3lhbWwtMS4xJyB9KTtcbiAgcmV0dXJuIHRlbXBsYXRlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFR5cGVTeXN0ZW0odmFsaWRhdGUgPSB0cnVlKSB7XG4gIGNvbnN0IHR5cGVTeXN0ZW0gPSBuZXcganNpaVJlZmxlY3QuVHlwZVN5c3RlbSgpO1xuICBhd2FpdCB0eXBlU3lzdGVtLmxvYWROcG1EZXBlbmRlbmNpZXMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJyksIHsgdmFsaWRhdGUgfSk7XG4gIHJldHVybiB0eXBlU3lzdGVtO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhY2tOYW1lRnJvbUZpbGVOYW1lKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHBhdGgucGFyc2UoZmlsZU5hbWUpLm5hbWUucmVwbGFjZSgnLicsICctJyk7XG59XG4iXX0=