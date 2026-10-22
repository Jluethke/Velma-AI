# Re Engagement Trigger Designer

Design the triggers that fire when a relationship enters the decay window, prompting action before the relationship downgrades.

## Inputs

- `decay-schedule`: Per-stage decay timelines
- `decay-modifiers`: Factors that slow or accelerate decay

## Outputs

- `trigger-rules`: The specific conditions that fire a re-engagement prompt, including the timing relative to the decay deadline
- `re-engagement-actions`: The suggested actions for each trigger, calibrated to the relationship stage and the person's communication preferences

## Process

1. Set triggers at 50% and 80% of the decay window. At 50%, the prompt is informational ('you have not talked to X in Y days'). At 80%, the prompt is urgent ('X will downgrade to [lower stage] in Z days unless you make contact').
2. Design re-engagement actions by stage. For active relationships approaching acquaintance, a low-effort touchpoint works (share an article relevant to their interests, comment on something they posted). For trusted relationships approaching active, a higher-effort touchpoint is needed (schedule a call, send a personal note referencing a specific shared experience).
3. Build in a context-sensitive suggestion engine: the trigger should include what you last talked about (from the interaction log), what they care about (from their profile), and a specific conversation starter. 'You should reconnect with Sarah' is useless. 'Sarah mentioned she was evaluating new vendors last time you spoke in March, and her company just posted a procurement role' is actionable.
4. Set a do-not-disturb override: some relationships are intentionally dormant (you are maintaining distance from a former colleague, or a client relationship ended cleanly). Mark these as 'parked' so the system does not nag you to re-engage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
