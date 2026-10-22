# Rule Hierarchy And Constraint Setup

Establish the DRC, DFM, and signal integrity rule hierarchy and set up the EDA tool's constraint manager with net classes derived from signal requirements.

## Inputs

- `signal-classes`: All signal types with their impedance, speed, and spacing requirements
- `power-rails`: All power nets with voltage levels and current requirements
- `component-library`: Component footprints with pad sizes and spacing

## Outputs

- `net-class-definitions`: Net classes with assigned trace widths, spacing, via sizes, and impedance targets
- `rule-hierarchy`: Priority order: safety clearance > signal integrity > DFM > default routing rules
- `constraint-manager-setup`: EDA tool constraint configuration file or setup instructions for the defined rules

## Process

1. Define net classes by signal type: high-speed differential (USB, PCIe, Ethernet), high-speed single-ended (clock, JTAG TCK), general digital, analog, power, and high-voltage. Each class gets a set of rules: trace width (from impedance calculation), clearance to other classes (from crosstalk budget), via size (from current or impedance requirement), and length constraints.
2. Set the rule hierarchy: safety clearance rules (from voltage ratings) override all other rules. If two signals require 4 mil spacing for impedance but the voltage difference between them requires 8 mil per IPC-2221, the 8 mil rule wins. Signal integrity rules (impedance, length matching) override DFM rules. DFM rules (minimum annular ring, acid trap prevention) override default routing rules.
3. Configure the EDA tool's constraint manager: enter each net class with its rules. Assign every net to a class (no net should use default rules for a production design). Set differential pair constraints (impedance, spacing, length matching tolerance) and matched-length group constraints (DDR byte lanes, parallel buses).
4. Set up rule-checking automation: configure the EDA tool to run DRC continuously during routing (real-time DRC) for spacing, width, and connectivity rules. Signal integrity rules (impedance, length matching) can be checked interactively or in batch after routing. DFM rules should be checked before Gerber generation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
