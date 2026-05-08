# Testing Harness Integration

Use the reusable GitHub Actions workflow in this repository to validate a deployed target against a pinned seam manifest and baseline OpenAPI artifact.

## Recommended Pattern

1. Keep contract YAML and validation logic in this repository.
2. In each downstream harness or application repository, call the reusable workflow from this repository by ref.
3. Pass the seam manifest path and the deployed base URL for the system under test.

This keeps contract authority centralized while keeping execution local to each consumer's CI run.

## Reusable Workflow

Workflow path:

- .github/workflows/seam-runtime-validation.yml
- Fixture template: tooling/templates/contract-fixture-template.yaml

Inputs:

- contract_repo_ref: git ref to pin the contract repository version
- seam_manifest_path: seam manifest path inside this repository
- target_base_url: deployed system base URL to probe
- compare_paths: whether to require the remote OpenAPI spec to contain all baseline paths
- compare_operations: whether to require the remote OpenAPI spec to contain all baseline methods and response codes
- fixture_file: optional path in the caller repository to a recorded interaction fixture file
- timeout_ms: per-request timeout in milliseconds

## Example Consumer Workflow

```yaml
name: Validate TinyNode Contract

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  contract-smoke:
    uses: cubap/rerum_openapi/.github/workflows/seam-runtime-validation.yml@main
    with:
      contract_repo_ref: main
      seam_manifest_path: seams/tinythings-to-deer/manifest.yaml
      target_base_url: https://tiny.rerum.io
      compare_paths: true
      compare_operations: true
      timeout_ms: 10000
```

## Example Fixture-Aware Consumer Workflow

```yaml
name: Validate TinyNode Fixtures

on:
  pull_request:

jobs:
  contract-fixtures:
    uses: cubap/rerum_openapi/.github/workflows/seam-runtime-validation.yml@main
    with:
      contract_repo_ref: main
      seam_manifest_path: seams/tinythings-to-deer/manifest.yaml
      target_base_url: https://tiny.rerum.io
      compare_paths: true
      compare_operations: true
      fixture_file: test/contract-fixtures/tinynode-smoke.yaml
      timeout_ms: 10000
```

## Fixture File Format

The validator accepts either a top-level array or an object with an `interactions` array.

```yaml
interactions:
  - path: /app/create
    method: post
    expectedStatus: '200'
    request:
      '@type': ExampleThing
      label: Example object
    response:
      status: '200'
      body:
        '@id': https://example.org/object/123
        label: Example object
  - path: /app/query
    method: get
    expectedStatus: '200'
    response:
      status: '200'
      body:
        results:
          - '@id': https://example.org/object/123
            label: Example object
        total: 1
```

## What It Validates

1. The seam manifest can be loaded.
2. The target health endpoint returns success.
3. The target readiness endpoint returns success.
4. The target spec endpoint returns success.
5. The target OpenAPI document contains every path declared in the local baseline artifact when compare_paths is enabled.
6. The target OpenAPI document contains every baseline method and documented response code when compare_operations is enabled.
7. Recorded fixture interactions map to documented baseline paths, methods, request/response body schemas, and response statuses when fixture_file is provided.

## Current Limitations

1. This is still a smoke validator, not a full semantic contract replay system.
2. Operation comparison checks methods and response status coverage, not remote schema equality.
3. Fixture schema validation currently targets JSON-like payloads defined in the local baseline.
4. If a seam uses an external OpenAPI source not stored in this repository, baseline-based comparisons are skipped.
