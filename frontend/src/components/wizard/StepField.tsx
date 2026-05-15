import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WizardField } from "@/types";
import { Info } from "lucide-react";

interface StepFieldProps {
  field: WizardField;
  value: unknown;
  onChange: (fieldId: string, value: unknown) => void;
}

export default function StepField({ field, value, onChange }: StepFieldProps) {
  const [tagInput, setTagInput] = useState("");

  const effectiveValue = value ?? field.default;

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (!trimmed) return;
      const existing = Array.isArray(effectiveValue) ? (effectiveValue as string[]) : [];
      if (!existing.includes(trimmed)) {
        onChange(field.id, [...existing, trimmed]);
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput) {
      const existing = Array.isArray(effectiveValue) ? (effectiveValue as string[]) : [];
      onChange(field.id, existing.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    const existing = Array.isArray(effectiveValue) ? (effectiveValue as string[]) : [];
    onChange(field.id, existing.filter((t) => t !== tag));
  };

  const toggleMultiselect = (optionValue: string) => {
    const existing = Array.isArray(effectiveValue) ? (effectiveValue as string[]) : [];
    const next = existing.includes(optionValue)
      ? existing.filter((v) => v !== optionValue)
      : [...existing, optionValue];
    onChange(field.id, next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={field.id} className="text-sm">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {field.hint}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {(field.type === "text" || field.type === "url") && (
        <Input
          id={field.id}
          type={field.type === "url" ? "url" : "text"}
          placeholder={field.placeholder}
          value={(effectiveValue as string) ?? ""}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="bg-background"
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          id={field.id}
          placeholder={field.placeholder}
          value={(effectiveValue as string) ?? ""}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="bg-background min-h-[100px]"
        />
      )}

      {field.type === "number" && (
        <Input
          id={field.id}
          type="number"
          placeholder={field.placeholder}
          value={(effectiveValue as number) ?? ""}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onChange={(e) => onChange(field.id, e.target.value === "" ? null : Number(e.target.value))}
          className="bg-background"
        />
      )}

      {field.type === "toggle" && (
        <div className="flex items-center gap-3">
          <Switch
            id={field.id}
            checked={Boolean(effectiveValue)}
            onCheckedChange={(checked) => onChange(field.id, checked)}
          />
          <span className="text-sm text-muted-foreground">
            {Boolean(effectiveValue) ? "Включено" : "Выключено"}
          </span>
        </div>
      )}

      {field.type === "range" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{field.min ?? 0}</span>
            <span className="text-sm font-semibold text-primary">
              {effectiveValue as number}
              {field.id.includes("ratio") || field.id.includes("percent") ? "%" : ""}
            </span>
            <span className="text-xs text-muted-foreground">{field.max ?? 100}</span>
          </div>
          <Slider
            id={field.id}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={[(effectiveValue as number) ?? (field.min ?? 0)]}
            onValueChange={([v]) => onChange(field.id, v)}
          />
        </div>
      )}

      {field.type === "select" && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(field.id, opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                effectiveValue === opt.value
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {field.type === "multiselect" && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const selected = Array.isArray(effectiveValue)
              ? (effectiveValue as string[]).includes(opt.value)
              : false;
            return (
              <button
                key={opt.value}
                onClick={() => toggleMultiselect(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                  selected
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
              >
                {selected && <span className="mr-1">✓</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "tags" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 min-h-[2rem] p-2 rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
            {(Array.isArray(effectiveValue) ? (effectiveValue as string[]) : []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={
                (Array.isArray(effectiveValue) ? (effectiveValue as string[]) : []).length === 0
                  ? field.placeholder
                  : ""
              }
              className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">Нажмите Enter или запятую для добавления</p>
        </div>
      )}
    </div>
  );
}
