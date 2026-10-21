# Scheduled Task Service Examiner

Examine scheduled tasks and services for malicious or unauthorized entries.

## Inputs

- `persistence-analysis`: Persistence mechanism analysis for context
- `flagged-files`: Known suspicious files for correlation

## Outputs

- `task-service-findings`: Analysis of scheduled tasks and services
- `suspicious-entries`: Tasks and services identified as likely malicious

## Process

1. Export all scheduled tasks and examine their actions and triggers
2. List all services and compare against a known-good baseline
3. Check for tasks or services running as SYSTEM with unusual binaries
4. Correlate task and service binaries with flagged files

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
