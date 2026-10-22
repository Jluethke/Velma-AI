# Sotif Analysis

Perform Safety of the Intended Functionality (SOTIF) analysis per ISO 21448: identify performance limitations and triggering conditions that could lead to hazards even without system faults.

## Inputs

- `safety-requirements`: Functional safety requirements from ISO 26262 analysis
- `system-description`: Detailed system design including perception and planning algorithms

## Outputs

- `sotif-analysis`: Triggering conditions, performance limitations, and residual risk assessment for each perception and decision function
- `sotif-validation-plan`: Plan to demonstrate that residual SOTIF risk is acceptable

## Process

1. Identify performance limitations of each function. Perception: maximum detection range by object type and conditions, minimum object size for detection, classification accuracy by class and conditions, false positive and false negative rates. Localization: accuracy degradation in specific environments (tunnels, featureless areas). Planning: scenarios where the planner produces uncomfortable or suboptimal behavior, edge cases in prediction (unusual road user behavior). These are not faults; they are inherent limitations of the algorithms and sensors.
2. Identify triggering conditions. A triggering condition is a specific scenario that activates a performance limitation and leads to a hazardous behavior. Example: low sun angle (triggering condition) causes camera saturation (performance limitation) leading to missed pedestrian detection (hazardous behavior). Build a triggering condition catalog by systematically combining environmental conditions, road user behaviors, and infrastructure configurations with each known performance limitation.
3. Classify scenarios into SOTIF areas. Area 1: known safe scenarios (system performs correctly). Area 2: known hazardous scenarios (identified triggering conditions, mitigations in place). Area 3: unknown hazardous scenarios (not yet identified, reduced through testing and analysis). Area 4: unknown safe scenarios. The goal is to minimize Area 3 through systematic exploration: simulation, real-world testing, and expert analysis. No system can eliminate Area 3 entirely; the argument is that it is acceptably small.
4. Develop the SOTIF validation strategy. Combine: analysis-based methods (systematic triggering condition identification, coverage argument), simulation-based testing (parametric variation of triggering conditions, adversarial scenario generation), real-world testing (mileage-based statistical argument, scenario-based testing at test tracks). The validation target is that the residual risk from SOTIF-related hazards is below the acceptable risk threshold. This threshold comes from the societal risk acceptance framework (e.g., the system must be at least as safe as an attentive human driver).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
