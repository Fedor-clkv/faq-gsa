import { Download, Upload, Layers, FileDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/store/uiStore";
import { useSessionStore } from "@/store/sessionStore";
import { useQuery } from "@tanstack/react-query";
import { getSteps } from "@/api/wizard";

export default function Header() {
  const { currentStep, language, setLanguage, setSidebarOpen, sidebarOpen } = useUiStore();
  const { steps: sessionSteps, sessionId } = useSessionStore();

  const { data: wizardSteps } = useQuery({
    queryKey: ["wizard-steps"],
    queryFn: getSteps,
    staleTime: Infinity,
  });

  const totalSteps = wizardSteps?.length ?? 12;
  const progressValue = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const handleExportConfig = () => {
    const config = {
      session_id: sessionId,
      exported_at: new Date().toISOString(),
      steps: sessionSteps,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gsa-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          if (json.steps) {
            useSessionStore.setState({ steps: json.steps });
          }
        } catch {
          alert("Неверный формат файла");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const completedCount = Object.values(sessionSteps).filter((s) => s.completed).length;

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 z-50 sticky top-0">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
          G
        </div>
        <span className="font-semibold text-sm hidden sm:block">GSA Wizard</span>
      </div>

      <div className="flex-1 max-w-xs hidden md:flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Шаг {currentStep} из {totalSteps}</span>
          <Badge variant="secondary" className="text-[10px] h-4">
            {completedCount}/{totalSteps - 1} готово
          </Badge>
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleImportConfig} className="hidden sm:flex gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          Загрузить
        </Button>
        <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-xs">
          <Layers className="h-3.5 w-3.5" />
          Пресеты
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportConfig} className="hidden sm:flex gap-1.5 text-xs">
          <FileDown className="h-3.5 w-3.5" />
          Экспорт
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportConfig} className="flex gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Сохранить</span>
        </Button>

        <div className="flex rounded-md border border-border overflow-hidden ml-2">
          {(["ru", "en"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                language === lang
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
