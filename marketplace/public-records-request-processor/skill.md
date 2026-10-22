# Public Records Request Processor

Process public records requests (FOIA or state equivalent).

## Inputs

- `classified-records`: The classified records inventory
- `storage-assignments`: Record storage locations

## Outputs

- `responsive-records`: Records identified as responsive to the request, with redactions applied
- `request-response`: Formal response to the requester including any exemption citations

## Process

1. Log the request and acknowledge receipt within the legal timeframe.
2. Search for records responsive to the request.
3. Review responsive records for exempt information and apply redactions.
4. Prepare and deliver the response with any exemption citations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
