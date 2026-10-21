# Volatile Data Capture

Capture volatile data before it is lost due to system shutdown or reboot.

## Inputs

- `collection-plan`: Prioritized collection plan
- `affected-systems`: Systems to capture volatile data from

## Outputs

- `memory-captures`: Memory dumps from affected systems
- `volatile-state`: Running processes, network connections, and logged-in users

## Process

1. Capture physical memory using forensic tools (WinPmem, LiME, FTK Imager)
2. Record running processes, open files, and loaded modules
3. Capture active network connections and listening ports
4. Record logged-in users and active sessions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
