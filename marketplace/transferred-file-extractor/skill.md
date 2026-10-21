# Transferred File Extractor

Extract files and credentials transferred over the network.

## Inputs

- `reconstructed-sessions`: Rebuilt TCP sessions
- `session-index`: Session index for targeted extraction

## Outputs

- `extracted-files`: Files transferred over the network with metadata
- `captured-credentials`: Credentials observed in cleartext or weak protocols

## Process

1. Carve files from HTTP, FTP, SMB, and email sessions
2. Extract credentials from cleartext protocols (FTP, Telnet, HTTP Basic)
3. Recover file metadata (names, sizes, transfer timestamps)
4. Hash all extracted files for identification

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
