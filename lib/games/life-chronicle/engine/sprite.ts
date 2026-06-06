import { Bloodline, Gender, OutfitStyle, Accessory, CharacterAppearance } from "./types";

// ── palette types ───────────────────────────────────────────────────────────
interface P { base: string; shadow: string; hi: string }

export const SKIN: Record<Bloodline, P> = {
  Common:    { base: "#f2cca7", shadow: "#d4a77e", hi: "#fdf0e3" },
  Draconic:  { base: "#6e9f59", shadow: "#477a36", hi: "#a5d68d" },
  Elven:     { base: "#faecd9", shadow: "#decbb3", hi: "#ffffff" },
  Infernal:  { base: "#d95757", shadow: "#a63232", hi: "#fa8282" },
  Celestial: { base: "#fcf3d9", shadow: "#e3d1a4", hi: "#ffffff" },
  Fae:       { base: "#d69bed", shadow: "#b066cc", hi: "#f0c9ff" },
  Werewolf:  { base: "#d1a462", shadow: "#a37633", hi: "#ebd09b" },
  Undead:    { base: "#8fa8a8", shadow: "#5c7878", hi: "#b9d6d6" },
  Void:      { base: "#3b266e", shadow: "#1c1140", hi: "#6f52b3" },
  Dwarvish:  { base: "#c77732", shadow: "#944e13", hi: "#eba160" },
  Orcish:    { base: "#4e8c33", shadow: "#2a6113", hi: "#7dc25f" },
  Merfolk:   { base: "#3cbfb6", shadow: "#1b8c84", hi: "#7ce3db" },
};

export const HAIR: Record<Bloodline, { y: string; o: string }> = {
  Common:    { y: "#4a2d1a", o: "#a3a3a3" },
  Draconic:  { y: "#244018", o: "#6b966b" },
  Elven:     { y: "#ebd95b", o: "#d6d6a9" },
  Infernal:  { y: "#1a0f0f", o: "#54143f" },
  Celestial: { y: "#fae05f", o: "#e8e8c1" },
  Fae:       { y: "#d14bf0", o: "#ac8cc4" },
  Werewolf:  { y: "#8f612d", o: "#c7b7a7" },
  Undead:    { y: "#3b3131", o: "#5e5e5e" },
  Void:      { y: "#241047", o: "#533878" },
  Dwarvish:  { y: "#9c4018", o: "#ba9977" },
  Orcish:    { y: "#1f1f13", o: "#5e5e5e" },
  Merfolk:   { y: "#0083a3", o: "#6fcdcd" },
};

export const CLOTHES: Record<Bloodline, { main: string; trim: string; dark: string }> = {
  Common:    { main: "#677699", trim: "#9daec2", dark: "#455569" },
  Draconic:  { main: "#913b28", trim: "#d96241", dark: "#5e2210" },
  Elven:     { main: "#45693b", trim: "#87bf75", dark: "#23381a" },
  Infernal:  { main: "#2b0f0f", trim: "#a3042c", dark: "#140606" },
  Celestial: { main: "#faf3d7", trim: "#e3c254", dark: "#c7be93" },
  Fae:       { main: "#b64fdb", trim: "#f09bfd", dark: "#77179e" },
  Werewolf:  { main: "#5e3e2b", trim: "#a37e56", dark: "#36210f" },
  Undead:    { main: "#242438", trim: "#4c3857", dark: "#0f0f1f" },
  Void:      { main: "#160d33", trim: "#532dba", dark: "#09061a" },
  Dwarvish:  { main: "#734922", trim: "#b07e43", dark: "#4a2c16" },
  Orcish:    { main: "#4a3622", trim: "#828258", dark: "#24180d" },
  Merfolk:   { main: "#15606b", trim: "#3ea2b5", dark: "#0b3742" },
};

export const EYE: Record<Bloodline, string> = {
  Common: "#5a80a8", Draconic: "#ed9428", Elven: "#52c9a2",
  Infernal: "#ff4d00", Celestial: "#99d6ff", Fae: "#ff52ff",
  Werewolf: "#eb9d00", Undead: "#e3f5e3", Void: "#d499ff",
  Dwarvish: "#b35b2b", Orcish: "#ff9500", Merfolk: "#00e8fa",
};

export const BODY_TYPES = ["average", "slender", "muscular", "stout", "tail_fin"];
export const HAIR_STYLES = ["short", "long", "spiky", "bald", "ponytail", "curly", "braids"];
export const EYE_STYLES = ["round", "slit", "hollow"];
export const FACIAL_HAIR_STYLES = ["none", "stubble", "beard", "mustache"];

export function seededRand(seed: number, offset: number): number {
  const x = Math.sin(seed * 9301 + offset * 49297) * 233280;
  return x - Math.floor(x);
}
export function lerp(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t).toString(16).padStart(2, "0");
  const g = Math.round(ag + (bg - ag) * t).toString(16).padStart(2, "0");
  const bl = Math.round(ab + (bb - ab) * t).toString(16).padStart(2, "0");
  return `#${r}${g}${bl}`;
}
export function darken(col: string, t: number) { return lerp(col, "#000000", t); }
export function lighten(col: string, t: number) { return lerp(col, "#ffffff", t); }

