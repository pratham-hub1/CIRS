# CIRS Backend — Agent Rules & Engineering Guidelines

## 1. Source of Truth
- The documentation corpus in `/docs` is the sole source of truth:
  - `README.md`
  - `00-overview.md` (Anchor document)
  - `01-requirements.md`
  - `02-tech-stack.md`
  - `03-architecture-and-data-model.md`
  - `04-api-and-auth.md`
  - `05-workflows.md`
  - `06-correctness.md`
  - `07-build-plan.md`
- **`00-overview.md` is the anchor.** If any document conflicts with it, `00-overview.md` wins.
- The documents in `/docs` are **LOCKED**. Do not modify them.
- Follow the locked documents exactly. Do not add features or behaviour they do not specify.

## 2. Phase-Wise Build Strategy
- Follow `07-build-plan.md` §2 (Phase 0 → Phase 8) strictly.
- **Never build in one go.** Work on exactly one phase at a time.
- After each phase:
  1. Verify and test the phase thoroughly (unit, integration, concurrency, property-based, CI structural checks).
  2. Confirm exit criteria and contract IDs hold (`INV-DM-1..10`, `WF-1..5`, `INT-1..12`).
  3. Ensure the Definition of Done in `07-build-plan.md` §5 holds.
  4. Log progress in `IMPLEMENTATION-LOG.md` (status, what was built, contracts satisfied, tests + results, blockers, next phase).
  5. Only then start the next phase.

## 3. Strict Fail-Fast Policy
- Fail-fast strictly on unexpected states or validation failures.
- **Never** write silent fallbacks, dummy returns, or broad error-masking try-catch blocks.
- Propagate exceptions or map them to centralized domain/HTTP error structures.

## 4. Never Assume — Stop and Ask
- If anything is confusing, contradicting, or undecided, **STOP and ask the user**. Do not guess or make silent assumptions.
- Open items to explicitly confirm with the user before or during the relevant phase:
  - Deployment target / environment (`02` §6, `07` §8)
  - Retention window value for personal data (`01` §4, `03` §4, `07` §8)
  - Rate-limit thresholds (`04` §8, `07` §8)
  - Category → verification level mapping (`03` §4, `07` §8)
  - Token transport (response body vs HttpOnly cookie) (`04` §8, `07` §8)

## 5. Security & Secrets
- Never hard-code secrets, API keys, credentials, or tokens in code or commits.
- Pass all configuration and secrets strictly via environment variables.

## 6. Logs & Persistent Files
- `AGENTS.md` is the persistent rules file across sessions.
- `IMPLEMENTATION-LOG.md` is the progress log updated after every phase.
- Maintain both files.
