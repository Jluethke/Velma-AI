# Power Stage Component Sizing

Size the inductor, output capacitor, input capacitor, and semiconductor switches for the chosen topology, ensuring ripple, stress, and thermal limits are all met.

## Inputs

- `selected-topology`: Topology, duty cycle range, CCM/DCM mode
- `power-spec`: Vin range, Vout, Iout, ripple limits, switching frequency fsw

## Outputs

- `inductor-spec`: Inductance value, peak current, RMS current, saturation current requirement, and DCR limit for efficiency
- `capacitor-spec`: Output capacitor: capacitance, ESR, ripple current rating. Input capacitor: capacitance, ripple current rating.
- `switch-spec`: MOSFET Vds rating, Rds_on target for conduction loss, Qg for switching loss, body diode characteristics

## Process

1. For a buck converter, the inductor value for a target ripple current delta_IL: L = (Vin - Vout)*D / (fsw * delta_IL). Typical design targets delta_IL = 20 to 40 percent of Iout (peak-to-peak). Larger inductance reduces ripple but increases size and cost; smaller inductance increases ripple current and core loss.
2. The inductor must not saturate at peak current: Ipk = Iout + delta_IL/2. The RMS current is approximately Iout for CCM with small ripple (exact: sqrt(Iout^2 + delta_IL^2/12)). Select a core and winding that handle both the saturation current and the RMS heating.
3. Output capacitor sizing has two constraints: voltage ripple and ESR. The capacitive component of ripple is delta_Vc = delta_IL/(8*fsw*Cout). The ESR component is delta_V_ESR = delta_IL * ESR. Total ripple is approximately the sum. If the ripple spec is tight (under 10mV), use ceramic capacitors (low ESR) in parallel; if ripple can be 50mV, bulk capacitors (electrolytic, polymer) with moderate ESR are acceptable.
4. Input capacitor sees pulsed current in a buck converter: RMS ripple current = Iout * sqrt(D*(1-D)). The input capacitor must handle this RMS current without overheating. Ceramic X5R or X7R capacitors rated for the ripple current are typical. Place them as close as possible to the switch and ground pins.
5. MOSFET selection: conduction loss = Ids_rms^2 * Rds_on. Switching loss per cycle = 0.5 * Vds * Ids * (tr + tf) * fsw where tr and tf are rise and fall times from the gate charge curve. Total loss = conduction + switching + gate drive (Qg*Vgs*fsw). Optimize Rds_on vs Qg: lower Rds_on means higher Qg (larger die), so there is an optimal FET size for a given fsw.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
