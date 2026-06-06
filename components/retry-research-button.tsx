"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RetryResearchButton({ researchId, query, userId }: { researchId: number, query: string, userId: string }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Re-trigger the worker and wait for it to be accepted
      await fetch("/api/research/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchId, query, userId })
      });
      
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl border-[3px] border-black dark:border-transparent hover:-translate-y-1 transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg disabled:opacity-50"
    >
      {isRetrying ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
      {isRetrying ? "Retrying..." : "Retry Research"}
    </button>
  );
}
