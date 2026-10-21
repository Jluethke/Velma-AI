# Aws Privilege Escalation Test

Attempt to escalate privileges through identified IAM misconfigurations.

## Inputs

- `privilege-escalation-paths`: Identified escalation paths to test
- `test-credentials-aws`: Current access credentials

## Outputs

- `escalation-results`: Successfully exploited privilege escalation paths with evidence
- `maximum-access-achieved`: Highest privilege level reached and the path taken

## Process

1. Test iam:PassRole to assume higher-privilege service roles
2. Test iam:CreatePolicyVersion to attach more permissive policies
3. Test sts:AssumeRole chains for privilege escalation through role chaining
4. Document each successful escalation with before and after permission comparisons

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
