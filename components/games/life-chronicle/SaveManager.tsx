import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/games/life-chronicle/engine/GameContext";
import { usePlayerProfile } from "@/components/games/life-chronicle/hooks/usePlayerProfile";

interface SaveSlot {
  id: number;
  playerId: string;
  slotName: string;
  characterName: string;
  age: number;
  realm: string;
  bloodline: string;
  wealth: number;
  legacyScore: number;
  gameStateJson: string;
  createdAt: string;
  updatedAt: string;
}

interface SaveManagerProps {
  onClose: () => void;
  onLoad?: () => void;
}

export default function SaveManager({ onClose, onLoad }: SaveManagerProps) {
  const { state, loadGameState } = useGame();
  const { getOrCreate } = usePlayerProfile();
  
  // Mock Clerk user context for Nexus OS
  const isSignedIn = true;
  const user = { id: getOrCreate().playerId, firstName: "Nexus", emailAddresses: [{ emailAddress: "user@nexus" }] };

  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const basePath = "";

  const playerId = isSignedIn && user?.id
    ? user.id
    : getOrCreate().playerId;

  const fetchSaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/saves?playerId=${encodeURIComponent(playerId)}`);
      if (res.ok) {
        const data = await res.json();
        setSaves(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSaves(); }, [playerId]);

  const handleSave = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const body = {
        playerId,
        slotName: `Save ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        characterName: state.name,
        age: state.age,
        realm: state.realm,
        bloodline: state.bloodline,
        wealth: Math.round(state.stats.wealth),
        legacyScore: state.legacyScore,
        gameStateJson: JSON.stringify(state),
      };
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setFeedback({ msg: isSignedIn ? "Saved to your cloud account!" : "Saved locally (sign in to sync across devices).", ok: true });
        fetchSaves();
      } else {
        setFeedback({ msg: "Save failed. Try again.", ok: false });
      }
    } catch {
      setFeedback({ msg: "Save failed — connection error.", ok: false });
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleLoad = (slot: SaveSlot) => {
    try {
      const gs = JSON.parse(slot.gameStateJson);
      loadGameState(gs);
      setFeedback({ msg: `Loaded: ${slot.characterName}, Age ${slot.age}`, ok: true });
      setTimeout(() => { onLoad?.(); onClose(); }, 1000);
    } catch {
      setFeedback({ msg: "Failed to load save.", ok: false });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/saves/${id}`, { method: "DELETE" });
      setSaves(s => s.filter(x => x.id !== id));
      setConfirmDelete(null);
    } catch {}
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background: "#17191e", borderColor: "rgba(244,175,37,0.22)" }}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="font-serif font-bold text-lg" style={{ color: "#F4AF25" }}>Cloud Saves</h2>
            <p className="text-xs mt-0.5" style={{ color: "#878792" }}>
              {isSignedIn
                ? `${user?.firstName || user?.emailAddresses[0]?.emailAddress || "Chronicler"} · saves sync across devices`
                : "Guest — saves stored locally on this device"}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">✕</button>
        </div>

        {/* Sign-in nudge for guests */}
        {!isSignedIn && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(244,175,37,0.07)", border: "1px solid rgba(244,175,37,0.2)" }}>
            <span className="text-lg">☁</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: "#ffd085" }}>Sign in to sync saves</p>
              <p className="text-xs" style={{ color: "#878792" }}>Access your saves on any device.</p>
            </div>
            <a href={`${basePath}/sign-in`}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all"
              style={{ background: "rgba(244,175,37,0.18)", color: "#F4AF25", border: "1px solid rgba(244,175,37,0.35)" }}>
              Sign in
            </a>
          </div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs font-medium"
              style={{
                background: feedback.ok ? "rgba(80,208,128,0.12)" : "rgba(224,80,80,0.12)",
                color: feedback.ok ? "#50d080" : "#e05050",
                border: `1px solid ${feedback.ok ? "#50d08030" : "#e0505030"}`,
              }}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save current game */}
        {state && (
          <div className="px-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl font-serif font-bold text-sm transition-all"
              style={{
                background: saving ? "rgba(244,175,37,0.08)" : "rgba(244,175,37,0.14)",
                border: "1px solid rgba(244,175,37,0.32)",
                color: "#F4AF25",
                opacity: saving ? 0.7 : 1,
              }}>
              {saving ? "Saving…" : `☁ Save ${state.name} (Age ${state.age})`}
            </button>
          </div>
        )}

        {/* Save list */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading saves…</div>
          ) : saves.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No saves found.</p>
              <p className="text-xs mt-1" style={{ color: "#878792" }}>Save your current game above.</p>
            </div>
          ) : (
            saves.map(slot => (
              <div key={slot.id} className="rounded-xl border p-3"
                style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-serif font-bold text-sm truncate" style={{ color: "#ffd085" }}>
                      {slot.characterName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Age {slot.age} · {slot.bloodline} · {slot.realm}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#878792" }}>
                      ✵ {slot.legacyScore.toLocaleString()} legacy
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#515160" }}>
                      {new Date(slot.updatedAt).toLocaleDateString()} {new Date(slot.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoad(slot)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "rgba(80,160,255,0.14)", color: "#80c0ff", border: "1px solid rgba(80,160,255,0.28)" }}>
                      Load
                    </button>
                    {confirmDelete === slot.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(slot.id)}
                          className="px-2 py-1 rounded text-xs" style={{ background: "rgba(224,80,80,0.25)", color: "#e05050" }}>
                          Yes
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 rounded text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "#8898a8" }}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(slot.id)}
                        className="px-3 py-1 rounded-lg text-xs transition-all"
                        style={{ background: "rgba(224,80,80,0.07)", color: "#e05050", border: "1px solid rgba(224,80,80,0.18)" }}>
                        Del
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </motion.div>
    </motion.div>
  );
}
