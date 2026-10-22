# Ep Lifetime Prediction And Testing

Predict thruster lifetime from wear mechanisms and design the ground test campaign to validate it.

## Inputs

- `thruster-type-selection`: Thruster type and operating conditions
- `mission-requirements`: Required total impulse and operating hours

## Outputs

- `lifetime-prediction`: Predicted lifetime from each wear mechanism and the life-limiting mechanism
- `test-plan`: Ground test campaign design: wear test, characterization test, and acceptance test
- `qualification-status`: Gap analysis between predicted life and mission requirement with margin

## Process

1. Identify wear mechanisms by thruster type. Hall thrusters: channel wall erosion from ion bombardment (the ceramic or boron nitride channel erodes, eventually exposing the magnetic circuit). Typical life: 5,000 to 30,000 hours depending on voltage and channel design. Gridded ion: grid erosion (pit-and-groove pattern on accelerator grid from charge-exchange ions), cathode insert depletion. Typical life: 10,000 to 50,000 hours.
2. For Hall thrusters, predict erosion rate: sputter yield depends on ion energy (approximately proportional to discharge voltage) and incidence angle. Use a Hall thruster erosion model (e.g., BPT model or HPHall simulation) to predict channel wall recession rate (micrometers per hour). End-of-life is when the channel wall erodes through to the magnetic poles.
3. For gridded ion, predict accelerator grid erosion: charge-exchange ions born downstream of the screen grid are accelerated back into the accel grid. Pit-and-groove erosion pattern eventually causes structural failure or electron backstreaming. Model with grid erosion codes (CEX2D or similar).
4. Design the wear test: run the thruster in a vacuum facility for the qualification life (typically 1.5x the mission life) while periodically measuring channel dimensions (profilometry during brief shutdowns), performance (thrust, Isp, efficiency), and cathode health. Vacuum facility must have sufficient pumping speed (>100,000 L/s for xenon) to maintain pressure below 5e-6 Torr to avoid artificially reducing erosion from facility effects.
5. Validate with in-situ diagnostics: QCM (quartz crystal microbalance) for sputter rate, optical emission spectroscopy for erosion products in the plume, and laser profilometry for channel wall profiles without breaking vacuum.
6. Assess qualification margin: mission requires X hours of operation. Wear test demonstrates Y hours. If Y > 1.5X, qualification margin is met. If not, identify the life-limiting mechanism and evaluate design changes (magnetically shielded Hall thrusters reduce channel erosion by 100x, extending life to >50,000 hours).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
