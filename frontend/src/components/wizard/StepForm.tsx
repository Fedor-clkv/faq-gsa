import { ArrowLeft, ArrowRight, SkipForward, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StepField from "./StepField";
import AnchorPreview from "./AnchorPreview";
import { useSessionStore } from "@/store/sessionStore";
import { useUiStore } from "@/store/uiStore";
import { updateStep } from "@/api/sessions";
import type { WizardStep } from "@/types";

interface StepFormProps {
  step: WizardStep;
  allSteps: WizardStep[];
}

export default function StepForm({ step, allSteps }: StepFormProps) {
  const { sessionId, getStepFields, setStepField, setStepCompleted } = useSessionStore();
  const { currentStep, setCurrentStep, addChatMessage, setAiStreaming } = useUiStore();
  const fields = getStepFields(step.id);

  const isFirst = currentStep === 1;
  const isLast = currentStep === allSteps.length;

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setStepField(step.id, fieldId, value);
  };

  const persistStep = async (completed: boolean) => {
    if (!sessionId) return;
    setStepCompleted(step.id, completed);
    try {
      await updateStep(sessionId, step.id, { fields, completed });
    } catch {
      // non-blocking — local state is source of truth
    }
  };

  const handleNext = async () => {
    await persistStep(true);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSkip = async () => {
    await persistStep(false);
    setCurrentStep(currentStep + 1);
  };

  const handleAskAi = () => {
    addChatMessage({ role: "user", content: `Помоги разобраться с шагом "${step.title}"`, stepId: step.id });
    addChatMessage({ role: "assistant", content: "", stepId: step.id });
    setAiStreaming(true);
  };

  const showAnchorPreview = step.slug === "keywords-anchors";

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>Шаг {step.id}</span>
          <span>/</span>
          <span>{allSteps.length}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{step.description}</p>
      </div>

      <Separator />

      <div className="space-y-6">
        {step.fields.map((field) => (
          <StepField
            key={field.id}
            field={field}
            value={fields[field.id]}
            onChange={handleFieldChange}
          />
        ))}
        {step.fields.length === 0 && (
          <p className="text-muted-foreground text-sm">На этом шаге нет полей для ввода.</p>
        )}
      </div>

      {showAnchorPreview && <AnchorPreview fields={fields} />}

      <Separator />

      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleBack} disabled={isFirst} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>

        {!isLast && (
          <Button variant="ghost" size="sm" onClick={handleSkip} className="gap-1.5 text-muted-foreground">
            <SkipForward className="w-4 h-4" />
            Пропустить
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={handleAskAi} className="gap-1.5 ml-auto text-primary hover:text-primary">
          <Sparkles className="w-4 h-4" />
          Спросить AI
        </Button>

        {!isLast && (
          <Button size="sm" onClick={handleNext} className="gap-1.5">
            Далее
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
