# Mitigation Stress Test

Stress-test each mitigation by asking: 'In the failure story, would this mitigation actually have prevented the failure?' Run a second round of failure story generation, this time assuming the mitigations are in place. If the same themes reappear, the mitigations are insufficient.

## Inputs

- `mitigation-plan`: The mitigations designed for top failure themes
- `framed-plan`: The original plan statement

## Outputs

- `stress-test-results`: For each mitigation: whether it survived the stress test, and what gaps remain
- `revised-mitigation-plan`: Updated mitigations after incorporating stress test findings

## Process

1. For each mitigation, write a new failure story that assumes the mitigation is in place. Does the plan still fail?
2. If yes, the mitigation addresses a symptom, not the root cause. Redesign it.
3. If no, the mitigation is likely adequate. Keep it.
4. Look for new failure modes that only become visible once the original modes are mitigated (second-order risks).
5. Produce the revised mitigation plan incorporating all stress test findings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
