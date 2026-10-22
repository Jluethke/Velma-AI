# Driver Qualification File Manager

Manage driver qualification files per FMCSA requirements.

## Inputs

- `compliance-procedures`: Compliance procedures
- `documentation-templates`: Documentation templates

## Outputs

- `dq-file-status`: Status of each driver's qualification file (complete, missing items, expired items)
- `dq-action-items`: Action items to bring all files into compliance

## Process

1. Verify each driver file contains all required documents (application, MVR, medical certificate, road test, annual review).
2. Flag missing or expired documents.
3. Generate action items with deadlines for each missing item.
4. Track completion of action items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
