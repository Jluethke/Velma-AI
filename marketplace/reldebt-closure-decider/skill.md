# Reldebt Closure Decider

Decide, for every relationship on the audit, whether to recover it or release it, and log the decision, so the audit ends with a cleared ledger: active reconnection for the ones worth it, conscious closure for the rest, and no lingering open loops silently draining energy.

## Inputs

- `reconnect-drafts`: The specific reconnection messages
- `reconnect-hooks`: The concrete hook behind each message

## Outputs

- `recover-or-release-decisions`: For each relationship: recover (send the reconnect) or release (consciously let it rest), with the reasoning
- `debt-clearance-log`: A record of what was sent, what was released, and which open loops were closed, so the audit has a clean endpoint

## Process

1. Make an explicit recover-or-release call for every name, including the ones you are not reconnecting with. Leaving a name undecided is how it drifts back onto the mental list and resumes draining energy.
2. For recover decisions, send the reconnection message rather than letting it sit as a perfect unsent draft. An imperfect message sent today beats a polished one that never goes out, which is how the debt accumulated in the first place.
3. For release decisions, close any open loop first where it is owed. Even when you are letting a relationship rest, sending the overdue apology or acknowledgment closes the loop so it stops surfacing in your mind.
4. Log every outcome: sent, released, loop closed. The log is the point. An audit that ends with a clear record of what you did is a cleared debt, and you can re-run it in a year against a clean slate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
