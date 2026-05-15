import { useRef, useEffect, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { useAiStream } from "./useAiStream";

export default function AiChat() {
  const { chatHistory, aiStreaming, currentStep } = useUiStore();
  const { askHint } = useAiStream();
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const stepMessages = chatHistory.filter((m) => m.stepId === currentStep);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = () => {
    const msg = inputValue.trim();
    if (!msg || aiStreaming) return;
    setInputValue("");
    askHint(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAsk = () => {
    askHint();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 p-3">
        {stepMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              Спросите AI о текущем шаге или нажмите кнопку ниже
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stepMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs rounded-lg p-3 leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground ml-4"
                    : "bg-card border border-border text-foreground mr-4"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none text-xs">
                    <ReactMarkdown>{msg.content || (aiStreaming && i === stepMessages.length - 1 ? "▍" : "")}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-2 shrink-0">
        {stepMessages.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickAsk}
            disabled={aiStreaming}
            className="w-full gap-2 text-xs"
          >
            {aiStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Анализировать этот шаг
          </Button>
        )}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос..."
            className="text-xs h-8 bg-background"
            disabled={aiStreaming}
          />
          <Button
            size="icon"
            className="w-8 h-8 shrink-0"
            onClick={handleSend}
            disabled={!inputValue.trim() || aiStreaming}
          >
            {aiStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