const circle = (cx: number, cy: number, r: number, fill: string, extra = "") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 2, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = "") =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const path = (d: string, fill: string, extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
const poly = (pts: string, fill: string) =>
  `<polygon points="${pts}" fill="${fill}"/>`;

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED MODULAR RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

function drawBaseBody(type: string, skin: string, c: any) {
  const shadow = darken(skin, 0.2);
  const highlight = lighten(skin, 0.1);
  
  // Dynamic dimensions
  let torsoW = 32;
  let armW = 10;
  let legW = 12;
  let shoulderDrop = 40;
  
  if (type === "slender") { torsoW = 24; armW = 8; legW = 9; }
  else if (type === "muscular") { torsoW = 42; armW = 14; legW = 14; shoulderDrop = 36; }
  else if (type === "stout") { torsoW = 38; armW = 12; legW = 13; shoulderDrop = 44; }

  const tX = 40 - torsoW/2;
  
  // Legs
  let legs = "";
  if (type === "tail_fin") {
    const tailC = lerp(skin, "#0f8c8c", 0.6);
    const tailShadow = darken(tailC, 0.3);
    legs = `
      ${path("M 25 70 C 20 90, 20 110, 30 118 C 36 123, 44 123, 50 118 C 60 110, 60 90, 55 70 Z", tailC)}
      ${path("M 40 70 C 40 90, 48 110, 50 118 C 60 110, 60 90, 55 70 Z", tailShadow)}
      ${path("M 30 118 C 15 125, 10 135, 15 138 C 25 130, 35 125, 40 125 C 45 125, 55 130, 65 138 C 70 135, 65 125, 50 118 Z", tailShadow)}
    `;
  } else {
    const legL = 40 - legW - 2;
    const legR = 40 + 2;
    legs = `
      ${path(`M ${legL} 70 L ${legL} 115 C ${legL} 120, ${legL + legW} 120, ${legL + legW} 115 L ${legL + legW} 70 Z`, c.dark)}
      ${path(`M ${legR} 70 L ${legR} 115 C ${legR} 120, ${legR + legW} 120, ${legR + legW} 115 L ${legR + legW} 70 Z`, c.dark)}
      ${path(`M ${legL-3} 115 C ${legL-3} 110, ${legL+legW+3} 110, ${legL+legW+3} 115 C ${legL+legW+3} 120, ${legL-3} 120, ${legL-3} 115 Z`, "#1a1a1a")}
      ${path(`M ${legR-3} 115 C ${legR-3} 110, ${legR+legW+3} 110, ${legR+legW+3} 115 C ${legR+legW+3} 120, ${legR-3} 120, ${legR-3} 115 Z`, "#1a1a1a")}
    `;
  }

  // Arms
  const armLx = tX - armW/2;
  const armRx = 40 + torsoW/2 + armW/2;
  const arms = `
    ${path(`M ${armLx + 2} ${shoulderDrop + 5} C ${armLx - 8} ${shoulderDrop + 20}, ${armLx - 5} 65, ${armLx + armW/2 - 2} 70 L ${armLx + armW} 65 Z`, skin)}
    ${path(`M ${armRx - 2} ${shoulderDrop + 5} C ${armRx + 8} ${shoulderDrop + 20}, ${armRx + 5} 65, ${armRx - armW/2 + 2} 70 L ${armRx - armW} 65 Z`, skin)}
    ${circle(armLx + armW/2 - 2, 70, armW * 0.6, skin)}
    ${circle(armRx - armW/2 + 2, 70, armW * 0.6, skin)}
  `;

  // Torso
  const torso = `
    ${path(`M ${tX} ${shoulderDrop} C ${tX - 2} ${shoulderDrop + 10}, ${tX + 2} 65, ${tX + 4} 75 L ${40 + torsoW/2 - 4} 75 C ${40 + torsoW/2 - 2} 65, ${40 + torsoW/2 + 2} ${shoulderDrop + 10}, ${40 + torsoW/2} ${shoulderDrop} C 40 ${shoulderDrop - 5}, 40 ${shoulderDrop - 5}, ${tX} ${shoulderDrop} Z`, c.main)}
    ${path(`M ${tX + 4} 75 C 40 78, 40 78, ${40 + torsoW/2 - 4} 75 L ${40 + torsoW/2 - 4} 70 C 40 73, 40 73, ${tX + 4} 70 Z`, c.trim)}
  `;

  // Neck
  const neckY = shoulderDrop - 8;
  const neck = `
    ${path(`M 35 ${neckY} L 45 ${neckY} L 46 ${shoulderDrop + 2} L 34 ${shoulderDrop + 2} Z`, shadow)}
    ${path(`M 36 ${neckY} L 44 ${neckY} L 45 ${shoulderDrop + 2} L 35 ${shoulderDrop + 2} Z`, skin)}
    ${path(`M 36 ${shoulderDrop - 2} L 44 ${shoulderDrop - 2} L 45 ${shoulderDrop + 2} L 35 ${shoulderDrop + 2} Z`, shadow, "opacity='0.5'")}
  `;

  // Head
  const headCY = neckY - 14;
  const head = `
    ${path(`M 26 ${headCY} C 26 ${headCY - 16}, 54 ${headCY - 16}, 54 ${headCY} C 54 ${headCY + 12}, 48 ${headCY + 18}, 40 ${headCY + 20} C 32 ${headCY + 18}, 26 ${headCY + 12}, 26 ${headCY} Z`, skin)}
    ${path(`M 40 ${headCY} C 48 ${headCY}, 54 ${headCY}, 54 ${headCY} C 54 ${headCY + 12}, 48 ${headCY + 18}, 40 ${headCY + 20} C 32 ${headCY + 18}, 26 ${headCY + 12}, 26 ${headCY} Z`, shadow, "opacity='0.2'")}
    ${path(`M 27 ${headCY - 4} C 27 ${headCY - 14}, 40 ${headCY - 14}, 40 ${headCY - 4} C 40 ${headCY + 8}, 36 ${headCY + 14}, 30 ${headCY + 14} C 27 ${headCY + 8}, 27 ${headCY - 4}, 27 ${headCY - 4} Z`, highlight, "opacity='0.3'")}
  `;

  // Ears & Nose
  const ears = `
    ${path(`M 26 ${headCY - 2} C 22 ${headCY - 4}, 22 ${headCY + 4}, 26 ${headCY + 6} Z`, shadow)}
    ${path(`M 54 ${headCY - 2} C 58 ${headCY - 4}, 58 ${headCY + 4}, 54 ${headCY + 6} Z`, shadow)}
  `;
  const nose = `
    ${path(`M 39 ${headCY + 4} L 40 ${headCY + 8} L 41 ${headCY + 4} Z`, shadow)}
    ${path(`M 38 ${headCY + 9} C 40 ${headCY + 10}, 42 ${headCY + 10}, 42 ${headCY + 9} Z`, shadow)}
  `;

  return legs + arms + torso + neck + head + ears + nose;
}

function drawMouth(bodyType: string, seed: number) {
  let shoulderDrop = 40;
  if (bodyType === "stout") shoulderDrop = 44;
  if (bodyType === "muscular") shoulderDrop = 36;
  const mouthY = shoulderDrop - 10;
  
  return path(`M 37 ${mouthY} Q 40 ${mouthY + 2} 43 ${mouthY}`, "none", "stroke='#5a4030' stroke-width='1.5' stroke-linecap='round' opacity='0.7'");
}

function drawEyes(style: string, color: string, bodyType: string, glow: boolean) {
  let shoulderDrop = 40;
  if (bodyType === "stout") shoulderDrop = 44;
  if (bodyType === "muscular") shoulderDrop = 36;
  const headCY = shoulderDrop - 22;
  const eyeY = headCY - 2;
  
  const drawEye = (x: number, sclera: string, iris: string, pupil: string, style: string) => {
    if (style === "hollow") {
      return `
        ${ellipse(x, eyeY, 3.5, 3.5, "#0d0a14")}
        ${circle(x, eyeY, 1.5, iris)}
        ${glow ? circle(x, eyeY, 4, iris, "opacity='0.3'") : ""}
      `;
    } else if (style === "slit") {
      return `
        ${path(`M ${x-4} ${eyeY} C ${x-2} ${eyeY-3}, ${x+2} ${eyeY-3}, ${x+4} ${eyeY} C ${x+2} ${eyeY+3}, ${x-2} ${eyeY+3}, ${x-4} ${eyeY} Z`, sclera)}
        ${circle(x, eyeY, 2, iris)}
        ${ellipse(x, eyeY, 0.5, 2, pupil)}
      `;
    } else {
      return `
        ${path(`M ${x-3.5} ${eyeY} C ${x-2} ${eyeY-3.5}, ${x+2} ${eyeY-3.5}, ${x+3.5} ${eyeY} C ${x+2} ${eyeY+3.5}, ${x-2} ${eyeY+3.5}, ${x-3.5} ${eyeY} Z`, sclera)}
        ${circle(x, eyeY, 2.2, iris)}
        ${circle(x, eyeY, 1, pupil)}
        ${circle(x - 0.8, eyeY - 0.8, 0.6, "#ffffff")}
      `;
    }
  };

  const scleraC = glow ? lerp(color, "#ffffff", 0.4) : "#ffffff";
  const pupilC = "#111111";
  
  const brows = `
    ${path(`M 32 ${eyeY - 4} Q 35 ${eyeY - 6} 38 ${eyeY - 4}`, "none", "stroke='#111' stroke-width='1.5' stroke-linecap='round' opacity='0.6'")}
    ${path(`M 48 ${eyeY - 4} Q 45 ${eyeY - 6} 42 ${eyeY - 4}`, "none", "stroke='#111' stroke-width='1.5' stroke-linecap='round' opacity='0.6'")}
  `;

  return drawEye(34, scleraC, color, pupilC, style) + drawEye(46, scleraC, color, pupilC, style) + brows;
}

function drawHair(style: string, color: string, bodyType: string) {
  let shoulderDrop = 40;
  if (bodyType === "stout") shoulderDrop = 44;
  if (bodyType === "muscular") shoulderDrop = 36;
  const headCY = shoulderDrop - 22;
  
  const shadow = darken(color, 0.2);
  const highlight = lighten(color, 0.15);

  let front = "", back = "";

  switch (style) {
    case "long":
      back = `
        ${path(`M 24 ${headCY - 10} C 15 ${headCY + 5}, 20 ${headCY + 30}, 25 ${headCY + 35} C 30 ${headCY + 30}, 28 ${headCY + 10}, 28 ${headCY + 10} Z`, shadow)}
        ${path(`M 56 ${headCY - 10} C 65 ${headCY + 5}, 60 ${headCY + 30}, 55 ${headCY + 35} C 50 ${headCY + 30}, 52 ${headCY + 10}, 52 ${headCY + 10} Z`, shadow)}
      `;
      front = `
        ${path(`M 22 ${headCY} C 22 ${headCY - 22}, 58 ${headCY - 22}, 58 ${headCY} C 58 ${headCY - 12}, 50 ${headCY - 14}, 40 ${headCY - 16} C 30 ${headCY - 14}, 22 ${headCY - 12}, 22 ${headCY} Z`, color)}
        ${path(`M 24 ${headCY - 2} C 24 ${headCY - 18}, 56 ${headCY - 18}, 56 ${headCY - 2} C 56 ${headCY - 12}, 50 ${headCY - 14}, 40 ${headCY - 16} C 30 ${headCY - 14}, 24 ${headCY - 12}, 24 ${headCY - 2} Z`, highlight)}
      `;
      break;
    case "short":
      front = `
        ${path(`M 24 ${headCY - 2} C 22 ${headCY - 22}, 58 ${headCY - 22}, 56 ${headCY - 2} C 54 ${headCY - 10}, 48 ${headCY - 14}, 40 ${headCY - 16} C 32 ${headCY - 14}, 26 ${headCY - 10}, 24 ${headCY - 2} Z`, color)}
        ${path(`M 30 ${headCY - 16} L 35 ${headCY - 12} L 38 ${headCY - 17} L 42 ${headCY - 12} L 45 ${headCY - 16} L 50 ${headCY - 10} C 50 ${headCY - 20}, 30 ${headCY - 20}, 30 ${headCY - 16} Z`, shadow)}
      `;
      break;
    case "spiky":
      front = `
        ${path(`M 24 ${headCY - 5} L 28 ${headCY - 18} L 32 ${headCY - 10} L 38 ${headCY - 22} L 44 ${headCY - 10} L 50 ${headCY - 20} L 54 ${headCY - 8} L 56 ${headCY} C 56 ${headCY - 10}, 24 ${headCY - 10}, 24 ${headCY - 5} Z`, color)}
      `;
      break;
    case "curly":
      front = `
        ${circle(28, headCY - 12, 6, color)} ${circle(36, headCY - 16, 7, color)}
        ${circle(44, headCY - 16, 7, color)} ${circle(52, headCY - 12, 6, color)}
        ${circle(24, headCY - 5, 5, color)} ${circle(56, headCY - 5, 5, color)}
        ${path(`M 28 ${headCY - 12} C 28 ${headCY - 22}, 52 ${headCY - 22}, 52 ${headCY - 12} Z`, color)}
      `;
      break;
    case "ponytail":
      back = `
        ${path(`M 40 ${headCY - 15} C 45 ${headCY - 25}, 65 ${headCY - 15}, 60 ${headCY + 5} C 55 ${headCY + 20}, 45 ${headCY + 15}, 45 ${headCY + 10} C 50 ${headCY}, 45 ${headCY - 10}, 40 ${headCY - 15} Z`, shadow)}
      `;
      front = `
        ${path(`M 24 ${headCY - 2} C 22 ${headCY - 20}, 58 ${headCY - 20}, 56 ${headCY - 2} C 56 ${headCY - 15}, 24 ${headCY - 15}, 24 ${headCY - 2} Z`, color)}
        ${circle(50, headCY - 12, 3, "#cc3333")}
      `;
      break;
    case "braids":
      back = `
        ${path(`M 26 ${headCY} L 20 ${headCY + 15} L 28 ${headCY + 25} L 22 ${headCY + 35}`, "none", `stroke="${shadow}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`)}
        ${path(`M 54 ${headCY} L 60 ${headCY + 15} L 52 ${headCY + 25} L 58 ${headCY + 35}`, "none", `stroke="${shadow}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`)}
      `;
      front = `
        ${path(`M 24 ${headCY - 2} C 22 ${headCY - 22}, 58 ${headCY - 22}, 56 ${headCY - 2} C 56 ${headCY - 12}, 50 ${headCY - 14}, 40 ${headCY - 16} C 30 ${headCY - 14}, 24 ${headCY - 12}, 24 ${headCY - 2} Z`, color)}
      `;
      break;
  }
  return { front, back };
}

function drawFacialHair(style: string, color: string, bodyType: string) {
  let shoulderDrop = 40;
  if (bodyType === "stout") shoulderDrop = 44;
  if (bodyType === "muscular") shoulderDrop = 36;
  const cy = shoulderDrop - 22;
  const cx = 40;
  
  switch(style) {
    case "beard": return `${path(`M ${cx - 13} ${cy + 5} C ${cx - 15} ${cy + 25}, ${cx - 5} ${cy + 30}, ${cx} ${cy + 32} C ${cx + 5} ${cy + 30}, ${cx + 15} ${cy + 25}, ${cx + 13} ${cy + 5} C ${cx + 8} ${cy + 15}, ${cx - 8} ${cy + 15}, ${cx - 13} ${cy + 5} Z`, color, "opacity='0.95'")}`;
    case "stubble": return `${path(`M ${cx - 12} ${cy + 8} C ${cx - 10} ${cy + 22}, ${cx + 10} ${cy + 22}, ${cx + 12} ${cy + 8}`, "none", `stroke="${color}" stroke-width="4" opacity="0.3" stroke-linecap="round"`)}`;
    case "mustache": return `${path(`M ${cx - 8} ${cy + 8} C ${cx - 4} ${cy + 6}, ${cx + 4} ${cy + 6}, ${cx + 8} ${cy + 8} C ${cx + 10} ${cy + 12}, ${cx + 2} ${cy + 12}, ${cx} ${cy + 10} C ${cx - 2} ${cy + 12}, ${cx - 10} ${cy + 12}, ${cx - 8} ${cy + 8} Z`, color)}`;
    default: return "";
  }
}

function drawBloodlineExtras(bloodline: Bloodline, seed: number, bodyType: string) {
  let shoulderDrop = 40;
  if (bodyType === "stout") shoulderDrop = 44;
  if (bodyType === "muscular") shoulderDrop = 36;
  const headCY = shoulderDrop - 22;

  let back = "", front = "";

  if (bloodline === "Draconic") {
    front += `
      ${path(`M 27 ${headCY - 5} L 20 ${headCY - 15} L 30 ${headCY - 10} Z`, "#6a4020")}
      ${path(`M 53 ${headCY - 5} L 60 ${headCY - 15} L 50 ${headCY - 10} Z`, "#6a4020")}
      ${path(`M 35 ${headCY + 15} L 38 ${headCY + 22} L 42 ${headCY + 22} L 45 ${headCY + 15} Z`, "#477a36", "opacity='0.5'")}
    `;
    back += `
      ${path("M 20 50 L 5 40 L 15 60 Z", "#477a36")}
      ${path("M 60 50 L 75 40 L 65 60 Z", "#477a36")}
    `;
  } else if (bloodline === "Elven") {
    front += `
      ${path(`M 26 ${headCY - 2} C 15 ${headCY - 8}, 10 ${headCY - 12}, 12 ${headCY - 16} C 18 ${headCY - 10}, 24 ${headCY - 6}, 28 ${headCY} Z`, SKIN.Elven.base)}
      ${path(`M 54 ${headCY - 2} C 65 ${headCY - 8}, 70 ${headCY - 12}, 68 ${headCY - 16} C 62 ${headCY - 10}, 56 ${headCY - 6}, 52 ${headCY} Z`, SKIN.Elven.base)}
    `;
  } else if (bloodline === "Infernal") {
    front += `
      ${path(`M 30 ${headCY - 10} C 25 ${headCY - 25}, 15 ${headCY - 25}, 20 ${headCY - 30} C 25 ${headCY - 20}, 35 ${headCY - 15}, 32 ${headCY - 8} Z`, "#3a0808")}
      ${path(`M 50 ${headCY - 10} C 55 ${headCY - 25}, 65 ${headCY - 25}, 60 ${headCY - 30} C 55 ${headCY - 20}, 45 ${headCY - 15}, 48 ${headCY - 8} Z`, "#3a0808")}
    `;
    back += `
      ${path(`M 45 100 C 60 100, 70 110, 65 120 C 70 115, 75 118, 70 125 C 65 120, 60 122, 60 115 C 50 110, 45 105, 45 100 Z`, "#801818")}
    `;
  } else if (bloodline === "Celestial") {
    back += `
      <circle cx="40" cy="${headCY}" r="22" fill="none" stroke="#f0c040" stroke-width="2" opacity="0.8"/>
      <circle cx="40" cy="${headCY}" r="26" fill="none" stroke="#ffffc0" stroke-width="1" opacity="0.4"/>
      ${path("M 25 50 C 5 40, -5 60, 10 70 C 20 60, 25 65, 25 50 Z", "rgba(255,250,230,0.8)")}
      ${path("M 55 50 C 75 40, 85 60, 70 70 C 60 60, 55 65, 55 50 Z", "rgba(255,250,230,0.8)")}
    `;
  } else if (bloodline === "Fae") {
    const wingCol = seededRand(seed, 2) > 0.5 ? "rgba(200,100,240,0.55)" : "rgba(100,180,240,0.55)";
    back += `
      ${path("M 35 45 C 10 25, -10 50, 15 65 C 5 70, 0 85, 20 80 C 25 70, 35 60, 35 45 Z", wingCol)}
      ${path("M 45 45 C 70 25, 90 50, 65 65 C 75 70, 80 85, 60 80 C 55 70, 45 60, 45 45 Z", wingCol)}
    `;
    front += `
      ${path(`M 26 ${headCY - 2} C 18 ${headCY - 4}, 14 ${headCY - 2}, 16 ${headCY + 4} Z`, SKIN.Fae.base)}
      ${path(`M 54 ${headCY - 2} C 62 ${headCY - 4}, 66 ${headCY - 2}, 64 ${headCY + 4} Z`, SKIN.Fae.base)}
    `;
  } else if (bloodline === "Void") {
    for (let i = 0; i < 15; i++) {
      const sx = 20 + seededRand(seed, i * 3) * 40;
      const sy = 10 + seededRand(seed, i * 3 + 1) * 80;
      const sr = 0.8 + seededRand(seed, i * 3 + 2) * 1.5;
      back += circle(sx, sy, sr, "#d0b0ff", "opacity='0.8'");
    }
  } else if (bloodline === "Merfolk") {
    front += `
      ${path(`M 26 ${headCY - 4} L 16 ${headCY - 12} L 22 ${headCY + 2} Z`, "#1b8c84")}
      ${path(`M 54 ${headCY - 4} L 64 ${headCY - 12} L 58 ${headCY + 2} Z`, "#1b8c84")}
      ${circle(32, headCY + 12, 1.5, "#7ce3db", "opacity='0.6'")}
      ${circle(48, headCY + 12, 1.5, "#7ce3db", "opacity='0.6'")}
    `;
  } else if (bloodline === "Orcish") {
    front += `
      ${path(`M 35 ${headCY + 14} L 33 ${headCY + 8} L 37 ${headCY + 12} Z`, "#fcfcfc")}
      ${path(`M 45 ${headCY + 14} L 47 ${headCY + 8} L 43 ${headCY + 12} Z`, "#fcfcfc")}
    `;
  }

  return { front, back };
}

function getOutfitOverlay(style: OutfitStyle, bodyType: string): string {
  let torsoW = 32;
  let shoulderDrop = 40;
  if (bodyType === "slender") { torsoW = 24; }
  else if (bodyType === "muscular") { torsoW = 42; shoulderDrop = 36; }
  else if (bodyType === "stout") { torsoW = 38; shoulderDrop = 44; }

  const tX = 40 - torsoW/2;
  const tR = 40 + torsoW/2;
  
  switch (style) {
    case "warrior": return `
      ${path(`M ${tX - 4} ${shoulderDrop - 2} L ${tX + 8} ${shoulderDrop + 8} L ${tR - 8} ${shoulderDrop + 8} L ${tR + 4} ${shoulderDrop - 2} L ${tR + 6} ${shoulderDrop + 15} L ${tX - 6} ${shoulderDrop + 15} Z`, "#607090")}
      ${path(`M ${tX} ${shoulderDrop + 15} L ${tR} ${shoulderDrop + 15} L ${tR} 75 L ${tX} 75 Z`, "#4a6080", "opacity='0.8'")}
      ${path(`M ${tX + 6} 75 L ${tX + 6} 115 M ${tR - 6} 75 L ${tR - 6} 115`, "none", "stroke='#7080a0' stroke-width='3' opacity='0.6'")}
      ${rect(tX - 2, 72, torsoW + 4, 6, "#304050", 2)}
      ${rect(36, 70, 8, 10, "#a0b0c0", 2)}
    `;
    case "noble": return `
      ${path(`M ${tX - 2} ${shoulderDrop} L ${40} ${shoulderDrop + 20} L ${tR + 2} ${shoulderDrop} L ${tR + 4} 75 L ${tX - 4} 75 Z`, "#c8a840", "opacity='0.6'")}
      ${path(`M ${40} ${shoulderDrop + 20} L ${40} 115`, "none", "stroke='#d0b050' stroke-width='2'")}
      ${path(`M ${tX} 75 L ${tX - 5} 110 L 40 100 L ${tR + 5} 110 L ${tR} 75 Z`, "#b09030", "opacity='0.5'")}
      ${circle(40, shoulderDrop + 10, 4, "#e04040")}
    `;
    case "mage": return `
      ${path(`M ${tX - 6} ${shoulderDrop - 2} C ${tX - 10} 75, ${tX - 15} 115, ${tX - 15} 115 L 40 110 L ${tR + 15} 115 C ${tR + 15} 115, ${tR + 10} 75, ${tR + 6} ${shoulderDrop - 2} Z`, "#8040c0", "opacity='0.8'")}
      ${path(`M ${tX} ${shoulderDrop} C 40 ${shoulderDrop + 15}, 40 ${shoulderDrop + 15}, ${tR} ${shoulderDrop} Z`, "#a060e0", "opacity='0.9'")}
      ${path(`M ${tX - 4} 60 C 40 70, 40 70, ${tR + 4} 60`, "none", "stroke='#e0c040' stroke-width='2'")}
      ${circle(40, shoulderDrop + 8, 3, "#f0e060")}
    `;
    case "rogue": return `
      ${path(`M ${tX} ${shoulderDrop} L 40 ${shoulderDrop + 15} L ${tR} ${shoulderDrop} L ${tR + 2} 70 L ${tX - 2} 70 Z`, "#181828", "opacity='0.9'")}
      ${path(`M ${tX - 2} 70 L ${tX - 4} 110 M ${tR + 2} 70 L ${tR + 4} 110`, "none", "stroke='#282838' stroke-width='4' opacity='0.7'")}
      ${rect(tX - 1, 65, torsoW + 2, 8, "#0a0a14", 2)}
      ${path(`M ${tX - 4} ${shoulderDrop + 5} L ${tX - 10} ${shoulderDrop + 15} M ${tR + 4} ${shoulderDrop + 5} L ${tR + 10} ${shoulderDrop + 15}`, "none", "stroke='#181828' stroke-width='6' stroke-linecap='round'")}
    `;
    case "monk": return `
      ${path(`M ${tX + 4} ${shoulderDrop} L ${tR} ${shoulderDrop} L ${tR + 2} 75 L ${tX} 75 Z`, "#907840", "opacity='0.85'")}
      ${path(`M ${tX - 2} ${shoulderDrop} L ${tX + 15} 75 L ${tX - 2} 75 Z`, "#b09050", "opacity='0.8'")}
      ${path(`M ${tX} 75 C ${tX - 5} 110, ${tX - 5} 110, ${tX - 5} 110 L 40 105 L ${tR + 5} 110 C ${tR + 5} 110, ${tR} 75, ${tR} 75 Z`, "#806830", "opacity='0.7'")}
      ${rect(tX - 2, 70, torsoW + 4, 6, "#604820", 2)}
    `;
    case "ranger": return `
      ${path(`M ${tX} ${shoulderDrop} L ${tR} ${shoulderDrop} L ${tR} 75 L ${tX} 75 Z`, "#6a5030", "opacity='0.9'")}
      ${path(`M ${tX} ${shoulderDrop} L 40 ${shoulderDrop + 20} L ${tR} ${shoulderDrop}`, "none", "stroke='#4a3020' stroke-width='3'")}
      ${path(`M ${tX} 75 L ${tX - 2} 110 M ${tR} 75 L ${tR + 2} 110`, "none", "stroke='#5a4020' stroke-width='4'")}
      ${rect(tX - 2, 70, torsoW + 4, 5, "#3a2010", 2)}
      ${path(`M ${tR + 2} 50 L ${tR + 15} 40 L ${tR + 12} 65 Z`, "#2a1808", "opacity='0.8'")}
    `;
    default: return "";
  }
}

function getAccessoryOverlay(accessory: Accessory, bloodlineAccent: string, bodyType: string): string {
  let shoulderDrop = 40;
  if (bodyType === "stout") shoulderDrop = 44;
  if (bodyType === "muscular") shoulderDrop = 36;
  const headCY = shoulderDrop - 22;

  switch (accessory) {
    case "crown": return `
      ${path(`M 28 ${headCY - 12} L 30 ${headCY - 22} L 34 ${headCY - 14} L 40 ${headCY - 24} L 46 ${headCY - 14} L 50 ${headCY - 22} L 52 ${headCY - 12} Z`, "#f0c030")}
      ${rect(28, headCY - 12, 24, 4, "#d4a020", 1)}
      ${circle(34, headCY - 14, 1.5, "#e05050")} 
      ${circle(40, headCY - 16, 2, "#4080e0")} 
      ${circle(46, headCY - 14, 1.5, "#40c060")}
    `;
    case "hood": return `
      ${path(`M 22 ${headCY} C 15 ${headCY - 15}, 25 ${headCY - 28}, 40 ${headCY - 28} C 55 ${headCY - 28}, 65 ${headCY - 15}, 58 ${headCY} C 62 ${headCY + 15}, 55 ${headCY + 20}, 40 ${headCY + 15} C 25 ${headCY + 20}, 18 ${headCY + 15}, 22 ${headCY} Z`, "#282838")}
      ${path(`M 26 ${headCY} C 26 ${headCY - 16}, 54 ${headCY - 16}, 54 ${headCY} C 54 ${headCY + 12}, 48 ${headCY + 18}, 40 ${headCY + 20} C 32 ${headCY + 18}, 26 ${headCY + 12}, 26 ${headCY} Z`, "none", "stroke='#181828' stroke-width='4'")}
    `;
    case "mask": return `
      ${path(`M 28 ${headCY} C 28 ${headCY + 10}, 34 ${headCY + 16}, 40 ${headCY + 18} C 46 ${headCY + 16}, 52 ${headCY + 10}, 52 ${headCY} Z`, "#1a1a2a", "opacity='0.95'")}
      ${path(`M 30 ${headCY + 2} C 30 ${headCY + 8}, 35 ${headCY + 12}, 40 ${headCY + 14} C 45 ${headCY + 12}, 50 ${headCY + 8}, 50 ${headCY + 2} Z`, bloodlineAccent, "opacity='0.2'")}
      ${path(`M 28 ${headCY} L 52 ${headCY}`, "none", "stroke='#404050' stroke-width='2'")}
    `;
    case "halo": return `
      <ellipse cx="40" cy="${headCY - 20}" rx="16" ry="5" fill="none" stroke="${bloodlineAccent}" stroke-width="3" opacity="0.9"/>
      <ellipse cx="40" cy="${headCY - 20}" rx="16" ry="5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.5"/>
      <ellipse cx="40" cy="${headCY - 20}" rx="16" ry="5" fill="none" stroke="${bloodlineAccent}" stroke-width="8" opacity="0.2"/>
    `;
    case "none":
    default: return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export function getSpriteSvg(
  bloodline: Bloodline,
  gender: Gender,
  age: number,
  seed = 0,
  outfitStyle?: OutfitStyle,
  accessory?: Accessory,
  appearance?: CharacterAppearance
): string {
  const bodyType = appearance?.bodyType || (bloodline === "Merfolk" ? "tail_fin" : (bloodline === "Dwarvish" ? "stout" : (bloodline === "Orcish" ? "muscular" : (bloodline === "Elven" ? "slender" : "average"))));
  const skinColor = appearance?.skinColor || lerp(SKIN[bloodline].base, SKIN[bloodline].hi, seededRand(seed, 0) * 0.4);
  const hairStyle = appearance?.hairStyle || (gender === "Female" || bloodline === "Fae" ? "long" : "short");
  const hairColor = appearance?.hairColor || (age > 65 ? HAIR[bloodline].o : HAIR[bloodline].y);
  const eyeStyle = appearance?.eyeStyle || (bloodline === "Undead" || bloodline === "Void" ? "hollow" : (bloodline === "Draconic" ? "slit" : "round"));
  const eyeColor = appearance?.eyeColor || EYE[bloodline];
  const facialHair = appearance?.facialHair || (gender === "Male" && age > 20 && seededRand(seed, 3) > 0.5 ? "beard" : "none");
  const glow = bloodline === "Void" || bloodline === "Celestial" || bloodline === "Infernal";
  
  const c = CLOTHES[bloodline]; 

  const svgBody = drawBaseBody(bodyType, skinColor, c);
  const svgEyes = drawEyes(eyeStyle, eyeColor, bodyType, glow);
  const svgMouth = drawMouth(bodyType, seed);
  const svgHair = drawHair(hairStyle, hairColor, bodyType);
  const svgFacial = drawFacialHair(facialHair, hairColor, bodyType);
  const svgExtras = drawBloodlineExtras(bloodline, seed, bodyType);

  const accentColor = eyeColor;

  const outfitLayer = outfitStyle ? getOutfitOverlay(outfitStyle, bodyType) : "";
  const accessoryLayer = accessory ? getAccessoryOverlay(accessory, accentColor, bodyType) : "";

  return `<svg viewBox="0 0 80 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" overflow="visible">
    ${svgExtras.back}
    ${svgHair.back}
    ${svgBody}
    ${svgMouth}
    ${svgEyes}
    ${svgFacial}
    ${svgHair.front}
    ${svgExtras.front}
    ${outfitLayer}
    ${accessoryLayer}
  </svg>`;
}

export function getNPCSvg(seed: number, bloodline?: Bloodline, gender?: Gender): string {
  const allBloodlines: Bloodline[] = [
    "Common", "Common", "Common", "Common",
    "Draconic", "Elven", "Infernal", "Celestial", "Fae",
    "Werewolf", "Undead", "Void", "Dwarvish", "Orcish", "Merfolk"
  ];
  const bl = bloodline ?? allBloodlines[Math.floor(seededRand(seed, 99) * allBloodlines.length)];
  const g: Gender = gender ?? (seededRand(seed, 88) > 0.5 ? "Male" : "Female");
  const age = 18 + Math.floor(seededRand(seed, 77) * 60);
  return getSpriteSvg(bl, g, age, seed);
}
