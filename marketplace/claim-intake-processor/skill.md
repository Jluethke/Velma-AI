# Claim Intake Processor

Receive and log the first notice of loss, verify coverage, and open the claim file.

## Inputs

- `loss-notice`: The first notice of loss from the insured, agent, or third party
- `policy-number`: The policy number associated with the claim

## Outputs

- `claim-file`: Opened claim file with claim number, loss details, and coverage verification
- `coverage-confirmation`: Confirmation that the policy was in force and the loss is within covered perils

## Process

1. Log the loss notice with date of loss, date reported, claimant, and loss description.
2. Verify the policy was in force on the date of loss and coverage applies.
3. Assign a claim number and open the claim file.
4. Set the initial reserve based on the reported loss estimate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
