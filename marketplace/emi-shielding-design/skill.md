# Emi Shielding Design

Design EMI shielding into the enclosure to meet radiated emission and immunity requirements, treating every seam, aperture, and cable penetration as a potential leakage path.

## Inputs

- `enclosure-requirements`: EMC class and shielding requirements
- `sealing-design`: Gasket and sealing design from IP rating work

## Outputs

- `shielding-design`: Shielding specification for enclosure walls, seams, apertures, and cable entries with estimated shielding effectiveness at critical frequencies
- `aperture-treatment-plan`: Treatment for each opening: conductive gasket, waveguide-beyond-cutoff, mesh, conductive coating, or filtered connector

## Process

1. Calculate the required shielding effectiveness (SE) from the emission measurements without enclosure minus the emission limit, plus a 6dB margin. SE = 20*log10(E_unshielded / E_limit) + 6 dB. This tells you how much attenuation the enclosure must provide.
2. Estimate the SE of the enclosure material. A continuous metal shell provides absorption loss = 131.4 * t * sqrt(f * sigma_r * mu_r) dB where t is thickness in meters. A 1.5mm aluminum wall provides over 200dB at 1 MHz. The material is never the weak point; the seams and apertures are.
3. Treat every seam as a slot antenna. The SE of a slot is approximately SE = 20*log10(lambda / (2*L)) dB where L is the longest dimension of the slot and lambda is the wavelength. A 300mm seam with no gasket resonates near 500 MHz and radiates efficiently. Conductive gaskets or frequent screw contact points reduce the effective slot length.
4. Treat ventilation openings. For each aperture, if its longest dimension exceeds lambda/20, it leaks. Use waveguide-beyond-cutoff (honeycomb panels: each cell must be deeper than its diameter for 30dB+ attenuation) or conductive mesh (wire spacing less than lambda/20 at the highest frequency of concern).
5. Specify conductive gaskets for EMI seams. Beryllium copper finger stock for frequently opened covers. Conductive elastomer (silver-filled silicone) for sealed joints requiring both IP and EMI. Ensure metal-to-gasket-to-metal contact resistance is below 10 milliohms across the full perimeter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
