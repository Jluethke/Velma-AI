# Thick Client Binary Analysis

Analyze the thick client binary through decompilation, disassembly, and static analysis.

## Inputs

- `application-binary`: Path or reference to the thick client installer or binary
- `target-platform`: Operating system and architecture (Windows x64, macOS, etc.)

## Outputs

- `binary-analysis-results`: Decompiled code, hardcoded secrets, and protection mechanisms found
- `attack-surface-notes`: Identified entry points, IPC mechanisms, and loaded libraries

## Process

1. Decompile or disassemble the application binary
2. Search for hardcoded credentials, API keys, and encryption keys
3. Identify security protections (code signing, obfuscation, anti-tampering)
4. Map IPC mechanisms, file operations, and registry interactions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
