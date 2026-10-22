# Sdm Frequency Response And Damping

Build the frequency response of the structure by modal superposition with a damping model, and identify damping from the response peaks so the predicted amplitudes are physical.

## Inputs

- `natural-frequencies`: The modal frequencies that locate the response peaks
- `mode-shapes`: The mode shapes that shape the response between points

## Outputs

- `frequency-response-functions`: The response per unit excitation across frequency at the points of interest
- `damping-model`: The identified modal or proportional damping used in the response, with how it was obtained

## Process

1. Synthesize the frequency response by modal superposition. The receptance frequency-response function between a response point and an excitation point is H(omega) = sum over modes r of (phi_r*phi_r^T) / (omega_r^2 - omega^2 + 2*i*zeta_r*omega_r*omega), where zeta_r is the modal damping ratio; the sum over the retained modes gives the response, with peaks at the natural frequencies whose height is set by damping.
2. Choose a damping model matched to the available data. Modal damping assigns a ratio zeta_r to each mode and is the most physical when modal test data exist; Rayleigh (proportional) damping C = alpha*M + beta*K is convenient for direct integration and gives zeta = alpha/(2*omega) + beta*omega/2, but its frequency dependence means it can only match the true damping at two frequencies, so pick alpha and beta to bracket the band of interest.
3. Identify damping from measured response peaks with the half-power method. For a lightly damped mode the damping ratio is zeta = (f2 - f1)/(2*f_n), where f1 and f2 are the frequencies on either side of the peak where the amplitude falls to 1/sqrt(2) of the peak (the 3 dB points) and f_n is the peak frequency; this reads damping directly off a frequency-response plot.
4. Use realistic damping values and never zero. Bolted metal structures typically show zeta around 1 to 3 percent, welded structures less, and structures with joints or damping treatments more; a response computed with zero or guessed damping gives infinite or meaningless resonant peaks, so damping is the parameter that most controls the predicted amplitude near resonance.
5. Check the response against resonance and anti-resonance structure. A correct frequency-response function between two points shows peaks at the natural frequencies and anti-resonances (dips) between them whose pattern depends on the point pair; the presence and location of anti-resonances is a quick check that the mode shapes and their signs are right.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
