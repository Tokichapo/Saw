"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assets_1 = require("@aws-cdk/assets");
const core_1 = require("@aws-cdk/core");
const compat_1 = require("../lib/compat");
test('FollowMode compatibility', () => {
    expect((0, compat_1.toSymlinkFollow)(undefined)).toBeUndefined();
    expect((0, compat_1.toSymlinkFollow)(assets_1.FollowMode.ALWAYS)).toBe(core_1.SymlinkFollowMode.ALWAYS);
    expect((0, compat_1.toSymlinkFollow)(assets_1.FollowMode.BLOCK_EXTERNAL)).toBe(core_1.SymlinkFollowMode.BLOCK_EXTERNAL);
    expect((0, compat_1.toSymlinkFollow)(assets_1.FollowMode.EXTERNAL)).toBe(core_1.SymlinkFollowMode.EXTERNAL);
    expect((0, compat_1.toSymlinkFollow)(assets_1.FollowMode.NEVER)).toBe(core_1.SymlinkFollowMode.NEVER);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGF0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb21wYXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRDQUE2QztBQUM3Qyx3Q0FBa0Q7QUFDbEQsMENBQWdEO0FBRWhELElBQUksQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7SUFDcEMsTUFBTSxDQUFDLElBQUEsd0JBQWUsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ25ELE1BQU0sQ0FBQyxJQUFBLHdCQUFlLEVBQUMsbUJBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxRSxNQUFNLENBQUMsSUFBQSx3QkFBZSxFQUFDLG1CQUFVLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsd0JBQWlCLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDMUYsTUFBTSxDQUFDLElBQUEsd0JBQWUsRUFBQyxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHdCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzlFLE1BQU0sQ0FBQyxJQUFBLHdCQUFlLEVBQUMsbUJBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxRSxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZvbGxvd01vZGUgfSBmcm9tICdAYXdzLWNkay9hc3NldHMnO1xuaW1wb3J0IHsgU3ltbGlua0ZvbGxvd01vZGUgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IHRvU3ltbGlua0ZvbGxvdyB9IGZyb20gJy4uL2xpYi9jb21wYXQnO1xuXG50ZXN0KCdGb2xsb3dNb2RlIGNvbXBhdGliaWxpdHknLCAoKSA9PiB7XG4gIGV4cGVjdCh0b1N5bWxpbmtGb2xsb3codW5kZWZpbmVkKSkudG9CZVVuZGVmaW5lZCgpO1xuICBleHBlY3QodG9TeW1saW5rRm9sbG93KEZvbGxvd01vZGUuQUxXQVlTKSkudG9CZShTeW1saW5rRm9sbG93TW9kZS5BTFdBWVMpO1xuICBleHBlY3QodG9TeW1saW5rRm9sbG93KEZvbGxvd01vZGUuQkxPQ0tfRVhURVJOQUwpKS50b0JlKFN5bWxpbmtGb2xsb3dNb2RlLkJMT0NLX0VYVEVSTkFMKTtcbiAgZXhwZWN0KHRvU3ltbGlua0ZvbGxvdyhGb2xsb3dNb2RlLkVYVEVSTkFMKSkudG9CZShTeW1saW5rRm9sbG93TW9kZS5FWFRFUk5BTCk7XG4gIGV4cGVjdCh0b1N5bWxpbmtGb2xsb3coRm9sbG93TW9kZS5ORVZFUikpLnRvQmUoU3ltbGlua0ZvbGxvd01vZGUuTkVWRVIpO1xufSk7XG4iXX0=