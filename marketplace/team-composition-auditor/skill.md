# Team Composition Auditor

Audit the current team composition across multiple dimensions: professional background, problem-solving style, communication style, industry experience, education path, and demographic background. The goal is not to label people but to see the team as a whole and notice what is overrepresented and what is absent.

## Inputs

- `team-roster`: The current team members with their backgrounds
- `team-purpose`: What the team exists to accomplish and who it serves

## Outputs

- `composition-profile`: The team's current composition across all dimensions, showing where there is depth and where there are gaps
- `homogeneity-flags`: Dimensions where the team is notably uniform (e.g., everyone came from the same 3 companies, everyone solves problems the same way)

## Process

1. For each team member, note: professional background (where they worked before), problem-solving style (analytical, intuitive, collaborative, independent), communication style (direct, diplomatic, written-first, verbal-first), industry experience, and education path.
2. Look for clustering. If 80% of the team shares any single attribute, that is a homogeneity flag.
3. Ask: given what this team exists to accomplish and who it serves, what perspectives are missing? If the team builds products for small business owners and nobody on the team has run a small business, that is a gap.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
