# K8S Rbac Reviewer

Review RBAC policies, service accounts, and privilege assignments.

## Inputs

- `cluster-inventory`: Inventory of namespaces, pods, and services
- `cluster-access`: Cluster access credentials

## Outputs

- `rbac-findings`: Over-privileged roles, risky bindings, and unused service accounts
- `privilege-map`: Map of which identities can do what across namespaces

## Process

1. Enumerate all ClusterRoles, Roles, ClusterRoleBindings, and RoleBindings
2. Identify roles with wildcard permissions or access to secrets
3. Check for default service account tokens mounted in pods
4. Flag service accounts with cluster-admin or equivalent privileges

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
