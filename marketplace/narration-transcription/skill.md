# Narration Transcription

Transcribe the narration into an ordered sequence of steps and pull out the decision points where the work branches. The transcript is raw material; the structure comes from separating actions from the choices between them.

## Inputs

- `narration-recording`: The doer's spoken walkthrough
- `task-scope`: The bounded start and end

## Outputs

- `raw-step-sequence`: The task as an ordered list of actions
- `decision-points`: Places where the doer chose between paths

## Process

1. Transcribe the narration and break it into discrete, ordered actions.
2. Separate each action from the reasoning attached to it.
3. Mark every point where the doer chose one path over another and note the condition.
4. Keep the doer's own terms so the draft stays faithful to the real work.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
