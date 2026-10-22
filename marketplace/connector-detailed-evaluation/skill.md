# Connector Detailed Evaluation

Evaluate the short-listed connectors in detail including vibration performance, thermal effects, signal integrity, and total cost of ownership to make the final selection.

## Inputs

- `candidate-connectors`: Short list with part numbers
- `screening-log`: Why alternatives were eliminated

## Outputs

- `selected-connector`: Final connector selection with complete part numbers for plug, receptacle, contacts, seals, backshell, and crimp tool
- `connector-application-notes`: PCB footprint requirements, assembly instructions, and cable preparation specifications for the selected connector

## Process

1. Evaluate vibration performance. Unsealed connectors are vulnerable to fretting corrosion: micro-sliding between contacts under vibration wears through the plating and oxidizes the base metal, increasing contact resistance. Gold plating (minimum 0.75 microns per MIL-DTL-83513) resists fretting. Tin plating frets rapidly above 1g vibration. For automotive/mil applications, connectors must have a positive locking mechanism (not friction alone) and gold or palladium-nickel contacts.
2. Evaluate thermal effects on contact resistance. Contact resistance increases with temperature due to base metal oxidation and contact normal force relaxation (spring temper loss). Beryllium copper contacts maintain spring force to 150C. Phosphor bronze relaxes above 100C. Check that contact resistance (typically 10-30 milliohms initial) stays below the maximum after thermal aging at maximum operating temperature.
3. For controlled-impedance applications, request the connector manufacturer's S-parameter data (Touchstone .s2p files) or impedance profile. Simulate the connector in the signal chain using the S-parameters. Check return loss (less than -15 dB), insertion loss (less than -1 dB), and crosstalk (less than -30 dB) at the signal frequency. If data is not available, a connector sample must be characterized on a VNA.
4. Calculate total cost of ownership: connector cost + contact cost per pin + crimp tool amortized over production volume + assembly labor time + cable preparation time + rework cost for defective terminations. A cheap connector with expensive tooling or high rework rates can cost more than a premium connector with simpler assembly.
5. Make the final selection. Document the complete bill of materials: plug housing, receptacle housing, male contacts (type and plating), female contacts (type and plating), sealing plugs for unused positions, backshell or strain relief, crimp tool with specific die set, and extraction tool. Issue a connector specification document with the approved part numbers and assembly procedure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
