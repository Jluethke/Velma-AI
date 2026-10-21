# Unsafe Deserialization Fix

**One-line description:** Finds every deserializer that can instantiate arbitrary types from untrusted bytes (Python `pickle`, `yaml.load`, `jsonpickle`, `torch.load`; Java `ObjectInputStream`, Jackson default typing, SnakeYAML; .NET `BinaryFormatter`, Json.NET `TypeNameHandling`; Node `node-serialize`, `eval`; PHP `unserialize`; Ruby `Marshal`), replaces it with a data-only format or the library's safe loader, and proves the change with a gadget-free canary payload test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node`, `go`, `java`, `dotnet`, `php` or `ruby`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `deserialization`.

---

## Outputs

- `deserialization_fixes` (object): `fixed` (file, line, before, after, data source), `scanner_before`, `scanner_after`, `test_file`, `test_run`.

---

## Phase 1: Find and Rank Deserializers

### Entry Criteria
- `sink_map` exists.

### Actions
1. Stack searches beyond `sink_map` (run the line for `stack`):

```
# python  (B301 pickle, B302 marshal, B403 pickle import, B506 yaml.load)
bandit -r <src> -t B301,B302,B403,B506 -f json -o bandit-deser.json
# java
rg -n "ObjectInputStream|readObject\(|XMLDecoder|XStream|activateDefaultTyping|enableDefaultTyping|JsonTypeInfo\.Id\.CLASS|new Yaml\(" --type java
# dotnet
rg -n "BinaryFormatter|NetDataContractSerializer|SoapFormatter|LosFormatter|ObjectStateFormatter|TypeNameHandling\.(All|Auto|Objects|Arrays)|SimpleTypeResolver" --type cs
# php
rg -n "unserialize\(" --type php
# ruby
rg -n "Marshal\.load|YAML\.load\(|YAML\.unsafe_load|Oj\.load" --type ruby
# node  (sink_map rows, plus: js-yaml v3 load was unsafe for some types; v4 load is safe)
rg -n "\"js-yaml\"" package.json
```
   Go: `encoding/gob` and `yaml.Unmarshal` decode data only and do not run code; record those hits for size limits only.

   Record `scanner_before` (Bandit count for Python; search hit count otherwise).
2. For each hit, write where the bytes come from: request body, cookie, cache (Redis, memcached), message queue, uploaded file, model file, database. A cache or queue counts as untrusted if any other service or user can write to it.

### Output
Ranked list: untrusted source first.

### Quality Gate
- Every hit has a data source.
- `scanner_before` recorded.

---

## Phase 2: Replace With Data-Only Formats or Safe Loaders

### Entry Criteria
- Ranked list exists.

### Actions
1. Apply the row for each hit:

| Current | Replacement |
|---|---|
| `pickle.loads` / `jsonpickle.decode` / `shelve` on untrusted data | JSON (`json.loads`) validated by a Pydantic model; for signed session data use `itsdangerous` with JSON serializer. HMAC-signing a pickle is acceptable only for data the server wrote itself and the key never leaves the server; record that justification. |
| `yaml.load(s)` / `yaml.load(s, Loader=yaml.Loader or FullLoader)` / `yaml.unsafe_load` | `yaml.safe_load(s)` |
| `torch.load(path)` | `torch.load(path, weights_only=True)` (default since PyTorch 2.6; set it explicitly), or `safetensors` |
| `numpy.load(..., allow_pickle=True)` | `allow_pickle=False` (the default) |
| Java `ObjectInputStream` on untrusted data | JSON with explicit DTO classes; if it cannot be removed now, set an allowlist `ObjectInputFilter` (`ObjectInputFilter.Config.createFilter("com.example.dto.*;java.base/*;!*")`) via `ois.setObjectInputFilter(...)` (JEP 290, Java 9 and later) |
| Jackson `activateDefaultTyping` / `@JsonTypeInfo(use = Id.CLASS)` | remove default typing; use `Id.NAME` with `@JsonSubTypes` listing allowed classes, or a `PolymorphicTypeValidator` allowlist |
| SnakeYAML `new Yaml()` (1.x) | upgrade to 2.x and use `new Yaml(new SafeConstructor(new LoaderOptions()))` |
| XStream | `xstream.addPermission(NoTypePermission.NONE)` then `allowTypes(...)` for your classes |
| .NET `BinaryFormatter` and the other formatters listed | `System.Text.Json` with concrete types; `BinaryFormatter` throws in .NET 9 and later |
| Json.NET `TypeNameHandling` other than `None` | `TypeNameHandling.None`; if polymorphism is needed, a custom `ISerializationBinder` allowlist |
| PHP `unserialize($x)` | `json_decode($x, true)`; if unavoidable, `unserialize($x, ['allowed_classes' => false])` |
| Ruby `Marshal.load`, `YAML.load` (Psych below 4) | JSON, or `YAML.safe_load(s, permitted_classes: [])` |
| Node `node-serialize`, `eval`, `new Function` on data | `JSON.parse` plus a Zod schema |

