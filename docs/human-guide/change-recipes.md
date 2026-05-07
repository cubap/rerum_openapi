# Change Recipes

## Add Endpoint (Safe Additive Change)

1. Add endpoint to canonical OpenAPI.
2. Add response and error schemas.
3. Update seam changelog with feature note.
4. Run lint and compatibility checks.

## Deprecate Endpoint

1. Mark endpoint deprecated in OpenAPI.
2. Add migration target in changelog.
3. Set removal date aligned with policy notice window.
4. Communicate to downstream owners.

## Remove Endpoint (Breaking Change)

1. Verify deprecation notice window elapsed.
2. Run breaking-change check and confirm expected fail.
3. Add explicit approved override metadata.
4. Merge only with release approver signoff.

## Emergency Override

1. Record incident ID and reason.
2. Record impacted seams and consumers.
3. Apply time-bound override only.
4. Create follow-up remediation issue before release close.
