# Enclosure Structural Analysis

Verify the enclosure structure survives shipping, installation, and operational loads through hand calculations and FEA, focusing on the failure modes that actually kill products.

## Inputs

- `thermal-strategy`: Thermal management approach affecting enclosure geometry
- `thermal-interface-specification`: Mounting methods creating structural loads

## Outputs

- `structural-analysis-results`: Stress, deflection, and natural frequency results for each load case with factors of safety
- `critical-features-list`: Features requiring attention in manufacturing: minimum wall thickness, boss dimensions, snap-fit geometry, and screw engagement length

## Process

1. Analyze the drop test load case first. This is the most common field failure for portable products. The deceleration from a 1-meter drop onto concrete is approximately 1500g for a rigid product. Calculate the force on PCB mounting bosses: F = m_pcb * a. Check boss shear stress: tau = F / (pi * d * L) where d is boss diameter and L is engagement length.
2. Check wall deflection under internal pressure (sealed enclosures expand when heated) and external pressure (altitude changes for shipped products). A 200mm x 150mm panel of 2mm aluminum deflects approximately 0.15mm under 10kPa internal pressure. If deflection exceeds the gasket compression margin, the seal fails.
3. Calculate the PCB natural frequency. The PCB must not resonate at the excitation frequencies. For a simply-supported rectangular plate: fn = (pi/2) * sqrt(D/(rho*h)) * (1/a^2 + 1/b^2) where D is the flexural rigidity, a and b are the span dimensions. Target fn above 150Hz for automotive, above 50Hz for industrial.
4. Size screw bosses for plastic enclosures. Thread-forming screws in ABS: boss OD should be 2.0-2.5 times the screw OD. Boss depth should give engagement length of 2.0-2.5 times screw diameter. Wall section must be thick enough to resist hoop stress from screw insertion torque.
5. Run FEA for load cases where hand calculations are insufficient: complex geometry, combined loading, fatigue. Use the correct material model: elastic for metals under yield, elastic-plastic for limit load analysis, viscoelastic for plastics under sustained load (creep). Check von Mises stress against yield strength with a safety factor of at least 2.0 for ductile materials.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
