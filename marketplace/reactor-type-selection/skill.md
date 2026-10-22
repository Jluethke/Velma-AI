# Reactor Type Selection

Select the reactor type (CSTR, PFR, batch, fluidized bed) based on kinetics, selectivity, and heat transfer requirements.

## Inputs

- `rate-law`: Reaction rate expression
- `selectivity-map`: How selectivity varies with concentration and temperature
- `production-requirements`: Production rate, desired conversion, and product purity target

## Outputs

- `reactor-type`: Selected reactor type with justification
- `staging-configuration`: Number of reactors, series vs parallel, intermediate cooling or feeds
- `volume-comparison`: Levenspiel plot comparison of CSTR vs PFR volume for the target conversion

## Process

1. Construct the Levenspiel plot: plot 1/(-rA) vs conversion XA. The area under the curve gives PFR volume; the rectangle gives CSTR volume. For positive-order kinetics, PFR always requires less volume than a single CSTR.
2. For selectivity: if the desired reaction has a higher order than the side reaction, high concentration favors selectivity, so use PFR or batch. If the desired reaction has a lower order, use CSTR (backmixed, low concentration).
3. For highly exothermic reactions, evaluate heat removal capacity. CSTR has better mixing and heat transfer area per unit volume. PFR with interstage cooling is an alternative. Fluidized bed provides excellent heat transfer for gas-phase catalytic reactions.
4. For very slow reactions or small-scale production, batch reactors allow long residence time without large continuous equipment. Semi-batch allows controlled addition for exothermic or selectivity-sensitive reactions.
5. Consider multiple CSTRs in series as a practical compromise: each CSTR approaches PFR performance as the number of stages increases, with the heat transfer and mixing advantages of stirred tanks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
