const STORAGE_KEY = "volleyball62Config_v3";
const PREVIOUS_STORAGE_KEYS = ["volleyball62Config_v2", "volleyball62Config_v1"];
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
  libero: {
    id: "libero_1",
    name: "Libero",
    enabled: true,
    replacements: { "1": null, "2": null, "3": null, "4": null, "5": null, "6": null }
  },
  subs: []
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

  const validPlayerIds = new Set(players.map((player) => player.id));
  const parsedLibero = parsed.libero && typeof parsed.libero === "object" ? parsed.libero : {};
  const parsedReplacements = parsedLibero.replacements && typeof parsedLibero.replacements === "object"
    ? parsedLibero.replacements
    : {};
  const replacements = {};
  for (let rotation = 1; rotation <= 6; rotation += 1) {
    const value = parsedReplacements[String(rotation)] || null;
    replacements[String(rotation)] = validPlayerIds.has(value) ? value : null;
  }

  const libero = {
    id: parsedLibero.id || fallback.libero.id,
    name: parsedLibero.name || fallback.libero.name,
    role: "LIB",
    enabled: parsedLibero.enabled !== false,
    replacements
  };

  const subs = Array.isArray(parsed.subs)
    ? parsed.subs.map((sub, index) => ({
        id: sub.id || `sub_${Date.now()}_${index}`,
        name: sub.name || `Sub ${index + 1}`,
        role: sub.role || "DS",
        linkedPlayerId: validPlayerIds.has(sub.linkedPlayerId) ? sub.linkedPlayerId : players[0].id,
        trigger: ["front", "back", "always"].includes(sub.trigger) ? sub.trigger : "back"
      }))
    : [];

  return {
    ...fallback,
    ...parsed,
    players,
    libero,
    subs
  };
}

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeConfig(JSON.parse(stored));

    // Migrate older versions so coach-edited names/subs are not lost.
    for (const key of PREVIOUS_STORAGE_KEYS) {
      const legacy = localStorage.getItem(key);
      if (!legacy) continue;
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

// Zones: 1=right back/server, 2=right front, 3=middle front,
// 4=left front, 5=left back, 6=middle back.
const ROTATION_COORDS = {
  1: { x: 78, y: 76 },
  2: { x: 79, y: 25 },
  3: { x: 50, y: 24 },
  4: { x: 21, y: 25 },
  5: { x: 21, y: 76 },
  6: { x: 50, y: 78 }
};

// The setter's base/setting target: right sideline × 10-ft line.
const SETTER_TARGET_COORDS = { x: 94, y: 34 };

function getRotationMap(rotationNumber) {
  let mapping = [0, 1, 2, 3, 4, 5];
  const turns = Math.max(0, rotationNumber - 1);
  for (let i = 0; i < turns; i += 1) {
    // 2→1, 3→2, 4→3, 5→4, 6→5, 1→6
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

function getLiberoReplacementId(config, rotationNumber) {
  if (!config.libero || config.libero.enabled === false) return null;
  return config.libero.replacements?.[String(rotationNumber)] || null;
}

function getActiveCourt(config, rotationNumber) {
  const liberoReplacementId = getLiberoReplacementId(config, rotationNumber);

  return config.players.map((starter, index) => {
    const zone = getZoneForPlayer(index, rotationNumber);
    const liberoCanEnter = liberoReplacementId === starter.id && !isFrontRow(zone);
    const linkedSub = !liberoCanEnter
      ? (config.subs || []).find(
          (sub) => sub.linkedPlayerId === starter.id && rowMatchesTrigger(zone, sub.trigger)
        )
      : null;

    let player = starter;
    let substitutionType = null;
    if (liberoCanEnter) {
      player = { ...config.libero, role: "LIB" };
      substitutionType = "libero";
    } else if (linkedSub) {
      player = linkedSub;
      substitutionType = "sub";
    }

    return {
      index,
      zone,
      starter,
      player,
      isSub: substitutionType !== null,
      substitutionType
    };
  });
}

function getSystemRole(player, zone) {
  if (player.role === "S/RS") return isFrontRow(zone) ? "RS" : "S";
  return player.role;
}

function getBackBaseCoords(zone) {
  if (zone === 5) return { x: 18, y: 72 };
  if (zone === 6) return { x: 50, y: 78 };
  if (zone === 1) return { x: 78, y: 72 };
  return { x: 50, y: 76 };
}

function getFrontNetCoords(role, zone) {
  if (role === "OH") return { x: 16, y: 7 };
  if (role === "MB") return { x: 50, y: 7 };
  if (role === "RS") return { x: 84, y: 7 };
  if (zone === 4) return { x: 16, y: 7 };
  if (zone === 3) return { x: 50, y: 7 };
  return { x: 84, y: 7 };
}

function getServeCoords(entry) {
  const { zone } = entry;
  // A compact, legal-looking serving stack. Front row stays ordered across
  // the net and back row stays ordered behind them; everyone can release fast.
  const stacked = {
    4: { x: 38, y: 14 },
    3: { x: 50, y: 13 },
    2: { x: 62, y: 14 },
    5: { x: 40, y: 55 },
    6: { x: 51, y: 57 },
    1: { x: 80, y: 104 }
  };
  return stacked[zone] || ROTATION_COORDS[zone];
}

function getServeReceiveCoords(entry, rotationNumber) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);

  // Rotation 1: back-row setter is hidden on the right. The outside in Zone 2
  // pulls back so she can pass and keep the setter out of the receiving lane.
  if (rotationNumber === 1) {
    if (role === "S" && zone === 1) return { x: 86, y: 51 };
    if (role === "OH" && zone === 2) return { x: 74, y: 72 };
  }

  if (role === "S") return { x: 85, y: 52 };
  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 12 };
  if (role === "RS" && isFrontRow(zone)) return { x: 82, y: 14 };

  // Front-row outsides can pull off the net to join serve receive.
  if (role === "OH" && isFrontRow(zone)) {
    if (zone === 2) return { x: 74, y: 72 };
    if (zone === 4) return { x: 24, y: 68 };
    return { x: 28, y: 68 };
  }

  if (["OH", "DS", "LIB", "MB", "RS"].includes(role)) return getBackBaseCoords(zone);
  return ROTATION_COORDS[zone];
}

