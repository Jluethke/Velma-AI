# Kubernetes Rbac Audit

Audit Kubernetes RBAC configuration for overly permissive roles, cluster-admin bindings, and service account privileges.

## Inputs

- `dockerfile-findings`: Container-level findings for context
- `image-registry`: Registry access details

## Outputs

- `rbac-findings`: Overly permissive roles and bindings
- `service-account-risks`: Service accounts with excessive privileges

## Process

1. List all ClusterRoles, Roles, ClusterRoleBindings, and RoleBindings.
2. Identify roles with wildcard verbs or resources.
3. Check for unnecessary cluster-admin bindings.
4. Review default service account permissions in each namespace.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
