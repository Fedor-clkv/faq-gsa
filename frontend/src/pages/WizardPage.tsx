import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import StepForm from "@/components/wizard/StepForm";
import BriefStep from "@/components/wizard/BriefStep";
import { useSessionStore } from "@/store/sessionStore";
import { useUiStore } from "@/store/uiStore";
import { getSteps } from "@/api/wizard";

export default function WizardPage() {
  const { initSession } = useSessionStore();
  const { currentStep } = useUiStore();

  const { data: wizardSteps = [], isLoading } = useQuery({
    queryKey: ["wizard-steps"],
    queryFn: getSteps,
    staleTime: Infinity,
  });

  useEffect(() => {
    initSession();
  }, [initSession]);

  const step = wizardSteps.find((s) => s.id === currentStep);
  const isBriefStep = step?.slug === "brief";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground text-sm animate-pulse">
                Загрузка шагов...
              </div>
            </div>
          ) : !step ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground text-sm">Шаг не найден</div>
            </div>
          ) : isBriefStep ? (
            <BriefStep step={step} />
          ) : (
            <StepForm step={step} allSteps={wizardSteps} />
          )}
        </main>
        {!isBriefStep && <RightPanel />}
      </div>
    </div>
  );
}
