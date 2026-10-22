# Thermal Resistance Network

Build the thermal resistance network from each heat source junction to ambient, including package thermal resistance, PCB spreading, thermal interface material, and heat sink.

## Inputs

- `loss-breakdown`: Power dissipation per component
- `total-dissipation`: System total dissipation and operating conditions

## Outputs

- `thermal-network-model`: Thermal resistance network diagram: Rth_jc (junction to case), Rth_cs (case to sink or board), Rth_sa (sink to ambient) for each major heat source, with parallel paths identified
- `junction-temperature-estimate`: Predicted junction temperature for each power component at worst-case conditions: Tj = Tamb + P * (Rth_jc + Rth_cs + Rth_sa)

## Process

1. For each power component, extract Rth_jc (junction to case) from the datasheet. MOSFET in D2PAK: Rth_jc = 1-3 C/W. TO-220: Rth_jc = 0.5-1.5 C/W. QFN exposed pad: Rth_jc = 3-10 C/W (through the exposed pad), Rth_jb = 20-40 C/W (through the board). The exposed pad path dominates.
2. For PCB-mounted components without heat sinks, calculate Rth_cs through the PCB. Thermal vias under the pad connect to copper planes: each via (0.3mm dia, 0.025mm plating) has Rth_via ~ 80 C/W. With 9 vias in parallel: Rth_vias = 80/9 = 9 C/W. The inner/bottom copper planes spread heat: Rth_spread depends on copper area and thickness.
3. For heat-sinked components, calculate Rth_cs through the thermal interface material (TIM). Rth_TIM = thickness / (k * area). Thermal grease: k = 0.8-5 W/(m*K), thickness 25-75um. Thermal pad: k = 1-6 W/(m*K), thickness 0.2-1mm. Phase-change material: k = 3-5 W/(m*K), self-thins to 25um under pressure. Always include contact resistance at both interfaces.
4. Calculate or look up Rth_sa for the heat sink. Natural convection: Rth_sa from vendor curves (function of surface area and orientation). Forced air: Rth_sa drops significantly with airflow velocity. At 2 m/s: roughly 50-70% of natural convection Rth. Use CFD or vendor curves for exact value.
5. Build the complete network. For components on a shared heat sink, their thermal resistances to the sink are in parallel on the heat sink node. The heat sink has a single Rth_sa to ambient. Sum the power into the shared sink and calculate the sink temperature: Tsink = Tamb + Ptotal_sink * Rth_sa. Each junction temperature: Tj_n = Tsink + Pn * (Rth_jc_n + Rth_cs_n).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
