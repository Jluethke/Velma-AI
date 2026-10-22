# Transient Thermal Analysis

Analyze thermal behavior under pulsed and transient load conditions using the transient thermal impedance Zth(t) to determine peak junction temperature during overloads and startup.

## Inputs

- `heat-sink-specification`: Selected heat sink with thermal characteristics
- `thermal-budget-verification`: Steady-state thermal analysis results

## Outputs

- `transient-thermal-model`: Foster or Cauer network model of Zth(t) for critical components, with time constants from datasheet Zth curves or extracted from step-response measurement
- `peak-temperature-under-transients`: Peak junction temperature during specified transient events: startup inrush, load step, overload duration before shutdown, and repetitive pulse

## Process

1. Extract transient thermal impedance Zth(t) from the MOSFET/IGBT datasheet. This is plotted as a family of curves for different duty cycles. The single-pulse curve gives Zth(t) for a step change in power. Read off Zth at the expected pulse duration.
2. Model Zth(t) as a Foster network: sum of parallel RC stages. Zth(t) = sum_i [Ri * (1 - exp(-t/tau_i))]. Typically 3-4 stages with time constants from microseconds (die) to seconds (package) to minutes (heat sink). Extract Ri and tau_i by curve fitting the datasheet Zth curve.
3. For repetitive pulses (PWM switching): the effective Zth depends on the duty cycle and frequency of the thermal pulsing (not the electrical switching frequency, but the load pulsing). At thermal frequencies much higher than the die time constant (~1ms), the junction sees the average power. At frequencies lower than the heat sink time constant, each pulse is nearly adiabatic.
4. Calculate peak Tj during overload. If the converter handles 2x rated load for 100ms before overcurrent protection trips: Tj_peak = Tamb + Psteady * Zth(inf) + Poverload * Zth(100ms). Use the transient Zth at 100ms from the datasheet. Verify Tj_peak < Tj_max.
5. For startup: the inrush current through MOSFETs before the output reaches regulation can be 5-10x the steady-state current. Calculate the energy deposited in the switch during the inrush pulse and the resulting temperature rise using Zth at the inrush duration. Pre-charge circuits or soft-start ramps reduce this stress.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
