# Acoustic Importer

Import acoustic recordings and inspect their technical quality before analysis.

## Inputs

- `audio-files`: WAV or FLAC recordings with collection metadata
- `deployment-log`: Recorder locations, dates, gain settings, and duty cycle

## Outputs

- `validated-recordings`: Recordings passing quality checks with metadata attached
- `quality-flags`: Recordings flagged for clipping, low SNR, or equipment noise

## Process

1. Read file headers and verify sample rate, bit depth, and duration match the deployment log.
2. Scan for clipping, DC offset, and abnormal amplitude distributions.
3. Check for recorder self-noise, wind contamination, or rain masking.
4. Tag each file with its location, date, time, and quality status.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
