using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;
using System.Collections.Generic;

namespace Amazon.CDK.AWS.EC2.cloudformation
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-subnetcidrblock.html </remarks>
    [JsiiClass(typeof(SubnetCidrBlockResource), "@aws-cdk/aws-ec2.cloudformation.SubnetCidrBlockResource", "[{\"name\":\"parent\",\"type\":{\"fqn\":\"@aws-cdk/cdk.Construct\"}},{\"name\":\"name\",\"type\":{\"primitive\":\"string\"}},{\"name\":\"properties\",\"type\":{\"fqn\":\"@aws-cdk/aws-ec2.cloudformation.SubnetCidrBlockResourceProps\"}}]")]
    public class SubnetCidrBlockResource : Resource
    {
        public SubnetCidrBlockResource(Construct parent, string name, ISubnetCidrBlockResourceProps properties): base(new DeputyProps(new object[]{parent, name, properties}))
        {
        }

        protected SubnetCidrBlockResource(ByRefValue reference): base(reference)
        {
        }

        protected SubnetCidrBlockResource(DeputyProps props): base(props)
        {
        }

        /// <summary>The CloudFormation resource type name for this resource class.</summary>
        [JsiiProperty("resourceTypeName", "{\"primitive\":\"string\"}")]
        public static string ResourceTypeName
        {
            get;
        }

        = GetStaticProperty<string>(typeof(SubnetCidrBlockResource));
        [JsiiMethod("renderProperties", "{\"collection\":{\"kind\":\"map\",\"elementtype\":{\"primitive\":\"any\"}}}", "[]")]
        protected override IDictionary<string, object> RenderProperties()
        {
            return InvokeInstanceMethod<IDictionary<string, object>>(new object[]{});
        }
    }
}