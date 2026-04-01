/** Persists Medi-Support AYUSH voice consultation transcripts (client-only). */

export const AYUSH_CONSULTATION_HISTORY_KEY = "ayush-consultation-history";

export type ConsultationHistoryEntry = {
  id: string;
  messages: unknown[];
  date: number;
};

export function readConsultationHistoryFromStorage(): ConsultationHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AYUSH_CONSULTATION_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ConsultationHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeConsultationHistoryToStorage(entries: ConsultationHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AYUSH_CONSULTATION_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // quota / private mode
  }
}

/**
 * Full `localStorage.clear()` wipes patient consultation history. Call this instead
 * when signing in/out so AYUSH transcripts survive auth flows.
 */
export function clearLocalStoragePreservingConsultationHistory() {
  if (typeof window === "undefined") return;
  try {
    const backup = localStorage.getItem(AYUSH_CONSULTATION_HISTORY_KEY);
    localStorage.clear();
    if (backup !== null) {
      localStorage.setItem(AYUSH_CONSULTATION_HISTORY_KEY, backup);
    }
  } catch {
    // ignore
  }
}
