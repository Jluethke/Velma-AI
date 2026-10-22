# Outcome Milestone Designer

Convert activity milestones into outcome milestones by asking: 'What is true about the world after this milestone that was not true before?'

## Inputs

- `initiative-description`: The initiative and its deliverables
- `current-milestones`: The existing milestone list (which may be activity-based)

## Outputs

- `outcome-milestones`: Each milestone restated as an outcome: a condition in the world that is verifiable by someone who is not on the project team
- `verification-methods`: For each outcome milestone: how to verify it (test, demonstration, user trial, data query, external review)

## Process

1. For each existing milestone, ask: 'Is this an activity or an outcome?' An activity is something the team does (write code, conduct research, build a report). An outcome is something that is true afterward (users can log in, the report answered the board's three questions, the system handles 1000 requests per second).
2. Restate activity milestones as outcomes: 'Code complete' becomes 'All automated tests pass and the feature is deployed to staging.' 'Research complete' becomes 'The research answered the three defined questions with cited evidence.'
3. Define the verification method for each outcome: who verifies, how they verify, and what constitutes a pass or fail. The verifier should ideally be someone outside the project team.
4. If a milestone cannot be stated as a verifiable outcome, it is a checkpoint, not a milestone. Checkpoints are useful for coordination but should not be confused with progress.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
