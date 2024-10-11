"use strict";var c=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var u=Object.prototype.hasOwnProperty;var T=(r,e)=>{for(var t in e)c(r,t,{get:e[t],enumerable:!0})},y=(r,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of i(e))!u.call(r,o)&&o!==t&&c(r,o,{get:()=>e[o],enumerable:!(s=R(e,o))||s.enumerable});return r};var p=r=>y(c({},"__esModule",{value:!0}),r);var f={};T(f,{handler:()=>m});module.exports=p(f);var n=require("@aws-sdk/client-route-53");async function m(r){let e=r.ResourceProperties;if(r.RequestType!=="Create")return;let t=new n.Route53,o=(await t.listResourceRecordSets({HostedZoneId:e.HostedZoneId,StartRecordName:e.RecordName,StartRecordType:e.RecordType})).ResourceRecordSets?.find(a=>a.Name===e.RecordName&&a.Type===e.RecordType);if(!o)return;let d=await t.changeResourceRecordSets({HostedZoneId:e.HostedZoneId,ChangeBatch:{Changes:[{Action:"DELETE",ResourceRecordSet:g({Name:o.Name,Type:o.Type,TTL:o.TTL,AliasTarget:o.AliasTarget,ResourceRecords:o.ResourceRecords})}]}});return await(0,n.waitUntilResourceRecordSetsChanged)({client:t,maxWaitTime:890},{Id:d?.ChangeInfo?.Id}),{PhysicalResourceId:`${o.Name}-${o.Type}`}}function g(r){let e={};for(let[t,s]of Object.entries(r))s&&(!Array.isArray(s)||s.length!==0)&&(e[t]=s);return e}0&&(module.exports={handler});
