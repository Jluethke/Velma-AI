# Second Order Consequence Mapper

For each first-order consequence, ask: 'And then what happens?' The answers are the second-order consequences. These are the effects that most people do not consider. Second-order effects often cancel out or reverse the first-order benefits. This is where the real decision gets made.

## Inputs

- `first-order-map`: The first-order consequences for each option

## Outputs

- `second-order-map`: For each first-order consequence: the second-order effects that follow from it
- `reversal-alerts`: Second-order effects that cancel out or reverse a first-order benefit

## Process

1. Take each first-order consequence and ask: 'Because this happened, what happens next?'
2. Follow the chain for each stakeholder affected. A first-order benefit to one group often creates a second-order cost to another.
3. Flag any second-order effect that reverses a first-order benefit. Example: hiring fast (first-order benefit: more capacity) causes culture dilution (second-order cost: lower output per person).
4. Check for second-order effects that create feedback loops (positive or negative spirals).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
