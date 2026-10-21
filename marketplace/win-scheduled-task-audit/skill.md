# Win Scheduled Task Audit

Check for misconfigured scheduled tasks that run with elevated privileges on writable scripts.

## Inputs

- `user-context-report`: Current user context and access level
- `dll-hijack-findings`: DLL hijack findings for cross-reference

## Outputs

- `task-escalation-findings`: Scheduled tasks vulnerable to privilege escalation
- `task-permissions-detail`: File and registry permissions for each vulnerable task

## Process

1. Enumerate all scheduled tasks and their run-as accounts
2. Check file system permissions on task actions (scripts, binaries)
3. Identify tasks that execute from writable locations as SYSTEM
4. Test whether task triggers can be manipulated by the current user

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
