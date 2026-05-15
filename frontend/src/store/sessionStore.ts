import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StepData } from "@/types";
import { createSession } from "@/api/sessions";

interface SessionState {
  sessionId: string | null;
  steps: Record<string, StepData>;

  initSession: () => Promise<void>;
  setStepField: (stepId: number, fieldId: string, value: unknown) => void;
  setStepCompleted: (stepId: number, completed: boolean) => void;
  resetStep: (stepId: number) => void;
  resetAll: () => void;
  getStepFields: (stepId: number) => Record<string, unknown>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      steps: {},

      initSession: async () => {
        const { sessionId } = get();
        if (sessionId) return;
        const res = await createSession();
        set({ sessionId: res.session_id });
      },

      setStepField: (stepId, fieldId, value) => {
        set((state) => {
          const key = String(stepId);
          const existing = state.steps[key] ?? {
            step_id: stepId,
            fields: {},
            completed: false,
          };
          return {
            steps: {
              ...state.steps,
              [key]: {
                ...existing,
                fields: { ...existing.fields, [fieldId]: value },
              },
            },
          };
        });
      },

      setStepCompleted: (stepId, completed) => {
        set((state) => {
          const key = String(stepId);
          const existing = state.steps[key] ?? {
            step_id: stepId,
            fields: {},
            completed: false,
          };
          return {
            steps: {
              ...state.steps,
              [key]: { ...existing, completed },
            },
          };
        });
      },

      resetStep: (stepId) => {
        set((state) => {
          const steps = { ...state.steps };
          delete steps[String(stepId)];
          return { steps };
        });
      },

      resetAll: () => set({ steps: {} }),

      getStepFields: (stepId) => {
        return get().steps[String(stepId)]?.fields ?? {};
      },
    }),
    {
      name: "gsa-session",
      partialize: (state) => ({
        sessionId: state.sessionId,
        steps: state.steps,
      }),
    }
  )
);
