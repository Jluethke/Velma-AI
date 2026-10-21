# Xxe File Upload Test

Test for XXE through file upload vectors including SVG, DOCX, XLSX, and other XML-based formats.

## Inputs

- `oob-results`: OOB test results
- `parser-fingerprints`: Parser fingerprints

## Outputs

- `upload-xxe-results`: File upload XXE test results
- `vulnerable-formats`: File formats vulnerable to XXE through upload

## Process

1. Craft malicious SVG files with external entity declarations
2. Modify DOCX/XLSX internal XML files to include entity declarations
3. Upload each crafted file and monitor for entity resolution

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
