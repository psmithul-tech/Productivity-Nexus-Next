import { GameState, StatKey, PropertyType, MysticalPath } from "./types";

export interface EventChoice {
  text: string;
  effectText: string;
  effects: Partial<Record<StatKey, number>>;
  propertyGain?: PropertyType;
  propertyLoss?: PropertyType;
  itemGain?: string;
  titleGain?: string;
  unlockPath?: MysticalPath;
  mysticalExp?: number;
  nextEventId?: string;
  nextEventDelay?: number;
}

export interface GameEvent {
  id: string;
  narrative: string;
  choices: EventChoice[];
  minAge?: number;
  maxAge?: number;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  category: string;
  bloodlineReq?: string[];
  statReq?: Partial<Record<StatKey, number>>;
  romanceReq?: "mild" | "explicit";
  mysticalPathReq?: MysticalPath;
  pathEntry?: MysticalPath; // Only shows when mysticalPath === "none"
}

export const events: GameEvent[] = [

// ===========================
// CHILDHOOD (3–12)
// ===========================
{
  id: "child_toy",
  category: "Family", rarity: "common", minAge: 3, maxAge: 12,
  narrative: "You find a strange wooden toy hidden in the floorboards of your room. It hums faintly with a warmth you cannot explain.",
  choices: [
    { text: "Play with it secretly", effectText: "+Happiness, +Magic", effects: { happiness: 10, magic: 5 }, itemGain: "Strange Wooden Toy" },
    { text: "Show it to your parents", effectText: "+Relationships", effects: { relationships: 5 } },
    { text: "Smash it apart out of curiosity", effectText: "+Intelligence, -Happiness", effects: { intelligence: 8, happiness: -5 } },
  ]
},
{
  id: "child_bully",
  category: "Relationships", rarity: "common", minAge: 5, maxAge: 12,
  narrative: "A bully corners you and demands your lunch. The other children watch to see what you will do.",
  choices: [
    { text: "Stand your ground", effectText: "+Strength, +Reputation, -Health", effects: { strength: 8, reputation: 5, health: -10 } },
    { text: "Give them what they want", effectText: "+Health, -Reputation", effects: { reputation: -5 } },
    { text: "Report to the teacher", effectText: "+Intelligence, -Charisma", effects: { intelligence: 5, charisma: -3 } },
  ]
},
{
  id: "child_lost",
  category: "Adventure", rarity: "uncommon", minAge: 4, maxAge: 10,
  narrative: "You wander too far from home and find yourself lost in a dark forest. Strange lights dance between the trees.",
  choices: [
    { text: "Follow the lights curiously", effectText: "+Magic, +Luck, risk", effects: { magic: 12, luck: 8 } },
    { text: "Stay put and call for help", effectText: "+Reputation, +Relationships", effects: { reputation: 5, relationships: 8 } },
    { text: "Try to find your own way home", effectText: "+Intelligence, +Strength", effects: { intelligence: 8, strength: 4 } },
  ]
},
{
  id: "child_stray",
  category: "Family", rarity: "common", minAge: 5, maxAge: 12,
  narrative: "A half-starved stray animal follows you home. It clearly wants to live with you.",
  choices: [
    { text: "Convince your family to keep it", effectText: "+Happiness, +Relationships, +Charisma", effects: { happiness: 12, relationships: 8, charisma: 5 } },
    { text: "Feed it but send it away", effectText: "+Happiness, -Happiness", effects: { happiness: 4 } },
    { text: "Ignore the creature", effectText: "No change", effects: {} },
  ]
},
{
  id: "child_ghost",
  category: "Supernatural", rarity: "rare", minAge: 5, maxAge: 12,
  narrative: "A translucent figure appears at the foot of your bed, watching you with hollow eyes and a mournful expression.",
  choices: [
    { text: "Speak to it gently", effectText: "+Magic, +Faith, +Intelligence", effects: { magic: 10, faith: 8, intelligence: 5 } },
    { text: "Scream and run", effectText: "-Happiness, +Health (adrenaline)", effects: { happiness: -8, health: 4 } },
    { text: "Try to banish it with a prayer", effectText: "+Faith, +Reputation", effects: { faith: 10, reputation: 5 } },
  ]
},
{
  id: "child_fire",
  category: "Disaster", rarity: "uncommon", minAge: 6, maxAge: 12,
  narrative: "A fire breaks out in your neighborhood. Families are panicking and grabbing what they can.",
  choices: [
    { text: "Rush in to rescue a trapped child", effectText: "+Reputation, +Strength, -Health", effects: { reputation: 15, strength: 8, health: -12 } },
    { text: "Help organize the evacuation", effectText: "+Charisma, +Reputation", effects: { charisma: 8, reputation: 10 } },
    { text: "Stay back and observe", effectText: "+Intelligence", effects: { intelligence: 5 } },
  ]
},
{
  id: "child_festival",
  category: "Culture", rarity: "common", minAge: 5, maxAge: 12,
  narrative: "The annual festival transforms your town into a sea of lanterns and music. There is magic in the air tonight.",
  choices: [
    { text: "Dance until dawn", effectText: "+Happiness, +Charisma", effects: { happiness: 12, charisma: 6 } },
    { text: "Explore hidden corners of the festival", effectText: "+Luck, +Intelligence", effects: { luck: 8, intelligence: 5 } },
    { text: "Help the performers", effectText: "+Relationships, +Charisma", effects: { relationships: 8, charisma: 8 } },
  ]
},
{
  id: "child_forbidden_book",
  category: "Education", rarity: "uncommon", minAge: 7, maxAge: 12,
  narrative: "Behind a loose stone in the library you find a book whose cover singes your fingers to touch.",
  choices: [
    { text: "Read every word of it", effectText: "+Intelligence, +Magic, -Health", effects: { intelligence: 12, magic: 10, health: -8 } },
    { text: "Give it to your teacher", effectText: "+Reputation, +Education", effects: { reputation: 8, education: 8 } },
    { text: "Bury it where no one will find it", effectText: "+Luck", effects: { luck: 6 } },
  ]
},
{
  id: "child_tournament",
  category: "Combat", rarity: "uncommon", minAge: 8, maxAge: 12,
  narrative: "A local children's wrestling tournament is announced. The winner gets a gold medal and public honour.",
  choices: [
    { text: "Enter and train hard", effectText: "+Strength, +Reputation, +Happiness", effects: { strength: 10, reputation: 8, happiness: 8 }, itemGain: "Junior Gold Medal", titleGain: "Little Champion" },
    { text: "Watch from the sidelines", effectText: "+Intelligence (observing)", effects: { intelligence: 4 } },
    { text: "Cheer on a friend instead", effectText: "+Relationships, +Charisma", effects: { relationships: 8, charisma: 5 } },
  ]
},
{
  id: "child_prophecy",
  category: "Supernatural", rarity: "rare", minAge: 5, maxAge: 10,
  narrative: "A blind old woman grabs your wrist at the market and whispers: 'Great destiny walks with you, child — and great peril follows close behind.'",
  choices: [
    { text: "Take her words to heart", effectText: "+Luck, +Faith, +Intelligence", effects: { luck: 10, faith: 8, intelligence: 5 } },
    { text: "Dismiss it as nonsense", effectText: "+Charisma (confidence)", effects: { charisma: 5 } },
    { text: "Find the woman again and ask for more", effectText: "+Intelligence, +Magic", effects: { intelligence: 8, magic: 8 } },
  ]
},
{
  id: "child_first_lie",
  category: "Moral", rarity: "common", minAge: 6, maxAge: 12,
  narrative: "You broke something precious. Your parent asks if you know what happened. The temptation to lie is overwhelming.",
  choices: [
    { text: "Tell the truth and apologize", effectText: "+Reputation, +Relationships, -Happiness temporarily", effects: { reputation: 8, relationships: 5, happiness: -3 } },
    { text: "Lie convincingly", effectText: "+Charisma, +Infamy", effects: { charisma: 5, infamy: 5 } },
    { text: "Blame someone else", effectText: "+Infamy, -Relationships", effects: { infamy: 8, relationships: -8 } },
  ]
},
{
  id: "child_river",
  category: "Adventure", rarity: "common", minAge: 6, maxAge: 12,
  narrative: "Your friends dare you to swim across the fast river at the edge of town.",
  choices: [
    { text: "Dive in and swim across", effectText: "+Strength, +Luck, -Health risk", effects: { strength: 8, luck: 5, health: -5 } },
    { text: "Refuse and walk away", effectText: "+Health, -Reputation", effects: { health: 3, reputation: -5 } },
    { text: "Find a safer crossing point", effectText: "+Intelligence, +Reputation", effects: { intelligence: 6, reputation: 4 } },
  ]
},
{
  id: "child_first_fight",
  category: "Combat", rarity: "common", minAge: 7, maxAge: 12,
  narrative: "Another child pushes you to the ground in front of everyone. Your fists clench.",
  choices: [
    { text: "Get up and fight back", effectText: "+Strength, +Reputation risk", effects: { strength: 6, reputation: 3, health: -5 } },
    { text: "Walk away with dignity", effectText: "+Intelligence, -Reputation short-term", effects: { intelligence: 5, reputation: -3 } },
    { text: "Get an older sibling", effectText: "+Relationships, -Charisma", effects: { relationships: 5, charisma: -3 } },
  ]
},

// ===========================
// TEEN (13–17)
// ===========================
{
  id: "teen_romance",
  category: "Romance", rarity: "common", minAge: 14, maxAge: 17,
  narrative: "Someone in your class has been leaving notes in your satchel — cryptic, poetic, impossible to ignore.",
  choices: [
    { text: "Follow the clues to find them", effectText: "+Happiness, +Relationships, +Charisma", effects: { happiness: 12, relationships: 10, charisma: 6 }, itemGain: "Cryptic Love Note" },
    { text: "Ignore the mystery entirely", effectText: "-Happiness, +Intelligence", effects: { happiness: -8, intelligence: 5 } },
    { text: "Show the notes publicly", effectText: "+Infamy, -Relationships", effects: { infamy: 8, relationships: -8 } },
  ]
},
{
  id: "teen_skill",
  category: "Education", rarity: "common", minAge: 13, maxAge: 17,
  narrative: "Your instructors have noticed your aptitude. You must choose a path of study before the term ends.",
  choices: [
    { text: "Focus on combat and warfare", effectText: "+Strength, +Career", effects: { strength: 12, career: 8 } },
    { text: "Study arcane arts", effectText: "+Magic, +Intelligence", effects: { magic: 12, intelligence: 8 } },
    { text: "Learn trade and commerce", effectText: "+Wealth, +Career", effects: { wealth: 10, career: 10 } },
    { text: "Study governance and law", effectText: "+Reputation, +Intelligence, +Charisma", effects: { reputation: 8, intelligence: 8, charisma: 5 } },
  ]
},
{
  id: "teen_theft",
  category: "Crime", rarity: "common", minAge: 13, maxAge: 17,
  narrative: "Your family's debts are mounting. A local fence offers you coin for whatever you can lift from the market.",
  choices: [
    { text: "Start stealing from the stalls", effectText: "+Wealth, +Infamy, -Reputation", effects: { wealth: 12, infamy: 12, reputation: -10 } },
    { text: "Find honest work instead", effectText: "+Reputation, +Career", effects: { reputation: 8, career: 8 } },
    { text: "Beg in the streets", effectText: "-Happiness, -Reputation", effects: { happiness: -5, reputation: -5 } },
  ]
},
{
  id: "teen_forbidden_love",
  category: "Romance", rarity: "uncommon", minAge: 14, maxAge: 17, romanceReq: "mild",
  narrative: "You have fallen for someone whose family and yours are bitter rivals. Every meeting must be secret.",
  choices: [
    { text: "Continue the secret romance", effectText: "+Happiness, +Charisma, -Reputation", effects: { happiness: 18, charisma: 8, reputation: -10 } },
    { text: "End it before things escalate", effectText: "-Happiness, +Reputation", effects: { happiness: -15, reputation: 8 } },
    { text: "Publicly declare your love, consequences be damned", effectText: "+Reputation, -Reputation, +Infamy", effects: { happiness: 15, infamy: 12, reputation: -8 } },
  ]
},
{
  id: "teen_duel",
  category: "Combat", rarity: "uncommon", minAge: 14, maxAge: 17,
  narrative: "A rival student challenges you to a duel at dawn. Word has spread through the school.",
  choices: [
    { text: "Accept — and train all night", effectText: "+Strength, +Reputation, -Health", effects: { strength: 12, reputation: 10, health: -8 } },
    { text: "Decline formally", effectText: "-Reputation, +Health", effects: { reputation: -8, health: 5 } },
    { text: "Accept — then use a dirty trick", effectText: "+Infamy, +Strength", effects: { infamy: 12, strength: 6 } },
  ]
},
{
  id: "teen_runaway",
  category: "Adventure", rarity: "uncommon", minAge: 14, maxAge: 17,
  narrative: "Life at home has become unbearable. A group of wandering travelers offers you a place among them.",
  choices: [
    { text: "Run away and join them", effectText: "+Luck, +Charisma, -Relationships", effects: { luck: 10, charisma: 10, relationships: -15 } },
    { text: "Stay and endure", effectText: "+Strength (resilience), +Intelligence", effects: { strength: 6, intelligence: 8 } },
    { text: "Negotiate better terms at home", effectText: "+Charisma, +Relationships", effects: { charisma: 8, relationships: 10 } },
  ]
},
{
  id: "teen_scholarship",
  category: "Education", rarity: "uncommon", minAge: 13, maxAge: 17,
  narrative: "A prestigious academy in the capital offers you a scholarship. It would change everything.",
  choices: [
    { text: "Accept — leave immediately", effectText: "+Intelligence, +Education, +Career, -Relationships", effects: { intelligence: 15, education: 15, career: 10, relationships: -10 } },
    { text: "Decline to stay near family", effectText: "+Relationships, -Career", effects: { relationships: 12, career: -5 } },
    { text: "Request a delayed start", effectText: "+Intelligence, +Relationships, -Education", effects: { intelligence: 8, relationships: 5, education: 5 } },
  ]
},
{
  id: "teen_gang",
  category: "Crime", rarity: "uncommon", minAge: 14, maxAge: 17,
  narrative: "A gang of older teens recruits you. They have coin, respect, and danger written all over them.",
  choices: [
    { text: "Join for the thrill", effectText: "+Infamy, +Wealth, -Reputation", effects: { infamy: 15, wealth: 10, reputation: -12 } },
    { text: "Refuse and walk away", effectText: "+Reputation, -Safety", effects: { reputation: 8, luck: -4 } },
    { text: "Pretend to join — gather information", effectText: "+Intelligence, +Reputation, -Health", effects: { intelligence: 10, reputation: 5, health: -8 } },
  ]
},
{
  id: "teen_blackmail",
  category: "Crime", rarity: "uncommon", minAge: 15, maxAge: 17,
  narrative: "You accidentally witness a nobleman committing a crime. You could expose him — or exploit him.",
  choices: [
    { text: "Blackmail him for regular payments", effectText: "+Wealth, +Infamy, -Safety", effects: { wealth: 20, infamy: 15, luck: -8 } },
    { text: "Report what you saw", effectText: "+Reputation, +Faith, risk", effects: { reputation: 15, faith: 10 } },
    { text: "Forget it — too dangerous", effectText: "+Health (safety)", effects: { health: 5 } },
  ]
},
{
  id: "teen_oracle_dream",
  category: "Supernatural", rarity: "rare", minAge: 13, maxAge: 17,
  narrative: "Three nights in a row you dream the same dream: a figure made of light hands you a burning scroll.",
  choices: [
    { text: "Open the scroll in the dream", effectText: "+Magic, +Intelligence, +Faith", effects: { magic: 12, intelligence: 8, faith: 8 } },
    { text: "Burn the scroll before you can read it", effectText: "+Strength, -Magic", effects: { strength: 8, magic: -5 } },
    { text: "Consult a dream-reader", effectText: "+Intelligence, +Magic", effects: { intelligence: 10, magic: 8 } },
  ]
},

// ===========================
// YOUNG ADULT (18–29)
// ===========================
{
  id: "ya_career",
  category: "Career", rarity: "common", minAge: 18, maxAge: 29,
  narrative: "It is time to choose your path. The city's guilds are all recruiting, each promising a different destiny.",
  choices: [
    { text: "Join the Merchant's Guild", effectText: "+Wealth, +Career", effects: { wealth: 15, career: 12 } },
    { text: "Enlist in the Guard", effectText: "+Strength, +Career, +Reputation", effects: { strength: 10, career: 10, reputation: 8 } },
    { text: "Apprentice to a mage", effectText: "+Magic, +Intelligence, -Wealth", effects: { magic: 18, intelligence: 12, wealth: -10 } },
    { text: "Train as an assassin", effectText: "+Strength, +Infamy, +Charisma", effects: { strength: 8, infamy: 15, charisma: 8 } },
  ]
},
{
  id: "ya_property_1",
  category: "Business", rarity: "common", minAge: 18, maxAge: 29,
  narrative: "A derelict market stall is being auctioned off for almost nothing.",
  choices: [
    { text: "Buy the market stall", effectText: "+Career, +Wealth", effects: { career: 8, wealth: 8 }, propertyGain: "Market Stall" },
    { text: "Pass — too much risk", effectText: "No change", effects: {} },
  ]
},
{
  id: "ya_property_2",
  category: "Residential", rarity: "common", minAge: 20, maxAge: 29,
  narrative: "After years of saving, you can finally afford a humble hut at the edge of town.",
  choices: [
    { text: "Buy the hut", effectText: "+Happiness, +Reputation", effects: { happiness: 12, reputation: 5 }, propertyGain: "Ramshackle Hut" },
    { text: "Keep saving for something better", effectText: "+Wealth", effects: { wealth: 8 } },
  ]
},
{
  id: "ya_farm",
  category: "Business", rarity: "uncommon", minAge: 18, maxAge: 29,
  narrative: "An elderly farmer with no heirs offers you his land cheaply.",
  choices: [
    { text: "Buy the wheat farm", effectText: "+Wealth, +Reputation", effects: { wealth: 10, reputation: 8 }, propertyGain: "Wheat Farm" },
    { text: "Decline the responsibility", effectText: "No change", effects: {} },
    { text: "Renegotiate aggressively", effectText: "+Wealth, +Infamy", effects: { wealth: 20, infamy: 12 }, propertyGain: "Wheat Farm" },
  ]
},
{
  id: "ya_romance_deep",
  category: "Romance", rarity: "common", minAge: 20, maxAge: 29, romanceReq: "mild",
  narrative: "You have been seeing someone who makes every moment feel like an epic. They propose a life together.",
  choices: [
    { text: "Accept — commit fully", effectText: "+Happiness, +Relationships", effects: { happiness: 20, relationships: 20, luck: 5 } },
    { text: "Not yet — you have ambitions first", effectText: "+Career, -Relationships", effects: { career: 12, relationships: -8 } },
    { text: "Propose an open arrangement", effectText: "+Charisma, -Reputation", effects: { charisma: 8, reputation: -8 } },
  ]
},
{
  id: "ya_crime_gang",
  category: "Crime", rarity: "uncommon", minAge: 18, maxAge: 29,
  narrative: "A criminal syndicate sends a recruiter who knows things about you they shouldn't.",
  choices: [
    { text: "Join the syndicate", effectText: "+Wealth, +Infamy, -Reputation", effects: { wealth: 18, infamy: 15, reputation: -10 } },
    { text: "Refuse and report them", effectText: "+Reputation, -Safety", effects: { reputation: 10, luck: -5 } },
    { text: "Pretend to join, then betray them", effectText: "+Reputation, +Infamy, -Health", effects: { reputation: 15, infamy: 8, health: -15 } },
  ]
},
{
  id: "ya_magic_discovery",
  category: "Magic", rarity: "uncommon", minAge: 18, maxAge: 25,
  narrative: "You accidentally summon a minor entity while reading ancient text. It hovers before you, awaiting command.",
  choices: [
    { text: "Bind it to your service", effectText: "+Magic, +Infamy", effects: { magic: 15, infamy: 8 } },
    { text: "Release it immediately", effectText: "+Faith, +Luck", effects: { faith: 12, luck: 10 } },
    { text: "Study it carefully before deciding", effectText: "+Intelligence, +Magic", effects: { intelligence: 10, magic: 10 } },
  ]
},
{
  id: "ya_tavern",
  category: "Business", rarity: "uncommon", minAge: 21, maxAge: 29,
  narrative: "The old innkeeper wants to retire and offers you the Village Tavern at a fair price.",
  choices: [
    { text: "Buy the tavern", effectText: "+Wealth, +Charisma, +Career", effects: { wealth: 10, charisma: 8, career: 10 }, propertyGain: "Village Tavern" },
    { text: "Negotiate a lower price", effectText: "+Wealth, -Relationships", effects: { wealth: 15, relationships: -5, career: 8 }, propertyGain: "Village Tavern" },
    { text: "Decline the offer", effectText: "No change", effects: {} },
  ]
},
{
  id: "ya_first_kill",
  category: "Combat", rarity: "uncommon", minAge: 18, maxAge: 28,
  narrative: "In the chaos of a street brawl, you strike a man too hard. He does not get up.",
  choices: [
    { text: "Turn yourself in", effectText: "+Reputation long-term, -Freedom", effects: { reputation: 10, career: -10 } },
    { text: "Flee and say nothing", effectText: "+Infamy, -Happiness", effects: { infamy: 15, happiness: -15 } },
    { text: "Fabricate self-defense", effectText: "+Charisma, +Infamy, risk", effects: { charisma: 5, infamy: 10 } },
  ]
},
{
  id: "ya_expedition",
  category: "Adventure", rarity: "uncommon", minAge: 18, maxAge: 29,
  narrative: "A cartographer is recruiting companions for a six-month journey into unmapped wilderness.",
  choices: [
    { text: "Sign on immediately", effectText: "+Luck, +Intelligence, +Strength", effects: { luck: 10, intelligence: 10, strength: 8 } },
    { text: "Negotiate a higher share", effectText: "+Wealth, +Intelligence", effects: { wealth: 12, intelligence: 6 } },
    { text: "Decline — too risky now", effectText: "No change", effects: {} },
  ]
},
{
  id: "ya_sea_voyage",
  category: "Travel", rarity: "uncommon", minAge: 18, maxAge: 29,
  narrative: "A merchant captain offers you passage on a sea voyage to distant lands in exchange for work.",
  choices: [
    { text: "Accept — sail away", effectText: "+Luck, +Charisma, +Wealth", effects: { luck: 8, charisma: 8, wealth: 10 } },
    { text: "Decline — the sea is dangerous", effectText: "+Reputation (safe choices)", effects: { reputation: 3 } },
    { text: "Negotiate part-ownership of the cargo", effectText: "+Wealth greatly, risk", effects: { wealth: 20, luck: -5 } },
  ]
},
{
  id: "ya_heist",
  category: "Crime", rarity: "rare", minAge: 20, maxAge: 29,
  narrative: "A legendary thief proposes cutting you in on the greatest heist the city has ever seen.",
  choices: [
    { text: "Join the crew", effectText: "+Wealth, +Infamy, -Health risk", effects: { wealth: 35, infamy: 25, health: -10 } },
    { text: "Report the plan to the guard", effectText: "+Reputation, +Career", effects: { reputation: 15, career: 10 } },
    { text: "Steal the plan and do it alone", effectText: "+Wealth greatly, +Infamy, risk", effects: { wealth: 50, infamy: 30, health: -20 } },
  ]
},
{
  id: "ya_seduced_noble",
  category: "Romance", rarity: "uncommon", minAge: 18, maxAge: 29, romanceReq: "mild",
  narrative: "A noble at a gala makes it clear they find you intensely attractive — and they are very powerful.",
  choices: [
    { text: "Play along and enjoy the attention", effectText: "+Charisma, +Wealth, +Relationships", effects: { charisma: 10, wealth: 8, relationships: 10 } },
    { text: "Decline gracefully", effectText: "+Reputation, -Wealth opportunity", effects: { reputation: 8 } },
    { text: "Use the situation for strategic advantage", effectText: "+Wealth, +Career, +Infamy", effects: { wealth: 15, career: 10, infamy: 8 } },
  ]
},
{
  id: "ya_explicit_affair",
  category: "Romance", rarity: "uncommon", minAge: 18, maxAge: 29, romanceReq: "explicit",
  narrative: "A forbidden night with a married member of the city council leaves both of you breathless — and both at risk.",
  choices: [
    { text: "Continue the affair in secret", effectText: "+Happiness, +Charisma, -Reputation risk", effects: { happiness: 20, charisma: 12, reputation: -5 } },
    { text: "End it before discovery", effectText: "-Happiness, +Reputation", effects: { happiness: -15, reputation: 8 } },
    { text: "Leverage the secret for power", effectText: "+Wealth, +Infamy, +Career", effects: { wealth: 20, infamy: 15, career: 12 } },
  ]
},

// ===========================
// ADULT (30–54)
// ===========================
{
  id: "adult_business",
  category: "Business", rarity: "uncommon", minAge: 30, maxAge: 54,
  narrative: "A rival merchant offers to buy out your enterprise for a hefty sum.",
  choices: [
    { text: "Accept the buyout", effectText: "+Wealth, -Career", effects: { wealth: 30, career: -15 } },
    { text: "Refuse and expand instead", effectText: "+Career, +Reputation", effects: { career: 15, reputation: 10 } },
    { text: "Intimidate them out of the market", effectText: "+Infamy, +Wealth", effects: { infamy: 15, wealth: 15 } },
  ]
},
{
  id: "adult_manor",
  category: "Residential", rarity: "uncommon", minAge: 30, maxAge: 54,
  narrative: "Your success affords you the chance to purchase a Noble Manor at the edge of the city.",
  choices: [
    { text: "Purchase the manor", effectText: "+Reputation, +Happiness", effects: { reputation: 15, happiness: 12 }, propertyGain: "Noble Manor" },
    { text: "Invest elsewhere instead", effectText: "+Wealth", effects: { wealth: 20 } },
  ]
},
{
  id: "adult_mine",
  category: "Business", rarity: "rare", minAge: 30, maxAge: 54,
  narrative: "A deed to an abandoned iron mine surfaces at auction. Experts claim it may still hold rich veins.",
  choices: [
    { text: "Bid on the iron mine", effectText: "+Career, potential +Wealth", effects: { wealth: -10, career: 8 }, propertyGain: "Iron Mine" },
    { text: "Pass — too speculative", effectText: "No change", effects: {} },
    { text: "Investigate before bidding", effectText: "+Intelligence, +Wealth", effects: { intelligence: 8, wealth: 5 }, propertyGain: "Iron Mine" },
  ]
},
{
  id: "adult_politics",
  category: "Politics", rarity: "uncommon", minAge: 30, maxAge: 54,
  narrative: "The city council seat is vacant. Supporters urge you to run.",
  choices: [
    { text: "Run for council", effectText: "+Reputation, +Career, -Wealth", effects: { reputation: 18, career: 15, wealth: -10 } },
    { text: "Endorse someone loyal to you", effectText: "+Relationships, +Reputation", effects: { relationships: 12, reputation: 10 } },
    { text: "Blackmail a candidate to withdraw", effectText: "+Infamy, +Career", effects: { infamy: 18, career: 12 } },
  ]
},
{
  id: "adult_gold_mine",
  category: "Business", rarity: "rare", minAge: 35, maxAge: 54,
  narrative: "Explorers in your employ strike gold deep in the northern mountains.",
  choices: [
    { text: "Claim it legally", effectText: "+Wealth, +Reputation", effects: { wealth: 25, reputation: 12 }, propertyGain: "Gold Mine" },
    { text: "Bribe officials to secure the deed", effectText: "+Wealth, +Infamy", effects: { wealth: 30, infamy: 15 }, propertyGain: "Gold Mine" },
    { text: "Share the find with the crown", effectText: "+Reputation, +Faith, -Wealth", effects: { reputation: 20, faith: 10, wealth: -5 } },
  ]
},
{
  id: "adult_harbor",
  category: "Business", rarity: "rare", minAge: 35, maxAge: 54,
  narrative: "The old harbor master retires and the coastal harbor comes up for private sale.",
  choices: [
    { text: "Purchase the harbor", effectText: "+Wealth, +Career", effects: { wealth: 15, career: 15 }, propertyGain: "Coastal Harbor" },
    { text: "Form a consortium instead", effectText: "+Relationships, +Wealth moderate", effects: { relationships: 10, wealth: 10 } },
    { text: "Pass — too expensive", effectText: "No change", effects: {} },
  ]
},
{
  id: "adult_assassin_contract",
  category: "Crime", rarity: "rare", minAge: 30, maxAge: 54,
  narrative: "An anonymous note left at your door contains a contract: kill someone for an extraordinary sum.",
  choices: [
    { text: "Accept the contract", effectText: "+Wealth greatly, +Infamy, -Reputation, -Health risk", effects: { wealth: 40, infamy: 25, reputation: -20, health: -10 } },
    { text: "Refuse and report it", effectText: "+Reputation, +Faith", effects: { reputation: 15, faith: 10 } },
    { text: "Accept — then warn the target", effectText: "+Reputation, -Wealth, +Luck", effects: { reputation: 20, luck: 10 } },
  ]
},
{
  id: "adult_estate_purchase",
  category: "Residential", rarity: "rare", minAge: 35, maxAge: 54,
  narrative: "The Seaside Estate of a disgraced nobleman goes on sale at a fraction of its worth.",
  choices: [
    { text: "Buy the estate immediately", effectText: "+Happiness, +Reputation", effects: { happiness: 15, reputation: 12 }, propertyGain: "Seaside Estate" },
    { text: "Negotiate the price down further", effectText: "+Wealth, +Intelligence", effects: { wealth: 15, intelligence: 5 }, propertyGain: "Seaside Estate" },
    { text: "Let someone else take it", effectText: "No change", effects: {} },
  ]
},
{
  id: "adult_dragon",
  category: "Supernatural", rarity: "legendary", minAge: 30, maxAge: 54,
  narrative: "An ancient dragon lands on your roof and regards you with reptilian patience. It has clearly chosen you specifically.",
  choices: [
    { text: "Attempt to communicate", effectText: "+Magic, +Intelligence, +Luck greatly", effects: { magic: 25, intelligence: 15, luck: 15 } },
    { text: "Offer a tribute", effectText: "+Faith, +Reputation, -Wealth", effects: { faith: 15, reputation: 20, wealth: -20 } },
    { text: "Flee the building", effectText: "-Reputation, +Health (survival)", effects: { reputation: -10, health: 5 } },
  ]
},
{
  id: "adult_spouse_affair",
  category: "Romance", rarity: "uncommon", minAge: 30, maxAge: 50, romanceReq: "mild",
  narrative: "You discover evidence your spouse may be having an affair. The clues are undeniable.",
  choices: [
    { text: "Confront them directly", effectText: "+Strength (resolve), -Happiness, -Relationships", effects: { strength: 5, happiness: -20, relationships: -20 } },
    { text: "Begin your own affair in retaliation", effectText: "+Charisma, +Infamy, -Happiness long-term", effects: { charisma: 8, infamy: 10, happiness: -8 } },
    { text: "Forgive and rebuild", effectText: "+Relationships, +Faith, +Happiness", effects: { relationships: 10, faith: 10, happiness: 8 } },
  ]
},
{
  id: "adult_night_liaison",
  category: "Romance", rarity: "uncommon", minAge: 25, maxAge: 50, romanceReq: "explicit",
  narrative: "A traveler from a distant land shares your fire for a single night — and something ancient passes between you.",
  choices: [
    { text: "Embrace the moment fully", effectText: "+Happiness, +Charisma, +Magic", effects: { happiness: 18, charisma: 10, magic: 8 } },
    { text: "Pull back before things go further", effectText: "-Happiness, +Reputation", effects: { happiness: -8, reputation: 5 } },
    { text: "Ask them to stay", effectText: "+Relationships, +Happiness, +Luck", effects: { relationships: 15, happiness: 15, luck: 8 } },
  ]
},
{
  id: "adult_explicit_seductress",
  category: "Romance", rarity: "rare", minAge: 25, maxAge: 50, romanceReq: "explicit",
  narrative: "A legendary beauty — or dazzling figure — seeks you out with unmistakable intent. Their interest is undeniable.",
  choices: [
    { text: "Invite them in wholeheartedly", effectText: "+Happiness, +Charisma, +Relationships", effects: { happiness: 22, charisma: 15, relationships: 12 } },
    { text: "Decline with grace", effectText: "+Reputation, +Intelligence", effects: { reputation: 8, intelligence: 5 } },
    { text: "Negotiate — pleasure for power", effectText: "+Career, +Wealth, +Infamy", effects: { career: 12, wealth: 12, infamy: 8 } },
  ]
},

// ===========================
// ELDER (55+)
// ===========================
{
  id: "elder_legacy",
  category: "Legacy", rarity: "uncommon", minAge: 55,
  narrative: "A scribe arrives to document your life story for the Hall of Chronicles. What will your legend say?",
  choices: [
    { text: "Tell the whole truth", effectText: "+Reputation, +Faith, +Legacy", effects: { reputation: 15, faith: 10 } },
    { text: "Embellish strategically", effectText: "+Reputation, +Charisma, +Infamy", effects: { reputation: 10, charisma: 8, infamy: 5 } },
    { text: "Decline — some things are private", effectText: "+Luck, +Intelligence", effects: { luck: 8, intelligence: 8 } },
  ]
},
{
  id: "elder_apprentice",
  category: "Legacy", rarity: "uncommon", minAge: 50,
  narrative: "A young prodigy approaches you — unpolished but brilliant. They want you to mentor them.",
  choices: [
    { text: "Take them under your wing", effectText: "+Reputation, +Relationships, +Legacy", effects: { reputation: 12, relationships: 15 } },
    { text: "Test them severely before agreeing", effectText: "+Reputation, +Intelligence", effects: { reputation: 8, intelligence: 8 } },
    { text: "Refuse — you have your own problems", effectText: "No change", effects: {} },
  ]
},
{
  id: "elder_conspiracy",
  category: "Politics", rarity: "rare", minAge: 55,
  narrative: "You stumble upon evidence of a conspiracy that reaches the highest levels of power in the realm.",
  choices: [
    { text: "Expose it publicly", effectText: "+Reputation greatly, +Infamy, -Safety", effects: { reputation: 25, infamy: 10, luck: -10 } },
    { text: "Join the conspiracy", effectText: "+Wealth, +Power, -Faith, -Reputation", effects: { wealth: 20, career: 15, faith: -15, reputation: -10 } },
    { text: "Use it as leverage quietly", effectText: "+Wealth, +Infamy, risk", effects: { wealth: 25, infamy: 15 } },
  ]
},
{
  id: "elder_peace",
  category: "Family", rarity: "common", minAge: 60,
  narrative: "Your children — or those you have guided — gather to honor you. The years feel heavy and sweet.",
  choices: [
    { text: "Speak honestly about your regrets", effectText: "+Faith, +Relationships, +Happiness", effects: { faith: 12, relationships: 15, happiness: 12 } },
    { text: "Inspire them to reach beyond what you achieved", effectText: "+Reputation, +Legacy", effects: { reputation: 12 } },
    { text: "Bask in the tribute silently", effectText: "+Happiness, +Charisma", effects: { happiness: 15, charisma: 8 } },
  ]
},
{
  id: "elder_death_mirror",
  category: "Supernatural", rarity: "rare", minAge: 70,
  narrative: "You encounter what you know instinctively is a Death Mirror — a portal to the afterlife that lets you peer through.",
  choices: [
    { text: "Look into it", effectText: "+Intelligence, +Faith greatly, -Health", effects: { intelligence: 15, faith: 20, health: -15 } },
    { text: "Destroy it", effectText: "+Strength, +Reputation, +Infamy", effects: { strength: 10, reputation: 10, infamy: 8 } },
    { text: "Pray before it and walk away", effectText: "+Faith, +Luck, +Happiness", effects: { faith: 15, luck: 10, happiness: 8 } },
  ]
},

// ===========================
// DIVERSE GENERAL EVENTS
// ===========================
{
  id: "volcano_eruption",
  category: "Disaster", rarity: "uncommon", minAge: 10,
  narrative: "A dormant volcano erupts near your settlement. Ash falls like grey snow and the ground shakes beneath your feet.",
  choices: [
    { text: "Help evacuate the village", effectText: "+Reputation, +Strength, -Health", effects: { reputation: 15, strength: 8, health: -10 } },
    { text: "Flee immediately", effectText: "+Health, -Reputation", effects: { health: 10, reputation: -8 } },
    { text: "Climb toward the source", effectText: "+Intelligence, +Magic, -Health greatly", effects: { intelligence: 12, magic: 10, health: -20 } },
  ]
},
{
  id: "cursed_artifact",
  category: "Supernatural", rarity: "rare", minAge: 12,
  narrative: "A peddler sells you a carved idol for almost nothing. That night it begins whispering your name.",
  choices: [
    { text: "Listen to what it says", effectText: "+Magic, +Intelligence, -Faith, -Health", effects: { magic: 15, intelligence: 10, faith: -10, health: -8 } },
    { text: "Smash it at once", effectText: "+Faith, -Luck", effects: { faith: 10, luck: -8 } },
    { text: "Sell it to someone else", effectText: "+Wealth, +Infamy", effects: { wealth: 12, infamy: 8 } },
  ]
},
{
  id: "plague_doctor",
  category: "Health", rarity: "uncommon", minAge: 14,
  narrative: "A plague sweeps the city. A masked doctor recruits you to help treat the dying.",
  choices: [
    { text: "Join the effort — help the sick", effectText: "+Reputation, +Faith, -Health risk", effects: { reputation: 18, faith: 12, health: -8 } },
    { text: "Quarantine yourself", effectText: "+Health, -Relationships, -Reputation", effects: { health: 15, relationships: -10, reputation: -8 } },
    { text: "Loot empty homes while others are distracted", effectText: "+Wealth, +Infamy, -Reputation", effects: { wealth: 20, infamy: 18, reputation: -15 } },
  ]
},
{
  id: "shipwreck_survivor",
  category: "Adventure", rarity: "rare", minAge: 18,
  narrative: "A sole survivor washes ashore near your home. She claims to be the last heir to a drowned kingdom.",
  choices: [
    { text: "Take her in and help her", effectText: "+Relationships, +Reputation, +Luck", effects: { relationships: 15, reputation: 12, luck: 8 } },
    { text: "Report her to the authorities", effectText: "+Reputation, -Relationships", effects: { reputation: 10, relationships: -5 } },
    { text: "Exploit her claim for political advantage", effectText: "+Career, +Wealth, +Infamy", effects: { career: 12, wealth: 15, infamy: 15 } },
  ]
},
{
  id: "demon_bargain",
  category: "Supernatural", rarity: "rare", minAge: 16,
  narrative: "At a crossroads at midnight, a creature offers you anything you desire — for a price it has not yet named.",
  choices: [
    { text: "Accept the bargain", effectText: "+Wealth, +Power, -Faith, -Health long-term", effects: { wealth: 30, career: 20, faith: -20, luck: -10 } },
    { text: "Refuse and walk away", effectText: "+Faith, +Luck, +Reputation", effects: { faith: 15, luck: 8, reputation: 10 } },
    { text: "Bargain the terms down", effectText: "+Intelligence, +Wealth moderate, -Faith", effects: { intelligence: 10, wealth: 15, faith: -8 } },
  ]
},
{
  id: "frozen_tundra",
  category: "Adventure", rarity: "uncommon", minAge: 18,
  narrative: "You are stranded in a frozen tundra after a blizzard. Shelter is days away. Survival depends on your choices.",
  choices: [
    { text: "Build a snow shelter and wait", effectText: "+Intelligence, +Strength, -Health", effects: { intelligence: 10, strength: 8, health: -10 } },
    { text: "Push forward through the storm", effectText: "+Strength, +Luck, -Health greatly", effects: { strength: 12, luck: 8, health: -20 } },
    { text: "Signal for help and pray", effectText: "+Faith, +Luck, +Health", effects: { faith: 10, luck: 10, health: 5 } },
  ]
},
{
  id: "eclipse_ritual",
  category: "Supernatural", rarity: "legendary", minAge: 14,
  narrative: "A rare full eclipse occurs, and scholars say the veil between worlds thins completely. A ritual circle appears in your courtyard.",
  choices: [
    { text: "Step into the circle", effectText: "+Magic greatly, +Faith, -Health", effects: { magic: 25, faith: 15, health: -15 } },
    { text: "Observe from a safe distance", effectText: "+Intelligence, +Magic", effects: { intelligence: 10, magic: 8 } },
    { text: "Disrupt the circle", effectText: "+Strength, +Infamy, -Magic", effects: { strength: 8, infamy: 12, magic: -8 } },
  ]
},
{
  id: "flood_disaster",
  category: "Disaster", rarity: "uncommon", minAge: 8,
  narrative: "The river breaks its banks and floods the lower district. Families are trapped on rooftops.",
  choices: [
    { text: "Swim out to rescue survivors", effectText: "+Reputation, +Strength, -Health", effects: { reputation: 18, strength: 10, health: -12 } },
    { text: "Organize relief from the bank", effectText: "+Charisma, +Reputation, +Intelligence", effects: { charisma: 8, reputation: 12, intelligence: 6 } },
    { text: "Salvage floating valuables", effectText: "+Wealth, +Infamy", effects: { wealth: 15, infamy: 10 } },
  ]
},
{
  id: "spy_network",
  category: "Espionage", rarity: "rare", minAge: 20,
  narrative: "A government agent reveals you have been identified as an asset. They want you to spy on a powerful figure.",
  choices: [
    { text: "Accept — become a spy", effectText: "+Intelligence, +Charisma, +Wealth, -Safety", effects: { intelligence: 12, charisma: 10, wealth: 15, luck: -8 } },
    { text: "Refuse and report the meeting", effectText: "+Reputation, -Wealth opportunity", effects: { reputation: 12 } },
    { text: "Accept — then double-cross both sides", effectText: "+Wealth greatly, +Infamy, great risk", effects: { wealth: 30, infamy: 25, health: -15 } },
  ]
},
{
  id: "inheritance_distant",
  category: "Family", rarity: "uncommon", minAge: 25,
  narrative: "A distant relative dies, leaving their estate in dispute. A lawyer says you have a valid claim.",
  choices: [
    { text: "Contest the will aggressively", effectText: "+Wealth, -Relationships, +Infamy", effects: { wealth: 20, relationships: -10, infamy: 8 }, propertyGain: "Stone Farmhouse" },
    { text: "Settle fairly with other claimants", effectText: "+Relationships, +Reputation, +Wealth", effects: { relationships: 10, reputation: 10, wealth: 8 } },
    { text: "Waive your claim entirely", effectText: "+Faith, +Relationships", effects: { faith: 12, relationships: 15 } },
  ]
},
{
  id: "combat_challenge",
  category: "Combat", rarity: "uncommon", minAge: 16,
  narrative: "A rival challenges you to combat in front of a crowd. Refusing means public humiliation.",
  choices: [
    { text: "Accept and fight", effectText: "+Strength if win, -Health", effects: { strength: 12, health: -12 } },
    { text: "Decline with dignity", effectText: "-Reputation, +Health", effects: { reputation: -10, health: 5 } },
    { text: "Accept — then cheat to win", effectText: "+Infamy, +Strength, -Reputation", effects: { infamy: 15, strength: 8, reputation: -8 } },
  ]
},
{
  id: "health_plague",
  category: "Health", rarity: "uncommon", minAge: 15,
  narrative: "A plague sweeps through your district. The temples are full. Doctors demand payment most cannot afford.",
  choices: [
    { text: "Seek treatment immediately", effectText: "-Wealth, +Health", effects: { wealth: -15, health: 15 } },
    { text: "Isolate yourself and wait it out", effectText: "-Happiness, -Relationships", effects: { happiness: -10, relationships: -8, health: 5 } },
    { text: "Volunteer to care for the sick", effectText: "+Reputation, +Faith, -Health", effects: { health: -10, reputation: 15, faith: 15 } },
  ]
},
{
  id: "health_injury",
  category: "Health", rarity: "common", minAge: 10,
  narrative: "A serious injury leaves you bedridden for weeks. How you handle recovery will define your resilience.",
  choices: [
    { text: "Rest and recover fully", effectText: "+Health, -Career", effects: { health: 20, career: -5 } },
    { text: "Push through the pain", effectText: "+Strength, -Health long-term", effects: { strength: 10, health: -5 } },
    { text: "Seek magical healing", effectText: "+Health, -Wealth, +Magic", effects: { health: 25, wealth: -15, magic: 5 } },
  ]
},
{
  id: "travel_ruins",
  category: "Travel", rarity: "rare", minAge: 18,
  narrative: "You discover an ancient ruin site — clearly pre-civilization, built by something not human.",
  choices: [
    { text: "Claim and excavate the ruins", effectText: "+Intelligence, +Reputation", effects: { intelligence: 12, reputation: 10 }, propertyGain: "Ancient Ruin Site" },
    { text: "Report to the scholars", effectText: "+Reputation, +Faith", effects: { reputation: 10, faith: 8 } },
    { text: "Loot what you can carry", effectText: "+Wealth, +Infamy, -Luck", effects: { wealth: 15, infamy: 8, luck: -8 } },
  ]
},
{
  id: "travel_sunken",
  category: "Travel", rarity: "legendary", minAge: 25,
  narrative: "A sea oracle reveals the location of a legendary sunken treasure ship in treacherous waters.",
  choices: [
    { text: "Launch a salvage expedition", effectText: "+Wealth, -Luck", effects: { wealth: 30, luck: -5 }, propertyGain: "Sunken Treasure Ship" },
    { text: "Sell the information", effectText: "+Wealth moderate, no risk", effects: { wealth: 18 } },
    { text: "Keep the secret", effectText: "+Luck, +Intelligence", effects: { luck: 8, intelligence: 5 } },
  ]
},
{
  id: "cult_invite",
  category: "Religion", rarity: "uncommon", minAge: 16,
  narrative: "A secretive religious order sends you an invitation sealed in black wax and written in silver ink.",
  choices: [
    { text: "Accept and join", effectText: "+Faith, +Magic, +Infamy, -Freedom", effects: { faith: 15, magic: 12, infamy: 10 } },
    { text: "Decline and burn the letter", effectText: "+Reputation, +Luck", effects: { reputation: 8, luck: 5 }, nextEventId: "cult_revenge", nextEventDelay: 2 },
    { text: "Investigate the order first", effectText: "+Intelligence, +Magic", effects: { intelligence: 10, magic: 8 } },
  ]
},
{
  id: "cult_revenge",
  category: "Combat", rarity: "rare",
  narrative: "Two years ago, you burned the sealed letter from a dark cult. Tonight, assassins in silver masks have come to collect the debt.",
  choices: [
    { text: "Fight them off", effectText: "+Strength, +Reputation, -Health heavily", effects: { strength: 15, reputation: 12, health: -25 } },
    { text: "Flee the property", effectText: "-Wealth, +Luck, -Reputation", effects: { wealth: -20, luck: 10, reputation: -10 } },
    { text: "Surrender and beg for mercy", effectText: "-Health, -Happiness, +Infamy", effects: { health: -15, happiness: -20, infamy: 15 } },
  ]
},
{
  id: "monster_attack",
  category: "Combat", rarity: "uncommon", minAge: 12,
  narrative: "A monster from the wilderness attacks your village at night. People scatter in panic.",
  choices: [
    { text: "Charge at the beast", effectText: "+Strength, +Reputation, -Health greatly", effects: { strength: 15, reputation: 15, health: -20 } },
    { text: "Lead people to safety", effectText: "+Charisma, +Reputation", effects: { charisma: 10, reputation: 12 } },
    { text: "Trap and study the creature", effectText: "+Intelligence, +Magic", effects: { intelligence: 12, magic: 8 } },
  ]
},
{
  id: "comet_sign",
  category: "Supernatural", rarity: "uncommon", minAge: 5,
  narrative: "A blazing comet appears in the sky and remains for seven nights. The superstitious say it marks the chosen.",
  choices: [
    { text: "Believe you are chosen — act accordingly", effectText: "+Reputation, +Luck, +Faith", effects: { reputation: 10, luck: 10, faith: 10 } },
    { text: "View it as a warning", effectText: "+Intelligence, +Health (caution)", effects: { intelligence: 8, health: 5 } },
    { text: "Use the superstition to your advantage", effectText: "+Charisma, +Infamy", effects: { charisma: 10, infamy: 8 } },
  ]
},
{
  id: "diamond_mine",
  category: "Business", rarity: "legendary", minAge: 30,
  narrative: "A geological survey returns with shocking news: a diamond vein lies beneath your property.",
  choices: [
    { text: "Mine it and sell the gems", effectText: "+Wealth greatly, +Reputation", effects: { wealth: 40, reputation: 15 }, propertyGain: "Diamond Mine" },
    { text: "Keep it secret and mine slowly", effectText: "+Wealth moderate, +Intelligence", effects: { wealth: 25, intelligence: 8 }, propertyGain: "Diamond Mine" },
    { text: "Donate the discovery to the realm", effectText: "+Reputation greatly, +Faith, -Wealth", effects: { reputation: 30, faith: 15, wealth: -5 } },
  ]
},
{
  id: "royal_summons",
  category: "Politics", rarity: "rare", minAge: 25,
  narrative: "A royal seal arrives at your door. The crown requests your presence at the palace immediately.",
  choices: [
    { text: "Attend with full honour", effectText: "+Reputation, +Career, +Intelligence", effects: { reputation: 18, career: 15, intelligence: 8 } },
    { text: "Investigate the summons first", effectText: "+Intelligence, -Reputation delay", effects: { intelligence: 12, reputation: -3 } },
    { text: "Ignore it — you answer to no crown", effectText: "+Infamy, -Career, +Reputation with rebels", effects: { infamy: 15, career: -10, reputation: -5 } },
  ]
},
{
  id: "time_anomaly",
  category: "Supernatural", rarity: "legendary", minAge: 20,
  narrative: "You wake one morning and everyone around you is frozen in time. A figure in grey stands at your window.",
  choices: [
    { text: "Speak to the figure", effectText: "+Magic greatly, +Intelligence, +Faith", effects: { magic: 25, intelligence: 15, faith: 10 } },
    { text: "Try to unfreeze someone you love", effectText: "+Relationships, +Luck", effects: { relationships: 20, luck: 15 } },
    { text: "Use the frozen moment to steal", effectText: "+Wealth, +Infamy, -Faith", effects: { wealth: 30, infamy: 20, faith: -15 } },
  ]
},
{
  id: "prison_break",
  category: "Crime", rarity: "rare", minAge: 16,
  narrative: "You end up imprisoned on false charges. A mysterious fellow prisoner has a plan to break out.",
  choices: [
    { text: "Join the escape plan", effectText: "+Infamy, +Strength, -Health", effects: { infamy: 15, strength: 10, health: -10 } },
    { text: "Work through legal channels", effectText: "+Intelligence, +Reputation, +Career", effects: { intelligence: 10, reputation: 8, career: 8 } },
    { text: "Gather information on everyone inside", effectText: "+Intelligence, +Charisma, +Wealth", effects: { intelligence: 12, charisma: 8, wealth: 10 } },
  ]
},
{
  id: "blacksmith_master",
  category: "Crafts", rarity: "uncommon", minAge: 14,
  narrative: "The greatest blacksmith in the city takes notice of your hands and says you were born to work the forge.",
  choices: [
    { text: "Accept the apprenticeship", effectText: "+Strength, +Career, +Reputation", effects: { strength: 10, career: 10, reputation: 8 } },
    { text: "Train part-time while pursuing other goals", effectText: "+Strength, +Intelligence", effects: { strength: 6, intelligence: 5 } },
    { text: "Decline — not your calling", effectText: "No change", effects: {} },
  ]
},
{
  id: "gambler_debt",
  category: "Crime", rarity: "uncommon", minAge: 18,
  narrative: "A powerful gambling lord reveals you owe a debt you did not know about — inherited from a dead relative.",
  choices: [
    { text: "Negotiate a payment plan", effectText: "+Intelligence, -Wealth moderate", effects: { intelligence: 8, wealth: -15 } },
    { text: "Refuse and let them come", effectText: "+Infamy, -Health risk", effects: { infamy: 15, health: -10 } },
    { text: "Work off the debt through services", effectText: "+Career, +Infamy, -Reputation", effects: { career: 10, infamy: 12, reputation: -10 } },
  ]
},
{
  id: "scholar_debate",
  category: "Education", rarity: "uncommon", minAge: 16,
  narrative: "You are drawn into a great philosophical debate in the city square. Hundreds watch.",
  choices: [
    { text: "Argue passionately and brilliantly", effectText: "+Intelligence, +Reputation, +Charisma", effects: { intelligence: 12, reputation: 10, charisma: 8 } },
    { text: "Listen and learn from both sides", effectText: "+Intelligence, +Faith, +Luck", effects: { intelligence: 8, faith: 6, luck: 5 } },
    { text: "Humiliate your opponent ruthlessly", effectText: "+Infamy, +Intelligence, -Relationships", effects: { infamy: 10, intelligence: 10, relationships: -8 } },
  ]
},
{
  id: "feast_banquet",
  category: "Social", rarity: "common", minAge: 10,
  narrative: "A grand banquet brings together every faction and power in the realm under one roof.",
  choices: [
    { text: "Network aggressively", effectText: "+Charisma, +Relationships, +Career", effects: { charisma: 8, relationships: 10, career: 8 } },
    { text: "Eat, drink and enjoy", effectText: "+Happiness, +Health risk", effects: { happiness: 12, health: -3 } },
    { text: "Eavesdrop on the powerful", effectText: "+Intelligence, +Infamy, +Charisma", effects: { intelligence: 10, infamy: 8, charisma: 5 } },
  ]
},
{
  id: "magical_spring",
  category: "Travel", rarity: "rare", minAge: 14,
  narrative: "Deep in the wilderness, you find a spring that glows faintly silver. The water tastes unlike anything earthly.",
  choices: [
    { text: "Drink deeply", effectText: "+Health, +Magic, +Luck", effects: { health: 15, magic: 15, luck: 8 } },
    { text: "Collect a sample and analyze it", effectText: "+Intelligence, +Magic", effects: { intelligence: 12, magic: 8 } },
    { text: "Mark it on a map and sell the location", effectText: "+Wealth, +Infamy", effects: { wealth: 20, infamy: 8 }, propertyGain: "Mana Spring" },
  ]
},
{
  id: "sky_island",
  category: "Adventure", rarity: "legendary", minAge: 18,
  narrative: "A sky ship offers you passage to an island that floats among the clouds — home to beings untouched by mortality.",
  choices: [
    { text: "Go — embrace the unknown", effectText: "+Magic, +Intelligence, +Luck, +Faith", effects: { magic: 20, intelligence: 15, luck: 10, faith: 10 } },
    { text: "Bring back something from up there", effectText: "+Wealth, +Reputation, +Infamy", effects: { wealth: 25, reputation: 12, infamy: 8 }, propertyGain: "Sky Island" },
    { text: "Decline — too far from everything", effectText: "+Happiness, +Health", effects: { happiness: 8, health: 5 } },
  ]
},
{
  id: "assassin_sent",
  category: "Combat", rarity: "rare", minAge: 20,
  narrative: "You wake to find an assassin's blade at your throat. Whoever sent them was very well-informed.",
  choices: [
    { text: "Overpower the assassin", effectText: "+Strength, +Reputation, -Health", effects: { strength: 12, reputation: 10, health: -15 } },
    { text: "Talk your way out of it", effectText: "+Charisma, +Intelligence", effects: { charisma: 12, intelligence: 10 } },
    { text: "Let them complete the job — and fake your death", effectText: "+Luck, +Infamy, +Intelligence", effects: { luck: 15, infamy: 20, intelligence: 12 } },
  ]
},
{
  id: "dream_prophecy",
  category: "Supernatural", rarity: "uncommon", minAge: 10,
  narrative: "You dream with perfect clarity of an event that has not yet happened — and it feels completely real.",
  choices: [
    { text: "Act on the prophecy immediately", effectText: "+Luck, +Intelligence, +Faith", effects: { luck: 12, intelligence: 8, faith: 8 } },
    { text: "Document it and wait for confirmation", effectText: "+Intelligence, +Reputation", effects: { intelligence: 10, reputation: 8 } },
    { text: "Ignore dreams — superstition is foolish", effectText: "+Charisma, -Luck", effects: { charisma: 5, luck: -8 } },
  ]
},
{
  id: "rebellion_erupts",
  category: "Politics", rarity: "rare", minAge: 16,
  narrative: "A full rebellion erupts against the ruling power. People flood the streets with weapons and torches.",
  choices: [
    { text: "Join the rebellion", effectText: "+Infamy, +Strength, +Reputation with rebels, -Safety", effects: { infamy: 15, strength: 10, reputation: -5, health: -10 } },
    { text: "Defend the existing order", effectText: "+Career, +Reputation, -Infamy, risk", effects: { career: 12, reputation: 10, infamy: -5, health: -8 } },
    { text: "Stay neutral and profit from the chaos", effectText: "+Wealth, +Intelligence", effects: { wealth: 20, intelligence: 10 } },
  ]
},
{
  id: "vampire_encounter",
  category: "Supernatural", rarity: "rare", minAge: 16,
  narrative: "You come face to face with a creature of the night who could kill you instantly — but chooses conversation instead.",
  choices: [
    { text: "Engage them in dialogue", effectText: "+Charisma, +Intelligence, +Magic", effects: { charisma: 10, intelligence: 10, magic: 8 } },
    { text: "Attack with every ounce of strength", effectText: "+Strength, +Infamy, -Health greatly", effects: { strength: 12, infamy: 10, health: -25 } },
    { text: "Offer a bargain", effectText: "+Wealth, +Luck, +Infamy", effects: { wealth: 15, luck: 8, infamy: 12 } },
  ]
},
{
  id: "arena_championship",
  category: "Combat", rarity: "uncommon", minAge: 18, statReq: { strength: 40 },
  narrative: "The grand arena championship is open to challengers. The winner earns gold, fame, and a title.",
  choices: [
    { text: "Enter the championship", effectText: "+Strength, +Reputation, -Health", effects: { strength: 15, reputation: 20, health: -15 } },
    { text: "Train a champion protégé instead", effectText: "+Reputation, +Relationships, +Career", effects: { reputation: 12, relationships: 10, career: 8 } },
    { text: "Bet heavily on the outcome", effectText: "+Wealth if win, risk", effects: { wealth: 25, luck: -5 } },
  ]
},
{
  id: "cursed_bloodline",
  category: "Supernatural", rarity: "rare", minAge: 14,
  narrative: "You discover your bloodline carries an ancient curse that has claimed every ancestor before middle age.",
  choices: [
    { text: "Research a cure obsessively", effectText: "+Intelligence, +Magic, +Career, -Wealth", effects: { intelligence: 15, magic: 12, career: 8, wealth: -10 } },
    { text: "Accept fate and live fully", effectText: "+Happiness, +Faith, +Luck", effects: { happiness: 15, faith: 10, luck: 8 } },
    { text: "Bargain with dark powers to lift it", effectText: "+Health, +Magic, -Faith, -Reputation", effects: { health: 20, magic: 15, faith: -15, reputation: -8 } },
  ]
},
{
  id: "forbidden_library",
  category: "Education", rarity: "rare", minAge: 16,
  narrative: "You gain access to a library of forbidden knowledge sealed by order of the crown centuries ago.",
  choices: [
    { text: "Read every book you can", effectText: "+Intelligence greatly, +Magic, -Faith, -Health", effects: { intelligence: 20, magic: 15, faith: -10, health: -8 } },
    { text: "Catalog and report the contents", effectText: "+Reputation, +Intelligence, +Career", effects: { reputation: 15, intelligence: 12, career: 10 } },
    { text: "Sell access to the library", effectText: "+Wealth, +Infamy, -Reputation", effects: { wealth: 25, infamy: 15, reputation: -12 } },
  ]
},
{
  id: "war_starts",
  category: "War", rarity: "uncommon", minAge: 16,
  narrative: "War breaks out between two great powers. Every able person is expected to choose a side.",
  choices: [
    { text: "Enlist as a soldier", effectText: "+Strength, +Reputation, -Health", effects: { strength: 15, reputation: 12, health: -10 } },
    { text: "Work as a war profiteer", effectText: "+Wealth, +Infamy", effects: { wealth: 25, infamy: 15 } },
    { text: "Flee the region entirely", effectText: "+Luck, -Reputation", effects: { luck: 8, reputation: -10 } },
    { text: "Work as a spy for both sides", effectText: "+Intelligence, +Wealth, risk", effects: { intelligence: 12, wealth: 20, health: -10 } },
  ]
},
{
  id: "haunted_mansion",
  category: "Supernatural", rarity: "uncommon", minAge: 14,
  narrative: "A local mansion has been empty for twenty years — nobody survives a night inside. You're dared to try.",
  choices: [
    { text: "Spend the full night and document everything", effectText: "+Intelligence, +Reputation, +Magic", effects: { intelligence: 12, reputation: 10, magic: 8 } },
    { text: "Go in armed and aggressive", effectText: "+Strength, +Infamy, -Health", effects: { strength: 8, infamy: 10, health: -10 } },
    { text: "Try to communicate with the spirits inside", effectText: "+Magic, +Faith, +Intelligence", effects: { magic: 12, faith: 8, intelligence: 8 } },
  ]
},
{
  id: "phoenix_sighting",
  category: "Supernatural", rarity: "legendary", minAge: 8,
  narrative: "A phoenix burns across the dawn sky and lands briefly before you — leaving one golden feather at your feet.",
  choices: [
    { text: "Keep the feather — it pulses with power", effectText: "+Magic, +Luck, +Faith greatly", effects: { magic: 20, luck: 15, faith: 15 } },
    { text: "Return it to the creature", effectText: "+Faith, +Luck greatly, +Reputation", effects: { faith: 20, luck: 20, reputation: 12 } },
    { text: "Sell the feather for a fortune", effectText: "+Wealth greatly, -Luck, -Faith", effects: { wealth: 40, luck: -12, faith: -10 } },
  ]
},
{
  id: "siege_city",
  category: "War", rarity: "rare", minAge: 16,
  narrative: "Your city falls under siege. Walls hold for now, but food runs low and morale is crumbling.",
  choices: [
    { text: "Rally the defenders and organize the defense", effectText: "+Charisma, +Reputation, +Strength", effects: { charisma: 12, reputation: 15, strength: 10 } },
    { text: "Sneak out and seek reinforcements", effectText: "+Intelligence, +Strength, -Health", effects: { intelligence: 10, strength: 8, health: -10 } },
    { text: "Negotiate surrender terms", effectText: "+Intelligence, +Charisma, -Reputation", effects: { intelligence: 12, charisma: 8, reputation: -8 } },
  ]
},
{
  id: "corrupt_judge",
  category: "Justice", rarity: "uncommon", minAge: 18,
  narrative: "A corrupt judge demands a bribe to clear a false charge against you — or you face prison.",
  choices: [
    { text: "Pay the bribe", effectText: "-Wealth, +Freedom", effects: { wealth: -20, happiness: 5 } },
    { text: "Expose the judge publicly", effectText: "+Reputation, +Infamy, -Safety", effects: { reputation: 15, infamy: 10, luck: -8 } },
    { text: "Gather evidence and blackmail him instead", effectText: "+Wealth, +Infamy, +Intelligence", effects: { wealth: 15, infamy: 15, intelligence: 8 } },
  ]
},
{
  id: "temple_blessing",
  category: "Religion", rarity: "uncommon", minAge: 5,
  narrative: "The high priest singles you out during a public ceremony and places hands on your brow in blessing.",
  choices: [
    { text: "Embrace the blessing fully", effectText: "+Faith, +Luck, +Health", effects: { faith: 15, luck: 10, health: 8 } },
    { text: "Feel uncomfortable but accept gracefully", effectText: "+Reputation, +Faith", effects: { reputation: 8, faith: 8 } },
    { text: "Reject the public display", effectText: "+Infamy, +Charisma, -Faith", effects: { infamy: 8, charisma: 8, faith: -5 } },
  ]
},
{
  id: "first_love_lost",
  category: "Romance", rarity: "uncommon", minAge: 16, maxAge: 22, romanceReq: "mild",
  narrative: "Your first true love is moving to a distant land. They ask if you will go with them.",
  choices: [
    { text: "Leave everything and go with them", effectText: "+Happiness, +Luck, -Career, -Relationships", effects: { happiness: 20, luck: 10, career: -10, relationships: -8 } },
    { text: "Let them go — promise to write", effectText: "-Happiness, +Reputation, +Career", effects: { happiness: -15, reputation: 8, career: 8 } },
    { text: "Beg them to stay", effectText: "-Charisma, +Relationships chance", effects: { charisma: -5, relationships: 5, happiness: -5 } },
  ]
},

// ===========================
// MYSTICAL PATH ENTRY EVENTS
// These unlock a path for characters with mysticalPath === "none"
// ===========================
{
  id: "cult_family_birth",
  category: "Cultivation", rarity: "uncommon", minAge: 0, maxAge: 8,
  pathEntry: "cultivation",
  narrative: "You were born into a family of cultivators. From your first breath, Qi flows through you differently — your family wastes no time beginning your training.",
  choices: [
    { text: "Begin cultivation training eagerly", effectText: "+Magic, +Strength, unlock Cultivation Path", effects: { magic: 15, strength: 10, health: 5 }, unlockPath: "cultivation", mysticalExp: 50 },
    { text: "Resist family pressure — find your own way", effectText: "+Charisma, +Intelligence", effects: { charisma: 10, intelligence: 8 } },
    { text: "Accept training but also study other arts", effectText: "+Magic, +Intelligence", effects: { magic: 10, intelligence: 10 }, unlockPath: "cultivation", mysticalExp: 25 },
  ]
},
{
  id: "wandering_guru",
  category: "Cultivation", rarity: "uncommon", minAge: 6, maxAge: 15,
  pathEntry: "cultivation",
  narrative: "A wandering cultivator — ragged but crackling with quiet power — stops and stares at you intensely. 'Your meridians are special,' they say. 'I will teach you if you are willing.'",
  choices: [
    { text: "Accept their teaching immediately", effectText: "+Magic, +Strength, unlock Cultivation Path", effects: { magic: 18, strength: 12 }, unlockPath: "cultivation", mysticalExp: 60 },
    { text: "Ask for proof of their power first", effectText: "+Intelligence, +Magic after proof", effects: { intelligence: 8, magic: 12 }, unlockPath: "cultivation", mysticalExp: 40 },
    { text: "Decline — they seem dangerous", effectText: "+Luck, +Charisma", effects: { luck: 8, charisma: 6 } },
  ]
},
{
  id: "martial_sect_invite",
  category: "Cultivation", rarity: "uncommon", minAge: 10, maxAge: 20,
  pathEntry: "cultivation",
  narrative: "A martial sect sends recruiters testing potential disciples across the realm. Somehow, you passed their hidden spiritual test.",
  choices: [
    { text: "Join the sect — enter full training", effectText: "+Magic, +Strength, +Reputation, unlock Cultivation Path", effects: { magic: 15, strength: 12, reputation: 10 }, unlockPath: "cultivation", mysticalExp: 70, propertyGain: "Martial Sect Grounds" },
    { text: "Request time to think", effectText: "+Intelligence", effects: { intelligence: 6 } },
    { text: "Decline — you prefer independence", effectText: "+Charisma, +Luck", effects: { charisma: 8, luck: 5 } },
  ]
},
{
  id: "ancient_manual_found",
  category: "Cultivation", rarity: "rare", minAge: 8, maxAge: 20,
  pathEntry: "cultivation",
  narrative: "Hidden behind a crumbling wall, you find an ancient cultivation manual still vibrating with sealed Qi. Most of it is undamaged.",
  choices: [
    { text: "Study and practice immediately", effectText: "+Magic, +Intelligence, unlock Cultivation Path", effects: { magic: 20, intelligence: 12, health: -5 }, unlockPath: "cultivation", mysticalExp: 80, propertyGain: "Ancient Cultivation Manual" },
    { text: "Share it with scholars for study", effectText: "+Reputation, +Intelligence", effects: { reputation: 12, intelligence: 10 } },
    { text: "Sell it at auction for a fortune", effectText: "+Wealth greatly, -Luck", effects: { wealth: 35, luck: -8 } },
  ]
},
{
  id: "dragon_vein_awakening",
  category: "Cultivation", rarity: "legendary", minAge: 3, maxAge: 12,
  pathEntry: "cultivation",
  narrative: "While playing in the wilderness you fall into a hidden valley where an ancient Dragon Vein pulses beneath the earth. Energy floods your body and opens every meridian.",
  choices: [
    { text: "Surrender to the energy completely", effectText: "+Magic greatly, +Strength, unlock Cultivation Path — powerful awakening", effects: { magic: 25, strength: 15, health: 10, luck: 10 }, unlockPath: "cultivation", mysticalExp: 120, propertyGain: "Dragon Vein Node" },
    { text: "Pull back before being overwhelmed", effectText: "+Magic, +Health", effects: { magic: 12, health: 8 }, unlockPath: "cultivation", mysticalExp: 60 },
  ]
},
// ARCANE MAGIC PATH ENTRY
{
  id: "arcanum_scholarship",
  category: "Arcane", rarity: "uncommon", minAge: 10, maxAge: 16,
  pathEntry: "arcane_magic",
  narrative: "A letter bearing the silver seal of the Arcanum arrives. You have been selected for the elite Arcanist training programme — fewer than one in ten thousand qualify.",
  choices: [
    { text: "Accept — enter the Arcanum", effectText: "+Magic, +Intelligence, +Reputation, unlock Arcane Magic Path", effects: { magic: 18, intelligence: 15, reputation: 10 }, unlockPath: "arcane_magic", mysticalExp: 60, propertyGain: "Arcane Academy Wing" },
    { text: "Defer — you need more time", effectText: "+Intelligence", effects: { intelligence: 8 } },
    { text: "Decline — you prefer a different path", effectText: "+Charisma, +Career", effects: { charisma: 6, career: 6 } },
  ]
},
{
  id: "mage_apprentice",
  category: "Arcane", rarity: "uncommon", minAge: 8, maxAge: 18,
  pathEntry: "arcane_magic",
  narrative: "A wandering mage pauses and studies your hands. 'You channel mana without knowing it,' she says. 'I can train you.'",
  choices: [
    { text: "Accept apprenticeship eagerly", effectText: "+Magic, +Intelligence, unlock Arcane Path", effects: { magic: 15, intelligence: 12 }, unlockPath: "arcane_magic", mysticalExp: 50 },
    { text: "Study under them part-time", effectText: "+Magic, +Career", effects: { magic: 10, career: 6 }, unlockPath: "arcane_magic", mysticalExp: 30 },
    { text: "Decline politely", effectText: "+Reputation", effects: { reputation: 5 } },
  ]
},
{
  id: "spellbook_discovered",
  category: "Arcane", rarity: "rare", minAge: 10, maxAge: 22,
  pathEntry: "arcane_magic",
  narrative: "A crumbling vault beneath the city holds a sealed spellbook that blazes with light the moment you touch it.",
  choices: [
    { text: "Begin casting immediately — consequences later", effectText: "+Magic greatly, unlock Arcane Path, -Health", effects: { magic: 22, health: -10, intelligence: 8 }, unlockPath: "arcane_magic", mysticalExp: 80, propertyGain: "Arcane Spellbook Vault" },
    { text: "Study methodically before casting", effectText: "+Intelligence, +Magic, unlock Arcane Path", effects: { intelligence: 12, magic: 15 }, unlockPath: "arcane_magic", mysticalExp: 60 },
    { text: "Report to the Arcanum for rewards", effectText: "+Reputation, +Wealth, +Career", effects: { reputation: 12, wealth: 15, career: 8 } },
  ]
},
// SACRED ARTS PATH ENTRY
{
  id: "divine_calling",
  category: "Sacred", rarity: "uncommon", minAge: 6, maxAge: 18,
  pathEntry: "sacred_arts",
  narrative: "A divine voice speaks to you in the silence between heartbeats — clear, warm, and impossible to doubt. The gods have noticed you.",
  choices: [
    { text: "Answer the calling — dedicate your life", effectText: "+Faith, +Magic, +Luck, unlock Sacred Arts Path", effects: { faith: 20, magic: 12, luck: 10 }, unlockPath: "sacred_arts", mysticalExp: 60, propertyGain: "Sacred Shrine" },
    { text: "Seek out a temple to understand the vision", effectText: "+Faith, +Intelligence, unlock Sacred Arts Path", effects: { faith: 15, intelligence: 10 }, unlockPath: "sacred_arts", mysticalExp: 40 },
    { text: "Dismiss it as fatigue or imagination", effectText: "+Charisma, -Faith", effects: { charisma: 5, faith: -5 } },
  ]
},
{
  id: "temple_chosen",
  category: "Sacred", rarity: "uncommon", minAge: 8, maxAge: 20,
  pathEntry: "sacred_arts",
  narrative: "The high temple holds a once-a-generation rite to select sacred artisans. Against all odds, the holy flame chooses you.",
  choices: [
    { text: "Accept the sacred duty", effectText: "+Faith, +Reputation, +Magic, unlock Sacred Arts Path", effects: { faith: 18, reputation: 15, magic: 10 }, unlockPath: "sacred_arts", mysticalExp: 55 },
    { text: "Accept but continue your normal life too", effectText: "+Faith, +Charisma, unlock Sacred Arts Path", effects: { faith: 12, charisma: 8 }, unlockPath: "sacred_arts", mysticalExp: 30 },
    { text: "Decline the honour", effectText: "+Infamy, -Faith", effects: { infamy: 8, faith: -8 } },
  ]
},
// RUNE SMITH PATH ENTRY
{
  id: "dwarf_rune_master",
  category: "Rune", rarity: "uncommon", minAge: 10, maxAge: 22,
  pathEntry: "rune_smith",
  narrative: "A Dwarvish rune-master offers to teach you the ancient art of rune inscription — a tradition kept secret from surface-dwellers for centuries.",
  choices: [
    { text: "Accept eagerly and learn everything", effectText: "+Strength, +Intelligence, unlock Rune Smith Path", effects: { strength: 10, intelligence: 12, magic: 8 }, unlockPath: "rune_smith", mysticalExp: 55, propertyGain: "Rune Forge" },
    { text: "Learn cautiously alongside other studies", effectText: "+Intelligence, +Strength, unlock Rune Smith Path", effects: { intelligence: 10, strength: 6 }, unlockPath: "rune_smith", mysticalExp: 30 },
    { text: "Decline — not your calling", effectText: "+Charisma", effects: { charisma: 5 } },
  ]
},
{
  id: "rune_inscription_found",
  category: "Rune", rarity: "rare", minAge: 10, maxAge: 20,
  pathEntry: "rune_smith",
  narrative: "You find a stone wall covered in glowing runes deep in a cave. When you run your finger along them, they begin carving themselves onto your skin.",
  choices: [
    { text: "Let them inscribe freely — embrace it", effectText: "+Strength, +Magic, +Intelligence, unlock Rune Smith Path", effects: { strength: 12, magic: 15, intelligence: 10, health: -8 }, unlockPath: "rune_smith", mysticalExp: 70 },
    { text: "Copy the runes and study them first", effectText: "+Intelligence, +Magic, unlock Rune Smith Path", effects: { intelligence: 12, magic: 8 }, unlockPath: "rune_smith", mysticalExp: 45 },
    { text: "Back away immediately", effectText: "+Luck", effects: { luck: 6 } },
  ]
},

// ===========================
// CULTIVATION PATH EVENTS
// ===========================
{
  id: "qi_breakthrough",
  category: "Cultivation", rarity: "uncommon", minAge: 12, mysticalPathReq: "cultivation",
  narrative: "Your Qi is building toward a critical pressure point. A breakthrough is imminent — but breakthroughs can kill as easily as elevate.",
  choices: [
    { text: "Push through immediately — now or never", effectText: "+Magic, +Strength, +Cultivation Exp, risk", effects: { magic: 15, strength: 12, health: -10 }, mysticalExp: 80 },
    { text: "Prepare for weeks before attempting", effectText: "+Magic, +Intelligence, +Cultivation Exp", effects: { magic: 10, intelligence: 8, health: 5 }, mysticalExp: 55 },
    { text: "Seek a master's guidance", effectText: "+Magic, +Cultivation Exp, +Reputation", effects: { magic: 12, reputation: 8 }, mysticalExp: 65 },
  ]
},
{
  id: "sect_tournament",
  category: "Cultivation", rarity: "uncommon", minAge: 14, mysticalPathReq: "cultivation",
  narrative: "The great sect tournament begins. Cultivators from across the realm gather to demonstrate power and compete for inner sect status.",
  choices: [
    { text: "Enter and fight for first place", effectText: "+Strength, +Reputation, +Cultivation Exp", effects: { strength: 18, reputation: 20, health: -10 }, mysticalExp: 90 },
    { text: "Observe and learn from watching", effectText: "+Intelligence, +Cultivation Exp", effects: { intelligence: 12 }, mysticalExp: 40 },
    { text: "Challenge only weaker opponents to guarantee wins", effectText: "+Reputation moderate, +Cultivation Exp", effects: { reputation: 10, strength: 8 }, mysticalExp: 60 },
  ]
},
{
  id: "evil_cultivator",
  category: "Cultivation", rarity: "rare", minAge: 16, mysticalPathReq: "cultivation",
  narrative: "A demonic cultivator challenges you, having harvested Qi from dozens of innocents. They are far stronger than you — and want your cultivation.",
  choices: [
    { text: "Fight with everything you have", effectText: "+Strength, +Cultivation Exp greatly, -Health", effects: { strength: 20, health: -25, magic: 10 }, mysticalExp: 120 },
    { text: "Flee and warn others", effectText: "+Reputation, +Luck", effects: { reputation: 15, luck: 8 } },
    { text: "Attempt to seal them", effectText: "+Magic, +Faith, +Cultivation Exp, -Health", effects: { magic: 15, faith: 10, health: -15 }, mysticalExp: 80 },
  ]
},
{
  id: "spirit_pill_auction",
  category: "Cultivation", rarity: "rare", minAge: 18, mysticalPathReq: "cultivation",
  narrative: "A legendary Heaven-grade Spirit Pill surfaces at auction. It could accelerate your cultivation by years — but the price is ruinous.",
  choices: [
    { text: "Bid everything you have", effectText: "+Magic greatly, +Cultivation Exp greatly, -Wealth", effects: { magic: 25, wealth: -30 }, mysticalExp: 150 },
    { text: "Bid modestly for a lesser pill", effectText: "+Magic moderate, +Cultivation Exp", effects: { magic: 12, wealth: -10 }, mysticalExp: 70 },
    { text: "Steal the pill during the chaos of bidding", effectText: "+Magic, +Infamy, -Reputation, risk", effects: { magic: 20, infamy: 20, reputation: -15 }, mysticalExp: 120 },
  ]
},
{
  id: "cultivation_rival",
  category: "Cultivation", rarity: "uncommon", minAge: 14, mysticalPathReq: "cultivation",
  narrative: "A rival cultivator of equal rank has vowed to surpass you — and has been training twice as hard. You can see their progress.",
  choices: [
    { text: "Train even harder than them", effectText: "+Strength, +Magic, +Cultivation Exp, -Health", effects: { strength: 12, magic: 12, health: -10 }, mysticalExp: 80 },
    { text: "Befriend them — rival and ally", effectText: "+Relationships, +Intelligence, +Cultivation Exp", effects: { relationships: 15, intelligence: 8 }, mysticalExp: 50 },
    { text: "Sabotage their training", effectText: "+Infamy, +Cultivation Exp relative, -Reputation", effects: { infamy: 15, reputation: -12 }, mysticalExp: 40 },
  ]
},
{
  id: "dao_insight",
  category: "Cultivation", rarity: "legendary", minAge: 20, mysticalPathReq: "cultivation",
  narrative: "In deep meditation you touch something vast — the Dao itself, or perhaps its shadow. A law of the universe bends toward you.",
  choices: [
    { text: "Grasp the insight with both hands", effectText: "+Magic greatly, +Cultivation Exp greatly, +Intelligence, -Health", effects: { magic: 30, intelligence: 15, health: -15 }, mysticalExp: 200 },
    { text: "Let it wash through you gently", effectText: "+Magic, +Faith, +Luck, +Cultivation Exp", effects: { magic: 18, faith: 12, luck: 10 }, mysticalExp: 120 },
    { text: "Record every detail before it fades", effectText: "+Intelligence, +Cultivation Exp, +Magic", effects: { intelligence: 15, magic: 12 }, mysticalExp: 100 },
  ]
},
{
  id: "heavenly_tribulation",
  category: "Cultivation", rarity: "legendary", minAge: 25, mysticalPathReq: "cultivation",
  narrative: "As your cultivation peaks, the heavens send down tribulation lightning — the universe's test of whether you deserve your power.",
  choices: [
    { text: "Stand and absorb the tribulation", effectText: "+Magic greatly, +Cultivation Exp greatly, -Health risk", effects: { magic: 35, health: -30 }, mysticalExp: 250 },
    { text: "Redirect the lightning through formations", effectText: "+Intelligence, +Magic, +Cultivation Exp", effects: { intelligence: 15, magic: 20 }, mysticalExp: 180 },
    { text: "Scatter the tribulation across the land", effectText: "+Magic, +Infamy, -Reputation, -Faith", effects: { magic: 20, infamy: 20, reputation: -10, faith: -10 }, mysticalExp: 150 },
  ]
},
// ARCANE MAGIC PATH EVENTS
{
  id: "arcane_portal",
  category: "Arcane", rarity: "rare", minAge: 16, mysticalPathReq: "arcane_magic",
  narrative: "You accidentally tear open a rift to another plane of existence. Something vast stirs within.",
  choices: [
    { text: "Reach through the rift", effectText: "+Magic greatly, +Intelligence, -Health", effects: { magic: 22, intelligence: 12, health: -15 }, mysticalExp: 100 },
    { text: "Seal it carefully", effectText: "+Magic, +Reputation, +Intelligence", effects: { magic: 15, reputation: 10, intelligence: 8 }, mysticalExp: 60 },
    { text: "Lure something through as a servant", effectText: "+Magic, +Infamy, risk", effects: { magic: 18, infamy: 15, health: -10 }, mysticalExp: 80 },
  ]
},
{
  id: "spellfire_mastery",
  category: "Arcane", rarity: "uncommon", minAge: 14, mysticalPathReq: "arcane_magic",
  narrative: "Your fire spells have evolved beyond the textbooks — they burn with a colour the masters say they have never seen.",
  choices: [
    { text: "Push this unique power to its limits", effectText: "+Magic, +Reputation, +Arcane Exp, -Health", effects: { magic: 18, reputation: 12, health: -8 }, mysticalExp: 80 },
    { text: "Report the anomaly to the Arcanum", effectText: "+Reputation, +Intelligence, +Arcane Exp", effects: { reputation: 15, intelligence: 10 }, mysticalExp: 55 },
    { text: "Keep it secret — power is advantage", effectText: "+Magic, +Infamy, +Arcane Exp", effects: { magic: 12, infamy: 10 }, mysticalExp: 65 },
  ]
},
// SACRED ARTS EVENTS
{
  id: "divine_healing",
  category: "Sacred", rarity: "uncommon", minAge: 14, mysticalPathReq: "sacred_arts",
  narrative: "A dying person is brought to you and your hands glow without your intention. The gods are working through you.",
  choices: [
    { text: "Channel every ounce of divine energy", effectText: "+Faith, +Reputation greatly, +Sacred Exp, -Health", effects: { faith: 20, reputation: 20, health: -15 }, mysticalExp: 90 },
    { text: "Heal carefully to preserve your own strength", effectText: "+Faith, +Reputation, +Sacred Exp", effects: { faith: 15, reputation: 12 }, mysticalExp: 55 },
    { text: "Demand payment before healing", effectText: "+Wealth, +Infamy, -Faith", effects: { wealth: 20, infamy: 15, faith: -10 } },
  ]
},
{
  id: "holy_trial",
  category: "Sacred", rarity: "rare", minAge: 18, mysticalPathReq: "sacred_arts",
  narrative: "The divine court tests your worth by placing you in a realm of pure moral choice with no material consequence.",
  choices: [
    { text: "Act with absolute integrity", effectText: "+Faith greatly, +Luck, +Sacred Exp, +Reputation", effects: { faith: 25, luck: 12, reputation: 15 }, mysticalExp: 120 },
    { text: "Act pragmatically for greater good", effectText: "+Intelligence, +Faith, +Sacred Exp", effects: { intelligence: 12, faith: 15 }, mysticalExp: 80 },
    { text: "Act self-interestedly", effectText: "+Infamy, -Faith, +Wealth", effects: { infamy: 12, faith: -15, wealth: 10 } },
  ]
},
// RUNE SMITH EVENTS
{
  id: "body_rune",
  category: "Rune", rarity: "uncommon", minAge: 14, mysticalPathReq: "rune_smith",
  narrative: "You are ready to inscribe your first major body rune. The pain will be extraordinary — but so will the power.",
  choices: [
    { text: "Inscribe the strength rune", effectText: "+Strength greatly, +Rune Exp, -Health", effects: { strength: 20, health: -12 }, mysticalExp: 80 },
    { text: "Inscribe the mind rune", effectText: "+Intelligence, +Magic, +Rune Exp, -Health", effects: { intelligence: 18, magic: 10, health: -10 }, mysticalExp: 80 },
    { text: "Inscribe a ward rune for protection", effectText: "+Health, +Luck, +Rune Exp", effects: { health: 15, luck: 10 }, mysticalExp: 70 },
  ]
},
{
  id: "rune_forge_mastery",
  category: "Rune", rarity: "rare", minAge: 20, mysticalPathReq: "rune_smith",
  narrative: "Your forge produces a weapon inscribed with runes so perfect that it glows independent of flame.",
  choices: [
    { text: "Keep it — wield this power", effectText: "+Strength, +Reputation, +Rune Exp", effects: { strength: 15, reputation: 15 }, mysticalExp: 100 },
    { text: "Gift it to your greatest ally", effectText: "+Relationships greatly, +Reputation, +Rune Exp", effects: { relationships: 20, reputation: 12 }, mysticalExp: 80 },
    { text: "Sell it — the coin is more useful", effectText: "+Wealth greatly, +Rune Exp", effects: { wealth: 40 }, mysticalExp: 60 },
  ]
},

// ===========================
// MORE ROMANCE (mild/explicit)
// ===========================
{
  id: "rivals_passion",
  category: "Romance", rarity: "uncommon", minAge: 18, maxAge: 40, romanceReq: "mild",
  narrative: "Your most bitter rival corners you alone — and the argument dissolves into something neither of you planned.",
  choices: [
    { text: "Give in to the moment", effectText: "+Happiness, +Charisma, +Relationships", effects: { happiness: 18, charisma: 10, relationships: 8 } },
    { text: "Pull back — this is a mistake", effectText: "+Reputation, -Happiness", effects: { reputation: 8, happiness: -8 } },
    { text: "Use it as leverage against them", effectText: "+Infamy, +Wealth, -Relationships", effects: { infamy: 12, wealth: 10, relationships: -5 } },
  ]
},
{
  id: "midnight_garden",
  category: "Romance", rarity: "rare", minAge: 16, maxAge: 35, romanceReq: "explicit",
  narrative: "Beneath a harvest moon in a private garden, a moment becomes an evening — and the evening becomes a night you will not forget.",
  choices: [
    { text: "Surrender to the night fully", effectText: "+Happiness greatly, +Charisma, +Magic (life energy)", effects: { happiness: 25, charisma: 12, magic: 8 } },
    { text: "Keep a part of yourself separate", effectText: "+Happiness, +Intelligence", effects: { happiness: 15, intelligence: 8 } },
    { text: "Leave at dawn with no promises", effectText: "+Infamy, +Charisma, -Relationships", effects: { infamy: 8, charisma: 10, relationships: -5 } },
  ]
},
{
  id: "patron_of_arts",
  category: "Romance", rarity: "uncommon", minAge: 22, maxAge: 50, romanceReq: "explicit",
  narrative: "A renowned artist dedicates a work to you publicly — and privately offers much more in their studio.",
  choices: [
    { text: "Accept both the dedication and the invitation", effectText: "+Happiness, +Reputation, +Charisma", effects: { happiness: 20, reputation: 8, charisma: 12 } },
    { text: "Accept the honour — decline the rest", effectText: "+Reputation, -Happiness slightly", effects: { reputation: 12, happiness: -5 } },
    { text: "Fund their work and become deeply involved", effectText: "+Reputation, +Happiness, +Relationships", effects: { reputation: 10, happiness: 15, relationships: 12 } },
  ]
},
{
  id: "longing_letter",
  category: "Romance", rarity: "common", minAge: 16, romanceReq: "mild",
  narrative: "An unsigned letter arrives — burning with longing, beautiful in its desperation, clearly meant for you alone.",
  choices: [
    { text: "Write back with equal passion", effectText: "+Happiness, +Charisma, +Relationships", effects: { happiness: 12, charisma: 8, relationships: 10 } },
    { text: "Investigate who sent it", effectText: "+Intelligence, +Luck", effects: { intelligence: 8, luck: 6 } },
    { text: "Ignore it entirely", effectText: "-Happiness, +Focus (career)", effects: { happiness: -5, career: 5 } },
  ]
},
{
  id: "ancient_armory_discovery",
  category: "Adventure", rarity: "rare", minAge: 20, maxAge: 60,
  narrative: "While exploring a forgotten cavern, you stumble upon a sealed stone door. Inside, ancient weapons lay dormant.",
  choices: [
    { text: "Take the glowing sword", effectText: "+Strength, +Reputation, Gain Item", effects: { strength: 15, reputation: 10 }, itemGain: "Ancient Glowing Sword", titleGain: "Blade Finder" },
    { text: "Take the shimmering cloak", effectText: "+Magic, +Luck, Gain Item", effects: { magic: 15, luck: 10 }, itemGain: "Shimmering Cloak" },
    { text: "Report the find to the kingdom", effectText: "+Reputation greatly, +Wealth", effects: { reputation: 25, wealth: 20 } },
  ]
},
{
  id: "mystic_tournament_champion",
  category: "Combat", rarity: "legendary", minAge: 25,
  narrative: "The Grand Astral Tournament is held once every century. You have fought your way to the final match.",
  choices: [
    { text: "Fight with all your might", effectText: "+Strength, +Magic, +Reputation, Gain Title", effects: { strength: 20, magic: 20, reputation: 30 }, itemGain: "Astral Trophy", titleGain: "Astral Champion" },
    { text: "Use a forbidden technique to ensure victory", effectText: "+Strength greatly, +Infamy, -Health", effects: { strength: 30, infamy: 20, health: -15 }, titleGain: "Ruthless Victor" },
    { text: "Yield the match gracefully", effectText: "+Charisma, +Relationships, -Reputation", effects: { charisma: 15, relationships: 10, reputation: -10 } },
  ]
},
{
  id: "dragon_egg_merchant",
  category: "Supernatural", rarity: "rare", minAge: 18,
  narrative: "A shady merchant in a dark alley offers you a large, scaly, warm egg. He swears it's a dragon egg.",
  choices: [
    { text: "Buy it immediately", effectText: "-Wealth greatly, +Luck, Gain Item", effects: { wealth: -40, luck: 15 }, itemGain: "Unhatched Dragon Egg", titleGain: "Dragon Keeper" },
    { text: "Steal it", effectText: "+Infamy, +Luck, -Reputation", effects: { infamy: 20, luck: 10, reputation: -15 }, itemGain: "Stolen Dragon Egg" },
    { text: "Refuse the scam", effectText: "+Intelligence, +Wealth (kept)", effects: { intelligence: 10 } },
  ]
},
{
  id: "royal_recognition",
  category: "Politics", rarity: "uncommon", minAge: 30,
  narrative: "The monarch has noticed your exceptional deeds and summons you to the throne room.",
  choices: [
    { text: "Accept a knighthood", effectText: "+Reputation, +Career, Gain Title", effects: { reputation: 20, career: 15 }, titleGain: "Knight of the Realm", itemGain: "Royal Signet" },
    { text: "Ask for gold instead", effectText: "+Wealth greatly, -Reputation", effects: { wealth: 35, reputation: -10 } },
    { text: "Pledge secret service to the crown", effectText: "+Intelligence, +Infamy, Gain Title", effects: { intelligence: 15, infamy: 10 }, titleGain: "Shadow Hand" },
  ]
}
];

