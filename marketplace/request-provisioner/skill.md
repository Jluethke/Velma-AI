# Request Provisioner

Execute the provisioning steps to fulfill the request.

## Inputs

- `approved-request`: The approved request
- `fulfillment-path`: Steps and team for fulfillment

## Outputs

- `provisioning-result`: What was provisioned and its status
- `delivery-details`: How and when the user can access the fulfilled request

## Process

1. Execute each provisioning step per the fulfillment workflow.
2. Configure access, licenses, or hardware as specified.
3. Test the provisioned service or asset.
4. Prepare the delivery notification for the requester.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
