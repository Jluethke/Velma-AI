# Dependency Inventory Builder

Inventory all direct and transitive dependencies across the project's package managers and build systems.

## Inputs

- `project-source`: Path to the project source code and build configuration files
- `package-managers`: List of package managers in use (npm, pip, Maven, Cargo, etc.)

## Outputs

- `dependency-tree`: Complete dependency tree with direct and transitive dependencies
- `dependency-metadata`: Version, license, and source URL for each dependency

## Process

1. Parse lock files and build manifests for each package manager.
2. Resolve transitive dependencies to build the full dependency tree.
3. Collect metadata (version, license, source repository) for each component.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
