# Data Telemetry Architecture

Design the data path from digitized neural signals to the external processing system, including on-implant data reduction, wireless link, and power delivery.

## Inputs

- `analog-front-end-architecture`: Channel count, sample rate, bit depth, total raw data rate
- `amplifier-specification`: Power budget and heat constraint

## Outputs

- `telemetry-design`: Wireless protocol, data rate, on-implant compression strategy, transmit power, and antenna design
- `power-delivery-design`: Power source (battery, inductive, ultrasonic), charging protocol, and total power budget

## Process

1. Calculate raw data rate: 1024 channels x 30 kSps x 16 bits = 491 Mbps raw. This exceeds any practical implantable wireless link. Data reduction is mandatory. Option 1: transmit only spike times and waveform snippets (detect on-chip, transmit 1-ms waveforms at each threshold crossing, reducing bandwidth by 10-100x). Option 2: transmit LFP only (downsample to 1 kSps, 16 Mbps). Option 3: on-chip spike sorting reduces to firing rates (below 1 Mbps for 1024 channels at 100 Hz update).
2. Select wireless link. Near-field inductive (13.56 MHz): reliable, short range (1-3 cm), data rate to 10 Mbps, can share coil with power delivery. UWB (3.1-10.6 GHz): higher data rate (up to 100 Mbps), better range (10 cm through tissue), but higher power and more complex antenna. Bluetooth LE: 2 Mbps, good ecosystem but limited for high-channel-count full-bandwidth. Calculate link margin: path loss through 1 cm tissue at carrier frequency, antenna gain (on-implant antenna is small, typically -10 to -20 dBi), receiver sensitivity.
3. Design power delivery. For implantable systems, transcutaneous inductive power is standard: an external coil driven at 100 kHz to 13.56 MHz couples to an implanted coil. Coupling coefficient k depends on coil alignment and separation (typically k = 0.05-0.2 for 1-2 cm separation). Power transfer efficiency = k^2 x Q1 x Q2 / (1 + k^2 x Q1 x Q2). Size the coils from power requirement (typically 10-50 mW for a 1024-channel system after data reduction). Regulate received power with LDO or switched-mode regulator. For battery-backed systems, lithium primary cells give 5-10 years for low-power EEG devices.
4. Verify SAR compliance: the transmitted RF power must keep specific absorption rate below 1.6 W/kg averaged over 1 g of tissue (FCC) or 2 W/kg over 10 g (ICNIRP). Run thermal simulation: total implant heat dissipation (electronics + coil losses) must not raise adjacent tissue temperature by more than 1 degree C in steady state.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
