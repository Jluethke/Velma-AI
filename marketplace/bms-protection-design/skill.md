# Bms Protection Design

Design the protection system for the battery pack covering all failure modes: overvoltage, undervoltage, overcurrent, short circuit, and thermal runaway.

## Inputs

- `cell-datasheet`: Cell absolute maximum ratings: max charge voltage, min discharge voltage, max continuous and pulse current, max and min temperature
- `pack-config`: Series and parallel cell count, contactor or FET disconnect mechanism, fuse rating

## Outputs

- `protection-thresholds`: Trip points and response times for each protection function: overvoltage, undervoltage, overcurrent (charge and discharge), short circuit, overtemperature, undertemperature
- `protection-hardware`: Current sensor type and range, cell voltage monitoring IC, contactor/FET specifications, fuse or PTC specifications, precharge circuit design

## Process

1. Overvoltage protection: set the threshold at the cell manufacturer's absolute maximum charge voltage (typically 4.2V for NMC, 3.65V for LFP) minus a margin of 20 to 50mV for measurement error. When any cell exceeds the threshold, the BMS must disconnect the charger within 100ms. Use a dedicated cell monitoring IC (such as the TI BQ76952 or Analog Devices ADBMS6815) that measures each cell voltage with 1 to 2 mV accuracy and has hardware overvoltage comparators.
2. Undervoltage protection: set the threshold at the minimum discharge voltage (typically 2.5V for NMC, 2.0V for LFP) plus a margin for IR drop under load. Under heavy load, the terminal voltage drops below OCV by I*R_internal; the cell may not actually be empty even though the terminal voltage hit cutoff. A SOC-based cutoff (stop at 5 percent SOC rather than a voltage) is more accurate but requires reliable SOC estimation.
3. Short circuit protection must act in microseconds. A short circuit on a lithium-ion cell can deliver hundreds of amps, causing thermal runaway in seconds. Use a hardware comparator on the current sense (not software, which is too slow) with a threshold at 3 to 5x the maximum rated current and a response time under 100 microseconds. A high-side FET disconnects the pack; the FET must be rated for the full short-circuit current during the detection delay.
4. Precharge circuit: before closing the main contactor, the DC bus capacitance of the inverter must be precharged to near the pack voltage through a resistor. Without precharge, the inrush current to charge the bus capacitor can weld the contactor contacts and damage the capacitor. Precharge resistor value: R_pre = Vpk / I_inrush_max. Precharge time: t = 5*R_pre*C_bus (5 time constants to reach 99 percent).
5. Thermal runaway propagation prevention: if one cell enters thermal runaway (exothermic decomposition above 150C for NMC), the heat can trigger runaway in adjacent cells. Physical barriers (mica sheets, intumescent materials), cell spacing, and thermal management (coolant flow directing heat away from adjacent cells) are the primary defenses. The BMS detects early signs (rapid voltage drop, temperature rise above 60C, cell swelling via gas sensor) and initiates emergency disconnect and cooling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
