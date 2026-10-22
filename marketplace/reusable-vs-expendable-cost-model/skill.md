# Reusable Vs Expendable Cost Model

Build an economic model comparing reusable and expendable vehicle cost as a function of flight rate, refurbishment cost, and recovery logistics.

## Inputs

- `vehicle-production-cost`: Cost to manufacture one stage (expendable reference)
- `refurbishment-scope`: Refurbishment cost per flight
- `payload-penalty`: Payload reduction from landing propellant reserve

## Outputs

- `cost-per-flight-vs-reuse-count`: Cost per flight as a function of how many times a stage flies
- `breakeven-flight-count`: Number of flights per stage where reusable becomes cheaper than expendable
- `fleet-economics`: Cost model for a fleet of reusable stages at a given annual flight rate

## Process

1. Expendable cost per flight: production cost + integration + launch operations. For a Falcon 9-class vehicle, first stage production is roughly 60-70% of total vehicle cost. Upper stage, fairing, and integration are the rest.
2. Reusable cost per flight: (production cost / number of flights) + refurbishment cost per flight + recovery operations cost. If a stage costs $30M to build, flies 10 times, and costs $2M per refurbishment + $1M recovery: cost per flight = $3M + $2M + $1M = $6M vs $30M expendable. Breakeven at about 3-4 flights.
3. The learning curve effect: as flight rate increases, production and refurbishment teams become more efficient. Wright's law: each doubling of cumulative production reduces unit cost by 15-20%. At 50+ flights per year, the cost reduction from volume is significant even for expendable vehicles.
4. Flight rate sensitivity: reusable stages have fixed costs (the stage hardware, amortized) and variable costs (refurbishment, recovery). At low flight rates, the amortized hardware cost per flight is high and reusability may not pay off. At high flight rates, the hardware is nearly free per flight and the variable costs dominate. SpaceX's cost advantage grows with their flight rate.
5. Payload penalty cost: the customer pays for the payload they need to orbit. If reusability reduces payload capacity by 30%, some missions that fit on an expendable vehicle require a larger (more expensive) reusable vehicle or a two-stage upper stage. Model the customer-facing price to include the payload penalty scenario.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
