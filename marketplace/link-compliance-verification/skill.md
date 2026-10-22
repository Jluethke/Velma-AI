# Link Compliance Verification

Run the full compliance test suite for the protocol, including transmitter output, channel, and receiver tolerance testing, and document the results for certification.

## Inputs

- `equalized-eye`: Equalized eye meeting internal targets
- `jitter-decomposition`: Jitter budget verified
- `timing-margin`: Timing margin meeting spec
- `insertion-loss-profile`: Channel S-parameters for compliance

## Outputs

- `tx-compliance-results`: Transmitter output measurements vs protocol mask: amplitude, rise/fall time, jitter, pre-emphasis levels
- `channel-compliance-results`: Channel S-parameter measurements vs protocol limits: IL, RL, crosstalk, ILD (insertion loss deviation)
- `rx-tolerance-results`: Receiver stressed eye test results: worst-case input the receiver must tolerate and whether it achieves target BER
- `compliance-report`: Complete compliance report ready for protocol certification body

## Process

1. Run TX compliance: measure transmitter output into a compliance test fixture. Compare against the protocol's TX output mask: voltage amplitude (Vdiff_pp), rise and fall time, output impedance, and TX jitter. Apply the specified FIR settings if the protocol defines compliance tap values.
2. Run channel compliance: measure the channel S-parameters with calibrated VNA using the protocol's test methodology. Compare insertion loss at Nyquist, return loss, crosstalk, and insertion loss deviation (ILD, the deviation from a fitted loss curve, indicating resonances). Each must pass the protocol's defined limits.
3. Run RX tolerance: inject a stressed signal at the receiver (using a compliance pattern generator with calibrated stress: sinusoidal jitter, random jitter, ISI from a compliance channel) and verify the receiver achieves the target BER. The stressed eye represents the worst-case signal the protocol says the receiver must handle.
4. Compile the compliance report: all measurements, pass/fail against each limit, test equipment used with calibration dates, and the test fixture description. This report goes to the certification body (USB-IF, PCI-SIG, IEEE, etc.) as evidence of compliance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
