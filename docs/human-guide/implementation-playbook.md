# Implementation Playbook

## Why This Exists

Upstream API changes can break downstream applications silently. This repository creates explicit, testable seams so breaking changes are detected before merge or deployment.

## Audience

- API providers
- Middleware maintainers
- Consumer maintainers
- Release and operations maintainers

## Quick Start (First 60 Minutes)

1. Pick one seam (start with RERUM -> TinyThings).
2. Fill in seam metadata in seams/rerum-to-tinythings/manifest.yaml.
3. Confirm canonical OpenAPI source location and add it to manifest.
4. Define stable CI test endpoints (health/readiness/spec).
5. Agree on owners and deprecation notice policy.
6. Run schema validation for the manifest.

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
3. Scale to next seams using templates after pilot signoff.
