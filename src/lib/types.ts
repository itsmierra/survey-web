export type SurveyStatus = "draft" | "active" | "closed";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "text"
  | "rating"
  | "datetime";

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  label: string;
  value: string;
}

export interface QuestionCondition {
  question_id: string;
  operator: "equals" | "not_equals" | "contains";
  value: string | string[];
}

export interface Question {
  id: string;
  survey_id: string;
  type: QuestionType;
  title: string;
  description: string | null;
  options: QuestionOption[] | null;
  required: boolean;
  order_index: number;
  condition: QuestionCondition | null;
  created_at: string;
}

export interface Respondent {
  id: string;
  survey_id: string;
  name: string;
  created_at: string;
}

export interface AnswerValue {
  selected?: string | string[];
  text?: string;
  rating?: number;
  datetime?: string;
}

export interface Answer {
  id: string;
  respondent_id: string;
  question_id: string;
  value: AnswerValue;
  created_at: string;
}

export interface SurveyWithQuestions extends Survey {
  questions: Question[];
}

export interface RespondentWithAnswers extends Respondent {
  answers: Answer[];
}
