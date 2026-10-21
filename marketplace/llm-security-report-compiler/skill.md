# Llm Security Report Compiler

Compile all LLM security findings into a structured assessment report with OWASP LLM Top 10 mapping.

## Inputs

- `injection-findings`: Prompt injection findings
- `jailbreak-findings`: Jailbreak technique findings
- `agency-findings`: Excessive agency findings
- `leakage-findings`: Data leakage findings

## Outputs

- `llm-security-report`: Full LLM application security assessment report
- `owasp-llm-mapping`: Findings mapped to OWASP Top 10 for LLMs

## Process

1. Map each finding to OWASP Top 10 for LLM Applications categories
2. Score each finding by exploitability and impact on users and the organization
3. Write remediation guidance (input validation, output filtering, guardrails, monitoring)
4. Produce the final report with attack narratives and remediation priorities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
