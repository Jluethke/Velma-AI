# Hypothesis Setup and Settings Profiles

**One-line description:** Installs Hypothesis into an existing pytest project, registers named settings profiles (dev, ci, debug) in `conftest.py`, pins the example database location, and proves the setup works with one smoke property before any real property is written.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Root of the Python project that already runs `pytest`.

---

## Outputs

- `hypothesis_config` (object): Installed Hypothesis version, path of the `conftest.py` that registers profiles, profile names with their settings, selection mechanism (`--hypothesis-profile` flag or `HYPOTHESIS_PROFILE` environment variable), example database path, and whether `.hypothesis/` is ignored by git.

---

## Phase 1: Install and Verify

### Entry Criteria
- `pytest` runs in `repo_path` (`python -m pytest --collect-only -q` exits 0).

### Actions
1. Detect the dependency manager from files in `repo_path`:

| File present | Install command |
|---|---|
| `uv.lock` | `uv add --dev hypothesis` |
| `poetry.lock` | `poetry add --group dev hypothesis` |
| `pdm.lock` | `pdm add -dG test hypothesis` |
| `requirements-dev.txt` or `requirements/test.txt` | append `hypothesis` with the version you install, then `pip install -r <file>` |
| none of these | `python -m pip install hypothesis` and record it for the project owner |

2. Confirm the install: `python -c "import hypothesis; print(hypothesis.__version__)"`. Record the version.
3. Confirm the pytest plugin loaded: `python -m pytest --help | grep hypothesis`. You must see options such as `--hypothesis-profile`, `--hypothesis-show-statistics`, `--hypothesis-seed` and `--hypothesis-verbosity`.

### Output
Installed version and confirmed plugin options.

### Quality Gate
- The version prints without an ImportError.
- `--hypothesis-profile` appears in `pytest --help` output.

---

## Phase 2: Register Profiles

### Entry Criteria
- Plugin confirmed.

### Actions
1. Open the top-level `conftest.py` for the test tree (`tests/conftest.py` or the repo root). Create it only if none exists. Edit only this one file in this phase.
2. Add the profile block. Values marked `<user>` are user inputs; do not invent them. Values without a marker are the documented Hypothesis defaults restated so the profile is explicit:

```python
import os
from hypothesis import settings, Verbosity, HealthCheck, Phase

settings.register_profile("dev", max_examples=100)            # 100 is the documented default
settings.register_profile(
    "ci",
    max_examples=<user>,          # CI budget chosen by the team
    deadline=None,                # shared CI runners have noisy timing; see health-check flow
    print_blob=True,              # print @reproduce_failure blob on failure
    derandomize=<user: True or False>,
)
settings.register_profile("debug", verbosity=Verbosity.verbose,
                          phases=[Phase.explicit, Phase.reuse, Phase.generate, Phase.shrink])
settings.load_profile(os.getenv("HYPOTHESIS_PROFILE", "dev"))
```

3. Choose `derandomize` for `ci` with this rule:

| If the team wants | Set | Consequence |
|---|---|---|
| CI to never fail on a new random input (merge gate must be stable) | `derandomize=True` | Same examples every run; new bugs found only by local or scheduled runs |
| CI to keep exploring | `derandomize=False` and keep the example database | A new failure can appear on an unrelated PR; the printed seed and blob reproduce it |

4. The example database defaults to `.hypothesis/examples` under the working directory. Add `.hypothesis/` to `.gitignore` unless the team chose to share the database; to share failures across CI runs, read the docs for `hypothesis.database.GitHubArtifactDatabase` or `DirectoryBasedExampleDatabase` before configuring them.
5. Do not set `suppress_health_check` in any profile here. Health checks are handled one by one in the health-check flow.

### Output
`conftest.py` with registered profiles.

### Quality Gate
- `python -m pytest --hypothesis-profile=ci --collect-only -q` exits 0.
- `grep -n "register_profile" <conftest>` shows the dev, ci and debug profiles.
- `git check-ignore .hypothesis/examples` prints the path, or the decision to share the database is recorded.

---

## Phase 3: Smoke Property

### Entry Criteria
- Profiles registered.

### Actions
1. Add one file `tests/test_hypothesis_smoke.py`:

```python
from hypothesis import given, strategies as st

@given(st.lists(st.integers()))
def test_sorted_is_ordered_permutation(xs):
    ys = sorted(xs)
    assert all(a <= b for a, b in zip(ys, ys[1:]))
    assert sorted(ys) == ys and len(ys) == len(xs)
```

2. Run `python -m pytest tests/test_hypothesis_smoke.py --hypothesis-show-statistics -q`.
3. Read the statistics block. It prints a line per test such as `- during generate phase (0.12 seconds): - 100 passing examples, 0 failing examples, 0 invalid examples`. Confirm the passing count equals the profile's `max_examples`.
4. Run the same command with `HYPOTHESIS_PROFILE=debug` and confirm verbose output prints each example (`Trying example: ...`).
5. Keep the smoke test only if the team agrees; otherwise delete this one file you created. Never delete any other test.

### Output
`hypothesis_config`.

### Quality Gate
- The statistics block shows a passing example count matching the active profile.
- The debug profile prints `Trying example:` lines.

---

## Worked Example

Illustrative. `repo_path` = `~/src/shipcalc` with `uv.lock`.

```text
$ uv add --dev hypothesis
$ python -c "import hypothesis; print(hypothesis.__version__)"
6.112.1
$ python -m pytest tests/test_hypothesis_smoke.py --hypothesis-show-statistics -q
.
============================ Hypothesis Statistics =============================
tests/test_hypothesis_smoke.py::test_sorted_is_ordered_permutation:
  - during generate phase (0.21 seconds):
    - Typical runtimes: < 1ms, of which < 1ms in data generation
    - 100 passing examples, 0 failing examples, 0 invalid examples
  - Stopped because settings.max_examples=100
```

`hypothesis_config`: version 6.112.1, `tests/conftest.py`, profiles dev, ci (max_examples set by the team, deadline None, print_blob True, derandomize True), debug; selection via `HYPOTHESIS_PROFILE`; database `.hypothesis/examples` git-ignored.

---

## Exit Criteria

DONE when Hypothesis imports, the pytest plugin options are present, three profiles load by name, and the smoke property reports the expected example count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pytest --collect-only` fails before Hypothesis is added | **Stop**: the project test setup is broken; fix collection first. |
| Phase 1 | Dependency resolver conflict | **Adjust**: pin a Hypothesis release compatible with the project's Python version (check the Hypothesis changelog), never downgrade other packages silently. |
| Phase 2 | `settings.load_profile` raises `InvalidArgument` | **Retry**: a setting name is misspelled; compare it with `hypothesis.settings` docs for the installed version. |
| Phase 3 | Smoke test fails | **Stop**: the environment is broken (wrong interpreter, plugin conflict); report the full output. |
| Phase 3 | CI budget for `max_examples` not given | **Return**: ask the team; leave `ci` at the default until answered. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
