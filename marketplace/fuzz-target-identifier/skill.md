# Fuzz Target Identifier

Identify the parsing functions or protocol handlers that are good fuzzing targets.

## Inputs

- `target-codebase`: Source code of the target application or library
- `target-description`: Description of the target's purpose and input types

## Outputs

- `fuzz-targets`: List of functions to fuzz with their signatures and input formats
- `target-priority`: Ranked list by attack surface exposure and historical bug density

## Process

1. Identify functions that parse untrusted input (file formats, network protocols, user data).
2. Check historical bugs in each area to find the most productive targets.
3. Rank targets by attack surface exposure and expected bug density.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
