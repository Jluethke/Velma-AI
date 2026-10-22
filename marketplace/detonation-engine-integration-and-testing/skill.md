# Detonation Engine Integration And Testing

Integrate the detonation combustor with turbomachinery or a nozzle and design the experimental test campaign.

## Inputs

- `annulus-geometry`: RDE channel design from sizing
- `injection-design`: Injector element design
- `application`: Gas turbine replacement, rocket engine, or ramjet combustor

## Outputs

- `integration-design`: How the RDE interfaces with turbine, nozzle, or inlet
- `test-rig-design`: Test facility requirements and instrumentation plan
- `performance-assessment`: Measured vs predicted pressure gain and efficiency

## Process

1. For gas turbine integration: the RDE replaces the conventional combustor. The turbine downstream must survive the circumferentially non-uniform flow (periodic pressure and temperature pulses at the detonation wave frequency, typically 1 to 10 kHz). The time-averaged turbine inlet conditions must match the design point. Transition duct design smooths the flow and mixes the products before the first turbine vane.
2. For rocket engine integration: the RDE operates as a pressure-gain combustor feeding a converging-diverging nozzle. The chamber pressure downstream of the detonation is higher than the injection pressure, which is the fundamental advantage (higher nozzle inlet pressure = higher Isp for the same tank pressure, or lower tank pressure for the same Isp). Nozzle design must handle the oscillatory mass flow.
3. Design the test rig: the RDE test article is an annular channel with optical access ports (windows for high-speed imaging of the detonation wave), high-frequency pressure transducers (Kulite or PCB, 500 kHz+ bandwidth to resolve the detonation wave), and thermocouple rakes in the exhaust. The rig needs a high-flow gas supply system with fast-acting valves for ignition sequencing.
4. Instrument for wave characterization: use circumferentially distributed high-frequency pressure transducers (at least 4, preferably 8+) to measure wave speed (from time of flight between sensors), wave count, and wave pressure profile. High-speed imaging (100,000 fps+) through quartz or sapphire windows captures the detonation wave structure. Ion probes can detect the detonation front passage.
5. Characterize performance: measure the total pressure gain by comparing time-averaged total pressure upstream and downstream of the RDE. This requires carefully designed total pressure probes that survive the detonation environment (cooled pitot-static probes). Measure thrust directly on a thrust stand for rocket applications. Compare to a baseline conventional combustor at the same mass flow rate and equivalence ratio.
6. Address key technical risks: detonation-to-deflagration transition (the wave may degrade to a spinning deflagration at low reactivity conditions), thermal management (the channel walls see intense periodic heating from the detonation wave), injector durability (fatigue from thousands of pressure cycles per second), and flashback prevention (the high pressure behind the detonation must not drive combustion into the propellant manifold).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
