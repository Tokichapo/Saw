using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.SES.cloudformation.ConfigurationSetEventDestinationResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ses-configurationseteventdestination-eventdestination.html </remarks>
    public class EventDestinationProperty : DeputyBase, IEventDestinationProperty
    {
        /// <summary>``ConfigurationSetEventDestinationResource.EventDestinationProperty.CloudWatchDestination``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ses-configurationseteventdestination-eventdestination.html#cfn-ses-configurationseteventdestination-eventdestination-cloudwatchdestination </remarks>
        [JsiiProperty("cloudWatchDestination", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-ses.cloudformation.ConfigurationSetEventDestinationResource.CloudWatchDestinationProperty\"}]},\"optional\":true}", true)]
        public object CloudWatchDestination
        {
            get;
            set;
        }

        /// <summary>``ConfigurationSetEventDestinationResource.EventDestinationProperty.Enabled``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ses-configurationseteventdestination-eventdestination.html#cfn-ses-configurationseteventdestination-eventdestination-enabled </remarks>
        [JsiiProperty("enabled", "{\"union\":{\"types\":[{\"primitive\":\"boolean\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object Enabled
        {
            get;
            set;
        }

        /// <summary>``ConfigurationSetEventDestinationResource.EventDestinationProperty.KinesisFirehoseDestination``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ses-configurationseteventdestination-eventdestination.html#cfn-ses-configurationseteventdestination-eventdestination-kinesisfirehosedestination </remarks>
        [JsiiProperty("kinesisFirehoseDestination", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-ses.cloudformation.ConfigurationSetEventDestinationResource.KinesisFirehoseDestinationProperty\"}]},\"optional\":true}", true)]
        public object KinesisFirehoseDestination
        {
            get;
            set;
        }

        /// <summary>``ConfigurationSetEventDestinationResource.EventDestinationProperty.MatchingEventTypes``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ses-configurationseteventdestination-eventdestination.html#cfn-ses-configurationseteventdestination-eventdestination-matchingeventtypes </remarks>
        [JsiiProperty("matchingEventTypes", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]}}}}]}}", true)]
        public object MatchingEventTypes
        {
            get;
            set;
        }

        /// <summary>``ConfigurationSetEventDestinationResource.EventDestinationProperty.Name``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ses-configurationseteventdestination-eventdestination.html#cfn-ses-configurationseteventdestination-eventdestination-name </remarks>
        [JsiiProperty("name", "{\"union\":{\"types\":[{\"primitive\":\"string\"},{\"fqn\":\"@aws-cdk/cdk.Token\"}]},\"optional\":true}", true)]
        public object Name
        {
            get;
            set;
        }
    }
}