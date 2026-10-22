# Proficiency Assessor

For each person on the team, rate their proficiency on each skill: learning (can do it with help), competent (can do it independently), expert (can teach others and handle edge cases). Use self-assessment cross-referenced with peer assessment. Self-assessment alone is unreliable because of the Dunning-Kruger effect.

## Inputs

- `skill-inventory`: The complete list of skills the team needs
- `skill-categories`: Skills grouped by category

## Outputs

- `proficiency-matrix`: A matrix with team members as rows, skills as columns, and proficiency level (learning, competent, expert) in each cell
- `assessment-confidence`: How confident the assessment is for each cell (high if both self and peer agree, low if they diverge)

## Process

1. Send each team member the skill inventory and ask them to rate themselves on each skill: learning, competent, or expert.
2. For each skill, ask 1-2 peers to validate the self-assessment. The peer check is: would you trust this person to handle [specific task requiring this skill] independently?
3. Where self-assessment and peer assessment diverge, default to the peer assessment. People who rate themselves as expert when peers say competent are overestimating. People who rate themselves as learning when peers say competent are underestimating.
4. Flag any cell where confidence is low (self and peer diverge by 2 levels). These need a practical test to resolve.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
