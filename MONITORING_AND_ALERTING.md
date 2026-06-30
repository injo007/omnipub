# Observability, Monitoring, and Alerting Specification

This document outlines metrics compilation, structured logging formats, and real-time operations alerting.

---

## 1. Production Structured Logs

All backend events must be output as standardized, single-line JSON to `stdout` / `stderr`. This allows fluentd, promtail, or GCP Logging to collect, structure, and retain logs on process restarts.

```json
{
  "timestamp": "2026-06-29T16:00:00.000Z",
  "severity": "ERROR",
  "message": "Tracked Secure Error [WORDPRESS_API_FAIL]: Host unreachable",
  "environment": "production",
  "service": "WordPressPublisher",
  "errorClass": "Error"
}
```

---

## 2. High-Density Telemetry Metrics

Metrics track core operations:
*   **Host Health**: CPU load, memory exhaustion, remaining disk space, and socket leaks.
*   **Worker Queues**: Job concurrency, queue latency, lease expirations, and dead-letter growth.
*   **SaaS Finances**: Token counts, per-article spend, monthly budgets, and fallback activations.
*   **Security Logs**: Invalid schemas, rate-limit blocks, unauthorized accesses, and cryptographic exceptions.
