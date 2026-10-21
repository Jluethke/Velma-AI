# CAN Detective

Finds intermittent vehicle faults by comparing CAN bus traffic between a healthy baseline and a live capture taken while the problem is occurring. Records every arbitration ID on the bus, its interval, payload, and byte-level bit patterns, then diffs the two captures to surface frames that appeared, disappeared, changed frequency, or drifted in payload. Maps each anomaly back to the originating ECU module using a known frame-to-module table. Designed for the problem that happens "sometimes" and leaves no DTC.

## Execution Pattern: Phase Pipeline

```
PHASE 1: BASELINE     --> Capture or load a known-good traffic snapshot
PHASE 2: LIVE CAPTURE --> Record traffic while the symptom is present or provoked
PHASE 3: DIFF         --> Compare frame IDs, intervals, payloads, and bit patterns
PHASE 4: CLASSIFY     --> Map anomalies to modules and rank by diagnostic relevance
PHASE 5: REPORT       --> Produce a forensics report with suspect list and next steps
```

## Inputs
- `baseline`: object -- A previous CAN capture taken when the `vehicle` was operating normally. Format: candump log or structured JSON with fields per frame: `arb_id` (hex), `dlc` (int 0-8), `data` (hex bytes), `timestamp` (float, seconds). If no baseline exists, the flow captures one first.
- vehicle: object -- Year, make, model, VIN (optional). Used to load the correct frame definition table. Default frame table covers target vehicle (2011-2021 vehicle platform Grand Cherokee / Dodge Durango).
- `symptom`: string -- Plain-language description of the intermittent problem: "steering feels loose at highway speed", "interior lights flicker when turning", "random chime with no warning light", "transmission hunts between 3rd and 4th."
- `bus`: string -- Which CAN bus to monitor: "ihs" (CAN-IHS, 125 kbps, body/interior modules), "c" (CAN-C, 500 kbps, powertrain/chassis modules), or "both" (dual-bus capture, requires two interfaces or a gateway tap).

## Outputs
- `traffic_diff`: object -- Per-frame comparison: frames present in baseline only (disappeared), frames in live only (new), frames in both with changed interval or payload. Each entry includes arb_id, baseline stats, live stats, delta.
- `anomaly_list`: array -- Ranked list of significant differences. Each anomaly: arb_id, anomaly type (missing, new, frequency shift, payload drift, jitter spike), magnitude, and confidence score (0-100).
- `signal_forensics`: object -- For the top anomalies, decoded signal-level analysis: which named signal within the frame changed, old value vs new value, physical units.
- `suspect_modules`: array -- ECU modules implicated by the anomalies, ranked by how many anomalous frames they own. Each entry: module name, bus address, anomaly count, and recommended diagnostic action.

## Execution

### Phase 1: BASELINE
### Entry Criteria
CAN adapter connected, vehicle ignition on. Bus type selected.
### Actions
1. Configure the CAN interface for the selected bus:
   - CAN-IHS: 125 kbps, brp=68, prop_seg=1, phase_seg1=15, phase_seg2=3, sjw=1.
   - CAN-C: 500 kbps, brp=17, same segment timing.
   - If "both," configure two interfaces or capture sequentially.
2. If a baseline file is provided, parse it and build the frame statistics table: for each arb_id, compute mean interval (ms), standard deviation, min/max interval, byte-level mode values (most common byte at each position), and total frame count.
3. If no baseline exists, capture one now:
   - Capture duration: 60 seconds minimum for CAN-C (most frames cycle at 10-100 ms, so 60s gives 600-6000 samples per ID). 120 seconds for CAN-IHS (some body frames cycle at 500 ms-1s).
   - Vehicle state during baseline: engine idling, transmission in park, all doors closed, no accessories active, HVAC off. This eliminates transient frames and gives a clean reference.
   - Log: timestamp, arb_id, DLC, data bytes for every frame.
