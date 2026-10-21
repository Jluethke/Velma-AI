# Vuln Class Identifier

Identify the top vulnerability classes present in the codebase by analyzing static analysis results and historical bug reports.

## Inputs

- `codebase-summary`: Overview of the codebase including languages and frameworks
- `skill-gaps-summary`: Ranked list of knowledge gaps across the team

## Outputs

- `top-vuln-classes`: Ranked list of vulnerability classes by frequency and severity in the codebase
- `vuln-examples`: Concrete examples of each vulnerability class from the codebase

## Process

1. Run static analysis tools against the codebase and categorize findings by CWE.
2. Review historical bug reports and security incidents for recurring vulnerability patterns.
3. Rank vulnerability classes by frequency, severity, and alignment with team skill gaps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
