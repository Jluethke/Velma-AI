# Pv Metallization And Module

Design the metallization pattern and integrate the cell into a module with appropriate encapsulation for 25-year reliability.

## Inputs

- `cell-architecture`: Cell structure and contact requirements
- `junction-formation-recipe`: Emitter sheet resistance determining contact difficulty
- `efficiency-loss-budget`: Allowable grid shading and series resistance losses

## Outputs

- `metallization-design`: Grid pattern, finger width, busbar design, and paste selection
- `module-design`: Cell-to-module assembly, encapsulant, backsheet, and frame specification
- `reliability-qualification-plan`: IEC 61215 test sequence and expected degradation

## Process

1. Design the front grid pattern. Finger width is limited by screen printing (currently 25-35 um for fine-line). Finger spacing optimizes the trade-off: closer spacing reduces resistive loss in the emitter (current travels less distance laterally) but increases shading loss. The optimal spacing: d = sqrt(2 * rho_sheet * w_finger / (J_sc * R_finger)) where rho_sheet is emitter sheet resistance, w_finger is printed width, J_sc is short-circuit current density, R_finger is finger line resistance per length. Multi-busbar (MBB) with 9-16 round wires reduces both bubar shading and finger length.
2. Select the metallization paste. Front: silver paste for contact to the emitter (must fire through the SiNx ARC at 750-800C peak firing temperature). Contact resistance target: < 1 mOhm*cm^2. For TOPCon rear: silver or silver-aluminum paste contacting the doped polysilicon. Paste cost is significant (silver at $1000/kg, 50-100 mg per cell). Copper plating is an alternative (lower cost, finer lines, lower resistance) but requires a seed layer and plating equipment.
3. Fire the metallization. Co-firing in a belt furnace with a carefully profiled temperature ramp: 1) burnout zone (400-500C, organic binders removed), 2) firing zone (750-800C peak for 1-3 seconds, silver frit etches through ARC and forms contact to silicon), 3) rapid cooling. The peak temperature window is narrow: too low gives poor contact, too high causes aluminum spiking or junction shunting. In-line process monitoring by Suns-Voc and IV testing.
4. Design the module. Cell stringing (half-cut cells reduce resistive loss by 75% vs full cells). Encapsulant: EVA (mainstream, yellows slightly over 25 years) or POE (better moisture barrier, less PID susceptibility). Front glass: 3.2mm tempered with AR coating. Backsheet: fluoropolymer or glass-glass for bifacial. Frame: anodized aluminum for mechanical protection and mounting. Junction box with bypass diodes (1 per substring of 20-24 cells) for hot spot protection.
5. Qualify for IEC 61215. Key tests: thermal cycling (TC200: 200 cycles from -40C to +85C), damp heat (DH1000: 1000 hours at 85C/85%RH), UV exposure, mechanical load (5400 Pa front, 2400 Pa rear), hail impact (25mm ice ball at 23 m/s). Pass criterion: < 5% power degradation after each test. PID (potential-induced degradation) test: 1000V system voltage at 85C/85%RH for 96 hours. Predict field degradation: 0.3-0.5%/year for crystalline silicon modules, warranted to 80% of nameplate at 25-30 years.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
