"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lambda = require("../lib");
describe('runtime', () => {
    test('runtimes are equal for different instances', () => {
        // GIVEN
        const runtime1 = new lambda.Runtime('python3.7', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: true });
        const runtime2 = new lambda.Runtime('python3.7', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: true });
        // WHEN
        expect(runtime1.runtimeEquals(runtime2)).toBe(true);
    });
    test('runtimes are equal for same instance', () => {
        const runtime = new lambda.Runtime('python3.7', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: true });
        expect(runtime.runtimeEquals(runtime)).toBe(true);
    });
    test('unequal when name changes', () => {
        const runtime1 = new lambda.Runtime('python3.7', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: true });
        const runtime2 = new lambda.Runtime('python3.6', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: true });
        expect(runtime1.runtimeEquals(runtime2)).toBe(false);
    });
    test('unequal when family changes', () => {
        const runtime1 = new lambda.Runtime('python3.7', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: true });
        const runtime2 = new lambda.Runtime('python3.7', lambda.RuntimeFamily.JAVA, { supportsInlineCode: true });
        expect(runtime1.runtimeEquals(runtime2)).toBe(false);
    });
    test('unequal when supportsInlineCode changes', () => {
        const runtime1 = new lambda.Runtime('python3.7', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: true });
        const runtime2 = new lambda.Runtime('python3.7', lambda.RuntimeFamily.PYTHON, { supportsInlineCode: false });
        expect(runtime1.runtimeEquals(runtime2)).toBe(false);
    });
    test('bundlingDockerImage points to AWS SAM build image', () => {
        // GIVEN
        const runtime = new lambda.Runtime('my-runtime-name');
        // THEN
        expect(runtime.bundlingDockerImage.image).toEqual('public.ecr.aws/sam/build-my-runtime-name');
    });
    test('overridde to bundlingDockerImage points to the correct image', () => {
        // GIVEN
        const runtime = new lambda.Runtime('my-runtime-name', undefined, {
            bundlingDockerImage: 'my-docker-image',
        });
        // THEN
        expect(runtime.bundlingDockerImage.image).toEqual('my-docker-image');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnVudGltZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWlDO0FBRWpDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO0lBQ3ZCLElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7UUFDdEQsUUFBUTtRQUNSLE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzVHLE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRTVHLE9BQU87UUFDUCxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7UUFDaEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFM0csTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzVHLE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRTVHLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZELENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM1RyxNQUFNLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUUxRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2RCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7UUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDNUcsTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFN0csTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUUsR0FBRyxFQUFFO1FBQzdELFFBQVE7UUFDUixNQUFNLE9BQU8sR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUV0RCxPQUFPO1FBQ1AsTUFBTSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsMENBQTBDLENBQUMsQ0FBQztJQUNoRyxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyw4REFBOEQsRUFBRSxHQUFHLEVBQUU7UUFDeEUsUUFBUTtRQUNSLE1BQU0sT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLEVBQUU7WUFDL0QsbUJBQW1CLEVBQUUsaUJBQWlCO1NBQ3ZDLENBQUMsQ0FBQztRQUVILE9BQU87UUFDUCxNQUFNLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3ZFLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnLi4vbGliJztcblxuZGVzY3JpYmUoJ3J1bnRpbWUnLCAoKSA9PiB7XG4gIHRlc3QoJ3J1bnRpbWVzIGFyZSBlcXVhbCBmb3IgZGlmZmVyZW50IGluc3RhbmNlcycsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IHJ1bnRpbWUxID0gbmV3IGxhbWJkYS5SdW50aW1lKCdweXRob24zLjcnLCBsYW1iZGEuUnVudGltZUZhbWlseS5QWVRIT04sIHsgc3VwcG9ydHNJbmxpbmVDb2RlOiB0cnVlIH0pO1xuICAgIGNvbnN0IHJ1bnRpbWUyID0gbmV3IGxhbWJkYS5SdW50aW1lKCdweXRob24zLjcnLCBsYW1iZGEuUnVudGltZUZhbWlseS5QWVRIT04sIHsgc3VwcG9ydHNJbmxpbmVDb2RlOiB0cnVlIH0pO1xuXG4gICAgLy8gV0hFTlxuICAgIGV4cGVjdChydW50aW1lMS5ydW50aW1lRXF1YWxzKHJ1bnRpbWUyKSkudG9CZSh0cnVlKTtcbiAgfSk7XG5cbiAgdGVzdCgncnVudGltZXMgYXJlIGVxdWFsIGZvciBzYW1lIGluc3RhbmNlJywgKCkgPT4ge1xuICAgIGNvbnN0IHJ1bnRpbWUgPSBuZXcgbGFtYmRhLlJ1bnRpbWUoJ3B5dGhvbjMuNycsIGxhbWJkYS5SdW50aW1lRmFtaWx5LlBZVEhPTiwgeyBzdXBwb3J0c0lubGluZUNvZGU6IHRydWUgfSk7XG5cbiAgICBleHBlY3QocnVudGltZS5ydW50aW1lRXF1YWxzKHJ1bnRpbWUpKS50b0JlKHRydWUpO1xuICB9KTtcblxuICB0ZXN0KCd1bmVxdWFsIHdoZW4gbmFtZSBjaGFuZ2VzJywgKCkgPT4ge1xuICAgIGNvbnN0IHJ1bnRpbWUxID0gbmV3IGxhbWJkYS5SdW50aW1lKCdweXRob24zLjcnLCBsYW1iZGEuUnVudGltZUZhbWlseS5QWVRIT04sIHsgc3VwcG9ydHNJbmxpbmVDb2RlOiB0cnVlIH0pO1xuICAgIGNvbnN0IHJ1bnRpbWUyID0gbmV3IGxhbWJkYS5SdW50aW1lKCdweXRob24zLjYnLCBsYW1iZGEuUnVudGltZUZhbWlseS5QWVRIT04sIHsgc3VwcG9ydHNJbmxpbmVDb2RlOiB0cnVlIH0pO1xuXG4gICAgZXhwZWN0KHJ1bnRpbWUxLnJ1bnRpbWVFcXVhbHMocnVudGltZTIpKS50b0JlKGZhbHNlKTtcbiAgfSk7XG5cbiAgdGVzdCgndW5lcXVhbCB3aGVuIGZhbWlseSBjaGFuZ2VzJywgKCkgPT4ge1xuICAgIGNvbnN0IHJ1bnRpbWUxID0gbmV3IGxhbWJkYS5SdW50aW1lKCdweXRob24zLjcnLCBsYW1iZGEuUnVudGltZUZhbWlseS5QWVRIT04sIHsgc3VwcG9ydHNJbmxpbmVDb2RlOiB0cnVlIH0pO1xuICAgIGNvbnN0IHJ1bnRpbWUyID0gbmV3IGxhbWJkYS5SdW50aW1lKCdweXRob24zLjcnLCBsYW1iZGEuUnVudGltZUZhbWlseS5KQVZBLCB7IHN1cHBvcnRzSW5saW5lQ29kZTogdHJ1ZSB9KTtcblxuICAgIGV4cGVjdChydW50aW1lMS5ydW50aW1lRXF1YWxzKHJ1bnRpbWUyKSkudG9CZShmYWxzZSk7XG4gIH0pO1xuXG4gIHRlc3QoJ3VuZXF1YWwgd2hlbiBzdXBwb3J0c0lubGluZUNvZGUgY2hhbmdlcycsICgpID0+IHtcbiAgICBjb25zdCBydW50aW1lMSA9IG5ldyBsYW1iZGEuUnVudGltZSgncHl0aG9uMy43JywgbGFtYmRhLlJ1bnRpbWVGYW1pbHkuUFlUSE9OLCB7IHN1cHBvcnRzSW5saW5lQ29kZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBydW50aW1lMiA9IG5ldyBsYW1iZGEuUnVudGltZSgncHl0aG9uMy43JywgbGFtYmRhLlJ1bnRpbWVGYW1pbHkuUFlUSE9OLCB7IHN1cHBvcnRzSW5saW5lQ29kZTogZmFsc2UgfSk7XG5cbiAgICBleHBlY3QocnVudGltZTEucnVudGltZUVxdWFscyhydW50aW1lMikpLnRvQmUoZmFsc2UpO1xuICB9KTtcblxuICB0ZXN0KCdidW5kbGluZ0RvY2tlckltYWdlIHBvaW50cyB0byBBV1MgU0FNIGJ1aWxkIGltYWdlJywgKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgY29uc3QgcnVudGltZSA9IG5ldyBsYW1iZGEuUnVudGltZSgnbXktcnVudGltZS1uYW1lJyk7XG5cbiAgICAvLyBUSEVOXG4gICAgZXhwZWN0KHJ1bnRpbWUuYnVuZGxpbmdEb2NrZXJJbWFnZS5pbWFnZSkudG9FcXVhbCgncHVibGljLmVjci5hd3Mvc2FtL2J1aWxkLW15LXJ1bnRpbWUtbmFtZScpO1xuICB9KTtcblxuICB0ZXN0KCdvdmVycmlkZGUgdG8gYnVuZGxpbmdEb2NrZXJJbWFnZSBwb2ludHMgdG8gdGhlIGNvcnJlY3QgaW1hZ2UnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCBydW50aW1lID0gbmV3IGxhbWJkYS5SdW50aW1lKCdteS1ydW50aW1lLW5hbWUnLCB1bmRlZmluZWQsIHtcbiAgICAgIGJ1bmRsaW5nRG9ja2VySW1hZ2U6ICdteS1kb2NrZXItaW1hZ2UnLFxuICAgIH0pO1xuXG4gICAgLy8gVEhFTlxuICAgIGV4cGVjdChydW50aW1lLmJ1bmRsaW5nRG9ja2VySW1hZ2UuaW1hZ2UpLnRvRXF1YWwoJ215LWRvY2tlci1pbWFnZScpO1xuICB9KTtcbn0pO1xuIl19