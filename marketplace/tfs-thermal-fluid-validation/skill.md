# Tfs Thermal Fluid Validation

Validate the network solution against conservation balances and reference points, so the model is accepted on closed energy and pressure accounts rather than on a plausible-looking result.

## Inputs

- `steady-state-solution`: The steady solution to be checked against balances
- `transient-response`: The transient result whose peak values and timing are validated

## Outputs

- `balance-closure`: The mass, energy, and loop-pressure balances with their closure error
- `validation-record`: The comparison of predicted pressure drops, flows, and temperatures against design data or measurements

## Process

1. Close the mass balance at every node and overall. Confirm the sum of flows in equals the sum out at each node to solver tolerance and that total supply equals total demand across the system; a mass imbalance means an unconverged solve or a topology error such as a missing connection.
2. Close the energy balance across the system. The net heat added (pump work, heat-exchanger duty, pipe losses to ambient) must match the change in fluid enthalpy between inlet and outlet; a persistent energy gap points to a mis-signed heat input, a wrong specific heat, or an unconverged temperature solve.
3. Check loop pressure balances. Around every closed loop the sum of pressure changes (losses, pump rises, elevation) must be zero; a nonzero loop residual is the direct measure of pressure-solution error and the quantity the network solver drove down, so confirm it is within tolerance.
4. Compare predicted pressure drops and flows to design points or field data. Check the pump operating point against its curve, the pressure drop across a known valve or heat exchanger against its rating, and branch flows against meter readings; agreement within the instrument and correlation uncertainty (often 5 to 10 percent) validates the component characterization.
5. Validate the transient peaks and timing. Confirm the predicted waterhammer peak pressure and the arrival time of the wave against the Joukowsky estimate and any measured trace, and confirm the transient settles to the steady solution computed earlier; a transient that does not relax to the correct steady state has an error in the inertia or boundary treatment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
