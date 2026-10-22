# Guard Ring And Sensitive Analog Protection

Design guard rings and guard traces to protect sensitive analog nodes from leakage current, noise coupling, and field pickup.

## Inputs

- `ground-strategy`: Ground approach from partitioning step
- `sensitive-nodes`: Nodes requiring protection: high-impedance inputs, reference voltages, low-level analog signals
- `noise-budget`: Maximum tolerable noise per sensitive node

## Outputs

- `guard-ring-design`: Guard ring for each sensitive node: ring potential (driven or grounded), width, clearance to the sensitive trace, and connection to the circuit
- `layout-rules-for-analog`: Routing rules: minimum clearance from digital traces, maximum trace length for sensitive signals, via rules for analog connections
- `shielding-requirements`: Whether a ground pour, shield can, or Faraday cage is needed for specific sensitive areas

## Process

1. For high-impedance nodes (> 10 Mohm, such as photodiode amplifier inputs): surface leakage on the PCB can inject picoamps to nanoamps of current. A guard ring driven to the same potential as the sensitive node (by the op-amp output in a follower configuration) intercepts surface leakage current. The guard ring must completely surround the sensitive node on all PCB layers that the node touches.
2. For reference voltage nodes: surround with a ground guard ring (connected to the local analog ground) to prevent noise coupling from nearby digital or switching traces. The guard ring width should be at least 20 mils and connected to ground with vias every 100 mils to maintain low impedance at high frequency.
3. Set routing rules for analog signals: keep analog traces at least 3x the trace width away from digital traces (5x for sensitive signals). Keep analog traces short (minimize antenna pickup length). Route analog signals on internal layers between ground planes when possible (stripline provides natural shielding). Use vias sparingly for analog signals (each via adds parasitic inductance and can create a stub).
4. For the most sensitive circuits (microvolts, nanoamps): consider a metal shield can soldered over the sensitive area. The shield can connects to the ground plane through multiple vias and provides 30 to 60 dB of additional isolation from radiated interference. Alternatively, use a ground pour on the layer above and below the sensitive circuit (a PCB Faraday cage).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
