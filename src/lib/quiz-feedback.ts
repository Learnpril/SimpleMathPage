import type { QuizQuestion } from "./quiz-types";

export function getAnswerFeedback(
  question: QuizQuestion,
  selectedIndex: number,
): { correct: boolean; explanation: string } {
  return {
    correct: selectedIndex === question.correctIndex,
    explanation: question.explanation,
  };
}
