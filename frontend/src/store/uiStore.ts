import { create } from "zustand";
import type { ChatMessage } from "@/types";

interface UiState {
  currentStep: number;
  sidebarOpen: boolean;
  chatHistory: ChatMessage[];
  aiStreaming: boolean;
  language: "ru" | "en";

  setCurrentStep: (step: number) => void;
  setSidebarOpen: (open: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (delta: string) => void;
  setAiStreaming: (v: boolean) => void;
  clearChatForStep: (stepId: number) => void;
  setLanguage: (lang: "ru" | "en") => void;
}

export const useUiStore = create<UiState>((set) => ({
  currentStep: 1,
  sidebarOpen: true,
  chatHistory: [],
  aiStreaming: false,
  language: "ru",

  setCurrentStep: (step) => set({ currentStep: step }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addChatMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

  updateLastAssistantMessage: (delta) =>
    set((state) => {
      const history = [...state.chatHistory];
      const lastIdx = history.length - 1;
      if (lastIdx >= 0 && history[lastIdx].role === "assistant") {
        history[lastIdx] = {
          ...history[lastIdx],
          content: history[lastIdx].content + delta,
        };
      }
      return { chatHistory: history };
    }),

  setAiStreaming: (v) => set({ aiStreaming: v }),

  clearChatForStep: (stepId) =>
    set((state) => ({
      chatHistory: state.chatHistory.filter((m) => m.stepId !== stepId),
    })),

  setLanguage: (lang) => set({ language: lang }),
}));
