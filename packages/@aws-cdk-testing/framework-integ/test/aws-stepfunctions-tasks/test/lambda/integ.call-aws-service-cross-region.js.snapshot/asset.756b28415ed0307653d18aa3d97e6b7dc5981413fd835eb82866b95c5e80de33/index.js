"use strict";var s=Object.defineProperty;var a=Object.getOwnPropertyDescriptor;var c=Object.getOwnPropertyNames;var m=Object.prototype.hasOwnProperty;var d=(n,e)=>{for(var r in e)s(n,r,{get:e[r],enumerable:!0})},l=(n,e,r,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of c(e))!m.call(n,o)&&o!==r&&s(n,o,{get:()=>e[o],enumerable:!(t=a(e,o))||t.enumerable});return n};var g=n=>l(s({},"__esModule",{value:!0}),n);var w={};d(w,{handler:()=>p});module.exports=g(w);function C(n){let[e,r]=Object.entries(n).find(([t])=>t.endsWith("Client")&&t!=="__Client");return r}function f(n,e){let t=`${(i=>i.charAt(0).toUpperCase()+i.slice(1))(e)}Command`,o=Object.entries(n).find(([i])=>i.toLowerCase()===t.toLowerCase())?.[1];if(!o)throw new Error(`Unable to find command named: ${t} for action: ${e} in service package ${n}`);return o}var p=async n=>{console.log("Event: ",n);try{let e=require(`@aws-sdk/client-${n.service}`),r=C(e),t=f(e,n.action),o=new r({region:n.region,endpoint:n.endpoint}),i=new t(n.parameters);return await o.send(i)}catch(e){throw console.error("Error: ",e),e}};0&&(module.exports={handler});
