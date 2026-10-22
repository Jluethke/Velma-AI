# Simulator Architecture Design

Design the simulator architecture: select the physics engine, sensor models, and environment representation, and define the simulation fidelity requirements.

## Inputs

- `system-under-test`: The autonomous system to be validated, with its interfaces
- `validation-objectives`: What the simulation must demonstrate (safety, performance, robustness)

## Outputs

- `simulator-design`: Simulator architecture with component selection, fidelity levels, and interface definitions
- `fidelity-requirements`: Required simulation fidelity for each component to achieve valid test results

## Process

1. Define the simulation loop. The simulator replaces the real world: it provides sensor data to the autonomous system and receives control commands back. The simulation loop: update physics (vehicle dynamics, other actors), render sensor data (camera images, lidar point clouds, radar returns), deliver sensor data to the system under test, receive and apply control commands, advance time. The loop rate must match the real-time sensor rates or run faster for accelerated testing.
2. Select the physics engine. Vehicle dynamics: bicycle model (fast, adequate for normal driving), multi-body dynamics (accurate suspension, tire, and chassis modeling for aggressive maneuvers), or lookup-table from real vehicle testing (highest accuracy, limited to the tested vehicle). Other actors: replay recorded trajectories (deterministic, limited coverage), reactive agents (respond to the ego vehicle, more realistic), or learned behavior models. Environment: static from HD map or 3D scan, dynamic elements (traffic lights, construction zones) from scenario scripts.
3. Design sensor models at appropriate fidelity. Camera: physically-based rendering (ray tracing for accurate lighting, reflections, and lens effects) gives the most realistic images but is computationally expensive. Reduced fidelity: rasterized rendering with post-processing for noise and blur. Minimum: sensor noise model applied to ground-truth detections (skip image rendering entirely for fast testing of planning and control). Lidar: ray casting against the 3D scene with noise, beam divergence, and multi-return modeling. Radar: point target model with range, Doppler, and cross-section, plus clutter generation. Match fidelity to the test objective: perception testing needs high-fidelity sensor models, planning testing can use ground-truth perception with injected errors.
4. Define the domain gap management strategy. No simulator perfectly matches reality. Identify the differences: visual appearance (rendering vs real images), physics (simplified dynamics vs real tire behavior), sensor noise (modeled vs actual statistical distribution), actor behavior (scripted vs human drivers). For each gap, either reduce it (improve the model) or account for it (validate that the gap does not invalidate the test results). Transfer learning: test in simulation for coverage, validate on real-world data for accuracy. Document the domain gaps and their impact on test validity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
