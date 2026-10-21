# Payload Unpacking

Unpack or decrypt embedded payloads and second-stage components.

## Inputs

- `malware-sample`: The packed or encrypted binary
- `packing-assessment`: Identified packer information

## Outputs

- `unpacked-payload`: Decrypted or unpacked malware payload
- `decryption-details`: Algorithm, keys, and method used for unpacking

## Process

1. Set breakpoints at common unpacking points: VirtualAlloc, VirtualProtect
2. Dump the unpacked code from memory at runtime
3. If encrypted, identify the algorithm and extract or derive the key
4. Verify the unpacked payload is complete and functional

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
