"use strict";var u=Object.defineProperty;var a=Object.getOwnPropertyDescriptor;var c=Object.getOwnPropertyNames;var i=Object.prototype.hasOwnProperty;var C=(e,r)=>{for(var o in r)u(e,o,{get:r[o],enumerable:!0})},S=(e,r,o,t)=>{if(r&&typeof r=="object"||typeof r=="function")for(let n of c(r))!i.call(e,n)&&n!==o&&u(e,n,{get:()=>r[n],enumerable:!(t=a(r,n))||t.enumerable});return e};var f=e=>S(u({},"__esModule",{value:!0}),e);var l={};C(l,{CfnUtilsResourceType:()=>s,handler:()=>m});module.exports=f(l);var s=(o=>(o.CFN_JSON="Custom::AWSCDKCfnJson",o.CFN_JSON_STRINGIFY="Custom::AWSCDKCfnJsonStringify",o))(s||{});async function m(e){if(e.ResourceType==="Custom::AWSCDKCfnJson")return N(e);if(e.ResourceType==="Custom::AWSCDKCfnJsonStringify")return d(e);throw new Error(`unexpected resource type "${e.ResourceType}"`)}function N(e){return{Data:{Value:JSON.parse(e.ResourceProperties.Value)}}}function d(e){return{Data:{Value:JSON.stringify(e.ResourceProperties.Value)}}}0&&(module.exports={CfnUtilsResourceType,handler});
