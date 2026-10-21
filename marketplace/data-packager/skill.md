# Data Packager

Package the data files with metadata, README, and data dictionary into the repository's required submission format.

## Inputs

- `file-inventory`: Files to include
- `metadata-records`: Structured metadata for each dataset
- `selected-repository`: Repository and its submission format

## Outputs

- `submission-package`: Packaged archive(s) ready for upload
- `package-manifest`: Checksum manifest for integrity verification

## Process

1. Organize files into the repository's expected directory structure.
2. Include the metadata records and README at the top level.
3. Compute checksums (MD5 or SHA-256) for every file.
4. Create the archive in the required format (zip, tar.gz, or BagIt).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
