import type { CultivatorRank } from "./cultivator";
import type { Talent } from "./talents";
import type { CosmicTier, FamilyRank } from "./imperialScale";

export type { Talent } from "./talents";
export type { CosmicTier, FamilyRank } from "./imperialScale";

export type StatKey =
  | "health" | "happiness" | "relationships" | "education" | "career"
  | "wealth" | "charisma" | "intelligence" | "strength" | "magic"
  | "reputation" | "faith" | "infamy" | "luck";

export type Stats = Record<StatKey, number>;

export type Bloodline =
  | "Common" | "Draconic" | "Elven" | "Infernal" | "Celestial"
  | "Fae" | "Werewolf" | "Undead" | "Void" | "Dwarvish" | "Orcish" | "Merfolk";

export type Realm =
  | "Mundus" | "Aethoria" | "Shadowmere" | "Celestia" | "Infernus"
  | "Sylvara" | "Ironhold" | "Tidehaven" | "Voidmere" | "Arcanum";

export type LifePhase =
  | "Infant" | "Child" | "Teen" | "Young Adult" | "Adult"
  | "Middle Age" | "Elder" | "Ancient";

export type Gender = "Male" | "Female" | "Other";

export type RomanceLevel = "none" | "mild" | "explicit";

export type MysticalPath =
  | "none"
  | "cultivation"
  | "arcane_magic"
  | "sacred_arts"
  | "rune_smith";

export type OutfitStyle = "warrior" | "noble" | "mage" | "rogue" | "monk" | "ranger";
export type Accessory = "none" | "crown" | "hood" | "mask" | "halo";

export interface CharacterAppearance {
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  eyeColor: string;
  skinColor: string;
  bodyType: string;
  facialHair: string;
}


export const OUTFIT_STYLES: { value: OutfitStyle; label: string; icon: string; desc: string }[] = [
  { value: "warrior", label: "Warrior",  icon: "⚔",  desc: "Battle-hardened armor and a ready sword" },
  { value: "noble",   label: "Noble",    icon: "👑",  desc: "Fine silks and the bearing of authority" },
  { value: "mage",    label: "Mage",     icon: "✦",   desc: "Flowing robes crackling with arcane energy" },
  { value: "rogue",   label: "Rogue",    icon: "🗡",  desc: "Dark leathers and the art of invisibility" },
  { value: "monk",    label: "Monk",     icon: "🧘",  desc: "Simple robes, deep discipline" },
  { value: "ranger",  label: "Ranger",   icon: "🏹",  desc: "Practical leathers, attuned to nature" },
];

export const ACCESSORY_OPTIONS: { value: Accessory; label: string; icon: string }[] = [
  { value: "none",  label: "None",  icon: "◦" },
  { value: "crown", label: "Crown", icon: "👑" },
  { value: "hood",  label: "Hood",  icon: "🪖" },
  { value: "mask",  label: "Mask",  icon: "🎭" },
  { value: "halo",  label: "Halo",  icon: "✨" },
];

export const MYSTICAL_PATH_NAMES: Record<MysticalPath, string> = {
  none: "Ungifted",
  cultivation: "Qi Cultivator",
  arcane_magic: "Arcanist",
  sacred_arts: "Sacred Artisan",
  rune_smith: "Rune Smith",
};

export const MYSTICAL_PATH_ICONS: Record<MysticalPath, string> = {
  none: "◦",
  cultivation: "⚡",
  arcane_magic: "✦",
  sacred_arts: "✵",
  rune_smith: "⬡",
};

export type ArcaneTier =
  | "Cantrip Learner" | "Spell Apprentice" | "Adept Mage"
  | "Battle Mage" | "Archmage" | "Grand Archmage" | "Transcendent Mage";

export type SacredTier =
  | "Initiate" | "Acolyte" | "Blessed One" | "Holy Warrior"
  | "Saint" | "Archangel Champion" | "Divine Vessel";

export type RuneTier =
  | "Scratch Learner" | "Rune Inscriber" | "Rune Caster"
  | "Rune Master" | "Rune Lord" | "Rune Sovereign" | "Rune God";

export type GeneticTrait =
  | "Gifted" | "Cursed" | "Blessed" | "Charismatic" | "Sickly"
  | "Strong" | "Wise" | "Mad" | "Prophetic" | "Immortal Seeker";

export type PartnerRole = "lover" | "consort" | "spouse";

export interface Partner {
  id: string;
  name: string;
  gender: Gender;
  affection: number;
  role: PartnerRole;
  age: number;
  trait: string;
}

export interface ChildRecord {
  name: string;
  gender: Gender;
  age: number;
  bloodline: Bloodline;
  talent?: Talent;
  appearance?: CharacterAppearance;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: "father" | "mother" | "sibling" | "grandparent";
  alive: boolean;
  bloodline: Bloodline;
  affection: number;
  age: number;
}

export interface InheritedSoul {
  parentName: string;
  generation: number;
  mysticalPath: MysticalPath;
  mysticalTier: number;
  legacyBonus: number;
  statBonus: Partial<Stats>;
  type: "progeny" | "reincarnation";
  inheritedProperty?: OwnedProperty;
  inheritedRivals?: string[];
}

