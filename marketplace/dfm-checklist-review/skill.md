# Dfm Checklist Review

Review the design against a manufacturability checklist to flag features that are hard, costly, or risky to produce before release.

## Inputs

- `design-package`: The drawings or model with features, materials, finishes, and callouts to be reviewed
- `process-constraints`: The intended manufacturing processes and their known capabilities and limits

## Outputs

- `dfm-findings`: The flagged features with the manufacturability issue, severity, and a suggested design change for each
- `standardization-opportunities`: Opportunities to reduce part count, reuse standard features, and consolidate materials and finishes

## Process

1. Check features against the intended process limits. For machining, flag deep pockets (depth beyond about 4x tool diameter), internal sharp corners that force small tools, and features that need a fifth axis or custom tooling. For casting or molding, flag non-draftable walls, uneven wall thickness that causes sink and warp, and undercuts that force side-actions.
2. Challenge every tight tolerance and fine finish. Each tolerance band tighter than the process natural capability and each surface-finish callout below what function needs adds cost without value. Ask 'what breaks if this opens up?' for each; tolerances tighter than roughly plus or minus 0.025 mm on a machined feature or a mirror finish should each have a functional reason.
3. Reduce part count and standardize. Combine parts that are always assembled together (and never serviced apart), replace custom fasteners with standard ones, and consolidate the material and finish list. Every unique part number, material, and finish is a separate procurement, inventory, and qualification burden.
4. Design for assembly, not just for the part. Check that parts can only go together one way (poka-yoke), that fasteners are accessible with standard tools, that there is clearance for hands and tooling, and that the assembly sequence does not trap a part. Assembly cost often exceeds part cost.
5. Rank findings by severity and cost impact. Separate must-fix manufacturability blockers (a feature no available process can make) from cost-reduction opportunities (a tolerance that could open up). Carry the severity so the team fixes blockers before release and schedules cost reductions deliberately.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
