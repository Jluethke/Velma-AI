# Array Substrate Fabrication

Fabricate the electrode array substrate using silicon micromachining or polymer thin-film processing, defining the shank geometry and dielectric layers.

## Inputs

- `electrode-design`: Array geometry (shank count, length, width, pitch), substrate material (silicon, polyimide, parylene-C), and target impedance

## Outputs

- `fabricated-substrate`: Patterned substrate wafer with shank geometry, dielectric layers, and alignment marks for subsequent metallization
- `substrate-process-record`: Process parameters for each fabrication step (etch depth, deposition thickness, lithography alignment) and in-process QC measurements

## Process

1. For silicon-based arrays (Utah array style): start with a 500 um thick silicon wafer. Define electrode columns by dicing a grid of 400 um deep cuts on the backside, leaving an array of protruding columns on the front. Etch columns to needle shape using wet isotropic etch (HNA: HF/nitric/acetic) or DRIE (Bosch process for straight sidewalls followed by isotropic SF6 for tip sharpening). Target: 50-80 um diameter shank, 1-1.5 mm length, tip radius under 5 um for low-trauma insertion.
2. For polymer-based arrays (Michigan style on polyimide): spin-coat polyimide (HD Microsystems PI-2611, 10-20 um per layer) on a silicon carrier wafer with a sacrificial release layer. Cure at 350 degrees C under nitrogen. Pattern the shank outline using oxygen plasma RIE through an aluminum hard mask. For parylene-C substrates: deposit 5-10 um parylene by CVD (Gorham process) at room temperature, pattern by O2 plasma with photoresist mask.
3. Deposit the dielectric insulation layer. For silicon substrates: thermally grow 500 nm SiO2 followed by 200 nm LPCVD Si3N4 (dual-layer for pinhole reduction). For polymer substrates: the polymer itself serves as the dielectric; add a 1 um parylene-C barrier layer if using polyimide (parylene has lower moisture permeability). Verify dielectric integrity by measuring leakage current at 5 V DC in saline: must be below 1 nA per electrode site.
4. Perform in-process metrology: measure shank dimensions (optical microscopy, SEM for tip geometry), dielectric thickness (profilometry, ellipsometry), and surface roughness (AFM if electrode sites require sub-nm roughness characterization). Record all process parameters (etch rate, deposition rate, chamber conditions) for traceability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
