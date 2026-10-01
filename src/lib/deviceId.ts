const KEY = "hazard.device.v1";

/** Anonymous id for this browser. Clearing site data resets it, so it is a speed bump, not a lock. */
export function getDeviceId(): string {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = `dev_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)}`;
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "dev_unknown";
  }
}