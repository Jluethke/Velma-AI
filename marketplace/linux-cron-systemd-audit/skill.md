# Linux Cron Systemd Audit

Test for writable cron jobs and systemd units that execute as root.

## Inputs

- `linux-user-context`: Current user permissions
- `sudo-findings`: Sudo findings for combined attack paths

## Outputs

- `cron-findings`: Writable cron jobs and crontab entries exploitable for escalation
- `systemd-findings`: Misconfigured systemd units and timer exploits

## Process

1. List all cron jobs in /etc/crontab, /etc/cron.d/, and user crontabs
2. Check file permissions on scripts referenced by root cron jobs
3. Enumerate systemd units and timers running as root with writable paths
4. Test for PATH injection in cron environment configurations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