export type PropertyType =
  | "Ramshackle Hut" | "Thatched Cottage" | "Stone Farmhouse" | "Riverside Cabin"
  | "Forest Lodge" | "Town Apartment" | "Merchant's Townhouse" | "Artisan Quarter Home"
  | "Guildmaster's Villa" | "Noble Manor" | "Seaside Estate" | "Hilltop Keep"
  | "Ancient Tower" | "Baronial Hall" | "Lord's Castle" | "Royal Palace"
  | "Sky Palace" | "Floating Isle" | "Underwater Grotto" | "Obsidian Fortress"
  | "Market Stall" | "Roadside Inn" | "Village Tavern" | "Blacksmith's Forge"
  | "Apothecary Shop" | "Bookshop" | "Alchemist's Den" | "Jeweler's Workshop"
  | "Cartographer's Office" | "Moneylender's Bureau" | "Trading Post"
  | "Merchant's Emporium" | "Grand Bazaar" | "Harbor Warehouse"
  | "Import/Export Office" | "Auction House" | "Bank Branch" | "Royal Mint"
  | "Trade Guild HQ" | "Corporation Tower"
  | "Vegetable Plot" | "Wheat Farm" | "Vineyard" | "Orchard" | "Cattle Ranch"
  | "Sheep Pasture" | "Fishing Pond" | "Timber Mill" | "Stone Quarry"
  | "Iron Mine" | "Coal Mine" | "Gold Mine" | "Diamond Mine" | "Salt Flats"
  | "Magical Herb Garden" | "Monster Farm" | "Enchanted Forest Plot"
  | "Sea Kelp Plantation" | "Cloud Farm" | "Volcano Forge Works"
  | "Wizard's Study" | "Alchemical Laboratory" | "Enchanting Chamber"
  | "Divination Parlor" | "Summoning Circle" | "Runic Archive"
  | "Astral Observatory" | "Nexus Point" | "Ley Line Junction"
  | "Dimensional Pocket" | "Bound Spirit Vessel" | "Dragon's Lair"
  | "Fae Ring" | "Celestial Altar" | "Void Shard" | "Necromancer's Vault"
  | "Oracle's Temple" | "Arcane Academy Wing" | "Mana Spring"
  | "Heaven's Gate Fragment"
  | "City District" | "Village" | "Farmlands" | "Forest Reserve"
  | "Mountain Pass" | "Island" | "Peninsula" | "Desert Oasis"
  | "Coastal Harbor" | "Swampland" | "Frozen Tundra" | "Volcanic Plains"
  | "Sky Island" | "Undersea Kingdom" | "Dimensional Realm"
  | "Thieves' Guild Den" | "Assassin's Safehouse" | "Pirate Cove"
  | "Rebel Stronghold" | "Ancient Ruin Site" | "Sunken Treasure Ship"
  | "Cursed Tomb" | "Holy Sanctuary" | "Emperor's Throne Room"
  | "Chronicle's End Vault"
  | "Qi Meditation Cave" | "Martial Sect Grounds" | "Dragon Vein Node"
  | "Ancient Cultivation Manual" | "Heavenly Dao Altar"
  | "Arcane Spellbook Vault" | "Sacred Shrine" | "Rune Forge";

export type PropertyCategory =
  | "Residential" | "Commercial" | "Agricultural" | "Magical"
  | "Territory" | "Legendary" | "Cultivation";

export interface OwnedProperty {
  type: PropertyType;
  category: PropertyCategory;
  acquiredAge: number;
}

