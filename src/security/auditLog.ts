import { calculateBackoffDelay } from '@/lib/backoff';
import { logAnalyticsEvent, logError } from '@/lib/monitoring';
import { persistentGet, persistentSet } from '@/libs/persistence';
import { supabase } from '@/integrations/supabase/client';
import { generateSecureId } from '@/lib/security';

/**
 * Audit event payload interface — written to audit_logs through record_client_audit_event()
 */
export interface AuditEventPayload {
  id: string;
  timestamp: string;
  actorId?: string;
  actionType: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export type QueuedAuditEvent = AuditEventPayload & {
  attempts: number;
  nextAttemptAt: number;
  status: 'pending' | 'failed';
};

const RECENT_LIMIT = 200;
const QUEUE_KEY = 'audit_queue_v1';
const MAX_ATTEMPTS = Number(import.meta.env.VITE_AUDIT_MAX_ATTEMPTS ?? 5);
const BASE_DELAY_MS = Number(import.meta.env.VITE_AUDIT_RETRY_BASE_MS ?? 500);
const MAX_DELAY_MS = Number(import.meta.env.VITE_AUDIT_RETRY_MAX_MS ?? 10_000);
const JITTER_MS = Number(import.meta.env.VITE_AUDIT_RETRY_JITTER_MS ?? 250);
const DEGRADE_THRESHOLD = Number(import.meta.env.VITE_AUDIT_DEGRADE_THRESHOLD ?? 3);

const recentEvents: AuditEventPayload[] = [];
let queue: QueuedAuditEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushInFlight = false;
let consecutiveFlushFailures = 0;

function generateId() {
  return generateSecureId();
}

async function loadQueue(): Promise<QueuedAuditEvent[]> {
  if (queue.length) return queue;
  const stored = await persistentGet<QueuedAuditEvent[]>(QUEUE_KEY);
  queue = stored ?? [];
  return queue;
}

async function saveQueue(updated: QueuedAuditEvent[]): Promise<void> {
  queue = updated;
  await persistentSet(QUEUE_KEY, updated);
}

function scheduleFlush(delay = 0) {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, delay);
}

/**
 * Record a browser-observed event through the server-side writer. The database
 * takes the actor from the session and stamps the time, so the actorId and
 * timestamp on the payload are not sent. It returns false when the per-actor
 * throttle drops the event; that is final, so the event leaves the queue.
 */
async function writeToSupabase(entry: AuditEventPayload): Promise<void> {
  const { error } = await supabase.rpc('record_client_audit_event', {
    p_id: entry.id,
    p_action_type: entry.actionType,
    p_resource_type: entry.resourceType ?? null,
    p_resource_id: entry.resourceId ?? null,
    p_metadata: entry.metadata ?? null,
  });

  if (error) {
    throw new Error(`Failed to write audit log to Supabase: ${error.message}`);
  }
}

export async function flushQueue(force = false): Promise<void> {
  if (flushInFlight) return;
  flushInFlight = true;
  const now = Date.now();
  const pendingQueue = await loadQueue();

  let updated = [...pendingQueue];

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    scheduleFlush(2_000);
    flushInFlight = false;
    return;
  }

  const itemsToProcess = pendingQueue.filter(
    (item) => item.status !== 'failed' && (force || item.nextAttemptAt <= now)
  );

  // ⚡ Bolt: Use Promise.all to avoid N+1 sequential await bottlenecks
  await Promise.all(
    itemsToProcess.map(async (item) => {
      try {
        await writeToSupabase(item);
        updated = updated.filter((e) => e.id !== item.id);
        consecutiveFlushFailures = 0;
        await logAnalyticsEvent('audit.flush.success', { id: item.id });
      } catch (error) {
        const attempts = item.attempts + 1;
        const isTerminal = attempts >= MAX_ATTEMPTS;
        const backoffMs = calculateBackoffDelay(attempts, {
          baseMs: BASE_DELAY_MS,
          maxMs: MAX_DELAY_MS,
          jitterMs: JITTER_MS,
        });

        const mutated = updated.find((e) => e.id === item.id);
        if (mutated) {
          mutated.attempts = attempts;
          mutated.nextAttemptAt = Date.now() + backoffMs;
          mutated.status = isTerminal ? 'failed' : 'pending';
        }

        consecutiveFlushFailures += 1;

        if (isTerminal) {
          await logError(error as Error, {
            action: 'audit_flush_failed_terminal',
            metadata: { id: item.id, attempts },
          });
        } else {
          await logAnalyticsEvent('audit.flush.retry', {
            id: item.id,
            attempts,
            backoffMs,
          });
        }
      }
    })
  );

  await saveQueue(updated);
  flushInFlight = false;

  if (consecutiveFlushFailures >= DEGRADE_THRESHOLD) {
    logAnalyticsEvent('audit.flush.degraded', {
      failures: consecutiveFlushFailures,
      queueSize: updated.filter((q) => q.status === 'pending').length,
    });
  }

  if (updated.some((q) => q.status === 'pending')) {
    const backoff = calculateBackoffDelay(1, {
      baseMs: BASE_DELAY_MS,
      maxMs: MAX_DELAY_MS,
      jitterMs: JITTER_MS,
    });
    scheduleFlush(backoff);
  }
}

export function recordAuditEvent(event: Omit<AuditEventPayload, 'id' | 'timestamp'>): AuditEventPayload {
  const entry: AuditEventPayload = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...event,
  };
  recentEvents.push(entry);
  if (recentEvents.length > RECENT_LIMIT) {
    recentEvents.shift();
  }

  void (async () => {
    const existing = await loadQueue();
    existing.push({
      ...entry,
      attempts: 0,
      nextAttemptAt: Date.now(),
      status: 'pending',
    });
    await saveQueue(existing);
    scheduleFlush(0);
  })();

  return entry;
}

export function getAuditEvents(limit = 50): AuditEventPayload[] {
  return recentEvents.slice(-limit).reverse();
}

export function getAuditQueueSnapshot(): Promise<QueuedAuditEvent[]> {
  return loadQueue().then((items) => [...items]);
}

