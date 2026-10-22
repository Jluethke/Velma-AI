# Referral Intake Verification

Receive the referral and verify the authorization and patient information.

## Inputs

- `referral-document`: Referral order from the referring provider
- `patient-info`: Patient demographics and insurance information

## Outputs

- `verified-referral`: Referral with confirmed authorization, patient identity, and insurance eligibility
- `referral-issues`: Any problems with the referral (expired, wrong provider, missing info)

## Process

1. Verify the referring provider's information and the referral reason.
2. Confirm the referral authorization number and expiration date with the payer.
3. Verify the patient's identity and insurance eligibility for the referred service.
4. Flag any issues that need resolution before scheduling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
