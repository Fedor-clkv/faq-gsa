import { useState } from "react";
import { Sparkles, Download, ArrowLeft, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionStore } from "@/store/sessionStore";
import { useUiStore } from "@/store/uiStore";
import { streamBrief } from "@/api/ai";
import type { WizardStep } from "@/types";

interface BriefStepProps {
  step: WizardStep;
}

export default function BriefStep({ step: _step }: BriefStepProps) {
  const { sessionId } = useSessionStore();
  const { currentStep, setCurrentStep } = useUiStore();
  const [briefContent, setBriefContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!sessionId) return;
    setLoading(true);
    setBriefContent("");
    try {
      for await (const delta of streamBrief({ session_id: sessionId })) {
        setBriefContent((prev) => prev + delta);
      }
    } catch (err) {
      setBriefContent("Ошибка при генерации брифа. Проверьте подключение и API ключ.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([briefContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gsa-brief-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>Шаг 12 / 12</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Итоговый бриф</h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          Нажмите кнопку, чтобы сгенерировать полный анализ и рекомендации по вашим настройкам.
        </p>
      </div>

      <Separator />

      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Генерирую..." : "Сгенерировать бриф"}
        </Button>
        {briefContent && (
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" />
            Скачать .md
          </Button>
        )}
      </div>

      {briefContent && (
        <div className="rounded-lg border border-border bg-card/50">
          <ScrollArea className="max-h-[60vh] p-6">
            <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{briefContent}</ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      )}

      <Separator />

      <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Button>
    </div>
  );
}
