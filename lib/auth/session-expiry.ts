export const SESSION_EXPIRED_EVENT = "session:expired";

/**
 * Trigger session expiry from anywhere in the app.
 * Safe to call in server contexts (no-op).
 */
export function triggerSessionExpiry(): void {
  if (typeof globalThis === "undefined") return;

  const dispatchEvent = (globalThis as unknown as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent;
  const CustomEventCtor = (globalThis as unknown as { CustomEvent?: typeof CustomEvent }).CustomEvent;

  if (typeof dispatchEvent !== "function" || typeof CustomEventCtor !== "function") return;

  dispatchEvent(new CustomEventCtor(SESSION_EXPIRED_EVENT));
}
