# Xxe Basic File Read Test

Test for basic XXE file reading using external entity declarations.

## Inputs

- `xml-endpoints`: XML parsing endpoints
- `parser-fingerprints`: Parser fingerprints

## Outputs

- `file-read-results`: Results of file reading attempts
- `readable-files`: Files confirmed readable through XXE

## Process

1. Inject external entity declarations targeting known files (e.g., /etc/passwd)
2. Test with both SYSTEM and PUBLIC entity types
3. Try parameter entities if regular entities are blocked

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
