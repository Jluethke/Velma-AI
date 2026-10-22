# Heat Sink Selection And Attachment

Select a heat sink based on the required thermal resistance from case to ambient, choose the thermal interface material, and design the attachment method.

## Inputs

- `thermal-budget`: Remaining thermal budget for case-to-ambient path
- `component-power-dissipation`: Power to dissipate through the heat sink path
- `available-airflow`: Natural convection, forced convection velocity, or contact to chassis

## Outputs

- `heat-sink-specification`: Required R_sa (heat sink to ambient), selected heat sink part number with its R_sa at the available airflow, and physical dimensions
- `thermal-interface-selection`: TIM type (thermal pad, paste, or phase-change material) with its thermal conductivity, thickness, and resulting R_cs
- `attachment-method`: How the heat sink is attached: push-pin, clip, adhesive, or screw-down, with retention force and thermal impact

## Process

1. Calculate required R_sa: R_sa_required = (delta_T_budget_top_path / P) - R_jc - R_cs. You need to estimate R_cs to solve this: thermal pads range from 1 to 5 C/W depending on area and pad material; thermal paste gives 0.2 to 1 C/W; phase-change material gives 0.5 to 2 C/W.
2. Select the heat sink: compare vendor datasheets for R_sa at your airflow condition. Heat sink R_sa is specified at a particular airflow (natural convection or a specific LFM). At natural convection, R_sa is 2 to 5x higher than at 200 LFM forced air. Verify the heat sink fits the component footprint and does not interfere with adjacent components.
3. Select the TIM: thermal paste gives the lowest R_cs but is messy in manufacturing and can pump out over thermal cycles. Thermal pads are manufacturing-friendly but have higher thermal resistance. Phase-change materials offer a middle ground: solid at room temperature (easy to handle), they soften at operating temperature to fill air gaps. Match TIM thickness to the tolerance stackup between the component top and the heat sink base.
4. Design the attachment: the attachment must maintain pressure on the TIM (typically 10 to 50 psi for paste, 5 to 20 psi for pads) without cracking the IC package or the PCB. Push-pins are common for BGA packages; spring clips work for larger heat sinks; adhesive thermal tape is used when no mechanical attachment is possible but has lower reliability over temperature cycling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
