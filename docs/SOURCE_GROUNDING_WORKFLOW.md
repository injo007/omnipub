# Source-Grounded Editorial Workflow

## Purpose

The source-grounding stage protects OmniPub from publishing polished but unsupported filler. It runs after natural-style editing and before the final editorial-quality and publishing gates.

## Current execution path

```text
Research output
→ canonical source reconciliation
→ complete-source normalization
→ evidence ledger
→ draft
→ natural-style edit
→ source grounding
→ quality/repair loop
→ approved or manual review
→ WordPress draft, queue, or publication
```

Reconciled sources must have a valid HTTPS URL, title, and publisher before deconstruction. Incomplete and duplicate canonical records are excluded and recorded in the workflow log; OmniPub never creates substitute URLs, titles, or publishers at this stage.

## Grounding contract

The Source-Grounding Editor returns strict JSON containing:

- `groundedArticleMarkdown` — a complete replacement article;
- `claimIdsUsed` — one or more IDs from the existing evidence ledger;
- optional removal and quality notes.

Malformed JSON, a short article, unknown claim IDs, failed ledger validation, or unresolved generic passages fail closed. The workflow records `NEEDS_MANUAL_REVIEW`; it does not publish the previous generic draft.

The stage uses the configured Quality & Safety model route and its fallback policy. This preserves workspace provider selection and shared token, cost, latency, retry, and provider metadata tracking. It does not make a hidden provider call.

## Generic-passage checks

`findUngroundedGenericPassages` is a deterministic final gate, not a banned-phrase list. It flags stock labels only when their surrounding text does not map to at least two concrete terms from an evidence-ledger claim. For example, “personalized service” can remain when the adjacent passage explains the evidenced host, transfer, reservation, or activity details.

## Workflow states

Successful runs record:

```text
NATURAL_EDITED → SOURCE_GROUNDING → SOURCE_GROUNDED → APPROVED_FOR_PUBLISHING
```

Failures record a concise diagnostic and end in `NEEDS_MANUAL_REVIEW`. The quality loop has a maximum of two repair attempts; unresolved issues cannot loop forever.

## Publication eligibility

Queueing and direct WordPress push require the exact stored revision that ended in `APPROVED_FOR_PUBLISHING`, passing factual, safety, fabrication, and freshness checks with a non-empty evidence ledger. The approved content hash is checked again after metadata optimization. Legacy drafts without an approved-revision record are held until they are revalidated; OmniPub does not convert them into artificial “approved” packages.

## Operator checks

Before release, run:

```bash
npm run lint
npm test
npm run build
```

For a non-production article, confirm the workflow log includes Source-Grounding Editor, its configured provider/model metadata, and an approval or manual-review terminal state.