export function getRandomEvent(state: GameState): GameEvent | null {
  const possible = events.filter(e => {
    if (e.minAge !== undefined && state.age < e.minAge) return false;
    if (e.maxAge !== undefined && state.age > e.maxAge) return false;
    if (e.bloodlineReq && !e.bloodlineReq.includes(state.bloodline)) return false;
    if (e.statReq) {
      for (const [key, val] of Object.entries(e.statReq)) {
        if (state.stats[key as StatKey] < (val as number)) return false;
      }
    }
    // Non-repeat gate — events already triggered this life don't fire again
    if (state.triggeredEvents.includes(e.id)) return false;
    // Romance level gate
    if (e.romanceReq === "explicit" && state.romanceLevel !== "explicit") return false;
    if (e.romanceReq === "mild" && state.romanceLevel === "none") return false;
    // Mystical path gate
    if (e.mysticalPathReq && state.mysticalPath !== e.mysticalPathReq) return false;
    // Path entry events: only when no path yet
    if (e.pathEntry && state.mysticalPath !== "none") return false;
    return true;
  });

  if (possible.length === 0) return null;

  // Context-aware weighting: boost events matching the character's situation
  const weights = possible.map(e => {
    let w = e.rarity === "common" ? 6 : e.rarity === "uncommon" ? 3 : e.rarity === "rare" ? 1.5 : 0.5;

    // Boost bloodline-matching events
    if (e.bloodlineReq && e.bloodlineReq.includes(state.bloodline)) w *= 2.5;

    // Boost events matching the active mystical path
    if (e.mysticalPathReq && e.mysticalPathReq === state.mysticalPath) w *= 2.0;

    // Boost path-entry events when no path yet and character is in key ages
    if (e.pathEntry && state.mysticalPath === "none") {
      if (state.age >= 10 && state.age <= 25) w *= 2.0;
    }

    // Boost adventure/supernatural events for younger ages
    if (state.age < 18 && (e.category === "Adventure" || e.category === "Supernatural")) w *= 1.3;

    // Boost career/politics events for adults
    if (state.age >= 25 && (e.category === "Career" || e.category === "Politics")) w *= 1.4;

    // Boost relationship/family events for mid-life
    if (state.age >= 20 && state.age <= 45 && (e.category === "Relationships" || e.category === "Family")) w *= 1.2;

    // Boost elder/legacy events in old age
    if (state.age >= 55 && (e.category === "Legacy" || e.category === "Wisdom" || e.category === "Supernatural")) w *= 1.5;

    // Boost high-stat events when character has high relevant stats
    if (e.statReq) {
      let meetsAll = true;
      for (const [key, val] of Object.entries(e.statReq)) {
        if (state.stats[key as StatKey] < ((val as number) * 1.5)) { meetsAll = false; break; }
      }
      if (meetsAll) w *= 1.5;
    }

    // Slight boost for events matching realm flavor
    const realmCategoryBoosts: Record<string, string[]> = {
      "Spirit Realm": ["Supernatural", "Cultivation", "Philosophy"],
      "Arcane Expanse": ["Supernatural", "Arcane", "Adventure"],
      "Sacred Lands": ["Faith", "Supernatural", "Legacy"],
      "Iron Empire": ["Career", "Politics", "Military"],
      "Wild Reaches": ["Adventure", "Family", "Survival"],
    };
    const realmBoosts = realmCategoryBoosts[state.realm] ?? [];
    if (realmBoosts.includes(e.category)) w *= 1.25;

    return w;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < possible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return possible[i];
  }
  return possible[possible.length - 1];
}
