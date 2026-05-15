import { useCallback } from "react";
import { useUiStore } from "@/store/uiStore";
import { useSessionStore } from "@/store/sessionStore";
import { streamHint } from "@/api/ai";

export function useAiStream() {
  const { addChatMessage, updateLastAssistantMessage, setAiStreaming, currentStep } = useUiStore();
  const { sessionId, getStepFields } = useSessionStore();

  const askHint = useCallback(
    async (userQuestion?: string) => {
      if (!sessionId) return;

      const userMsg = userQuestion ?? `Помоги разобраться с настройками на шаге ${currentStep}`;
      addChatMessage({ role: "user", content: userMsg, stepId: currentStep });
      addChatMessage({ role: "assistant", content: "", stepId: currentStep });
      setAiStreaming(true);

      try {
        for await (const delta of streamHint({
          session_id: sessionId,
          step_id: currentStep,
          user_data: getStepFields(currentStep),
        })) {
          updateLastAssistantMessage(delta);
        }
      } catch {
        updateLastAssistantMessage("\n\n⚠️ Ошибка соединения с AI. Проверьте API ключ в настройках.");
      } finally {
        setAiStreaming(false);
      }
    },
    [sessionId, currentStep, addChatMessage, updateLastAssistantMessage, setAiStreaming, getStepFields]
  );

  return { askHint };
}
