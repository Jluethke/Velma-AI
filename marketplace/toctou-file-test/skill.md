# Toctou File Test

Test for time-of-check-to-time-of-use vulnerabilities in file operations.

## Inputs

- `race-target-list`: File operations identified as race targets
- `exploitation-evidence`: Previous race condition results

## Outputs

- `toctou-results`: TOCTOU vulnerabilities in file operations
- `symlink-race-results`: Symlink race condition test results

## Process

1. Identify file operations that check permissions then act on the file
2. Create symlink races between the check and use operations
3. Test for temporary file race conditions in shared directories
4. Document the timing window and reliability of each TOCTOU exploit

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
