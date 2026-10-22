# Mems Fabrication And Packaging

Select the fabrication process and design the package to protect the MEMS element while allowing access to the measurand.

## Inputs

- `mechanical-structure-concept`: MEMS structure and critical dimensions
- `transduction-mechanism`: Electrical interface requirements
- `size-cost-constraints`: Die size, package size, and volume production requirements

## Outputs

- `fabrication-process-flow`: Process steps from substrate to released MEMS structure
- `package-design`: Package type, sealing method, and stress isolation strategy
- `yield-and-cost-estimate`: Expected die yield and cost breakdown at target volume

## Process

1. Select fabrication technology. Surface micromachining: thin-film deposition and sacrificial layer etching, good for small structures but limited thickness (2-5 um polysilicon). Bulk micromachining: etching into the silicon substrate (KOH anisotropic etch or DRIE), gives thicker structures (10-500 um) for larger proof masses. SOI (silicon-on-insulator): the device layer is single-crystal silicon on a buried oxide sacrificial layer, combining thickness control with excellent mechanical properties. Epitaxial polysilicon: thick deposited poly for large proof masses.
2. Design the critical process steps. For a capacitive accelerometer on SOI: 1) pattern and etch the device layer (DRIE through 20-50 um Si) to define proof mass, springs, and capacitor fingers, 2) release by HF vapor etch of the buried oxide, 3) anti-stiction treatment (SAM coating or supercritical CO2 drying). The capacitive gap (1-3 um) is defined by the SOI buried oxide thickness. Comb finger overlap sets the initial capacitance.
3. Design wafer-level packaging. For vacuum-sealed devices (gyroscopes, resonant sensors): bond a cap wafer with getter material (Ti or Zr thin film) to maintain vacuum over device lifetime. Bonding methods: glass frit (reliable but large seal area), eutectic (Au-Si at 363C, small seal ring), thermocompression. Hermetic seal leak rate target: < 1e-15 atm*cc/sec (helium) for 10-year vacuum lifetime. For pressure sensors: the cap has a port or the diaphragm is directly exposed.
4. Manage package stress. The MEMS die is sensitive to stress transmitted from the package (solder reflow, thermal cycling, PCB bending). Use stress isolation: die attach with soft adhesive (silicone), or mechanically decoupled mounting (anchor only at the center of the die). For precision sensors, ceramic LCC packages outperform plastic QFN because of lower moisture absorption and CTE mismatch. Simulate the package stress using FEA and verify that the induced offset is within the trim range.
5. Estimate yield and cost. Die yield depends on defect density and die area: Y = (1 + D0*A/alpha)^(-alpha) (negative binomial model). Typical MEMS defect densities: 1-5 defects/cm^2 for mature processes. For a 2mm x 2mm die (4mm^2 area), yield is 85-95%. Cost = (wafer cost / dies per wafer / yield) + test + package + calibration. At volume (millions), MEMS accelerometer die cost is $0.10-0.50, with packaging and test adding 2-5x.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
