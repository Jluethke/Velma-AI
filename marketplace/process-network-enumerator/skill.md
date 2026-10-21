# Process Network Enumerator

List all running processes, their parent relationships, and active network connections.

## Inputs

- `profiled-image`: The memory image with identified profile
- `profile-info`: OS profile for correct structure parsing

## Outputs

- `process-list`: All processes with PIDs, parent PIDs, paths, and command lines
- `network-connections`: All active and recently closed network connections

## Process

1. Walk the process list structures (EPROCESS, task_struct)
2. Extract command lines, loaded DLLs, and creation timestamps
3. Parse network connection structures for TCP and UDP endpoints
4. Flag processes with unusual parents or hidden from user-mode listing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
