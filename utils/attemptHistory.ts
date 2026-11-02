import { QuizAttempt, RIASECKey, RIASECScores } from '../types';

const STORAGE_KEY = 'bowsalti_attempts_history_v1';
const VALID_KEYS: RIASECKey[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export const getHollandCode = (scores: RIASECScores): string => {
  return (Object.entries(scores) as [RIASECKey, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key)
    .join('');
};

const isValidScores = (raw: unknown): raw is RIASECScores => {
  if (!raw || typeof raw !== 'object') return false;
  const record = raw as Record<string, unknown>;
  return VALID_KEYS.every(
    (key) => typeof record[key] === 'number' && Number.isFinite(record[key])
  );
};

export const loadAttemptHistory = (): QuizAttempt[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is QuizAttempt =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.timestamp === 'string' &&
          isValidScores(item.scores)
      )
      .map((item, idx) => ({
        ...item,
        attemptNumber: idx + 1,
        dominantCode:
          typeof item.dominantCode === 'string' && item.dominantCode.length > 0
            ? item.dominantCode
            : getHollandCode(item.scores),
      }));
  } catch (error) {
    console.error('Failed to read quiz attempt history:', error);
    return [];
  }
};

export const saveAttemptHistory = (attempts: QuizAttempt[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const normalized = attempts.map((attempt, idx) => ({
      ...attempt,
      attemptNumber: idx + 1,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.error('Failed to save quiz attempt history:', error);
  }
};

export const clearAttemptHistory = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear quiz attempt history:', error);
  }
};
