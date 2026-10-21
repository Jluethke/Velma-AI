# Pcr Optimizer

Optimize PCR conditions including annealing temperature, cycle count, MgCl2 concentration, and template input to maximize yield and specificity.

## Inputs

- `primer-pairs`: Selected primer pair sequences from the design step
- `template-dna`: Description of template DNA source, concentration, and quality metrics
- `polymerase-type`: Enzyme type and manufacturer (e.g. Taq, Phusion, Q5)

## Outputs

- `optimized-protocol`: Final PCR protocol with temperatures, times, cycle count, and reagent volumes
- `gradient-results`: Annealing temperature gradient results showing optimal temperature
- `troubleshooting-notes`: Common failure modes and recommended adjustments if bands are weak or nonspecific

## Process

1. Calculate theoretical optimal annealing temperature from primer Tm values
2. Design a gradient PCR experiment spanning +/- 5C around the theoretical optimum
3. Set up MgCl2 titration at the optimal annealing temperature (1.0, 1.5, 2.0, 2.5 mM)
4. Evaluate band intensity and specificity on a quick agarose check gel
5. Document the final optimized protocol with all reagent concentrations and cycling parameters

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
