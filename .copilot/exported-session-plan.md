# Exported Session Plan

Source: /memories/session/plan.md

## Plan: Pilot Seam + Human Implementation Guide

Prioritize one high-value pilot seam first: RERUM (rerum_server_nodejs) -> TinyThings (TinyNode). Build governance and automation around this seam, then templatize the pattern for other seams. In parallel, produce a human-centered implementation guide that explains why contracts matter, where to place files, how to run checks, and how teams adopt the workflow safely.

## Steps

1. Phase 1: Pilot seam definition (RERUM -> TinyThings)
- Establish seam identifier, owners, environments, and release channels.
- Define contract scope for pilot: auth assumptions, required endpoints, common error responses, pagination/filter semantics, and response invariants.
- Define testability contract: stable CI endpoints, fixture/seed requirements, and deterministic data lifecycle.

2. Phase 2: Pilot artifacts and policy
- Create pilot seam metadata and canonical OpenAPI source/reference.
- Create pilot behavioral contract path for Pact publication and verification results.
- Define compatibility policy for pilot: additive changes allowed, breaking changes gated, deprecation timeline required.
- Define promotion gates from dev -> stage -> prod for this seam.

3. Phase 3: CI gate choreography for pilot
- Provider side (RERUM): lint OpenAPI, run breaking-change checks, verify published TinyThings expectations.
- Middleware side (TinyThings): validate upstream compatibility and publish downstream compatibility status where applicable.
- Release side: deployment readiness query blocks promotion when pilot seam is unresolved or failed.
- Add nightly cross-repo drift check to detect breakage outside direct PR scope.

4. Phase 4: Human implementation guide (deliverable)
- Write an implementation guide aimed at developers and maintainers.
- Include quick-start path and advanced path.
- Include command map for provider and middleware teams.
- Include troubleshooting matrix for spec lint errors, pact mismatch, missing tags, fixture nondeterminism, and broker auth failures.
- Include change-management guidance for add, deprecate, remove, emergency override.

5. Phase 5: Template extraction and scale-out
- Extract pilot seam files into reusable templates.
- Apply template to next seams after pilot stability.
- Keep seam adoption checklist and readiness score to prioritize rollout.

## Pilot Repository Skeleton Additions

- /seams/rerum-to-tinythings/manifest.yaml
- /seams/rerum-to-tinythings/openapi/
- /seams/rerum-to-tinythings/pact/generated/
- /seams/rerum-to-tinythings/compatibility/
- /seams/rerum-to-tinythings/changelog/
- /docs/human-guide/implementation-playbook.md
- /docs/human-guide/troubleshooting.md
- /docs/human-guide/change-recipes.md
- /tooling/templates/seam-pilot-template/

## Verification

1. Pilot seam metadata validates against schema.
2. Provider and middleware CI execute pilot checks successfully on baseline.
3. Intentional breaking change is blocked before merge.
4. Human guide enables a new maintainer to run checks end-to-end.
5. Nightly drift job detects intentionally injected incompatibility.

## Decisions

- First implementation target: RERUM -> TinyThings.
- Documentation is first-class deliverable.
- Pilot-first strategy before scaling.
