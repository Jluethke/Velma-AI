# Gadget Chain Test

Test for insecure deserialization using known gadget chains for each identified format.

## Inputs

- `serialization-inventory`: Formats and libraries in use
- `deserialization-endpoints`: Endpoints accepting serialized input

## Outputs

- `gadget-chain-results`: Results of gadget chain exploitation attempts
- `library-versions`: Detected library versions and their known gadget chains

## Process

1. For Java targets, generate payloads with ysoserial for detected libraries (Commons Collections, Spring, etc.)
2. For .NET targets, test with ysoserial.net payloads
3. For PHP targets, test with crafted unserialize payloads
4. For Python targets, test with pickle payloads using __reduce__

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
