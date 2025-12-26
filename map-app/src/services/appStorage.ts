import type { ActionArea } from "../types/ActionArea";
import type { Track } from "../types/Track";

const STORAGE_KEY = "app_state_v1";

export type PersistedAppState = {
  actions: ActionArea[];
  tracks: Track[];
  activeActionId: string | null;
};

export function saveAppState(state: PersistedAppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadAppState(): PersistedAppState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAppState() {
  localStorage.removeItem(STORAGE_KEY);
}
