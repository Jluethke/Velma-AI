# Electrode Selection And Design

Select or design the electrode array from the signal specification, choosing electrode material, geometry, and array configuration to achieve the required impedance and selectivity.

## Inputs

- `signal-specification`: Target signal type, amplitude, bandwidth, spatial resolution
- `channel-count-requirement`: Number of channels needed
- `implant-constraints`: Invasiveness level, size, weight, lifetime requirement

## Outputs

- `electrode-design`: Electrode type (microelectrode array, ECoG grid, scalp electrode), material (Pt, IrOx, PEDOT:PSS, Ag/AgCl), geometry (site diameter, pitch, shank dimensions), and array configuration
- `impedance-specification`: Target electrode impedance at 1 kHz per site and expected impedance range, which drives amplifier input impedance requirements

## Process

1. Select electrode type from invasiveness and signal type. Intracortical single-unit recording: silicon microelectrode arrays (Utah array: 10x10, 400 um pitch, 1-1.5 mm shank length; Neuropixels: 384 sites on single shank). ECoG: thin-film platinum or PEDOT:PSS on flexible polymer (polyimide or parylene-C), site diameter 200 um to 2 mm. EEG: sintered Ag/AgCl wet electrodes or dry electrodes (gold pins, conductive polymer).
2. Select electrode material for target impedance and longevity. Bare platinum: 100-500 kOhm at 1 kHz for 15 um diameter sites. Iridium oxide (AIROF or SIROF): 10-100 kOhm, excellent charge injection capacity for combined recording/stimulation. PEDOT:PSS: 10-50 kOhm with lower noise floor but chronic stability questions beyond 6-12 months. Ag/AgCl for EEG: less than 5 kOhm after gel application.
3. Size the electrode site diameter from spatial selectivity requirement. For single-unit isolation, sites under 30 um diameter. For multi-unit or LFP, 50-200 um. For ECoG macro-contacts, 1-4 mm. Smaller sites have higher impedance (impedance scales roughly as 1/area), which increases thermal noise (Vrms = sqrt(4kTRB) where R is real part of impedance at signal bandwidth B). Calculate thermal noise floor and verify it is below target signal amplitude.
4. Define array configuration: electrode count, pitch, total footprint, connector. For chronic implants, the connector and cable are often the failure point. Consider integrated wireless to eliminate percutaneous connectors. For acute research, Omnetics or ZIF connectors are standard. Map the array footprint to the target brain region anatomy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
