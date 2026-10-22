# Pressurization System Design

Design the tank pressurization system to maintain adequate NPSH at the pump inlet and structural integrity of the tank.

## Inputs

- `tank-dimensions`: Tank volume and ullage volume
- `npsh-available`: Required pump inlet pressure
- `propellant-combination`: Propellant vapor pressure and temperature

## Outputs

- `pressurization-method`: Autogenous (self-pressurizing) or stored gas (helium) with rationale
- `pressurant-mass`: Mass of pressurant gas required for the burn duration
- `pressure-schedule`: Ullage pressure vs time during burn and coast phases
- `collapse-factor`: Factor accounting for pressurant gas cooling by contact with cryogenic propellant

## Process

1. The tank ullage must be pressurized above the propellant vapor pressure by enough to provide the required NPSH at the pump inlet, accounting for hydrostatic head, line losses, and acceleration effects. Typical ullage pressures: 150-500 kPa for pump-fed engines, 1.5-3 MPa for pressure-fed engines.
2. Helium pressurization: high-pressure helium (30-50 MPa) stored in composite-overwrapped pressure vessels (COPVs), regulated down to ullage pressure and injected into the tank as propellant is consumed. Helium is lightweight and inert. The collapse factor (1.5-4.0) accounts for helium cooling and condensation at the cryogenic propellant surface, which requires injecting more helium than the ideal gas law predicts.
3. Autogenous pressurization: use heated propellant vapor as the pressurant. For LOX tanks, gaseous oxygen from the regenerative cooling jacket or a heat exchanger. For LH2/LCH4 tanks, gaseous fuel from the cooling jacket. No separate pressurant gas needed, but the heating system adds complexity. Used on Saturn V (LOX tank), SSME, and Raptor.
4. Pressurant mass calculation: m_gas = (P_ullage * V_ullage) / (R * T_gas) * collapse_factor, where V_ullage grows as propellant is consumed (from initial 3-5% to 100% at burnout). Integrate over the burn. The collapse factor is the key uncertainty: it depends on gas injection method, tank geometry, and whether the gas contacts the liquid surface.
5. For in-space stages with multiple restarts, the pressurization system must maintain tank pressure during coast phases (when the propellant warms and boils) and must settle the propellant before restart (small thrusters or tank pressure to push liquid to the outlet end in zero-g).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
