# Fiber Link Requirements Analysis

Derive fiber system requirements from data rate, distance, and environmental constraints.

## Inputs

- `data-rate-requirement`: Target data rate in Gbps or channel count
- `link-distance`: Total fiber run length in km
- `environmental-conditions`: Temperature range, vibration, radiation if applicable

## Outputs

- `fiber-type-selection`: Single-mode or multimode, specific fiber standard (G.652, G.655, OM4)
- `wavelength-plan`: Operating wavelength(s) and WDM plan if applicable
- `modulation-format`: On-off keying, PAM4, or coherent QPSK/16QAM based on reach and rate

## Process

1. For distances under 300m at 10-100Gbps, OM4 multimode with 850nm VCSELs is cost-effective. Modal bandwidth of 4700 MHz-km supports 10Gbps to 400m, 100Gbps to 150m with PAM4. Beyond 300m or above 100Gbps, single-mode is required.
2. Select the single-mode fiber type. G.652.D (standard SMF, zero dispersion at 1310nm) for metro and access. G.655 (non-zero dispersion shifted) for DWDM long-haul to reduce four-wave mixing. G.654.E (large effective area, low loss) for submarine and ultra-long-haul.
3. Choose the operating wavelength. 1310nm for short-reach (zero dispersion on G.652, but higher loss at 0.35dB/km). 1550nm for long-reach (lowest loss at 0.2dB/km, amplifiable with EDFA). 1625nm for monitoring (OTDR testing while live traffic runs at 1310/1550nm). For DWDM, plan channels on the ITU grid (100GHz or 50GHz spacing in C-band 1530-1565nm).
4. Select modulation format from the data rate and reach. Direct detection NRZ for 10Gbps to 80km. PAM4 for 100Gbps short-reach. Coherent DP-QPSK for 100Gbps long-haul (spectral efficiency 2 bits/symbol). Coherent DP-16QAM for 400Gbps but shorter reach due to OSNR penalty. Calculate the required OSNR from the modulation format BER target.
5. Document environmental requirements. Tight-buffered cable for indoor. Loose-tube with gel or dry block for outdoor (thermal expansion accommodation). Armored for direct burial. All-dielectric self-supporting (ADSS) or optical ground wire (OPGW) for aerial. Radiation-hardened fiber for nuclear or space.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
