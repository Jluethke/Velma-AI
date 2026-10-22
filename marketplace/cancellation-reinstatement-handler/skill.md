# Cancellation Reinstatement Handler

Handle policy cancellations and reinstatement requests.

## Inputs

- `renewal-offer`: The current or renewed policy
- `cancellation-request`: The cancellation request with reason (insured request, non-payment, underwriting) or reinstatement request

## Outputs

- `cancellation-notice`: The cancellation or reinstatement confirmation with effective date and any return premium
- `policy-status-update`: The updated policy status in the administration system

## Process

1. Validate the cancellation or reinstatement request against policy terms and regulatory requirements.
2. Calculate the return premium or reinstatement premium.
3. Issue the cancellation notice or reinstatement confirmation within required timelines.
4. Update the policy status and notify all parties.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
