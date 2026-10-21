# Physical Security Testing

Test physical security controls including tailgating, badge cloning, and access to restricted areas.

## Inputs

- `approved-scenarios`: Approved physical testing scenarios
- `organization-profile`: Building and facility details

## Outputs

- `physical-test-results`: Success/failure of each physical access attempt
- `physical-evidence`: Photographs and notes from physical testing (no PII)

## Process

1. Attempt to tailgate through secured entrances during approved testing windows.
2. Test badge reader controls by presenting cloned or invalid credentials.
3. Attempt to access server rooms, network closets, and restricted floors.
4. Document the response of security personnel and employees to each attempt.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
