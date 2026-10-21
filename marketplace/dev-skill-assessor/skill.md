# Dev Skill Assessor

Assess the development team's current secure coding skill level through surveys and code review samples.

## Inputs

- `team-roster`: List of developers with roles and languages used
- `codebase-summary`: Overview of the codebase including languages and frameworks

## Outputs

- `skill-assessment-results`: Per-developer and aggregate skill scores by vulnerability class
- `skill-gaps-summary`: Ranked list of knowledge gaps across the team

## Process

1. Survey each developer on their familiarity with OWASP Top 10 and language-specific vulnerability classes.
2. Review a sample of recent pull requests for common security anti-patterns.
3. Score each developer and aggregate results by team and vulnerability category.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
