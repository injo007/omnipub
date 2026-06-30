# Host Security Hardening Specification

This specification covers mandatory system-level security constraints applied to self-hosted servers.

---

## 1. Network Boundary Security

*   **Default Inbound Deny**: All ports are blocked by default via `ufw`.
*   **Allowed Ingress Ports**:
    *   `22`: Protected SSH administration.
    *   `80`: Let's Encrypt HTTP challenge.
    *   `443`: SSL production HTTPS.
    *   `8080` / `8443`: Staging HTTP/HTTPS endpoints.
*   **No Private Ports Leakage**: Internal application services (such as port 3000) are explicitly kept off public host interfaces, accessible only via Docker bridge networking.

---

## 2. Intrusion and Brute-Force Mitigations

*   **Fail2ban Protection**: Automatically jail malicious actors attempting SSH brute-force or rapid, unauthenticated API probes.
*   **Unattended Security Upgrades**: Enable Ubuntu's security package stream to automatically patch critical vulnerabilities in real-time.
*   **Encrypted Secret Storage**: All connection keys and passwords for target WordPress endpoints are encrypted with AES-256-GCM prior to database storage.
*   **Non-Root Container Runtime**: Application nodes run as the restricted system user `nodejs` with zero-privilege system limits.