4. Build the baseline statistics table:
   - Count unique arb_ids. target vehicle CAN-C typically shows 40-60 unique IDs at idle. CAN-IHS shows 20-35.
   - For each ID: frame count, mean interval, stddev, min/max interval, payload byte modes.
   - Flag any ID with stddev > 50% of mean interval as "already jittery" in the baseline.
5. Save the baseline for future comparisons.

### Output
Baseline statistics table with per-frame metrics.
### Quality Gate
At least 30 seconds of clean capture. Every frame has sufficient samples for meaningful statistics (minimum 10 frames per ID). No CAN error frames exceeding 1% of total traffic.

### Phase 2: LIVE CAPTURE
### Entry Criteria
Baseline loaded. CAN adapter connected.
### Actions
1. Instruct the user to reproduce the symptom or drive in the conditions where it occurs. Common triggers:
   - Speed-dependent issues: capture during highway driving (60+ mph steady).
   - Temperature-dependent: capture after the vehicle has been running 20+ minutes (fully warm).
   - Electrical: capture while toggling the suspected system (lights, wipers, windows, locks).
   - Intermittent: capture for a longer duration (5-10 minutes) and mark the timestamp when the symptom appears.
2. Capture live traffic with the same bus configuration as the baseline.
3. If the user marks a symptom timestamp, flag a 10-second window around it for priority analysis.
4. Build the live statistics table using the same method as Phase 1.
5. Record any CAN error frames during the live capture. Error frames during the symptom window are highly diagnostic: they indicate a node is failing to transmit or the bus is electrically disturbed.

### Output
Live statistics table, symptom timestamp window (if marked), error frame count.
### Quality Gate
Capture covers the symptom occurrence (user confirmed it happened during the recording, or capture is long enough to include the intermittent event statistically). Same bus and bitrate as baseline.

### Phase 3: DIFF
### Entry Criteria
Baseline and live statistics tables available.
### Actions
1. Compare frame ID sets:
   - **Missing IDs:** present in baseline, absent in live. A disappeared frame means the originating ECU stopped transmitting. Possible causes: ECU powered off (blown fuse), bus-off condition (too many errors), wiring fault, or the ECU is in a different mode.
   - **New IDs:** present in live, absent in baseline. A new frame means an ECU started transmitting something it didn't before. Possible causes: fault response message, diagnostic session active from another tool, module woke up (e.g., TPMS sensor triggered, trailer module connected).
   - **Common IDs:** present in both. These are candidates for interval and payload comparison.
2. For common IDs, compute interval delta:
   - Absolute change: `live_mean_interval - baseline_mean_interval` in ms.
   - Relative change: `abs(delta) / baseline_mean_interval * 100` as percentage.
   - Flag any frame where the interval changed by more than 20% as a frequency anomaly. A frame that was cycling at 100 ms and is now at 150 ms means the originating ECU is overloaded, throttling, or in a degraded state.
3. For common IDs, compute payload drift:
   - Byte-by-byte comparison of mode values: which bytes changed their most-common value.
   - Bit-level analysis for bytes that changed: which specific bits flipped. This narrows the signal within the frame.
   - For known frames (in the decode table), map changed bits to named signals.
4. Compute jitter change: compare stddev between baseline and live. A frame that was steady (stddev < 5% of mean) and became jittery (stddev > 20%) indicates bus contention or ECU timing instability.
5. Rank all differences by magnitude: missing/new IDs first, then large frequency shifts, then payload changes, then jitter changes.

### Output
Ranked diff table: arb_id, diff type, baseline value, live value, delta, significance score.
### Quality Gate
Every common ID compared on interval and payload. Missing and new IDs explicitly listed. Significance scores assigned.