function getBaseCoords(entry) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);

  // Back-row setter runs to the right sideline × 10-ft line intersection.
  if (role === "S") return SETTER_TARGET_COORDS;

  // In base, all three front-row players are shown ON the net.
  if (isFrontRow(zone)) return getFrontNetCoords(role, zone);

  return getBackBaseCoords(zone);
}

function getAttackCoverageCoords(zone, attackRole) {
  // Back-row coverage changes with the hitter. This makes the left-back
  // defender visibly adjust instead of sitting in the same spot every play.
  const coverage = {
    OH: {
      5: { x: 25, y: 45 },
      6: { x: 47, y: 57 },
      1: { x: 73, y: 67 }
    },
    MB: {
      5: { x: 31, y: 57 },
      6: { x: 50, y: 47 },
      1: { x: 69, y: 57 }
    },
    RS: {
      5: { x: 27, y: 68 },
      6: { x: 53, y: 57 },
      1: { x: 76, y: 45 }
    }
  };
  return coverage[attackRole]?.[zone] || getBackBaseCoords(zone);
}

function getAttackCoords(entry, attackRole) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);

  // Setter never drifts during hitter selection: target stays fixed.
  if (role === "S") return SETTER_TARGET_COORDS;

  if (isFrontRow(zone)) {
    // Keep all front-row players at the net; primary hitter is emphasized in UI.
    if (role === "OH") return { x: attackRole === "OH" ? 10 : 16, y: 7 };
    if (role === "MB") return { x: 50, y: 7 };
    if (role === "RS") return { x: attackRole === "RS" ? 90 : 84, y: 7 };
    return getFrontNetCoords(role, zone);
  }

  return getAttackCoverageCoords(zone, attackRole);
}

function getFreeballCoords(entry) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);

  if (role === "S") return SETTER_TARGET_COORDS;
  // Hitters get OFF the net so they have room for a full approach.
  if (role === "OH" && isFrontRow(zone)) return { x: 18, y: 36 };
  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 34 };
  if (role === "RS" && isFrontRow(zone)) return { x: 82, y: 36 };

  // Three-player passing/coverage shape for the back row.
  if (zone === 5) return { x: 22, y: 69 };
  if (zone === 6) return { x: 50, y: 74 };
  if (zone === 1) return { x: 78, y: 69 };
  return getBackBaseCoords(zone);
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
