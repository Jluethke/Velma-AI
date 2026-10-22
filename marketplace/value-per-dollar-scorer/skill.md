# Value Per Dollar Scorer

Score each subscription on value per dollar: cost per actual use, replacement cost analysis, and a composite score.

## Inputs

- `subscription-inventory`: All subscriptions with monthly costs
- `usage-data`: Usage frequency and purpose for each

## Outputs

- `scored-subscriptions`: Each subscription with: cost per use, replacement cost (free alternative, one-time purchase, or nothing), and a composite score from 0 (should cancel) to 100 (clearly worth keeping)
- `quartile-ranking`: Subscriptions divided into 4 quartiles by score: top quartile (keep), upper-middle (keep), lower-middle (renegotiate), bottom (cancel)

## Process

1. Calculate cost per use: monthly cost divided by uses per month. A $15/month service used twice a month costs $7.50 per use. A $15/month service used daily costs $0.50 per use.
2. Research the replacement cost: could a free alternative serve the same purpose? Could a one-time purchase replace the recurring cost? Or is there no replacement (the subscription is the only option)? Record the specific alternative.
3. Calculate the composite score: start at 50. Add points for: daily use (+20), no free alternative (+15), multiple users benefiting (+10), directly produces revenue or saves measurable time (+15). Subtract points for: unused in last 30 days (-30), free alternative exists (-20), only one person uses it on a multi-seat plan (-15), purpose is vague (-10).
4. Rank all subscriptions by composite score and divide into quartiles. The bottom quartile is the cancellation list. The lower-middle quartile is the renegotiation list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
