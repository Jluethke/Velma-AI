# File Upload Path Traversal Test

Test for path traversal in the filename parameter to write files to arbitrary locations.

## Inputs

- `shell-upload-results`: Shell upload results
- `upload-endpoints`: Upload endpoints

## Outputs

- `path-traversal-results`: Path traversal test results
- `writable-locations`: Locations writable through filename traversal

## Process

1. Inject ../ sequences in the filename parameter
2. Test absolute path injection in the filename
3. Check for filename sanitization and directory confinement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
