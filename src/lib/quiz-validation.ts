import type { QuizData, ValidationResult } from "./quiz-types";

export function validateQuizData(data: QuizData): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  if (
    !data.questions ||
    !Array.isArray(data.questions) ||
    data.questions.length < 3 ||
    data.questions.length > 20
  ) {
    errors.push({
      field: "questions",
      message: `Quiz must have 3–20 questions, got ${data.questions?.length ?? 0}`,
    });
  }

  if (data.questions && Array.isArray(data.questions)) {
    data.questions.forEach((q, i) => {
      const prefix = `questions[${i}]`;

      if (!q.id || typeof q.id !== "string" || q.id.trim() === "") {
        errors.push({
          field: `${prefix}.id`,
          message: "id is required and must be a non-empty string",
        });
      }
      if (!q.text || typeof q.text !== "string" || q.text.trim() === "") {
        errors.push({
          field: `${prefix}.text`,
          message: "text is required and must be a non-empty string",
        });
      }
      if (
        !q.explanation ||
        typeof q.explanation !== "string" ||
        q.explanation.trim() === ""
      ) {
        errors.push({
          field: `${prefix}.explanation`,
          message: "explanation is required and must be a non-empty string",
        });
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push({
          field: `${prefix}.options`,
          message: `Each question must have exactly 4 options, got ${q.options?.length ?? 0}`,
        });
      }
      if (
        typeof q.correctIndex !== "number" ||
        !Number.isInteger(q.correctIndex) ||
        q.correctIndex < 0 ||
        q.correctIndex > 3
      ) {
        errors.push({
          field: `${prefix}.correctIndex`,
          message: `correctIndex must be an integer in [0, 3], got ${q.correctIndex}`,
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
