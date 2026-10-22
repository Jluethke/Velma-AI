# Sterilization Method Selection

Select the sterilization method based on device materials, design, and performance requirements, with material compatibility testing.

## Inputs

- `device-materials-list`: All materials in the device with thermal, chemical, and radiation sensitivity data
- `device-design-characteristics`: Geometry, packaging, electronics presence, moisture sensitivity

## Outputs

- `sterilization-method`: Selected method (EtO, gamma, e-beam, steam, VHP) with rationale and material compatibility evidence
- `material-compatibility-data`: Test results showing device performance after sterilization exposure at qualification dose

## Process

1. Screen methods by material compatibility: gamma and e-beam cause chain scission in PTFE, UHMWPE, and some polymers (cross-linking in others). EtO requires gas permeation through packaging and residual limits. Steam requires heat tolerance above 121C. VHP requires oxidation tolerance. Electronics generally exclude steam and may have radiation dose limits.
2. For each candidate method, expose material coupons or test articles to the qualification-level dose (typically 1.5x to 2x the sterilization dose for radiation, or a multi-cycle exposure for EtO). Test mechanical properties, dimensional stability, color change, and device functionality after exposure.
3. For radiation sterilization, determine the dose window: minimum dose for sterility (25kGy is the standard starting point, VDmax method per ISO 11137-2 can qualify a lower dose), maximum dose limited by material degradation. If the window is too narrow, radiation is not suitable.
4. For EtO, verify gas penetration: package the device as intended and run a fractional cycle. Place biological indicators (Bacillus atrophaeus spore strips) at the most difficult-to-reach locations. If BIs survive, redesign packaging or device access for gas penetration.
5. Document the selection rationale, referencing material compatibility data, and identify the applicable standard: ISO 11135 for EtO, ISO 11137 for radiation, ISO 17665 for steam, ISO 22441 for VHP.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
