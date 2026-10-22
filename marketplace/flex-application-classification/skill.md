# Flex Application Classification

Classify the flex application as static (bend once during assembly), dynamic (repeated bending in use), or flex-to-install, and select the design rules accordingly.

## Inputs

- `application-description`: How the flex will be used: hinge, cable replacement, fold for packaging, connector elimination
- `bend-cycles`: Expected number of bend cycles over product lifetime
- `bend-angle`: Maximum bend angle required in degrees

## Outputs

- `flex-classification`: Static flex (< 25 bends), flex-to-install (25 to 1000 bends), or dynamic flex (> 1000 bends)
- `design-rule-set`: Which IPC-2223 design rules apply: copper type, layer count limits, bend radius multipliers
- `material-constraints`: Copper type (rolled annealed for dynamic, electrodeposited acceptable for static), adhesive requirements, coverlay vs solder mask

## Process

1. Count expected bend cycles over the product lifetime. Include assembly, service, and in-use bending. A laptop hinge that opens and closes 10 times per day for 5 years sees 18,000 cycles: that is dynamic flex and needs the most conservative design rules.
2. Classify: static flex allows more layers, tighter bend radius, and electrodeposited (ED) copper. Dynamic flex requires rolled annealed (RA) copper (ductile, survives repeated bending), fewer layers (ideally single-layer in the bend zone), and larger bend radius.
3. Select copper type: RA copper has an elongation of 20 to 30%, meaning it can stretch that much before cracking. ED copper has 5 to 10% elongation. In a dynamic flex application, the outer copper layer experiences tensile strain = t / (2 * R + t) where t is total stackup thickness and R is bend radius. This strain must stay below the copper's fatigue limit for the required cycle count.
4. Select coverlay vs solder mask: flexible coverlay (polyimide film adhesive-bonded over the traces) is required for all flex regions. Liquid photoimageable solder mask is too brittle for flex regions and will crack, exposing copper to corrosion and fatigue. Solder mask is used only in rigid sections and stiffened areas.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