export const PROPERTY_CATEGORIES: Record<PropertyType, PropertyCategory> = {
  "Ramshackle Hut":"Residential","Thatched Cottage":"Residential","Stone Farmhouse":"Residential",
  "Riverside Cabin":"Residential","Forest Lodge":"Residential","Town Apartment":"Residential",
  "Merchant's Townhouse":"Residential","Artisan Quarter Home":"Residential","Guildmaster's Villa":"Residential",
  "Noble Manor":"Residential","Seaside Estate":"Residential","Hilltop Keep":"Residential",
  "Ancient Tower":"Residential","Baronial Hall":"Residential","Lord's Castle":"Residential",
  "Royal Palace":"Residential","Sky Palace":"Residential","Floating Isle":"Residential",
  "Underwater Grotto":"Residential","Obsidian Fortress":"Residential",
  "Market Stall":"Commercial","Roadside Inn":"Commercial","Village Tavern":"Commercial",
  "Blacksmith's Forge":"Commercial","Apothecary Shop":"Commercial","Bookshop":"Commercial",
  "Alchemist's Den":"Commercial","Jeweler's Workshop":"Commercial","Cartographer's Office":"Commercial",
  "Moneylender's Bureau":"Commercial","Trading Post":"Commercial","Merchant's Emporium":"Commercial",
  "Grand Bazaar":"Commercial","Harbor Warehouse":"Commercial","Import/Export Office":"Commercial",
  "Auction House":"Commercial","Bank Branch":"Commercial","Royal Mint":"Commercial",
  "Trade Guild HQ":"Commercial","Corporation Tower":"Commercial",
  "Vegetable Plot":"Agricultural","Wheat Farm":"Agricultural","Vineyard":"Agricultural",
  "Orchard":"Agricultural","Cattle Ranch":"Agricultural","Sheep Pasture":"Agricultural",
  "Fishing Pond":"Agricultural","Timber Mill":"Agricultural","Stone Quarry":"Agricultural",
  "Iron Mine":"Agricultural","Coal Mine":"Agricultural","Gold Mine":"Agricultural",
  "Diamond Mine":"Agricultural","Salt Flats":"Agricultural","Magical Herb Garden":"Agricultural",
  "Monster Farm":"Agricultural","Enchanted Forest Plot":"Agricultural","Sea Kelp Plantation":"Agricultural",
  "Cloud Farm":"Agricultural","Volcano Forge Works":"Agricultural",
  "Wizard's Study":"Magical","Alchemical Laboratory":"Magical","Enchanting Chamber":"Magical",
  "Divination Parlor":"Magical","Summoning Circle":"Magical","Runic Archive":"Magical",
  "Astral Observatory":"Magical","Nexus Point":"Magical","Ley Line Junction":"Magical",
  "Dimensional Pocket":"Magical","Bound Spirit Vessel":"Magical","Dragon's Lair":"Magical",
  "Fae Ring":"Magical","Celestial Altar":"Magical","Void Shard":"Magical",
  "Necromancer's Vault":"Magical","Oracle's Temple":"Magical","Arcane Academy Wing":"Magical",
  "Mana Spring":"Magical","Heaven's Gate Fragment":"Magical",
  "City District":"Territory","Village":"Territory","Farmlands":"Territory",
  "Forest Reserve":"Territory","Mountain Pass":"Territory","Island":"Territory",
  "Peninsula":"Territory","Desert Oasis":"Territory","Coastal Harbor":"Territory",
  "Swampland":"Territory","Frozen Tundra":"Territory","Volcanic Plains":"Territory",
  "Sky Island":"Territory","Undersea Kingdom":"Territory","Dimensional Realm":"Territory",
  "Thieves' Guild Den":"Legendary","Assassin's Safehouse":"Legendary","Pirate Cove":"Legendary",
  "Rebel Stronghold":"Legendary","Ancient Ruin Site":"Legendary","Sunken Treasure Ship":"Legendary",
  "Cursed Tomb":"Legendary","Holy Sanctuary":"Legendary","Emperor's Throne Room":"Legendary",
  "Chronicle's End Vault":"Legendary",
  "Qi Meditation Cave":"Cultivation","Martial Sect Grounds":"Cultivation","Dragon Vein Node":"Cultivation",
  "Ancient Cultivation Manual":"Cultivation","Heavenly Dao Altar":"Cultivation",
  "Arcane Spellbook Vault":"Cultivation","Sacred Shrine":"Cultivation","Rune Forge":"Cultivation",
};

export const PATH_CURRENCY_NAMES: Record<MysticalPath, string> = {
  none:         "Gold",
  cultivation:  "Qi Energy",
  arcane_magic: "Mana Crystals",
  sacred_arts:  "Divine Favor",
  rune_smith:   "Rune Essence",
};

export const PATH_CURRENCY_ICONS: Record<MysticalPath, string> = {
  none:         "🪙",
  cultivation:  "⚡",
  arcane_magic: "🔵",
  sacred_arts:  "✵",
  rune_smith:   "⬡",
};

export interface GameState {
  isAlive: boolean;
  name: string;
  gender: Gender;
  bloodline: Bloodline;
  realm: Realm;
  age: number;
  stats: Stats;
  traits: GeneticTrait[];
  eventLog: string[];
  achievements: string[];
  dnaSeed: number;
  deathCause?: string;
  legacyScore: number;
  properties: OwnedProperty[];
  triggeredEvents: string[];
  romanceLevel: RomanceLevel;
  mysticalPath: MysticalPath;
  mysticalTier: number;
  mysticalExp: number;
  cultivatorRank?: CultivatorRank;
  cultivatorExp?: number;
  actionsThisYear: number;
  partners: Partner[];
  children: ChildRecord[];
  inheritedSoul?: InheritedSoul;
  generation: number;
  // New fields
  talent: Talent;
  familyName: string;
  familyMembers: FamilyMember[];
  outfitStyle: OutfitStyle;
  accessory: Accessory;
  appearance?: CharacterAppearance;
  exploredLocations: string[];
  visitedRealms: string[];
  isBossMode: boolean;
  cosmicTier: string;
  familyRank: string;
  clan?: string;
  activeJob?: string;
  delayedEvents: { eventId: string; triggerAge: number }[];
  activeStance?: FocusStance;
  scenario: string;
  inventory: string[];
  titles: string[];
  isChronicling?: boolean;
  abilities: string[];
  cutscene?: CutsceneData;
}

export interface CutsceneData {
  title: string;
  text: string;
  image?: string;
  choices: { text: string; onClickId: string }[];
}

export type FocusStance = "Balanced" | "Aggressive Expansion" | "Deep Cultivation" | "Social Climbing" | "Survival";
