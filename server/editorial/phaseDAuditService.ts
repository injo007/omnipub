import { PhaseDAuditEvent, PhaseDDecision } from "./typesPhaseD";

const SENSITIVE_KEYS = new Set([
    'apikey', 'api_key', 'token', 'accesstoken', 'refreshtoken', 
    'authorization', 'cookie', 'applicationpassword', 'password', 
    'secret', 'clientsecret', 'privatekey'
]);

function isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const s of SENSITIVE_KEYS) {
        if (normalized.includes(s)) return true;
    }
    return false;
}

export function sanitizeValue(val: any, seen: WeakSet<any> = new WeakSet()): any {
    if (val === null || val === undefined) return val;
    
    if (typeof val === 'string') {
        let s = val;
        s = s.replace(/(apikey|api_key|token|accesstoken|refreshtoken|authorization|cookie|applicationpassword|password|secret|clientsecret|privatekey)\s*[:=]\s*['"]?[^'"\s,&]+['"]?/gi, '$1=[REDACTED]');
        if (s.length > 5000) {
            s = s.substring(0, 5000) + '...[TRUNCATED]';
        }
        return s;
    }
    
    if (typeof val === 'object') {
        if (seen.has(val)) return '[CIRCULAR]';
        seen.add(val);

        if (val instanceof Error) {
            return {
                name: val.name,
                message: sanitizeValue(val.message, seen),
                stack: sanitizeValue(val.stack, seen)
            };
        }

        if (Array.isArray(val)) {
            return val.map(item => sanitizeValue(item, seen));
        }

        const sanitizedObj: any = {};
        for (const key of Object.keys(val)) {
            if (isSensitiveKey(key)) {
                sanitizedObj[key] = '[REDACTED]';
            } else {
                sanitizedObj[key] = sanitizeValue(val[key], seen);
            }
        }
        return sanitizedObj;
    }

    return val;
}

export function createAuditLog(
    articleId: string, 
    workflowRunId: string, 
    action: string, 
    eventType: string,
    decision?: PhaseDDecision,
    reasons?: any[]
): PhaseDAuditEvent {
    let sanitizedEvidence = "";
    if (reasons) {
        const sanitizedReasons = reasons.map(r => sanitizeValue(r));
        sanitizedEvidence = JSON.stringify(sanitizedReasons);
        if (sanitizedEvidence.length > 5000) {
            sanitizedEvidence = sanitizedEvidence.substring(0, 5000) + '...[TRUNCATED]';
        }
    }

    const event: PhaseDAuditEvent = {
        articleId,
        workflowRunId,
        action,
        eventType,
        decision,
        sanitizedEvidence,
        timestamp: new Date().toISOString()
    };
    return event;
}
