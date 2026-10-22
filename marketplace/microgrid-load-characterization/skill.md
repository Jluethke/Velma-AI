# Microgrid Load Characterization

Characterize the microgrid load: critical vs non-critical classification, load profiles, power quality requirements, and reliability targets.

## Inputs

- `site-description`: Facility type, building list, process loads, and existing electrical infrastructure
- `historical-load-data`: 12 months minimum of interval meter data (15-minute or hourly), peak demand, energy consumption, and power factor

## Outputs

- `load-classification`: Loads classified as critical (must be served in island mode), priority (served if capacity allows), and non-critical (shed in island mode), with power demand for each category
- `load-profile-analysis`: Peak, average, and minimum demand by category, daily and seasonal load shapes, power factor profile, and power quality requirements

## Process

1. Classify loads by criticality. Critical loads require continuous power (life safety, data centers, refrigeration for perishables, security systems). Priority loads can tolerate brief interruptions but should be restored quickly (HVAC, lighting for occupied spaces, communications). Non-critical loads can be shed for extended periods during island mode (decorative lighting, non-essential equipment, EV charging).
2. Build load profiles for each category. From interval meter data, extract the hourly load shape for weekdays and weekends, by season. Identify the peak coincident demand (all categories simultaneously) and the critical-only peak demand. The ratio of critical peak to total peak determines the minimum generation capacity for island mode. Typical ratios: military base 40-60%, hospital campus 60-80%, data center 90-100%.
3. Characterize power quality requirements. Voltage: ANSI C84.1 Range A for continuous, Range B for occasional excursions. Frequency: 60 Hz +/- 0.5 Hz for normal, +/- 3 Hz for transient (depends on connected equipment sensitivity). Harmonics: IEEE 519 limits at the PCC. Identify any loads with special requirements: sensitive electronics (CBEMA/ITIC curve compliance), motor starting (voltage dip limits), or three-phase balance requirements.
4. Define reliability targets. Express as SAIDI (minutes of interruption per year) and SAIFI (number of interruptions per year) for the microgrid. A military facility may target SAIDI less than 60 minutes (99.99% availability). A commercial campus may accept SAIDI less than 500 minutes (99.9%). These targets drive the redundancy requirements for generation and switching equipment.
5. Estimate load growth. Project load changes over the microgrid design life (typically 20-25 years). Account for building additions, EV charging infrastructure, electrification of heating, and energy efficiency improvements. Size the microgrid infrastructure (switchgear, conductors, transformer capacity) for the projected peak, even if the initial generation is sized for current loads.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
