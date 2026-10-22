# Consequence Tree Comparison

Compare the full consequence trees across options. The option that looks best at the first-order level often looks different at the second-order level. Produce the comparison table and highlight where the ranking of options changes as you go deeper in the tree.

## Inputs

- `first-order-map`: First-order consequences per option
- `second-order-map`: Second-order consequences per option
- `third-order-flags`: Third-order flags per option
- `tail-risk-list`: Tail risks per option

## Outputs

- `consequence-comparison`: Side-by-side comparison of all options across all three consequence levels
- `ranking-shifts`: Where the ranking of options changes between first-order and deeper analysis

## Process

1. Build a comparison table: options as columns, consequence levels as rows.
2. For each option, summarize the net effect at each level (net positive, net negative, mixed).
3. Identify where the option that looked best at the first-order level drops at the second or third level.
4. Produce the ranking at each level. If the ranking changes, that is the key finding: the obvious choice is not the best choice.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
