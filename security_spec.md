# security_spec.md
## 1. Data Invariants
* A Writer profile must always outline high-fidelity instruction and custom prompt definitions.
* An RSS Feed cannot omit target formatting and niche constraints.
* Sourced drafts require authentic, matched human writers.
* Immutable fields (like `createdAt` on drafts) must remain unalterable after the original state transition.

## 2. The "Dirty Dozen" Payloads
* Payload-1: Write to `/writers/hack` under unauthenticated identity (Identity Spoof).
* Payload-2: Inject a 10MB instruction string to exhaust billing database units (Resource Poison).
* Payload-3: Update `createdAt` timestamp of a pub article to spoof timestamps (Temporal Poisoning).
* Payload-4: Overwrite settings and wordpress credentials of another segment tenant (PII/Secret Bypass).
* Payload-5: Save an invalid feed target containing cross-script snippets (Resource Invalidation).
* Payload-6: Delete core writers as an unauthenticated or unverified identity (Privileged Shortcutting).
* Payload-7: Insert an article draft mapping to a non-existent or malicious author profile (Orphaned Write).
* Payload-8: Append non-schema keys or shadow variables `isVip` or `isAdmin` inside settings document (Privilege Escalation).
* Payload-9: Direct update of `wordpressPush` properties bypassing strict update schema boundaries (Admin Spoof).
* Payload-10: Batch fetch private tenant parameters as unsigned reader (PII Drift).
* Payload-11: Modify strict immutable writer fields like `id` after creation (ID Mutation).
* Payload-12: Push malformed draft schemas with missing markdown content pointers (Payload Poison).

## 3. Test Runner Definition
Verification implemented successfully in local rules tests.
