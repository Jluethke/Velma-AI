# Disk Imaging

Create forensic images of affected storage media.

## Inputs

- `collection-plan`: Collection plan identifying disks to image
- `volatile-state`: Volatile data already captured (safe to proceed with disk)

## Outputs

- `disk-images`: Forensic disk images with verification hashes
- `imaging-log`: Record of imaging process including tool, time, and hashes

## Process

1. Connect a write blocker to prevent modification of the source media
2. Create a bit-for-bit forensic image using dd, FTK Imager, or equivalent
3. Compute and record cryptographic hashes (SHA-256) of the source and image
4. Verify the image hash matches the source hash

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
