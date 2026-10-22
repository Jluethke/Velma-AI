# Fpga Power Estimation

Estimate total FPGA power consumption by component: static (leakage), dynamic (switching), I/O, and transceiver power, using vendor tools and design activity data.

## Inputs

- `post-implementation-design`: Fully placed and routed FPGA design with timing closed
- `operating-conditions`: Ambient temperature, airflow, power supply voltages, and expected signal activity rates for all major buses and clocks

## Outputs

- `power-breakdown`: Total power and per-component breakdown: clock network, logic (LUT + register switching), BRAM, DSP, I/O, transceiver, and static leakage, each in milliwatts
- `power-budget-assessment`: Comparison of estimated power against the thermal solution's dissipation capacity and the power supply's delivery capacity, with margin or deficit

## Process

1. Run the vendor's power analysis tool (Vivado Power Analysis or Quartus PowerPlay). Use post-implementation data for accurate resource counts and routing capacitance. The tool needs toggle rates for all signals; provide these from simulation (VCD file) or estimated activity factors.
2. For simulation-based power: run a representative workload through post-implementation simulation, capture signal activity in a VCD (value change dump) file, and import it into the power tool. This gives the most accurate estimate because it uses actual switching activity from real operation.
3. For estimation-based power (no VCD): set activity rates manually. Clock networks: 100% toggle rate (every edge toggles). Data paths: typically 12.5% to 25% toggle rate for random data. Control logic: typically 5% to 10%. Set these based on the application's expected behavior.
4. Decompose the power report: (a) Static power: leakage current that depends on temperature and process. It is constant regardless of design activity. (b) Dynamic power: P = alpha * C * V^2 * f, where alpha is toggle rate, C is capacitance (from routing), V is supply voltage, f is clock frequency. (c) I/O power: from output driver current and termination. (d) Transceiver power: per-lane power from the high-speed serializer/deserializer.
5. Compare total power against the thermal budget. The thermal solution (heat sink, airflow) has a maximum dissipation: P_max = (Tj_max - T_ambient) / theta_JA. If estimated power exceeds P_max, the junction temperature will exceed the maximum rating and the FPGA may malfunction.
6. Identify the dominant power consumers. Typically: clock network (30-50% of dynamic), I/O (10-30%), and BRAM (10-20%). Optimization effort should target the largest contributors first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
