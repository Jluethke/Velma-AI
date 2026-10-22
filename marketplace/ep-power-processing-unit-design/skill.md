# Ep Power Processing Unit Design

Design the power processing unit that converts spacecraft bus power into the voltages and currents the thruster requires, with high efficiency and fault tolerance.

## Inputs

- `thruster-type-selection`: Thruster type and its electrical requirements (voltage, current, power level)
- `available-power`: Spacecraft bus voltage and power profile

## Outputs

- `ppu-architecture`: Converter topology, input/output specifications, and efficiency
- `ppu-mass-volume`: PPU mass and volume estimate from power density scaling
- `fault-protection-design`: Fault handling for thruster anomalies (arcing, recycles)

## Process

1. Define electrical requirements: gridded ion engines need high voltage (1000 to 2000V) at low current for the screen and accelerator grids, plus a discharge supply (20 to 40V, high current) and a neutralizer keeper supply. Hall thrusters need 300 to 800V discharge at 5 to 50A depending on power level, plus a magnet supply and cathode keeper.
2. Select converter topology: for high-voltage output, use a series-resonant or phase-shifted full-bridge converter with high-frequency transformer. For the discharge supply of a Hall thruster, a direct buck or boost from the bus may suffice if bus voltage is in range. Target PPU efficiency above 93 to 95% to minimize waste heat in the spacecraft.
3. Size the PPU from power density: state-of-the-art PPUs achieve 1 to 3 kW/kg specific power. Mass scales roughly as P^0.7 (larger PPUs are more mass-efficient). Volume follows similar scaling. Include the thermal control mass (heat sinks, radiator interface) in the PPU mass budget.
4. Design fault protection: EP thrusters experience recycle events (momentary arcing in the discharge). The PPU must detect overcurrent within microseconds, shut down the discharge, and restart. Typical recycle rate is 1 to 10 per hour for healthy operation; increasing recycle rate indicates end-of-life degradation. Implement a maximum recycle rate limit that triggers thruster shutdown if exceeded.
5. Address electromagnetic compatibility: high-frequency switching in the PPU and high-voltage discharge in the thruster both generate EMI. Filter the PPU input to prevent conducted emissions onto the spacecraft bus. Shield the PPU-to-thruster harness. Verify compliance with the spacecraft EMC specification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
