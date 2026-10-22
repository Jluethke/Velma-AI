# Voltage Clearance And Safety Rules

Calculate electrical clearance and creepage distances from operating voltages using IPC-2221 and safety standards, and apply them as design rules.

## Inputs

- `operating-voltages`: All voltage levels present on the board, including transient voltages
- `pollution-degree`: Environmental contamination level (1 = sealed, 2 = normal indoor, 3 = conductive pollution possible)
- `safety-standard`: Applicable safety standard (IEC 62368-1, IEC 60950-1, UL 60950, etc.)

## Outputs

- `clearance-table`: Minimum clearance (through air) between each voltage pair, from IPC-2221 Table 6-1 and the applicable safety standard
- `creepage-table`: Minimum creepage (across surface) for safety-critical insulation barriers, from the safety standard
- `design-rules-for-clearance`: EDA constraint entries for voltage-based clearance rules between specific nets or net classes

## Process

1. Identify all voltage pairs that require clearance rules. This includes: power to ground, power to power (different rails), signal to signal (different voltage domains), and most critically, primary (mains-connected) to secondary (SELV) circuits. The primary-to-secondary barrier is a safety insulation barrier with specific clearance AND creepage requirements.
2. Calculate clearance from IPC-2221B Table 6-1: for internal conductors (conformal-coated or between layers), clearance is 0.1 mm + 0.1 mm per volt above 50V. For external conductors at sea level, bare board (no conformal coat), the requirements are more stringent. For example, 100V between bare external conductors at Pollution Degree 2 requires 0.4 mm clearance.
3. Calculate creepage from the safety standard: creepage depends on the voltage, pollution degree, material group (CTI of the PCB material), and the type of insulation (functional, basic, reinforced). Reinforced insulation (primary to secondary in a mains-powered device) typically requires 2x the basic insulation creepage. For FR-4 (Material Group IIIb), 240V reinforced insulation at Pollution Degree 2 requires approximately 5 mm creepage.
4. Implement as design rules: create net classes for primary-side and secondary-side nets. Set the clearance rule between these classes to the calculated value. For creepage, add a slot or cutout in the PCB between primary and secondary to increase the surface path length. A 1 mm wide slot adds the depth of the slot to the creepage path. Creepage is measured along the surface, including through slots.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