### Phase 4: CLASSIFY
### Entry Criteria
Diff table complete.
### Actions
1. Map each anomalous frame to its originating ECU module using the frame definition table:

   | Arb ID | Signal | Source Module |
   |---|---|---|
   | 0x244 | Wheel speeds (4 wheels, 13-bit each) | ABS/ESP |
   | 0x286 | Vehicle speed, odometer | PCM |
   | 0x2A8 | Steering angle, steering rate | EPS (Electric Power Steering) |
   | 0x2FA | Engine RPM, throttle position | PCM |
   | 0x318 | Headlights, turn signals, high beams, fog lights | BCM |
   | 0x322 | Door open/closed, trunk, hood | BCM |
   | 0x2D2 | Gear position, transmission mode | TCM |
   | 0x348 | Tire pressure (4 wheels) | TPMS |
   | 0x3E6 | Ambient temperature, cabin temperature | HVAC |
   | 0x1E1 | Airbag status, seatbelt status | SRS/ORC |

2. Group anomalies by source module. If multiple frames from the same module are anomalous, that module is the prime suspect.
3. Cross-reference with the symptom description:
   - Steering symptom + anomaly on 0x2A8 = EPS issue.
   - Light flicker + anomaly on 0x318 = BCM issue.
   - Transmission hunt + anomaly on 0x2D2 or 0x2FA = TCM or PCM issue.
4. Classify each anomaly:
   - **Module failure:** ID disappeared entirely. The ECU is dead or disconnected.
   - **Degraded module:** Interval increased >50%. The ECU is alive but struggling (overloaded, overheating, intermittent power).
   - **Sensor fault:** Payload drift on a specific signal within a frame. The ECU is transmitting but one of its sensor inputs is bad.
   - **Bus contention:** Jitter spiked across multiple IDs. Something is flooding the bus or causing electrical noise.
   - **Mode change:** New ID appeared that corresponds to a known diagnostic or fault broadcast. The ECU entered a fault state.
5. If error frames were captured during the symptom window, identify which node went bus-off by checking which ID stopped transmitting simultaneously.

### Output
Classified anomaly list with module attribution, anomaly type, and symptom correlation score.
### Quality Gate
Every anomaly mapped to a module (or flagged as unknown ID). Classification type assigned. At least one suspect module identified or "no anomaly found" stated explicitly.

### Phase 5: REPORT
### Entry Criteria
Classification complete.
### Actions
1. Produce the forensics summary:
   - Total frames captured: baseline vs live.
   - Unique IDs: baseline vs live, overlap count.
   - Anomalies found: count by type (missing, new, frequency, payload, jitter).
2. Suspect module ranking: list each implicated module with its anomaly count and the specific frames affected.
3. For the top 3 suspects, provide a diagnostic next step:
   - "ABS module: frame 0x244 (wheel speeds) interval increased 40%. Check wheel speed sensor connectors and wiring at all 4 wheels. Common target vehicle failure: corroded connector at the right rear knuckle."
   - "BCM: frame 0x318 (lighting status) payload byte 2 bit 4 toggling. This is the high-beam status bit. Check multifunction switch and BCM connector C3 (gray, 38-pin, behind the lower dash panel)."
4. If no anomalies found, state that the CAN traffic looks identical between baseline and live. Recommend:
   - Longer capture duration.
   - Capturing on the other bus (if only one was monitored).
   - Checking for the symptom on a different subsystem (mechanical, not electrical).
5. Save the live capture as the new comparison reference for future runs.

### Output
Forensics report with suspect list, next diagnostic steps, and comparison data.
### Quality Gate
Report is actionable: every suspect has a specific thing to check. Raw data (frame counts, intervals, payloads) is included for anyone who wants to dig deeper.


---

## Worked Example

Illustrative only.

