"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("../lib");
/// !show
// Pick the right Amazon Linux edition. All arguments shown are optional
// and will default to these values when omitted.
const amznLinux = ec2.MachineImage.latestAmazonLinux({
    generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX,
    edition: ec2.AmazonLinuxEdition.STANDARD,
    virtualization: ec2.AmazonLinuxVirt.HVM,
    storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
    cpuType: ec2.AmazonLinuxCpuType.X86_64,
});
// Pick a Windows edition to use
const windows = ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE);
// Read AMI id from SSM parameter store
const ssm = ec2.MachineImage.fromSsmParameter('/my/ami', { os: ec2.OperatingSystemType.LINUX });
// Look up the most recent image matching a set of AMI filters.
// In this case, look up the NAT instance AMI, by using a wildcard
// in the 'name' field:
const natAmi = ec2.MachineImage.lookup({
    name: 'amzn-ami-vpc-nat-*',
    owners: ['amazon'],
});
// For other custom (Linux) images, instantiate a `GenericLinuxImage` with
// a map giving the AMI to in for each region:
const linux = ec2.MachineImage.genericLinux({
    'us-east-1': 'ami-97785bed',
    'eu-west-1': 'ami-12345678',
});
// For other custom (Windows) images, instantiate a `GenericWindowsImage` with
// a map giving the AMI to in for each region:
const genericWindows = ec2.MachineImage.genericWindows({
    'us-east-1': 'ami-97785bed',
    'eu-west-1': 'ami-12345678',
});
/// !hide
Array.isArray(windows);
Array.isArray(amznLinux);
Array.isArray(linux);
Array.isArray(ssm);
Array.isArray(genericWindows);
Array.isArray(natAmi);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhhbXBsZS5pbWFnZXMubGl0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXhhbXBsZS5pbWFnZXMubGl0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsOEJBQThCO0FBRTlCLFNBQVM7QUFDVCx3RUFBd0U7QUFDeEUsaURBQWlEO0FBQ2pELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUM7SUFDbkQsVUFBVSxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZO0lBQ2xELE9BQU8sRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsUUFBUTtJQUN4QyxjQUFjLEVBQUUsR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHO0lBQ3ZDLE9BQU8sRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsZUFBZTtJQUMvQyxPQUFPLEVBQUUsR0FBRyxDQUFDLGtCQUFrQixDQUFDLE1BQU07Q0FDdkMsQ0FBQyxDQUFDO0FBRUgsZ0NBQWdDO0FBQ2hDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMscUNBQXFDLENBQUMsQ0FBQztBQUV6Ryx1Q0FBdUM7QUFDdkMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7QUFFaEcsK0RBQStEO0FBQy9ELGtFQUFrRTtBQUNsRSx1QkFBdUI7QUFDdkIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7SUFDckMsSUFBSSxFQUFFLG9CQUFvQjtJQUMxQixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7Q0FDbkIsQ0FBQyxDQUFDO0FBRUgsMEVBQTBFO0FBQzFFLDhDQUE4QztBQUM5QyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQztJQUMxQyxXQUFXLEVBQUUsY0FBYztJQUMzQixXQUFXLEVBQUUsY0FBYztDQUU1QixDQUFDLENBQUM7QUFFSCw4RUFBOEU7QUFDOUUsOENBQThDO0FBQzlDLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDO0lBQ3JELFdBQVcsRUFBRSxjQUFjO0lBQzNCLFdBQVcsRUFBRSxjQUFjO0NBRTVCLENBQUMsQ0FBQztBQUNILFNBQVM7QUFFVCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZCLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDOUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGVjMiBmcm9tICcuLi9saWInO1xuXG4vLy8gIXNob3dcbi8vIFBpY2sgdGhlIHJpZ2h0IEFtYXpvbiBMaW51eCBlZGl0aW9uLiBBbGwgYXJndW1lbnRzIHNob3duIGFyZSBvcHRpb25hbFxuLy8gYW5kIHdpbGwgZGVmYXVsdCB0byB0aGVzZSB2YWx1ZXMgd2hlbiBvbWl0dGVkLlxuY29uc3QgYW16bkxpbnV4ID0gZWMyLk1hY2hpbmVJbWFnZS5sYXRlc3RBbWF6b25MaW51eCh7XG4gIGdlbmVyYXRpb246IGVjMi5BbWF6b25MaW51eEdlbmVyYXRpb24uQU1BWk9OX0xJTlVYLFxuICBlZGl0aW9uOiBlYzIuQW1hem9uTGludXhFZGl0aW9uLlNUQU5EQVJELFxuICB2aXJ0dWFsaXphdGlvbjogZWMyLkFtYXpvbkxpbnV4VmlydC5IVk0sXG4gIHN0b3JhZ2U6IGVjMi5BbWF6b25MaW51eFN0b3JhZ2UuR0VORVJBTF9QVVJQT1NFLFxuICBjcHVUeXBlOiBlYzIuQW1hem9uTGludXhDcHVUeXBlLlg4Nl82NCxcbn0pO1xuXG4vLyBQaWNrIGEgV2luZG93cyBlZGl0aW9uIHRvIHVzZVxuY29uc3Qgd2luZG93cyA9IGVjMi5NYWNoaW5lSW1hZ2UubGF0ZXN0V2luZG93cyhlYzIuV2luZG93c1ZlcnNpb24uV0lORE9XU19TRVJWRVJfMjAxOV9FTkdMSVNIX0ZVTExfQkFTRSk7XG5cbi8vIFJlYWQgQU1JIGlkIGZyb20gU1NNIHBhcmFtZXRlciBzdG9yZVxuY29uc3Qgc3NtID0gZWMyLk1hY2hpbmVJbWFnZS5mcm9tU3NtUGFyYW1ldGVyKCcvbXkvYW1pJywgeyBvczogZWMyLk9wZXJhdGluZ1N5c3RlbVR5cGUuTElOVVggfSk7XG5cbi8vIExvb2sgdXAgdGhlIG1vc3QgcmVjZW50IGltYWdlIG1hdGNoaW5nIGEgc2V0IG9mIEFNSSBmaWx0ZXJzLlxuLy8gSW4gdGhpcyBjYXNlLCBsb29rIHVwIHRoZSBOQVQgaW5zdGFuY2UgQU1JLCBieSB1c2luZyBhIHdpbGRjYXJkXG4vLyBpbiB0aGUgJ25hbWUnIGZpZWxkOlxuY29uc3QgbmF0QW1pID0gZWMyLk1hY2hpbmVJbWFnZS5sb29rdXAoe1xuICBuYW1lOiAnYW16bi1hbWktdnBjLW5hdC0qJyxcbiAgb3duZXJzOiBbJ2FtYXpvbiddLFxufSk7XG5cbi8vIEZvciBvdGhlciBjdXN0b20gKExpbnV4KSBpbWFnZXMsIGluc3RhbnRpYXRlIGEgYEdlbmVyaWNMaW51eEltYWdlYCB3aXRoXG4vLyBhIG1hcCBnaXZpbmcgdGhlIEFNSSB0byBpbiBmb3IgZWFjaCByZWdpb246XG5jb25zdCBsaW51eCA9IGVjMi5NYWNoaW5lSW1hZ2UuZ2VuZXJpY0xpbnV4KHtcbiAgJ3VzLWVhc3QtMSc6ICdhbWktOTc3ODViZWQnLFxuICAnZXUtd2VzdC0xJzogJ2FtaS0xMjM0NTY3OCcsXG4gIC8vIC4uLlxufSk7XG5cbi8vIEZvciBvdGhlciBjdXN0b20gKFdpbmRvd3MpIGltYWdlcywgaW5zdGFudGlhdGUgYSBgR2VuZXJpY1dpbmRvd3NJbWFnZWAgd2l0aFxuLy8gYSBtYXAgZ2l2aW5nIHRoZSBBTUkgdG8gaW4gZm9yIGVhY2ggcmVnaW9uOlxuY29uc3QgZ2VuZXJpY1dpbmRvd3MgPSBlYzIuTWFjaGluZUltYWdlLmdlbmVyaWNXaW5kb3dzKHtcbiAgJ3VzLWVhc3QtMSc6ICdhbWktOTc3ODViZWQnLFxuICAnZXUtd2VzdC0xJzogJ2FtaS0xMjM0NTY3OCcsXG4gIC8vIC4uLlxufSk7XG4vLy8gIWhpZGVcblxuQXJyYXkuaXNBcnJheSh3aW5kb3dzKTtcbkFycmF5LmlzQXJyYXkoYW16bkxpbnV4KTtcbkFycmF5LmlzQXJyYXkobGludXgpO1xuQXJyYXkuaXNBcnJheShzc20pO1xuQXJyYXkuaXNBcnJheShnZW5lcmljV2luZG93cyk7XG5BcnJheS5pc0FycmF5KG5hdEFtaSk7XG4iXX0=