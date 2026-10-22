# Knowledge Layer Audit

Audit the three knowledge layers in the organization: documented knowledge (what is written down in procedures), captured decisions (which decisions have recorded reasoning), and recorded expertise (what lives only in people's heads).

## Inputs

- `organization-context`: Description of the organization, its size, key functions, and where knowledge lives today
- `turnover-risk-areas`: Roles or functions where departure of a key person would cause the most damage

## Outputs

- `documented-knowledge-inventory`: List of existing documented procedures, policies, and guides with currency assessment (current, stale, missing)
- `decision-coverage-gap`: Assessment of which important decisions have recorded reasoning and which do not

## Process

1. Inventory all existing documentation: wikis, runbooks, SOPs, policies, onboarding guides. For each document, note the last update date and whether someone has verified its accuracy in the last 6 months.
2. Identify the top 20 decisions that shaped how the organization operates today. For each, check: is the reasoning recorded anywhere? Can a new person find it? Most organizations find that fewer than 5 of 20 have recorded reasoning.
3. Identify the top 10 people whose departure would cause the most knowledge loss. These are the knowledge holders whose expertise is not documented.
4. Score each area: green (documented and current), yellow (partially documented or stale), red (undocumented, lives in one person's head).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
