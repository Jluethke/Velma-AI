# Acoustic Treatment Design

Design absorption, diffusion, and insulation treatments to achieve the acoustic targets in the space.

## Inputs

- `space-description`: Room geometry, surface materials, and volume
- `reverberation-target`: Target RT60 by octave band
- `noise-criteria`: Background noise target
- `sound-insulation-requirements`: Required STC/OITC for partitions

## Outputs

- `absorption-treatment-plan`: Type, location, and area of absorptive and diffusive treatments with predicted RT60
- `partition-design`: Wall, floor, and ceiling construction specifications to meet STC/OITC requirements
- `hvac-noise-mitigation`: Duct silencer, terminal unit, and diffuser noise specifications to meet background noise criteria

## Process

1. Calculate the existing reverberation time from the Sabine equation: RT60 = 0.161*V/A where V is volume in m3 and A is total absorption in sabins. For rooms with high absorption, use the Eyring equation: RT60 = 0.161*V / (-S*ln(1-alpha_avg)).
2. Determine the additional absorption needed: delta_A = A_target - A_existing, where A_target = 0.161*V/RT60_target. Select absorber type: porous absorbers (fiberglass, mineral wool, open-cell foam) absorb mid and high frequencies. Thickness should be at least one-quarter wavelength of the lowest frequency to treat: 100mm for absorption down to 850 Hz, 200mm for 425 Hz.
3. For low-frequency control below 250 Hz: use resonant absorbers. Helmholtz resonators (perforated panels over air cavity) tune to specific frequencies. Membrane absorbers (thin panels flexing over a cavity) absorb at the panel resonance frequency.
4. Place absorption strategically. For speech: first reflection points on walls and ceiling near the listener. For reverberation control: distribute absorption across surfaces, not concentrated on one surface (which creates uneven decay). Add diffusion (QRD or Schroeder diffusers) where sound needs to be scattered without being absorbed, such as the back wall of a concert hall.
5. Design partitions for the required STC. Single stud wall with one layer of gypsum each side: STC 33-38. Double gypsum: STC 38-43. Staggered stud or resilient channel: STC 45-55. Double stud wall: STC 55-65. Seal all gaps: a 1% open area in a wall reduces TL by 10-15 dB.
6. Design HVAC for the background noise target. Calculate noise from the air handler, fan, duct-generated noise, and terminal device. Size duct silencers for insertion loss at the frequencies where the duct noise exceeds the NC curve. Use lined ductwork (minimum 1.2 m of lined duct before the first room outlet). Limit supply air velocity at the diffuser to avoid regenerated noise (typically below 2.5 m/s for NC-30 spaces).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
