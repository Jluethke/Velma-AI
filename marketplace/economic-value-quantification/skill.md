# Economic Value Quantification

Quantify the total economic value your product delivers per year per customer.

## Inputs

- `customer-economics`: How the customer's economics work
- `value-mechanism`: How your product creates value

## Outputs

- `annual-value-per-customer`: The dollar amount of value your product creates per customer per year (the value ceiling)
- `value-confidence`: How confident you are in this number (based on how many customers confirmed it)

## Process

1. Calculate the annual value using the formula: [quantity of value unit saved/gained per week] x [dollar value per unit] x 52 weeks.
2. Include all value mechanisms, not just the primary one. If your product saves time AND reduces errors AND improves quality, sum all three.
3. Discount for risk: if the value depends on the customer using the product correctly (which not all will), reduce the number by the expected adoption rate.
4. The result is the value ceiling: the maximum the customer should be willing to pay if they captured 100% of the value. Your price will be a fraction of this.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
