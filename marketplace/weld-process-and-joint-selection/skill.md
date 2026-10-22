# Weld Process And Joint Selection

Select the welding process and joint configuration based on the base material, service environment, access constraints, and production requirements.

## Inputs

- `base-material`: Material specification (alloy, thickness, condition), including any dissimilar metal combinations
- `service-requirements`: Operating environment (temperature, corrosion, fatigue loading), design code (AWS D1.1, ASME IX, EN ISO 15614), and quality level requirements

## Outputs

- `selected-process`: Welding process (GTAW, GMAW, SAW, laser, EBW, FSW) with rationale including deposition rate, heat input range, and position capability
- `joint-configuration`: Joint type (butt, fillet, lap), groove geometry (V, U, J, double-V), root opening, and backing requirements

## Process

1. Match process to material. GTAW (TIG) for reactive metals (titanium, zirconium), thin sections, and root passes where quality is critical. GMAW (MIG) for carbon and stainless steels at higher deposition rates. SAW for thick sections in the flat position (highest deposition rate). Laser beam welding for high-speed, low-distortion joints in thin to moderate sections. EBW for deep penetration in a single pass (vacuum environment required). FSW for aluminum alloys where fusion welding creates porosity or hot cracking.
2. Select the joint type from the load path. Butt joints for full-strength connections (CJP or PJP). Fillet joints for T and lap connections (size by throat dimension to meet strength). The weld must be designed so that the critical cross-section is in shear through the weld throat, not in tension across a root defect.
3. Design the groove geometry. For butt joints in thick sections, single-V for one-sided access, double-V to balance distortion and reduce weld volume (double-V uses roughly 50% of the filler metal volume of single-V for sections above 20mm). Root opening and included angle must allow electrode access to the root. J or U grooves for thick sections to further reduce weld volume but require machining.
4. Specify the filler metal. Match or slightly overmatch the base metal strength. For dissimilar metal joints, select a filler that avoids brittle intermetallic formation at the diluted composition. Consult the Schaeffler or WRC-1992 diagram for stainless steel and nickel alloy combinations to predict the weld metal microstructure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
