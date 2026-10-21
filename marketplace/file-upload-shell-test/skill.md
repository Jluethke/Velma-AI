# File Upload Shell Test

Test for web shell upload and execution by attempting to upload and access server-side scripts.

## Inputs

- `content-type-results`: Content-type bypass results
- `successful-bypasses`: Successful bypass techniques

## Outputs

- `shell-upload-results`: Web shell upload test results
- `execution-evidence`: Evidence of server-side execution of uploaded files

## Process

1. Upload a benign test script using each successful bypass technique
2. Attempt to access the uploaded file directly through the web server
3. Check whether the server executes the uploaded script or serves it statically

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
