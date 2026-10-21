# Email Attachment Examiner

Analyze email attachments for metadata, embedded content, and malicious indicators.

## Inputs

- `preserved-emails`: The preserved email data with attachments
- `header-analysis`: Header analysis for context on suspicious messages

## Outputs

- `attachment-analysis`: Metadata and content analysis of all attachments
- `malicious-indicators`: Identified malicious indicators in attachments

## Process

1. Extract all attachments and compute their hashes
2. Analyze document metadata (author, creation date, modification history)
3. Check executables and macros for malicious behavior
4. Submit hashes to threat intelligence databases

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
