# Activation And Waste Management

Calculate residual activation of accelerator and fusion components and design the radioactive waste management program.

## Inputs

- `pps-architecture`: Personnel protection system design
- `access-control-system`: Access control procedures
- `beam-permit-logic`: Beam enable conditions

## Outputs

- `activation-analysis`: Contact dose rates and isotope inventory after shutdown
- `waste-classification`: Waste categories and volumes by disposal pathway
- `decommissioning-estimate`: Preliminary plan and cost estimate for facility decommissioning

## Process

1. Calculate activation: Monte Carlo transport to get neutron (and proton) fluence spectra in each material. Activation code (FISPACT, ActiWiz, Cinder) folds fluence with activation cross-sections to compute isotope inventory vs irradiation time and cooling time. Output: contact dose rate (mSv/hr) at surface of component.
2. Plan maintenance access: cool-down time (hours to weeks) before hands-on maintenance is possible. Use ALARA planning: estimate collective dose for each maintenance task, compare to remote handling threshold (typically 10 mSv/hr contact dose). Provide remote handling capability where dose rates preclude hands-on access.
3. Waste classification: exempt (below clearance levels, can be recycled), very low level, low level, intermediate level (depends on national regulations). Accelerator waste is almost entirely short-lived isotopes (half-lives < 30 years) in metals. Fusion waste: activated steel is low-level if RAFM alloys are used.
4. Waste management: characterize by gamma spectroscopy and scaling factors. Package per disposal site acceptance criteria. Volume reduction where possible (compaction, melting). Document in waste tracking database. Storage for decay where classification improves with time.
5. Decommissioning: estimate total activation inventory at end of facility life. Plan for staged decommissioning (remove activated components, survey building for residual contamination, release building). Cost estimate: typically 5-15% of construction cost for accelerator facilities, higher for fusion due to tritium contamination.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
