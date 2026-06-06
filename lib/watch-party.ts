/**
 * Watch Party — in-memory room state for syncing streams between friends.
 *
 * Rooms are identified by a short 6-char code. Each room stores:
 *  - host info, current playback position, playing/paused, and peers
 *
 * State lives in server memory (perfect for a personal app on one host).
 * Rooms auto-expire after 2 hours of inactivity.
 */

export interface PartyRoom {
  code: string;
  hostId: string;
  streamUrl: string;
  title: string;
  episode: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdate: number; // Date.now()
  peers: Set<string>;
}

// In-memory store
const rooms = new Map<string, PartyRoom>();

// Clean up stale rooms every 10 minutes
const TTL = 2 * 60 * 60 * 1000; // 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastUpdate > TTL) {
      rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(hostId: string, title: string, episode: string, streamUrl: string): PartyRoom {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const room: PartyRoom = {
    code,
    hostId,
    streamUrl,
    title,
    episode,
    currentTime: 0,
    isPlaying: false,
    lastUpdate: Date.now(),
    peers: new Set([hostId]),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, peerId: string): PartyRoom | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  room.peers.add(peerId);
  room.lastUpdate = Date.now();
  return room;
}

export function getRoom(code: string): PartyRoom | null {
  return rooms.get(code.toUpperCase()) || null;
}

export function updateRoom(
  code: string,
  update: { currentTime?: number; isPlaying?: boolean; streamUrl?: string }
): PartyRoom | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  if (update.currentTime !== undefined) room.currentTime = update.currentTime;
  if (update.isPlaying !== undefined) room.isPlaying = update.isPlaying;
  if (update.streamUrl !== undefined) room.streamUrl = update.streamUrl;
  room.lastUpdate = Date.now();
  return room;
}

export function leaveRoom(code: string, peerId: string): void {
  const room = rooms.get(code.toUpperCase());
  if (!room) return;
  room.peers.delete(peerId);
  if (room.peers.size === 0) rooms.delete(code.toUpperCase());
}

export function serializeRoom(room: PartyRoom) {
  return {
    code: room.code,
    hostId: room.hostId,
    streamUrl: room.streamUrl,
    title: room.title,
    episode: room.episode,
    currentTime: room.currentTime,
    isPlaying: room.isPlaying,
    lastUpdate: room.lastUpdate,
    peerCount: room.peers.size,
  };
}
