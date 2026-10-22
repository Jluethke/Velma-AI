# Adcs Requirements And Sensor Selection

Derive attitude determination and control requirements from the mission, then select the sensor suite and actuator set that meets pointing accuracy, slew rate, and momentum storage needs.

## Inputs

- `pointing-requirements`: Pointing accuracy, knowledge accuracy, slew rate, stability during imaging or communication
- `orbit-and-disturbance-environment`: Orbit altitude, gravity gradient, magnetic field, aerodynamic drag, solar radiation pressure

## Outputs

- `sensor-suite`: Selected sensors (type, quantity, mounting, accuracy) for attitude determination
- `actuator-set`: Selected actuators (type, quantity, capacity) for attitude control and momentum management

## Process

1. Quantify the disturbance torque environment. Gravity gradient: T_gg = 3*mu/(2*R^3) * (I_z - I_x) * sin(2*theta), maximum for 45 degree offset. Aerodynamic: T_aero = 0.5*rho*Cd*A*v^2 * (cp - cm), depends on the offset between center of pressure and center of mass. Solar radiation pressure: T_srp = P_solar * A * (1+r) * (cp - cm), where P_solar = 4.56e-6 N/m^2. Magnetic: T_mag = M * B, where M is the residual magnetic moment.
2. Select sensors by accuracy tier. Coarse (>1 deg): sun sensors (analog or digital), magnetometers. Medium (0.01-1 deg): fine sun sensors, horizon sensors, star trackers (lower accuracy in this range). Fine (<0.01 deg): star trackers (3-axis, 1-5 arcsec accuracy), fiber optic or ring laser gyroscopes (0.001-0.01 deg/hr drift). Rate sensing: MEMS gyros (1-10 deg/hr) or fiber optic gyros (0.001-0.01 deg/hr).
3. Select actuators by torque and momentum requirements. Reaction wheels: torque 0.01-1 Nm, momentum storage 1-50 Nms. Control moment gyroscopes (CMGs): torque 10-1000 Nm, for agile large spacecraft. Magnetorquers: torque = M * B, limited by available magnetic moment and orbital field strength, good for momentum dumping in LEO. Thrusters: for large slews, orbit-coupled maneuvers, or when other actuators are insufficient.
4. Size reaction wheels. The momentum storage must exceed the worst-case cyclic disturbance momentum accumulation over one orbit: H_wheel > integral(T_disturbance) over one orbit period. The wheel torque must exceed the peak disturbance plus the control demand for the required slew rate: T_wheel > T_disturbance + I * alpha_slew.
5. Design momentum management. In LEO, magnetorquers dump accumulated momentum from secular disturbances (aerodynamic drag torque). The dumping rate is M_torquer * B_earth * duty_cycle. Verify that the magnetorquer capacity exceeds the secular momentum buildup rate. In GEO or deep space, thrusters perform momentum desaturation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
