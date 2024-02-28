"use strict";var S=Object.create;var c=Object.defineProperty;var w=Object.getOwnPropertyDescriptor;var A=Object.getOwnPropertyNames;var P=Object.getPrototypeOf,L=Object.prototype.hasOwnProperty;var T=(e,t)=>{for(var o in t)c(e,o,{get:t[o],enumerable:!0})},d=(e,t,o,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of A(t))!L.call(e,r)&&r!==o&&c(e,r,{get:()=>t[r],enumerable:!(s=w(t,r))||s.enumerable});return e};var l=(e,t,o)=>(o=e!=null?S(P(e)):{},d(t||!e||!e.__esModule?c(o,"default",{value:e,enumerable:!0}):o,e)),D=e=>d(c({},"__esModule",{value:!0}),e);var W={};T(W,{autoDeleteHandler:()=>I,handler:()=>q});module.exports=D(W);var h=require("@aws-sdk/client-ecr");var m=l(require("https")),R=l(require("url")),n={sendHttpRequest:N,log:H,includeStackTraces:!0,userHandlerIndex:"./index"},p="AWSCDK::CustomResourceProviderFramework::CREATE_FAILED",b="AWSCDK::CustomResourceProviderFramework::MISSING_PHYSICAL_ID";function y(e){return async(t,o)=>{let s={...t,ResponseURL:"..."};if(n.log(JSON.stringify(s,void 0,2)),t.RequestType==="Delete"&&t.PhysicalResourceId===p){n.log("ignoring DELETE event caused by a failed CREATE event"),await u("SUCCESS",t);return}try{let r=await e(s,o),a=x(t,r);await u("SUCCESS",a)}catch(r){let a={...t,Reason:n.includeStackTraces?r.stack:r.message};a.PhysicalResourceId||(t.RequestType==="Create"?(n.log("CREATE failed, responding with a marker physical resource id so that the subsequent DELETE will be ignored"),a.PhysicalResourceId=p):n.log(`ERROR: Malformed event. "PhysicalResourceId" is required: ${JSON.stringify(t)}`)),await u("FAILED",a)}}}function x(e,t={}){let o=t.PhysicalResourceId??e.PhysicalResourceId??e.RequestId;if(e.RequestType==="Delete"&&o!==e.PhysicalResourceId)throw new Error(`DELETE: cannot change the physical resource ID from "${e.PhysicalResourceId}" to "${t.PhysicalResourceId}" during deletion`);return{...e,...t,PhysicalResourceId:o}}async function u(e,t){let o={Status:e,Reason:t.Reason??e,StackId:t.StackId,RequestId:t.RequestId,PhysicalResourceId:t.PhysicalResourceId||b,LogicalResourceId:t.LogicalResourceId,NoEcho:t.NoEcho,Data:t.Data},s=R.parse(t.ResponseURL),r=`${s.protocol}//${s.hostname}/${s.pathname}?***`;n.log("submit response to cloudformation",r,o);let a=JSON.stringify(o),C={hostname:s.hostname,path:s.path,method:"PUT",headers:{"content-type":"","content-length":Buffer.byteLength(a,"utf8")}};await F({attempts:5,sleep:1e3},n.sendHttpRequest)(C,a)}async function N(e,t){return new Promise((o,s)=>{try{let r=m.request(e,a=>{a.resume(),!a.statusCode||a.statusCode>=400?s(new Error(`Unsuccessful HTTP response: ${a.statusCode}`)):o()});r.on("error",s),r.write(t),r.end()}catch(r){s(r)}})}function H(e,...t){console.log(e,...t)}function F(e,t){return async(...o)=>{let s=e.attempts,r=e.sleep;for(;;)try{return await t(...o)}catch(a){if(s--<=0)throw a;await k(Math.floor(Math.random()*r)),r*=2}}}async function k(e){return new Promise(t=>setTimeout(t,e))}var g="aws-cdk:auto-delete-images",i=new h.ECR({}),q=y(I);async function I(e){switch(e.RequestType){case"Create":break;case"Update":return U(e);case"Delete":return E(e.ResourceProperties?.RepositoryName)}}async function U(e){let t=e,o=t.OldResourceProperties?.RepositoryName,s=t.ResourceProperties?.RepositoryName;if(s&&o&&s!==o)return E(o)}async function f(e){let t=await i.listImages(e),o=[],s=[];(t.imageIds??[]).forEach(a=>{"imageTag"in a?s.push(a):o.push(a)});let r=t.nextToken??null;o.length===0&&s.length===0||(s.length!==0&&await i.batchDeleteImage({repositoryName:e.repositoryName,imageIds:s}),o.length!==0&&await i.batchDeleteImage({repositoryName:e.repositoryName,imageIds:o}),r&&await f({...e,nextToken:r}))}async function E(e){if(!e)throw new Error("No RepositoryName was provided.");let o=(await i.describeRepositories({repositoryNames:[e]})).repositories?.find(s=>s.repositoryName===e);if(!await _(o?.repositoryArn)){process.stdout.write(`Repository does not have '${g}' tag, skipping cleaning.
`);return}try{await f({repositoryName:e})}catch(s){if(s.name!=="RepositoryNotFoundException")throw s}}async function _(e){return(await i.listTagsForResource({resourceArn:e})).tags?.some(o=>o.Key===g&&o.Value==="true")}0&&(module.exports={autoDeleteHandler,handler});
