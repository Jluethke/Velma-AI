# Storage Permissions Configurator

Set up access permissions by folder based on team roles and sharing requirements.

## Inputs

- `folder-hierarchy`: Target folder structure
- `team-size`: Team roles and access needs

## Outputs

- `permissions-matrix`: Who can read, write, and share each folder
- `sharing-rules`: Rules for external sharing, link expiration, and download permissions

## Process

1. Map each folder to the roles that need access (owner, editor, viewer).
2. Configure the permissions in the storage platform, removing inherited permissions where they conflict.
3. Set the external sharing rules: which folders allow external links, expiration defaults, and download restrictions.
4. Document the permissions matrix for onboarding and audits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
