# Host Mount Check

Check for host filesystem mounts that could enable escape or data access.

## Inputs

- `target-container`: Container to inspect

## Outputs

- `mount-findings`: Host paths mounted into the container
- `writable-mounts`: Host mounts with write access from the container

## Process

1. Enumerate all mount points inside the container
2. Identify mounts from the host filesystem: /var/run/docker.sock, /, /etc
3. Test read and write permissions on each host mount

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
