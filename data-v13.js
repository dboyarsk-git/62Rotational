const STORAGE_KEY = "volleyball62Config_v2";
const LEGACY_STORAGE_KEY = "volleyball62Config_v1";
const ADMIN_SESSION_KEY = "volleyball62AdminUnlocked";
const ADMIN_PIN_SESSION_KEY = "volleyball62AdminCloudPin";

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

// ---------- Supabase shared sync ----------
let _supabaseClient = null;

function getSupabaseSettings() {
  return window.VBALL_SUPABASE || {};
}

function isSupabaseConfigured() {
  const settings = getSupabaseSettings();
  return Boolean(
    settings.url &&
    settings.publishableKey &&
    settings.teamSlug &&
    !settings.url.includes("PASTE_YOUR") &&
    !settings.publishableKey.includes("PASTE_YOUR") &&
    window.supabase?.createClient
  );
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (_supabaseClient) return _supabaseClient;
  const settings = getSupabaseSettings();
  _supabaseClient = window.supabase.createClient(settings.url, settings.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return _supabaseClient;
}

async function loadConfigFromCloud() {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error("Supabase is not configured yet.") };
  const settings = getSupabaseSettings();
  const { data, error } = await client.rpc("get_team_config", { team_slug: settings.teamSlug });
  if (error) return { data: null, error };
  if (!data) return { data: null, error: new Error("No shared team configuration was found.") };
  const normalized = normalizeConfig(data);
  saveConfig(normalized);
  return { data: normalized, error: null };
}

async function verifyAdminPinCloud(pin) {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: new Error("Supabase is not configured yet.") };
  const settings = getSupabaseSettings();
  const { data, error } = await client.rpc("verify_team_admin", {
    team_slug: settings.teamSlug,
    coach_pin: String(pin)
  });
  return { ok: data === true && !error, error };
}

async function saveConfigToCloud(config, pin) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: new Error("Supabase is not configured yet.") };
  const settings = getSupabaseSettings();
  const payload = normalizeConfig(config);
  delete payload.adminPin;
  const { data, error } = await client.rpc("save_team_config", {
    team_slug: settings.teamSlug,
    payload,
    coach_pin: String(pin)
  });
  if (error) return { data: null, error };
  const normalized = normalizeConfig(data);
  saveConfig(normalized);
  return { data: normalized, error: null };
}

async function refreshConfigFromCloudIfAvailable() {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await loadConfigFromCloud();
  if (error || !data) return false;
  return true;
}

function subscribeToTeamConfigChanges(onUpdate, onStatus) {
  const client = getSupabaseClient();
  if (!client) {
    onStatus?.("LOCAL_ONLY");
    return null;
  }

  const settings = getSupabaseSettings();
  const channel = client
    .channel(`volleyball-team-${settings.teamSlug}-${Math.random().toString(16).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "volleyball_team_public",
        filter: `slug=eq.${settings.teamSlug}`
      },
      (payload) => {
        const cloudConfig = payload?.new?.config;
        if (!cloudConfig) return;
        const normalized = normalizeConfig(cloudConfig);
        saveConfig(normalized);
        onUpdate?.(normalized, payload?.new?.updated_at || null);
      }
    )
    .subscribe((status) => onStatus?.(status));

  return channel;
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

function getServeCoords(zone, rotationNumber = 1) {
  // Rotation 3 custom serving stack from coach reference: Zone 5 tucks into
  // the middle of the court instead of staying wide on the left sideline.
  if (rotationNumber === 3 && zone === 5) return { x: 46, y: 49 };

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

const SERVE_RECEIVE_ZONE_COORDS = {
  // Coach-corrected serve-receive shapes from "Fixed rotations.pdf".
  // IMPORTANT: These are keyed by ROTATIONAL ZONE, not player name/role.
  // That means names, DSs and libero replacements can sync/change without moving the formation.

  // ROTATION 1: Zone 2 OH drops into the right passing lane and hides Zone 1 setter.
  1: {
    1: { x: 90, y: 84 }, // hidden setter, tucked just behind/right of Zone 2
    2: { x: 79, y: 74 }, // right passer / hides setter
    3: { x: 50, y: 12 }, // middle front
    4: { x: 83, y: 13 }, // right-front attacker
    5: { x: 18, y: 74 }, // left passer
    6: { x: 50, y: 82 }  // middle passer
  },

  // ROTATION 2: Zone 6 setter pushes UP near the net/target.
  // Passing line is 4 - 5 - 1.
  2: {
    1: { x: 79, y: 74 }, // right passer
    2: { x: 50, y: 12 }, // middle front
    3: { x: 83, y: 13 }, // right-front attacker
    4: { x: 18, y: 74 }, // left passer
    5: { x: 50, y: 82 }, // middle passer
    6: { x: 66, y: 14 }  // setter sits directly on the pass / set target
  },

  // ROTATION 3: Zone 5 setter + Zone 3 OH push up together.
  // Zone 2 S/RS drops toward 1 to pass; passing line is 6 - 1 - 2.
  3: {
    1: { x: 50, y: 82 }, // middle passer
    2: { x: 82, y: 74 }, // right passer
    3: { x: 32, y: 11 }, // OH pushes up with setter
    4: { x: 50, y: 12 }, // middle front
    5: { x: 25, y: 20 }, // hidden setter near net
    6: { x: 18, y: 74 }  // left passer
  },

  // ROTATION 4 repeats the Rotation 1 serve-receive shape.
  4: {
    1: { x: 90, y: 84 },
    2: { x: 79, y: 74 },
    3: { x: 50, y: 12 },
    4: { x: 83, y: 13 },
    5: { x: 18, y: 74 },
    6: { x: 50, y: 82 }
  },

  // ROTATION 5 repeats the Rotation 2 shape: Zone 6 setter pushes up.
  5: {
    1: { x: 79, y: 74 },
    2: { x: 50, y: 12 },
    3: { x: 83, y: 13 },
    4: { x: 18, y: 74 },
    5: { x: 50, y: 82 },
    6: { x: 66, y: 14 } // setter sits directly on the pass / set target
  },

  // ROTATION 6 repeats the Rotation 3 shape.
  6: {
    1: { x: 50, y: 82 },
    2: { x: 82, y: 74 },
    3: { x: 32, y: 11 },
    4: { x: 50, y: 12 },
    5: { x: 25, y: 20 },
    6: { x: 18, y: 74 }
  }
};

function getServeReceiveCoords(entry, activeCourt = [], rotationNumber = 1) {
  const fixed = SERVE_RECEIVE_ZONE_COORDS[rotationNumber]?.[entry.zone];
  if (fixed) return fixed;
  return ROTATION_COORDS[entry.zone];
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
