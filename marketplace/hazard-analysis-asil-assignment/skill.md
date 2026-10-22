# Hazard Analysis Asil Assignment

Perform hazard analysis and risk assessment (HARA) for the autonomous system: identify hazards, assess severity, exposure, and controllability, and assign ASIL ratings per ISO 26262.

## Inputs

- `system-description`: Architecture and functional description of the autonomous system
- `operational-design-domain`: Environments and conditions the system is intended to operate in

## Outputs

- `hazard-register`: List of identified hazards with severity, exposure, controllability, and ASIL ratings
- `safety-goals`: Top-level safety goals derived from the hazards, each with an ASIL rating

## Process

1. Identify hazardous events. For each vehicle-level function (longitudinal control, lateral control, perception, localization), consider what happens when the function fails or behaves incorrectly. A failed braking function leads to collision. A failed steering function leads to lane departure. A false detection leads to unnecessary braking. A missed detection leads to collision with an undetected object. Be exhaustive: consider both commission (doing the wrong thing) and omission (failing to do the right thing) for every function.
2. Assess severity per ISO 26262. S0: no injuries. S1: light to moderate injuries. S2: severe injuries, survival probable. S3: life-threatening, survival uncertain. Assess for the most severe plausible consequence of each hazardous event, considering the operational environment and other road users (pedestrians, cyclists are more vulnerable than other cars).
3. Assess exposure and controllability. Exposure (E0-E4): how often is the system in the operating scenario where this hazard could occur. Controllability (C0-C3): how likely is the driver or other road users to avoid harm if the hazardous event occurs. For highly automated systems (SAE Level 4+), controllability by the human driver is C3 (uncontrollable) by definition because no driver intervention can be assumed. This pushes most hazards to higher ASIL levels.
4. Assign ASIL and derive safety goals. Use the ISO 26262 ASIL determination table from S, E, and C ratings. Each hazardous event gets an ASIL (A through D, or QM for no safety requirement). Formulate safety goals as top-level requirements: 'The autonomous driving system shall prevent unintended acceleration' (ASIL D). Each safety goal inherits the ASIL of its parent hazardous event. The safety goals are the starting point for the safety concept.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
