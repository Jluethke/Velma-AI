# Alert Signal Classifier

Classify each alert by criticality and signal quality.

## Inputs

- `alert-inventory`: All alert rules with metrics
- `noise-candidates`: Alerts flagged as likely noise

## Outputs

- `signal-classification`: Each alert classified as high-signal, tunable, or removable
- `tuning-recommendations`: Specific tuning recommendations for each tunable alert

## Process

1. Review each noise candidate with the owning team to confirm whether it is truly low-signal.
2. Classify each alert into three buckets: high-signal (keep as-is), tunable (adjust threshold or consolidate), removable (delete or disable).
3. For tunable alerts, write the specific recommendation (raise threshold, increase evaluation window, consolidate with a related alert).
4. For removable alerts, confirm with the owning team before flagging for deletion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
