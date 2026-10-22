# Skill Inventory Builder

List every skill the team needs to function. Do not use the job descriptions. Instead, list every task the team performed in the last quarter and extract the skills required for each. Include technical skills, process skills, and relationship skills (e.g., 'is the only person who knows how to talk to the vendor').

## Inputs

- `team-name`: The team being assessed
- `recent-task-log`: A log or list of tasks the team performed in the last quarter

## Outputs

- `skill-inventory`: Complete list of skills the team needs, derived from actual tasks rather than job descriptions
- `skill-categories`: Skills grouped by category (technical, process, relationship, domain-knowledge)

## Process

1. List every distinct task the team performed in the last quarter. Group similar tasks.
2. For each task group, identify the skills required to perform it. Be specific: 'Python programming' is too broad. 'Writing database migration scripts in Python' is the right level.
3. Include relationship skills: who is the person that vendor X calls when something goes wrong? Who is the person that the executive team trusts to present results? These are skills.
4. Categorize each skill: technical (tools, languages, systems), process (how things get done), relationship (who knows whom), domain-knowledge (understanding of the business area).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
