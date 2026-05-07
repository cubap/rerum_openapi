# Troubleshooting

## OpenAPI lint failures

Symptoms:
- CI fails lint gate

Checks:
1. Validate required metadata fields in operations.
2. Validate response schemas and content types.
3. Validate error responses are documented consistently.

## Breaking-change check failures

Symptoms:
- CI reports backward incompatibility

Checks:
1. Determine whether response/request shape changed incompatibly.
2. If intentional, add migration notes and approval metadata.
3. Ensure deprecation window is respected before removal.

## Pact verification mismatch

Symptoms:
- Consumer expectation fails against provider implementation

Checks:
1. Confirm provider version and environment tags are correct.
2. Confirm consumer expectation targets the same seam and channel.
3. Reproduce with deterministic fixtures.

## Non-deterministic test behavior

Symptoms:
- Contract checks pass/fail intermittently

Checks:
1. Confirm fixture strategy is deterministic.
2. Confirm readiness endpoint guarantees data/setup complete.
3. Remove clock-sensitive assumptions from tests where possible.

## Broker auth/connectivity failures

Symptoms:
- Publish or verification query fails

Checks:
1. Confirm broker URL and credentials.
2. Confirm network access from CI runner.
3. Confirm token/credential scope includes required operations.
