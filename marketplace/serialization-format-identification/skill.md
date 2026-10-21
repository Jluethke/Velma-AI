# Serialization Format Identification

Identify serialization formats in use across the application (Java, .NET, PHP, Python pickle).

## Inputs

- `target-application`: Base URL and endpoints of the authorized target
- `engagement-scope`: Written authorization and scope document

## Outputs

- `serialization-inventory`: Serialization formats detected and where they are used
- `deserialization-endpoints`: Endpoints that accept serialized data as input

## Process

1. Analyze request and response content types for serialization signatures
2. Check for Java ObjectInputStream markers (aced 0005), .NET BinaryFormatter, PHP serialize()
3. Identify XML-based serialization (SOAP, XStream, XMLDecoder)
4. Map each deserialization endpoint with its format and trust boundary

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
