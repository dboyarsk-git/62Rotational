let config = loadConfig();
let currentRotation = 1;
let currentMode = "receive";
let selectedPlayerId = null;
let roleFilter = "ALL";
let animationTimers = [];

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
const receiveFlowBtn = document.getElementById("receiveFlowBtn");
const serveFlowBtn = document.getElementById("serveFlowBtn");
const setTarget = document.getElementById("setTarget");

const MODE_COPY = {
  receive: {
    title: "Serve Receive",
    hint: "Hide the setter and build a clean passing shape.",
    heading: "Serve Receive",
    text: "In Rotation 1, the back-row setter is hidden on the right. The outside starting in Zone 2 pulls back into serve receive so the setter can stay out of the passing lane.",
    steps: ["Find legal rotation", "Hide the setter", "Zone 2 outside pulls back", "Pass to setter target"]
  },
  set: {
    title: "Setter Release",
    hint: "After the pass, the setter runs up between the middle and right side.",
    heading: "Setter Release",
    text: "Once serve receive is handled, the back-row setter releases to the setting target between the middle and right-side hitter.",
    steps: ["Pass goes up", "Setter leaves hiding spot", "Run to target", "Square up to the hitters"]
  },
  base: {
    title: "Base",
    hint: "Reset into normal team positions before the next read.",
    heading: "Base Positions",
    text: "After the first contact and setter release, everyone gets back to base so the team can read the next ball and transition together.",
    steps: ["Setter settles at target", "OH owns left side", "Middle owns middle", "Right side owns right"]
  },
  attack_oh: {
    title: "Outside Hitter",
    hint: "Set the outside and move everyone into attack coverage.",
    heading: "Outside Attack",
    text: "The setter gets to target, the outside transitions to the left pin, and the rest of the team gets ready to cover the hitter.",
    steps: ["Pass to target", "Setter faces outside", "Outside takes approach", "Everyone else covers"]
  },
  attack_mb: {
    title: "Middle Hitter",
    hint: "Get the middle available quickly in front of the setter.",
    heading: "Middle Attack",
    text: "The middle transitions quickly and stays available in front of the setter while the pins stay ready as alternate options.",
    steps: ["Pass to target", "Middle gets off the net", "Quick approach", "Pins stay available"]
  },
  attack_rs: {
    title: "Right Side Hitter",
    hint: "Set the right side and move the team into coverage.",
    heading: "Right Side Attack",
    text: "The setter gets to target and delivers to the right-side attacker while the middle and outside stay available and prepare to cover.",
    steps: ["Pass to target", "Setter turns right", "Right side approaches", "Team covers"]
  },
  freeball: {
    title: "Free Ball",
    hint: "Call FREE, pass to target, and get all hitters off the net.",
    heading: "Free Ball",
    text: "Treat a free ball as an offensive opportunity: call it, pass it cleanly, get the setter to target, and make all three front-row attackers available.",
    steps: ["Call “FREE!”", "Pass high to target", "Setter gets ready", "OH / MB / RS transition"]
  },
  serve: {
    title: "Serve",
    hint: "Start in rotation; Zone 1 serves from behind the end line.",
    heading: "Serving",
    text: "When your team serves, the Zone 1 player goes behind the end line while everyone else holds the correct rotation until contact.",
    steps: ["Find rotational spot", "Server goes behind line", "Wait for contact", "Release after serve"]
  },
  recovery: {
    title: "Serve Recovery",
    hint: "After the serve, recover into base defense.",
    heading: "Serve Recovery",
    text: "The serve is the trigger. Once the ball is contacted, everyone releases from the serving rotation into normal base positions.",
    steps: ["Serve is contacted", "Players release", "Setter/right side recover", "Get into base"]
  }
};

