# OpenAPI Baseline

This folder stores the seam-level canonical contract artifacts for `tinythings-to-deer`.

- `baseline.openapi.yaml` is the initial baseline used for lint, diff, and compatibility checks.
- `manifest.yaml` points to this file via `openapi_source.location`.
- Shared reusable TinyNode schemas live in `schemas/openapi/tinynode-shared-components.openapi.yaml`.

When upstream implementation specs evolve, update this baseline through an explicit seam change process and record the rationale in the seam changelog.
