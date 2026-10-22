# Storage Retention Planner

Configure the retention and archival rules for files based on type and age.

## Inputs

- `folder-hierarchy`: Target folder structure
- `permissions-matrix`: Access control setup

## Outputs

- `retention-schedule`: How long each category of file is kept active, archived, and deleted
- `storage-organization-plan`: Complete plan covering hierarchy, naming, permissions, and retention

## Process

1. Classify folders by retention need: active (current projects), reference (long-term), archive (historical), and disposable (temporary).
2. Set the retention period for each category (e.g., active = indefinite, archive = 3 years, disposable = 90 days).
3. Configure automated archival or deletion rules where the platform supports them.
4. Compile the full storage organization plan: hierarchy, naming convention, permissions, and retention schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
