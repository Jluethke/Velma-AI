# Vendor Access Control Reviewer

Review vendor access to your environment and the controls around it.

## Inputs

- `integration-inventory`: Vendor connections and access methods
- `api-security-findings`: API security findings

## Outputs

- `vendor-access-findings`: Over-privileged vendor accounts, shared credentials, and missing audit trails
- `access-control-recommendations`: Recommended access restrictions for each vendor

## Process

1. Inventory all vendor accounts, API keys, and access credentials in your environment
2. Check whether vendor access follows least privilege
3. Verify that vendor access is logged and auditable
4. Test whether vendor credentials can be used outside their intended scope

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
