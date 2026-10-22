# Request Closure Verifier

Verify fulfillment with the requester and close.

## Inputs

- `provisioning-result`: What was provisioned
- `delivery-details`: Delivery information

## Outputs

- `user-confirmation`: User confirmation that the request is fulfilled
- `fulfillment-record`: Complete fulfillment record with timeline and satisfaction

## Process

1. Notify the requester that the service is ready.
2. Confirm the requester can access and use the service.
3. Collect satisfaction feedback.
4. Close the request and archive the fulfillment record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
