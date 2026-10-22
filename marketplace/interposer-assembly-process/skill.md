# Interposer Assembly Process

Define the assembly sequence for the 2.5D interposer package, including die attach, underfill, and substrate integration.

## Inputs

- `warpage-prediction`: Warpage at each process step
- `warpage-mitigation`: Design mitigations applied

## Outputs

- `assembly-sequence`: Step-by-step assembly process with equipment, materials, and process parameters
- `assembly-yield-model`: Expected yield at each assembly step and overall assembly yield

## Process

1. Step 1: Die attach to interposer. Place chiplets on interposer using high-accuracy pick-and-place (< 2um accuracy for micro-bump). Mass reflow or thermocompression bonding depending on bump type.
2. Step 2: Underfill between dies and interposer. Capillary underfill for micro-bump (control fillet height to avoid contaminating adjacent die sites). Cure at specified temperature and time.
3. Step 3: Interposer backside processing if needed (backside RDL, C4 bump for substrate attach). Interposer is thinned to target thickness (50-100um) before or after die attach depending on process flow.
4. Step 4: Attach interposer assembly to organic substrate. C4 bump reflow (typically 100-150um pitch). Underfill between interposer and substrate.
5. Step 5: Lid attach with TIM1 (between dies and lid) and adhesive (lid to substrate). BGA ball attach to substrate bottom. Final test and singulation if panelized. Estimate yield per step: typically 98-99.5% per reflow and underfill step.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
