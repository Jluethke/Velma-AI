# Re Engagement Sequence Builder

Build re-engagement sequences for dormant contacts, where each step escalates in novelty and value to break through the silence.

## Inputs

- `segment-cadences`: Follow-up intervals by segment
- `individual-overrides`: Contact-level interval adjustments

## Outputs

- `re-engagement-sequences`: Step-by-step sequences for re-engaging dormant contacts, with timing and content type for each step
- `exit-criteria`: When to stop the sequence and either release the contact or escalate to a different channel

## Process

1. Design a 4-step sequence with escalating novelty. Step 1 (day 0): low-effort, high-relevance touchpoint (share something specifically relevant to them, not a generic 'checking in'). Step 2 (day 14): different channel than step 1 (if step 1 was email, step 2 is a text or social media comment). Step 3 (day 30): offer something of value with no ask (an introduction, a resource, a piece of information they would care about). Step 4 (day 45): the direct ask ('I have not heard from you, are you still interested in [specific thing]?').
2. The key principle: each step must be MORE novel and MORE valuable than the last. Generic 'just checking in' messages at every step teach the contact to ignore you. Escalating novelty earns attention. If you cannot think of something novel for step 3, that tells you the relationship may not have enough substance to reactivate.
3. Define the exit criteria. After step 4 with no response: mark the contact as lost (not dormant). After any step with a response: exit the sequence and resume normal cadence. After step 2 with a 'not interested' response: mark as lost and set a 6-month re-evaluation reminder.
4. Build a separate re-engagement sequence for high-value dormant contacts where the stakes justify more effort. This sequence gets 6 steps, longer gaps (21 days between steps), and includes a personal gesture (handwritten note, relevant gift, in-person drop-by if geographically feasible).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