Given typical inputs for CAN bus traffic forensics for intermittent vehicle problems. Records a baseline , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) baseline and live captures are recorded and parsed, (2) every frame ID is compared on interval and payload, (3) anomalies are classified and mapped to source modules, (4) suspect modules are ranked with specific diagnostic next steps, (5) captures are saved for future comparison.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| BASELINE | No CAN traffic at all | Check adapter connection, bus selection, and OBD-II port power. CAN-IHS is pins 3/11, CAN-C is pins 6/14. Swapping buses is the most common mistake. Verify ignition is on (not just accessory) |
| BASELINE | Only a few frames (<5 unique IDs) | Likely on the wrong bus, or the vehicle's gateway is filtering. On target vehicle, the SGW (Security Gateway, 2018+) may block OBD-II passthrough for some frames. Try direct bus tap if available |
| LIVE CAPTURE | Symptom didn't occur during capture | Extend capture duration. For temperature-dependent faults, capture during the warm-up cycle. For load-dependent faults, capture under acceleration. Mark "symptom not confirmed" on the report |
| LIVE CAPTURE | High error frame rate (>5% of traffic) | The bus itself is electrically disturbed. This IS a finding: check termination resistors (should be 60 ohms between CAN-H and CAN-L at the OBD port), check for chafed wiring, check for aftermarket devices tapped into the bus |
| DIFF | Baseline and live have completely different ID sets | Baseline was captured on a different bus, or vehicle configuration changed (module added/removed between captures). Recapture baseline |
| CLASSIFY | Unknown arb_id not in the frame table | Report it as "unknown module at ID 0xNNN." Note the interval and payload pattern. It may be an aftermarket device (radar detector, dashcam, insurance dongle) |
| REPORT | Too many anomalies to prioritize (>15 differences) | Something systemic changed: different drive mode (sport vs normal changes broadcast rates), different accessory state (HVAC on vs off adds frames), or a major fault. Ask the user to confirm vehicle state matched between captures |

## State Persistence
- Baseline captures per bus (stored with date, mileage, vehicle state notes)
- Anomaly history (which IDs were flagged in previous runs, whether they resolved)
- Frame definition table overrides (user-added decode entries for aftermarket or unknown frames)
- Symptom-to-anomaly correlation log (building a map of "when X symptom happens, frame Y is always affected")

## Reference

### target vehicle CAN-C Common Frame IDs (500 kbps)

| Arb ID | Cycle (ms) | DLC | Signals | Source |
|---|---|---|---|---|
| 0x244 | 20 | 8 | FL/FR/RL/RR wheel speed (13-bit each, 0.01 km/h/bit) | ABS |
| 0x286 | 100 | 8 | Vehicle speed (16-bit, 0.01 km/h), odometer | PCM |
| 0x2A8 | 10 | 8 | Steering angle (16-bit signed, 0.1 deg), steering rate | EPS |
| 0x2D2 | 100 | 8 | Gear position, trans temp, torque converter | TCM |
| 0x2FA | 20 | 8 | Engine RPM (16-bit, 0.25 rpm/bit), throttle % | PCM |
| 0x348 | 1000 | 8 | Tire pressure per wheel (8-bit, 3.45 kPa/bit) | TPMS |
| 0x3E6 | 1000 | 8 | Ambient temp, cabin temp, solar load | HVAC |

### target vehicle CAN-IHS Common Frame IDs (125 kbps)

| Arb ID | Cycle (ms) | DLC | Signals | Source |
|---|---|---|---|---|
| 0x318 | 100 | 8 | Head/tail/turn/fog/reverse/DRL light states | BCM |
| 0x322 | 200 | 8 | Door open (FL/FR/RL/RR), trunk, hood | BCM |
| 0x2D0 | 200 | 8 | Lock/unlock state per door | BCM |
| 0x3A0 | 500 | 8 | Window position (4 windows, % open) | BCM |
| 0x3B0 | 500 | 8 | Mirror position, fold state | BCM |

### Anomaly Significance Thresholds

| Anomaly Type | Threshold | Significance |
|---|---|---|
| Missing ID | Frame present in baseline, 0 frames in live | Critical: module stopped transmitting |
| New ID | Frame absent in baseline, present in live | High: module entered new state |
| Frequency shift | >20% interval change | Medium-High: module timing degraded |
| Payload drift | Any byte mode changed | Medium: sensor input or state changed |
| Jitter spike | Stddev increased >3x | Medium: bus contention or timing issue |
| Error frames | >1% of total traffic | High: electrical or protocol fault |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
