# Asset Deployer

Deploy the asset to the assigned user.

## Inputs

- `asset-record`: CMDB record for the asset
- `asset-tag`: Asset tag identifier

## Outputs

- `deployment-record`: Record of who received the asset, when, and where
- `user-acknowledgment`: User sign-off on receipt and acceptable use

## Process

1. Image or configure the asset per the standard build.
2. Deliver to the user and verify functionality.
3. Collect the user acknowledgment of receipt and policy.
4. Update the CMDB with the assigned user and location.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
