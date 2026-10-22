# Esd Protection Design

Design ESD protection for all external-facing pins to survive the ESD events specified by the applicable standard without damaging the protected IC.

## Inputs

- `esd-standard`: Target ESD withstand level (IEC 61000-4-2: contact 4kV/air 8kV for Level 2, contact 8kV/air 15kV for Level 4; HBM: 2kV or 4kV; CDM: 500V or 1kV)
- `protected-pins`: List of external pins with their signal type (digital I/O, analog input, power), operating voltage, data rate, and capacitance tolerance

## Outputs

- `esd-devices`: TVS diode or ESD protection IC for each pin: working voltage, clamping voltage at specified current, capacitance, and package
- `pcb-layout-rules`: Routing rules for ESD paths: TVS placement distance from connector, trace width, ground connection strategy

## Process

1. Select TVS diode working voltage: Vrwm (reverse working voltage) must exceed the maximum signal voltage by at least 10 percent. For a 3.3V digital signal: Vrwm >= 3.6V, so select a 5V TVS. The clamping voltage Vc at the specified peak pulse current (e.g., 16A for IEC 61000-4-2 at 8kV contact) must be below the protected IC's absolute maximum rating.
2. Capacitance matters for high-speed signals. A standard TVS diode adds 50 to 500 pF, which is acceptable for power and low-speed I/O but degrades signal integrity on USB, HDMI, or Ethernet. For high-speed lines, use low-capacitance TVS arrays (0.5 to 5 pF) or rail-clamp ESD protection ICs designed for the specific interface.
3. PCB layout is critical for ESD protection effectiveness. The TVS must be placed as close as possible to the connector pin, before the signal trace reaches the protected IC. The ground connection from the TVS must be short (under 10mm) and wide (at least 20 mil) with a direct via to the ground plane. A long ground trace adds inductance that increases the voltage at the protected IC during the fast ESD transient.
4. For multi-pin connectors, use a TVS array IC that protects all pins in one package, sharing a common ground. This saves board space and ensures matched protection across all pins. For differential pairs (USB, Ethernet), use TVS arrays specifically designed for differential signals that clamp both common-mode and differential ESD events.
5. Verify protection by ESD testing to the target standard. IEC 61000-4-2 testing uses a specified ESD generator (150 pF, 330 ohm for contact discharge) applied to each external pin. Verify that the equipment continues to operate (performance criterion A) or recovers after reset (criterion B) after the specified number of discharges (typically 10 positive and 10 negative per pin).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
