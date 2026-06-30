# CI/CD Pipeline Specification

Our Continuous Integration and Delivery pipelines ensure type safety, clean code patterns, and safe automated promotions.

---

## 1. Automation Lifecycle

```
[ Push to Main ] ──► [ GitHub Actions CI ] ──► [ Build Immutable Image ]
                                                        │
   ┌────────────────────────────────────────────────────┘
   ▼
[ Deploy Staging ] ──► [ Smoke Checks ] ──► [ Approval Gate ] ──► [ Promote Prod ]
```

## 2. Pipeline Gates

1.  **Dependency Locking**: `npm ci` verifies lockfile integrity and rejects mismatched peer dependency patterns.
2.  **Type Verification**: `npx tsc --noEmit` validates type constraints.
3.  **Syntactic Linting**: `npm run lint` enforces architectural standards.
4.  **Installer Audits**: `ShellCheck` scans `install-editorial-platform.sh` to prevent shell injection vectors.
5.  **Test Suite Execution**: Full suite execution (`vitest run`) covers 212 tests.
6.  **Immutable Artifacts**: Containers are built on clean nodes, tagged with Git Commit SHAs, and pushed to GHCR. Staging and production use the same built digest, ensuring absolute immutability.
