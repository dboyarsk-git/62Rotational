let config = loadConfig();

const pinGate = document.getElementById("pinGate");
const pinForm = document.getElementById("pinForm");
const pinInput = document.getElementById("pinInput");
const pinError = document.getElementById("pinError");
const adminPanel = document.getElementById("adminPanel");
const teamNameInput = document.getElementById("teamNameInput");
const rosterGrid = document.getElementById("rosterGrid");
const saveBtn = document.getElementById("saveBtn");
const previewBtn = document.getElementById("previewBtn");
const resetBtn = document.getElementById("resetBtn");
const saveStatus = document.getElementById("saveStatus");

function unlockAdmin() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  pinGate.hidden = true;
  adminPanel.hidden = false;
  renderEditor();
}

function renderEditor() {
  config = loadConfig();
  teamNameInput.value = config.teamName || "";
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
        <select class="player-role-input" data-index="${index}">
          <option value="S/RS" ${player.role === "S/RS" ? "selected" : ""}>Setter / Right Side</option>
          <option value="OH" ${player.role === "OH" ? "selected" : ""}>Outside Hitter</option>
          <option value="MB" ${player.role === "MB" ? "selected" : ""}>Middle Blocker</option>
        </select>
      </label>
    `;
    rosterGrid.appendChild(card);
  });
}

function collectEditorData() {
  const next = loadConfig();
  next.teamName = teamNameInput.value.trim() || "6–2 Volleyball Rotation Guide";

  document.querySelectorAll(".player-name-input").forEach((input) => {
    const index = Number(input.dataset.index);
    next.players[index].name = input.value.trim() || `Player ${index + 1}`;
  });

  document.querySelectorAll(".player-role-input").forEach((select) => {
    const index = Number(select.dataset.index);
    next.players[index].role = select.value;
  });

  return next;
}

function showStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.classList.toggle("error-text", isError);
  setTimeout(() => {
    saveStatus.textContent = "";
    saveStatus.classList.remove("error-text");
  }, 3000);
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

saveBtn.addEventListener("click", () => {
  config = collectEditorData();
  saveConfig(config);
  showStatus("Saved! Open Player View to see the updated names.");
});

previewBtn.addEventListener("click", () => {
  config = collectEditorData();
  saveConfig(config);
  window.location.href = "index.html";
});

resetBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Reset all names and positions to the demo lineup?");
  if (!confirmed) return;
  saveConfig(cloneDefaultConfig());
  renderEditor();
  showStatus("Demo lineup restored.");
});

if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
  unlockAdmin();
}
