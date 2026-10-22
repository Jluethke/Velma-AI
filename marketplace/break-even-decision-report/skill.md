# Break Even Decision Report

Produce the break-even decision report with the verdict: proceed, proceed with conditions, or do not proceed.

## Inputs

- `break-even-units`: Break-even volume
- `break-even-time`: Break-even time at expected rate
- `break-even-probability`: Probability of breaking even
- `key-sensitivity-variable`: The variable that matters most

## Outputs

- `break-even-verdict`: Proceed (probability above 70%, time within planning horizon), proceed with conditions (probability 40-70%, must manage the key sensitivity variable), or do not proceed (probability below 40% or time exceeds planning horizon)
- `break-even-report`: The complete analysis: cost structure, basic break-even, time to break-even, probability estimate, sensitivity analysis, and the verdict with conditions

## Process

1. Apply the decision framework: if break-even probability is above 70% and break-even time is within the planning horizon, the verdict is proceed. If probability is 40 to 70%, proceed with conditions (specifically: monitor the key sensitivity variable and define the bail-out point). If probability is below 40%, do not proceed.
2. For a 'proceed with conditions' verdict, write the specific conditions: what value of the key sensitivity variable triggers a reassessment, how often to check it, and what the exit plan is if the condition is breached.
3. Quantify the downside: if the investment does not break even, what is the maximum loss? This is the total fixed cost plus the net variable losses accumulated before you would realistically stop. This is the amount you are risking.
4. Produce the final report with all sections: investment description, cost structure, break-even volume and time, probability estimate, sensitivity analysis, verdict, conditions, downside quantification, and the monitoring schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
