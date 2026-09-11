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

  const subs = Array.isArray(parsed.subs)
    ? parsed.subs.map((sub, index) => ({
        id: sub.id || `sub_${Date.now()}_${index}`,
        name: sub.name || `Sub ${index + 1}`,
        role: sub.role || "DS",
        linkedPlayerId: sub.linkedPlayerId || players[0].id,
        trigger: ["front", "back", "always"].includes(sub.trigger) ? sub.trigger : "back"
      }))
    : [];

  return {
    ...fallback,
    ...parsed,
    players,
    subs
  };
}

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeConfig(JSON.parse(stored));

    // Keep names from the first version if the coach already edited them.
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

function getActiveCourt(config, rotationNumber) {
  return config.players.map((starter, index) => {
    const zone = getZoneForPlayer(index, rotationNumber);
    const linkedSub = (config.subs || []).find(
      (sub) => sub.linkedPlayerId === starter.id && rowMatchesTrigger(zone, sub.trigger)
    );
    return {
      index,
      zone,
      starter,
      player: linkedSub || starter,
      isSub: Boolean(linkedSub)
    };
  });
}

function getSystemRole(player, zone) {
  if (player.role === "S/RS") return isFrontRow(zone) ? "RS" : "S";
  return player.role;
}

function getBackBaseCoords(zone) {
  if (zone === 5) return { x: 22, y: 76 };
  if (zone === 6) return { x: 50, y: 79 };
  if (zone === 1) return { x: 78, y: 76 };
  return { x: 50, y: 76 };
}

function getServeCoords(zone) {
  if (zone === 1) return { x: 78, y: 104 };
  return ROTATION_COORDS[zone];
}

function getServeReceiveCoords(entry, rotationNumber) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);

  // Rotation 1 teaching shape: the back-row setter is tucked/hidden on the
  // right and the OH in Zone 2 pulls back to become a passer and hide her.
  if (rotationNumber === 1) {
    if (role === "S" && zone === 1) return { x: 82, y: 54 };
    if (role === "OH" && zone === 2) return { x: 77, y: 78 };
  }

  if (role === "S") return { x: 80, y: 52 };
  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 23 };
  if (role === "RS" && isFrontRow(zone)) return { x: 82, y: 25 };

  // Front-row outside hitters can pull off the net into receive.
  if (role === "OH" && isFrontRow(zone)) {
    if (zone === 2) return { x: 76, y: 74 };
    if (zone === 4) return { x: 24, y: 70 };
    return { x: 28, y: 68 };
  }

  // Back-row passers keep spacing across the court.
  if (["OH", "DS", "LIB", "MB", "RS"].includes(role)) return getBackBaseCoords(zone);
  return ROTATION_COORDS[zone];
}

function getSetterReleaseCoords(entry) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);
  if (role === "S") return { x: 66, y: 20 };
  if (role === "OH" && isFrontRow(zone)) return { x: 20, y: 31 };
  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 27 };
  if (role === "RS" && isFrontRow(zone)) return { x: 81, y: 28 };
  return getBackBaseCoords(zone);
}

function getBaseCoords(entry) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);
  if (role === "S") return { x: 68, y: 36 };
  if (role === "OH" && isFrontRow(zone)) return { x: 20, y: 25 };
  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 22 };
  if (role === "RS" && isFrontRow(zone)) return { x: 81, y: 25 };
  return getBackBaseCoords(zone);
}

function getAttackCoords(entry, attackRole) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);

  if (role === "S") return { x: 66, y: 20 };

  if (isFrontRow(zone)) {
    if (role === "OH") return attackRole === "OH" ? { x: 14, y: 19 } : { x: 20, y: 34 };
    if (role === "MB") return attackRole === "MB" ? { x: 50, y: 17 } : { x: 50, y: 31 };
    if (role === "RS") return attackRole === "RS" ? { x: 86, y: 19 } : { x: 81, y: 34 };
  }

  // Back row closes in for coverage while the attack is being run.
  if (zone === 5) return { x: 28, y: 68 };
  if (zone === 6) return { x: 50, y: 67 };
  if (zone === 1) return { x: 72, y: 68 };
  return getBackBaseCoords(zone);
}

function getFreeballCoords(entry) {
  const { player, zone } = entry;
  const role = getSystemRole(player, zone);
  if (role === "S") return { x: 66, y: 20 };
  if (role === "OH" && isFrontRow(zone)) return { x: 17, y: 39 };
  if (role === "MB" && isFrontRow(zone)) return { x: 50, y: 37 };
  if (role === "RS" && isFrontRow(zone)) return { x: 83, y: 39 };
  return getBackBaseCoords(zone);
}

function getRecoveryCoords(entry) {
  return getBaseCoords(entry);
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
