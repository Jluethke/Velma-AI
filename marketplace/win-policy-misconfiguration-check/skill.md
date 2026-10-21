# Win Policy Misconfiguration Check

Check for AlwaysInstallElevated, registry autorun, and GPO misconfigurations.

## Inputs

- `user-context-report`: Current user and group policy context
- `token-impersonation-results`: Token impersonation test results

## Outputs

- `policy-misconfig-findings`: Group policy and registry misconfigurations found
- `autorun-escalation-paths`: Autorun and startup escalation opportunities

## Process

1. Query AlwaysInstallElevated in HKLM and HKCU registry hives
2. Check autorun locations (Run, RunOnce, Startup folder) for writable entries
3. Review GPO-deployed scripts and their file permissions
4. Assess credential storage in Group Policy Preferences XML files

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
