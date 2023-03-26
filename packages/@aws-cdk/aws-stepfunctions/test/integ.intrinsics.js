"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const integ_tests_1 = require("@aws-cdk/integ-tests");
const lib_1 = require("../lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-stepfunctions-intrinsics-integ');
const pass = new lib_1.Pass(stack, 'pass', {
    parameters: {
        array1: lib_1.JsonPath.array('asdf', lib_1.JsonPath.stringAt('$.Id')),
        arrayPartition1: lib_1.JsonPath.arrayPartition(lib_1.JsonPath.listAt('$.inputArray'), 4),
        arrayPartition2: lib_1.JsonPath.arrayPartition(lib_1.JsonPath.listAt('$.inputArray'), lib_1.JsonPath.numberAt('$.chunkSize')),
        arrayContains1: lib_1.JsonPath.arrayContains(lib_1.JsonPath.listAt('$.inputArray'), 5),
        arrayContains2: lib_1.JsonPath.arrayContains(lib_1.JsonPath.listAt('$.inputArray'), 'a'),
        arrayContains3: lib_1.JsonPath.arrayContains(lib_1.JsonPath.listAt('$.inputArray'), lib_1.JsonPath.numberAt('$.lookingFor')),
        arrayRange1: lib_1.JsonPath.arrayRange(1, 9, 2),
        arrayRange2: lib_1.JsonPath.arrayRange(lib_1.JsonPath.numberAt('$.start'), lib_1.JsonPath.numberAt('$.end'), lib_1.JsonPath.numberAt('$.step')),
        arrayGetItem1: lib_1.JsonPath.arrayGetItem(lib_1.JsonPath.listAt('$.inputArray'), 5),
        arrayGetItem2: lib_1.JsonPath.arrayGetItem(lib_1.JsonPath.numberAt('$.inputArray'), lib_1.JsonPath.numberAt('$.index')),
        arrayLength1: lib_1.JsonPath.arrayLength(lib_1.JsonPath.listAt('$.inputArray')),
        arrayUnique1: lib_1.JsonPath.arrayUnique(lib_1.JsonPath.listAt('$.inputArray')),
        base64Encode1: lib_1.JsonPath.base64Encode('Data to encode'),
        base64Encode2: lib_1.JsonPath.base64Encode(lib_1.JsonPath.stringAt('$.input')),
        base64Decode1: lib_1.JsonPath.base64Decode('RGF0YSB0byBlbmNvZGU='),
        base64Decode2: lib_1.JsonPath.base64Decode(lib_1.JsonPath.stringAt('$.base64')),
        hash1: lib_1.JsonPath.hash('Input data', 'SHA-1'),
        hash2: lib_1.JsonPath.hash(lib_1.JsonPath.objectAt('$.Data'), lib_1.JsonPath.stringAt('$.Algorithm')),
        jsonMerge1: lib_1.JsonPath.jsonMerge(lib_1.JsonPath.objectAt('$.Obj1'), lib_1.JsonPath.objectAt('$.Obj2')),
        mathRandom1: lib_1.JsonPath.mathRandom(1, 999),
        mathRandom2: lib_1.JsonPath.mathRandom(lib_1.JsonPath.numberAt('$.start'), lib_1.JsonPath.numberAt('$.end')),
        mathAdd1: lib_1.JsonPath.mathAdd(1, 999),
        mathAdd2: lib_1.JsonPath.mathAdd(lib_1.JsonPath.numberAt('$.value1'), lib_1.JsonPath.numberAt('$.step')),
        stringSplit1: lib_1.JsonPath.stringSplit('1,2,3,4,5', ','),
        stringSplit2: lib_1.JsonPath.stringSplit(lib_1.JsonPath.stringAt('$.inputString'), lib_1.JsonPath.stringAt('$.splitter')),
        uuid: lib_1.JsonPath.uuid(),
        format1: lib_1.JsonPath.format('Hi my name is {}.', lib_1.JsonPath.stringAt('$.Name')),
        format2: lib_1.JsonPath.format(lib_1.JsonPath.stringAt('$.Format'), lib_1.JsonPath.stringAt('$.Name')),
        stringToJson1: lib_1.JsonPath.stringToJson(lib_1.JsonPath.stringAt('$.Str')),
        jsonToString1: lib_1.JsonPath.jsonToString(lib_1.JsonPath.objectAt('$.Obj')),
    },
});
const stateMachine = new lib_1.StateMachine(stack, 'StateMachine', {
    definition: pass,
});
const integ = new integ_tests_1.IntegTest(app, 'StateMachineIntrinsicsTest', {
    testCases: [stack],
});
integ.assertions.awsApiCall('StepFunctions', 'describeStateMachine', {
    stateMachineArn: stateMachine.stateMachineArn,
}).expect(integ_tests_1.ExpectedResult.objectLike({
    status: 'ACTIVE',
}));
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuaW50cmluc2ljcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludGVnLmludHJpbnNpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQWlFO0FBQ2pFLGdDQUFzRDtBQUV0RCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7QUFFdkUsTUFBTSxJQUFJLEdBQUcsSUFBSSxVQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtJQUNuQyxVQUFVLEVBQUU7UUFDVixNQUFNLEVBQUUsY0FBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsY0FBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RCxlQUFlLEVBQUUsY0FBUSxDQUFDLGNBQWMsQ0FBQyxjQUFRLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1RSxlQUFlLEVBQUUsY0FBUSxDQUFDLGNBQWMsQ0FBQyxjQUFRLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLGNBQVEsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDM0csY0FBYyxFQUFFLGNBQVEsQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUUsY0FBYyxFQUFFLGNBQVEsQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHLENBQUM7UUFDNUUsY0FBYyxFQUFFLGNBQVEsQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxjQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzFHLFdBQVcsRUFB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Q0FBQyxDQUFDO1FBQ2hFLGFBQWEsRUFBRSxjQUFRLENBQUMsWUFBWSxDQUFDLGNBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDakU7Q0FDRixDQUFDLENBQUM7QUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLGtCQUFZLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRTtJQUMzRCxVQUFVLEVBQUUsSUFBSTtDQUNqQixDQUFDLENBQUM7QUFFSCxNQUFNLEtBQUssR0FBRyxJQUFJLHVCQUFTLENBQUMsR0FBRyxFQUFFLDRCQUE0QixFQUFFO0lBQzdELFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQztDQUNuQixDQUFDLENBQUM7QUFDSCxLQUFLLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsc0JBQXNCLEVBQUU7SUFDbkUsZUFBZSxFQUFFLFlBQVksQ0FBQyxlQUFlO0NBQzlDLENBQUMsQ0FBQyxNQUFNLENBQUMsNEJBQWMsQ0FBQyxVQUFVLENBQUM7SUFDbEMsTUFBTSxFQUFFLFFBQVE7Q0FDakIsQ0FBQyxDQUFDLENBQUM7QUFFSixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgeyBJbnRlZ1Rlc3QsIEV4cGVjdGVkUmVzdWx0IH0gZnJvbSAnQGF3cy1jZGsvaW50ZWctdGVzdHMnO1xuaW1wb3J0IHsgSnNvblBhdGgsIFBhc3MsIFN0YXRlTWFjaGluZSB9IGZyb20gJy4uL2xpYic7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnYXdzLXN0ZXBmdW5jdGlvbnMtaW50cmluc2ljcy1pbnRlZycpO1xuXG5jb25zdCBwYXNzID0gbmV3IFBhc3Moc3RhY2ssICdwYXNzJywge1xuICBwYXJhbWV0ZXJzOiB7XG4gICAgYXJyYXkxOiBKc29uUGF0aC5hcnJheSgnYXNkZicsIEpzb25QYXRoLnN0cmluZ0F0KCckLklkJykpLFxuICAgIGFycmF5UGFydGl0aW9uMTogSnNvblBhdGguYXJyYXlQYXJ0aXRpb24oSnNvblBhdGgubGlzdEF0KCckLmlucHV0QXJyYXknKSwgNCksXG4gICAgYXJyYXlQYXJ0aXRpb24yOiBKc29uUGF0aC5hcnJheVBhcnRpdGlvbihKc29uUGF0aC5saXN0QXQoJyQuaW5wdXRBcnJheScpLCBKc29uUGF0aC5udW1iZXJBdCgnJC5jaHVua1NpemUnKSksXG4gICAgYXJyYXlDb250YWluczE6IEpzb25QYXRoLmFycmF5Q29udGFpbnMoSnNvblBhdGgubGlzdEF0KCckLmlucHV0QXJyYXknKSwgNSksXG4gICAgYXJyYXlDb250YWluczI6IEpzb25QYXRoLmFycmF5Q29udGFpbnMoSnNvblBhdGgubGlzdEF0KCckLmlucHV0QXJyYXknKSwgJ2EnKSxcbiAgICBhcnJheUNvbnRhaW5zMzogSnNvblBhdGguYXJyYXlDb250YWlucyhKc29uUGF0aC5saXN0QXQoJyQuaW5wdXRBcnJheScpLCBKc29uUGF0aC5udW1iZXJBdCgnJC5sb29raW5nRm9yJykpLFxuICAgIGFycmF5UmFuZ2UxOiBKc29uUGF0aC5hcnJheVJhbmdlKDEsIDksIDIpLFxuICAgIGFycmF5UmFuZ2UyOiBKc29uUGF0aC5hcnJheVJhbmdlKEpzb25QYXRoLm51bWJlckF0KCckLnN0YXJ0JyksIEpzb25QYXRoLm51bWJlckF0KCckLmVuZCcpLCBKc29uUGF0aC5udW1iZXJBdCgnJC5zdGVwJykpLFxuICAgIGFycmF5R2V0SXRlbTE6IEpzb25QYXRoLmFycmF5R2V0SXRlbShKc29uUGF0aC5saXN0QXQoJyQuaW5wdXRBcnJheScpLCA1KSxcbiAgICBhcnJheUdldEl0ZW0yOiBKc29uUGF0aC5hcnJheUdldEl0ZW0oSnNvblBhdGgubnVtYmVyQXQoJyQuaW5wdXRBcnJheScpLCBKc29uUGF0aC5udW1iZXJBdCgnJC5pbmRleCcpKSxcbiAgICBhcnJheUxlbmd0aDE6IEpzb25QYXRoLmFycmF5TGVuZ3RoKEpzb25QYXRoLmxpc3RBdCgnJC5pbnB1dEFycmF5JykpLFxuICAgIGFycmF5VW5pcXVlMTogSnNvblBhdGguYXJyYXlVbmlxdWUoSnNvblBhdGgubGlzdEF0KCckLmlucHV0QXJyYXknKSksXG4gICAgYmFzZTY0RW5jb2RlMTogSnNvblBhdGguYmFzZTY0RW5jb2RlKCdEYXRhIHRvIGVuY29kZScpLFxuICAgIGJhc2U2NEVuY29kZTI6IEpzb25QYXRoLmJhc2U2NEVuY29kZShKc29uUGF0aC5zdHJpbmdBdCgnJC5pbnB1dCcpKSxcbiAgICBiYXNlNjREZWNvZGUxOiBKc29uUGF0aC5iYXNlNjREZWNvZGUoJ1JHRjBZU0IwYnlCbGJtTnZaR1U9JyksXG4gICAgYmFzZTY0RGVjb2RlMjogSnNvblBhdGguYmFzZTY0RGVjb2RlKEpzb25QYXRoLnN0cmluZ0F0KCckLmJhc2U2NCcpKSxcbiAgICBoYXNoMTogSnNvblBhdGguaGFzaCgnSW5wdXQgZGF0YScsICdTSEEtMScpLFxuICAgIGhhc2gyOiBKc29uUGF0aC5oYXNoKEpzb25QYXRoLm9iamVjdEF0KCckLkRhdGEnKSwgSnNvblBhdGguc3RyaW5nQXQoJyQuQWxnb3JpdGhtJykpLFxuICAgIGpzb25NZXJnZTE6IEpzb25QYXRoLmpzb25NZXJnZShKc29uUGF0aC5vYmplY3RBdCgnJC5PYmoxJyksIEpzb25QYXRoLm9iamVjdEF0KCckLk9iajInKSksXG4gICAgbWF0aFJhbmRvbTE6IEpzb25QYXRoLm1hdGhSYW5kb20oMSwgOTk5KSxcbiAgICBtYXRoUmFuZG9tMjogSnNvblBhdGgubWF0aFJhbmRvbShKc29uUGF0aC5udW1iZXJBdCgnJC5zdGFydCcpLCBKc29uUGF0aC5udW1iZXJBdCgnJC5lbmQnKSksXG4gICAgbWF0aEFkZDE6IEpzb25QYXRoLm1hdGhBZGQoMSwgOTk5KSxcbiAgICBtYXRoQWRkMjogSnNvblBhdGgubWF0aEFkZChKc29uUGF0aC5udW1iZXJBdCgnJC52YWx1ZTEnKSwgSnNvblBhdGgubnVtYmVyQXQoJyQuc3RlcCcpKSxcbiAgICBzdHJpbmdTcGxpdDE6IEpzb25QYXRoLnN0cmluZ1NwbGl0KCcxLDIsMyw0LDUnLCAnLCcpLFxuICAgIHN0cmluZ1NwbGl0MjogSnNvblBhdGguc3RyaW5nU3BsaXQoSnNvblBhdGguc3RyaW5nQXQoJyQuaW5wdXRTdHJpbmcnKSwgSnNvblBhdGguc3RyaW5nQXQoJyQuc3BsaXR0ZXInKSksXG4gICAgdXVpZDogSnNvblBhdGgudXVpZCgpLFxuICAgIGZvcm1hdDE6IEpzb25QYXRoLmZvcm1hdCgnSGkgbXkgbmFtZSBpcyB7fS4nLCBKc29uUGF0aC5zdHJpbmdBdCgnJC5OYW1lJykpLFxuICAgIGZvcm1hdDI6IEpzb25QYXRoLmZvcm1hdChKc29uUGF0aC5zdHJpbmdBdCgnJC5Gb3JtYXQnKSwgSnNvblBhdGguc3RyaW5nQXQoJyQuTmFtZScpKSxcbiAgICBzdHJpbmdUb0pzb24xOiBKc29uUGF0aC5zdHJpbmdUb0pzb24oSnNvblBhdGguc3RyaW5nQXQoJyQuU3RyJykpLFxuICAgIGpzb25Ub1N0cmluZzE6IEpzb25QYXRoLmpzb25Ub1N0cmluZyhKc29uUGF0aC5vYmplY3RBdCgnJC5PYmonKSksXG4gIH0sXG59KTtcblxuY29uc3Qgc3RhdGVNYWNoaW5lID0gbmV3IFN0YXRlTWFjaGluZShzdGFjaywgJ1N0YXRlTWFjaGluZScsIHtcbiAgZGVmaW5pdGlvbjogcGFzcyxcbn0pO1xuXG5jb25zdCBpbnRlZyA9IG5ldyBJbnRlZ1Rlc3QoYXBwLCAnU3RhdGVNYWNoaW5lSW50cmluc2ljc1Rlc3QnLCB7XG4gIHRlc3RDYXNlczogW3N0YWNrXSxcbn0pO1xuaW50ZWcuYXNzZXJ0aW9ucy5hd3NBcGlDYWxsKCdTdGVwRnVuY3Rpb25zJywgJ2Rlc2NyaWJlU3RhdGVNYWNoaW5lJywge1xuICBzdGF0ZU1hY2hpbmVBcm46IHN0YXRlTWFjaGluZS5zdGF0ZU1hY2hpbmVBcm4sXG59KS5leHBlY3QoRXhwZWN0ZWRSZXN1bHQub2JqZWN0TGlrZSh7XG4gIHN0YXR1czogJ0FDVElWRScsXG59KSk7XG5cbmFwcC5zeW50aCgpO1xuIl19