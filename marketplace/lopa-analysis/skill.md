# Lopa Analysis

Perform Layer of Protection Analysis to determine if additional safety layers are needed for high-risk scenarios.

## Inputs

- `hazop-worksheets`: HAZOP scenarios flagged for LOPA
- `risk-criteria`: Corporate or regulatory risk tolerance criteria

## Outputs

- `lopa-results`: Frequency of consequence for each scenario after crediting protection layers
- `sil-requirements`: Required SIL for any safety instrumented function identified
- `ipl-credit-summary`: Independent protection layers credited with their probability of failure on demand

## Process

1. Start with the initiating event frequency. Use historical data (CCPS LOPA book, OREDA) or fault tree analysis. Typical frequencies: control loop failure 0.1/yr, human error 0.01 to 1/yr depending on task complexity and time pressure.
2. Identify independent protection layers (IPLs). Each IPL must be: independent of the initiating event and other IPLs, auditable, capable of preventing the consequence, and have a quantified probability of failure on demand (PFD). Typical PFD values: BPCS 0.1, alarm with operator response 0.1, relief valve 0.01, SIS 0.01 to 0.001.
3. Calculate the mitigated event frequency: f_consequence = f_initiating * PFD_1 * PFD_2 * ... * conditional modifiers (probability of ignition, probability of occupancy, etc.).
4. Compare the mitigated frequency against the risk tolerance criterion. If the frequency exceeds the criterion, additional protection is needed. The required risk reduction factor determines the SIL of any new safety instrumented function: SIL 1 = PFD 0.01 to 0.1, SIL 2 = 0.001 to 0.01, SIL 3 = 0.0001 to 0.001.
5. Document assumptions: credit only IPLs that have been validated in the field, not those that exist on paper but have not been tested. Flag any scenario where more than SIL 2 is required, as this often indicates a design deficiency rather than a need for more instrumentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
