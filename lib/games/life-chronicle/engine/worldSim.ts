import { WORLD_NPCS, WorldNPC } from "./npcLeaderboard";

export type WorldEventType =
  | "war_declared"
  | "war_ended"
  | "war_victory"
  | "power_ascension"
  | "realm_plague"
  | "golden_age"
  | "betrayal"
  | "death"
  | "alliance"
  | "discovery"
  | "tyranny"
  | "exile"
  | "duel";

export interface WorldEvent {
  id: string;
  year: number;
  type: WorldEventType;
  title: string;
  description: string;
  affected: string[];
  icon: string;
  color: string;
}

export interface ActiveWar {
  id: string;
  attacker: string;
  defender: string;
  startYear: number;
  intensity: number;
}

export interface WorldState {
  year: number;
  npcPowers: Record<string, number>;
  npcAlive: Record<string, boolean>;
  events: WorldEvent[];
  activeWars: ActiveWar[];
  playerRivals: string[];
}

const WAR_PAIRS: [string, string][] = [
  ["The Crimson Emperor", "Queen Lyraen"],
  ["Chu Feng", "Long Chen"],
  ["Thane Goldbrace", "Mirova Silk"],
  ["The Hollow King", "The Silver Oracle"],
  ["Vorn the Unbroken", "Valdris Mourne"],
  ["Rhas'kul", "Seraphel Voss"],
  ["Ye Xiao", "Lin Feng"],
];

const ALLIANCE_PAIRS: [string, string][] = [
  ["Chu Feng", "Meng Qing"],
  ["Valdris Mourne", "Seraphel Voss"],
  ["Thane Goldbrace", "Asher Vant"],
  ["Queen Lyraen", "Kira Dusk"],
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const WAR_TITLES = [
  "The {a}-{b} War",
  "The Conflict of {a} and {b}",
  "War of the {realm} Succession",
  "{a}'s Crusade Against {b}",
  "The Great Siege of {b}'s Domain",
];

const ASCENSION_MSGS = [
  "{name} shattered their limits and surpassed {tier}.",
  "{name}'s power exploded — the heavens themselves shook.",
  "After decades of cultivation, {name} broke through to a new realm.",
  "{name} consumed an ancient relic and their strength tripled overnight.",
];

const DEATH_MSGS = [
  "{name} fell in battle against an unknown enemy.",
  "{name}'s cultivation backfired — their body could not contain the power.",
  "{name} was assassinated in the dead of night.",
  "After a long reign, {name} finally succumbed to time's embrace.",
];

const GOLDEN_AGE_MSGS = [
  "A golden age has descended upon {realm} — power flows freely.",
  "Ancient ley lines activated in {realm}, boosting all who dwell there.",
  "{realm} entered an era of unprecedented prosperity.",
];

const PLAGUE_MSGS = [
  "A soul-consuming plague swept through {realm}, weakening all.",
  "Dark miasma choked {realm} — the strong barely survived.",
  "A curse from the depths struck {realm}, sapping vitality.",
];

const BETRAYAL_MSGS = [
  "{name} was betrayed by their closest ally and cast out.",
  "{b} turned against {name}, stealing half their power and fleeing.",
  "{name}'s own sect rebelled, forcing a humiliating retreat.",
];

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);
}

const REALM_LIST = [
  "Mundus", "Aethoria", "Shadowmere", "Celestia", "Infernus",
  "Sylvara", "Ironhold", "Tidehaven", "Voidmere", "Arcanum",
];

function getEventColor(type: WorldEventType): string {
  const colors: Record<WorldEventType, string> = {
    war_declared: "#e05050",
    war_ended: "#8080f0",
    war_victory: "#ffd700",
    power_ascension: "#f0a830",
    realm_plague: "#50d080",
    golden_age: "#ffd700",
    betrayal: "#c060e0",
    death: "#8898a8",
    alliance: "#50d0c0",
    discovery: "#80d0ff",
    tyranny: "#e07030",
    exile: "#a060c0",
    duel: "#e07030",
  };
  return colors[type] ?? "#8898a8";
}

