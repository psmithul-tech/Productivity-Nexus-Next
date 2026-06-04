"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function AutoReloader() {
  const router = useRouter();
  const lastStateHash = useRef<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.stats) {
          const currentHash = `${data.stats.activeTasks}-${data.stats.completedTasks}-${data.stats.totalEvents}-${data.stats.pendingReminders}`;
          if (lastStateHash.current !== null && lastStateHash.current !== currentHash) {
            console.log("[AutoReloader] State changed, refreshing UI...");
            router.refresh();
          }
          lastStateHash.current = currentHash;
        }
      } catch (e) {
        // Ignore fetch errors
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
