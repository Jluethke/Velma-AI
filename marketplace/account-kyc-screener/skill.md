# Account Kyc Screener

Run KYC, sanctions, and PEP screening on the applicant.

## Inputs

- `application-data`: Applicant identifying information
- `account-preferences`: Account type for risk tier assignment

## Outputs

- `kyc-result`: Pass, fail, or enhanced due diligence required
- `screening-record`: Results of sanctions and PEP screening

## Process

1. Verify identity against government ID databases.
2. Screen against OFAC, EU, and UN sanctions lists.
3. Screen against PEP (politically exposed persons) databases.
4. Assign the customer risk tier based on screening results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
