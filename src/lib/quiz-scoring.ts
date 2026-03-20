import type { QuizQuestion } from "./quiz-types";

export function computeScore(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): { score: number; total: number } {
  const score = questions.filter(
    (q) => answers[q.id] === q.correctIndex,
  ).length;
  return { score, total: questions.length };
}
