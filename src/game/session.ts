export const LOCAL_MATCH_KEY = 'khalf_local_match_v1';
export const ROOM_SESSION_KEY = 'hm_multi_session';

export function readSession<T>(key: string): T | null {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Playing remains possible if the browser blocks storage.
  }
}
