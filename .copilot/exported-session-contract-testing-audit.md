# Exported Session Memory: TPEN Contract Testing Audit

Source: /memories/session/tpen-contract-testing-audit.md

# TPEN-interfaces Contract Testing & API Governance Audit

## Key Findings

### 1. CURRENT STATE

**Pact Consumer Setup (Exists)**
- Framework: @pact-foundation/pact v12.3.0, @pact-foundation/pact-node v10.16.0
- Consumer: tpen-interfaces
- Provider: tpen-services
- Pact file: pacts/tpen-interfaces-tpen-services.json (single file in repo)

**Contract Tests (Exists)**
- Files:
  - api/__tests__/contracts/project.pact.js — Project endpoints (6+ interactions)
  - api/__tests__/contracts/user.pact.js — User endpoints (4+ interactions)
- Test harness: Node.js native node:test + Pact V3 mock server
- Interactions tested:
  - Project: GET /project/:id, PUT setRoles, POST remove-member, POST invite-member, POST addRoles
  - User: GET /my/profile, GET /my/projects, PUT /my/profile/update

**CI/CD Integration (Partial)**
- Scripts in package.json:
  - npm run test:pact — Run pact tests only
  - npm run pact:publish — Publish pacts to broker
- Workflow: prod-deploy.yml
  - Runs npm test (includes pact tests)
  - Publishes pacts: npm run pact:publish
  - Uses env vars: PACT_BROKER_BASE_URL, PACT_BROKER_TOKEN (secrets)
- Publish target: PactFlow (hosted broker)

**Documentation (Exists)**
- test/README.md: Comprehensive overview
  - Explains PactFlow setup
  - Mentions provider verification happens on PactFlow dashboard
  - References https://docs.pact.io/pact_nirvana/step_5_publish_contracts

**Versioning**
- Release Please config: alpha prerelease (x.y.z-alpha.N)
- Current version: 0.1.1-alpha.0
- Conventional commits: fix, feat, feat!

### 2. GAPS FOR SELF-HOSTED BROKER

**Missing Components:**
1. No broker configuration — No Docker Compose, K8s manifests, or Terraform for self-hosted Pact broker
2. No environment variable for broker URL override — package.json hardcodes broker env usage but no strategy file
3. No provider verification step — No CI job that verifies pacts against provider (TPEN-Services must do this on their side)
4. No pact verification workflow — if switching to self-hosted, provider-side verification workflow is required
5. No can-i-deploy checks — No semver coordination checks between consumer/provider releases
6. No webhook triggers — No automation for downstream provider verification on pact publish
7. No retry/fallback logic — If broker is down, publish fails silently (no alert)
8. No pact pruning — Old pacts accumulate; no retention policy
9. No OpenAPI sync — No mechanism to generate/validate OpenAPI from pacts or vice versa

### 3. CONSTRAINTS & OPPORTUNITIES

**Constraints:**
1. PactFlow dependency — setup coupled to SaaS broker assumptions
2. Single pact file — all contracts in one file
3. Limited interaction coverage — only 10 interactions (User + Project)
4. No contract lifecycle tagging for coordinated release gates
5. JWT mocking strategy may diverge from real-world token characteristics
6. Manual provider verification path

**Opportunities:**
1. Split pacts by domain/endpoint concern for manageability
2. Expand interaction coverage with minimal architecture changes
3. Add pact tagging for alpha/stable channel policy
4. Add OpenAPI generation/sync opportunities
5. Add self-hosted broker deployment
6. Add can-i-deploy integration to release flow
7. Add artifact archiving for audit trail

### 4. FILES LIKELY TO CHANGE (in TPEN-interfaces when integration starts)

**High Priority:**
1. .github/workflows/prod-deploy.yml
2. package.json
3. api/__tests__/contracts/*.pact.js

**Medium Priority:**
4. .github/workflows/release-please.yml
5. release-please-config.json
6. api/config.js
7. test/README.md

**Low Priority:**
8. api/TPEN.js, api/Project.js, api/User.js
9. test/helpers/*.js

## Summary

Current state is consumer-side pact testing with hosted broker assumptions and no provider verification workflow in this repo. Migration to self-hosted requires broker deployment plus provider-side verification integration.
