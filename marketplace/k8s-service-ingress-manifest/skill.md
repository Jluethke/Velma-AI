# Kubernetes Service and Ingress Manifests

**One-line description:** Writes the ClusterIP Service that selects the Deployment's pods by named port and, when the application is reached from outside the cluster, an `networking.k8s.io/v1` Ingress with an explicit `ingressClassName`, `pathType` and TLS secret, then proves traffic reaches a pod through EndpointSlices.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_profile` (object, required): Output of `k8s-workload-inventory`.
- `deployment_manifest` (string, required): Path from `k8s-deployment-manifest`.
- `ingress_host` (string, optional): Public hostname, for example `orders.example.com`. Empty means no Ingress.
- `ingress_class` (string, optional): Name of an IngressClass in the cluster. Required when `ingress_host` is set.
- `tls_issuer` (string, optional): cert-manager ClusterIssuer name. Empty means the TLS Secret is provided by another process.

---

## Outputs

- `service_manifest` (string): Path to `<root>/service.yaml`.
- `ingress_manifest` (string): Path to `<root>/ingress.yaml`, or the literal `none` when `ingress_host` is empty.

---

## Phase 1: Write the Service

### Entry Criteria
- `deployment_manifest` exists and its dry run passed.

### Actions
1. Read the pod template labels and port name: `yq '.spec.template.metadata.labels, .spec.template.spec.containers[0].ports' deployment.yaml`.
2. Write `<root>/service.yaml` next to `deployment.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: <app_name>
  namespace: <namespace>
  labels: { app.kubernetes.io/name: <app_name>, app.kubernetes.io/instance: <app_name> }
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: <app_name>
    app.kubernetes.io/instance: <app_name>
  ports:
    - name: <port_name>
      port: 80
      targetPort: <port_name>
      protocol: TCP
```
3. `targetPort` uses the port NAME, not the number, so a container port change does not silently break the Service.
4. Selector rule: copy the Deployment's `spec.selector.matchLabels` exactly. Do NOT include `app.kubernetes.io/version`; a version label in the Service selector drops every pod of the other version during a rollout.
5. Type decision:

| Need | `type` |
|---|---|
| Reached only inside the cluster or through an Ingress controller | `ClusterIP` |
| Cloud load balancer per Service is required and no Ingress controller exists | `LoadBalancer` (record the cost question in notes) |
| Bare metal test cluster, no load balancer | `NodePort` (never for production traffic) |

6. For gRPC set the port name to `grpc` and add `appProtocol: grpc` (or `kubernetes.io/h2c` for cleartext HTTP/2) so controllers that read `appProtocol` route HTTP/2 correctly.

### Output
`service_manifest`.

### Quality Gate
- `yq '.spec.selector' service.yaml` equals `yq '.spec.selector.matchLabels' deployment.yaml` (compare with `diff <(yq ...) <(yq ...)`, empty diff).
- `kubectl apply --dry-run=server -f service.yaml` prints `(server dry run)`.

---

## Phase 2: Write the Ingress

### Entry Criteria
- `ingress_host` is non-empty. If empty, set `ingress_manifest` to `none` and skip to Phase 3.

### Actions
1. List IngressClasses: `kubectl get ingressclass`. `ingress_class` must appear in the NAME column. If the input is empty and exactly one class has the annotation `ingressclass.kubernetes.io/is-default-class: "true"`, use it and record that. Otherwise **Stop** and ask.
2. Check the controller's maintenance status before adding controller annotations. Kubernetes SIG Network announced the retirement of the community `ingress-nginx` controller; if the class uses `k8s.io/ingress-nginx`, record it as an open question and confirm the platform team's replacement plan (another controller or Gateway API `HTTPRoute`).
3. Write `<root>/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: <app_name>
  namespace: <namespace>
  annotations:
    cert-manager.io/cluster-issuer: <tls_issuer>   # only when tls_issuer is set
spec:
  ingressClassName: <ingress_class>
  tls:
    - hosts: [<ingress_host>]
      secretName: <app_name>-tls
  rules:
    - host: <ingress_host>
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: <app_name>
                port:
                  name: <port_name>
```
4. Use `spec.ingressClassName`. Do NOT use the deprecated `kubernetes.io/ingress.class` annotation.
5. `pathType` decision: `Prefix` matches by path element (`/api` matches `/api/x`, not `/apix`); `Exact` matches one path; `ImplementationSpecific` depends on the controller and must not be used unless the controller docs require it.
6. Do not copy controller-specific annotations (for example `nginx.ingress.kubernetes.io/rewrite-target`) from the internet unless the class controller matches and the app needs path rewriting. Each annotation must have a reason in notes.

