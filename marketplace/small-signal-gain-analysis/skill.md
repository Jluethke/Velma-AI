# Small Signal Gain Analysis

Derive the small-signal voltage gain from the DC operating point by building the small-signal equivalent circuit and identifying the dominant gain-limiting mechanism.

## Inputs

- `bias-conditions`: Vgs, Vds, Id, W/L for every transistor, confirming saturation
- `selected-topology`: The amplifier topology with device roles

## Outputs

- `voltage-gain`: The open-loop voltage gain Av = Vout/Vin in magnitude and dB, with the analytical expression showing which parameters dominate
- `output-resistance`: The output resistance Rout of the amplifier stage, which sets the gain when driving resistive loads

## Process

1. Replace each transistor with its small-signal model: a voltage-controlled current source gm*vgs in parallel with output resistance ro = VA/Id (or 1/gds from simulation). Include body effect gmb = chi*gm where chi = gamma/(2*sqrt(2*phi_f + Vsb)) if the source is not tied to the bulk.
2. For a common-source stage: Av = -gm * (ro || Rload). For a cascode: Av = -gm1 * (gm2*ro2*ro1 || Rload), where the cascode boosts output resistance to gm2*ro2*ro1. For a differential pair with active current mirror load: Av = gm * (rop || ron), where rop and ron are the output resistances of the PMOS and NMOS sides.
3. For a two-stage OTA: Av_total = Av1 * Av2, where Av1 = gm1*(rop1||ron1) for the first stage and Av2 = gm_second*(rop2||ron2) for the second. Gains of 60 to 80 dB are typical for two-stage Miller-compensated OTAs in 180nm CMOS.
4. Identify the gain-limiting element. In most cases it is the output resistance of the current source (finite ro). If the load is resistive and Rload << ro, then Av is approximately -gm*Rload and increasing ro does not help.
5. Cross-check the hand-calculated gain against the gm/Id methodology prediction: Av = (gm/Id) * Id * Rout. If the calculated gain falls short of the spec, the options are: increase gm (more current or larger W/L), increase Rout (cascode or gain-boosting), or add a second stage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
