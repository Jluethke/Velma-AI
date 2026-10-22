# Weight Calibration Engine

Set the dimension weights based on context and calibrate them against your actual prioritization behavior.

## Inputs

- `dimension-definitions`: The 5 scoring dimensions with calculation methods
- `data-gap-assessment`: Where data is incomplete

## Outputs

- `weight-profiles`: Weight sets for different contexts: personal networking, sales, customer success, general purpose
- `calibration-results`: How well the weighted score matches your actual prioritization when tested against known contacts

## Process

1. Set default weights by context. Personal networking: recency 15%, frequency 15%, mutual value 35%, momentum 15%, strategic importance 20%. Sales: recency 20%, frequency 15%, mutual value 10%, momentum 30%, strategic importance 25%. Customer success: recency 25%, frequency 20%, mutual value 15%, momentum 25%, strategic importance 15%. The key difference: personal relationships weight mutual value highest; sales weights momentum highest.
2. Calibrate against your gut. Take your 10 most important contacts and your 10 least important. Score them with the default weights. If a contact you consider critical scores low, the weights are wrong. Adjust until the score ranking roughly matches your intuition for these 20 calibration contacts.
3. Test the weights against the middle of your list (contacts 11-30 by your gut ranking). These are the contacts where the score should teach you something. If the score ranks someone higher than your gut says, investigate: maybe you are undervaluing them. If lower, maybe the score is missing context that the weights should capture.
4. Set a re-calibration schedule: review weights quarterly. Priorities shift. A personal contact who becomes a business contact needs different weighting. A customer success context that shifts from retention to expansion changes which dimensions matter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
