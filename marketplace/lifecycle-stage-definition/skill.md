# Lifecycle Stage Definition

Define the lifecycle stages a relationship passes through and the observable behaviors that characterize each stage.

## Inputs

- `relationship-context`: Whether this system is for personal contacts, sales leads, customer accounts, or a hybrid
- `contact-inventory-sample`: A sample of 20-30 contacts to use as calibration data for stage definitions

## Outputs

- `stage-definitions`: Ordered list of lifecycle stages with behavioral descriptions: stranger, acquaintance, active, trusted, advocate, dormant, lost
- `stage-indicators`: Observable signals for each stage (e.g., active = initiated contact in last 90 days AND responded within 48 hours at least twice)

## Process

1. Define each stage by what the OTHER person does, not what you do. Stranger = no mutual awareness. Acquaintance = they recognize your name but have not initiated contact. Active = bilateral communication within a defined window. Trusted = they share non-public information or make introductions unprompted. Advocate = they refer others to you or publicly endorse you. Dormant = formerly active, now silent beyond the decay threshold. Lost = dormant beyond recovery threshold or explicitly disengaged.
2. For each stage, list 2-3 concrete behavioral indicators that are observable without asking (you should not survey people to classify them). Example: Trusted is not 'I feel close to them' but 'they forwarded me a private opportunity without being asked.'
3. Classify your sample contacts into stages using only the indicators. If more than 30% land in a single stage, split that stage or tighten the criteria. If any stage has zero contacts, either the stage definition is too narrow or your network has a structural gap worth noting.
4. Write the final stage definitions as a reference card: stage name, behavioral indicators, and one sentence distinguishing it from the adjacent stages above and below.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
