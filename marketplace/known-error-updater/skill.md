# Known Error Updater

Update the known error database and close the problem.

## Inputs

- `problem-record`: The problem record
- `root-cause`: Root cause documentation
- `fix-implementation`: The permanent fix

## Outputs

- `known-error-entry`: Entry in the known error database
- `closed-problem-record`: Closed problem record with full documentation

## Process

1. Create or update the known error database entry.
2. Link the root cause, workaround, and permanent fix.
3. Close all linked incidents.
4. Close the problem record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
