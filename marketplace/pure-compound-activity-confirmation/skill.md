# Pure Compound Activity Confirmation

Confirm the biological activity of the pure compound and compare to the crude extract.

## Inputs

- `purified-compound`: Structurally identified pure compound
- `bioassay-protocol`: Same assay as the original screen
- `crude-activity-result`: Original crude extract activity for comparison

## Outputs

- `confirmed-activity`: Dose-response curve and potency metric for the pure compound
- `fractionation-report`: Complete bioassay-guided fractionation report from crude to pure compound

## Process

1. Run a full dose-response curve with the pure compound
2. Compare potency (IC50, MIC) to the crude extract to assess enrichment
3. Test for cytotoxicity or selectivity if relevant to the application
4. Write the final report covering the fractionation path, structure, and confirmed activity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
