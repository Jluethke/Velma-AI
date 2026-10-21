# Incident Traffic Shift Away From a Bad Slice

**One-line description:** Moves traffic off a failing region, cluster or deployment slice by changing Istio VirtualService weights, AWS ALB weighted target groups or Route 53 weighted records, after confirming the receiving side has capacity, and verifies the shift from the receiving side's request rate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mitigation_choice` (object, required): From `inc-stabilize-decision-table` with action "traffic_shift".
- `traffic_controller` (string, required): One of `istio`, `aws-alb`, `route53`.
- `traffic_target` (object, required): The object to change and the slices: for istio the VirtualService name, namespace and destination subsets; for aws-alb the listener ARN (or rule ARN) and target group ARNs; for route53 the hosted zone ID, record name, and the SetIdentifier of each weighted record.

---

## Outputs

- `traffic_shift_result` (object): {controller, object_changed, weights_before, weights_after, change_id, receiving_rate_before, receiving_rate_after, completed_at_utc, restore_command}.

---

## Phase 1: Read Weights and Check Capacity

### Entry Criteria
- `mitigation_choice` is approved and names the bad slice and the healthy slice.

### Actions
1. Save the current configuration to a file in your working directory (not in a repository):
   - istio: `kubectl get virtualservice <vs> -n <ns> -o yaml > vs-before.yaml`
   - aws-alb: `aws elbv2 describe-listeners --listener-arns <arn> > alb-before.json` (or `aws elbv2 describe-rules --rule-arns <arn>` for a rule)
   - route53: `aws route53 list-resource-record-sets --hosted-zone-id <zone> --query "ResourceRecordSets[?Name=='<name>.']" > r53-before.json`
2. Read weights_before from that file.
3. Check the healthy slice can absorb the extra traffic: its current request rate and CPU from `metric_findings`, its HPA max (`kubectl get hpa`), and whether it scales automatically. If capacity is unknown, shift in steps (Phase 2 rule).
4. Route 53 only: read the record's TTL from the file. Resolvers and clients may keep the old answer until the TTL expires, and some clients cache longer. A DNS shift is slower and less complete than a load balancer shift.

### Output
Saved before-state and capacity notes.

### Quality Gate
- The before file exists and contains the weights.
- The healthy slice's current rate and capacity limit are written down, or "unknown, shifting in steps" is recorded.

---

## Phase 2: Shift

### Entry Criteria
- Before-state is saved.

### Actions
1. If capacity is unknown, shift in steps chosen by the IC (record each step), watching errors on the healthy side between steps. If capacity is confirmed, shift in one step.
2. Apply with the controller's command:
   - istio: copy `vs-before.yaml` to `vs-shift.yaml`, change only the `weight` values under the route's `destination` entries (weights in one route must add up to 100), then `kubectl apply -f vs-shift.yaml`. Run `istioctl analyze -n <ns>` first and fix any error it prints.
   - aws-alb:
     ```
     aws elbv2 modify-listener --listener-arn <arn> --default-actions '[{"Type":"forward","ForwardConfig":{"TargetGroups":[{"TargetGroupArn":"<bad-tg>","Weight":0},{"TargetGroupArn":"<good-tg>","Weight":1}]}}]'
     ```
     For a rule use `aws elbv2 modify-rule --rule-arn <arn> --actions ...` with the same ForwardConfig.
   - route53: write `shift.json` with an `UPSERT` change for each weighted record (same Name, Type, SetIdentifier, TTL and value as before, new Weight), then `aws route53 change-resource-record-sets --hosted-zone-id <zone> --change-batch file://shift.json`. Poll `aws route53 get-change --id <change-id>` until Status is `INSYNC`.
3. Do NOT delete the bad slice's route or record; set its weight to zero so restore is one command.
4. Write restore_command using the before values.

### Output
Applied change and change ID.

### Quality Gate
- istio: `kubectl get virtualservice <vs> -n <ns> -o yaml` shows the new weights.
- aws-alb: `aws elbv2 describe-listeners` shows the new weights.
- route53: `get-change` shows `INSYNC`.

---

## Phase 3: Verify From Both Sides

### Entry Criteria
- Change is applied.

### Actions
1. Query the request rate per slice from Prometheus or the load balancer's CloudWatch metrics (`RequestCount` per target group for ALB) for the window before and after the change.
2. The healthy side's rate must rise and the bad side's must fall. If the bad side still receives traffic after a load balancer change, look for clients that bypass it (internal callers using a Service name directly, or long-lived connections such as HTTP/2 and gRPC that stay pinned until they reconnect).
3. Check the healthy side's error ratio and latency did not rise.
4. Add the change to the timeline as an `action` entry.

### Output
`traffic_shift_result`.

### Quality Gate
- receiving_rate_after is higher than receiving_rate_before, read from the same query.
- The healthy side's error ratio after the change is quoted.

---

## Worked Example

Illustrative only. Istio, VirtualService `checkout` in `shop`, subsets `v2` (bad) and `v1` (good), weights 50/50.

- Phase 1: `vs-before.yaml` saved. v1 runs 6 pods with HPA max 12 and CPU at 35 percent. Capacity confirmed by the IC.
- Phase 2: `vs-shift.yaml` sets v1 weight 100, v2 weight 0. `istioctl analyze -n shop` prints "No validation issues found". `kubectl apply -f vs-shift.yaml` prints "virtualservice.networking.istio.io/checkout configured". Restore: `kubectl apply -f vs-before.yaml`.
- Phase 3: `sum by (version) (rate(istio_requests_total{destination_service_name="checkout"}[1m]))` shows v1 from 41 to 83 req/s and v2 from 42 to 0.4 req/s (stragglers on open connections). v1 5xx ratio stays at 0.002.

---

## Exit Criteria

DONE when the bad slice's weight is zero (or at the IC's chosen step), the receiving side's rate rose and its errors did not, and a one-command restore is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Healthy slice lacks capacity | **Adjust**: scale it first with `inc-k8s-scale-out`, then shift. |
| Phase 2 | `istioctl analyze` reports errors | **Stop**: fix the YAML; never apply a VirtualService that fails analysis. |
| Phase 2 | Route 53 change stays PENDING | **Retry**: keep polling `get-change`; do not submit a second conflicting change. |
| Phase 3 | Healthy side starts failing | **Return**: run restore_command and return to `inc-stabilize-decision-table`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
