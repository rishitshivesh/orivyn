"use client";

import { type LocalModelProgress, progressLabel } from "@orivyn/browser";
import { Activity, CircleAlert, Cpu, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ModelProgress({
  progress,
  working,
  onCancel,
}: {
  progress: LocalModelProgress | null;
  working: boolean;
  onCancel?: () => void;
}) {
  if (!progress || (!working && progress.stage === "ready")) return null;
  const percent =
    typeof progress.percentage === "number"
      ? Math.max(0, Math.min(100, progress.percentage))
      : undefined;
  const Icon =
    progress.stage === "download"
      ? Download
      : progress.stage === "error"
        ? CircleAlert
        : progress.stage === "infer" || progress.stage === "transcribe"
          ? Activity
          : Cpu;
  return (
    <Card>
      <CardContent
        className="space-y-3 p-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <Icon className="size-4 text-[#ababff]" />
            <span>
              {progress.model === "needle" ? "Needle" : "Whistle"} ·{" "}
              {progressLabel(progress)}
            </span>
          </div>
          {working && onCancel && (
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        {progress.stage === "download" && (
          <div
            role="progressbar"
            aria-label="Model download"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-1.5 overflow-hidden rounded-full bg-white/10"
          >
            {percent != null && (
              <div
                className="h-full rounded-full bg-[#a3a5ff]"
                style={{ width: `${percent}%` }}
              />
            )}
          </div>
        )}
        {progress.loaded != null && (
          <p className="text-xs text-slate-500">
            {(progress.loaded / 1_000_000).toFixed(1)} MB
            {progress.total != null
              ? ` / ${(progress.total / 1_000_000).toFixed(1)} MB`
              : ""}
          </p>
        )}
        {progress.message && (
          <p role="alert" className="text-xs text-amber-300">
            {progress.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