function getEventIcon(type: WorldEventType): string {
  const icons: Record<WorldEventType, string> = {
    war_declared: "⚔",
    war_ended: "🕊",
    war_victory: "👑",
    power_ascension: "⚡",
    realm_plague: "☠",
    golden_age: "✨",
    betrayal: "🗡",
    death: "💀",
    alliance: "🤝",
    discovery: "🔮",
    tyranny: "🔥",
    exile: "🚪",
    duel: "⚔",
  };
  return icons[type] ?? "✦";
}

export function initWorldState(): WorldState {
  const powers: Record<string, number> = {};
  const alive: Record<string, boolean> = {};
  for (const npc of WORLD_NPCS) {
    powers[npc.name] = npc.power;
    alive[npc.name] = true;
  }
  return { year: 0, npcPowers: powers, npcAlive: alive, events: [], activeWars: [], playerRivals: [] };
}

export function advanceWorldYear(ws: WorldState, playerAge: number, playerPower: number = 0): WorldState {
  let { npcPowers, npcAlive, events, activeWars, playerRivals } = ws;
  npcPowers = { ...npcPowers };
  npcAlive = { ...npcAlive };
  events = [...events];
  activeWars = [...activeWars];
  playerRivals = [...(playerRivals ?? [])];
  const newEvents: WorldEvent[] = [];
  const year = ws.year + 1;

  const aliveNpcs = WORLD_NPCS.filter(n => npcAlive[n.name]);

  // 1. Passive power growth/decay per NPC
  for (const npc of aliveNpcs) {
    const basePow = npc.power;
    const current = npcPowers[npc.name] ?? basePow;
    const seed = seededRand(year * 37 + npc.name.charCodeAt(0) * 13);
    let delta = 0;

    if (npc.category === "cultivator") {
      delta = Math.floor((seed - 0.35) * 600);
    } else if (npc.category === "mage") {
      delta = Math.floor((seed - 0.4) * 500);
    } else if (npc.category === "wealth") {
      delta = Math.floor((seed - 0.3) * 400);
    } else if (npc.category === "power") {
      delta = Math.floor((seed - 0.38) * 550);
    } else if (npc.category === "influence") {
      delta = Math.floor((seed - 0.35) * 450);
    } else {
      delta = Math.floor((seed - 0.4) * 500);
    }

    npcPowers[npc.name] = Math.max(10000, Math.min(100000, current + delta));
  }

  // 2. War progression
  const endedWars: string[] = [];
  for (const war of activeWars) {
    const seed2 = seededRand(year * 53 + war.id.charCodeAt(0) * 7);
    const duration = year - war.startYear;
    const endChance = 0.15 + duration * 0.08;

    if (seed2 < endChance && duration >= 2) {
      const attPow = npcPowers[war.attacker] ?? 50000;
      const defPow = npcPowers[war.defender] ?? 50000;
      const attackerWins = attPow > defPow * (0.85 + seededRand(year * 7) * 0.3);
      const winner = attackerWins ? war.attacker : war.defender;
      const loser = attackerWins ? war.defender : war.attacker;

      npcPowers[winner] = Math.min(100000, (npcPowers[winner] ?? 50000) + 3000);
      npcPowers[loser] = Math.max(10000, (npcPowers[loser] ?? 50000) - 5000);

      const deathChance = seededRand(year * 23 + loser.charCodeAt(0));
      if (deathChance < 0.12 && npcAlive[loser]) {
        npcAlive[loser] = false;
        newEvents.push({
          id: `death_${loser}_${year}`,
          year,
          type: "death",
          title: `${loser} Has Fallen`,
          description: fillTemplate(pickRandom(DEATH_MSGS), { name: loser }),
          affected: [loser],
          icon: getEventIcon("death"),
          color: getEventColor("death"),
        });
      }

      newEvents.push({
        id: `war_end_${war.id}_${year}`,
        year,
        type: "war_victory",
        title: `${winner} Wins the War`,
        description: `After ${duration} years of brutal conflict, ${winner} has emerged victorious over ${loser}.`,
        affected: [winner, loser],
        icon: getEventIcon("war_victory"),
        color: getEventColor("war_victory"),
      });
      endedWars.push(war.id);
    } else {
      // War damage to both sides
      npcPowers[war.attacker] = Math.max(10000, (npcPowers[war.attacker] ?? 50000) - 800);
      npcPowers[war.defender] = Math.max(10000, (npcPowers[war.defender] ?? 50000) - 600);
    }
  }
  activeWars = activeWars.filter(w => !endedWars.includes(w.id));

  // 3. New war declaration (rare)
  const warSeed = seededRand(year * 89);
  if (warSeed < 0.12 && activeWars.length < 3) {
    const pair = WAR_PAIRS[year % WAR_PAIRS.length];
    const [attacker, defender] = pair;
    const alreadyAtWar = activeWars.some(
      w => (w.attacker === attacker || w.defender === attacker || w.attacker === defender || w.defender === defender)
    );
    if (!alreadyAtWar && npcAlive[attacker] && npcAlive[defender]) {
      const warId = `war_${attacker.replace(/\s/g,"")}_${year}`;
      activeWars.push({ id: warId, attacker, defender, startYear: year, intensity: Math.floor(warSeed * 10) + 1 });
      const title = fillTemplate(pickRandom(WAR_TITLES), { a: attacker.split(" ")[0], b: defender.split(" ")[0], realm: pickRandom(REALM_LIST) });
      newEvents.push({
        id: `war_dec_${warId}`,
        year,
        type: "war_declared",
        title,
        description: `${attacker} has declared war on ${defender}. The realms tremble.`,
        affected: [attacker, defender],
        icon: getEventIcon("war_declared"),
        color: getEventColor("war_declared"),
      });
    }
  }

  // 4. Power ascension event (rare)
  const ascSeed = seededRand(year * 113);
  if (ascSeed < 0.18) {
    const candidate = aliveNpcs[year % aliveNpcs.length];
    if (candidate) {
      npcPowers[candidate.name] = Math.min(100000, (npcPowers[candidate.name] ?? candidate.power) + 2500);
      newEvents.push({
        id: `ascension_${candidate.name}_${year}`,
        year,
        type: "power_ascension",
        title: `${candidate.name} Breaks Through`,
        description: fillTemplate(pickRandom(ASCENSION_MSGS), { name: candidate.name.split(" ")[0], tier: candidate.title }),
        affected: [candidate.name],
        icon: getEventIcon("power_ascension"),
        color: getEventColor("power_ascension"),
      });
    }
  }

  // 5. Realm golden age / plague (very rare)
  const worldSeed = seededRand(year * 157);
  if (worldSeed < 0.07) {
    const realm = pickRandom(REALM_LIST);
    const isGolden = seededRand(year * 61) > 0.5;
    const realmNpcs = aliveNpcs.filter(n => n.realm === realm);
    if (isGolden) {
      for (const n of realmNpcs) {
        npcPowers[n.name] = Math.min(100000, (npcPowers[n.name] ?? n.power) + 1500);
      }
      newEvents.push({
        id: `golden_${realm}_${year}`,
        year,
        type: "golden_age",
        title: `Golden Age of ${realm}`,
        description: fillTemplate(pickRandom(GOLDEN_AGE_MSGS), { realm }),
        affected: realmNpcs.map(n => n.name),
        icon: getEventIcon("golden_age"),
        color: getEventColor("golden_age"),
      });
    } else {
      for (const n of realmNpcs) {
        npcPowers[n.name] = Math.max(10000, (npcPowers[n.name] ?? n.power) - 1800);
      }
      newEvents.push({
        id: `plague_${realm}_${year}`,
        year,
        type: "realm_plague",
        title: `Plague Strikes ${realm}`,
        description: fillTemplate(pickRandom(PLAGUE_MSGS), { realm }),
        affected: realmNpcs.map(n => n.name),
        icon: getEventIcon("realm_plague"),
        color: getEventColor("realm_plague"),
      });
    }
  }

  // 6. Alliance event (rare)
  const alliSeed = seededRand(year * 199);
  if (alliSeed < 0.09) {
    const pair = ALLIANCE_PAIRS[year % ALLIANCE_PAIRS.length];
    const [a, b] = pair;
    if (npcAlive[a] && npcAlive[b]) {
      npcPowers[a] = Math.min(100000, (npcPowers[a] ?? 50000) + 1000);
      npcPowers[b] = Math.min(100000, (npcPowers[b] ?? 50000) + 1000);
      newEvents.push({
        id: `alliance_${a.replace(/\s/g,"")}_${year}`,
        year,
        type: "alliance",
        title: `${a.split(" ")[0]} and ${b.split(" ")[0]} Forge Alliance`,
        description: `A powerful pact was signed between ${a} and ${b}. Their combined strength reshapes the balance of power.`,
        affected: [a, b],
        icon: getEventIcon("alliance"),
        color: getEventColor("alliance"),
      });
    }
  }

  // 7. Betrayal event (rare)
  const betrSeed = seededRand(year * 233);
  if (betrSeed < 0.06 && aliveNpcs.length > 2) {
    const victim = aliveNpcs[Math.floor(betrSeed * aliveNpcs.length)];
    const betrayer = aliveNpcs[(Math.floor(betrSeed * aliveNpcs.length) + 1) % aliveNpcs.length];
    if (victim && betrayer && victim.name !== betrayer.name) {
      npcPowers[victim.name] = Math.max(10000, (npcPowers[victim.name] ?? victim.power) - 3000);
      npcPowers[betrayer.name] = Math.min(100000, (npcPowers[betrayer.name] ?? betrayer.power) + 2000);
      newEvents.push({
        id: `betrayal_${victim.name.replace(/\s/g,"")}_${year}`,
        year,
        type: "betrayal",
        title: `${victim.name.split(" ")[0]} Betrayed`,
        description: fillTemplate(pickRandom(BETRAYAL_MSGS), { name: victim.name.split(" ")[0], b: betrayer.name.split(" ")[0] }),
        affected: [victim.name, betrayer.name],
        icon: getEventIcon("betrayal"),
        color: getEventColor("betrayal"),
      });
    }
  }

  // 8. Rivalry event
  if (playerPower > 15000 && playerAge >= 18) {
    const rivalSeed = seededRand(year * 311);
    if (rivalSeed < 0.15) {
      const potentialRivals = aliveNpcs.filter(
        n => !playerRivals.includes(n.name) && Math.abs((npcPowers[n.name] ?? n.power) - playerPower) < playerPower * 0.4
      );
      if (potentialRivals.length > 0) {
        const newRival = pickRandom(potentialRivals);
        playerRivals.push(newRival.name);
        newEvents.push({
          id: `rival_${newRival.name.replace(/\s/g,"")}_${year}`,
          year,
          type: "duel",
          title: `A New Rival: ${newRival.name.split(" ")[0]}`,
          description: `${newRival.name} has taken notice of your growing power and declared a bitter rivalry against you!`,
          affected: [newRival.name],
          icon: getEventIcon("duel"),
          color: getEventColor("duel"),
        });
      }
    }
  }

  // Keep only last 40 events
  const allEvents = [...events, ...newEvents].slice(-40);

  return {
    year,
    npcPowers,
    npcAlive,
    events: allEvents,
    activeWars,
    playerRivals,
  };
}

const WORLD_STATE_KEY = "chronicle_world_state";

export function loadWorldState(): WorldState {
  try {
    const raw = localStorage.getItem(WORLD_STATE_KEY);
    if (raw) return JSON.parse(raw) as WorldState;
  } catch {}
  return initWorldState();
}

export function saveWorldState(ws: WorldState): void {
  try {
    localStorage.setItem(WORLD_STATE_KEY, JSON.stringify(ws));
  } catch {}
}

export function resetWorldState(): void {
  try {
    localStorage.removeItem(WORLD_STATE_KEY);
  } catch {}
}
