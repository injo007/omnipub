# RBAC Permission Matrix Specification
## Enterprise Autonomous Editorial Intelligence Platform

This document defines the Role-Based Access Control (RBAC) permission matrix, describing the security roles, permissions, server-side enforcement mechanisms, and verification protocols.

---

## 1. Security Roles Definition

The platform distinguishes seven core operational and automated security roles:

1.  **Ordinary User (`user`)**: Standard consumer or writer who can browse public dashboards and view published articles.
2.  **Editor (`editor`)**: Content creator who can view, draft, and modify pending articles but lacks publishing authority.
3.  **Senior Editor (`senior_editor`)**: Lead content reviewer who can run Phase C quality audits, request repairs, and curate drafts.
4.  **Publishing Operator (`publishing_operator`)**: Operations agent authorized to trigger, schedule, and retry publishing jobs.
5.  **Administrator (`admin`)**: Core platform manager with the ability to edit credential vaults, model routing mappings, and feature flags.
6.  **Service Worker (`service_worker`)**: High-privilege machine identity representing background cron tasks, orchestrators, and queue handlers.
7.  **System Administrator (`sysadmin`)**: Full platform owner with total permission access including emergency shutdown controls, budget overrides, and database purging capabilities.

---

## 2. Permitted Access Matrix

| Permission Boundary | Ordinary User (`user`) | Editor (`editor`) | Senior Editor (`senior_editor`) | Publishing Operator (`publishing_operator`) | Administrator (`admin`) | Service Worker (`service_worker`) | System Administrator (`sysadmin`) |
|---|---|---|---|---|---|---|---|
| **Article Viewing** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Article Editing** | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Agent Execution** | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Phase C Review** | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Phase D Approval** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Publishing Job Creation** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Immediate Publishing** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Scheduling** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Retries** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Aborts / Cancellations** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Reconciliation** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Manual Resolution** | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Dead-Letter Recovery** | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Audit Viewing** | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Site Configuration** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| **Credential Management** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| **Model Routing** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| **Budgets** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| **Feature Flags** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| **Emergency Shutdown** | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 3. Server-Side Enforcement Mechanisms

Role enforcement is executed on the server through Express middleware, service-layer assertions, and a least-privilege PostgreSQL application role. Client-side role checks are used only for interface decoration.

### Express Middleware Example
```typescript
export function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      writeStructuredLog("WARN", "Unauthorized access attempt blocked", {
        user: req.user?.uid,
        requestedRole: userRole,
        path: req.path
      });
      return res.status(403).json({
        ok: false,
        error: { code: "FORBIDDEN", message: "Insufficient permissions for this operation." }
      });
    }
    next();
  };
}
```

### PostgreSQL Role Constraints
```sql
REVOKE ALL ON DATABASE editorial_db FROM PUBLIC;
GRANT CONNECT ON DATABASE editorial_db TO editorial_app;
GRANT USAGE ON SCHEMA public TO editorial_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO editorial_app;
```

---

## 4. Security Verification Coverage

The Phase F test suite validates the following RBAC scenarios:
*   **Unauthenticated Access Blocked**: Verifies that requests without valid credentials yield clean `401 Unauthorized` responses.
*   **Editor Blocked From Config Mutation**: Proves that attempts by editors to POST/PUT changes to `/api/saas-settings` are caught and rejected.
*   **Viewer Blocked From AI Ingestion**: Ensures read-only accounts cannot execute CPU/token-intensive spider and crawling loops.
*   **Dead-Letter Management Lock**: Guarantees that only Administrators or System Administrators can force-retry or clear dead-letter jobs.
