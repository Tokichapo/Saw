// package com.myorg;

// import software.amazon.awscdk.core.App;
// import software.amazon.awscdk.assertions.Template;
// import java.io.IOException;

// import java.util.Map;

// import org.junit.jupiter.api.Test;

// example test. To run these tests, uncomment this file, along with the
// example resource in java/src/main/java/com/myorg/%name.PascalCased%Stack.java
// public class %name.PascalCased%Test {

//     @Test
//     public void testStack() throws IOException {
//         App app = new App();
//         %name.PascalCased%Stack stack = new %name.PascalCased%Stack(app, "test");

//         Template template = Template.fromStack(stack);

//         Map<String, Object> expected = Map.of(
//          "VisibilityTimeout", 300);

//         template.hasResourceProperties("AWS::SQS::Queue", expected);
//     }
// }
