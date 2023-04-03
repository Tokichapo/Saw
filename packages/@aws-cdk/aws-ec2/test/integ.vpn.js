"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const ec2 = require("../lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-ec2-vpn');
const vpc = new ec2.Vpc(stack, 'MyVpc', {
    cidr: '10.10.0.0/16',
    vpnConnections: {
        Dynamic: {
            ip: '52.85.255.164',
            tunnelOptions: [
                {
                    preSharedKey: 'secretkey1234',
                },
            ],
        },
    },
});
vpc.addVpnConnection('Static', {
    ip: '52.85.255.197',
    staticRoutes: [
        '192.168.10.0/24',
        '192.168.20.0/24',
    ],
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcudnBuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcudnBuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQXFDO0FBQ3JDLDhCQUE4QjtBQUU5QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFFcEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUU7SUFDdEMsSUFBSSxFQUFFLGNBQWM7SUFDcEIsY0FBYyxFQUFFO1FBQ2QsT0FBTyxFQUFFO1lBQ1AsRUFBRSxFQUFFLGVBQWU7WUFDbkIsYUFBYSxFQUFFO2dCQUNiO29CQUNFLFlBQVksRUFBRSxlQUFlO2lCQUM5QjthQUNGO1NBQ0Y7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUU7SUFDN0IsRUFBRSxFQUFFLGVBQWU7SUFDbkIsWUFBWSxFQUFFO1FBQ1osaUJBQWlCO1FBQ2pCLGlCQUFpQjtLQUNsQjtDQUNGLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICcuLi9saWInO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuY29uc3Qgc3RhY2sgPSBuZXcgY2RrLlN0YWNrKGFwcCwgJ2F3cy1jZGstZWMyLXZwbicpO1xuXG5jb25zdCB2cGMgPSBuZXcgZWMyLlZwYyhzdGFjaywgJ015VnBjJywge1xuICBjaWRyOiAnMTAuMTAuMC4wLzE2JyxcbiAgdnBuQ29ubmVjdGlvbnM6IHtcbiAgICBEeW5hbWljOiB7IC8vIER5bmFtaWMgcm91dGluZ1xuICAgICAgaXA6ICc1Mi44NS4yNTUuMTY0JyxcbiAgICAgIHR1bm5lbE9wdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHByZVNoYXJlZEtleTogJ3NlY3JldGtleTEyMzQnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICB9LFxufSk7XG5cbnZwYy5hZGRWcG5Db25uZWN0aW9uKCdTdGF0aWMnLCB7IC8vIFN0YXRpYyByb3V0aW5nXG4gIGlwOiAnNTIuODUuMjU1LjE5NycsXG4gIHN0YXRpY1JvdXRlczogW1xuICAgICcxOTIuMTY4LjEwLjAvMjQnLFxuICAgICcxOTIuMTY4LjIwLjAvMjQnLFxuICBdLFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19