/**
 * Lightweight event bus for cross-page synchronization.
 * Fire after a mutation succeeds → all listening pages reload their data.
 * No new architecture needed — just a shared naming convention.
 */
export type AppEvent =
  | "app:logout"
  | "app:patients-changed"
  | "app:sessions-changed"
  | "app:payments-changed"
  | "app:users-changed"
  | "app:permissions-changed"
  | "app:regular-visits-changed";

const listeners = new Map<AppEvent, Set<() => void>>();

export function emitAppEvent(event: AppEvent) {
  listeners.get(event)?.forEach(fn => fn());
}

export function onAppEvent(event: AppEvent, handler: () => void): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function clearAllAppListeners() {
  listeners.forEach(fns => fns.clear());
}
