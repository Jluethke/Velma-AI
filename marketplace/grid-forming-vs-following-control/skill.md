# Grid Forming Vs Following Control

Design the inverter control system: grid-following for stable grids, grid-forming for weak grids and microgrids, with voltage and frequency regulation.

## Inputs

- `topology-selection`: Inverter topology and switching characteristics
- `topology-trade-off-analysis`: Harmonic and dynamic performance characteristics

## Outputs

- `control-architecture`: Grid-following or grid-forming control structure with tuned controller parameters
- `stability-analysis`: Small-signal stability analysis showing gain and phase margins, and impedance-based stability assessment for weak grid conditions

## Process

1. Choose between grid-following and grid-forming. Grid-following inverters use a phase-locked loop (PLL) to synchronize with the grid voltage and inject current at the grid frequency. They require a stiff voltage reference and become unstable when the short circuit ratio (SCR) at the POI drops below 2-3. Grid-forming inverters create their own voltage reference and frequency, behaving like a voltage source behind an impedance. They can operate in weak grids (SCR less than 2) and in island mode.
2. Design the grid-following controller. Inner current loop: PI controller in the dq synchronous reference frame, bandwidth 500-2000 Hz (one-tenth to one-fifth of switching frequency). Feed-forward of grid voltage decouples the d and q axes. Outer power loop: PI controller generating current references from active and reactive power setpoints, bandwidth 5-50 Hz. PLL bandwidth 10-50 Hz; lower bandwidth improves stability in weak grids but slows transient response.
3. Design the grid-forming controller. Virtual synchronous machine (VSM) emulates a synchronous generator: the swing equation provides frequency regulation (virtual inertia H = 2-10 seconds), and a reactive power droop provides voltage regulation. Alternative: droop control (P-f and Q-V droop) is simpler but provides no inertial response. The output impedance of the grid-forming inverter must be predominantly inductive for stable power sharing.
4. Perform stability analysis. Small-signal model: linearize the inverter, filter, and grid model around the operating point. Calculate eigenvalues and participation factors to identify potential oscillatory modes. Impedance-based analysis: measure or model the inverter output impedance Zs and the grid impedance Zg. The system is stable if the ratio Zs/Zg satisfies the Nyquist criterion (no encirclement of -1). Weak grids increase the magnitude of Zg, potentially causing instability.
5. Implement grid-support functions. Frequency response: reduce power output when frequency exceeds 60.05 Hz (overfrequency droop), increase power (if available) when frequency drops below 59.95 Hz. Voltage regulation: adjust reactive power output to maintain POI voltage within the dead band. Fault ride-through: inject reactive current proportional to voltage depression during grid faults (typically 2% additional reactive current per 1% voltage drop, up to rated current).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
