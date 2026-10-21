# Secrets Inventory Cataloger

Inventory all secrets across the organization: API keys, passwords, certificates, tokens, and encryption keys.

## Inputs

- `infrastructure-scope`: Systems and environments in scope for the audit
- `team-contacts`: Team leads who manage secrets for each system

## Outputs

- `secrets-inventory`: Categorized inventory of all secrets with owners and locations
- `classification-map`: Secrets classified by sensitivity (critical, high, medium, low)

## Process

1. Interview team leads and collect the declared secret inventory per system
2. Cross-reference with cloud provider secret stores (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
3. Catalog the type, owner, rotation schedule, and storage location for each secret
4. Classify each secret by the blast radius if it were leaked

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
