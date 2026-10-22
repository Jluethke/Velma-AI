# Filter Prototype Synthesis

Determine the filter order and synthesize the lowpass prototype element values for the chosen response type (Butterworth, Chebyshev, or elliptic).

## Inputs

- `filter-specification`: Passband ripple, stopband rejection, frequency edges
- `filter-selectivity-ratio`: Ratio determining required order

## Outputs

- `prototype-element-values`: Normalized lowpass prototype g-values (g0 through gN+1) for the selected response type and order
- `filter-response-type`: Butterworth, Chebyshev, or elliptic, with the order N and the justification for the choice

## Process

1. For Butterworth: N >= log(10^(A_stop/10) - 1) / (2 * log(Omega_stop/Omega_pass)) where A_stop is rejection in dB. Round up to the next integer. Prototype values: gk = 2*sin((2k-1)*pi/(2N)) for k = 1 to N.
2. For Chebyshev type I: N >= acosh(sqrt((10^(A_stop/10)-1)/(10^(A_pass/10)-1))) / acosh(Omega_stop/Omega_pass). This gives a lower order than Butterworth for the same selectivity at the cost of passband ripple. Prototype values from the Chebyshev recursion formulas.
3. For elliptic (Cauer): gives the minimum order for a given selectivity by allowing ripple in both passband and stopband. Use Zolotarev or Darlington synthesis. Prototype values from tables or computational synthesis (Geffe's algorithm).
4. Choose the response type: Butterworth if flat passband is critical and extra elements are acceptable. Chebyshev if some ripple is tolerable and order must be minimized. Elliptic if minimum order and sharpest transition are needed and both ripple and group delay variation are acceptable.
5. Record the prototype element values g0, g1, ..., gN, gN+1 for the selected type and order. These are normalized to 1 rad/s and 1 ohm.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
