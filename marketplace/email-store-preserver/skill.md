# Email Store Preserver

Preserve the email store in a forensically sound manner with integrity hashes.

## Inputs

- `email-source`: The email store to preserve (PST, mbox, IMAP, EML files)
- `preservation-scope`: Mailboxes, date range, and search terms to preserve

## Outputs

- `preserved-emails`: Forensic copy of the email data with integrity hashes
- `preservation-record`: Record of the preservation process and completeness

## Process

1. Export the email data using forensic tools to avoid modification
2. Compute cryptographic hashes of the preserved data
3. Document the number of messages and storage format
4. Verify the export completeness against the source count

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
