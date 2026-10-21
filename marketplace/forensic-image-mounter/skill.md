# Forensic Image Mounter

Mount a verified forensic image in read-only mode for analysis.

## Inputs

- `verified-image`: The hash-verified forensic image
- `mount-config`: Mount options including read-only flags and filesystem type

## Outputs

- `mounted-filesystem`: The accessible read-only filesystem
- `mount-log`: Log of the mount operation and parameters

## Process

1. Identify the filesystem type and partition layout
2. Mount with read-only and noexec flags
3. Verify the mount is non-writable
4. Log all mount parameters

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