const ROLE_COPY = {
  "S/RS": {
    title: "Setter / Right Side",
    body: "In a 6–2, the setter who is in the back row runs the offense. When that same player reaches the front row, she becomes the right-side attacker/blocker while the other back-row setter takes over setting."
  },
  OH: {
    title: "Outside Hitter",
    body: "The outside helps carry serve receive, then transitions to the left pin to attack. In Rotation 1, the outside in Zone 2 pulls back to help hide the setter before releasing into the offense."
  },
  MB: {
    title: "Middle",
    body: "The middle owns the center of the net, blocks first, and transitions quickly to become a fast attack option. A libero or DS can be linked to a middle in Admin and automatically replace her in the chosen row."
  },
  DS: {
    title: "Defensive Specialist",
    body: "A DS is a back-row passing and defensive specialist. In Coach Admin, link the DS to a starter and choose whether she enters when that starter reaches the front row, back row, or every rotation."
  },
  LIB: {
    title: "Libero",
    body: "The libero specializes in serve receive and back-row defense. Link her to a player in Coach Admin and the board will automatically show the libero whenever the linked substitution rule is active."
  },
  ALL: {
    title: "Whole Team",
    body: "Use the phase buttons to walk through serve receive, setter release, base, each attack option, free ball, serving, and serve recovery. Tap any player circle for her exact job."
  }
};

function roleMatchesFilter(entry) {
  if (roleFilter === "ALL") return true;
  const displayedRole = entry.player.role;
  const systemRole = getSystemRole(entry.player, entry.zone);
  if (roleFilter === "S/RS") return ["S/RS", "S", "RS"].includes(displayedRole) || ["S", "RS"].includes(systemRole);
  return displayedRole === roleFilter || systemRole === roleFilter;
}

function buildControls() {
  rotationButtons.innerHTML = "";
  for (let i = 1; i <= 6; i += 1) {
    const button = document.createElement("button");
    button.textContent = i;
    button.dataset.rotation = i;
    if (i === currentRotation) button.classList.add("active");
    button.addEventListener("click", () => {
      currentRotation = i;
      stopAnimations();
      render();
    });
    rotationButtons.appendChild(button);
  }

  const previousFocus = selectedPlayerId || playerFocus.value;
  playerFocus.innerHTML = '<option value="">Everyone</option>';
  config.players.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = `${player.name} — ${getPositionLabel(player.role)}`;
    playerFocus.appendChild(option);
  });
  (config.subs || []).forEach((sub) => {
    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = `${sub.name} — ${getPositionLabel(sub.role)} (Sub)`;
    playerFocus.appendChild(option);
  });
  playerFocus.value = previousFocus || "";
}

function coordsFor(entry, mode) {
  if (mode === "receive") return getServeReceiveCoords(entry, currentRotation);
  if (mode === "set") return getSetterReleaseCoords(entry);
  if (mode === "base") return getBaseCoords(entry);
  if (mode === "attack_oh") return getAttackCoords(entry, "OH");
  if (mode === "attack_mb") return getAttackCoords(entry, "MB");
  if (mode === "attack_rs") return getAttackCoords(entry, "RS");
  if (mode === "freeball") return getFreeballCoords(entry);
  if (mode === "serve") return getServeCoords(entry.zone);
  return getRecoveryCoords(entry);
}

