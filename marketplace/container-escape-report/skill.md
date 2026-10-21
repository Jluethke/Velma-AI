# Container Escape Report

Produce the container escape testing report with findings and hardening recommendations.

## Inputs

- `privilege-findings`: Privilege escape findings
- `pivot-findings`: Network pivot findings
- `secret-findings`: Secret exposure findings
- `kernel-findings`: Kernel vulnerability findings

## Outputs

- `escape-report`: Complete container escape testing report
- `hardening-guide`: Specific hardening steps to prevent escape

## Process

1. Compile all escape paths found, ordered by severity
2. Document proof-of-concept steps for each finding
3. Write hardening recommendations: drop capabilities, remove mounts, enforce seccomp
4. Summarize overall container isolation posture

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
