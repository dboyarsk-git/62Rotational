let config = loadConfig();

const pinGate = document.getElementById("pinGate");
const pinForm = document.getElementById("pinForm");
const pinInput = document.getElementById("pinInput");
const pinError = document.getElementById("pinError");
const adminPanel = document.getElementById("adminPanel");
const teamNameInput = document.getElementById("teamNameInput");
const rosterGrid = document.getElementById("rosterGrid");
const liberoNameInput = document.getElementById("liberoNameInput");
const liberoEnabledInput = document.getElementById("liberoEnabledInput");
const liberoRotationGrid = document.getElementById("liberoRotationGrid");
const subsGrid = document.getElementById("subsGrid");
const addSubBtn = document.getElementById("addSubBtn");
const saveBtn = document.getElementById("saveBtn");
const previewBtn = document.getElementById("previewBtn");
const resetBtn = document.getElementById("resetBtn");
const saveStatus = document.getElementById("saveStatus");

const ROLE_OPTIONS = [
  ["S/RS", "Setter / Right Side"],
  ["S", "Setter"],
  ["RS", "Right Side"],
  ["OH", "Outside Hitter"],
  ["MB", "Middle Blocker"],
  ["DS", "Defensive Specialist"],
  ["LIB", "Libero"]
];

function roleOptions(selectedRole) {
  return ROLE_OPTIONS.map(([value, label]) => `<option value="${value}" ${selectedRole === value ? "selected" : ""}>${label}</option>`).join("");
}

function unlockAdmin() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  pinGate.hidden = true;
  adminPanel.hidden = false;
  renderEditor();
}

function renderEditor() {
  config = loadConfig();
  teamNameInput.value = config.teamName || "";
  liberoNameInput.value = config.libero?.name || "Libero";
  liberoEnabledInput.checked = config.libero?.enabled !== false;
  renderRoster();
  renderLiberoMap();
  renderSubs();
}

function renderRoster() {
  rosterGrid.innerHTML = "";
  config.players.forEach((player, index) => {
    const card = document.createElement("div");
    card.className = "player-edit-card";
    card.innerHTML = `
      <div class="slot-number">Starting Slot ${index + 1}</div>
      <label>
        Player Name
        <input class="player-name-input" data-index="${index}" value="${escapeAttribute(player.name)}" maxlength="24" />
      </label>
      <label>
        Position / Role
        <select class="player-role-input" data-index="${index}">${roleOptions(player.role)}</select>
      </label>
    `;
    rosterGrid.appendChild(card);
  });
}

function renderLiberoMap() {
  liberoRotationGrid.innerHTML = "";
  for (let rotation = 1; rotation <= 6; rotation += 1) {
    const currentReplacement = config.libero?.replacements?.[String(rotation)] || "";
    const backRowPlayers = config.players
      .map((player, index) => ({ player, zone: getZoneForPlayer(index, rotation) }))
      .filter(({ zone }) => !isFrontRow(zone));

    const card = document.createElement("div");
    card.className = "libero-rotation-card";
    const options = [
      '<option value="">Off Court</option>',
      ...backRowPlayers.map(({ player, zone }) => `<option value="${player.id}" ${currentReplacement === player.id ? "selected" : ""}>In for ${escapeHtml(player.name)} — Zone ${zone}</option>`)
    ].join("");

    card.innerHTML = `
      <div>
        <span class="rotation-chip">R${rotation}</span>
        <strong>Rotation ${rotation}</strong>
      </div>
      <label>
        Libero replaces…
        <select class="libero-replacement-input" data-rotation="${rotation}">${options}</select>
      </label>
    `;
    liberoRotationGrid.appendChild(card);
  }
}

