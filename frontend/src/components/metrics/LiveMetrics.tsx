import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/store/sessionStore";

interface Metric {
  label: string;
  value: string;
  variant: "success" | "warning" | "danger" | "secondary";
  description?: string;
}

function computeMetrics(steps: ReturnType<typeof useSessionStore.getState>["steps"]): Metric[] {
  const s1 = steps["1"]?.fields ?? {};
  const s3 = steps["3"]?.fields ?? {};
  const s5 = steps["5"]?.fields ?? {};
  const s6 = steps["6"]?.fields ?? {};

  const threads = Number(s6["threads"] ?? 50);
  const campaignGoal = (s1["campaign_goal"] as string) ?? "tier2";
  const platforms = (s3["platforms"] as string[]) ?? ["web20", "contextual"];
  const proxyType = (s5["proxy_type"] as string) ?? "private";
  const captcha = (s5["captcha_service"] as string) ?? "2captcha";
  const verifiedPerDay = Number(s6["verified_per_day"] ?? 100);
  const hasLimit = Number(s6["submissions_per_day"] ?? 0) > 0;

  // Platform quality factor
  const highQualityPlatforms = ["web20", "contextual", "wiki"];
  const highQCount = platforms.filter((p) => highQualityPlatforms.includes(p)).length;
  const platformFactor = platforms.length > 0 ? 0.3 + (highQCount / platforms.length) * 0.7 : 0.5;

  // Proxy speed factor
  const proxyFactor =
    proxyType === "residential" ? 0.6
    : proxyType === "rotating" ? 0.9
    : proxyType === "private" ? 1.0
    : proxyType === "semi" ? 0.85
    : proxyType === "public" ? 0.4
    : 0.7;

  // Captcha factor
  const captchaFactor =
    captcha === "none" ? 0.3
    : captcha === "gcb" ? 0.5
    : captcha === "deathbycaptcha" ? 0.7
    : 1.0;

  // Approval rates by platform mix
  const approvalRate =
    platformFactor > 0.7 ? 0.25
    : platformFactor > 0.5 ? 0.15
    : 0.08;

  const lpm = Math.round(threads * 0.4 * platformFactor * proxyFactor * captchaFactor);
  const vpm = Math.round(lpm * approvalRate);
  const lph = lpm * 60;
  const vpd = Math.min(vpm * 60 * 18, verifiedPerDay > 0 ? verifiedPerDay : Infinity);

  // Risk assessment
  const isTier1 = campaignGoal === "tier1";
  const highThreads = threads > 200;
  const noLimit = !hasLimit;
  const badProxy = proxyType === "public" || proxyType === "none";

  const riskScore =
    (isTier1 ? 1 : 0) + (highThreads ? 1 : 0) + (noLimit && isTier1 ? 1 : 0) + (badProxy && isTier1 ? 2 : 0);

  const riskLabel = riskScore === 0 ? "Низкий" : riskScore <= 1 ? "Умеренный" : riskScore <= 3 ? "Высокий" : "Критический";
  const riskVariant: Metric["variant"] =
    riskScore === 0 ? "success" : riskScore <= 1 ? "warning" : "danger";

  return [
    {
      label: "LPM",
      value: `~${lpm}`,
      variant: lpm > 50 ? "success" : lpm > 20 ? "warning" : "secondary",
      description: "Ссылок в минуту",
    },
    {
      label: "LPH",
      value: `~${lph.toLocaleString()}`,
      variant: "secondary",
      description: "Ссылок в час",
    },
    {
      label: "VPM",
      value: `~${vpm}`,
      variant: vpm > 5 ? "success" : vpm > 1 ? "warning" : "secondary",
      description: "Верифицировано / мин",
    },
    {
      label: "VPD",
      value: isFinite(vpd) ? `~${Math.round(vpd).toLocaleString()}` : "∞",
      variant: isFinite(vpd) ? "success" : "warning",
      description: "Верифицировано / сутки",
    },
    {
      label: "Одобрение",
      value: `~${Math.round(approvalRate * 100)}%`,
      variant: approvalRate > 0.2 ? "success" : approvalRate > 0.1 ? "warning" : "danger",
      description: "Approval rate",
    },
    {
      label: "Риск",
      value: riskLabel,
      variant: riskVariant,
      description: "Риск бана / санкций",
    },
  ];
}

export default function LiveMetrics() {
  const { steps } = useSessionStore();
  const metrics = useMemo(() => computeMetrics(steps), [steps]);

  return (
    <div className="p-3 grid grid-cols-2 gap-2">
      {metrics.map((m) => (
        <div key={m.label} className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
          <div className="flex items-center gap-1">
            <Badge variant={m.variant} className="text-xs font-semibold">
              {m.value}
            </Badge>
          </div>
          {m.description && (
            <p className="text-[10px] text-muted-foreground">{m.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
