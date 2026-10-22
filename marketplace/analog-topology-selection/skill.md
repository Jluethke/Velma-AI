# Analog Topology Selection

Select the amplifier topology that meets gain, bandwidth, noise, input impedance, output swing, and power constraints before committing to a schematic.

## Inputs

- `performance-spec`: Required voltage gain Av, bandwidth BW, input-referred noise density en(f), input impedance Zin, output swing Vout_pp, supply voltage Vdd, and quiescent current budget Iq
- `load-conditions`: Load impedance (resistive, capacitive, or both), required output current drive, capacitive load CL

## Outputs

- `selected-topology`: The chosen amplifier topology (common-source, cascode, folded-cascode, telescopic, differential pair, OTA) with rationale for why it meets each spec line
- `topology-tradeoffs`: What the chosen topology sacrifices: headroom, CMRR, PSRR, or complexity relative to alternatives

## Process

1. If gain*bandwidth exceeds the process fT by more than 10x, the spec is infeasible in a single stage; partition into cascaded stages and allocate gain per stage so that each stage's bandwidth covers the total BW with margin for interstage pole interaction.
2. For gains below 20 dB in CMOS, a common-source with resistive load or active load suffices. For gains of 20 to 40 dB, a cascode (telescopic or folded) adds output resistance without cascading stages. For gains above 60 dB, use a two-stage Miller-compensated OTA or a gain-boosted cascode.
3. Check headroom. A telescopic cascode requires Vdd > Vdsat_top + Vdsat_cascode + Vdsat_current_source + Vdsat_input + Vth, typically about 4*Vdsat + Vth. If supply is under 1.8 V in 180nm CMOS, a folded cascode recovers one Vdsat of headroom by folding the cascode device to the opposite supply rail.
4. For low noise, the input pair must be large (long and wide) to reduce 1/f noise corner frequency. PMOS input pairs have 3 to 5 times lower 1/f noise than NMOS in most CMOS processes. Calculate input-referred thermal noise density: en = sqrt(8*kT/(3*gm)) for a single device; the total for a differential pair is sqrt(2) times this.
5. For high-speed applications where bandwidth matters more than noise, use NMOS input pairs (higher mobility gives higher gm/Id) and minimize parasitic capacitance at the high-impedance node. Record the selected topology, its node count, and which spec line drove each architectural choice.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
