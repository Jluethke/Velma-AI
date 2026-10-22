# Fowlp Electrical Design

Design the RDL routing for signal integrity and power delivery in the fan-out package.

## Inputs

- `process-flow`: Selected FOWLP process and variant
- `rdl-design-rules`: Line/space, layers, dielectric

## Outputs

- `rdl-routing`: Signal and power routing plan with impedance control and crosstalk analysis
- `electrical-validation`: Simulated insertion loss, return loss, and PDN impedance meeting specifications

## Process

1. Route signal redistributon from die pad locations to package ball locations. For single-die, this is fan-out: routing from small die pad pitch (40-80um) to larger BGA pitch (300-500um).
2. Calculate controlled impedance for high-speed signals. RDL trace above a ground plane: Z0 depends on trace width, dielectric thickness, and Er. Typical polymer Er ~3.0-3.5. Use microstrip or coplanar waveguide formulas.
3. Analyze crosstalk between adjacent RDL traces. Short coupling length (< 1mm typically) limits crosstalk. Verify with EM simulation for critical signals.
4. Design power distribution: wide power traces or power planes if layer count allows. Calculate IR drop from die pad to package ball for worst-case current.
5. Simulate package-level resonance. The RDL plus ball array forms a resonant structure. Identify resonance frequencies and verify they do not coincide with signal frequencies. Add decoupling capacitors (embedded in substrate or discrete) if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
