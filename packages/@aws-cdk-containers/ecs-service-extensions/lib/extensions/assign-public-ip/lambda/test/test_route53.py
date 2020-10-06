import unittest
import unittest.mock as mock

from botocore.exceptions import ClientError

from lib.route53 import Route53RecordSetLocator, Route53RecordSetAccessor, exponential_backoff, retry_with_backoff, \
    map_ips_to_resource_records


class TestRoute53(unittest.TestCase):
    def get_route53_client_mock(self):
        route53_client = mock.Mock()
        record_set_value = None

        route53_client.list_resource_record_sets = mock.Mock(
            side_effect=lambda **kwargs:
            {'ResourceRecordSets': [record_set_value] if record_set_value is not None else []})

        def change_resource_record_sets(HostedZoneId, ChangeBatch):
            nonlocal record_set_value
            change = ChangeBatch['Changes'][0]
            change_action = change['Action']

            if change_action == 'UPSERT':
                record_set_value = change['ResourceRecordSet']
            elif change_action == 'DELETE':
                record_set_value = None

        route53_client.change_resource_record_sets = mock.Mock(side_effect=change_resource_record_sets)

        return route53_client

    def test_creating_records(self):
        # GIVEN
        route53_client = self.get_route53_client_mock()
        locator = Route53RecordSetLocator(hosted_zone_id='foo', record_name='foo.myexample.com')
        merger = Route53RecordSetAccessor(route53_client)

        # WHEN
        merger.update(locator, ipv4s={'1.1.1.1'})

        # THEN
        route53_client.change_resource_record_sets.assert_called_with(
            HostedZoneId='foo', ChangeBatch={
                'Comment':
                'Automatic',
                'Changes': [{
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'foo.myexample.com',
                        'Type': 'A',
                        'ResourceRecords': [
                            {
                                'Value': '1.1.1.1'
                            },
                        ],
                        'TTL': 60
                    }
                }]
            })

    def test_creating_empty_records(self):
        # GIVEN
        route53_client = self.get_route53_client_mock()
        locator = Route53RecordSetLocator(hosted_zone_id='foo', record_name='foo.myexample.com')
        merger = Route53RecordSetAccessor(route53_client)

        # WHEN
        merger.update(locator, ipv4s=set())

        # THEN
        route53_client.change_resource_record_sets.assert_not_called()

    def test_deleting_records(self):
        # GIVEN
        route53_client = self.get_route53_client_mock()
        locator = Route53RecordSetLocator(hosted_zone_id='foo', record_name='foo.myexample.com')
        record_set = Route53RecordSetAccessor(route53_client)

        # Set up the mock with a record.
        record_set.update(locator, ipv4s={'1.1.1.1'})

        # WHEN
        record_set.update(locator, ipv4s=set())

        # THEN
        route53_client.change_resource_record_sets.assert_called_with(
            HostedZoneId='foo', ChangeBatch={
                'Comment':
                'Automatic',
                'Changes': [{
                    'Action': 'DELETE',
                    'ResourceRecordSet': {
                        'Name': 'foo.myexample.com',
                        'Type': 'A',
                        'ResourceRecords': [
                            {
                                'Value': '1.1.1.1'
                            },
                        ],
                        'TTL': 60
                    }
                }]
            })

    def test_exponential_backoff(self):
        self.assertEqual(exponential_backoff(0), 1)
        self.assertEqual(exponential_backoff(1), 2)
        self.assertEqual(exponential_backoff(2), 4)

    def test_retry_with_backoff_throttling(self):
        call = mock.Mock(side_effect=ClientError(error_response={'Error': {
            'Code': 'Throttling'
        }}, operation_name='any'))
        retry_with_backoff(call, attempts=5, backoff=lambda x: 0)
        self.assertEqual(call.call_count, 5)

    def test_retry_with_backoff_other_client_errors(self):
        call = mock.Mock(side_effect=ClientError(error_response={'Error': {
            'Code': 'SomethingElse'
        }}, operation_name='any'))
        with self.assertRaisesRegex(ClientError, r'SomethingElse'):
            retry_with_backoff(call, attempts=5, backoff=lambda x: 0)
        self.assertEqual(call.call_count, 1)

    def test_retry_with_backoff_other_errors(self):
        call = mock.Mock(side_effect=Exception('very good reason'))
        with self.assertRaisesRegex(Exception, r'very good reason'):
            retry_with_backoff(call, attempts=5, backoff=lambda x: 0)
        self.assertEqual(call.call_count, 1)

    def test_map_ips_to_resource_records(self):
        output = map_ips_to_resource_records({'1.1.1.1', '1.1.1.2'})
        self.assertEqual(output, [{'Value': '1.1.1.1'}, {'Value': '1.1.1.2'}])

    def test_map_ips_to_resource_records_truncates_to_400(self):
        ips = {f'1.1.{a}.{b}' for a in range(1, 255) for b in range(1, 255)}
        output = map_ips_to_resource_records(ips)
        self.assertEqual(len(output), 400)
