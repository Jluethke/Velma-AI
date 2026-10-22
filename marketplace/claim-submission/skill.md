# Claim Submission

Submit the coded claim to the payer through the clearinghouse.

## Inputs

- `compliant-encounter`: Encounter that passed compliance review
- `patient-demographics`: Patient and insurance information

## Outputs

- `submitted-claim`: Claim record with submission date, payer, and tracking number
- `submission-errors`: Any rejection errors from the clearinghouse

## Process

1. Build the claim (CMS-1500 or 837P) with the patient demographics, codes, and charges.
2. Submit the claim through the clearinghouse to the payer.
3. Record the submission date, tracking number, and payer.
4. Handle any clearinghouse rejections by correcting and resubmitting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
