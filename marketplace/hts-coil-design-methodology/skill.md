# Hts Coil Design Methodology

Design HTS coils: insulation strategy, joint design, screening current management, and stress handling at high field.

## Inputs

- `ic-surface-data`: Tape critical current data
- `mechanical-properties`: Tape mechanical limits
- `tape-selection`: Selected tape grade and operating point

## Outputs

- `hts-coil-design`: Coil geometry, insulation concept, and turn count
- `joint-design`: Joint resistance, mechanical design, and location strategy
- `stress-analysis-results`: Peak stress and strain in conductor and structure

## Process

1. Choose insulation strategy. No-insulation (NI): tape-to-tape contact provides natural quench self-protection through turn-to-turn current sharing. Drawback: slow field ramp (minutes due to eddy currents), screening current field errors. Metal-insulation: thin stainless steel co-wound strip for controlled turn-to-turn resistance. Partial-insulation: hybrid approach.
2. Design joints between tape lengths (finite tape length ~300-1000m from manufacturing). Lap joint with solder: joint resistance ~10-100 nOhm at 4.2K per 10cm overlap. Mechanical press joints: demountable, higher resistance. Joint heating = I^2 * R must be within cooling budget.
3. Address screening currents: large magnetization currents flow in the wide REBCO tape perpendicular to the transport current. These create field errors (especially problematic for accelerator and NMR magnets) and cause AC losses. Striation (laser-cutting tape into narrow filaments) reduces magnetization proportionally.
4. Stress analysis: at 20T, Lorentz force creates hoop stress sigma_hoop = J * B * R in the winding. For a compact coil, peak stress can reach 200-400 MPa. The Hastelloy substrate handles this but epoxy-impregnated windings may crack. External reinforcement (steel banding, structural rings) may be needed.
5. Quench protection for HTS: quench propagation is extremely slow in HTS (mm/s vs m/s in LTS) due to high heat capacity and high current sharing. Detection is hard. No-insulation coils self-protect. Insulated HTS coils need active protection: CLIQ (coupling loss induced quench), heaters on every pancake, or novel approaches.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
