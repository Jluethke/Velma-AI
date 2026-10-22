# Network Effect Value Interaction Identification

Identify the one user-to-user interaction that most creates value as more users join. Most products have many possible interactions but one that truly drives the network effect. Find that one.

## Inputs

- `product-profile`: A profile of the product and its users
- `interaction-candidates`: The user-to-user interactions that could create value

## Outputs

- `core-interaction`: The single interaction that drives the network effect
- `value-mechanism`: How that interaction turns more users into more value per user

## Process

1. For each candidate interaction, ask whether it makes the product better for a user when more users join.
2. Keep the interactions that pass and discard the rest.
3. Pick the single interaction with the strongest link between more users and more value per user.
4. Describe the mechanism: exactly how added users raise the value each user gets.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
