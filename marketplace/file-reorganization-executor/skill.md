# File Reorganization Executor

Move and rename existing files to match the new hierarchy and naming convention.

## Inputs

- `folder-hierarchy`: Target folder structure
- `naming-convention`: File and folder naming rules

## Outputs

- `migration-log`: Record of every file moved or renamed, with old and new paths
- `exceptions-list`: Files that could not be moved automatically and require manual review

## Process

1. Create the target folder structure in the storage platform.
2. Move files in batches, starting with the largest and most active folders.
3. Rename files that violate the naming convention, logging the old and new names.
4. Flag files that cannot be moved (permission issues, active links, ambiguous ownership) for manual review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
