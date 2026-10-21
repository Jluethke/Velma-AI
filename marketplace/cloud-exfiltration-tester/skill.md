# Cloud Exfiltration Tester

Test cloud-based exfiltration channels including sync services and email attachments.

## Inputs

- `test-data-set`: Synthetic test data
- `classification-matrix`: Expected controls per data type

## Outputs

- `cloud-test-results`: Pass/fail for each cloud exfiltration channel
- `cloud-detection-times`: Time from attempt to alert for each test

## Process

1. Test file sync services (personal cloud storage, unauthorized SaaS applications)
2. Test email attachments to external addresses with classified content
3. Test cloud storage API uploads from corporate endpoints
4. Test data sharing through collaboration tools to external accounts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
