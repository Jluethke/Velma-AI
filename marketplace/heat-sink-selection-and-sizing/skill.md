# Heat Sink Selection And Sizing

Select or design a heat sink based on the required thermal resistance, available space, airflow, and mounting method.

## Inputs

- `thermal-network-model`: Thermal resistance network with required Rth_sa
- `junction-temperature-estimate`: Target junction temperatures and current thermal gaps

## Outputs

- `heat-sink-specification`: Heat sink type (extruded, stamped, pin-fin, vapor chamber), dimensions, material (aluminum or copper), surface finish (anodized black for radiation), mounting method
- `thermal-budget-verification`: Recalculated junction temperatures with the selected heat sink confirming all components stay below rated Tj_max with margin

## Process

1. Calculate required Rth_sa: Rth_sa_required = (Tj_max - Tamb_max) / Ptotal - Rth_jc - Rth_cs. Include a 10-15C margin below Tj_max. For MOSFET with Tj_max = 150C, target Tj = 125C max.
2. For natural convection: Rth_sa approximately = 1 / (h * A_surface) where h = 7-12 W/(m^2*K) and A_surface includes all fin surfaces. A 50x50x25mm extruded aluminum heat sink with 8 fins has roughly A_surface = 200 cm^2, giving Rth_sa ~ 5-8 C/W.
3. For forced air: at 2 m/s airflow, h increases to 25-50 W/(m^2*K), reducing Rth_sa by 3-5x. Pin-fin heat sinks outperform extruded fins in forced air because they work with any airflow direction. At 3 m/s, a 50x50x10mm pin-fin can achieve Rth_sa ~ 2 C/W.
4. Consider the mounting interface. TO-220 to heat sink: use a mounting screw with torque spec (typically 4-6 in-lbs for #4 screw). Insulating washer (silicone pad or mica + thermal grease) adds 0.5-2 C/W. Direct mount (no isolation) gives lowest Rth_cs but the heat sink is at drain potential. SMD to PCB heat sink: either solder-reflow attach or use a thermal adhesive.
5. Verify the complete thermal budget: recalculate Tj for every component with the selected heat sink. Verify that no component exceeds its rated temperature under worst-case (maximum ambient, maximum load, minimum airflow for forced-air systems). Document the thermal margin for each component.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
