# Thermocouple Measurement Setup

Select, attach, and calibrate thermocouples for accurate temperature measurement of electronic components with minimal thermal disturbance to the circuit.

## Inputs

- `measurement-targets`: Components and locations to measure temperature, with expected temperature range and required accuracy
- `operating-conditions`: Board operating conditions: power dissipation, airflow, ambient temperature

## Outputs

- `thermocouple-configuration`: Thermocouple type, wire gauge, attachment method, and routing for each measurement point
- `thermal-disturbance-estimate`: Estimated temperature measurement error from thermocouple thermal mass and heat conduction along the wire
- `measurement-accuracy-budget`: Total measurement uncertainty including thermocouple accuracy, cold junction compensation, data acquisition resolution, and attachment thermal resistance

## Process

1. Select thermocouple type. Type K (Chromel-Alumel) for general electronics use: range -200C to +1250C, accuracy plus or minus 2.2C or 0.75% (standard), or plus or minus 1.1C (special grade). Type T (Copper-Constantan) for high accuracy at lower temperatures: range -200C to +350C, accuracy plus or minus 1C (special grade). Type T has lower thermal EMF noise in magnetic fields.
2. Select the thinnest wire gauge that meets the temperature range. Thinner wire (36 AWG or 40 AWG) conducts less heat along the wire, reducing the measurement error from heat sinking through the thermocouple. For a component with a thermal resistance of 50C/W dissipating 1W, a 36 AWG thermocouple can sink 10-50mW and read 0.5-2.5C low.
3. Attach the thermocouple junction to the component case using thermally conductive adhesive (not electrically conductive to avoid ground loops). Press the junction flat against the case surface. For IC packages with exposed pads, attach to the case top surface directly above the die (hottest point). Secure the wire against the board surface for at least 10mm to thermalize the wire and reduce conduction error.
4. Route thermocouple wires away from heat-generating components and away from switching circuits that could inject noise into the thermocouple signal. Use shielded thermocouple extension cable for runs longer than 30cm. Connect to a thermocouple data acquisition system with cold junction compensation accuracy of plus or minus 0.5C or better.
5. Verify the installation by measuring a known condition: with the board powered off at room temperature, all thermocouples should read within their accuracy specification of the ambient temperature measured by a calibrated reference thermometer. This catches wiring errors, bad junctions, and cold junction compensation faults.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
