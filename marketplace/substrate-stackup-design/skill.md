# Substrate Stackup Design

Design the substrate layer count, materials, and via technology based on routing density and electrical requirements.

## Inputs

- `io-requirements`: Signal I/O count, power/ground pin count, and BGA pitch on bottom side
- `impedance-targets`: Controlled impedance values for signal lines (single-ended and differential)
- `frequency-of-operation`: Maximum signal frequency for material loss consideration

## Outputs

- `substrate-stackup`: Layer count, metal thickness per layer, dielectric material and thickness, via types per layer pair
- `routing-rules`: Line width, space, via pad size, and anti-pad diameter for each layer

## Process

1. Estimate routing density: total signal escapes from die pad array through the substrate to BGA. Each layer can route a limited number of channels based on line/space rules. Layer count = routing channels needed / channels per layer, rounded up.
2. Select core material: standard BT (bismaleimide triazine) for most applications, low-CTE ABF (Ajinomoto build-up film) for fine-pitch or large packages, high-Tg FR-4 for cost-sensitive designs. Low-Dk materials (Dk < 3.5 at 10 GHz) for high-frequency.
3. Define via technology. Through-hole vias for simple substrates (2-6 layers). Blind and buried vias for higher density. Stacked microvias (ELIC: Every Layer InterConnect) for highest density, allowing vias in pad.
4. Calculate impedance: microstrip for outer layers, stripline for inner layers. Use 2D field solver for accuracy. Adjust trace width and dielectric thickness to hit target. For 50 ohm single-ended on ABF (Er ~3.3): roughly 25um trace on 20um dielectric.
5. Assign layers: top metal for die attach pads, bottom metal for BGA pads, inner layers alternating signal and reference (ground or power). Dedicate at least one solid ground plane and one solid power plane.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
