# Sync Verification Runner

Verify the sync by comparing source and target after a run to confirm data integrity.

## Inputs

- `error-handling-plan`: Error handling and logging configuration
- `validation-checks`: Post-conversion validation checks

## Outputs

- `sync-setup-document`: Complete sync configuration including mapping, direction, triggers, conversions, error handling, and verification
- `verification-results`: Results of the initial sync verification (record counts, spot checks, discrepancy list)

## Process

1. Run the sync against a test dataset or a small batch of live data.
2. Compare record counts between source and target.
3. Spot-check a sample of records for field-level accuracy.
4. Document the results and flag any discrepancies for investigation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
