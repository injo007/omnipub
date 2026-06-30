# Self-Hosted System Architecture Specification

This document defines the production and staging architecture for deploying the **Autonomous Editorial Intelligence Platform** on a dedicated Linux server.

---

## 1. Topological Diagram

```
                              [ Public Internet ]
                                       │
                                       │ Ports 80, 443
                                       ▼
                       ┌──────────────────────────────┐
                       │     Caddy HTTPS Proxy        │ (SSL Terminated via Let's Encrypt)
                       └──────────────┬───────────────┘
                                      │
                         Private Docker Network Bridge
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │  Staging Instance    │              │ Production Instance  │
        │     (Port 3000)      │              │     (Port 3000)      │
        └──────────────────────┘              └──────────────────────┘
                   │                                     │
                   ▼                                     ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │ Firestore Staging DB │              │Firestore ProductionDB│
        │ (External Managed)   │              │ (External Managed)   │
        └──────────────────────┘              └──────────────────────┘
```

## 2. Infrastructure Components

*   **Reverse Proxy**: Caddy server provides automated HTTPS out-of-the-box, HTTP/2 multiplexing, automatic SSL renewals, and gzip/zstd compression.
*   **Application Services**: Standardized Docker container execution for staging and production node. The Express service includes the background publishing queue workers and scheduler timers running on Node.js 20-alpine.
*   **Database Connectivity**: Cloud Firestore provides persistent, transactional ledger tracking for articles, queue jobs, user sessions, and governance audits.
*   **Host Isolation**: Staging and production stacks operate on entirely isolated virtual bridges and subnet structures (`editorial-staging-net` and `editorial-prod-net`).
