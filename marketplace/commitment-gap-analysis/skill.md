# Commitment Gap Analysis

Find the places where the ask jumps too far too fast and the buyer drops off.

## Inputs

- `ask-inventory`: Every ask in sequence
- `commitment-sizes`: The size of each ask

## Outputs

- `commitment-gaps`: The transitions where the commitment size jumps sharply
- `drop-off-points`: Where buyers actually leave, matched against the gaps

## Process

1. Walk the sequence and measure the jump in commitment between each ask and the next.
2. Flag the transitions where the jump is large, since those are where consistency breaks.
3. Overlay any real drop-off data you have and see whether drops line up with the large jumps.
4. Rank the gaps by how much pipeline they cost, so the biggest leak gets fixed first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
