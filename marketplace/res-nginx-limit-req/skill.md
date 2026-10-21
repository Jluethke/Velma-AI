# Edge Rate Limiting With nginx limit_req

**One-line description:** Configures nginx's leaky-bucket limiter (limit_req_zone key and rate, burst with nodelay or delay, limit_req_status 429, dry run with $limit_req_status logging, real client IP behind a load balancer, Retry-After via error_page) and proves the accept and reject pattern with hey, noting that limits are per nginx instance.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `nginx_conf_path` (string, required): Path to the nginx config file or the included file for the site (for example `/etc/nginx/conf.d/api.conf`).
- `rate_limit_spec` (object, required): `key_by` (client IP or a header such as `X-Api-Key`), `rate_per_s`, `burst`, `routes`, `instance_count` (how many nginx instances share the traffic), `trusted_proxies` (CIDRs of load balancers in front of nginx, or empty).

---

## Outputs

- `edge_rate_limit_config` (object): The config lines added with file:line, the `nginx -t` output, the dry-run log sample, the hey status distribution before and after enforcement, and the per-instance note.

---

## Phase 1: Write the Config in Dry-Run Mode

### Entry Criteria
- `nginx -v` prints a version; `limit_req_dry_run` needs 1.17.1+, `$limit_req_status` needs 1.17.6+, `delay=` needs 1.15.7+.
- A backup of `nginx_conf_path` exists outside the config directory (`cp <file> <backup>`).

### Actions
1. Compute the per-instance rate: nginx keeps limiter state in each instance's shared memory, so with `instance_count` N behind a load balancer the cluster-wide rate is about N times the configured rate. Set `rate = rate_per_s / instance_count` (round down to an integer, or express per minute, for example `30r/m`) and write the arithmetic in a comment.
2. Real client IP: if `trusted_proxies` is not empty, add in `http {}`:
   ```nginx
   set_real_ip_from 10.0.0.0/8;        # one line per trusted proxy CIDR from the input
   real_ip_header X-Forwarded-For;
   real_ip_recursive on;
   ```
   Without this, every request has the load balancer's address and all clients share one bucket.
3. Key: client IP uses `$binary_remote_addr` (fixed size, smaller than `$remote_addr`). For an API key header: `map $http_x_api_key $rl_key { default $http_x_api_key; "" $binary_remote_addr; }` so anonymous requests fall back to IP. Requests whose key is an empty string are not counted at all, which is how to exempt traffic.
4. Zone in `http {}`: `limit_req_zone $rl_key zone=api:10m rate=<rate>r/s;`. nginx docs: one megabyte holds about 16 thousand 64-byte states (about 8 thousand 128-byte states on some platforms); size it from the expected number of distinct keys. When full, the least recently used state is evicted.
5. In each `location` from `routes`:
   ```nginx
   limit_req zone=api burst=<burst> nodelay;
   limit_req_status 429;
   limit_req_log_level warn;
   limit_req_dry_run on;
   ```
   `burst` with `nodelay` admits up to `burst` excess requests at once and refills one slot per `1/rate` seconds; without `nodelay` excess requests are queued and released at the rate, adding latency. Use `delay=<n>` only if the spec asks for two-stage limiting. The default reject status is 503; always set 429.
6. Log the decision: add `$limit_req_status` to a `log_format` and use it in `access_log`.
7. Do NOT add `limit_req` to health check or metrics locations.
8. Validate: `nginx -t` must print `syntax is ok` and `test is successful`. Then `nginx -s reload`.

### Output
Dry-run config live.

### Quality Gate
- `nginx -t` output saved with both success lines.
- `rg -n "limit_req" <nginx_conf_path>` shows the zone once and the directives only in the planned locations.

---

## Phase 2: Observe Dry Run

### Entry Criteria
- Dry run live for real or replayed traffic.

### Actions
1. Count decisions over a peak period: `awk '{print $NF}' /var/log/nginx/access.log | sort | uniq -c` (assuming `$limit_req_status` is the last field). Values: `PASSED`, `DELAYED`, `REJECTED_DRY_RUN`, `DELAYED_DRY_RUN`.
2. List the top keys that would be rejected and confirm with the API owner they are abusive or expected to be limited.
3. If legitimate clients appear in `REJECTED_DRY_RUN`, return the numbers to the user; do not raise `rate` or `burst` on your own.

### Output
Dry-run counts and top keys.

### Quality Gate
- A count table of `$limit_req_status` values for the period is saved.
- The user approved enforcement after seeing the table (record the approval message).

---

## Phase 3: Enforce and Verify

### Entry Criteria
- User approval recorded.

### Actions
1. Remove `limit_req_dry_run on;` (or set `off`). Add `Retry-After`, which nginx does not send by itself:
   ```nginx
   error_page 429 = @ratelimited;
   location @ratelimited { add_header Retry-After <ceil(1 / rate)> always; return 429; }
   ```
2. `nginx -t && nginx -s reload`.
3. Verify against one instance directly (not through the load balancer): `hey -n $((BURST*3)) -c $((BURST*3)) -H "X-Api-Key: test" http://<instance>/<route>`. Read the "Status code distribution" block.
4. Expected: about `burst + 1` responses `[200]` and the rest `[429]` for a burst sent at once. A second key run at the same time is not affected.
5. Check `curl -si http://<instance>/<route> | rg -i retry-after` after the burst shows the header.

### Output
`edge_rate_limit_config` with hey output.

### Quality Gate
- hey output shows 429s, with 200 count close to `burst + 1` (within the requests that arrived after one refill interval).
- Retry-After present on a 429 response.

---

## Worked Example

Illustrative. Spec: `key_by` = `X-Api-Key`, `rate_per_s` 30, `burst` 20, `instance_count` 3, `trusted_proxies` = `10.0.0.0/8`.

Phase 1: `rate = 30 / 3 = 10r/s`. `nginx -t` prints `nginx: the configuration file /etc/nginx/nginx.conf syntax is ok` and `nginx: configuration file /etc/nginx/nginx.conf test is successful`.

Phase 2 counts: `981204 PASSED`, `312 REJECTED_DRY_RUN`, all from two keys the API owner confirms are scrapers.

Phase 3: `hey -n 60 -c 60 -H "X-Api-Key: test" http://10.0.3.11/v1/search` prints:
```
Status code distribution:
  [200] 21 responses
  [429] 39 responses
```

---

## Exit Criteria

DONE when nginx limits the specified routes per key at the per-instance rate, returns 429 with Retry-After, uses the real client IP, was observed in dry run with user approval, and hey shows the expected split.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `nginx -t` fails | **Stop**: restore the backup, read the error line number, fix only that line. |
| Phase 1 | nginx older than 1.17.1 | **Adjust**: skip dry run; enforce on a canary instance first and compare 429 rates. |
| Phase 2 | Legitimate clients would be rejected | **Return**: report counts to the user for a limit decision. |
| Phase 3 | All clients limited together | **Adjust**: real IP config missing or wrong `real_ip_header`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
