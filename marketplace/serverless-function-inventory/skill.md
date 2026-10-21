# Serverless Function Inventory

Inventory all serverless functions, their triggers, and runtime configurations.

## Inputs

- `cloud-account-access`: Credentials or role for the cloud account
- `review-scope`: Which regions, accounts, or projects to include

## Outputs

- `function-inventory`: Complete list of functions with runtime, memory, timeout, and trigger type
- `trigger-map`: Map of event sources to functions they invoke

## Process

1. Enumerate all functions across regions and accounts
2. Record runtime version, memory allocation, timeout, and environment variables
3. Map all event sources (API Gateway, S3, SQS, SNS, EventBridge, schedule) to their functions
4. Identify functions that invoke other functions directly

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
