# Supply Chain Dependency Inventory

Inventory all direct and transitive dependencies across the software stack.

## Inputs

- `codebase-access`: Access to source code and package manager configurations
- `scope-definition`: Which repositories, services, and languages are in scope

## Outputs

- `dependency-tree`: Complete dependency tree with direct and transitive dependencies
- `dependency-metadata`: Metadata for each dependency (maintainer, last update, license, popularity)

## Process

1. Parse lock files and manifests for each package manager in use
2. Build the full transitive dependency tree
3. Collect metadata on each dependency (maintainer count, update frequency, download count)
4. Identify dependencies with single maintainers or low activity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