function renderSubs() {
  subsGrid.innerHTML = "";
  if (!config.subs.length) {
    subsGrid.innerHTML = '<div class="empty-subs">No automatic DS/other substitutions yet. Tap <strong>+ Add Substitute</strong> to add one.</div>';
    return;
  }

  config.subs.forEach((sub, index) => {
    const card = document.createElement("div");
    card.className = "sub-edit-card";
    const starterOptions = config.players.map((player) => `<option value="${player.id}" ${sub.linkedPlayerId === player.id ? "selected" : ""}>${escapeHtml(player.name)}</option>`).join("");
    card.innerHTML = `
      <div class="sub-card-head">
        <div class="slot-number">Sub ${index + 1}</div>
        <button class="remove-sub-btn" data-sub-index="${index}" type="button">Remove</button>
      </div>
      <div class="sub-fields">
        <label>
          Player Name
          <input class="sub-name-input" data-sub-index="${index}" value="${escapeAttribute(sub.name)}" maxlength="24" />
        </label>
        <label>
          Position / Role
          <select class="sub-role-input" data-sub-index="${index}">${roleOptions(sub.role)}</select>
        </label>
        <label>
          Linked to
          <select class="sub-link-input" data-sub-index="${index}">${starterOptions}</select>
        </label>
        <label>
          Automatically enters when linked player is…
          <select class="sub-trigger-input" data-sub-index="${index}">
            <option value="back" ${sub.trigger === "back" ? "selected" : ""}>Back Row</option>
            <option value="front" ${sub.trigger === "front" ? "selected" : ""}>Front Row</option>
            <option value="always" ${sub.trigger === "always" ? "selected" : ""}>Always On Court</option>
          </select>
        </label>
      </div>
    `;
    subsGrid.appendChild(card);
  });
}

function syncDraftFromInputs() {
  config.teamName = teamNameInput.value.trim() || "6–2 Volleyball Rotation Guide";

  document.querySelectorAll(".player-name-input").forEach((input) => {
    const index = Number(input.dataset.index);
    config.players[index].name = input.value.trim() || `Player ${index + 1}`;
  });
  document.querySelectorAll(".player-role-input").forEach((select) => {
    const index = Number(select.dataset.index);
    config.players[index].role = select.value;
  });

  if (!config.libero) config.libero = cloneDefaultConfig().libero;
  config.libero.name = liberoNameInput.value.trim() || "Libero";
  config.libero.role = "LIB";
  config.libero.enabled = liberoEnabledInput.checked;
  config.libero.replacements = config.libero.replacements || {};
  document.querySelectorAll(".libero-replacement-input").forEach((select) => {
    config.libero.replacements[String(select.dataset.rotation)] = select.value || null;
  });

  document.querySelectorAll(".sub-name-input").forEach((input) => {
    const index = Number(input.dataset.subIndex);
    if (config.subs[index]) config.subs[index].name = input.value.trim() || `Sub ${index + 1}`;
  });
  document.querySelectorAll(".sub-role-input").forEach((select) => {
    const index = Number(select.dataset.subIndex);
    if (config.subs[index]) config.subs[index].role = select.value;
  });
  document.querySelectorAll(".sub-link-input").forEach((select) => {
    const index = Number(select.dataset.subIndex);
    if (config.subs[index]) config.subs[index].linkedPlayerId = select.value;
  });
  document.querySelectorAll(".sub-trigger-input").forEach((select) => {
    const index = Number(select.dataset.subIndex);
    if (config.subs[index]) config.subs[index].trigger = select.value;
  });
}

function showStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.classList.toggle("error-text", isError);
  setTimeout(() => {
    saveStatus.textContent = "";
    saveStatus.classList.remove("error-text");
  }, 3200);
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  config = loadConfig();
  if (pinInput.value === config.adminPin) {
    pinError.textContent = "";
    unlockAdmin();
  } else {
    pinError.textContent = "Incorrect PIN.";
    pinInput.select();
  }
});

addSubBtn.addEventListener("click", () => {
  syncDraftFromInputs();
  const starterId = config.players[0]?.id || "p1";
  config.subs.push({
    id: `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: "New DS/Sub",
    role: "DS",
    linkedPlayerId: starterId,
    trigger: "back"
  });
  renderRoster();
  renderLiberoMap();
  renderSubs();
});

subsGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-sub-btn");
  if (!button) return;
  syncDraftFromInputs();
  const index = Number(button.dataset.subIndex);
  config.subs.splice(index, 1);
  renderRoster();
  renderLiberoMap();
  renderSubs();
});

saveBtn.addEventListener("click", () => {
  syncDraftFromInputs();
  saveConfig(config);
  config = loadConfig();
  renderEditor();
  showStatus("Saved! Roster, libero rotation map, and substitutions are updated on this browser.");
});

previewBtn.addEventListener("click", () => {
  syncDraftFromInputs();
  saveConfig(config);
  window.location.href = "index.html";
});

resetBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Reset all names, positions, libero rotation choices, and substitutions to the demo lineup?");
  if (!confirmed) return;
  saveConfig(cloneDefaultConfig());
  renderEditor();
  showStatus("Demo lineup restored.");
});

if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") unlockAdmin();
