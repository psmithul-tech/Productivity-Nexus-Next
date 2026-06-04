"use client";
import { CommandPalette } from "@/components/command-palette";
import { DailyBriefing } from "@/components/daily-briefing";

export function ClientProviders() {
  return (
    <>
      <CommandPalette />
      <DailyBriefing />
    </>
  );
}
