import { Check, RotateCcw, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { useSessionStore } from "@/store/sessionStore";
import { useQuery } from "@tanstack/react-query";
import { getSteps } from "@/api/wizard";
import type { WizardStep } from "@/types";

export default function Sidebar() {
  const { currentStep, setCurrentStep, sidebarOpen } = useUiStore();
  const { steps: sessionSteps, resetStep, resetAll } = useSessionStore();

  const { data: wizardSteps = [] } = useQuery<WizardStep[]>({
    queryKey: ["wizard-steps"],
    queryFn: getSteps,
    staleTime: Infinity,
  });

  const targetUrl = (sessionSteps["1"]?.fields?.target_url as string) || null;
  const niche = (sessionSteps["1"]?.fields?.niche as string) || null;

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 border-r border-border bg-card/30 flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-0.5">
          {wizardSteps.map((step) => {
            const stepData = sessionSteps[String(step.id)];
            const isCompleted = stepData?.completed ?? false;
            const isCurrent = currentStep === step.id;
            const hasData = stepData && Object.keys(stepData.fields).length > 0;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors group",
                  isCurrent
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border",
                    isCompleted
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : isCurrent
                      ? "border-primary/50 text-primary"
                      : hasData
                      ? "border-yellow-500/50 text-yellow-400"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                <span className="flex-1 text-xs font-medium truncate">{step.title}</span>

                {isCurrent && (
                  <ChevronRight className="w-3 h-3 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {(targetUrl || niche) && (
        <>
          <Separator />
          <div className="p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Проект
            </p>
            {targetUrl && (
              <p className="text-xs text-foreground truncate" title={targetUrl}>
                🌐 {targetUrl.replace(/^https?:\/\//, "")}
              </p>
            )}
            {niche && (
              <p className="text-xs text-muted-foreground truncate" title={niche}>
                📌 {niche}
              </p>
            )}
          </div>
        </>
      )}

      <Separator />
      <div className="p-3 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => resetStep(currentStep)}
        >
          <RotateCcw className="w-3 h-3" />
          Сброс шага
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm("Сбросить все данные проекта?")) resetAll();
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </aside>
  );
}
