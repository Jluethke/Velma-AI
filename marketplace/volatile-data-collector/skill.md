# Volatile Data Collector

Collect volatile data from a live system before it is lost to shutdown or reboot.

## Inputs

- `target-system`: The system to collect volatile data from
- `collection-toolkit`: Forensic collection tools to deploy

## Outputs

- `volatile-data`: Running processes, network connections, loaded drivers, and open handles
- `collection-timestamp`: Timestamp and system uptime at time of collection

## Process

1. List all running processes with full command lines and parent PIDs
2. Capture all active network connections and listening ports
3. Enumerate loaded kernel modules and drivers
4. Record open file handles and named pipes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
