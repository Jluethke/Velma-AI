# Quality Trend Tracker

Run the audit quarterly. Track scores over time to verify source fixes work.

## Inputs

- `source-fixes`: The fixes being implemented
- `monitoring-setup`: The automated monitoring

## Outputs

- `quarterly-report`: Quality scores compared to previous quarter with cause for each change
- `quality-trend`: Multi-quarter trend: is quality improving as source fixes accumulate?

## Process

1. Re-run scorecard quarterly with the same methodology. Compare to previous quarter.
2. Improved dimensions: verify the source fix is the cause. Protect it.
3. Degraded dimensions: investigate the new quality loss source. Apply root-cause fixing.
4. If quality is not improving despite fixes, monitoring is not catching new issues or fixes are not maintained.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
