import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorldNPC } from "@/lib/games/life-chronicle/engine/npcLeaderboard";
import { GameState } from "@/lib/games/life-chronicle/engine/types";
import { getRealmTheme } from "@/lib/games/life-chronicle/engine/realmThemes";

interface Message {
  role: "user" | "npc";
  text: string;
}

interface NpcChatProps {
  npc: WorldNPC;
  gameState?: GameState;
  onClose: () => void;
}

const FALLBACK_STATE: Partial<GameState> = {
  name: "Traveler", bloodline: "Common", realm: "Mundus", age: 20,
  mysticalPath: "none", legacyScore: 0,
};

export default function NpcChat({ npc, gameState, onClose }: NpcChatProps) {
  const state = gameState ?? (FALLBACK_STATE as GameState);
  const [messages, setMessages] = useState<Message[]>([
    { role: "npc", text: getNpcGreeting(npc, state) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = getRealmTheme((gameState?.realm) ?? "Mundus");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const systemPrompt = buildNpcSystemPrompt(npc, state);
      const conversation = newMessages
        .map(m => `${m.role === "user" ? "Player" : npc.name}: ${m.text}`)
        .join("\n");
      const userPrompt = `${conversation}\nPlayer: ${text}\n\n${npc.name}:`;

      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "npc", text: data.text || "..." }]);
      } else {
        setMessages(prev => [...prev, { role: "npc", text: "*The connection to this legend fades into silence…*" }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "npc", text: "*The winds carry no reply.*" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md rounded-t-2xl border overflow-hidden flex flex-col"
        style={{
          background: "hsl(220,25%,6%)",
          borderColor: npc.borderColor,
          boxShadow: `0 -4px 40px ${npc.borderColor}40`,
          maxHeight: "80vh",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ borderColor: `${npc.borderColor}40`, background: `${npc.borderColor}10` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{ background: `${npc.borderColor}20`, border: `1px solid ${npc.borderColor}50` }}>
            {npc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif font-bold text-sm" style={{ color: npc.borderColor }}>{npc.name}</div>
            <div className="text-xs text-muted-foreground truncate">{npc.title} · {npc.realm}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none px-2">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "npc" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1"
                  style={{ background: `${npc.borderColor}20`, border: `1px solid ${npc.borderColor}40` }}>
                  {npc.icon}
                </div>
              )}
              <div
                className="max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                style={{
                  background: msg.role === "user"
                    ? `${theme.accent}20`
                    : `${npc.borderColor}12`,
                  border: `1px solid ${msg.role === "user" ? theme.accent : npc.borderColor}30`,
                  color: msg.role === "user" ? "hsl(240,5%,90%)" : "hsl(240,5%,85%)",
                }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ background: `${npc.borderColor}20`, border: `1px solid ${npc.borderColor}40` }}>
                {npc.icon}
              </div>
              <div className="flex gap-1 px-3 py-2 rounded-xl"
                style={{ background: `${npc.borderColor}12`, border: `1px solid ${npc.borderColor}30` }}>
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: npc.borderColor }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t shrink-0 flex gap-2"
          style={{ borderColor: `${npc.borderColor}30` }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={`Speak to ${npc.name}…`}
            disabled={loading}
            className="flex-1 bg-transparent border rounded-xl px-3 py-2 text-sm outline-none transition-colors"
            style={{
              borderColor: input ? npc.borderColor : "rgba(255,255,255,0.15)",
              color: "hsl(240,5%,90%)",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: `${npc.borderColor}30`, color: npc.borderColor, border: `1px solid ${npc.borderColor}50` }}>
            →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function buildNpcSystemPrompt(npc: WorldNPC, state: GameState): string {
  return `You are ${npc.name}, ${npc.title} of ${npc.realm}. You are ${npc.description}
You are a powerful ${npc.bloodline} being of the ${npc.realm} realm.
The player is ${state.name}, a ${state.bloodline} of ${state.realm}, age ${state.age}, 
with legacy score ${state.legacyScore} and cultivation rank ${state.mysticalPath !== "none" ? state.mysticalPath : "ungifted"}.
${state.legacyScore > 10000 ? "You grudgingly respect them as a worthy power." : state.legacyScore > 2000 ? "You see some potential in them." : "You barely notice them — they are insignificant to you."}
Speak in character — powerful, confident, with the voice of your bloodline and realm.
Keep responses short (2-4 sentences max). Be vivid, in-world, and immersive.
Never break character. You may be helpful, menacing, cryptic, or dismissive depending on your personality.`;
}

function getNpcGreeting(npc: WorldNPC, state: GameState): string {
  const greetings = [
    `*regards you slowly* You dare seek audience with ${npc.name}? State your purpose — quickly.`,
    `Ah. A ${state.bloodline} from ${state.realm}. How… quaint. What brings you before me?`,
    `I have destroyed nations for less than the interruption you've just caused. Speak. Now.`,
    `*glances up from ancient tome* You have thirty seconds. Use them wisely.`,
    `They told me someone was coming. I assumed they'd be more impressive. You may speak.`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
