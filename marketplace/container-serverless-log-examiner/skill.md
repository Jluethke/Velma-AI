# Container Serverless Log Examiner

Examine container and serverless function logs for evidence of compromise.

## Inputs

- `preserved-evidence`: Container and function execution logs
- `incident-scope`: Services and time range to examine

## Outputs

- `workload-findings`: Evidence of compromise in container or function workloads
- `workload-timeline`: Timeline of workload events during the incident

## Process

1. Parse container runtime logs (Docker, Kubernetes audit log)
2. Analyze serverless invocation logs for unusual triggers or payloads
3. Check for privilege escalation within container contexts
4. Identify lateral movement between workloads

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
