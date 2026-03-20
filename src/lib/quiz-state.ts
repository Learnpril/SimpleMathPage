import type { QuizState } from "./quiz-types";

export function getStorageKey(quizId: string): string {
  return `quiz-state:${quizId}`;
}

function isQuizState(value: unknown): value is QuizState {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.answers === "object" &&
    obj.answers !== null &&
    typeof obj.completed === "boolean" &&
    typeof obj.score === "number" &&
    typeof obj.total === "number" &&
    typeof obj.timestamp === "number"
  );
}

export function loadQuizState(quizId: string): QuizState | null {
  try {
    const raw = localStorage.getItem(getStorageKey(quizId));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isQuizState(parsed)) return parsed;
    console.warn(`[quiz-state] Discarding malformed state for "${quizId}"`);
    localStorage.removeItem(getStorageKey(quizId));
    return null;
  } catch (e) {
    console.warn("[quiz-state] Unable to load state:", e);
    return null;
  }
}

export function saveQuizState(quizId: string, state: QuizState): void {
  try {
    localStorage.setItem(getStorageKey(quizId), JSON.stringify(state));
  } catch (e) {
    console.warn("[quiz-state] Unable to save state:", e);
  }
}

export function clearQuizState(quizId: string): void {
  try {
    localStorage.removeItem(getStorageKey(quizId));
  } catch (e) {
    console.warn("[quiz-state] Unable to clear state:", e);
  }
}
