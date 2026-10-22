# Cryogenic Instrumentation And Testing

Select and calibrate instrumentation for cryogenic systems and design the test campaign for system qualification.

## Inputs

- `tank-and-insulation-design`: System design to be instrumented and tested
- `measurement-requirements`: Required accuracy for temperature, pressure, level, and flow

## Outputs

- `instrumentation-plan`: Sensor selection, placement, and calibration approach for each measurement
- `test-plan`: Test sequence for cryogenic system qualification
- `data-acquisition-setup`: Signal conditioning, sampling rate, and data recording requirements

## Process

1. Select temperature sensors: silicon diode sensors (Lake Shore DT-670: accurate from 1.4K to 500K, interchangeable, good for point measurements). Platinum RTDs (good above 30K, standard in industrial cryogenics but lose sensitivity below 30K). Cernox sensors (Lake Shore: excellent for magnetic field environments where silicon diodes are affected). Thermocouples (Type T: copper-constantan for 15 to 400K, less accurate but cheap and durable for multipoint mapping).
2. Select level sensors: capacitance-based (dielectric constant of liquid vs gas differs: for LH2, dielectric constant of liquid is 1.23 vs 1.00 for gas). Point sensors (silicon diode heater: self-heating changes when immersed in liquid). Differential pressure (delta_P = rho * g * h: simple but requires knowing the fluid density, which changes with temperature). For microgravity, capacitance or RF sensors that work regardless of liquid orientation.
3. Select flow meters: turbine flow meters (good for clean cryogens, requires straight pipe upstream). Venturi (pressure drop based, no moving parts, but requires known fluid density). Coriolis (mass flow directly, works for two-phase, but expensive and large). Calibrate at cryogenic temperature; room-temperature calibration is not valid due to density and viscosity changes.
4. Select pressure transducers: remote-sensing through impulse lines (keeps the transducer warm, but the impulse line may trap gas or liquid). Direct-mount cryogenic transducers (operate at cryogenic temperature: fewer measurement artifacts but limited options). Absolute pressure for tank ullage, differential for flow measurement. Check transducer zero shift at cryogenic temperature.
5. Design the signal conditioning: cryogenic sensors often have small signals (millivolts for thermocouples, milliohms change for RTDs). Use 4-wire measurement for RTDs to eliminate lead resistance. Use low-thermal-EMF connections for thermocouples. Sample rate: 1 to 10 Hz for steady-state thermal, 100 Hz to 1 kHz for transient events (chill-down, water hammer, geysering).
6. Design the qualification test sequence: leak check at room temperature, then cryogenic leak check (thermal contraction changes seal performance). Proof pressure test at 1.5x MEOP at cryogenic temperature. Chill-down test (verify thermal stress, no cracking). Fill/drain cycle test. Pressurization test (verify collapse factor). Vent system test (verify relief valve function). Long-duration storage test (measure boil-off rate and compare to prediction). Vibration test if flight hardware.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
