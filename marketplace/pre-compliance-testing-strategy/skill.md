# Pre Compliance Testing Strategy

Execute a pre-compliance EMC test sequence using near-field probes and a spectrum analyzer to find and fix emission problems before formal testing.

## Inputs

- `emission-source-map`: Known emission sources and frequencies
- `filter-topologies`: Designed filters to verify
- `shield-termination-design`: Shield designs to verify
- `dominant-mechanisms`: Ranked mechanisms to hunt for

## Outputs

- `near-field-scan-results`: Near-field probe measurements identifying the physical location of each emission source on the PCB
- `pre-compliance-radiated-results`: Radiated emissions measured in a shielded room or OATS approximation, compared to regulatory limits
- `fix-priority-list`: Prioritized list of fixes with expected dB improvement for each, ordered by cost-effectiveness
- `test-report`: Pre-compliance test report documenting measurements, identified issues, and implemented fixes

## Process

1. Start with near-field probing: use an H-field probe (small loop) to scan the PCB surface while monitoring the spectrum analyzer. The probe shows where current loops are radiating. Move systematically across the board, noting the physical location and frequency of each emission peak. This identifies the source before you try to fix it.
2. Measure conducted emissions with a LISN (or LISN emulator) on each power port. Compare to the regulatory limit. Identify frequencies that exceed or approach the limit. Correlate with the known switching frequencies and their harmonics from the emission source map.
3. Measure radiated emissions in a shielded room (or outdoors with ambient subtracted if no chamber is available). Use a calibrated antenna at 3 meters (10 meters for Class A, normalize to 10 m using -20*log10(3/10) = +10.5 dB correction for 3m measurements). Rotate the EUT and scan all polarizations. Compare to CISPR 32 or FCC Part 15 limits.
4. Build the fix priority list: for each emission that exceeds the limit, calculate the required attenuation (excess + 6 dB margin). Match to the available fix (filter, shield improvement, layout change, ferrite addition). Rank by cost-effectiveness: a 10-cent ferrite bead that gives 15 dB at the problem frequency beats a $2 shield can that gives 20 dB. Implement fixes, re-measure, and iterate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
