"use strict";var a=Object.defineProperty;var Z=Object.getOwnPropertyDescriptor;var N=Object.getOwnPropertyNames;var P=Object.prototype.hasOwnProperty;var h=(o,e)=>{for(var r in e)a(o,r,{get:e[r],enumerable:!0})},E=(o,e,r,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of N(e))!P.call(o,n)&&n!==r&&a(o,n,{get:()=>e[n],enumerable:!(t=Z(e,n))||t.enumerable});return o};var A=o=>E(a({},"__esModule",{value:!0}),o);var v={};h(v,{handler:()=>D});module.exports=A(v);var c=require("@aws-sdk/client-route-53"),u=require("@aws-sdk/credential-providers");async function D(o){let e=o.ResourceProperties;switch(o.RequestType){case"Create":return s(e,!1);case"Update":return w(e,o.OldResourceProperties);case"Delete":return s(e,!0)}}async function w(o,e){e&&o.DelegatedZoneName!==e.DelegatedZoneName&&await s(e,!0),await s(o,!1)}async function s(o,e){let{AssumeRoleArn:r,ParentZoneId:t,ParentZoneName:n,DelegatedZoneName:m,DelegatedZoneNameServers:d,TTL:g,AssumeRoleRegion:R}=o;if(!t&&!n)throw Error("One of ParentZoneId or ParentZoneName must be specified");let l=new Date().getTime(),i=new c.Route53({credentials:(0,u.fromTemporaryCredentials)({clientConfig:{region:R??T(process.env.AWS_REGION??process.env.AWS_DEFAULT_REGION??"")},params:{RoleArn:r,RoleSessionName:`cross-account-zone-delegation-${l}`}})}),p=t??await S(n,i);await i.changeResourceRecordSets({HostedZoneId:p,ChangeBatch:{Changes:[{Action:e?"DELETE":"UPSERT",ResourceRecordSet:{Name:m,Type:"NS",TTL:g,ResourceRecords:d.map(f=>({Value:f}))}}]}})}async function S(o,e){let t=(await e.listHostedZonesByName({DNSName:o})).HostedZones?.filter(n=>n.Name===`${o}.`)??[];if(t&&t.length!==1)throw Error(`Expected one hosted zone to match the given name but found ${t.length}`);return t[0].Id}function T(o){let e={cn:"cn-northwest-1","us-gov":"us-gov-west-1","us-iso":"us-iso-east-1","us-isob":"us-isob-east-1"};for(let[r,t]of Object.entries(e))if(o.startsWith(`${r}-`))return t;return"us-east-1"}0&&(module.exports={handler});
