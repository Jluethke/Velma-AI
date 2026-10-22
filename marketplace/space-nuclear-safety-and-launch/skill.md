# Space Nuclear Safety And Launch

Navigate the safety analysis and regulatory approval process required to launch a nuclear power source into space.

## Inputs

- `source-type-selection`: Nuclear source type and its radioactive inventory
- `launch-vehicle`: Launch vehicle and its abort scenarios
- `mission-profile`: Orbit, mission duration, and end-of-mission disposal

## Outputs

- `safety-analysis-report`: Nuclear risk assessment for all mission phases
- `regulatory-approvals`: Required approvals timeline and responsible agencies
- `nuclear-launch-safety`: Probability of release and consequence analysis

## Process

1. Prepare the Safety Analysis Report (SAR): analyze all mission phases for nuclear risk. Pre-launch: nuclear material is in storage and transport (standard nuclear material handling procedures). Launch: abort scenarios (pad explosion, range safety destruct, ascent failure with water impact or land impact). In-space: nominal operation (no public risk). End-of-mission: disposal orbit must ensure the radioactive inventory decays to safe levels before any possible reentry.
2. For radioisotope systems: the GPHS modules are designed to contain the PuO2 through all credible accident scenarios. Impact testing: GPHS modules are tested by impacting them onto steel plates at terminal velocity from launch abort reentry. Fire testing: GPHS modules survive solid propellant fire and liquid propellant pool fire. Vaporization: calculate the fraction of inventory that could be released as respirable particles in a worst-case explosion and fire. The containment is the safety basis.
3. For fission reactors: the reactor is launched cold (no fission products, negligible radioactivity from fresh uranium fuel). The safety concern is inadvertent criticality: the reactor must not achieve a critical configuration from any accident scenario (impact compaction, water flooding as moderator). Design features: mechanical locks on control elements for launch, geometry and reflector design that preclude criticality from compaction, neutron poisons that ensure subcriticality if flooded.
4. Submit to the INSRP (Interagency Nuclear Safety Review Panel): INSRP includes representatives from DOE, DOD, EPA, NASA, and NRC. They independently review the SAR and provide a Safety Evaluation Report (SER) to the Office of Science and Technology Policy (OSTP). The OSTP Director (or designee) grants launch approval. This process takes 3 to 5 years from SAR start to launch approval.
5. Perform the probabilistic risk assessment: calculate the probability of each accident scenario, the conditional probability of nuclear material release given the accident, and the consequences (population dose from atmospheric dispersion of released material). Acceptable risk is typically less than 1 in 10,000 probability of exceeding a specified population dose per mission.
6. Address end-of-mission disposal: for radioisotope systems in LEO, the orbit must be high enough that natural decay (orbital lifetime) exceeds the time for the radioactivity to decay to safe levels (typically >300 years for Pu-238, requiring orbit above ~700 km altitude). For fission reactors, the orbital lifetime must exceed the time for the fission product inventory to decay (typically >1000 years, requiring orbit above ~900 km or disposal in a heliocentric orbit).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
