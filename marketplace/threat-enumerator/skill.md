# Threat Enumerator

For each asset, enumerate the threats: who or what could cause its loss, damage, or exposure.

## Inputs

- `asset-inventory`: The list of assets to protect
- `crown-jewels`: The highest-priority assets

## Outputs

- `threat-catalog`: For each asset: the threats, categorized as intentional (malicious actors), accidental (human error), systemic (system failure), and environmental (natural events)
- `threat-actor-profiles`: For intentional threats: the actor's motivation, capability, and access level

## Process

1. For each asset, brainstorm threats in four categories: intentional (theft, fraud, sabotage, espionage), accidental (human error, misconfiguration, data loss), systemic (hardware failure, software bug, vendor outage), and environmental (fire, flood, earthquake, pandemic).
2. For intentional threats, profile the actor: what is their motivation (financial gain, revenge, curiosity, ideology), what is their capability (script kiddie, organized crime, insider, nation-state), and what access do they have (outsider, customer, employee, administrator)?
3. Focus the analysis on the crown jewels. Every asset deserves a threat scan, but the crown jewels deserve a deep one.
4. Remove implausible threats (a household does not need to model nation-state actors). Keep the analysis grounded in the scope.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
