# Merge Executor

Run the merge, review the output, and distribute the merged documents.

## Inputs

- `clean-data-source`: Validated data source
- `merge-template`: Template with merge placeholders

## Outputs

- `merged-documents`: The complete set of merged documents
- `campaign-record`: Record of the campaign: count sent, errors, distribution method

## Process

1. Run the merge to generate one document per record.
2. Review a sample of merged documents for correctness.
3. Distribute via the selected channel (print, email, upload).
4. Log the campaign results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
