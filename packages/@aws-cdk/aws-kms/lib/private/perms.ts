// https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html

export const ADMIN_ACTIONS = [
  'kms:Create*',
  'kms:Describe*',
  'kms:Enable*',
  'kms:List*',
  'kms:Put*',
  'kms:Update*',
  'kms:Revoke*',
  'kms:Disable*',
  'kms:Get*',
  'kms:Delete*',
  'kms:TagResource',
  'kms:UntagResource',
  'kms:ScheduleKeyDeletion',
  'kms:CancelKeyDeletion',
];

export const ENCRYPT_ACTIONS = [
  'kms:Encrypt',
  'kms:ReEncrypt*',
  'kms:GenerateDataKey*',
  'kms:GenerateMac',
];

export const ENCRYPT_ACTIONS_HMAC = [
  'kms:GenerateMac',
];

export const DECRYPT_ACTIONS = [
  'kms:Decrypt',
  'kms:VerifyMac',
];

export const DECRYPT_ACTIONS_HMAC = [
  'kms:VerifyMac',
];