### Output
`ingress_manifest`.

### Quality Gate
- `kubectl get ingressclass <ingress_class>` exits 0.
- `kubectl apply --dry-run=server -f ingress.yaml` prints `(server dry run)`.
- `grep -c 'kubernetes.io/ingress.class' ingress.yaml` prints `0`.

---

## Phase 3: Prove the Wiring After Apply

### Entry Criteria
- The Deployment is running in a test namespace (apply with `kubectl apply -f deployment.yaml -f service.yaml` in a non-production namespace), or this phase is deferred to `k8s-rollout-status-watch` with that fact recorded.

### Actions
1. List endpoints: `kubectl get endpointslices -n "$NS" -l kubernetes.io/service-name=<app_name> -o wide`. The ENDPOINTS column must list pod IPs. `<unset>` or empty means the selector matches no Ready pod.
2. Call the Service from inside the cluster: `kubectl run curl-test -n "$NS" --rm -it --restart=Never --image=curlimages/curl -- curl -sS -o /dev/null -w '%{http_code}\n' http://<app_name>.<namespace>.svc.cluster.local/`.
3. When an Ingress exists: `kubectl get ingress <app_name> -n "$NS"`; the ADDRESS column must be filled. Then `curl -sS -o /dev/null -w '%{http_code}\n' https://<ingress_host>/` from outside.
4. If the certificate is from cert-manager: `kubectl get certificate -n "$NS"` must show `READY True`. If `False`, run `kubectl describe certificate <app_name>-tls -n "$NS"` and read the Events.

### Output
Recorded HTTP status codes from inside and outside.

### Quality Gate
- EndpointSlice ENDPOINTS column lists at least one IP.
- The in-cluster curl prints an HTTP status code (any code proves routing; a connection error does not).

---

## Worked Example

Illustrative only. `orders`, port name `http`, host `orders.example.com`, class `nginx`, issuer `letsencrypt-prod`.

Phase 1: Service with `targetPort: http`; selector diff empty; dry run `service/orders created (server dry run)`.

Phase 2:
```
$ kubectl get ingressclass
NAME    CONTROLLER             PARAMETERS   AGE
nginx   k8s.io/ingress-nginx   <none>       310d
```
Controller is ingress-nginx; open question recorded about the platform migration plan. Ingress dry run passes.

Phase 3:
```
$ kubectl get endpointslices -n shop -l kubernetes.io/service-name=orders -o wide
NAME           ADDRESSTYPE   PORTS   ENDPOINTS               AGE
orders-7kq2p   IPv4          8000    10.42.1.17,10.42.2.9    3m
$ kubectl run curl-test -n shop --rm -it --restart=Never --image=curlimages/curl -- curl -sS -o /dev/null -w '%{http_code}\n' http://orders.shop.svc.cluster.local/
404
```
404 from the app proves routing works (the root path has no handler).

---

## Exit Criteria

DONE when the Service selector equals the Deployment selector, the Ingress (if any) uses `ingressClassName`, both dry runs pass, and EndpointSlices list pod IPs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | EndpointSlice empty | **Adjust**: compare `kubectl get pods -n NS --show-labels` with the Service selector; fix the selector, not the pod labels. |
| Phase 2 | `ingress_class` not in cluster | **Stop**: ask for a valid class; an Ingress with an unknown class is ignored by every controller. |
| Phase 2 | Ingress ADDRESS stays empty | **Adjust**: check the controller pods and logs in its namespace; confirm the class name matches. |
| Phase 3 | Certificate READY False with `Issuing` stuck | **Adjust**: `kubectl describe challenge -n NS`; HTTP-01 needs the host's DNS to point at the controller. |
| Phase 3 | curl returns 503 from the controller | **Return**: pods are not Ready; continue with `k8s-probe-tuning` and `k8s-pod-debug-triage`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
