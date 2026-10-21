# Gcp Project Iam Enumeration

Enumerate GCP projects, IAM bindings, and service accounts to map the authorization surface.

## Inputs

- `project-ids`: List of GCP project IDs in scope
- `authorization-scope`: Written scope of the authorized test
- `credential-set`: Initial test credentials or service account keys

## Outputs

- `iam-binding-map`: Map of all IAM bindings across projects
- `service-account-inventory`: All service accounts with their roles and key status

## Process

1. Authenticate and enumerate all accessible projects and their organization hierarchy
2. List IAM bindings at organization, folder, and project levels
3. Inventory all service accounts, their roles, and whether they have active keys
4. Identify overprivileged accounts with owner, editor, or custom admin roles

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
