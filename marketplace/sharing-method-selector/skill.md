# Sharing Method Selector

Select the sharing method for each scenario and configure the access controls.

## Inputs

- `sharing-matrix`: Sharing scenarios with requirements
- `compliance-constraints`: Regulatory requirements

## Outputs

- `method-selection`: Selected sharing method for each scenario (link, portal, SFTP, email, API)
- `access-controls`: Access settings for each method (password, expiration, download limit, IP restriction)

## Process

1. For each scenario, select the sharing method: cloud link for casual internal sharing, secure portal for client delivery, SFTP for automated exchange, encrypted email for sensitive one-offs.
2. Configure the access controls: password protection, link expiration, download limits, and viewer-only restrictions.
3. Handle large file transfers: set the size threshold and the method for files that exceed email limits.
4. Document the method selection and access controls.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
