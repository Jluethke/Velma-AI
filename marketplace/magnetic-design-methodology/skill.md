# Magnetic Design Methodology

Design the magnetic component (inductor or transformer) including core material selection, core geometry, winding layout, and loss calculation using Steinmetz parameters.

## Inputs

- `inductor-spec`: Inductance, peak current, RMS current, switching frequency, ripple current waveform
- `constraints`: Board area, height limit, temperature rise limit, cost

## Outputs

- `core-selection`: Core material (ferrite grade: MnZn or NiZn, powdered iron, or amorphous), core size and shape (toroid, EE, ER, PQ), and air gap length if needed
- `winding-design`: Number of turns, wire gauge (accounting for skin effect and proximity effect), winding layout, and estimated DCR
- `loss-breakdown`: Core loss from Steinmetz equation Pcore = k * f^alpha * B^beta * Volume, copper loss from I^2*Rac, and total temperature rise estimate

## Process

1. The energy storage requirement sets the minimum core size: E = 0.5*L*Ipk^2. This energy must be stored in the air gap (or distributed gap for powder cores). The air gap length is lg = mu0*N^2*Ae/L where Ae is the core cross-section area. Larger gap means more fringing flux and more proximity-effect loss in windings near the gap.
2. Select core material by switching frequency. MnZn ferrite (3C90, 3F3, N87) works from 20 kHz to 500 kHz. NiZn ferrite (4F1) extends to several MHz but has lower permeability. Powdered iron (Kool Mu, MPP, XFlux) handles high DC bias without gapping but has higher core loss than ferrite at the same B and f.
3. Calculate peak flux density: Bpk = L*Ipk/(N*Ae). For ferrite, keep Bpk under the saturation flux density Bsat (typically 300 to 400 mT at 25C, drops to 200 to 250 mT at 100C). For powder cores, Bsat is higher (up to 1T for XFlux) but permeability drops with DC bias, so the effective inductance falls.
4. Core loss from the improved generalized Steinmetz equation (iGSE) for non-sinusoidal waveforms: Pv = ki * (delta_B)^(beta-alpha) * integral(|dB/dt|^alpha * dt) / T, where ki, alpha, and beta come from the core manufacturer's datasheet. For a triangular ripple waveform in a buck inductor, delta_B = L*delta_IL/(N*Ae), and the iGSE simplifies because dB/dt is piecewise constant.
5. Copper loss at high frequency exceeds DC loss due to skin effect and proximity effect. The skin depth is delta = sqrt(rho/(pi*f*mu0)), about 0.3mm at 100kHz in copper. Use Litz wire (multiple insulated strands thinner than 2*delta) or flat copper foil to reduce AC resistance. The AC resistance factor Fr = Rac/Rdc can be estimated from Dowell's equation for layered windings: Fr depends on the number of layers and the ratio of conductor thickness to skin depth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
