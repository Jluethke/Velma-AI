# Pv Cell Architecture Selection

Select the cell architecture and material system based on efficiency targets, manufacturing maturity, and cost constraints.

## Inputs

- `efficiency-target`: Target cell and module efficiency
- `manufacturing-constraints`: Throughput, capex budget, and existing equipment compatibility
- `application-requirements`: Residential rooftop, utility-scale, building-integrated, or space

## Outputs

- `cell-architecture`: Selected architecture (PERC, TOPCon, HJT, IBC, tandem) with efficiency potential
- `material-system`: Wafer type (p-type/n-type, Cz/FZ), thickness, and resistivity
- `efficiency-loss-budget`: Breakdown of losses from the Shockley-Queisser limit to achievable efficiency

## Process

1. Start from the Shockley-Queisser limit: 33.7% for a single-junction cell at 1.34 eV bandgap (silicon at 1.12 eV gives 29.4% SQ limit). The loss budget from SQ to real cells: thermalization (largest loss, 30% of incident energy), sub-bandgap transparency (20%), Carnot loss, and emission loss. From the SQ limit to the practical limit (~29%): recombination at surfaces and in the bulk, optical losses (reflection, grid shading, parasitic absorption), and resistive losses (series resistance in fingers and busbars).
2. Evaluate architectures by current efficiency records and manufacturing status. PERC (passivated emitter and rear contact): the baseline, 23-24% production cells, fully mature, p-type Cz wafers. TOPCon (tunnel oxide passivated contact): 25-26% production cells, emerging standard, n-type Cz wafers, higher Voc from better rear passivation. HJT (heterojunction with intrinsic thin layer): 25-26%, low-temperature process (< 200C), symmetric structure (bifacial), but silver paste cost is high and the thin amorphous layers are sensitive to process. IBC (interdigitated back contact): 26%+, no front grid shading, but complex patterning. Perovskite-silicon tandem: 33%+ in lab, not yet in production.
3. Select the wafer. The industry is transitioning from p-type to n-type silicon. N-type advantages: no light-induced degradation (no boron-oxygen complex), higher bulk lifetime (> 1 ms), better surface passivation with typical stacks. Wafer thickness is decreasing from 180um toward 130um to reduce silicon usage and cost. Thinner wafers need better surface passivation (both sides) because the surface-to-volume ratio increases.
4. Build the efficiency loss budget. For a TOPCon cell on 150um n-type Cz: SQ limit 29.4% - Auger recombination 1.5% - surface recombination 0.5% - reflection loss 1% - grid shading 1.5% - series resistance 0.5% - contact recombination 0.5% = approximately 24-25% production efficiency. Each loss category maps to a specific design or process improvement opportunity.
5. Consider bifaciality. For ground-mounted utility-scale, bifacial cells harvest reflected light from the ground (albedo). Bifaciality factor (rear efficiency / front efficiency): 70-85% for PERC (aluminum BSF on rear limits rear performance), 85-95% for TOPCon and HJT (passivated rear). Bifacial gain in energy yield: 5-15% depending on albedo, mounting height, and row spacing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
