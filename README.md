# rerum_openapi

Seam-first contract governance repository for RERUM and downstream consumers.

## Purpose

This repository stores API contract assets and policy without coupling changes into implementation repositories until teams are ready.

Primary pilot seam:
- RERUM (rerum_server_nodejs) -> TinyThings (TinyNode)

Contract model:
- OpenAPI is canonical for interface design and change policy.
- Pact metadata is tracked for runtime compatibility status.

## Repository Layout

- seams/: seam definitions and artifacts
- schemas/: manifest and metadata schemas for automation
- policy/: lint, breaking-change, lifecycle governance
- docs/: human implementation guides
- tooling/: scripts and templates

## Adoption Rule

No implementation repository changes are required to start. This repo is intentionally standalone until connection work is approved.

## First Steps

1. Fill in the pilot seam manifest in seams/rerum-to-tinythings/manifest.yaml.
2. Add canonical OpenAPI source or external source reference in seams/rerum-to-tinythings/openapi/.
3. Validate manifests with the schema in schemas/seam-manifest.schema.json.
4. Follow docs/human-guide/implementation-playbook.md for rollout steps.
