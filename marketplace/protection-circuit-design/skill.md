# Protection Circuit Design

Design the hardware protection circuits for overvoltage, undervoltage, overcurrent, over-temperature, and short circuit, with response times and fault handling hierarchy.

## Inputs

- `soc-algorithm`: SOC estimation method and measurement infrastructure
- `sensor-requirements`: Sensor specifications and placement

## Outputs

- `protection-circuit-schematic`: Hardware protection schematic: comparators or dedicated protection IC, MOSFET disconnect switches (charge and discharge paths), pre-charge circuit, and fault indicator outputs
- `protection-thresholds`: Threshold table: OVP trip and release voltages, UVP trip and release, OCP instantaneous and delayed, OTP warning and shutdown, with hysteresis values and response times

## Process

1. Overvoltage protection (OVP). Threshold: cell chemistry maximum (4.20V for NMC, 3.65V for LFP) plus a small margin for measurement accuracy. Response: when any cell exceeds OVP, disconnect the charge path MOSFET. Do not disconnect the discharge path (the pack can still be used). Hysteresis: release at OVP - 50mV to prevent oscillation. Response time: under 100ms from the monitor IC, or under 1us from a hardware comparator for safety-critical backup.
2. Undervoltage protection (UVP). Threshold: 2.5V for NMC, 2.0V for LFP. Below these voltages, copper dissolution occurs (irreversible damage). Response: disconnect the discharge path MOSFET. Allow charging to recover. If a cell is below 1.5V, it may be damaged and should not be charged without a low-current recovery protocol.
3. Overcurrent protection (OCP). Two levels: software OCP from the BMS microcontroller (response in 1-10ms, configurable threshold) and hardware OCP from a comparator on the current sense signal (response in microseconds, fixed threshold at the absolute maximum). Short circuit protection: detect a current spike above 5-10x rated current within 10us and disconnect both charge and discharge MOSFETs.
4. Pre-charge circuit. When connecting the pack to a discharged load (large capacitor on the bus), the inrush current can exceed OCP. A pre-charge resistor in series with a bypass MOSFET limits the inrush: Rpre = Vpack / Ipre_max. Pre-charge time: t = -R*C*ln(1 - Vpre_target/Vpack). After the load voltage reaches 90% of pack voltage, close the main contactor and open the pre-charge path.
5. Over-temperature protection. NTC thermistors on each cell group feed into the BMS. Warning threshold: 45-50C (reduce charge current). Shutdown threshold: 60C (disconnect both paths). Under-temperature: below 0C, disable charging (lithium plating risk). Allow discharge down to -20C at reduced current. Log all protection events with timestamp, cell voltages, and temperatures for post-incident analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
