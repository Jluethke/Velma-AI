# Linux Filesystem Permissions

Set filesystem permissions and mount options to restrict unauthorized access.

## Inputs

- `benchmark-profile`: CIS benchmark with filesystem requirements
- `baseline-scan`: Current filesystem permission state

## Outputs

- `permission-changes`: Record of permission changes applied
- `mount-options`: Updated fstab with hardened mount options

## Process

1. Set nodev, nosuid, and noexec on /tmp, /var/tmp, and /dev/shm
2. Set correct ownership and permissions on critical files (/etc/passwd, /etc/shadow, cron directories)
3. Remove world-writable files and directories or add sticky bits
4. Check for and remove unowned files

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
