import { Realm } from "./types";

export interface RealmTheme {
  name: Realm;
  bg: string;
  bgGradient: string;
  headerBg: string;
  navBg: string;
  accent: string;
  accentGlow: string;
  borderColor: string;
  parchmentBg: string;
  particleColor: string;
  particles: string[];
  ambientDesc: string;
  skyColor: string;
  cardBg: string;
}

export const REALM_THEMES: Record<Realm, RealmTheme> = {
  Mundus: {
    name: "Mundus",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#3b82f6", // tailwind blue-500
    accentGlow: "rgba(59,130,246,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#3b82f6",
    particles: ["★", "◦", "·", "○"],
    ambientDesc: "The city hums with distant machinery and whispered ambitions.",
    skyColor: "#bfdbfe",
    cardBg: "var(--ca-panel)",
  },
  Aethoria: {
    name: "Aethoria",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#eab308", // tailwind yellow-500
    accentGlow: "rgba(234,179,8,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#eab308",
    particles: ["✦", "⚔", "◈", "✵"],
    ambientDesc: "Ancient banners snap in the wind above cobbled stone streets.",
    skyColor: "#fef08a",
    cardBg: "var(--ca-panel)",
  },
  Shadowmere: {
    name: "Shadowmere",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#a855f7", // tailwind purple-500
    accentGlow: "rgba(168,85,247,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#a855f7",
    particles: ["☽", "✦", "◉", "✧"],
    ambientDesc: "Eternal dusk casts long violet shadows across cursed lands.",
    skyColor: "#e9d5ff",
    cardBg: "var(--ca-panel)",
  },
  Celestia: {
    name: "Celestia",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#f59e0b", // tailwind amber-500
    accentGlow: "rgba(245,158,11,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#f59e0b",
    particles: ["✵", "✦", "☀", "◈"],
    ambientDesc: "Divine light bathes golden spires in endless radiance.",
    skyColor: "#fde68a",
    cardBg: "var(--ca-panel)",
  },
  Infernus: {
    name: "Infernus",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#ef4444", // tailwind red-500
    accentGlow: "rgba(239,68,68,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#ef4444",
    particles: ["🔥", "◆", "✦", "⬟"],
    ambientDesc: "Rivers of molten stone flow beneath a sky choked with ash.",
    skyColor: "#fecaca",
    cardBg: "var(--ca-panel)",
  },
  Sylvara: {
    name: "Sylvara",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#22c55e", // tailwind green-500
    accentGlow: "rgba(34,197,94,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#22c55e",
    particles: ["🌸", "✦", "◦", "❋"],
    ambientDesc: "Ancient trees whisper secrets older than memory itself.",
    skyColor: "#bbf7d0",
    cardBg: "var(--ca-panel)",
  },
  Ironhold: {
    name: "Ironhold",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#8b5cf6", // tailwind violet-500
    accentGlow: "rgba(139,92,246,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#8b5cf6",
    particles: ["⛏", "◆", "⬡", "⬢"],
    ambientDesc: "The rhythm of hammers on anvils echoes through stone halls.",
    skyColor: "#ddd6fe",
    cardBg: "var(--ca-panel)",
  },
  Tidehaven: {
    name: "Tidehaven",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#0ea5e9", // tailwind sky-500
    accentGlow: "rgba(14,165,233,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#0ea5e9",
    particles: ["🌊", "◦", "○", "✦"],
    ambientDesc: "Salt-wind carries the cries of gulls above the eternal tide.",
    skyColor: "#bae6fd",
    cardBg: "var(--ca-panel)",
  },
  Voidmere: {
    name: "Voidmere",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#14b8a6", // tailwind teal-500
    accentGlow: "rgba(20,184,166,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#14b8a6",
    particles: ["◈", "✧", "◌", "⊗"],
    ambientDesc: "Silence reigns where even death fears to dwell.",
    skyColor: "#ccfbf1",
    cardBg: "var(--ca-panel)",
  },
  Arcanum: {
    name: "Arcanum",
    bg: "var(--ca-bg)",
    bgGradient: "none",
    headerBg: "var(--ca-panel)",
    navBg: "var(--ca-panel)",
    accent: "#d946ef", // tailwind fuchsia-500
    accentGlow: "rgba(217,70,239,0.3)",
    borderColor: "var(--ca-border)",
    parchmentBg: "var(--ca-bg)",
    particleColor: "#d946ef",
    particles: ["✦", "◈", "⊕", "✧"],
    ambientDesc: "Spellfire crackles through the floating towers of the mage city.",
    skyColor: "#fbcfe8",
    cardBg: "var(--ca-panel)",
  },
};

export function getRealmTheme(realm: Realm): RealmTheme {
  return REALM_THEMES[realm] ?? REALM_THEMES.Aethoria;
}
