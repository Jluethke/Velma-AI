# Composite Manufacturing Selection

Select the manufacturing process for the composite structure and design the cure cycle, tooling approach, and layup sequence for production.

## Inputs

- `sandwich-design`: Core and facesheet configuration for the structure
- `joint-design`: Joint type and fastener pattern determining manufacturing sequence

## Outputs

- `manufacturing-plan`: Selected process (autoclave, OOA, RTM, filament winding, AFP), cure cycle definition, tooling concept, and layup instructions
- `process-quality-requirements`: Void content target, fiber volume fraction, dimensional tolerances, and in-process inspection requirements

## Process

1. Select process by part geometry and rate. Autoclave prepreg for highest quality (void content below 1%, fiber volume 57-62%) but lowest rate. Out-of-autoclave (OOA) prepreg for similar quality without autoclave capital cost. RTM for complex geometry and moderate volume. Filament winding for bodies of revolution. AFP for large contoured skins at moderate rate.
2. Design the cure cycle. For epoxy prepreg (e.g., 350F cure): ramp at 1-5 F/min to dwell temperature, hold for gel (optional intermediate hold for thick parts to manage exotherm), ramp to cure temperature, hold at cure for the specified time (typically 2 hours at 350F for aerospace epoxy), cool at a controlled rate (below 5 F/min to manage residual stress). Use embedded thermocouples to verify the actual part temperature follows the cure cycle.
3. Design the tool. Match the CTE of the tool to the part if possible (Invar for tight-tolerance aerospace parts, steel or aluminum for less critical). For female tools, account for spring-in from the CTE mismatch and cure shrinkage. Typical spring-in for a 90-degree corner is 1-2 degrees for carbon/epoxy.
4. Define the layup sequence. Stagger ply drops to avoid stress concentrations (minimum stagger distance is typically 6mm or 0.25 inches per dropped ply). Interleave ply orientations to distribute matrix cracking under fatigue. Avoid grouping more than 4 plies of the same orientation to limit free-edge delamination.
5. Set quality targets: void content below 2% (below 1% for primary structure), fiber volume fraction 55-62% for prepreg, dimensional tolerance per drawing, no delaminations or foreign object debris. Define the incoming material testing (resin gel time, fiber areal weight) and in-process checks (debulk vacuum level, thermocouple readings during cure).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
