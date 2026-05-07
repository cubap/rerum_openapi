# rerum_openapi

Seam-first contract governance repository for RERUM and downstream consumers.

## Purpose

This repository stores API contract assets and policy without coupling changes into implementation repositories until teams are ready.

Current seam inventory: 11 active seam manifests.

Human-facing seam map:
- docs/human-guide/interaction-index.md

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

1. Choose a seam from docs/human-guide/interaction-index.md.
2. Update that seam's manifest and baseline OpenAPI artifact under seams/<seam-id>/.
3. Validate manifests with schemas/seam-manifest.schema.json by running npm run validate:manifests.
4. Follow docs/human-guide/implementation-playbook.md for rollout and governance steps.
