const STORAGE_KEY = "volleyball62Config_v2";
const LEGACY_STORAGE_KEY = "volleyball62Config_v1";
const ADMIN_SESSION_KEY = "volleyball62AdminUnlocked";

const DEFAULT_CONFIG = {
  teamName: "Queens Grant 6–2 Rotation Guide",
  adminPin: "6262",
  players: [
    { id: "p1", name: "Ari", role: "S/RS" },
    { id: "p2", name: "Emma", role: "OH" },
    { id: "p3", name: "Aubriella", role: "MB" },
    { id: "p4", name: "Sanaia", role: "S/RS" },
    { id: "p5", name: "Leah", role: "OH" },
    { id: "p6", name: "Jade", role: "MB" }
  ],
  subs: [],
  libero: {
    id: "libero_1",
    name: "Libero",
    role: "LIB",
    rotations: { "1": "", "2": "", "3": "", "4": "", "5": "", "6": "" }
  }
};

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function normalizeConfig(raw) {
  const fallback = cloneDefaultConfig();
  const parsed = raw && typeof raw === "object" ? raw : {};
  const players = Array.isArray(parsed.players) && parsed.players.length === 6
    ? parsed.players.map((player, index) => ({
        id: player.id || `p${index + 1}`,
        name: player.name || `Player ${index + 1}`,
        role: player.role || fallback.players[index].role
      }))
    : fallback.players;

  const subs = Array.isArray(parsed.subs)
    ? parsed.subs.map((sub, index) => ({
        id: sub.id || `sub_${Date.now()}_${index}`,
        name: sub.name || `Sub ${index + 1}`,
        role: sub.role || "DS",
        linkedPlayerId: sub.linkedPlayerId || players[0].id,
        trigger: ["front", "back", "always"].includes(sub.trigger) ? sub.trigger : "back"
      }))
    : [];

  const parsedLibero = parsed.libero && typeof parsed.libero === "object" ? parsed.libero : {};
  const rotations = {};
  for (let rotation = 1; rotation <= 6; rotation += 1) {
    const value = parsedLibero.rotations?.[String(rotation)] || "";
    rotations[String(rotation)] = players.some((player) => player.id === value) ? value : "";
  }

  return {
    ...fallback,
    ...parsed,
    players,
    subs,
    libero: {
      id: parsedLibero.id || fallback.libero.id,
      name: parsedLibero.name || fallback.libero.name,
      role: "LIB",
      rotations
    }
  };
}

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeConfig(JSON.parse(stored));

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = normalizeConfig(JSON.parse(legacy));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return cloneDefaultConfig();
  } catch (error) {
    return cloneDefaultConfig();
  }
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
}

// Volleyball zones: 1=right back/server, 2=right front, 3=middle front,
// 4=left front, 5=left back, 6=middle back.
const ROTATION_COORDS = {
  1: { x: 78, y: 76 },
  2: { x: 79, y: 25 },
  3: { x: 50, y: 24 },
  4: { x: 21, y: 25 },
  5: { x: 21, y: 76 },
  6: { x: 50, y: 78 }
};

function getRotationMap(rotationNumber) {
  let mapping = [0, 1, 2, 3, 4, 5];
  const turns = Math.max(0, rotationNumber - 1);
  for (let i = 0; i < turns; i += 1) {
    mapping = [mapping[1], mapping[2], mapping[3], mapping[4], mapping[5], mapping[0]];
  }
  return mapping;
}

function getZoneForPlayer(playerIndex, rotationNumber) {
  const map = getRotationMap(rotationNumber);
  return map.indexOf(playerIndex) + 1;
}

function isFrontRow(zone) {
  return zone === 2 || zone === 3 || zone === 4;
}

function rowMatchesTrigger(zone, trigger) {
  if (trigger === "always") return true;
  if (trigger === "front") return isFrontRow(zone);
  return !isFrontRow(zone);
}

function getSystemRole(player, zone) {
  if (player.role === "S/RS") return isFrontRow(zone) ? "RS" : "S";
  return player.role;
}

function getActiveCourt(config, rotationNumber) {
  const liberoTarget = config.libero?.rotations?.[String(rotationNumber)] || "";

  return config.players.map((starter, index) => {
    const zone = getZoneForPlayer(index, rotationNumber);
    const linkedSub = (config.subs || []).find(
      (sub) => sub.linkedPlayerId === starter.id && rowMatchesTrigger(zone, sub.trigger)
    );

    const liberoCanEnter = liberoTarget === starter.id && !isFrontRow(zone);
    const player = liberoCanEnter ? config.libero : (linkedSub || starter);

    return {
      index,
      zone,
      starter,
      player,
      isSub: Boolean(linkedSub) && !liberoCanEnter,
      isLibero: liberoCanEnter
    };
  });
}

// DS/libero bubbles keep the formation responsibility of the starter they replace.
function getFormationRole(entry) {
  if ((entry.isSub || entry.isLibero) && ["DS", "LIB"].includes(entry.player.role)) {
    return getSystemRole(entry.starter, entry.zone);
  }
  return getSystemRole(entry.player, entry.zone);
}

function getServeCoords(zone) {
  const compactServe = {
    4: { x: 43, y: 17 },
    3: { x: 50, y: 7 },
    2: { x: 58, y: 14 },
    5: { x: 5, y: 43 },
    6: { x: 50, y: 92 },
    1: { x: 80, y: 105 }
  };
  return compactServe[zone] || ROTATION_COORDS[zone];
}

