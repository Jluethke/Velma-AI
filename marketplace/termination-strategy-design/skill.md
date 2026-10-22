# Termination Strategy Design

Select and implement the termination scheme for each high-speed signal to minimize reflections and maintain signal quality at the receiver.

## Inputs

- `impedance-geometry`: Characteristic impedance Z0 for each signal, trace lengths, driver and receiver impedance
- `signal-list`: Data rate, edge rate, topology (point-to-point, multidrop, star)

## Outputs

- `termination-scheme`: For each signal: termination type (series at source, parallel at receiver, AC, Thevenin, on-die), component values, and placement
- `reflection-analysis`: Time-domain reflectometry simulation showing the reflected voltage at critical nodes, confirming the reflection coefficient is below the receiver noise margin

## Process

1. Series termination (source termination): place a resistor Rs at the driver output such that Rs + Rdriver = Z0. The launched wave has half amplitude (Vinit = Vs*Z0/(Z0+Z0)) but the reflected wave from the open receiver adds to give full amplitude at the receiver. Advantage: no DC current, low power. Disadvantage: the signal at the driver end is half-amplitude until the round-trip reflection returns, so this topology only works for point-to-point where only the far end needs to receive.
2. Parallel termination (receiver termination): place a resistor Rt = Z0 at the receiver end to ground or to Vtt (a termination voltage at Vdd/2). The signal arrives at full amplitude with no reflection. Advantage: works for multidrop topologies. Disadvantage: continuous DC current through Rt (for a 50 ohm line at 3.3V, that is 66mA per signal, which is prohibitive for wide buses).
3. AC termination: a series RC to ground at the receiver, where R = Z0 and C is large enough to hold the termination voltage constant during a bit period. C > 10/(Z0*fdata) is typical. This eliminates DC current while providing matched termination at signal frequencies. Used in DDR memory interfaces.
4. On-die termination (ODT): modern memory interfaces (DDR3/4/5) and SerDes (PCIe, USB) include programmable on-die termination. The driver and receiver impedances are calibrated to match the transmission line impedance. This eliminates external components but requires correct ODT register programming during initialization.
5. Verify with time-domain simulation (SPICE or IBIS). The eye diagram at the receiver must show: eye height > receiver threshold with margin for noise, and eye width > unit interval with margin for jitter. The reflection coefficient Gamma = (ZL-Z0)/(ZL+Z0) must produce reflections smaller than 10 percent of the signal swing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