function getActivePlayerInstruction(entry) {
  const { player, starter, zone, isSub } = entry;
  const role = getSystemRole(player, zone);
  const subText = isSub ? ` ${player.name} is automatically in for ${starter.name}.` : "";
  const base = `${player.name} is in Zone ${zone}.${subText}`;

  if (currentMode === "receive") {
    if (currentRotation === 1 && role === "S" && zone === 1) return `${base} Setter: stay hidden on the right during serve receive so you do not take the pass.`;
    if (currentRotation === 1 && role === "OH" && zone === 2) return `${base} Outside: pull back into serve receive to help hide the setter and become a passer.`;
    if (role === "S") return `${base} Stay out of the passing lane and be ready to release as soon as the pass is controlled.`;
    if (["OH", "DS", "LIB"].includes(role)) return `${base} Get balanced in the passing shape, call seams, and pass toward setter target.`;
    return `${base} Hold your receive relationship and be ready to transition immediately after the pass.`;
  }

  if (currentMode === "set") {
    if (role === "S") return `${base} Run up to setter target between the right side and middle, square to the court, and get ready to set.`;
    if (role === "OH") return `${base} Transition toward the outside and get ready for your approach.`;
    if (role === "MB") return `${base} Get ready in the middle for a quick option.`;
    if (role === "RS") return `${base} Get to right-side attack position and stay available.`;
    return `${base} Move from receive into coverage/base while the setter releases.`;
  }

  if (currentMode === "base") {
    if (role === "S") return `${base} Settle into setter base and read the next ball.`;
    if (role === "OH") return `${base} Own the left side in base.`;
    if (role === "MB") return `${base} Own the middle in base.`;
    if (role === "RS") return `${base} Own the right side in base.`;
    return `${base} Get balanced in back-row defense and be ready for the next touch.`;
  }

  if (currentMode.startsWith("attack_")) {
    const attackRole = currentMode.replace("attack_", "").toUpperCase();
    if (role === "S") return `${base} Get to target and set the ${attackRole === "MB" ? "middle" : attackRole === "OH" ? "outside" : "right side"}.`;
    if (role === attackRole) return `${base} You are the primary hitter on this play—transition, approach, and attack.`;
    return `${base} Stay available as an option, then move into attack coverage.`;
  }

  if (currentMode === "freeball") {
    if (role === "S") return `${base} Get to target early and call for the pass.`;
    if (["OH", "DS", "LIB"].includes(role) && !isFrontRow(zone)) return `${base} Help pass the free ball high to target, then move into coverage.`;
    if (["OH", "MB", "RS"].includes(role) && isFrontRow(zone)) return `${base} Get off the net and create room for a full approach.`;
    return `${base} Get balanced for the free-ball pass and coverage.`;
  }

  if (currentMode === "serve") {
    if (zone === 1) return `${base} You are the server. Serve from behind the end line, then recover into the court.`;
    return `${base} Hold the serving rotation until contact, then release.`;
  }

  if (role === "S") return `${base} Recover toward setter/base responsibility after the serve.`;
  return `${base} Release from the serving rotation into normal base defense.`;
}

function renderPlayers() {
  const focusId = playerFocus.value;
  const activeCourt = getActiveCourt(config, currentRotation);
  playerLayer.innerHTML = "";

  activeCourt.forEach((entry) => {
    const coords = coordsFor(entry, currentMode);
    const { player, starter, zone, isSub, index } = entry;
    const circle = document.createElement("button");
    circle.className = "player-circle";
    circle.style.left = `${coords.x}%`;
    circle.style.top = `${coords.y}%`;
    circle.dataset.playerId = player.id;
    circle.dataset.slotIndex = index;
    circle.setAttribute("aria-label", `${player.name}, ${getPositionLabel(player.role)}, Zone ${zone}`);

    const focusMatchesSlot = focusId && (focusId === player.id || focusId === starter.id);
    const dimForFocus = focusId && !focusMatchesSlot;
    const dimForRole = !roleMatchesFilter(entry);
    if (dimForFocus || dimForRole) circle.classList.add("dimmed");
    if (selectedPlayerId && (selectedPlayerId === player.id || selectedPlayerId === starter.id)) circle.classList.add("selected");
    if (focusMatchesSlot) circle.classList.add("selected");
    if (currentMode === "serve" && zone === 1) circle.classList.add("server");
    if (isSub) circle.classList.add("subbed-in");
    if (currentMode === "receive" && currentRotation === 1 && getSystemRole(player, zone) === "S" && zone === 1) circle.classList.add("hidden-setter");

    const systemRole = getSystemRole(player, zone);
    circle.innerHTML = `
      <span class="player-name">${escapeHtml(player.name)}</span>
      <span class="player-role">${escapeHtml(player.role)}</span>
      ${player.role === "S/RS" ? `<span class="system-role">Playing ${escapeHtml(systemRole)}</span>` : ""}
      <span class="zone-badge">${zone}</span>
      ${isSub ? '<span class="sub-badge">SUB</span>' : ""}
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

  const activeCourt = getActiveCourt(config, currentRotation);
  const activeEntry = activeCourt.find((entry) => entry.player.id === focusId || entry.starter.id === focusId);
  const starter = config.players.find((player) => player.id === focusId);
  const sub = (config.subs || []).find((player) => player.id === focusId);

  if (sub) {
    const entryWhereActive = activeCourt.find((entry) => entry.player.id === sub.id);
    if (!entryWhereActive) {
      const linked = config.players.find((player) => player.id === sub.linkedPlayerId);
      const triggerText = sub.trigger === "front" ? "front row" : sub.trigger === "back" ? "back row" : "every rotation";
      selectedPlayerCard.innerHTML = `<div><strong>${escapeHtml(sub.name)} — ${escapeHtml(getPositionLabel(sub.role))}</strong><span>Not on the court in this rotation. She is linked to ${escapeHtml(linked?.name || "a starter")} and enters when that player is in the ${escapeHtml(triggerText)}.</span></div>`;
      return;
    }
  }

  if (starter && activeEntry && activeEntry.isSub && activeEntry.starter.id === starter.id) {
    selectedPlayerCard.innerHTML = `<div><strong>${escapeHtml(starter.name)} — ${escapeHtml(getPositionLabel(starter.role))}</strong><span>${escapeHtml(activeEntry.player.name)} is automatically subbed in for her in this rotation.</span></div>`;
    return;
  }

  if (activeEntry) {
    selectedPlayerCard.innerHTML = `<div><strong>${escapeHtml(activeEntry.player.name)} — ${escapeHtml(getPositionLabel(activeEntry.player.role))}</strong><span>${escapeHtml(getActivePlayerInstruction(activeEntry))}</span></div>`;
  }
}

function renderLesson() {
  const copy = MODE_COPY[currentMode];
  rotationLabel.textContent = currentRotation;
  modeTitle.textContent = copy.title;
  modeHint.textContent = copy.hint;
  lessonHeading.textContent = copy.heading;
  lessonText.textContent = copy.text;
  lessonSteps.innerHTML = copy.steps.map((step, index) => `<div><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join("");
  setTarget.hidden = !["set", "attack_oh", "attack_mb", "attack_rs", "freeball"].includes(currentMode);
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
  if (selectedPlayerId) playerFocus.value = selectedPlayerId;
  renderLesson();
  renderRoleCopy();
  renderPlayers();
  renderSelectedPlayer();
  [...modeButtons.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === currentMode);
  });
}

