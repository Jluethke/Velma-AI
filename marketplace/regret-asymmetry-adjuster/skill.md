# Regret Asymmetry Adjuster

Apply the regret asymmetry adjustment. Because people systematically under-weight inaction regret at the time of the decision (it feels less urgent than action regret), add a correction factor. If your raw inaction-regret score is within 2 points of your action-regret score, the inaction regret is probably higher than you think.

## Inputs

- `action-regret-estimate`: Regret of trying and failing
- `inaction-regret-estimate`: Regret of never trying

## Outputs

- `adjusted-regret-comparison`: The regret comparison after applying the asymmetry correction
- `regret-verdict`: Which regret is likely to be worse over a lifetime, and by how much

## Process

1. If inaction-regret is 3+ points higher than action-regret: the signal is clear. Inaction is the bigger risk.
2. If the scores are within 2 points: apply the asymmetry correction. Research says your inaction-regret is likely 2 points higher than you estimated. Adjust accordingly.
3. If action-regret is significantly higher: this is a genuine case where the action carries real, lasting downside. Respect that signal.
4. Produce the adjusted comparison with the verdict.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
