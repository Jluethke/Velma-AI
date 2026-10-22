# Disruption Scenario Definer

Define the disruption scenarios that trigger the continuity plan.

## Inputs

- `impact-analysis`: The impact analysis with MTDs and RTOs
- `operation-description`: The operation context

## Outputs

- `trigger-scenarios`: The defined scenarios that activate the plan: facility loss, key person absence, technology failure, supply chain disruption, cyber incident, natural disaster
- `scenario-severity-levels`: For each scenario: severity levels (partial, major, total) with the criteria for each level

## Process

1. Define the scenario categories: facility loss (fire, flood, denied access), key person absence (illness, departure, incapacitation), technology failure (system outage, data loss, ransomware), supply chain disruption (vendor failure, logistics breakdown), and natural disaster (earthquake, hurricane, pandemic).
2. For each category, define the severity levels: partial (one function affected, others continue), major (multiple functions affected, some continue at reduced capacity), total (all critical functions stopped).
3. Define the activation criteria: who decides the plan is activated, based on what evidence, within what timeframe?
4. Map each scenario to the affected critical activities using the impact analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
