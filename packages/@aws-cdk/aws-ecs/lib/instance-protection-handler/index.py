import boto3, os

client = boto3.client('autoscaling')

def on_event(event, context):
  print(event)
  request_type = event['RequestType']
  if request_type == 'Create': return on_create(event)
  if request_type == 'Update': return on_update(event)
  if request_type == 'Delete': return on_delete(event)
  raise Exception("Invalid request type: %s" % request_type)


def on_create(event):
  asg_name = os.environ['autoscaling_group_name']
  client.update_auto_scaling_group(
      AutoScalingGroupName=asg_name,
      NewInstancesProtectedFromScaleIn=True 
  )
  response = client.describe_auto_scaling_groups(
      AutoScalingGroupNames=[
          asg_name,
      ],
      MaxRecords=1
  )
  asg_arn = response['AutoScalingGroups'][0]['AutoScalingGroupARN']
  instances = response['AutoScalingGroups'][0]['Instances']
  instanceIds = [ i['InstanceId'] for i in instances if 'InstanceId' in i and i['ProtectedFromScaleIn']==False ]
  if len(instanceIds) > 0:
    client.set_instance_protection(
        AutoScalingGroupName=asg_name,
        InstanceIds=instanceIds,
        ProtectedFromScaleIn=True,
    )
  return { 'PhysicalResourceId': asg_name, 'Data': { 'AutoScalingGroupARN': asg_arn } }

def on_update(event):
  return on_create(event)

def on_delete(event):
  props = event['ResourceProperties']
  # remove_scale_in_protection_on_delete = props['RemoveScaleInProtectionOnDelete'] is 'true'
  # remote scal-in protection for new instances and existing ones
  asg_name = os.environ['autoscaling_group_name']
  client.update_auto_scaling_group(
    AutoScalingGroupName=asg_name,
    NewInstancesProtectedFromScaleIn=False 
  )
  response = client.describe_auto_scaling_groups(
      AutoScalingGroupNames=[
          asg_name,
      ],
      MaxRecords=1
  )

  asg_arn = response['AutoScalingGroups'][0]['AutoScalingGroupARN']
  instances = response['AutoScalingGroups'][0]['Instances']
  instanceIds = [ i['InstanceId'] for i in instances if 'InstanceId' in i and i['ProtectedFromScaleIn']==True ]
  if len(instanceIds) > 0:
    client.set_instance_protection(
      AutoScalingGroupName=asg_name,
      InstanceIds=instanceIds,
      ProtectedFromScaleIn=False,
    ) 
  return { 'PhysicalResourceId': asg_name, 'Data': { 'AutoScalingGroupARN': asg_arn } }
