# Data Subject Rights Reviewer

Review the implementation of data subject rights (access, erasure, portability, objection).

## Inputs

- `processing-register`: Processing activities subject to rights requests
- `system-inventory`: Systems that must support rights fulfillment

## Outputs

- `rights-assessment`: Assessment of rights implementation per system
- `rights-gaps`: Systems or processes unable to fulfill rights requests

## Process

1. Test the process for handling access requests end to end
2. Verify erasure capability across all systems holding personal data
3. Check portability: can data be exported in a machine-readable format
4. Assess response time against the GDPR 30-day requirement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
