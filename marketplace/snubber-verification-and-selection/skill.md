# Snubber Verification And Selection

Compare snubber and clamp options, select the best approach for the application, verify the design through simulation or bench measurement, and finalize component specifications.

## Inputs

- `active-clamp-topology`: Active clamp design if applicable
- `efficiency-improvement`: Efficiency comparison between clamp approaches

## Outputs

- `selected-snubber-design`: Final snubber or clamp design with complete component specifications: part numbers, voltage ratings with derating, power ratings, and PCB placement requirements
- `verification-results`: Simulated or measured drain voltage waveform with the snubber installed, confirming peak voltage is within the MOSFET safe operating area with margin

## Process

1. Compare the options. Simple RC snubber: lowest cost, adequate for low-power designs where snubber loss is under 1% of output. RCD clamp: standard for flyback under 100W, easy to design and reliable. Active clamp: justified when leakage loss exceeds 2-3% of output power, typically for higher-power flyback or forward converters.
2. For the selected design, verify with SPICE simulation. Model the parasitic inductances, MOSFET Coss (nonlinear, use the manufacturer's SPICE model), and the snubber/clamp components. Simulate the turn-off transient and verify: peak Vds < 80% of MOSFET rated voltage, ringing decays within 20% of the switching period, no sustained oscillation.
3. If bench prototyping: measure the drain voltage with a high-bandwidth probe (>200MHz bandwidth, use a ground spring not a 6-inch ground lead). Start without the snubber to characterize the spike. Add snubber components and verify suppression. Iterate on R and C values if needed.
4. Select specific components. Snubber capacitor: film or ceramic, with voltage rating > 2x peak voltage for reliability. The capacitor must handle the RMS current: Irms = Cs * Vclamp * fsw (roughly). Select a capacitor rated for this ripple current. Snubber resistor: use a film resistor rated for pulse energy, not just average power. Carbon composition handles pulses better than thin-film.
5. Document the final design: schematic, component BOM with ratings and derating, expected power dissipation, thermal placement (snubber resistor may need heat sinking or PCB copper area for cooling), and the measured/simulated drain waveform as verification evidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
