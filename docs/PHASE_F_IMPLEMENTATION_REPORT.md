# Phase F Implementation Report

Current production topology targets Ubuntu Server 24.04 with Docker Compose, Caddy, and PostgreSQL 16. PostgreSQL stores workspace JSONB records, immutable editorial packages, publishing jobs, lease ownership, WordPress identifiers, and audit events.

Authentication is self-hosted: operators may enable the bearer-token gate with `AUTH_REQUIRED=true` and `APP_API_TOKEN`, or enforce authentication at the reverse proxy. Staging and production require PostgreSQL and fail startup/readiness checks when it is unavailable.
