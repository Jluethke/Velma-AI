# Response Protocol Builder

For each leading indicator, define what to do when it moves. A leading indicator without a response protocol is a weather forecast you never check before leaving the house. Define the threshold that triggers a response, the specific response, and who executes it.

## Inputs

- `indicator-schedule`: The indicators with their cadences and owners
- `defined-outcome`: The outcome goal, for calibrating response thresholds

## Outputs

- `response-protocols`: For each indicator: the green/yellow/red thresholds, the specific action triggered at yellow and red, and the person who executes it
- `leading-indicator-system`: The complete system: indicators, cadences, thresholds, and response protocols, ready to operate

## Process

1. For each indicator, calculate the value range that corresponds to being on track for the outcome goal. That is the green zone. The boundary where the outcome becomes at risk is the yellow threshold. The point where the outcome is unlikely without intervention is the red threshold.
2. For yellow: define a diagnostic action (investigate why the indicator dropped, check if it is noise or real). For red: define a corrective action (change the input, reallocate resources, escalate).
3. Test the system by walking through a scenario: the indicator drops to yellow on Tuesday. Who sees it? What do they do? By when? If the answer is 'nobody' or 'nothing,' the system is not real.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
