<!--
  PR Template: sanitize-production (non-invasive changes only)
  This repository contains sensitive admin features. PRs from `sanitize-production` must NOT change service logic.
-->

# Title: Sanitize — docs/CI/smoke-tests (non-invasive)

## Summary

This PR contains non-invasive changes to help review and safely deploy the project. It includes:

- CI workflow for smoke tests (`.github/workflows/smoke-test.yml`)
- Documentation updates and guidance (`backend/README.md`)
- `backend/.env.safety.example` (reference for optional flags)

## Non-Invasive Guarantee

No runtime code for sensitive services (remote-control, Gmail access, credential capture, screen-streaming) is modified in this PR. Seed scripts are not changed. Any change that would alter runtime behavior must be approved explicitly.

## Validation

- CI should run smoke tests on PR and report results.
- Developers should manually review documentation and confirm no service logic changes.

## Notes for reviewers

- If you want hardening (guards, seed gating) request it as a follow-up PR and specify which modules to modify.
