# Deposit Verifier

Upload the package to the repository, verify the deposit, and confirm that the DOI resolves and metadata displays correctly.

## Inputs

- `submission-package`: Packaged archive ready for upload
- `doi-assignments`: Reserved DOIs for the datasets

## Outputs

- `deposit-confirmation`: Repository receipt with accession number and permanent URL
- `verification-report`: Confirmation that DOI resolves, files download, checksums match, and metadata renders

## Process

1. Upload the package to the selected repository.
2. Verify the DOI resolves to the landing page with correct metadata.
3. Download a file and verify its checksum against the manifest.
4. Confirm embargo or access restrictions are correctly applied.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
