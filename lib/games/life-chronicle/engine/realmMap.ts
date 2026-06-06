import type { Realm } from "./types";
import type { Stats, MysticalPath } from "./types";

export interface MapLocation {
  id: string;
  name: string;
  icon: string;
  desc: string;
  flavorText: string;
  minStat?: { key: keyof Stats; min: number };
  reqPath?: MysticalPath;
  effects: Partial<Stats>;
  mysticalExp?: number;
  cultivatorExp?: number;
  log: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  danger?: boolean;
  itemGain?: string;
  titleGain?: string;
}

export const REALM_MAPS: Record<Realm, MapLocation[]> = {
  Mundus: [
    { id:"mundus_market",   name:"Grand Market",       icon:"🏪", rarity:"common",    desc:"Bustling trade hub of the city",                flavorText:"The scent of spice and coin fills the air.",              effects:{ wealth:8, charisma:3 },              log:"traded goods and made connections at the Grand Market"                },
    { id:"mundus_library",  name:"City Archives",      icon:"📚", rarity:"common",    desc:"Centuries of knowledge stored within",           flavorText:"Dust motes drift through shafts of reading-lamp light.",  effects:{ intelligence:8, education:6 },       log:"spent hours in the city archives, learning forgotten lore"           },
    { id:"mundus_arena",    name:"The Iron Arena",     icon:"⚔",  rarity:"uncommon",  desc:"Gladiatorial combat rings",                      flavorText:"The crowd roars. Blood and glory await.",                 effects:{ strength:12, reputation:8 },         log:"fought (and survived) in the Iron Arena — crowds chanted your name", danger:true, minStat:{ key:"strength", min:40 } },
    { id:"mundus_slums",    name:"Shadow Quarter",     icon:"🗡",  rarity:"common",    desc:"The criminal underbelly of the city",            flavorText:"Eyes watch from every alley.",                            effects:{ infamy:8, wealth:6 },                log:"navigated the Shadow Quarter and made shadowy acquaintances"         },
    { id:"mundus_temple",   name:"Temple of Order",    icon:"⛩",  rarity:"uncommon",  desc:"Sacred halls of law and divine order",           flavorText:"Candlelight and incense — peace that costs dearly.",      effects:{ faith:12, reputation:8, happiness:6 },log:"prayed at the Temple of Order and felt divine presence"              },
    { id:"mundus_guild",    name:"Adventurers' Guild", icon:"🏛",  rarity:"uncommon",  desc:"Where legends are forged and hired out",         flavorText:"Job boards. Eager faces. The smell of steel.",            effects:{ career:10, reputation:6, strength:4 },log:"took a contract at the Adventurers' Guild", titleGain: "Guild Member"                           },
    { id:"mundus_vault",    name:"Royal Vault",        icon:"💰",  rarity:"legendary", desc:"The city's most guarded treasury",               flavorText:"Gold beyond imagination… and guards to match.",           effects:{ wealth:25 },                         log:"infiltrated the Royal Vault and left considerably richer", danger:true, minStat:{ key:"luck", min:70 }, itemGain: "Royal Signet Ring" },
  ],
  Aethoria: [
    { id:"aethoria_ruins",  name:"Ancient Ruins",      icon:"🏚",  rarity:"uncommon",  desc:"Collapsed fortresses of a forgotten empire",    flavorText:"Stone giants sleep here, dreaming of war.",               effects:{ intelligence:8, magic:6, luck:4 },   log:"explored ancient ruins and unearthed forgotten secrets"              },
    { id:"aethoria_forest", name:"The King's Wood",    icon:"🌲",  rarity:"common",    desc:"Vast hunting ground reserved for nobility",     flavorText:"Birdsong and rustling leaves — and perhaps more.",        effects:{ strength:8, health:6 },              log:"hunted in the King's Wood and returned with fine game"               },
    { id:"aethoria_court",  name:"Imperial Court",     icon:"👑",  rarity:"rare",      desc:"Seat of the realm's political power",           flavorText:"Every smile here hides a dagger.",                        effects:{ charisma:12, reputation:15, career:8},log:"navigated the Imperial Court and made powerful allies", minStat:{ key:"charisma", min:50 } },
    { id:"aethoria_field",  name:"Battle Plains",      icon:"⚔",   rarity:"common",    desc:"Training ground turned legendary battlesite",   flavorText:"Ghost echoes of ten thousand clashing blades.",           effects:{ strength:10, reputation:6 },         log:"trained on the Battle Plains, honing combat instincts", danger:true },
    { id:"aethoria_bazaar", name:"Merchant's Bazaar",  icon:"🏪",  rarity:"common",    desc:"Trading post at the crossroads of three roads", flavorText:"Every tongue spoken, every currency accepted.",           effects:{ wealth:10, charisma:5 },             log:"cut sharp deals at the Merchant's Bazaar"                           },
    { id:"aethoria_shrine", name:"Hero's Shrine",      icon:"✵",   rarity:"rare",      desc:"Monument to fallen legends",                    flavorText:"Heroes are remembered here. Villains are not forgotten.",  effects:{ reputation:15, faith:8, luck:5 },    log:"knelt at the Hero's Shrine — felt the weight of destiny"            },
  ],
  Shadowmere: [
    { id:"shadow_crypts",   name:"The Sunken Crypts",  icon:"💀",  rarity:"uncommon",  desc:"Labyrinthine undead stronghold below the city", flavorText:"The dead are restless. They remember everything.",        effects:{ magic:12, infamy:8 },                log:"descended into the Sunken Crypts and emerged… changed", danger:true  },
    { id:"shadow_moon",     name:"Moon Observatory",   icon:"☽",   rarity:"rare",      desc:"Ancient tower attuned to lunar magic",          flavorText:"Under the full moon, the veil between worlds thins.",     effects:{ magic:15, luck:8 }, mysticalExp:30,  log:"studied the stars at the Moon Observatory — power flowed in"        },
    { id:"shadow_tavern",   name:"The Twilight Inn",   icon:"🍺",  rarity:"common",    desc:"Last warm hearth before the dark roads",        flavorText:"Stories, secrets, and strong drink in equal measure.",    effects:{ charisma:8, happiness:6, relationships:5 }, log:"spent a memorable evening at the Twilight Inn"           },
    { id:"shadow_coven",    name:"Witch's Coven",      icon:"🕯",  rarity:"rare",      desc:"A circle of ancient practitioners",              flavorText:"They deal in futures — for a price.",                     effects:{ magic:18, intelligence:8 }, mysticalExp:40, log:"joined a Witch's Coven ritual and felt the curse lift", minStat:{ key:"magic", min:30 } },
    { id:"shadow_gallows",  name:"The Hanging Tree",   icon:"🌑",  rarity:"uncommon",  desc:"Where enemies of the crown are displayed",      flavorText:"A lesson in power for those who understand it.",          effects:{ infamy:10, reputation:-5, intelligence:5 }, log:"studied the lessons carved into the wood at the Hanging Tree" },
  ],
  Celestia: [
    { id:"celes_spire",     name:"Heaven's Spire",     icon:"✦",  rarity:"rare",      desc:"A tower that pierces the clouds",                flavorText:"Stand here and feel the universe breathe.",               effects:{ magic:15, faith:12 }, mysticalExp:35, log:"climbed Heaven's Spire and touched the divine"                      },
    { id:"celes_garden",    name:"Eternal Gardens",    icon:"🌸",  rarity:"common",    desc:"Blossoms that never wilt in divine light",       flavorText:"Every petal holds a prayer from a thousand years ago.",   effects:{ happiness:15, health:8, faith:6 },  log:"wandered the Eternal Gardens and found peace"                       },
    { id:"celes_oracle",    name:"Oracle's Sanctum",   icon:"🔮",  rarity:"legendary", desc:"The seer who knows what you must not",          flavorText:"Her eyes hold the weight of ages. She knows you already.", effects:{ luck:20, intelligence:10 },          log:"received a prophecy at the Oracle's Sanctum — destiny shifted", minStat:{ key:"faith", min:60 } },
    { id:"celes_armory",    name:"Divine Armory",      icon:"⚔",   rarity:"uncommon",  desc:"Weapons blessed by the highest powers",          flavorText:"Steel that rings with sacred hymns.",                     effects:{ strength:12, reputation:8, faith:5 }, log:"trained with sacred weapons in the Divine Armory"                  },
    { id:"celes_choir",     name:"The Grand Choir",    icon:"🎵",  rarity:"common",    desc:"Thousands of voices singing in divine harmony",  flavorText:"Music here doesn't just move you — it changes you.",     effects:{ charisma:10, happiness:12, faith:8 }, log:"sang in the Grand Choir and moved a thousand hearts"               },
  ],
  Infernus: [
    { id:"inf_forge",       name:"The Eternal Forge",  icon:"🔥",  rarity:"uncommon",  desc:"Where weapons of dark legend are crafted",      flavorText:"Iron drinks fire here. Weapons dream of blood.",          effects:{ strength:12, magic:8 },              log:"forged a weapon of dark legend in the Eternal Forge"                },
    { id:"inf_pit",         name:"Demon's Pit",        icon:"💀",  rarity:"rare",      desc:"Combat arena for the darkest warriors",         flavorText:"Win here and even demons show respect.",                  effects:{ strength:18, infamy:15 },            log:"survived the Demon's Pit — earned the fear of all who watched", danger:true, minStat:{ key:"strength", min:60 } },
    { id:"inf_court",       name:"Infernal Court",     icon:"🔱",  rarity:"rare",      desc:"The political center of all dark power",        flavorText:"Twelve demon lords rule here. You are a footnote.",       effects:{ infamy:12, charisma:8, reputation:6 },log:"attended the Infernal Court and played political games"             },
    { id:"inf_lava",        name:"Lava Pools",         icon:"🌋",  rarity:"common",    desc:"Volcanic springs of immense power",              flavorText:"The heat here refines. Only the worthy survive.",         effects:{ health:8, strength:8, magic:5 },     log:"bathed in the lava pools — emerged stronger"                        },
    { id:"inf_vault",       name:"Devil's Vault",      icon:"💰",  rarity:"legendary", desc:"Accumulated wealth of a thousand sinners",      flavorText:"Everything in here was paid for with someone's soul.",    effects:{ wealth:30, infamy:15 },              log:"plundered the Devil's Vault and escaped by a hair", danger:true, minStat:{ key:"luck", min:65 } },
  ],
  Sylvara: [
    { id:"syl_grove",       name:"Ancient Grove",      icon:"🌳",  rarity:"common",    desc:"Trees older than civilization",                  flavorText:"The trees breathe. They remember you from before.",       effects:{ magic:10, health:8, luck:5 },        log:"communed with the Ancient Grove's living memory"                    },
    { id:"syl_spring",      name:"Fae Spring",         icon:"🌊",  rarity:"rare",      desc:"Magical pool with transformative properties",    flavorText:"A drink from this spring changes you forever — hopefully for better.", effects:{ luck:15, magic:12, happiness:8 }, log:"drank from the Fae Spring — something shifted inside" },
    { id:"syl_hunt",        name:"The Wild Hunt",      icon:"🐺",  rarity:"uncommon",  desc:"Ancient spectral hunt through the deep woods",  flavorText:"Run with them or be run down. No in between.",            effects:{ strength:12, luck:8, infamy:5 },     log:"rode with the Wild Hunt through the midnight forest", danger:true   },
    { id:"syl_court",       name:"Fae Court",          icon:"🌸",  rarity:"rare",      desc:"Capricious rulers of the enchanted realm",       flavorText:"Time passes differently here. You may leave older than you arrived.", effects:{ charisma:15, luck:12 }, log:"attended the Fae Court and survived the bargains unscathed", minStat:{ key:"luck", min:50 } },
    { id:"syl_ruin",        name:"Druid's Circle",     icon:"⭕",  rarity:"uncommon",  desc:"Stone circle crackling with leyline energy",    flavorText:"Power hums beneath your feet like a buried heart.",       effects:{ magic:14, intelligence:6 }, mysticalExp:25, log:"stood in the Druid's Circle and absorbed raw leyline power"  },
  ],
  Ironhold: [
    { id:"iron_mines",      name:"Deep Mines",         icon:"⛏",   rarity:"common",    desc:"Miles of tunnels hewn through living rock",     flavorText:"Rock and dark and the sound of picks. Wealth lives here.", effects:{ wealth:10, strength:6 },            log:"worked the Deep Mines and came up richer"                           },
    { id:"iron_forge",      name:"Grand Forge",        icon:"🔨",  rarity:"uncommon",  desc:"The finest smithing facility in any realm",     flavorText:"Metal screams as it becomes something greater.",           effects:{ strength:10, intelligence:8, career:6 }, log:"trained at the Grand Forge under master smiths"                  },
    { id:"iron_hall",       name:"Clan Hall",          icon:"🏛",   rarity:"common",    desc:"Meeting place of all the great dwarven clans",  flavorText:"Oaths sworn here echo forever in stone.",                 effects:{ reputation:10, relationships:8, wealth:5 }, log:"swore oaths at the Clan Hall and cemented alliances"           },
    { id:"iron_vault",      name:"The Deepest Vault",  icon:"💰",  rarity:"legendary", desc:"Legendary treasury sealed for 500 years",       flavorText:"The lock is a puzzle. The reward is unimaginable.",       effects:{ wealth:35 },                         log:"cracked the Deepest Vault — enough gold to sink a ship", minStat:{ key:"intelligence", min:70 } },
    { id:"iron_ruins",      name:"Runic Workshop",     icon:"⬡",   rarity:"rare",      desc:"Ancient rune-craft chamber of legendary make",  flavorText:"Runes carved here predate language itself.",              effects:{ magic:12, intelligence:10 }, mysticalExp:30, log:"inscribed ancient runes in the Runic Workshop"               },
  ],
  Tidehaven: [
    { id:"tide_harbor",     name:"The Grand Harbor",   icon:"⚓",  rarity:"common",    desc:"Largest port in all the known sea lanes",       flavorText:"Ships from a thousand lands. Every rumor arrives here first.", effects:{ wealth:8, charisma:6, relationships:5 }, log:"networked at the Grand Harbor among sailors and merchants"   },
    { id:"tide_deep",       name:"The Abyss Shelf",    icon:"🌊",  rarity:"rare",      desc:"An underwater shelf of unfathomable depth",     flavorText:"The dark below has eyes. And they are very old.",          effects:{ magic:15, luck:8, health:-5 },       log:"dived the Abyss Shelf and found things that should stay lost", danger:true },
    { id:"tide_temple",     name:"Sea God's Temple",   icon:"🔱",  rarity:"uncommon",  desc:"Dedicated to the deity of tides",                flavorText:"Offerings rot quickly here. The sea takes everything.",    effects:{ faith:12, magic:8, luck:8 },         log:"left an offering at the Sea God's Temple"                           },
    { id:"tide_market",     name:"Floating Market",    icon:"🛒",  rarity:"common",    desc:"Merchant barges lashed together at sea",         flavorText:"Prices change with the tides. So does loyalty.",          effects:{ wealth:12, charisma:6 },             log:"drove hard bargains at the Floating Market"                         },
    { id:"tide_lighthouse", name:"The Lost Lighthouse",icon:"🕯",  rarity:"legendary", desc:"Said to guide ships to legendary treasure",     flavorText:"Light that flickers in colors that have no name.",        effects:{ luck:20, intelligence:8 },           log:"followed the Lost Lighthouse's beam and found something impossible", minStat:{ key:"luck", min:60 } },
  ],
  Voidmere: [
    { id:"void_rift",       name:"Void Rift",          icon:"◈",   rarity:"rare",      desc:"A tear in reality itself",                       flavorText:"Look into the rift long enough and it looks back.",        effects:{ magic:20, health:-10 }, mysticalExp:50, log:"gazed into the Void Rift — immense power at terrible cost", danger:true },
    { id:"void_library",    name:"Null Library",       icon:"📚",  rarity:"uncommon",  desc:"Books written in languages that don't exist yet",flavorText:"Every page you turn removes a memory. Every page you add, gives one.", effects:{ intelligence:15, magic:8, happiness:-5 }, log:"studied forbidden texts in the Null Library" },
    { id:"void_sanctum",    name:"Void Sanctum",       icon:"◌",   rarity:"legendary", desc:"Center of all nullification power",             flavorText:"Here, everything is possible because nothing is real.",    effects:{ magic:25, intelligence:10 }, mysticalExp:60, log:"meditated in the Void Sanctum and touched oblivion", reqPath:"cultivation", minStat:{ key:"magic", min:60 } },
    { id:"void_echo",       name:"Echo Chamber",       icon:"🔊",  rarity:"common",    desc:"Sounds loop endlessly in impossible ways",      flavorText:"Whispers here are louder than shouts.",                   effects:{ intelligence:10, magic:6 },          log:"listened to the Echo Chamber's impossible sounds"                   },
    { id:"void_throne",     name:"Empty Throne",       icon:"💺",  rarity:"rare",      desc:"The throne of a ruler who never existed",       flavorText:"Sit here and feel ten thousand years of nothing.",        effects:{ reputation:15, infamy:12 },          log:"claimed the Empty Throne — a statement that was heard across realms" },
  ],
  Arcanum: [
    { id:"arc_tower",       name:"The Grand Tower",    icon:"🗼",  rarity:"uncommon",  desc:"The tallest spire of arcane learning",           flavorText:"Every floor teaches a different way to break the world.",  effects:{ intelligence:12, magic:10 }, mysticalExp:30, log:"climbed the Grand Tower and returned wiser than before"      },
    { id:"arc_lab",         name:"Arcane Laboratory",  icon:"⚗",   rarity:"common",    desc:"Research wing of the Mage Academy",              flavorText:"Experiments run here that have no ethical oversight.",     effects:{ intelligence:10, magic:8 }, mysticalExp:20, log:"ran experiments in the Arcane Laboratory"                    },
    { id:"arc_duel",        name:"Dueling Circle",     icon:"✦",   rarity:"uncommon",  desc:"Where mages resolve disputes by fire",           flavorText:"Lose here and you don't lose gracefully.",                 effects:{ magic:15, reputation:10 },           log:"won a duel in the Arcane Dueling Circle", danger:true, minStat:{ key:"magic", min:40 } },
    { id:"arc_vault",       name:"Spell Vault",        icon:"🔐",  rarity:"rare",      desc:"Repository of banned and forgotten spells",     flavorText:"Spells banned for good reason live here. Possibly alive.", effects:{ magic:20, intelligence:8 }, mysticalExp:50, log:"accessed the Spell Vault and absorbed forbidden knowledge", minStat:{ key:"intelligence", min:60 } },
    { id:"arc_sanctum",     name:"Archmage's Sanctum", icon:"✦",   rarity:"legendary", desc:"Private study of the world's most powerful mage",flavorText:"The air here is thick with centuries of intent.",          effects:{ magic:25, intelligence:15 }, mysticalExp:70, log:"stood in the Archmage's Sanctum and felt the difference between talent and mastery", minStat:{ key:"magic", min:70 } },
  ],
};

export function getLocationsForRealm(realm: Realm): MapLocation[] {
  return REALM_MAPS[realm] ?? REALM_MAPS.Mundus;
}
