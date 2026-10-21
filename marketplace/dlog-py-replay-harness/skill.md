# Python Deterministic Replay Harness

**One-line description:** Replays an MCAP drive or slice straight into Python processing code in log-time order with `make_reader(...).iter_messages(log_time_order=True)`, an injected clock that returns log time, fixed random seeds and single-threaded dispatch, writing outputs to a new MCAP so two runs can be compared byte for byte.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `archive_path` (string, required): MCAP file or slice to replay.
- `drive_index` (object, required): From `dlog-drive-index-sqlite`; topics and expected counts.
- `entry_point` (string, required): Importable Python callable or class that processes messages, for example `perception.tracker:Tracker`.

---

## Outputs

- `replay_procedure` (object): Harness module path, command line, seed values, package versions, input counts, output MCAP path and its SHA-256.

---

## Phase 1: Make the Code Replayable

### Entry Criteria
- No actuator or vehicle bus interface is imported or opened by `entry_point` during replay. If the code can command hardware, the harness replaces those interfaces with recording stubs before any run.

### Actions
1. Search the code under test: `grep -rnE "time\.time\(|time\.monotonic\(|datetime\.now\(|random\.|np\.random\.|threading\.Thread|asyncio" <package>`.
2. For each hit that affects outputs, add a parameter instead: a `clock` callable passed in, a `numpy.random.Generator` passed in (`np.random.default_rng(seed)`), and a synchronous `process(topic, msg, t_ns)` method.
3. Edit one module at a time and run its existing unit tests after each edit. Do NOT delete or weaken tests to make them pass.
4. Set `PYTHONHASHSEED=0` in the harness environment when any output depends on set or dict ordering of strings.

### Output
Code with injectable clock, RNG and synchronous entry.

### Quality Gate
- The grep in Action 1 returns no hit in output-affecting paths, or each remaining hit is listed with why it does not affect outputs.
- Existing unit tests pass (`pytest -q` exit 0).

---

## Phase 2: Write the Harness

### Entry Criteria
- Code is replayable.

### Actions
1. Harness core:
   ```python
   from mcap.reader import make_reader
   from mcap_ros2.decoder import DecoderFactory   # ROS 2 data; omit for json/protobuf
   with open(src, "rb") as f:
       r = make_reader(f, decoder_factories=[DecoderFactory()])
       for schema, channel, message, decoded in r.iter_decoded_messages(topics=topics, log_time_order=True):
           now_ns[0] = message.log_time
           for out_topic, out_msg in node.process(channel.topic, decoded, message.log_time):
               write_output(out_topic, out_msg, message.log_time)
   ```
2. Clock: `clock = lambda: now_ns[0]` passed to the node; it returns the log time of the message being processed.
3. Ties: messages with equal `log_time` arrive in the reader's order; record the reader version, since ordering of ties is defined by the library, and keep the version pinned.
4. Outputs go to a new MCAP via `mcap.writer.Writer` with `log_time` set to the input message's `log_time`, and serialized deterministically (for JSON, `json.dumps(obj, sort_keys=True, separators=(",", ":"))`).
5. Pin versions in a lock file (`pip freeze > replay.lock`) and record it.

### Output
Harness module.

### Quality Gate
- The harness runs to completion and the output MCAP passes `mcap doctor`.
- Input message count processed equals the slice's count from `mcap info`.

---

## Phase 3: Run Twice

### Entry Criteria
- Harness works once.

### Actions
1. Run twice into `run1/` and `run2/` with identical command lines and environment.
2. `sha256sum run1/out.mcap run2/out.mcap`. Equal hashes mean byte-identical outputs. If not equal, pass both to `dlog-replay-determinism-check`.
3. Record command, seeds, versions and hashes in `replay_procedure`.

### Output
`replay_procedure`.

### Quality Gate
- Both runs' output hashes are recorded; equality or inequality is stated.

---

## Worked Example

Illustrative.
```
$ PYTHONHASHSEED=0 python -m replay.harness --src cases/case_0007.mcap \
    --entry perception.tracker:Tracker --seed 1234 --out run1/out.mcap
processed 3712 messages, wrote 119 outputs
$ PYTHONHASHSEED=0 python -m replay.harness ... --out run2/out.mcap
$ sha256sum run1/out.mcap run2/out.mcap
5d1e...a07c  run1/out.mcap
5d1e...a07c  run2/out.mcap
```

---

## Exit Criteria

DONE when the harness replays the slice in log-time order with injected clock and seed, and two runs' output hashes are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code opens a hardware interface on import | **Stop**: stub it before replay. |
| Phase 1 | Tests fail after injecting the clock | **Adjust**: fix the call sites; never change test expectations to match. |
| Phase 2 | No decoder for the schema encoding | **Adjust**: install the matching mcap support package. |
| Phase 3 | Hashes differ | **Return**: to `dlog-replay-determinism-check`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
