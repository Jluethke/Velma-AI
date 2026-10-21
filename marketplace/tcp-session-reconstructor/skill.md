# Tcp Session Reconstructor

Reconstruct TCP sessions from packet captures to recover full conversations.

## Inputs

- `indexed-capture`: The indexed capture data
- `analysis-scope`: Scope parameters for session reconstruction

## Outputs

- `reconstructed-sessions`: Rebuilt TCP sessions with full payload data
- `session-index`: Index of sessions by endpoints, protocol, and time

## Process

1. Reassemble TCP streams from individual packets
2. Handle retransmissions and out-of-order delivery
3. Decode application-layer protocols (HTTP, SMTP, FTP, DNS)
4. Index sessions for efficient searching and filtering

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