2. Migration of stored data: if existing cache or DB rows hold the old format, write a one-time reader that runs only inside a trusted maintenance job, or let cache entries expire. Never keep the unsafe reader on the request path "for old data".
3. After deserializing with a safe loader, validate the shape with the schema flow for the stack.
4. One sink per commit; run tests after each.

### Output
Rewritten deserializers.

### Quality Gate
- Rerun Phase 1 scans; `scanner_after` lists only justified remainders (server-written, HMAC-checked data), each with its justification in a code comment.
- Python: `rg -n "yaml\.load\(" --type py` prints only calls with `Loader=yaml.SafeLoader` or none.

---

## Phase 3: Canary Payload Tests

### Entry Criteria
- Sinks rewritten.

### Actions
1. Use canary payloads that prove type instantiation without a real exploit chain:

| Format | Canary | Expected after fix |
|---|---|---|
| YAML | `!!python/object/apply:os.getcwd []` | `yaml.constructor.ConstructorError` |
| pickle input to the new JSON endpoint | `pickle.dumps({"a": 1})` bytes | 400 (not JSON) |
| Jackson | `["java.util.Date", 0]` or `{"@class":"java.util.Date"}` into a polymorphic field | rejected; no `Date` instantiated |
| Json.NET | `{"$type":"System.Version, System.Private.CoreLib","Major":1}` | `$type` ignored or rejected |
| PHP | `O:8:"stdClass":0:{}` | value is not an object (`__PHP_Incomplete_Class` or JSON error) |
| Ruby YAML | `--- !ruby/object:OpenStruct {}` | `Psych::DisallowedClass` |

2. Do NOT use real gadget chains (ysoserial and similar) in the repository's test suite; those belong in authorized security testing only.
3. Run, record summary. Mutation check: restore the unsafe call in one sink, rerun, confirm failure, revert.

### Output
`deserialization_fixes`.

### Quality Gate
- Test summary shows 0 failed.
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `python`. `app/cache.py:22` did `pickle.loads(redis.get(key))`; Redis is shared with a reporting service (untrusted per Phase 1 step 2). `app/config_upload.py:9` did `yaml.load(request.data, Loader=yaml.FullLoader)`.

Phase 1: `bandit -r app -t B301,B403,B506` reports 3 issues.

Phase 2: cache switched to `json.dumps` / `json.loads` with a Pydantic model; old keys get a new prefix `v2:` so old pickles are never read. Config upload uses `yaml.safe_load`.

Phase 3:
```
$ python -m pytest tests/test_deser.py -q
....                                                       [100%]
4 passed in 0.09s
```

---

## Exit Criteria

DONE when no untrusted bytes reach a type-instantiating deserializer, every remainder is server-written data with a written justification, and canary tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework session uses pickle (for example older Django `PickleSerializer`) | **Adjust**: switch to the JSON serializer setting; plan session invalidation with the owner. |
| Phase 2 | Machine-learning model files must be loaded from users | **Return**: require `safetensors` or `weights_only=True`; arbitrary pickle model files cannot be made safe. |
| Phase 2 | Java library internally uses `ObjectInputStream` (RMI, JMX) | **Adjust**: set a process-wide `jdk.serialFilter` system property allowlist and record it. |
| Phase 3 | Canary still instantiates the type | **Stop**: a second code path uses the unsafe loader. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
