# Go-Live Verification Checklist

Follow this checklist strictly prior to promoting any release to production.

---

## 1. Pre-Deployment Checklists

*   [ ] **DNS Verification**: Domain resolves to target host IP address.
*   [ ] **SSL Verification**: Ports 80 and 443 are open, Caddy successfully acquired valid certificates.
*   [ ] **SaaS Budget Check**: Monthly budget constraints configured and tracked.
*   [ ] **API Credentials Audit**: No placeholder secrets or local `.env` files committed.
*   [ ] **WordPress Endpoint**: Staging and Production remote targets isolated. Staging cannot target production sites.
*   [ ] **Firewall Hardening**: Only ports 80, 443, 8080, 8443, and SSH port are open.
*   [ ] **Data Persistence Check**: Local db.json directory ownership set to non-root `nodejs` group.
*   [ ] **Telemetry Logs**: Structured logs format verified in production modes.
