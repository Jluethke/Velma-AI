# Array Packaging And Assembly

Package the fabricated electrode array into a functional implantable assembly including connector, cable, and hermetic enclosure for the electronics.

## Inputs

- `metallized-array`: Electrode array with patterned traces and verified recording sites
- `encapsulation-design`: Encapsulation material and feedthrough design

## Outputs

- `packaged-assembly`: Complete electrode array assembly with connector or wireless module, ready for sterilization
- `assembly-test-results`: Electrical continuity, impedance verification, insulation resistance, and mechanical integrity test results

## Process

1. Release the electrode array from the carrier wafer. For silicon arrays: singulate by dicing or laser cutting. For polymer arrays on sacrificial release layers: dissolve the release layer (aluminum in KOH, copper in ammonium persulfate) and carefully peel the flexible array from the carrier. Handle with care: polymer arrays are fragile during release.
2. Bond the array to its cable or flex circuit. Wire bonding (wedge bonding with 25 um gold or aluminum wire) connects array bond pads to a flexible printed circuit (FPC). For high-channel-count arrays, use flip-chip bonding with anisotropic conductive film (ACF) or gold stud bump bonding for hundreds of connections in a small area. Each bond adds series resistance (typically 0.1-1 Ohm per bond, negligible compared to electrode impedance).
3. Assemble into the housing. Attach the FPC cable to the hermetic housing feedthrough using connector or direct solder. Encapsulate the cable and transitions with medical-grade silicone (NuSil MED-4211) for flexibility and biocompatibility. For wireless assemblies: mount the ASIC, antenna coil, and battery/capacitor inside the titanium housing. Route the electrode lead out through the hermetic feedthrough. Pot internal connections with epoxy to prevent vibration damage.
4. Test the completed assembly. Electrical continuity: verify every channel from electrode tip to external connector/wireless output. Insulation resistance: apply 5 VDC between each channel and ground (saline bath), verify greater than 1 MOhm per channel. Impedance: re-measure all sites in PBS to confirm no degradation from assembly (impedance should be within 20% of pre-assembly values). Mechanical: pull-test the cable-to-housing junction to 2 N minimum without failure. Leak test the hermetic housing with helium leak detection (below 10^-8 atm-cc/s).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
