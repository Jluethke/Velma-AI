# Acoustic Requirement Definition

Define acoustic performance requirements for the space based on its function, applicable standards, and user expectations.

## Inputs

- `space-description`: Room geometry, surface materials, volume, and intended function (lecture hall, office, studio, etc.)
- `acoustic-goals`: Desired acoustic quality: reverberation, speech clarity, noise isolation, background noise level

## Outputs

- `reverberation-target`: Target RT60 by octave band for the room function, from standards or published guidelines
- `noise-criteria`: Background noise target (NC, RC, or PNC curve) for the room function
- `sound-insulation-requirements`: Required STC or OITC for walls, floors, and ceilings separating adjacent spaces

## Process

1. Determine the room function and look up published targets. Speech rooms (classrooms, courtrooms): RT60 of 0.4-0.8s depending on volume. Music rooms: 1.2-2.0s depending on genre (dry for amplified, wet for orchestral). Open offices: short RT with good absorption overhead.
2. Set background noise criteria: NC-25 to NC-30 for studios and theaters, NC-30 to NC-35 for conference rooms, NC-35 to NC-40 for open offices. Preferred noise criterion RC (room criterion) also specifies spectral balance to avoid rumbly or hissy character.
3. Define sound insulation requirements between adjacent spaces. STC 50 for normal office-to-office, STC 55-60 for conference rooms, STC 60+ for music practice rooms. OITC for exterior walls exposed to traffic or aircraft. Use IIC (impact insulation class) for floor-ceiling assemblies above noise-sensitive spaces.
4. Identify any special requirements: low-frequency control for recording studios (modal analysis of room dimensions), flutter echo prevention in parallel-wall rooms, first reflection control for critical listening positions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
