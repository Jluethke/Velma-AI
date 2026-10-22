# Foia Response Assembler

Assemble the response package and send to the requester.

## Inputs

- `reviewed-documents`: Documents with redactions applied
- `exemption-log`: Redaction justifications for the response letter

## Outputs

- `response-package`: Response letter, released documents, fee assessment, and appeal rights notice
- `foia-case-record`: Complete case file with request, search log, review notes, response, and metrics

## Process

1. Write the response letter with page counts (released in full, released in part, withheld, non-responsive).
2. Include the exemption citations for any withheld or redacted material.
3. Calculate and assess any applicable fees.
4. Include the appeal rights and send the package.
5. Close the case file with all documentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
