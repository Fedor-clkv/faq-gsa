import { Separator } from "@/components/ui/separator";
import AiChat from "@/components/ai/AiChat";
import LiveMetrics from "@/components/metrics/LiveMetrics";
import { useUiStore } from "@/store/uiStore";
import { useQuery } from "@tanstack/react-query";
import { getSteps } from "@/api/wizard";

export default function RightPanel() {
  const { currentStep } = useUiStore();
  const { data: wizardSteps = [] } = useQuery({
    queryKey: ["wizard-steps"],
    queryFn: getSteps,
    staleTime: Infinity,
  });

  const step = wizardSteps.find((s) => s.id === currentStep);

  return (
    <aside className="w-72 border-l border-border bg-card/30 flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          AI Помощник
        </h3>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <AiChat />
      </div>

      <Separator />

      <div className="shrink-0">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Прогноз метрик
          </h3>
        </div>
        <LiveMetrics />
      </div>

      {step && (
        <>
          <Separator />
          <div className="p-3 shrink-0">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              В программе GSA SER
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getGsaHint(step.slug)}
            </p>
          </div>
        </>
      )}
    </aside>
  );
}

function getGsaHint(slug: string): string {
  const hints: Record<string, string> = {
    "target-site": "Project → New Project → Target URLs",
    "keywords-anchors": "Project → Options → Anchor Text",
    "platforms": "Project → Options → Allowed Engines",
    "content": "Project → Options → Data → Articles",
    "proxies-captcha": "Settings → Proxies / Settings → Captcha",
    "schedule-limits": "Project → Options → Submission → Limits",
    "verification": "Project → Options → Verification",
    "quality-filters": "Project → Options → Filters",
    "site-lists": "Settings → Global Site Lists",
    "integrations": "Settings → Integrations / Plugins",
    "advanced-settings": "Project → Options → Misc",
    "brief": "Summary of all configured settings",
  };
  return hints[slug] ?? "Project → Options";
}
