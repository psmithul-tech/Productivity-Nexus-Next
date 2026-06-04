"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Calendar, CheckSquare, Target, Flame, Bell, Settings, Search } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K to toggle
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Single key shortcuts only when modal is closed and not typing in an input
      if (!open && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'c') router.push('/calendar');
        if (e.key === 't') router.push('/tasks');
        if (e.key === 'h') router.push('/habits');
        if (e.key === 'f') router.push('/focus');
        if (e.key === 'd') router.push('/dashboard');
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, router]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <Command
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl backdrop-blur-2xl"
        label="Global Command Menu"
      >
        <div className="flex items-center border-b border-white/10 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-white/40" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search..."
            className="flex h-12 w-full bg-transparent py-3 text-sm text-white placeholder:text-white/40 outline-none"
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-white/40">No results found.</Command.Empty>
          <Command.Group heading="Navigation" className="text-xs font-medium text-white/40 mb-2 px-2 pt-2">
            <Command.Item
              onSelect={() => runCommand(() => router.push("/dashboard"))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white mb-1"
            >
              <Target className="mr-2 h-4 w-4" /> Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/tasks"))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white mb-1"
            >
              <CheckSquare className="mr-2 h-4 w-4" /> Tasks (T)
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/calendar"))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white mb-1"
            >
              <Calendar className="mr-2 h-4 w-4" /> Calendar (C)
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/habits"))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white mb-1"
            >
              <Flame className="mr-2 h-4 w-4" /> Habits (H)
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push("/settings"))}
              className="flex cursor-pointer items-center rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
