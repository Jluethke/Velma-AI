# Import File Validator

Validate the incoming file's format, structure, encoding, and basic data quality.

## Inputs

- `import-file`: The file to import (CSV, Excel, JSON, XML)
- `target-system-schema`: The target system's expected fields, types, and constraints

## Outputs

- `file-profile`: File format, encoding, row count, column count, and detected data types
- `structural-issues`: Any issues with the file structure (missing headers, inconsistent row lengths, encoding errors)

## Process

1. Detect the file format (CSV, Excel, JSON, XML) and character encoding.
2. Parse the headers and count the rows and columns.
3. Check for structural issues: missing headers, ragged rows, embedded delimiters, truncated data.
4. Profile each column for data type and null rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
