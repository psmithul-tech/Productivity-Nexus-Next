import { createContext, useContext, useState, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/games/life-chronicle/ui/toaster";
import { TooltipProvider } from "@/components/games/life-chronicle/ui/tooltip";
import { GameProvider } from "@/lib/games/life-chronicle/engine/GameContext";

import Home from "./pages/home";
import Create from "./pages/create";
import Game from "./pages/game";
import Death from "./pages/death";
import Leaderboard from "./pages/leaderboard";
import Achievements from "./pages/achievements";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

// Simple SPA Router
type Screen = "home" | "create" | "game" | "death" | "leaderboard" | "achievements" | "not-found";

interface RouterContextType {
  screen: Screen;
  navigate: (to: Screen) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("home");
  return (
    <RouterContext.Provider value={{ screen, navigate: setScreen }}>
      {children}
    </RouterContext.Provider>
  );
}

export function Link({ href, children, className }: { href: string; children: ReactNode, className?: string }) {
  const { navigate } = useRouter();
  const target = href.replace("/", "") || "home";
  return (
    <a href="#" className={className} onClick={(e) => { e.preventDefault(); navigate(target as Screen); }}>
      {children}
    </a>
  );
}

function Router() {
  const { screen } = useRouter();
  switch (screen) {
    case "home": return <Home />;
    case "create": return <Create />;
    case "game": return <Game />;
    case "death": return <Death />;
    case "leaderboard": return <Leaderboard />;
    case "achievements": return <Achievements />;
    default: return <NotFound />;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <RouterProvider>
            <Router />
          </RouterProvider>
        </GameProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
