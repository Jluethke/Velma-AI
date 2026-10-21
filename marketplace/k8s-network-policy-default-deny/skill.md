# NetworkPolicy: Default Deny with Explicit Allows

**One-line description:** Confirms the cluster's CNI enforces NetworkPolicy, then writes a namespace default-deny for ingress and egress plus explicit allows for DNS, the Ingress controller, and each dependency from the workload profile, avoiding the AND/OR selector trap, and proves each rule with a throwaway client pod.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_profile` (object, required): Output of `k8s-workload-inventory`; uses `dependencies`, `container_port`.
- `namespace` (string, required): Namespace the policies apply to.
- `ingress_manifest` (string, required): Path from `k8s-service-ingress-manifest`, or `none`.
- `cluster_context` (string, required): kubeconfig context.

---

## Outputs

- `network_policies` (string[]): Paths of `networkpolicy-*.yaml` files, one policy per file.

---

## Phase 1: Confirm Enforcement and Gather Selectors

### Entry Criteria
- `workload_profile.dependencies` exists (an empty list is allowed).

### Actions
1. Identify the CNI: `kubectl --context "$CTX" get pods -n kube-system -o name | grep -E "calico|cilium|antrea|weave|kube-router|flannel|aws-node|azure"`.

| CNI found | NetworkPolicy enforced |
|---|---|
| Calico, Cilium, Antrea, Weave Net, kube-router | Yes |
| Flannel alone | No: policies are accepted by the API and do nothing |
| AWS VPC CNI (`aws-node`) | Only if its network policy agent is enabled; check the platform docs |
| Azure CNI | Only if network policy (Azure, Calico or Cilium) was enabled at cluster creation |
| Unknown | Treat as not proven; Phase 3 tests decide |

2. Find the DNS pods' labels: `kubectl get pods -n kube-system -l k8s-app=kube-dns --show-labels` (CoreDNS keeps the `k8s-app=kube-dns` label on most distributions). Record the namespace and labels.
3. Find the Ingress controller namespace and pod labels, when `ingress_manifest` is not `none`: `kubectl get pods -A -l app.kubernetes.io/component=controller --show-labels`.
4. For each dependency in `workload_profile.dependencies`: in-cluster hosts (`*.svc`, `*.svc.cluster.local`) give namespace and pod labels (`kubectl get pods -n <ns> --show-labels`); external hosts need an IP range (`ipBlock`) since core NetworkPolicy has no DNS-name rule. Record external hosts whose IPs change (cloud managed services) as open questions; CNI-specific policies (CiliumNetworkPolicy `toFQDNs`, Calico `domains`) can handle them, but they are not core API.
5. Namespaces are selected with the automatic label `kubernetes.io/metadata.name: <name>` (set on every namespace since Kubernetes 1.21).

### Output
CNI row, DNS selector, controller selector, dependency selectors.

### Quality Gate
- The CNI row is named with the pod name evidence. If enforcement is "No", **Stop**.

---

## Phase 2: Write the Policies

### Entry Criteria
- Enforcement confirmed or pending Phase 3 test.

### Actions
1. `networkpolicy-default-deny.yaml`, applies to every pod in the namespace:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-all, namespace: <namespace> }
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
```
2. `networkpolicy-allow-dns.yaml`, egress to DNS on UDP and TCP 53 (TCP is used for large responses; missing it causes intermittent failures):
```yaml
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { k8s-app: kube-dns } }
      ports:
        - { protocol: UDP, port: 53 }
        - { protocol: TCP, port: 53 }
```
3. `networkpolicy-<app>-ingress.yaml`, ingress to the app from the Ingress controller on the container port:
```yaml
spec:
  podSelector: { matchLabels: { app.kubernetes.io/name: <app> } }
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: <controller-namespace> } }
          podSelector: { matchLabels: { <controller labels> } }
      ports:
        - { protocol: TCP, port: <container_port> }
