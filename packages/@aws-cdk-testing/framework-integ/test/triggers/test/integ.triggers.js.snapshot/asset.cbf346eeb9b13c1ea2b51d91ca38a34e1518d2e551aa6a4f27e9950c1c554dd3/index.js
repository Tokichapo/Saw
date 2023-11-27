"use strict";var a=Object.defineProperty;var f=Object.getOwnPropertyDescriptor;var w=Object.getOwnPropertyNames;var y=Object.prototype.hasOwnProperty;var h=(e,o)=>{for(var r in o)a(e,r,{get:o[r],enumerable:!0})},R=(e,o,r,t)=>{if(o&&typeof o=="object"||typeof o=="function")for(let n of w(o))!y.call(e,n)&&n!==r&&a(e,n,{get:()=>o[n],enumerable:!(t=f(o,n))||t.enumerable});return e};var T=e=>R(a({},"__esModule",{value:!0}),e);var k={};h(k,{handler:()=>P,invoke:()=>p});module.exports=T(k);var l=require("@aws-sdk/client-lambda"),d=require("@aws-sdk/node-http-handler"),E=e=>{if(e)return new TextDecoder().decode(Buffer.from(e))},p=async(e,o,r)=>{let t=new l.Lambda({requestHandler:new d.NodeHttpHandler({socketTimeout:r})}),n={FunctionName:e,InvocationType:o};console.log({invokeRequest:n});let s=0,m=5e3,i;for(;;)try{i=await t.invoke(n);break}catch(u){if(u.name==="AccessDeniedException"&&s<12){s++,await new Promise(g=>{setTimeout(g,m)});continue}throw u}let c={...i,Payload:E(i.Payload)};return console.log({invokeResponse:c}),c};async function P(e){if(console.log({...e,ResponseURL:"..."}),e.RequestType==="Delete"){console.log("not calling trigger on DELETE");return}if(e.RequestType==="Update"&&e.ResourceProperties.ExecuteOnHandlerChange==="false"){console.log("not calling trigger because ExecuteOnHandlerChange is false");return}let o=e.ResourceProperties.HandlerArn;if(!o)throw new Error('The "HandlerArn" property is required');let r=e.ResourceProperties.InvocationType,t=e.ResourceProperties.Timeout,n=parseInt(t);if(isNaN(n))throw new Error(`The "Timeout" property with value ${t} is not parsable to a number`);let s=await p(o,r,n);if(s.StatusCode&&s.StatusCode>=400)throw new Error(`Trigger handler failed with status code ${s.StatusCode}`);if(s.FunctionError)throw new Error(v(s.Payload))}function v(e){if(!e)return"unknown handler error";console.log(`Error payload: ${e}`);try{let o=JSON.parse(e),r=[o.errorMessage,o.trace].filter(t=>t).join(`
`);return r.length>0?r:e}catch{return e}}0&&(module.exports={handler,invoke});
