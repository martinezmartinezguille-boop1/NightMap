export type NightStatus = "warming" | "heading" | "checked-in";

export interface SquadMember {
  id: string;
  nick: string;
  isYou: boolean;
  status: NightStatus;
  clubTitle: string;
}

export interface SquadPost {
  id: string;
  nick: string;
  text: string;
  at: string;
}

export interface Squad {
  name: string;
  code: string;
  members: SquadMember[];
  posts: SquadPost[];
}

const STORAGE_KEY = "nightmap-squad";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let code = "NM-";
  for (const byte of bytes) {
    const symbol = ALPHABET[byte % ALPHABET.length];
    code += symbol ?? "X";
  }
  return code;
}

function isStatus(value: unknown): value is NightStatus {
  return value === "warming" || value === "heading" || value === "checked-in";
}

function isMember(value: unknown): value is SquadMember {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["id"] === "string" &&
    typeof row["nick"] === "string" &&
    typeof row["isYou"] === "boolean" &&
    isStatus(row["status"]) &&
    typeof row["clubTitle"] === "string"
  );
}

function isPost(value: unknown): value is SquadPost {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row["id"] === "string" && typeof row["nick"] === "string" && typeof row["text"] === "string" && typeof row["at"] === "string";
}

function isSquad(value: unknown): value is Squad {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["name"] === "string" &&
    typeof row["code"] === "string" &&
    Array.isArray(row["members"]) &&
    row["members"].every(isMember) &&
    Array.isArray(row["posts"]) &&
    row["posts"].every(isPost)
  );
}

function readSquad(): Squad | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSquad(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSquad(squad: Squad | null) {
  if (squad) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(squad));
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("nightmap-squad"));
}

export function loadSquad(): Squad | null {
  return readSquad();
}

export function statusLabel(member: Pick<SquadMember, "status" | "clubTitle">): string {
  if (member.status === "heading") return member.clubTitle ? `Rumbo a ${member.clubTitle}` : "Rumbo a la sala";
  if (member.status === "checked-in") {
    return member.clubTitle
      ? `Check-in realizado en el Pasaporte Fiestero · ${member.clubTitle}`
      : "Check-in realizado en el Pasaporte Fiestero";
  }
  return "En casa calentando";
}

export function createSquad(name: string, nick: string): Squad {
  const squad: Squad = {
    name: name.trim(),
    code: createCode(),
    members: [
      {
        id: crypto.randomUUID(),
        nick: nick.trim(),
        isYou: true,
        status: "warming",
        clubTitle: "",
      },
    ],
    posts: [],
  };
  writeSquad(squad);
  return squad;
}

export function addSquadMember(nick: string): Squad | null {
  const squad = readSquad();
  const clean = nick.trim();
  if (!squad || !clean) return squad;
  const taken = squad.members.some((member) => member.nick.toLowerCase() === clean.toLowerCase());
  if (taken) return squad;
  const next: Squad = {
    ...squad,
    members: [...squad.members, { id: crypto.randomUUID(), nick: clean, isYou: false, status: "warming", clubTitle: "" }],
  };
  writeSquad(next);
  return next;
}

export function setMemberStatus(memberId: string, status: NightStatus, clubTitle: string): Squad | null {
  const squad = readSquad();
  if (!squad) return null;
  const next: Squad = {
    ...squad,
    members: squad.members.map((member) => (member.id === memberId ? { ...member, status, clubTitle } : member)),
  };
  writeSquad(next);
  return next;
}

export function postSquadMessage(nick: string, text: string): Squad | null {
  const squad = readSquad();
  const clean = text.trim();
  if (!squad || !clean) return squad;
  const post: SquadPost = { id: crypto.randomUUID(), nick, text: clean.slice(0, 140), at: new Date().toISOString() };
  const next: Squad = { ...squad, posts: [...squad.posts, post].slice(-40) };
  writeSquad(next);
  return next;
}

export function leaveSquad() {
  writeSquad(null);
}
