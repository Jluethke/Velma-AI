# Metal Am Process Selection

Choose among laser powder bed fusion, electron beam melting, and directed energy deposition by part size, material, feature resolution, and the dominant cost driver.

## Inputs

- `part-requirements`: Material, envelope, minimum feature size, surface finish, structural duty, and production quantity
- `material-candidates`: Candidate alloys and their printability, available powder forms, and qualification history

## Outputs

- `process-selection`: The chosen additive process with the deciding factors and the rejected alternatives and why
- `build-envelope-fit`: How the part fits the chosen machine's build volume, including orientation options and nesting for throughput

## Process

1. Match feature resolution to process. Laser powder bed fusion (DMLS/SLM) holds minimum features near 0.3 to 0.5 mm with as-built surface roughness Ra of 8 to 15 um and layer thickness 20 to 60 um. Electron beam melting (EBM) runs hotter and faster but holds coarser features near 0.7 to 1.0 mm with Ra of 20 to 35 um. Directed energy deposition (DED) is for large near-net shapes and repairs, with features measured in millimeters.
2. Match material to process physics. EBM's hot build chamber (around 650 to 1000 C) suits crack-prone alloys such as titanium aluminides and reduces residual stress, and it processes reactive titanium in vacuum. Laser powder bed fusion covers the widest alloy range (Ti-6Al-4V, IN718, AlSi10Mg, 17-4PH, 316L). DED suits large steel and titanium structures and multi-material gradients.
3. Size the part against the build volume. Typical laser powder bed machines run 250 x 250 x 325 mm; large-format reach 400 to 800 mm per side. EBM volumes are similar but builds are faster per unit height. DED has effectively open-ended working volume on a gantry or robot. A part that needs splitting and joining changes the whole cost and qualification picture.
4. Identify the dominant cost driver before optimizing geometry. Laser powder bed cost scales with build height (machine time) and part volume (powder and energy), so packing many parts tall in one build and minimizing supports dominate unit cost. For a one-off large bracket, DED near-net plus machining often beats powder bed on both cost and lead time.
5. Reject additive where it loses. A simple prismatic part in a standard alloy is cheaper machined from billet. Reserve additive for geometry that only it can make: internal conformal cooling channels, topology-optimized load paths, consolidated multi-part assemblies, or long-lead castings you need in days.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