function getServeReceiveCoords(entry, activeCourt = []) {
  const { zone } = entry;
  const role = getFormationRole(entry);

  if (role === "S") {
    if (zone === 1) return { x: 88, y: 84 };
    if (zone === 6) return { x: 72, y: 88 };
    return { x: 12, y: 88 };
  }

  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 12 };
  if (role === "RS" && isFrontRow(zone)) return { x: 82, y: 13 };

  // Three passers: two outsides + the back-row middle/libero/DS slot.
  // Sort their rotational starting spots left-to-right, then spread them into
  // three clean lanes. Rotation 1 therefore matches the annotated reference:
  // Slot 5 left, Slot 6 middle, Slot 2 right hiding the setter.
  const passerRank = { 4: 0, 5: 1, 3: 2, 6: 3, 2: 4, 1: 5 };
  const passers = (activeCourt || [])
    .filter((candidate) => {
      const candidateRole = getFormationRole(candidate);
      return candidateRole === "OH" || (!isFrontRow(candidate.zone) && candidateRole === "MB");
    })
    .sort((a, b) => (passerRank[a.zone] ?? 99) - (passerRank[b.zone] ?? 99));

  const passerIndex = passers.findIndex((candidate) => candidate.index === entry.index);
  const lanes = [
    { x: 18, y: 74 },
    { x: 50, y: 82 },
    { x: 78, y: 74 }
  ];
  if (passerIndex >= 0) return lanes[Math.min(passerIndex, lanes.length - 1)];

  return ROTATION_COORDS[zone];
}

function getSetterReleaseCoords(entry) {
  const role = getFormationRole(entry);
  const { zone } = entry;
  if (role === "S") return { x: 66, y: 13 };
  if (role === "OH" && isFrontRow(zone)) return { x: 16, y: 35 };
  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 35 };
  if (role === "RS" && isFrontRow(zone)) return { x: 82, y: 35 };
  if (role === "OH") return { x: 30, y: 64 };
  return { x: 70, y: 66 };
}

function getBaseCoords(entry) {
  const role = getFormationRole(entry);
  const { zone } = entry;

  // Row 1 reference format: all three front-row attackers are tight to the net.
  if (isFrontRow(zone)) {
    if (role === "OH") return { x: 8, y: 7 };
    if (role === "MB") return { x: 50, y: 7 };
    if (role === "RS") return { x: 86, y: 7 };
  }

  // Back-row base: left-side defender and setter sit on the 10-ft-line intersections.
  if (role === "S") return { x: 93, y: 43 };
  if (role === "OH") return { x: 5, y: 43 };
  return { x: 50, y: 79 };
}

// These modes show TEAM DEFENSE against an opponent attack.
// "OH" = opponent outside hitter (attack comes to our right side).
// "RS" = opponent right-side hitter (attack comes to our left side).
function getDefenseCoords(entry, attackRole) {
  const role = getFormationRole(entry);
  const { zone } = entry;

  if (attackRole === "OH") {
    if (isFrontRow(zone) && role === "RS") return { x: 86, y: 7 };
    if (isFrontRow(zone) && role === "MB") return { x: 70, y: 7 };
    if (isFrontRow(zone) && role === "OH") return { x: 20, y: 31 };
    if (role === "S") return { x: 94, y: 58 };
    if (role === "OH") return { x: 29, y: 53 };
    return { x: 34, y: 84 };
  }

  if (attackRole === "MB") {
    if (isFrontRow(zone) && role === "MB") return { x: 50, y: 7 };
    if (isFrontRow(zone) && role === "OH") return { x: 19, y: 23 };
    if (isFrontRow(zone) && role === "RS") return { x: 68, y: 24 };
    if (role === "S") return { x: 94, y: 56 };
    if (role === "OH") return { x: 4, y: 56 };
    return { x: 50, y: 95 };
  }

  if (attackRole === "RS") {
    if (isFrontRow(zone) && role === "OH") return { x: 8, y: 7 };
    if (isFrontRow(zone) && role === "MB") return { x: 20, y: 7 };
    if (isFrontRow(zone) && role === "RS") return { x: 66, y: 24 };
    if (role === "S") return { x: 76, y: 54 };
    if (role === "OH") return { x: 4, y: 56 };
    return { x: 70, y: 84 };
  }

  return getBaseCoords(entry);
}

function getFreeballCoords(entry) {
  const role = getFormationRole(entry);
  const { zone } = entry;

  if (role === "S") return { x: 66, y: 14 };
  if (isFrontRow(zone) && role === "OH") return { x: 16, y: 43 };
  if (isFrontRow(zone) && role === "MB") return { x: 50, y: 43 };
  if (isFrontRow(zone) && role === "RS") return { x: 82, y: 43 };
  if (role === "OH") return { x: 30, y: 63 };
  return { x: 70, y: 65 };
}

function getPositionLabel(role) {
  return {
    "S/RS": "Setter / Right Side",
    S: "Setter",
    RS: "Right Side",
    OH: "Outside Hitter",
    MB: "Middle Blocker",
    DS: "Defensive Specialist",
    LIB: "Libero"
  }[role] || role;
}
