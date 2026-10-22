# Job Description Rewriter

Rewrite the job description to match the real profile. The original job description was a guess. The synthesized profile is evidence. Replace the guessed requirements with the pattern-derived ones. This will feel uncomfortable because the new description will look different from the old one. That is the point.

## Inputs

- `synthesized-profile`: The evidence-based hiring profile
- `confidence-levels`: How strong the evidence is for each element

## Outputs

- `revised-job-description`: The rewritten job description reflecting what the role actually requires, based on evidence from top performers
- `screening-criteria`: Specific, observable criteria derived from the profile that can be used to screen candidates, replacing vague requirements like 'team player' or 'self-starter'

## Process

1. Compare the synthesized profile against the current job description line by line. For each requirement in the current description: does it appear in the profile? If not, remove it or mark it as optional.
2. For each element in the profile that is not in the current description: add it, with specific language. Replace 'strong communication skills' with the actual communication behavior the top performers described.
3. Write screening criteria that are observable in a resume, cover letter, or phone screen. 'Built cross-functional relationships in previous roles' is observable. 'Team player' is not.
4. Flag: the revised description will attract different candidates than the old one. That is correct. The old description was attracting people who matched a guess, not people who match reality.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
