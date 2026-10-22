# Hydrogen Safety Engineering

Apply hydrogen safety engineering: hazard identification, ATEX zone classification, ventilation design, detection systems, and emergency response planning.

## Inputs

- `efficiency-chain`: Operating parameters that define the safety envelope
- `lcoh-analysis`: System configuration for hazard analysis scope

## Outputs

- `safety-design`: ATEX zone classifications, ventilation rates, detection system specification, and passive safety features
- `emergency-response-plan`: Leak scenarios, escalation criteria, automatic shutdowns, and emergency procedures

## Process

1. Characterize hydrogen hazards. Hydrogen is flammable in air from 4% to 75% by volume (the widest flammable range of any common fuel). Minimum ignition energy is 0.02 mJ (one-tenth of natural gas). Flame speed is high (3.5 m/s laminar) and detonation is possible in confined spaces above 18% concentration. Hydrogen flames are nearly invisible in daylight. Hydrogen embrittlement affects carbon steel above a threshold pressure (dependent on steel grade and temperature).
2. Classify ATEX zones per IEC 60079-10-1. Zone 0: inside the electrolyzer stack and gas processing equipment (continuous explosive atmosphere). Zone 1: within 1 meter of potential release points (flanges, valves, fittings) where occasional leaks are expected. Zone 2: further afield where explosive atmosphere is not expected but possible under abnormal conditions. Equipment in each zone must be certified to the corresponding equipment category.
3. Design ventilation. For indoor installations, mechanical ventilation must prevent hydrogen accumulation above 25% of the lower flammability limit (1% H2 by volume) under the maximum credible leak rate. The required air flow rate follows from the leak rate and the dilution factor: V_dot = Q_leak / (0.01 x safety_factor), where safety_factor is typically 4. For outdoor installations, natural ventilation often suffices if equipment spacing meets the minimum separation distances.
4. Specify detection systems. Install hydrogen detectors at the ceiling (hydrogen rises at 20 m/s in still air), near potential leak sources, and in enclosed or semi-enclosed areas. Catalytic bead sensors for general area monitoring (range 0-100% LEL, response time less than 30 seconds). Set alarm at 20% LEL (0.8% H2) for warning and 40% LEL (1.6% H2) for automatic shutdown and ventilation increase. Cross-sensitivity to other gases must be characterized.
5. Design the emergency shutdown system. Automatic triggers: hydrogen detection above 40% LEL, fire detection, loss of ventilation, seismic event above threshold, or manual emergency stop. Shutdown sequence: close hydrogen supply valves (fail-closed), de-energize the electrolyzer stack, purge hydrogen lines with nitrogen, and activate enhanced ventilation. The shutdown must complete within 60 seconds of the trigger. Document the emergency response procedures including evacuation zones (minimum 15-meter radius for outdoor releases) and coordination with local emergency services.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
