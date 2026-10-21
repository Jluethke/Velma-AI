# File Upload Content Type Bypass

Test for content-type validation bypass by manipulating MIME types and magic bytes.

## Inputs

- `extension-bypass-results`: Extension bypass results
- `upload-endpoints`: Upload endpoints

## Outputs

- `content-type-results`: Content-type bypass test results
- `accepted-combinations`: Extension plus content-type combinations accepted

## Process

1. Upload executable files with image MIME types
2. Prepend image magic bytes to executable content
3. Test whether validation checks extension, content-type, or magic bytes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
