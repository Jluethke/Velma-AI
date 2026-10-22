# Tim Assembly Specification

Specify the TIM assembly process to achieve repeatable thermal performance in production, controlling the variables that cause unit-to-unit thermal resistance variation.

## Inputs

- `tim-candidates`: Selected TIM products
- `tim-failure-risk-assessment`: Failure mechanisms and expected life

## Outputs

- `tim-application-procedure`: Step-by-step assembly procedure including surface preparation, TIM application method, clamping sequence, and torque specification
- `tim-inspection-criteria`: Inspection method and acceptance criteria to verify proper TIM application without destructive testing

## Process

1. Specify surface preparation. Both surfaces must be clean and free of oils, flux residue, and particles. Clean with isopropyl alcohol and a lint-free wipe. For metal surfaces, verify flatness meets the TIM specification (most TIMs compensate for 25-50 microns of non-flatness but not more).
2. Define the application method for the selected TIM type. For grease: screen print through a stencil (most repeatable) or dispense in an X-pattern (center coverage is critical; edges can be under-filled). Stencil thickness sets the BLT. For pads: die-cut to the exact contact area, apply to the heat sink side first, remove the liner just before mating. For phase change: apply film to the heat sink, pre-flow by heating above phase change temperature.
3. Specify the clamping hardware and torque sequence. Clamping pressure must be uniform across the interface. Use at least 4 screws for a 30mm x 30mm interface, tightened in a cross pattern to prevent tilting. Spring-loaded fasteners (captive springs or Belleville washers) maintain clamp force through thermal expansion and compression set. Specify torque with a +/-10% tolerance.
4. Calculate the required clamp force. The TIM manufacturer specifies the clamping pressure for rated performance. Total force = pressure * area. For a 3mm x 3mm component with 200kPa recommended pressure: F = 200000 * 0.009 = 1800N. This force is split among the mounting screws and must not exceed the PCB or component load limits.
5. Define the inspection method. Non-destructive: thermal imaging of the assembled board under powered conditions. The TIM interface should show uniform temperature without hot spots indicating voids. Destructive (for first-article qualification): disassemble and inspect the TIM coverage pattern. Grease should show full contact area coverage without dry spots. Pads should show full compression without wrinkles or bubbles.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
