# Thick Client Local Storage Test

Test for sensitive data stored insecurely on the local filesystem.

## Inputs

- `attack-surface-notes`: File operations and registry interactions identified
- `target-platform`: Operating system for locating storage paths

## Outputs

- `local-storage-findings`: Sensitive data found in local files, registry, or databases
- `permission-issues`: Insecure file or registry permissions found

## Process

1. Monitor filesystem writes during application use with process monitor
2. Check local databases (SQLite, LevelDB) for sensitive unencrypted data
3. Review registry entries for stored credentials or tokens
4. Test file and directory permissions for overly broad access

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
