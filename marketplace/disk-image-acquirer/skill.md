# Disk Image Acquirer

Acquire a forensic disk image using write-blocking hardware or software.

## Inputs

- `source-device`: The storage device to image
- `acquisition-method`: Write-blocking method and imaging tool to use

## Outputs

- `disk-image`: The forensic image file (E01, dd, or AFF)
- `acquisition-log`: Log of the acquisition process with timestamps

## Process

1. Connect the source device through a write-blocker
2. Select the imaging format and destination
3. Run the acquisition and record start and end times
4. Log the acquisition parameters and any errors

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
