"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linter_1 = require("../linter");
const UPPER_SNAKE_CASE_ALLOWED_PATTERN = new RegExp('^[A-Z0-9][A-Z0-9_]*[A-Z0-9]+$');
exports.publicStaticPropertiesLinter = new linter_1.Linter(assembly => {
    const result = new Array();
    for (const c of assembly.classes) {
        for (const property of c.allProperties) {
            if (property.const && property.static) {
                result.push(property);
            }
        }
    }
    return result;
});
exports.publicStaticPropertiesLinter.add({
    code: 'public-static-props-all-caps',
    message: 'public static properties must be named using ALL_CAPS',
    eval: e => {
        const name = e.ctx.name;
        e.assert(UPPER_SNAKE_CASE_ALLOWED_PATTERN.test(name), `${e.ctx.parentType.fqn}.${name}`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljLXN0YXRpYy1wcm9wZXJ0aWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHVibGljLXN0YXRpYy1wcm9wZXJ0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esc0NBQW1DO0FBRW5DLE1BQU0sZ0NBQWdDLEdBQUcsSUFBSSxNQUFNLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUV4RSxRQUFBLDRCQUE0QixHQUFHLElBQUksZUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0lBQ2hFLE1BQU0sTUFBTSxHQUFHLElBQUksS0FBSyxFQUFZLENBQUM7SUFDckMsS0FBSyxNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFO1FBQ2hDLEtBQUssTUFBTSxRQUFRLElBQUksQ0FBQyxDQUFDLGFBQWEsRUFBRTtZQUNwQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN6QjtTQUNKO0tBQ0Y7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQztBQUVILG9DQUE0QixDQUFDLEdBQUcsQ0FBQztJQUMvQixJQUFJLEVBQUUsOEJBQThCO0lBQ3BDLE9BQU8sRUFBRSx1REFBdUQ7SUFDaEUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ1IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDeEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMzRixDQUFDO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvcGVydHkgfSBmcm9tICdqc2lpLXJlZmxlY3QnO1xuaW1wb3J0IHsgTGludGVyIH0gZnJvbSAnLi4vbGludGVyJztcblxuY29uc3QgVVBQRVJfU05BS0VfQ0FTRV9BTExPV0VEX1BBVFRFUk4gPSBuZXcgUmVnRXhwKCdeW0EtWjAtOV1bQS1aMC05X10qW0EtWjAtOV0rJCcpO1xuXG5leHBvcnQgY29uc3QgcHVibGljU3RhdGljUHJvcGVydGllc0xpbnRlciA9IG5ldyBMaW50ZXIoYXNzZW1ibHkgPT4ge1xuICBjb25zdCByZXN1bHQgPSBuZXcgQXJyYXk8UHJvcGVydHk+KCk7XG4gIGZvciAoY29uc3QgYyBvZiBhc3NlbWJseS5jbGFzc2VzKSB7XG4gICAgZm9yIChjb25zdCBwcm9wZXJ0eSBvZiBjLmFsbFByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKHByb3BlcnR5LmNvbnN0ICYmIHByb3BlcnR5LnN0YXRpYykge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gocHJvcGVydHkpO1xuICAgICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59KTtcblxucHVibGljU3RhdGljUHJvcGVydGllc0xpbnRlci5hZGQoe1xuICBjb2RlOiAncHVibGljLXN0YXRpYy1wcm9wcy1hbGwtY2FwcycsXG4gIG1lc3NhZ2U6ICdwdWJsaWMgc3RhdGljIHByb3BlcnRpZXMgbXVzdCBiZSBuYW1lZCB1c2luZyBBTExfQ0FQUycsXG4gIGV2YWw6IGUgPT4ge1xuICAgIGNvbnN0IG5hbWUgPSBlLmN0eC5uYW1lO1xuICAgIGUuYXNzZXJ0KFVQUEVSX1NOQUtFX0NBU0VfQUxMT1dFRF9QQVRURVJOLnRlc3QobmFtZSksIGAke2UuY3R4LnBhcmVudFR5cGUuZnFufS4ke25hbWV9YCk7XG4gIH1cbn0pOyJdfQ==