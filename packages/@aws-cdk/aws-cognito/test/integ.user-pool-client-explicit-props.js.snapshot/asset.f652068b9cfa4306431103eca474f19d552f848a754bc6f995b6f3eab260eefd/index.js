"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.PHYSICAL_RESOURCE_ID_REFERENCE = void 0;
var shared_1 = require("./shared");
Object.defineProperty(exports, "PHYSICAL_RESOURCE_ID_REFERENCE", { enumerable: true, get: function () { return shared_1.PHYSICAL_RESOURCE_ID_REFERENCE; } });
const runtime = process.env.AWS_EXECUTION_ENV?.split('AWS_Lambda_')[1];
// eslint-disable-next-line @typescript-eslint/no-require-imports
const runtimeModule = runtime && runtime >= 'nodejs18.x' ? require('./aws-sdk-v3-handler') : require('./aws-sdk-v2-handler');
exports.handler = runtimeModule.handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBMEQ7QUFBakQsd0hBQUEsOEJBQThCLE9BQUE7QUFFdkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkUsaUVBQWlFO0FBQ2pFLE1BQU0sYUFBYSxHQUFHLE9BQU8sSUFBSSxPQUFPLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDaEgsUUFBQSxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IFBIWVNJQ0FMX1JFU09VUkNFX0lEX1JFRkVSRU5DRSB9IGZyb20gJy4vc2hhcmVkJztcblxuY29uc3QgcnVudGltZSA9IHByb2Nlc3MuZW52LkFXU19FWEVDVVRJT05fRU5WPy5zcGxpdCgnQVdTX0xhbWJkYV8nKVsxXTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVxdWlyZS1pbXBvcnRzXG5jb25zdCBydW50aW1lTW9kdWxlID0gcnVudGltZSAmJiBydW50aW1lID49ICdub2RlanMxOC54JyA/IHJlcXVpcmUoJy4vYXdzLXNkay12My1oYW5kbGVyJykgOiByZXF1aXJlKCcuL2F3cy1zZGstdjItaGFuZGxlcicpO1xuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBydW50aW1lTW9kdWxlLmhhbmRsZXI7XG4iXX0=