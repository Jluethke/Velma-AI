# Import Executor

Run the full import with error handling and progress tracking.

## Inputs

- `import-mapping`: Validated column-to-field mapping
- `preview-results`: Confirmed preview with no blocking errors

## Outputs

- `import-summary`: Total records processed, succeeded, failed, and skipped
- `error-log`: Detail for each failed record (row number, field, error)

## Process

1. Run the import in batches, committing each batch on success.
2. For each failed record, log the error and continue to the next record.
3. Track progress: records processed, succeeded, failed, remaining.
4. On completion, report the summary and error log.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
