# Coating Process Specification

Specify the coating application process, masking procedure, cure profile, and inspection methodology to produce repeatable coating coverage in production.

## Inputs

- `selected-coating`: Coating product, application method, and thickness
- `coating-trade-off-rationale`: Application constraints and requirements

## Outputs

- `coating-process-document`: Step-by-step process specification: surface preparation, masking, application, cure, de-mask, and inspection with acceptance criteria
- `rework-procedure`: Procedure for removing coating from specific areas for repair and recoating after component replacement

## Process

1. Specify surface preparation. The PCB must be clean and dry before coating. Residual flux, fingerprints, or moisture trapped under the coating cause adhesion failure and corrosion. Clean per IPC-A-610 requirements: deflux (if using no-clean flux, verify compatibility with coating), clean with appropriate solvent, and bake at 65C for 2-4 hours to drive off moisture.
2. Define the masking procedure. Masking options: peelable latex mask (hand-applied dots for test points and connectors), polyimide tape (Kapton) for straight-edge keep-outs, custom rubber boots for tall connectors. For selective spray: program the spray path to avoid keep-outs, but use masking as a backup for critical areas where overspray would cause functional failure.
3. Specify the application parameters. For spray: nozzle-to-board distance (150-200mm typical), spray pressure, fan pattern width, pass speed, and number of passes for target thickness. For dip: immersion speed (25-50mm/s), dwell time (3-5 seconds), withdrawal speed (sets the film thickness: slower = thicker). Record these parameters for process control.
4. Specify the inspection method. Visual inspection under UV light (most coatings fluoresce under 365nm UV): check for complete coverage in coated areas and absence of coating in keep-outs. Accept the coating if: no bubbles larger than 3mm diameter, no uncoated areas in the required zone (except component tops that are not specified for coverage), no bridging between closely spaced leads, and coating in keep-outs within the rework tolerance.
5. Write the rework procedure. For acrylic: apply solvent (butyl acetate or proprietary stripper) to the repair area with a brush, wait for the coating to soften, and peel or wipe away. Replace the component. Clean the area. Recoat using a brush, applying two thin coats with a 10-minute flash between coats. Re-inspect under UV. For silicone: carefully cut and peel the coating from the repair area using a scalpel, taking care not to damage adjacent components or traces.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
