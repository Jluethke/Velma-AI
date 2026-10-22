# Mixed Signal Floor Planning

Plan the physical layout of the mixed-signal IC to isolate sensitive analog circuits from noisy digital circuits, minimizing substrate coupling and supply bounce.

## Inputs

- `block-list`: All analog blocks (ADC, DAC, bandgap, PLL VCO), digital blocks (DSP, SPI, control logic), and I/O (pads, ESD)
- `noise-sensitivity-map`: Which blocks are noise-sensitive (ADC comparator, bandgap, VCO) and which are noise-generators (digital logic, output drivers, charge pumps)

## Outputs

- `floor-plan`: Block placement with guard ring plan, supply domain assignments, and substrate isolation strategy (deep N-well, triple-well, separate substrate contacts)
- `supply-routing-plan`: Separate analog and digital supply domains, decoupling capacitor placement, and supply resistance budget from pad to block

## Process

1. Place the most noise-sensitive block (usually the ADC comparator or VCO) as far as possible from the noisiest block (usually the digital core or output drivers). Substrate noise attenuates roughly as 1/r for surface coupling and more steeply for deep-well isolated blocks.
2. Use deep N-well isolation for all sensitive analog blocks. A deep N-well creates a reverse-biased junction between the P-substrate and the N-well, attenuating substrate noise by 20 to 40 dB depending on frequency and geometry. Add a guard ring of P+ substrate contacts around the deep N-well, tied to a quiet analog ground.
3. Separate the supply domains: AVDD/AVSS for analog, DVDD/DVSS for digital, and IOVDD/IOVSS for I/O pads. Each domain gets its own pad pair and its own on-chip decoupling capacitor. The analog and digital grounds connect at one point only (star ground) at the package level, never on-chip through the substrate.
4. Place on-chip decoupling capacitors (MOS caps or MIM caps) adjacent to each power-hungry block. The required decoupling is: Cdecap > I_peak * dt / delta_V where I_peak is the peak current demand, dt is the switching event duration, and delta_V is the allowed supply bounce. For a digital block switching 100mA in 1ns with 10mV allowed bounce: Cdecap > 10nF.
5. Route sensitive analog signals (ADC input, reference voltage, VCO control voltage) as differential pairs whenever possible, shielded with ground traces on both sides. Keep digital signal routing away from analog signal routing by at least 50um, or use a grounded metal shield layer between them. Verify the coupling with post-layout extraction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
