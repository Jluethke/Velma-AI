# Thermal Barrier Coating Design

Design the thermal barrier coating system for hot section components: bond coat, ceramic topcoat, and environmental barrier for CMCs.

## Inputs

- `material-selection`: Substrate material and its maximum operating temperature
- `operating-conditions`: Gas temperature, thermal cycling, and corrosive species
- `life-requirement`: Required hours and cycles

## Outputs

- `coating-system-design`: Complete coating architecture with material, thickness, and process for each layer
- `temperature-reduction`: Predicted substrate temperature reduction from the TBC
- `life-prediction`: Predicted TBC life from spallation modeling

## Process

1. Design the TBC system for superalloy substrates: bond coat (MCrAlY applied by HVOF or VPS, or platinum aluminide by pack cementation or CVD: provides oxidation resistance and adhesion), thermally grown oxide (TGO: alpha-Al2O3 that forms on the bond coat during service, 1 to 10 micrometers: the health of this layer determines TBC life), and ceramic topcoat (7% yttria-stabilized zirconia (7YSZ) applied by APS or EB-PVD: provides the thermal insulation).
2. Calculate the temperature drop through the TBC: delta_T = q * t / k where q is the heat flux, t is the coating thickness, and k is the thermal conductivity. 7YSZ has k ~ 1 to 1.5 W/m-K for APS (lower due to porosity and microcracks) and k ~ 1.5 to 2 W/m-K for EB-PVD. A 250 micrometer YSZ coating at 1 MW/m^2 heat flux drops the temperature by about 170 to 250C.
3. Select coating process: APS (air plasma spray) gives a lamellar microstructure with in-plane microcracks that provide strain tolerance. EB-PVD (electron beam physical vapor deposition) gives columnar microstructure with inter-columnar gaps that provide strain tolerance and smoother surface (lower aerodynamic penalty). EB-PVD is used on turbine blades; APS on combustor liners and vanes.
4. Predict TBC life: the dominant failure mode is spallation driven by TGO growth stress. As the alumina TGO grows during service (parabolic growth: thickness proportional to sqrt(time)), it develops compressive stress from CTE mismatch with the bond coat. When this stress exceeds the bond strength (which degrades from rumpling and void formation), the TBC spalls. Life prediction uses the TGO thickness criterion: spallation occurs when TGO reaches a critical thickness (typically 5 to 10 micrometers).
5. For CMC substrates, design an environmental barrier coating (EBC): SiC reacts with water vapor in combustion gas to form volatile Si(OH)4, causing surface recession. EBC layers: silicon bond coat, mullite or BSAS intermediate coat, rare earth silicate topcoat (Yb2Si2O7 or similar). The EBC must be CTE-matched to the SiC substrate to avoid cracking during thermal cycling.
6. Define the inspection strategy: TBC health is monitored by visual inspection (discoloration indicates bond coat oxidation), photoluminescence spectroscopy (stress in the TGO correlates with remaining life), and thermal wave imaging (detects delamination before visible spallation). Set inspection intervals from the life model.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
