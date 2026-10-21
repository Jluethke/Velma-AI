# python-can Offline Replay on a Virtual Bus with cantools Decode

**One-line description:** Replays a normalized log with `can.LogReader` and `can.MessageSync` onto a python-can `virtual` bus inside one process, decodes the received stream with cantools, and proves the decoded stream equals a direct offline decode, with no hardware interface opened.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `dbc_draft` (object, required): Output of `sigre-dbc-entry-write`.

---

## Outputs

- `python_replay_report` (object): Script path, python-can and cantools versions, frames read versus received, decoded-value comparison result, and pass or fail.

---

## Phase 1: Write the Replay Script

### Entry Criteria
- Offline session; the CAN adapter is unplugged or not referenced anywhere in the script.

### Actions
1. Save as `~/canre/replay_virtual.py`:
   ```
   import sys, can, cantools, queue
   db = cantools.database.load_file(sys.argv[1]); log = sys.argv[2]
   ids = {m.frame_id for m in db.messages}
   tx = can.Bus(interface="virtual", channel="re_replay")
   rx = can.Bus(interface="virtual", channel="re_replay")
   buf = can.BufferedReader(); notifier = can.Notifier(rx, [buf])
   sent = 0
   for msg in can.MessageSync(can.LogReader(log), timestamps=(len(sys.argv) > 3 and sys.argv[3] == "realtime")):
       tx.send(msg); sent += 1
   got, live = 0, []
   while True:
       m = buf.get_message(timeout=1.0)
       if m is None: break
       got += 1
       if m.arbitration_id in ids: live.append(db.decode_message(m.arbitration_id, m.data))
   notifier.stop(); tx.shutdown(); rx.shutdown()
   off = [db.decode_message(m.arbitration_id, m.data) for m in can.LogReader(log) if m.arbitration_id in ids]
   print("sent", sent, "received", got, "decoded", len(live), "offline", len(off), "equal", live == off)
   ```
2. The only `can.Bus` calls use `interface="virtual"`. A python-can virtual bus exists only inside this process; it never reaches hardware.
3. Check: `grep -n "interface=" ~/canre/replay_virtual.py` shows only `"virtual"`.

### Output
Replay script.

### Quality Gate
- The grep shows two lines, both `interface="virtual"`.
- No other bus constructor (`can.interface.Bus`, a config file, or `can.Bus()` with no arguments, which reads `~/.canrc` and could open hardware) appears.

---

## Phase 2: Run and Compare

### Entry Criteria
- Script checked.

### Actions
1. Fast run: `python ~/canre/replay_virtual.py work/vehicle_re.dbc norm/FILE.log`.
2. Optional real-time run for timing-sensitive consumers: add `realtime` as the third argument; `MessageSync` then sleeps to reproduce logged gaps.
3. Read the output line. `sent` must equal `received`, `decoded` must equal `offline`, and `equal` must be `True`.
4. If `received` is lower than `sent`, the buffer timeout ended early; raise `timeout` in `get_message` and rerun.

### Output
Comparison line.

### Quality Gate
- `sent` equals `received`.
- `equal True` printed.

---

## Phase 3: Report

### Entry Criteria
- Comparison passed or failed with numbers.

### Actions
1. Record versions: `python -c "import can, cantools; print(can.__version__, cantools.__version__)"`.
2. Emit `python_replay_report` with the printed line and pass or fail.

### Output
`python_replay_report`.

### Quality Gate
- Report includes the exact printed comparison line and both versions.

---

## Worked Example

Illustrative only.

```
$ python ~/canre/replay_virtual.py work/vehicle_re.dbc norm/20261021_drive.log
sent 412339 received 412339 decoded 48035 offline 48035 equal True
$ python -c "import can, cantools; print(can.__version__, cantools.__version__)"
<python-can version> <cantools version>
```

Pass.

---

## Exit Criteria

DONE when a virtual-bus replay of the log is received in full and its cantools decode equals the direct offline decode, with versions recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Script needs a real interface "to test properly" | **Stop**: replay stays on the virtual bus; this domain never replays onto a vehicle. |
| Phase 2 | `decode_message` raises for a frame | **Return**: DLC in the DBC differs from the frame; fix `BO_` DLC in `sigre-dbc-entry-write`. |
| Phase 2 | `equal False` with equal counts | **Adjust**: compare the first differing pair; floating-point output differs only if the DBC changed between runs. |
| Phase 2 | `received` lower than `sent` | **Retry**: lengthen the `get_message` timeout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
