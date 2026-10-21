# Cloud Security Service Enabler

Enable the cloud provider's security monitoring services.

## Inputs

- `cloud-provider`: Cloud provider
- `account-id`: Cloud account identifier

## Outputs

- `security-services`: Enabled security services and their configuration
- `alert-config`: Alert routing for security findings

## Process

1. Enable GuardDuty (AWS), Defender for Cloud (Azure), or Security Command Center (GCP)
2. Configure threat detection for the account and all regions
3. Set up alert routing to the security operations team
4. Review initial findings and address any critical items

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
