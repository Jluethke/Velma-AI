# Anonymized Example Assembler

Assemble a set of anonymized work examples that span the rating scale. These shared examples are what managers will rate independently, so they must be stripped of identity and cover the range from weak to exceptional.

## Inputs

- `rating-cycle-scope`: The team and cycle being calibrated
- `work-samples`: Real work examples available from across the team

## Outputs

- `example-set`: Anonymized examples spanning the full scale, including borderline cases between levels
- `example-answer-key`: A private record of how each example was originally rated, held back from the managers for now

## Process

1. Collect real work examples from across the team that represent different performance levels.
2. Strip every example of names, teams, and identifying detail so no manager recognizes the author.
3. Choose a set that spans the full scale, including borderline cases between levels, since those are where calibration matters most.
4. Record a private key of how each example was originally rated, to compare against later, without showing it to the managers yet.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
