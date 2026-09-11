let config = loadConfig();
let currentRotation = 1;
let currentMode = "serve";
let selectedPlayerId = null;
let roleFilter = "ALL";
let animationTimer = null;

const rotationButtons = document.getElementById("rotationButtons");
const modeButtons = document.getElementById("modeButtons");
const playerLayer = document.getElementById("playerLayer");
const playerFocus = document.getElementById("playerFocus");
const teamTitle = document.getElementById("teamTitle");
const rotationLabel = document.getElementById("rotationLabel");
const modeTitle = document.getElementById("modeTitle");
const modeHint = document.getElementById("modeHint");
const selectedPlayerCard = document.getElementById("selectedPlayerCard");
const lessonHeading = document.getElementById("lessonHeading");
const lessonText = document.getElementById("lessonText");
const lessonSteps = document.getElementById("lessonSteps");
const roleTabs = document.getElementById("roleTabs");
const roleExplanation = document.getElementById("roleExplanation");
const animateBtn = document.getElementById("animateBtn");

const MODE_COPY = {
  serve: {
    title: "Serve",
    hint: "Stay in legal rotational order until contact.",
    heading: "Serving",
    text: "Start in legal rotational order. The player in Zone 1 serves from behind the end line.",
    steps: ["Find your rotational spot", "Server goes behind the line", "Wait for serve contact", "Release to your job"]
  },
  recovery: {
    title: "Serve Recovery",
    hint: "As soon as the serve is contacted, release to base.",
    heading: "Serve Recovery",
    text: "The serve is the trigger. After contact, everyone moves from rotational order into the team’s normal playing positions.",
    steps: ["Serve is contacted", "Setter releases to target", "Hitters move to base", "Get ready to defend"]
  },
  freeball: {
    title: "Free Ball",
    hint: "Pass, get the setter to target, and transition hitters off the net.",
    heading: "Free Ball",
    text: "A free ball is a chance to run organized offense. Call it early, pass it high, and make all three attacking options available.",
    steps: ["Call “FREE!”", "Pass to target", "Setter gets ready", "Hitters transition & approach"]
  }
};

const ROLE_COPY = {
  "S/RS": {
    title: "Right Side / Setter",
    body: "In a 6–2, the back-row setter runs the offense. The front-row setter becomes a right-side attacker/blocker. On a free ball, the back-row setter gets to target while the front-row setter transitions as a right-side hitter."
  },
  OH: {
    title: "Outside Hitter",
    body: "Front row: get to left front, be ready to block, transition off the net, and attack. Back row: help pass/defend, then be ready for coverage or a back-row option if your team uses one."
  },
  MB: {
    title: "Middle",
    body: "Front row: own the middle of the net—block first, then transition off quickly for a middle attack. Back row: defend the middle-back area unless your team uses a libero/DS replacement."
  },
  ALL: {
    title: "Whole Team",
    body: "Use the situation buttons above to see how all six players move together. Tap any circle for that player’s specific instruction."
  }
};

function buildControls() {
  rotationButtons.innerHTML = "";
  for (let i = 1; i <= 6; i += 1) {
    const button = document.createElement("button");
    button.textContent = i;
    button.dataset.rotation = i;
    if (i === currentRotation) button.classList.add("active");
    button.addEventListener("click", () => {
      currentRotation = i;
      stopAnimation();
      render();
    });
    rotationButtons.appendChild(button);
  }

  playerFocus.innerHTML = '<option value="">Everyone</option>';
  config.players.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = `${player.name} — ${getPositionLabel(player.role)}`;
    playerFocus.appendChild(option);
  });
}

function coordsFor(player, playerIndex, mode) {
  const zone = getZoneForPlayer(playerIndex, currentRotation);
  if (mode === "serve") return getServeCoords(zone);
  if (mode === "recovery") return getRecoveryCoords(player, zone);
  return getFreeballCoords(player, zone);
}

function getPlayerInstruction(player, playerIndex) {
  const zone = getZoneForPlayer(playerIndex, currentRotation);
  const front = isFrontRow(zone);
  const base = `${player.name} starts in Zone ${zone}.`;

  if (currentMode === "serve") {
    if (zone === 1) return `${base} She is the server. Serve from behind the end line, then recover into the court.`;
    return `${base} Hold correct rotational order until the server contacts the ball, then release.`;
  }

  if (currentMode === "recovery") {
    if (player.role === "S/RS") {
      return front
        ? `${base} Front row: recover to right front and play right side—block, transition, and attack.`
        : `${base} Back row: release toward setting target and run the offense.`;
    }
    if (player.role === "OH") {
      return front
        ? `${base} Front row: release to left front, block outside, then transition to hit.`
        : `${base} Back row: recover to passing/defensive base and prepare for the next ball.`;
    }
    if (player.role === "MB") {
      return front
        ? `${base} Front row: release to middle front, read the setter, block, and transition quickly.`
        : `${base} Back row: recover to middle-back defense unless replaced by the libero/DS.`;
    }
  }

  if (currentMode === "freeball") {
    if (player.role === "S/RS") {
      return front
        ? `${base} Front row: get off the net and become the right-side attacking option.`
        : `${base} Back row: get to setting target early and call for the pass.`;
    }
    if (player.role === "OH") {
      return front
        ? `${base} Front row: pull off the net, open up, and prepare a full outside approach.`
        : `${base} Back row: help pass the free ball and cover the attack.`;
    }
    if (player.role === "MB") {
      return front
        ? `${base} Front row: transition off the net so you can approach for a quick/middle option.`
        : `${base} Back row: get balanced for free-ball passing/coverage unless a libero/DS is in.`;
    }
  }

  return base;
}