```
   Ports in NetworkPolicy refer to the POD port (`container_port`), not the Service port.
4. `networkpolicy-<app>-egress.yaml`, one `to` entry per dependency with its port.
5. AND versus OR, the most common mistake:

| YAML shape | Meaning |
|---|---|
| One list item containing both `namespaceSelector` and `podSelector` (no dash before `podSelector`) | Pods with those labels IN that namespace (AND) |
| Two list items, each starting with `-` | Any pod in that namespace, OR pods with those labels in the policy's own namespace |

   Check every `from`/`to` block against this table before applying.
6. Policies are additive: there is no deny rule beyond the default deny. Do not write `ingress: []` hoping to block one source; it blocks all.

### Output
Policy files.

### Quality Gate
- `kubectl apply --dry-run=server -f <each file>` prints `(server dry run)` for all files.
- Each `from`/`to` block is labeled AND or OR in the notes according to the table.

---

## Phase 3: Prove Each Rule

### Entry Criteria
- Policies applied in a test namespace that mirrors the target labels.

### Actions
1. If the namespace enforces Pod Security `restricted`, the plain `kubectl run` test pods below are rejected (`violates PodSecurity`). Add `--overrides='{"spec":{"securityContext":{"runAsNonRoot":true,"runAsUser":65534,"seccompProfile":{"type":"RuntimeDefault"}},"containers":[{"name":"<pod name>","image":"busybox","stdin":true,"tty":true,"args":[...],"securityContext":{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]}}}]}}'` or run the tests in a test namespace with only `warn` set.
2. Allowed path (from the Ingress controller): `curl` the app through the Ingress host; expect an HTTP status.
3. Denied path (random pod in the namespace to the app):
```bash
kubectl run np-test -n NS --rm -it --restart=Never --image=busybox -- wget -q -O- -T 3 http://<app>.<NS>.svc.cluster.local
```
   Expect `wget: download timed out`. A response means the default deny is not enforced.
4. DNS from the app's labels: `kubectl run np-dns -n NS --rm -it --restart=Never --labels=app.kubernetes.io/name=<app> --image=busybox -- nslookup kubernetes.default`. Expect an answer.
5. Each dependency: from a pod with the app's labels, `nc -zv -w 3 <host> <port>` (busybox `nc`) must connect; a non-listed host must time out.
6. Record each test command and its result in a table.

### Output
`network_policies`.

### Quality Gate
- The denied-path test prints a timeout, and the allowed-path test prints an HTTP status.
- DNS lookup from the app labels returns an address.

---

## Worked Example

Illustrative only. `orders` in `shop`, Calico CNI, controller `ingress-nginx` namespace, dependency `postgres.data.svc:5432`.

Phase 1: `pod/calico-node-x8k2d` found, enforcement yes. Postgres pods labeled `app.kubernetes.io/name=postgresql` in namespace `data`.

Phase 2 egress block (AND form):
```yaml
egress:
  - to:
      - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: data } }
        podSelector: { matchLabels: { app.kubernetes.io/name: postgresql } }
    ports: [ { protocol: TCP, port: 5432 } ]
```

Phase 3:
```
$ kubectl run np-test -n shop-test --rm -it --restart=Never --image=busybox -- wget -q -O- -T 3 http://orders.shop-test.svc.cluster.local
wget: download timed out
$ kubectl run np-db -n shop-test --rm -it --restart=Never --labels=app.kubernetes.io/name=orders --image=busybox -- nc -zv -w 3 postgres.data.svc 5432
postgres.data.svc (10.43.12.7:5432) open
```

---

## Exit Criteria

DONE when enforcement is proven, the namespace defaults to deny, DNS and each listed path work, and an unlisted path times out.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | CNI does not enforce policies | **Stop**: report; policies would give false assurance. |
| Phase 3 | Denied path still answers | **Stop**: enforcement absent or another policy allows it; list policies with `kubectl get netpol -n NS`. |
| Phase 3 | DNS fails after default deny | **Adjust**: DNS labels differ (NodeLocal DNSCache uses a node-local IP); allow that address with `ipBlock` per the platform docs. |
| Phase 3 | App cannot reach a dependency | **Adjust**: check the AND/OR shape and that the port is the pod port. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
