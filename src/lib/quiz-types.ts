export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  quizId: string;
  questions: QuizQuestion[];
}

export interface QuizState {
  answers: Record<string, number>;
  completed: boolean;
  score: number;
  total: number;
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
