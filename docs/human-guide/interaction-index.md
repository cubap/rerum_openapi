# Interaction Index

This index is the current, human-facing map of confirmed seam interactions represented in this repository.

Last updated: 2026-05-07

## Confirmed Seams

| Seam ID | Consumer | Provider | Middleware | OpenAPI Baseline | Confidence | Evidence Source |
|---|---|---|---|---|---|---|
| deer-to-rerum | DEER | rerum_server_nodejs | none | seams/deer-to-rerum/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| gallery-of-glosses-to-rerum | Gallery-of-Glosses | rerum_server_nodejs | none | seams/gallery-of-glosses-to-rerum/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| rerum-to-tinythings | DEER | rerum_server_nodejs | TinyNode | seams/rerum-to-tinythings/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| tinynode-to-rerum | TinyNode | rerum_server_nodejs | none | seams/tinynode-to-rerum/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| tinypen-to-rerum | TinyPen | rerum_server_nodejs | none | seams/tinypen-to-rerum/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| tinythings-to-deer | DEER | TinyNode | none | seams/tinythings-to-deer/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| tpen-interfaces-to-rerum | TPEN-interfaces | rerum_server_nodejs | none | seams/tpen-interfaces-to-rerum/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| tpen-interfaces-to-tpen-services | TPEN-interfaces | TPEN-services | none | seams/tpen-interfaces-to-tpen-services/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| tpen-services-to-rerum | TPEN-services | rerum_server_nodejs | none | seams/tpen-services-to-rerum/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |
| tpen-services-to-tinynode | TPEN-services | TinyNode | none | seams/tpen-services-to-tinynode/openapi/baseline.openapi.yaml | medium | confirmed interactions, possible route alias overlap with TinyPen |
| tpen-services-to-tinypen | TPEN-services | TinyPen | none | seams/tpen-services-to-tinypen/openapi/baseline.openapi.yaml | high | repo scan + manifest + baseline OpenAPI |

## Follow-up Drift Tracking

- TinyNode route-contract standardization: https://github.com/CenterForDigitalHumanities/TinyNode/issues/119
- TPEN-services TinyNode adapter hardening: https://github.com/CenterForDigitalHumanities/TPEN-services/issues/517
- TinyPen timeout and CORS defaults: https://github.com/CenterForDigitalHumanities/TinyPen/issues/43
- TPEN-services TinyPen adapter guardrails: https://github.com/CenterForDigitalHumanities/TPEN-services/issues/518

## Maintenance Rule

- Any new seam addition, rename, or removal must update this index in the same pull request.
- If evidence is uncertain, mark confidence as medium and open a copilot-labeled follow-up issue in the source repository.
