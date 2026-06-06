import { useState, useEffect, useCallback } from "react";

export interface PlayerProfile {
  playerId: string;
  displayName: string;
  createdAt: string;
}

const PROFILE_KEY = "chronicle_player_profile";

function generateId(): string {
  return crypto.randomUUID();
}

function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as PlayerProfile;
  } catch {}
  return null;
}

function persistProfile(p: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {}
}

export function usePlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(() => loadProfile());
  const [isEditing, setIsEditing] = useState(false);

  const createProfile = useCallback((displayName: string) => {
    const p: PlayerProfile = {
      playerId: generateId(),
      displayName: displayName.trim() || "Wanderer",
      createdAt: new Date().toISOString(),
    };
    persistProfile(p);
    setProfile(p);
    return p;
  }, []);

  const updateName = useCallback((name: string) => {
    if (!profile) return;
    const updated = { ...profile, displayName: name.trim() || profile.displayName };
    persistProfile(updated);
    setProfile(updated);
  }, [profile]);

  const clearProfile = useCallback(() => {
    try { localStorage.removeItem(PROFILE_KEY); } catch {}
    setProfile(null);
  }, []);

  const getOrCreate = useCallback((displayName?: string): PlayerProfile => {
    const existing = loadProfile();
    if (existing) return existing;
    return createProfile(displayName ?? "Wanderer");
  }, [createProfile]);

  return {
    profile,
    isEditing,
    setIsEditing,
    createProfile,
    updateName,
    clearProfile,
    getOrCreate,
    hasProfile: profile !== null,
  };
}
