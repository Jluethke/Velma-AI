# Trust Failure Handler

Handle trust failures at each level: what to do when reciprocity fails, when trust is violated, and how to recover or downgrade gracefully.

## Inputs

- `escalation-moves`: Actions for each level transition
- `reciprocity-tests`: How to verify reciprocation

## Outputs

- `failure-protocols`: For each trust level, the protocol when the other party fails to reciprocate or actively violates trust
- `recovery-pathways`: When and how to attempt recovery after a trust failure, and when to permanently downgrade

## Process

1. Define failure types by level. Level 1 failure: they do not reciprocate information sharing (not a violation, just a signal to stop escalating). Level 2 failure: they misuse an introduction or publicly undermine you (an active violation requiring downgrade). Level 3 failure: they share your strategic information without permission (a serious violation requiring immediate downgrade to level 0). Level 4 failure: they do not honor a commitment (the most severe, requiring formal resolution).
2. Build the response protocol. For non-reciprocation (passive failure): stop escalating but maintain the current level. Do not confront or withdraw, just stop investing more. For active violations: downgrade by 2 levels immediately. Communicate the downgrade through behavior change (reduce information sharing, stop making introductions), not through confrontation unless the violation requires a direct conversation.
3. Define recovery conditions. A level 1-2 failure can be recovered if the person acknowledges the issue and demonstrates changed behavior over 3+ months. A level 3-4 failure requires explicit conversation, acknowledgment, and a probationary period before any re-escalation. Some failures are permanent (deliberate betrayal of confidential information, fraud).
4. Build the cost-of-failure calculation: before each escalation move, ask 'if this fails, what do I lose?' Level 1 failure costs you nothing (you shared public-grade information). Level 4 failure costs you real resources. The escalation sequence is designed so that by the time you reach level 4, you have enough evidence of trustworthiness to make the risk rational.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
