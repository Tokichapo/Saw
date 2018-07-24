using Amazon.CDK;
using AWS.Jsii.Runtime.Deputy;

namespace Amazon.CDK.AWS.Budgets.cloudformation.BudgetResource
{
    /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-budgets-budget-notificationwithsubscribers.html </remarks>
    [JsiiInterface(typeof(INotificationWithSubscribersProperty), "@aws-cdk/aws-budgets.cloudformation.BudgetResource.NotificationWithSubscribersProperty")]
    public interface INotificationWithSubscribersProperty
    {
        /// <summary>``BudgetResource.NotificationWithSubscribersProperty.Notification``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-budgets-budget-notificationwithsubscribers.html#cfn-budgets-budget-notificationwithsubscribers-notification </remarks>
        [JsiiProperty("notification", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-budgets.cloudformation.BudgetResource.NotificationProperty\"}]}}")]
        object Notification
        {
            get;
            set;
        }

        /// <summary>``BudgetResource.NotificationWithSubscribersProperty.Subscribers``</summary>
        /// <remarks>link: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-budgets-budget-notificationwithsubscribers.html#cfn-budgets-budget-notificationwithsubscribers-subscribers </remarks>
        [JsiiProperty("subscribers", "{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"collection\":{\"kind\":\"array\",\"elementtype\":{\"union\":{\"types\":[{\"fqn\":\"@aws-cdk/cdk.Token\"},{\"fqn\":\"@aws-cdk/aws-budgets.cloudformation.BudgetResource.SubscriberProperty\"}]}}}}]}}")]
        object Subscribers
        {
            get;
            set;
        }
    }
}