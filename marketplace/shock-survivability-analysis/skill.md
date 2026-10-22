# Shock Survivability Analysis

Analyze the product structure and components for survival under the defined shock loads, identifying the weak points before building a prototype.

## Inputs

- `shock-specification`: Shock pulse parameters for each condition
- `shock-response-spectrum`: SRS for each shock event

## Outputs

- `critical-failure-modes`: Ranked list of components and features most likely to fail under shock, with the failure mechanism for each
- `design-changes-needed`: Specific design changes to address each critical failure mode before prototyping

## Process

1. Identify the three most common shock failure modes in electronics: 1) solder joint fracture from board flexure (especially BGA and large ceramic capacitors), 2) PCB fracture at stress concentration points (near mounting holes, heavy components, board edges), 3) connector intermittent contact or housing fracture.
2. Calculate the force on each PCB mounting point: F = m_board * a_peak / n_mounts where n_mounts is the number of fasteners. For a 200g board with 4 screws at 500g shock: F = 0.2 * 500 * 9.81 / 4 = 245N per screw. Check that the boss, standoff, and screw can handle this in shear and tension.
3. Analyze solder joints of the largest BGA and MLCC components. Under shock, the board bends and solder joints at the component corners experience the highest strain. Strain = (board_curvature * distance_from_neutral_axis * package_length) / (2 * solder_height). Compare to the solder fracture strain (approximately 1-2% for SAC305).
4. Check tall, heavy components for lead and solder stress from inertial loading. A 30g transformer at 500g shock exerts 147N on its solder joints. Divide by the total solder joint area to get stress, and compare to solder shear strength (approximately 25-35 MPa for SAC305).
5. Specify design mitigations: add corner screws near large BGAs to reduce local board deflection, use adhesive (underfill) on BGA corners, avoid placing MLCC components larger than 0402 within 5mm of mounting holes or board edges, add strain relief to flex cables, use positive-locking connectors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
