# Physical Interaction Safety

Ensure physical safety for humans interacting with the robot: implement power and force limiting per ISO/TS 15066, design protective stops, and select appropriate safety-rated components.

## Inputs

- `robot-system`: Robot hardware with actuator and structure specifications
- `user-roles`: Who may be in physical proximity and what contact types are possible

## Outputs

- `physical-safety-design`: Power and force limits, protective device selection, and safety zone configuration
- `risk-assessment`: Contact scenario analysis with force/pressure calculations against ISO/TS 15066 limits

## Process

1. Identify contact scenarios. Transient contact: the robot strikes a person and the person can move away (quasi-static impact followed by retraction). Quasi-static contact: the person is trapped between the robot and a fixed object (clamping). For each scenario, identify: the body region that could be contacted (head, chest, hand, leg), the effective mass of the robot at the contact point (from the manipulator dynamics and configuration), and the relative velocity at impact.
2. Calculate contact forces and pressures. For transient contact, the impact force depends on the effective mass of the robot at the contact point and the impact velocity: F = sqrt(k * m_reduced * v^2) where k is the contact stiffness (depends on body region, from ISO/TS 15066 Annex A) and m_reduced is the reduced mass (robot effective mass in series with body mass). For quasi-static contact, the force is determined by the robot's maximum force output in the trapped direction. Calculate the resulting pressure from the contact area (robot surface geometry).
3. Compare against ISO/TS 15066 biomechanical limits. The standard provides maximum permissible force and pressure for each body region, for both transient and quasi-static contact. Example: for the hand (transient), maximum force is 130 N and maximum pressure is 160 N/cm^2. If the calculated force or pressure exceeds the limit, implement mitigation: reduce robot speed (lower impact velocity), add padding (larger contact area, lower pressure, lower contact stiffness), reduce payload (lower effective mass), restrict workspace to avoid trapping scenarios.
4. Design the protective stop system. Safety-rated monitored stop: the robot stops all motion when a person enters the collaborative workspace, uses safety-rated sensors (safety laser scanner, light curtain, safety-rated camera). Speed and separation monitoring: the robot dynamically adjusts its speed based on the distance to the nearest person, stopping before a collision could exceed the force limit. Power and force limiting: the robot operates at forces below the biomechanical limits at all times, using compliant actuators, joint torque sensing, or external force/torque sensors. Select the method based on the task: power/force limiting allows continuous collaboration, monitored stop is simpler but stops production when humans are near.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