function stopAnimations() {
  animationTimers.forEach((timer) => clearTimeout(timer));
  animationTimers = [];
  receiveFlowBtn.textContent = "▶ Show Receive → Set → Base";
  serveFlowBtn.textContent = "▶ Show Serve → Recovery";
}

function applyModeToExistingPlayers(mode) {
  currentMode = mode;
  const activeCourt = getActiveCourt(config, currentRotation);
  activeCourt.forEach((entry) => {
    const circle = playerLayer.querySelector(`[data-slot-index="${entry.index}"]`);
    if (!circle) return;
    const coords = coordsFor(entry, currentMode);
    circle.style.left = `${coords.x}%`;
    circle.style.top = `${coords.y}%`;
    circle.classList.toggle("server", currentMode === "serve" && entry.zone === 1);
    circle.classList.toggle("hidden-setter", currentMode === "receive" && currentRotation === 1 && getSystemRole(entry.player, entry.zone) === "S" && entry.zone === 1);
  });
  [...modeButtons.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === currentMode);
  });
  renderLesson();
  renderSelectedPlayer();
}

function runReceiveFlowAnimation() {
  stopAnimations();
  currentMode = "receive";
  render();
  receiveFlowBtn.textContent = "Moving…";
  animationTimers.push(setTimeout(() => applyModeToExistingPlayers("set"), 1100));
  animationTimers.push(setTimeout(() => applyModeToExistingPlayers("base"), 2500));
  animationTimers.push(setTimeout(() => {
    receiveFlowBtn.textContent = "↻ Play Again";
    animationTimers = [];
  }, 3900));
}

function runServeRecoveryAnimation() {
  stopAnimations();
  currentMode = "serve";
  render();
  serveFlowBtn.textContent = "Moving…";
  animationTimers.push(setTimeout(() => applyModeToExistingPlayers("recovery"), 850));
  animationTimers.push(setTimeout(() => {
    serveFlowBtn.textContent = "↻ Play Again";
    animationTimers = [];
  }, 2100));
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
  stopAnimations();
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

receiveFlowBtn.addEventListener("click", runReceiveFlowAnimation);
serveFlowBtn.addEventListener("click", runServeRecoveryAnimation);

window.addEventListener("storage", () => {
  config = loadConfig();
  selectedPlayerId = null;
  render();
});

render();
