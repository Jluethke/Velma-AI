# Serverless Iam Reviewer

Check IAM execution roles for least privilege violations.

## Inputs

- `function-inventory`: List of functions with their roles
- `trigger-map`: Event sources mapped to functions

## Outputs

- `iam-findings`: Over-privileged roles, wildcard permissions, and unused permissions
- `least-privilege-recommendations`: Tightened IAM policies for each function

## Process

1. Extract the IAM policy for each function's execution role
2. Identify wildcard resource or action permissions
3. Compare granted permissions against actually used permissions (via CloudTrail or equivalent)
4. Flag roles that grant access to resources outside the function's need

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