function renderPlayers() {
  const focusId = playerFocus.value;
  playerLayer.innerHTML = "";

  config.players.forEach((player, index) => {
    const coords = coordsFor(player, index, currentMode);
    const zone = getZoneForPlayer(index, currentRotation);
    const circle = document.createElement("button");
    circle.className = "player-circle";
    circle.style.left = `${coords.x}%`;
    circle.style.top = `${coords.y}%`;
    circle.dataset.playerId = player.id;
    circle.setAttribute("aria-label", `${player.name}, ${getPositionLabel(player.role)}, Zone ${zone}`);

    const dimForFocus = focusId && focusId !== player.id;
    const dimForRole = roleFilter !== "ALL" && roleFilter !== player.role;
    if (dimForFocus || dimForRole) circle.classList.add("dimmed");
    if (selectedPlayerId === player.id || focusId === player.id) circle.classList.add("selected");
    if (currentMode === "serve" && zone === 1) circle.classList.add("server");

    circle.innerHTML = `
      <span class="player-name">${escapeHtml(player.name)}</span>
      <span class="player-role">${escapeHtml(player.role)}</span>
      <span class="zone-badge">${zone}</span>
    `;

    circle.addEventListener("click", () => {
      selectedPlayerId = player.id;
      playerFocus.value = player.id;
      renderPlayers();
      renderSelectedPlayer();
    });

    playerLayer.appendChild(circle);
  });
}

function renderSelectedPlayer() {
  const focusId = playerFocus.value || selectedPlayerId;
  if (!focusId) {
    selectedPlayerCard.innerHTML = '<strong>Tap a player circle</strong><span>to see her job in this situation.</span>';
    return;
  }
  const index = config.players.findIndex((player) => player.id === focusId);
  if (index === -1) return;
  const player = config.players[index];
  selectedPlayerCard.innerHTML = `
    <div>
      <strong>${escapeHtml(player.name)} — ${escapeHtml(getPositionLabel(player.role))}</strong>
      <span>${escapeHtml(getPlayerInstruction(player, index))}</span>
    </div>
  `;
}

function renderLesson() {
  const copy = MODE_COPY[currentMode];
  rotationLabel.textContent = currentRotation;
  modeTitle.textContent = copy.title;
  modeHint.textContent = copy.hint;
  lessonHeading.textContent = copy.heading;
  lessonText.textContent = copy.text;
  lessonSteps.innerHTML = copy.steps.map((step, index) => `<div><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join("");
}

function renderRoleCopy() {
  const copy = ROLE_COPY[roleFilter];
  roleExplanation.innerHTML = `<h3>${escapeHtml(copy.title)}</h3><p>${escapeHtml(copy.body)}</p>`;
  [...roleTabs.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.role === roleFilter);
  });
}

function render() {
  config = loadConfig();
  teamTitle.textContent = config.teamName || "6–2 Volleyball Rotation Guide";
  document.title = `${config.teamName || "6–2 Volleyball"} — Rotation ${currentRotation}`;
  buildControls();
  playerFocus.value = selectedPlayerId || "";
  renderLesson();
  renderRoleCopy();
  renderPlayers();
  renderSelectedPlayer();

  [...modeButtons.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === currentMode);
  });
}

function stopAnimation() {
  if (animationTimer) clearTimeout(animationTimer);
  animationTimer = null;
  animateBtn.textContent = "▶ Show Serve → Recovery";
}

function applyModeToExistingPlayers(mode) {
  currentMode = mode;
  config.players.forEach((player, index) => {
    const circle = playerLayer.querySelector(`[data-player-id="${player.id}"]`);
    if (!circle) return;
    const coords = coordsFor(player, index, currentMode);
    const zone = getZoneForPlayer(index, currentRotation);
    circle.style.left = `${coords.x}%`;
    circle.style.top = `${coords.y}%`;
    circle.classList.toggle("server", currentMode === "serve" && zone === 1);
  });

  [...modeButtons.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === currentMode);
  });
  renderLesson();
  renderSelectedPlayer();
}

function runServeRecoveryAnimation() {
  stopAnimation();
  currentMode = "serve";
  render();
  animateBtn.textContent = "Moving…";

  // Give the browser one moment to paint the legal serve positions,
  // then move the same circle elements so CSS can animate them.
  animationTimer = setTimeout(() => {
    applyModeToExistingPlayers("recovery");
    animateBtn.textContent = "↻ Play Again";
    animationTimer = null;
  }, 350);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

modeButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button) return;
  stopAnimation();
  currentMode = button.dataset.mode;
  render();
});

roleTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-role]");
  if (!button) return;
  roleFilter = button.dataset.role;
  renderRoleCopy();
  renderPlayers();
});

playerFocus.addEventListener("change", () => {
  selectedPlayerId = playerFocus.value || null;
  renderPlayers();
  renderSelectedPlayer();
});

animateBtn.addEventListener("click", runServeRecoveryAnimation);

window.addEventListener("storage", () => {
  config = loadConfig();
  selectedPlayerId = null;
  render();
});

render();
