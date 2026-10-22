# Enclosure Material And Manufacturing Selection

Select the enclosure material and manufacturing process as a coupled decision, since material choice constrains process and process constrains material, with cost driven by production volume.

## Inputs

- `structural-analysis-results`: Required material properties from structural analysis
- `critical-features-list`: Manufacturing-critical features

## Outputs

- `material-process-selection`: Selected material and manufacturing process with cost estimate at the target production volume, plus a runner-up option for different volumes
- `dfm-specification`: Design-for-manufacturing rules for the selected process: wall thickness, draft angles, radius requirements, tolerance capabilities

## Process

1. Map production volume to process. Under 100 units: machined from billet or sheet metal fabrication. 100-5000: die-cast aluminum or injection-molded plastic with prototype tooling. Over 5000: production injection molding or die casting with hardened steel tooling. Tooling cost for aluminum die casting: $15K-$50K. For plastic injection molding: $10K-$100K depending on complexity.
2. For metal enclosures: aluminum die casting (A380) gives good shielding, thermal conductivity, and strength. Minimum wall thickness 1.5mm. Draft angle 1-3 degrees per side. Surface porosity makes sealing gasket surfaces critical. Alternative: sheet metal (steel or aluminum) gives excellent flatness for sealing but limits geometry to bends and formed features.
3. For plastic enclosures: ABS for indoor products (good impact, easy to plate for EMI). Polycarbonate for outdoor products needing UV and impact resistance. Glass-filled nylon for high-temperature or structural applications. Minimum wall 1.2mm for ABS, 1.5mm for PC. Uniform wall thickness within 25% to prevent sink marks and warpage.
4. Address EMI for plastic enclosures. Options ranked by effectiveness: internal metal chassis (best, most expensive), vacuum metallization (40-60dB, moderate cost), conductive paint (20-40dB, low cost, poor adhesion over time), embedded wire mesh (30-50dB, molded in). Each adds cost and process steps.
5. Apply DFM rules for the selected process. Die casting: no undercuts without side pulls, parting line location drives cosmetic quality, ejector pin marks on non-cosmetic surfaces. Injection molding: uniform wall thickness, ribs at 60% of wall thickness to prevent sink, boss at wall intersections for screw retention, living hinges only in polypropylene or nylon.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
