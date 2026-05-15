export type FieldType =
  | "text"
  | "url"
  | "textarea"
  | "select"
  | "multiselect"
  | "number"
  | "toggle"
  | "tags"
  | "range";

export interface FieldOption {
  value: string;
  label: string;
}

export interface WizardField {
  id: string;
  label: string;
  type: FieldType;
  placeholder: string;
  hint: string;
  required: boolean;
  default: unknown;
  options: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
}

export interface WizardStep {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  fields: WizardField[];
  ai_prompt_context: string;
}

export interface StepData {
  step_id: number;
  fields: Record<string, unknown>;
  completed: boolean;
}

export interface SessionBrief {
  content: string;
  generated_at: string;
}

export interface Session {
  session_id: string;
  created_at: string;
  updated_at: string;
  current_step: number;
  steps: Record<string, StepData>;
  brief: SessionBrief | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  stepId: number;
}
