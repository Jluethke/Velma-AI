# Electrode Metallization Process

Deposit and pattern the electrode metal traces and recording sites to achieve the target impedance and charge injection capacity.

## Inputs

- `fabricated-substrate`: Patterned substrate with dielectric layers
- `electrode-design`: Recording site diameter, material choice, and impedance target

## Outputs

- `metallized-array`: Electrode array with patterned metal traces and exposed recording sites
- `impedance-map`: Measured impedance at 1 kHz for every electrode site across the wafer, with yield and uniformity statistics

## Process

1. Deposit the conductor metal stack by sputtering or e-beam evaporation. Standard stack: 20 nm titanium adhesion layer, 200-500 nm gold or platinum conductor, 20 nm titanium cap. For traces that must be thin and flexible: 200 nm gold on 20 nm Cr adhesion layer. Platinum is preferred for electrode sites due to superior electrochemical stability; gold is acceptable for traces that will be insulated.
2. Pattern metal using lift-off or wet/dry etch. Lift-off: spin photoresist, lithographically pattern, deposit metal, dissolve resist to lift off unwanted metal. Works well for features above 5 um. For sub-micron features, use dry etch (Ar ion milling of Pt, Cl2-based RIE for Au/Ti) with a hard mask. Alignment accuracy between metal layer and shank geometry must be within 2 um.
3. Open recording sites by etching the top dielectric in defined windows. Site diameter determines impedance: 15 um diameter bare Pt site gives 500 kOhm to 1 MOhm at 1 kHz. To reduce impedance, electroplate with high-surface-area coatings: platinum black (electrodeposited from chloroplatinic acid, reduces impedance to 10-50 kOhm), iridium oxide (AIROF by pulsed electrodeposition, also gives high charge injection capacity for stimulation, 1-4 mC/cm2), or PEDOT:PSS (electropolymerized from EDOT monomer in PSS solution, impedance 5-30 kOhm). Each coating has different long-term stability.
4. Measure impedance at 1 kHz for all sites using electrochemical impedance spectroscopy in PBS at room temperature. Apply a 10 mV RMS sinusoidal excitation. Calculate yield: percentage of sites within 2x of median impedance. Typical yield target: greater than 90%. Sites with impedance greater than 5x median indicate fabrication defects (incomplete metallization, residual dielectric). Reject or rework defective sites.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
