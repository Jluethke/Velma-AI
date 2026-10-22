# Derating And Reliability Assessment

Apply derating rules to ensure long-term reliability, calculate mean time between failures using the Arrhenius model, and finalize the thermal design with a reliability target.

## Inputs

- `transient-thermal-model`: Transient thermal impedance models for critical components
- `peak-temperature-under-transients`: Worst-case junction temperatures under all operating scenarios

## Outputs

- `derating-table`: Derating factors applied to each component: voltage derating (typically 60-80% of rated), current derating per temperature curve, power derating above the knee temperature
- `reliability-prediction`: Estimated failure rate and MTBF for the thermal design, based on Arrhenius acceleration factor from junction temperature and activation energy for each failure mechanism

## Process

1. Apply voltage derating. Standard practice: operate at 60-80% of rated voltage for semiconductors, 50-70% for capacitors. Electrolytic capacitors: lifetime halves for every 10C above rated temperature. A 105C-rated cap at 85C has 4x the rated lifetime. At 95C, only 2x.
2. Apply temperature derating. Most semiconductors derate linearly above a knee temperature (typically 100C for MOSFET Rds(on) derating, 25C for absolute max power). The datasheet power derating curve shows: Pd_max = (Tj_max - Tc) / Rth_jc. Verify operation stays within the safe operating area (SOA).
3. Calculate reliability using Arrhenius model. The failure rate acceleration factor: AF = exp(Ea/k * (1/T_ref - 1/T_use)). Ea (activation energy) depends on the failure mechanism: 0.7 eV for electromigration, 1.0 eV for oxide breakdown, 0.3-0.5 eV for solder joint fatigue. Every 10C reduction in Tj roughly halves the failure rate for semiconductor mechanisms.
4. For electrolytic capacitors, apply the capacitor life model: Life = L0 * 2^((T_rated - T_actual)/10) * (V_rated/V_applied)^n where n = 1 to 3 depending on construction. This is often the reliability bottleneck. If predicted life is below the product target (e.g., 10 years at 24/7 operation), reduce the capacitor temperature by improving airflow or adding more capacitor area.
5. Compile the reliability report: list each critical component, its operating temperature, derating factor, and predicted failure rate. Sum the failure rates for the system MTBF. Identify the component with the highest failure rate (usually the electrolytic output capacitor or the MOSFET) and document the available margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
