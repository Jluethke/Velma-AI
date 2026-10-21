# Chunked Transfer Bypass Test

Test for WAF bypass through chunked transfer encoding and request smuggling.

## Inputs

- `waf-profile`: WAF product and deployment mode
- `hpp-bypass-results`: HTTP parameter pollution results

## Outputs

- `chunked-bypass-results`: Chunked encoding bypass techniques that work
- `smuggling-potential`: Request smuggling potential between WAF and backend

## Process

1. Test payload delivery through chunked transfer encoding
2. Test for CL.TE and TE.CL request smuggling between WAF and origin
3. Test with irregular chunk sizes and trailing headers
4. Check for timeout-based smuggling with delayed chunked bodies

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
