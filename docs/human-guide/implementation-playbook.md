# Implementation Playbook

## Why This Exists

Upstream API changes can break downstream applications silently. This repository creates explicit, testable seams so breaking changes are detected before merge or deployment.

## Audience

- API providers
- Middleware maintainers
- Consumer maintainers
- Release and operations maintainers

## Quick Start (First 60 Minutes)

1. Pick one seam from docs/human-guide/interaction-index.md.
2. Update seam metadata in seams/<seam-id>/manifest.yaml.
3. Confirm canonical OpenAPI source location and update seams/<seam-id>/openapi/baseline.openapi.yaml.
4. Define stable CI test endpoints (health/readiness/spec).
5. Agree on owners and deprecation notice policy.
6. Decide gate enforcement mode by environment (dev advisory, stage/prod blocking).
7. Run schema validation for all manifests using npm run validate:manifests.

## Current Reality Snapshot

- The repository currently tracks 11 active seam manifests.
- Shared TinyNode component schemas are centralized in schemas/openapi/tinynode-shared-components.openapi.yaml.
- Multiple seams now reference shared OpenAPI components instead of duplicating schema blocks.

## Daily Workflow

1. Additive API change:
- update OpenAPI
- update seam changelog
- run lint and compatibility checks

2. Potentially breaking API change:
- run breaking-change checks
- add migration notes and deprecation details
- require release approver signoff

3. Consumer expectation update:
- publish new Pact expectation metadata
- verify provider compatibility before promotion

## CI Gate Intent

- OpenAPI lint: style and consistency baseline
- OpenAPI breaking change: blocks accidental breaks
- Pact verification: confirms runtime expectations still hold
- Deploy readiness query: blocks unresolved seam risk

## Rollout Strategy

1. Advisory mode in dev first.
2. Blocking mode in stage/prod after pilot stability.
3. Scale to additional seams using templates after pilot signoff.
