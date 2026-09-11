const STORAGE_KEY = "volleyball62Config_v1";
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
  ]
};

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return cloneDefaultConfig();
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.players) || parsed.players.length !== 6) return cloneDefaultConfig();
    return { ...cloneDefaultConfig(), ...parsed };
  } catch (error) {
    return cloneDefaultConfig();
  }
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// Court rotation positions: 1=RB/server, 2=RF, 3=MF, 4=LF, 5=LB, 6=MB.
const ROTATION_COORDS = {
  1: { x: 75, y: 78 },
  2: { x: 76, y: 26 },
  3: { x: 50, y: 26 },
  4: { x: 24, y: 26 },
  5: { x: 24, y: 76 },
  6: { x: 50, y: 76 }
};

function getRotationMap(rotationNumber) {
  // Initial player order maps p1..p6 to Zones 1..6.
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

function getServeCoords(zone) {
  if (zone === 1) return { x: 76, y: 104 };
  return ROTATION_COORDS[zone];
}

function getRecoveryCoords(player, zone) {
  const front = isFrontRow(zone);

  if (player.role === "S/RS") {
    return front ? { x: 79, y: 25 } : { x: 70, y: 37 };
  }
  if (player.role === "OH") {
    return front ? { x: 22, y: 26 } : { x: 27, y: 74 };
  }
  if (player.role === "MB") {
    return front ? { x: 50, y: 23 } : { x: 50, y: 76 };
  }
  return ROTATION_COORDS[zone];
}

function getFreeballCoords(player, zone) {
  const front = isFrontRow(zone);
  if (player.role === "S/RS") {
    return front ? { x: 80, y: 38 } : { x: 69, y: 31 };
  }
  if (player.role === "OH") {
    return front ? { x: 19, y: 38 } : { x: 27, y: 72 };
  }
  if (player.role === "MB") {
    return front ? { x: 49, y: 35 } : { x: 50, y: 74 };
  }
  return ROTATION_COORDS[zone];
}

function getPositionLabel(role) {
  return {
    "S/RS": "Setter / Right Side",
    OH: "Outside Hitter",
    MB: "Middle Blocker"
  }[role] || role;
}
