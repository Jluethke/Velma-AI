# Tx Preemphasis Rx Equalization Design

Design the transmitter pre-emphasis (de-emphasis and pre-shoot) and receiver equalization (CTLE and DFE) to open the eye to meet the BER target.

## Inputs

- `unequalized-eye`: Raw eye diagram showing the problem to solve
- `isi-budget`: ISI tap magnitudes to cancel
- `data-rate`: Line rate for equalization tap timing
- `eye-opening-raw`: Starting eye metrics to improve upon

## Outputs

- `tx-fir-coefficients`: Transmitter FIR filter tap values: pre-cursor, main cursor, and post-cursor coefficients with amplitude constraint
- `ctle-parameters`: Continuous time linear equalizer settings: DC gain, peaking frequency, peaking gain in dB
- `dfe-tap-values`: Decision feedback equalizer tap values for each post-cursor, number of taps needed
- `equalized-eye`: Eye diagram after full TX pre-emphasis + RX CTLE + DFE showing the achieved eye opening

## Process

1. Start with TX pre-emphasis: the transmitter FIR filter has 2 to 4 taps (1 pre-cursor, 1 main, 1 to 2 post-cursors). The coefficients must sum to 1.0 (or the constrained maximum amplitude). Set the post-cursor tap to cancel the largest post-cursor ISI from the channel. The pre-cursor tap cancels the largest pre-cursor ISI. This is a linear operation that reduces ISI but also reduces signal amplitude.
2. Apply CTLE at the receiver: CTLE is a linear analog filter that boosts high frequencies relative to low frequencies, partially compensating for the channel's frequency-dependent loss. Set the peaking frequency near Nyquist and the peaking gain to partially flatten the channel response. Too much CTLE gain amplifies noise and crosstalk along with the signal.
3. Apply DFE: DFE cancels post-cursor ISI using the receiver's own bit decisions. Each tap cancels one UI of post-cursor. DFE does not amplify noise (it subtracts a known value), making it superior to linear equalization for post-cursor cancellation. However, DFE cannot cancel pre-cursor ISI and has error propagation risk if a bit decision is wrong.
4. Optimize the combination: allocate equalization between TX FIR, CTLE, and DFE to maximize the equalized eye opening. The general principle: use TX pre-emphasis for the first 1 to 2 cursors, CTLE for broadband loss compensation (keeping gain moderate to limit noise amplification), and DFE for remaining post-cursors. Simulate the equalized eye and measure opening at BER = 1e-12.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
