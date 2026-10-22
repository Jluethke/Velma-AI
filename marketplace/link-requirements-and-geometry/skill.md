# Link Requirements And Geometry

Set the required data rate from data volume and contact time, and pick a frequency band for the link geometry.

## Inputs

- `data_volume_per_day`: Payload and housekeeping data that must be downlinked each day.
- `orbit_parameters`: Orbit that sets slant range and contact duration.
- `ground_network`: Ground-station locations, antenna sizes, and elevation masks.

## Outputs

- `link_requirements`: Band, duplex plan, and availability targets.
- `contact_geometry`: Slant range and contact time per pass.
- `required_data_rate`: Bit rate needed to clear the daily data volume.

## Process

1. Required bit rate = daily data volume / total usable contact time; a low-orbit pass over one station may last only 6 to 10 minutes, forcing high instantaneous rate.
2. Compute slant range from altitude and the minimum elevation mask (typically 5 to 10 deg); at a low mask the range and atmosphere are worst.
3. Choose a band by data rate and constraints: UHF for low-rate telemetry, S-band near 2.2 GHz for command and housekeeping, X-band near 8.4 GHz for science downlink, Ka-band near 26 GHz for very high rate.
4. Higher bands give more antenna gain for a given size but suffer more rain attenuation and tighter pointing, and require spectrum coordination.
5. Record the signal wavelength lambda = c / f (c = 3.0e8 m/s), since antenna gain and path loss both scale with it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
