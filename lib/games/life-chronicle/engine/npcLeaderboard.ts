export interface WorldNPC {
  name: string;
  title: string;
  bloodline: string;
  realm: string;
  category: "cultivator" | "mage" | "wealth" | "power" | "influence" | "infamy";
  power: number;
  description: string;
  icon: string;
  familyName?: string;
  empire?: string;
  cosmicTier?: string;
  borderColor: string;
}

export const WORLD_NPCS: WorldNPC[] = [
  // CULTIVATORS
  {
    name: "Chu Feng", title: "Martial Immortal", bloodline: "Void", realm: "Voidmere",
    category: "cultivator", power: 99800,
    description: "The Heaven Defying Cultivator who rose from nothing to shake the nine heavens.",
    icon: "⚡", familyName: "Clan Feng", empire: "Void Dominion", cosmicTier: "Universe",
    borderColor: "#f0a830",
  },
  {
    name: "Ye Xiao", title: "Martial Ancestor", bloodline: "Draconic", realm: "Aethoria",
    category: "cultivator", power: 88400,
    description: "Dragon-blooded warrior whose breakthrough left craters across three kingdoms.",
    icon: "🐉", familyName: "House Xiao", empire: "Dragon Empire", cosmicTier: "Galaxy",
    borderColor: "#f0a830",
  },
  {
    name: "Lin Feng", title: "Martial Emperor", bloodline: "Celestial", realm: "Celestia",
    category: "cultivator", power: 71200,
    description: "Holy Emperor whose Qi field extends three hundred li in every direction.",
    icon: "✵", familyName: "Dynasty Lin", empire: "Celestial Kingdom", cosmicTier: "Planet",
    borderColor: "#f0a830",
  },
  {
    name: "Meng Qing", title: "Martial Exalted", bloodline: "Fae", realm: "Sylvara",
    category: "cultivator", power: 94600,
    description: "The Ghost Empress whose soul techniques can split mountains with a whisper.",
    icon: "🌸", familyName: "Circle Qing", empire: "Sylvan Sovereignty", cosmicTier: "Galaxy",
    borderColor: "#f0a830",
  },
  {
    name: "Long Chen", title: "Half Martial Immortal", bloodline: "Draconic", realm: "Aethoria",
    category: "cultivator", power: 96100,
    description: "The Dragon Prince who challenged the heavens and forced them to retreat.",
    icon: "🔥", familyName: "Lineage Long", empire: "Dragon Empire", cosmicTier: "Universe",
    borderColor: "#f0a830",
  },
  {
    name: "Zi Xun", title: "Martial Ancestor", bloodline: "Void", realm: "Voidmere",
    category: "cultivator", power: 82000,
    description: "Void Seeker who dissolved three Martial Emperors in a single breath.",
    icon: "◈", familyName: "Order Xun", empire: "Void Dominion", cosmicTier: "Planet",
    borderColor: "#f0a830",
  },

  // MAGES
  {
    name: "Valdris Mourne", title: "Archmage Supreme", bloodline: "Elven", realm: "Arcanum",
    category: "mage", power: 97200,
    description: "The floating city of Arcanum exists because Valdris willed it into being — twice.",
    icon: "✦", familyName: "House Mourne", empire: "Arcane Concordat", cosmicTier: "Universe",
    borderColor: "#8080f0",
  },
  {
    name: "The Pale Weave", title: "Unbound Sorcerer", bloodline: "Undead", realm: "Shadowmere",
    category: "mage", power: 91500,
    description: "A lich whose grimoire is rewritten by reality itself each night.",
    icon: "💀", familyName: "Covenant Weave", empire: "Shadow Dominion", cosmicTier: "Galaxy",
    borderColor: "#8080f0",
  },
  {
    name: "Seraphel Voss", title: "Celestial Arcanist", bloodline: "Celestial", realm: "Celestia",
    category: "mage", power: 89000,
    description: "Her spells are not cast — they are remembered by the universe from before creation.",
    icon: "☀", familyName: "Dynasty Voss", empire: "Celestial Kingdom", cosmicTier: "Galaxy",
    borderColor: "#8080f0",
  },

  // WEALTH
  {
    name: "Thane Goldbrace", title: "High King of Commerce", bloodline: "Dwarvish", realm: "Ironhold",
    category: "wealth", power: 99100,
    description: "Controls 70% of all mineral trade across the known realms. Owns four mountains.",
    icon: "⛏", familyName: "Clan Goldbrace", empire: "Iron Federation", cosmicTier: "Universe",
    borderColor: "#50d080",
  },
  {
    name: "Mirova Silk", title: "Sea Empress of Trade", bloodline: "Merfolk", realm: "Tidehaven",
    category: "wealth", power: 96800,
    description: "Every ship crossing the Eternal Tide pays tribute to Mirova — whether they know it or not.",
    icon: "🌊", familyName: "Dynasty Silk", empire: "Tidal Empire", cosmicTier: "Galaxy",
    borderColor: "#50d080",
  },
  {
    name: "Asher Vant", title: "Shadow Banker", bloodline: "Common", realm: "Mundus",
    category: "wealth", power: 88200,
    description: "The richest mortal alive — built an empire without a single drop of magic.",
    icon: "◈", familyName: "House Vant", empire: "Mundus Consortium", cosmicTier: "Planet",
    borderColor: "#50d080",
  },

  // POWER (Political)
  {
    name: "The Crimson Emperor", title: "Ruler of Infernus", bloodline: "Infernal", realm: "Infernus",
    category: "power", power: 98500,
    description: "His decree is written in brimstone. Twelve demon lords kneel at his gate.",
    icon: "🔥", familyName: "Imperial Blood", empire: "Infernal Dominion", cosmicTier: "Universe",
    borderColor: "#e05050",
  },
  {
    name: "Queen Lyraen", title: "Eternal Sovereign", bloodline: "Elven", realm: "Sylvara",
    category: "power", power: 93400,
    description: "Has ruled the ancient forest for 4,200 years. Her decrees predate most civilizations.",
    icon: "✦", familyName: "Dynasty Lyraen", empire: "Sylvan Sovereignty", cosmicTier: "Galaxy",
    borderColor: "#e05050",
  },
  {
    name: "Vorn the Unbroken", title: "Warlord Supreme", bloodline: "Orcish", realm: "Aethoria",
    category: "power", power: 87000,
    description: "Conquered twenty kingdoms through sheer war-craft. Never lost a siege.",
    icon: "🪓", familyName: "Clan Vorn", empire: "War Confederation", cosmicTier: "Continent",
    borderColor: "#e05050",
  },

  // INFLUENCE
  {
    name: "The Silver Oracle", title: "Prophet of Ages", bloodline: "Celestial", realm: "Celestia",
    category: "influence", power: 95700,
    description: "Her prophecies have never been wrong. Every nation sends envoys to hear her whisper.",
    icon: "🔮", familyName: "Circle Oracle", empire: "Celestial Kingdom", cosmicTier: "Universe",
    borderColor: "#c060e0",
  },
  {
    name: "Kira Dusk", title: "Goddess of Stories", bloodline: "Fae", realm: "Sylvara",
    category: "influence", power: 90200,
    description: "Half the world worships characters she invented. The other half became them.",
    icon: "🌸", familyName: "Order Dusk", empire: "Sylvan Sovereignty", cosmicTier: "Galaxy",
    borderColor: "#c060e0",
  },

  // INFAMY
  {
    name: "The Hollow King", title: "Death Lord of Voidmere", bloodline: "Undead", realm: "Voidmere",
    category: "infamy", power: 99400,
    description: "Destroyed an entire continent as a hobby. Still considered a regional nuisance.",
    icon: "💀", familyName: "Legion Hollow", empire: "Death Domain", cosmicTier: "Universe",
    borderColor: "#e0a040",
  },
  {
    name: "Rhas'kul", title: "The Annihilator", bloodline: "Void", realm: "Voidmere",
    category: "infamy", power: 97800,
    description: "Existence record: 12 civilizations ended, 3 pantheons dissolved, 1 moon eaten.",
    icon: "◈", familyName: "Blood Rhas", empire: "Void Dominion", cosmicTier: "Universe",
    borderColor: "#e0a040",
  },
  {
    name: "Sera Nightblade", title: "Master Assassin", bloodline: "Infernal", realm: "Shadowmere",
    category: "infamy", power: 84600,
    description: "Every kingdom has a price on her head. She collects them for interior decoration.",
    icon: "🗡", familyName: "Guild Nightblade", empire: "Shadow Dominion", cosmicTier: "Empire",
    borderColor: "#e0a040",
  },
];

export const CATEGORY_LABELS: Record<WorldNPC["category"], string> = {
  cultivator: "Cultivators",
  mage: "Archmages",
  wealth: "Wealthiest",
  power: "Most Powerful",
  influence: "Most Influential",
  infamy: "Most Feared",
};

export const CATEGORY_ICONS: Record<WorldNPC["category"], string> = {
  cultivator: "⚡",
  mage: "✦",
  wealth: "◈",
  power: "⚔",
  influence: "🔮",
  infamy: "💀",
};

export const CATEGORY_BORDER: Record<WorldNPC["category"], string> = {
  cultivator: "#f0a830",
  mage:       "#8080f0",
  wealth:     "#50d080",
  power:      "#e05050",
  influence:  "#c060e0",
  infamy:     "#e0a040",
};
