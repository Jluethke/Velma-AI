# AWS Application Load Balancer for WebSocket and SSE

**One-line description:** Configures an AWS Application Load Balancer for long-lived realtime connections with the AWS CLI: `idle_timeout.timeout_seconds` above the heartbeat window, target group stickiness only when the transport needs it, `deregistration_delay.timeout_seconds` matched to the app drain window, and a health check that does not depend on WebSocket, verified by reading the attributes back and an idle test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `alb_arn` (string, required): ARN of the Application Load Balancer.
- `target_group_arn` (string, required): ARN of the target group serving the realtime endpoint.
- `transport_decision` (object, required): From `rtw-transport-decision`.
- `heartbeat_config` (object, required): From `rtw-heartbeat-config`.

---

## Outputs

- `alb_config` (object): `{ before: {}, after: {}, idle_timeout_s, stickiness, deregistration_delay_s, health_check, iac_note, checks: [] }`.

---

## Phase 1: Read Current Attributes

### Entry Criteria
- `aws sts get-caller-identity` succeeds with the right account.

### Actions
1. Load balancer attributes: `aws elbv2 describe-load-balancer-attributes --load-balancer-arn <alb_arn> --output table`. Record `idle_timeout.timeout_seconds` (AWS default 60).
2. Target group attributes: `aws elbv2 describe-target-group-attributes --target-group-arn <target_group_arn> --output table`. Record `stickiness.enabled`, `stickiness.type`, `deregistration_delay.timeout_seconds` (AWS default 300), `load_balancing.algorithm.type`.
3. Health check: `aws elbv2 describe-target-groups --target-group-arns <target_group_arn> --query "TargetGroups[0].{path:HealthCheckPath,proto:HealthCheckProtocol,matcher:Matcher}"`.
4. Infrastructure as code: search the repos for this ALB in Terraform, CloudFormation or CDK (`grep -rn "idle_timeout\|deregistration_delay\|aws_lb\b" infra/`). If found, change the attributes there, not with the CLI; a CLI change is overwritten on the next apply. Record the finding in `iac_note`.
5. Save all outputs as `before`.

### Output
`before` snapshot and `iac_note`.

### Quality Gate
- `before` contains the four attributes and the health check, copied from command output.

---

## Phase 2: Decide the Values

### Entry Criteria
- `before` recorded.

### Actions
1. `idle_timeout_s`: the ALB closes a connection when no data is sent in either direction for this long. WebSocket ping/pong frames count as data. It must be greater than `heartbeat_config.proxy_idle_minimum_s`. AWS allows 1 to 4000 seconds. Record the chosen value and reason.
2. Stickiness from `transport_decision.needs_sticky_sessions`:
   - `false`: leave `stickiness.enabled=false`. ALB keeps a WebSocket on one target for its life anyway.
   - `true` (long-polling fallback with server memory, Socket.IO polling transport): `stickiness.enabled=true`, `stickiness.type=lb_cookie`, `stickiness.lb_cookie.duration_seconds` from the owner, recorded. Browsers must send the `AWSALB` cookie, which needs `withCredentials` for cross-origin XHR.
3. `deregistration_delay_s`: when a target is deregistered in a deploy, the ALB stops new connections to it and waits this long before closing remaining ones. Set it to at least the app's graceful drain window from `rtw-graceful-drain` so the app, not the ALB, closes sockets with code 1012. Record the source.
4. Health check: point it at a plain HTTP path (for example `/healthz`) that returns 200, never at the WebSocket path. ALB health checks do not perform an upgrade.
5. `load_balancing.algorithm.type`: `least_outstanding_requests` counts in-flight requests, and an upgraded WebSocket is not an outstanding request after the handshake, so it does not balance by open sockets. Keep `round_robin` unless measured otherwise; record the decision.

### Output
Decided values with reasons.

### Quality Gate
- `idle_timeout_s > proxy_idle_minimum_s` with numbers shown.
- `deregistration_delay_s` cites the drain window source.

---

## Phase 3: Apply and Verify

### Entry Criteria
- Values decided; if `iac_note` says IaC owns the ALB, apply through IaC (`terraform plan` then `terraform apply` with `idle_timeout` on `aws_lb` and `deregistration_delay`/`stickiness` on `aws_lb_target_group`) and skip Actions 1 and 2.

### Actions
1. `aws elbv2 modify-load-balancer-attributes --load-balancer-arn <alb_arn> --attributes Key=idle_timeout.timeout_seconds,Value=<idle_timeout_s>`.
2. `aws elbv2 modify-target-group-attributes --target-group-arn <target_group_arn> --attributes Key=deregistration_delay.timeout_seconds,Value=<deregistration_delay_s> Key=stickiness.enabled,Value=<true|false>` (add `Key=stickiness.type,Value=lb_cookie` and the duration when enabling).
3. Read back with the Phase 1 commands and store as `after`. Every changed key must show the new value.
4. Handshake through the ALB DNS name or the public host: the curl upgrade command (`curl -i -N --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" ...`) returns 101.
5. Idle test: hold a `websocat` connection with heartbeats running for longer than the old idle timeout; it stays open.
6. Deploy test: deregister one target (`aws elbv2 deregister-targets --target-group-arn <target_group_arn> --targets Id=<id>`) while clients are connected; clients on it receive 1012 from the app, not 1006 at the delay limit. Re-register afterwards.

### Output
`alb_config`.

### Quality Gate
- `after` shows the new values; steps 4 to 6 pass (paste outputs and the client close codes).

---

## Worked Example

Illustrative only.

`before`: idle 60, deregistration 300, stickiness false. `proxy_idle_minimum_s = 58` would pass at 60 with almost no margin; owner chose `idle_timeout_s = 120`. Drain window 45 s, so `deregistration_delay_s = 60`.
```
$ aws elbv2 modify-load-balancer-attributes --load-balancer-arn arn:aws:elasticloadbalancing:...:loadbalancer/app/rt/abc --attributes Key=idle_timeout.timeout_seconds,Value=120
$ aws elbv2 describe-load-balancer-attributes --load-balancer-arn ... --query "Attributes[?Key=='idle_timeout.timeout_seconds']"
[ { "Key": "idle_timeout.timeout_seconds", "Value": "120" } ]
```
Deregistering target i-0abc: 212 clients received close code 1012 within 45 s and reconnected to the remaining targets.

---

## Exit Criteria

DONE when the ALB idle timeout exceeds the heartbeat window, stickiness matches the transport, the deregistration delay covers the app drain window, the health check uses plain HTTP, and the readback, handshake, idle and deploy checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `AccessDenied` on describe calls | **Stop**: request `elasticloadbalancing:Describe*` permissions; do not guess current values. |
| Phase 3 | Values revert after a deploy | **Return** to `iac_note`: IaC owns the ALB; change it there. |
| Phase 3 | Clients get 1006 at deregistration | **Adjust**: the app does not drain on SIGTERM or the delay is shorter than the drain window. |
| Phase 3 | CloudFront in front closes connections earlier | **Adjust**: add CloudFront to `network_path` and rerun `rtw-heartbeat-config`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
