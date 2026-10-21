# Hidden Deser Endpoint Discovery

Check for deserialization in unexpected endpoints such as cookies, headers, and hidden parameters.

## Inputs

- `serialization-inventory`: Known serialization formats
- `deser-dos-results`: DoS test results

## Outputs

- `hidden-endpoint-findings`: Unexpected locations where deserialization occurs
- `attack-surface-expansion`: Additional attack surface beyond documented endpoints

## Process

1. Check cookies and session tokens for serialized data (base64-encoded Java objects)
2. Test HTTP headers (Accept, Content-Type variations) for triggering different deserializers
3. Check for ViewState deserialization in .NET applications
4. Test file upload handlers for deserialization of uploaded content

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
