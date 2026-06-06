import { Stats } from "./types";

export interface Scenario {
  id: string;
  name: string;
  description: string;
  statsModifiers: Partial<Stats>;
  startingWealth: number;
  legacyMultiplier: number;
  fixedRealm?: string;
  initialProperties?: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "commoner",
    name: "Commoner",
    description: "A normal start. No special advantages or disadvantages.",
    statsModifiers: {},
    startingWealth: 0,
    legacyMultiplier: 1.0,
  },
  {
    id: "orphan",
    name: "Street Orphan",
    description: "You start with nothing but your street smarts. High infamy and luck, low health and wealth.",
    statsModifiers: { health: -20, happiness: -10, infamy: 20, luck: 15 },
    startingWealth: 0,
    legacyMultiplier: 1.5,
  },
  {
    id: "fallen_noble",
    name: "Fallen Noble",
    description: "Your family lost everything. You start with education and charisma, but negative wealth and high stress.",
    statsModifiers: { education: 20, charisma: 15, happiness: -20, reputation: -10 },
    startingWealth: -50,
    legacyMultiplier: 1.2,
  },
  {
    id: "chosen_one",
    name: "Chosen One",
    description: "Marked by destiny. High magic and luck, but you attract dangerous enemies (high infamy).",
    statsModifiers: { magic: 30, luck: 20, infamy: 30 },
    startingWealth: 10,
    legacyMultiplier: 0.8,
  },
  {
    id: "merchant_heir",
    name: "Merchant Heir",
    description: "Born into wealth. You start with money and properties, but poor health and magic.",
    statsModifiers: { health: -10, magic: -20, intelligence: 10 },
    startingWealth: 500,
    initialProperties: ["Commercial"],
    legacyMultiplier: 0.9,
  }
];
