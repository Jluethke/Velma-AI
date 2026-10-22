# Version Migration Planner

Plan the migration tooling and support for consumers upgrading between versions.

## Inputs

- `versioning-policy`: The versioning policy
- `breaking-change-definitions`: What constitutes breaking changes

## Outputs

- `migration-toolkit`: Toolkit for version migration: migration guide template, compatibility shim design, version comparison tool
- `versioning-strategy-document`: The complete API versioning strategy covering policy, changelog, communication, and migration support

## Process

1. Design the migration guide template: what changed, why, how to update, code examples before and after.
2. Design the compatibility mode: how old versions are served alongside new ones (routing, middleware).
3. Plan the sunset process: usage monitoring, direct outreach to consumers still on deprecated versions, final shutdown.
4. Compile the complete versioning strategy document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
