# Credit Report Puller

Pull the credit report and summarize the borrower credit profile.

## Inputs

- `application-record`: Application with borrower identifying information
- `identity-verification-result`: Confirmed identity before pulling credit

## Outputs

- `credit-report-summary`: Credit score, trade lines, delinquencies, and inquiries
- `credit-risk-flags`: Any items requiring underwriter attention

## Process

1. Request the credit report from one or more bureaus.
2. Summarize the score, open accounts, balances, and payment history.
3. Flag derogatory items, high utilization, or recent inquiries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
