# Motor Selection Sizing

Select the motor type and size to meet the mechanical load requirements: torque, speed, duty cycle, and efficiency.

## Inputs

- `mechanical-load`: Required torque (continuous and peak), speed range (RPM), load inertia, duty cycle, ambient temperature, and application type (servo, pump, fan, traction)
- `electrical-constraints`: Available DC bus voltage, maximum current from supply, efficiency target

## Outputs

- `motor-selection`: Motor type (BLDC, PMSM, induction, stepper, SRM) with rated torque, speed, Kt (torque constant), Ke (back-EMF constant), resistance, inductance, and thermal time constant
- `operating-point-analysis`: Torque-speed curve showing the continuous operating region, field-weakening region, and peak overload region, with current and voltage at key operating points

## Process

1. Calculate the required mechanical power: P = T*omega where T is torque in Nm and omega is speed in rad/s. Add losses (bearing friction, windage, gearbox if present). The electrical input power is P_mech / motor_efficiency. This determines the minimum motor rating.
2. For servo applications requiring precise position control and fast dynamics: PMSM (permanent magnet synchronous motor) gives the best torque-to-inertia ratio. For fans and pumps (variable speed, no position control): BLDC or induction motors are cost-effective. For high-torque low-speed without gearbox: direct-drive PMSM with high pole count. For cost-sensitive applications with moderate performance: induction motor with V/f or FOC.
3. Size the motor for thermal limits, not just the instantaneous torque. The continuous torque rating is set by the winding temperature limit (typically Class F: 155C or Class H: 180C). The motor thermal model is a first-order system: T_winding = T_ambient + P_loss * Rth * (1 - exp(-t/tau)) where Rth is thermal resistance and tau is thermal time constant (minutes to tens of minutes).
4. Check the voltage constraint. At maximum speed, the back-EMF is Vemf = Ke * omega_max. The DC bus voltage must exceed Vemf plus the voltage drop across the inverter and winding resistance: Vdc > Vemf + I*R + 2*Vdrop_FET. If Vdc is insufficient at max speed, field weakening (injecting negative d-axis current to reduce flux) extends the speed range at the cost of reduced torque.
5. Match the motor inductance to the inverter PWM frequency. The current ripple is delta_I = Vdc * D * (1-D) / (L * fsw). For smooth torque, current ripple should be under 10 percent of rated current. If L is too low (common in high-speed PMSM with few turns), increase fsw or add external inductance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
