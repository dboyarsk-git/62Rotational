let config = loadConfig();
let currentRotation = 1;
let currentMode = "serve";
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
  serve: {
    title: "Serve",
    hint: "Stack in legal order so everyone can release straight to base.",
    heading: "Serving Stack",
    text: "Before the serve, the five players on the court stack compactly while keeping their rotational relationships. The Zone 1 player serves from behind the end line. As soon as she contacts the ball, everyone releases directly to base.",
    steps: ["Find legal rotation", "Stack compactly", "Zone 1 serves", "Release directly to base"]
  },
  receive: {
    title: "Serve Receive",
    hint: "Hide the setter, pass cleanly, then release to base.",
    heading: "Serve Receive",
    text: "The setter stays out of the passing lane, then runs to the right sideline × 10-ft-line intersection after the pass. In Rotation 1, the outside in Zone 2 pulls back to help hide the setter.",
    steps: ["Find legal receive spots", "Hide the setter", "Pass to target", "Setter runs to the intersection"]
  },
  base: {
    title: "Base",
    hint: "Front row on the net; setter at the right sideline × 10-ft line.",
    heading: "Base Positions",
    text: "Base is the reset position. All three front-row players are shown on the net. The back-row setter stays at the right sideline and 10-ft-line intersection while the defenders balance behind the block.",
    steps: ["Front row gets on the net", "Setter owns the intersection", "Back row balances", "Read the next hitter"]
  },
  attack_oh: {
    title: "Outside Hit",
    hint: "Setter stays at target; defense shifts to cover the left-side attack.",
    heading: "Outside Hitter Attack",
    text: "The setter remains fixed at the right-side target. The outside attacks from the left pin. The left-back defender steps in shorter behind the outside while the other defenders adjust into coverage.",
    steps: ["Setter stays at target", "Outside attacks left pin", "Left-back steps in", "Other defenders balance"]
  },
  attack_mb: {
    title: "Middle Hit",
    hint: "Setter stays at target; defenders pinch toward the middle.",
    heading: "Middle Hitter Attack",
    text: "The middle is the primary hitter. The setter stays at the same right-side intersection while the left-back defender pinches toward the middle and the rest of the back row closes in for coverage.",
    steps: ["Setter stays at target", "Middle is primary", "Left-back pinches in", "Back row closes toward middle"]
  },
  attack_rs: {
    title: "Right Side Hit",
    hint: "Setter stays at target; defense shifts toward the right-side attack.",
    heading: "Right Side Hitter Attack",
    text: "The right side attacks from the right pin while the setter remains at target. The left-back defender stays deeper and reads the cross-court ball while the other defenders shift toward the hitter.",
    steps: ["Setter stays at target", "Right side attacks", "Left-back stays deeper", "Coverage shifts right"]
  },
  freeball: {
    title: "Free Ball",
    hint: "Call FREE, pass to target, and get hitters off the net to approach.",
    heading: "Free Ball",
    text: "On a free ball, the setter gets to the same target. Back-row players build a passing shape while all three front-row hitters get off the net so they have room for a full approach.",
    steps: ["Call “FREE!”", "Pass high to target", "Setter gets to intersection", "Hitters get off the net"]
  }
};

const ROLE_COPY = {
  "S/RS": {
    title: "Setter / Right Side",
    body: "In a 6–2, the back-row setter runs the offense. In base and every hitting option, she goes to the right sideline × 10-ft-line intersection. When that same player rotates to the front row, she becomes the right-side hitter/blocker while the other back-row setter runs the offense."
  },
  OH: {
    title: "Outside Hitter",
    body: "The outside helps in serve receive and attacks from the left pin. In Rotation 1, the outside in Zone 2 pulls back to help hide the setter before releasing into base and offense."
  },
  MB: {
    title: "Middle",
    body: "The middle owns the center of the net in base, blocks first, and becomes the quick attack option. Your libero can be assigned separately for each rotation in Coach Admin to replace the correct back-row player."
  },
  DS: {
    title: "Defensive Specialist",
    body: "A DS is a back-row passing and defensive specialist. In Coach Admin, link a DS to a starter and choose when she enters. Her defensive position then shifts with the hitter being attacked."
  },
  LIB: {
    title: "Libero",
    body: "The libero has her own bubble and her own six-rotation replacement map. In Coach Admin, choose exactly who she replaces in Rotation 1, Rotation 2, and so on; choose Off Court for rotations where she is out."
  },
  ALL: {
    title: "Whole Team",
    body: "Go in order: Serve → Serve Receive → Base → Outside → Middle → Right Side → Free Ball. Tap any player to see her exact job, and use the rotation buttons to walk through all six rotations."
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

  if (config.libero) {
    const option = document.createElement("option");
    option.value = config.libero.id;
    option.textContent = `${config.libero.name} — Libero`;
    playerFocus.appendChild(option);
  }

  (config.subs || []).forEach((sub) => {
    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = `${sub.name} — ${getPositionLabel(sub.role)} (Sub)`;
    playerFocus.appendChild(option);
  });
  playerFocus.value = previousFocus || "";
}

function coordsFor(entry, mode) {
  if (mode === "serve") return getServeCoords(entry);
  if (mode === "receive") return getServeReceiveCoords(entry, currentRotation);
  if (mode === "base") return getBaseCoords(entry);
  if (mode === "attack_oh") return getAttackCoords(entry, "OH");
  if (mode === "attack_mb") return getAttackCoords(entry, "MB");
  if (mode === "attack_rs") return getAttackCoords(entry, "RS");
  if (mode === "freeball") return getFreeballCoords(entry);
  return getBaseCoords(entry);
}

function attackRoleForMode() {
  if (currentMode === "attack_oh") return "OH";
  if (currentMode === "attack_mb") return "MB";
  if (currentMode === "attack_rs") return "RS";
  return null;
}

function getActivePlayerInstruction(entry) {
  const { player, starter, zone, isSub, substitutionType } = entry;
  const role = getSystemRole(player, zone);
  let subText = "";
  if (isSub && substitutionType === "libero") subText = ` ${player.name} is the libero in for ${starter.name} this rotation.`;
  else if (isSub) subText = ` ${player.name} is automatically in for ${starter.name}.`;
  const base = `${player.name} is in Zone ${zone}.${subText}`;

  if (currentMode === "serve") {
    if (zone === 1) return `${base} You are the server. Serve from behind the end line; after contact, go straight to base.`;
    if (isFrontRow(zone)) return `${base} Stay in the compact serving stack near the net while keeping legal order. On contact, release straight to your net base.`;
    return `${base} Stay stacked in legal back-row order. On the serve, release straight to base defense.`;
  }

  if (currentMode === "receive") {
    if (currentRotation === 1 && role === "S" && zone === 1) return `${base} Setter: stay hidden on the right. After the pass, run to the right sideline × 10-ft-line intersection.`;
    if (currentRotation === 1 && role === "OH" && zone === 2) return `${base} Outside: pull back into serve receive to hide the setter. After the pass, release to left-front base.`;
    if (role === "S") return `${base} Stay out of the passing lane. Once the ball is passed, run immediately to the right sideline × 10-ft-line intersection.`;
    if (["OH", "DS", "LIB"].includes(role)) return `${base} Get balanced in the passing shape, call seams, and pass high toward setter target.`;
    return `${base} Hold the receive relationship, then release quickly to base after the pass.`;
  }

  if (currentMode === "base") {
    if (role === "S") return `${base} Your base is the right sideline × 10-ft-line intersection. Stay here and read the next ball.`;
    if (isFrontRow(zone)) return `${base} Get ON the net in your base position and be ready to block or transition.`;
    if (zone === 5) return `${base} Start in left-back base. Your next move changes depending on which hitter gets the ball.`;
    return `${base} Get balanced in back-row base and read the hitter.`;
  }

  if (currentMode.startsWith("attack_")) {
    const attackRole = attackRoleForMode();
    const hitterName = attackRole === "OH" ? "outside" : attackRole === "MB" ? "middle" : "right side";
    if (role === "S") return `${base} Stay at the right sideline × 10-ft-line target and set the ${hitterName}.`;
    if (role === attackRole && isFrontRow(zone)) return `${base} You are the primary hitter—stay available at the net, transition, approach, and attack.`;
    if (zone === 5) {
      if (attackRole === "OH") return `${base} Left-back defense: step in shorter behind the outside hitter for coverage.`;
      if (attackRole === "MB") return `${base} Left-back defense: pinch toward the middle to close the coverage gap.`;
      return `${base} Left-back defense: stay deeper left and read the right-side hitter's cross-court ball.`;
    }
    return `${base} Adjust from base toward the ${hitterName} attack and be ready to cover.`;
  }

  if (currentMode === "freeball") {
    if (role === "S") return `${base} Get to the right sideline × 10-ft-line target early and call for the pass.`;
    if (["OH", "DS", "LIB"].includes(role) && !isFrontRow(zone)) return `${base} Help pass the free ball high to target, then move into coverage.`;
    if (isFrontRow(zone)) return `${base} Get OFF the net so you have room for a full approach after the pass.`;
    return `${base} Get balanced for the free-ball pass and coverage.`;
  }

  return base;
}

function renderPlayers() {
  const focusId = playerFocus.value;
  const activeCourt = getActiveCourt(config, currentRotation);
  const primaryAttackRole = attackRoleForMode();
  playerLayer.innerHTML = "";

  activeCourt.forEach((entry) => {
    const coords = coordsFor(entry, currentMode);
    const { player, starter, zone, isSub, index, substitutionType } = entry;
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
    if (substitutionType === "libero" || player.role === "LIB") circle.classList.add("libero-bubble");
    if (currentMode === "receive" && currentRotation === 1 && getSystemRole(player, zone) === "S" && zone === 1) circle.classList.add("hidden-setter");
    if (primaryAttackRole && getSystemRole(player, zone) === primaryAttackRole && isFrontRow(zone)) circle.classList.add("attack-target");

    const systemRole = getSystemRole(player, zone);
    circle.innerHTML = `
      <span class="player-name">${escapeHtml(player.name)}</span>
      <span class="player-role">${escapeHtml(player.role)}</span>
      ${player.role === "S/RS" ? `<span class="system-role">Playing ${escapeHtml(systemRole)}</span>` : ""}
      <span class="zone-badge">${zone}</span>
      ${substitutionType === "libero" ? '<span class="libero-badge">LIB</span>' : isSub ? '<span class="sub-badge">SUB</span>' : ""}
      ${primaryAttackRole && systemRole === primaryAttackRole && isFrontRow(zone) ? '<span class="hitter-badge">HITTER</span>' : ""}
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
  const genericSub = (config.subs || []).find((player) => player.id === focusId);
  const isLiberoFocus = config.libero?.id === focusId;

  if (isLiberoFocus) {
    const entryWhereActive = activeCourt.find((entry) => entry.substitutionType === "libero");
    if (!entryWhereActive) {
      const replacementId = getLiberoReplacementId(config, currentRotation);
      const linked = config.players.find((player) => player.id === replacementId);
      const status = replacementId
        ? `${config.libero.name} is assigned to replace ${linked?.name || "a starter"}, but that starter is not in a legal back-row libero position this rotation.`
        : `${config.libero.name} is OFF COURT in Rotation ${currentRotation}.`;
      selectedPlayerCard.innerHTML = `<div><strong>${escapeHtml(config.libero.name)} — Libero</strong><span>${escapeHtml(status)}</span></div>`;
      return;
    }
  }

  if (genericSub) {
    const entryWhereActive = activeCourt.find((entry) => entry.player.id === genericSub.id);
    if (!entryWhereActive) {
      const linked = config.players.find((player) => player.id === genericSub.linkedPlayerId);
      const triggerText = genericSub.trigger === "front" ? "front row" : genericSub.trigger === "back" ? "back row" : "every rotation";
      selectedPlayerCard.innerHTML = `<div><strong>${escapeHtml(genericSub.name)} — ${escapeHtml(getPositionLabel(genericSub.role))}</strong><span>Not on the court in this rotation. She is linked to ${escapeHtml(linked?.name || "a starter")} and enters when that player is in the ${escapeHtml(triggerText)}.</span></div>`;
      return;
    }
  }

  if (starter && activeEntry && activeEntry.isSub && activeEntry.starter.id === starter.id) {
    const replacementLabel = activeEntry.substitutionType === "libero" ? "libero" : "sub";
    selectedPlayerCard.innerHTML = `<div><strong>${escapeHtml(starter.name)} — ${escapeHtml(getPositionLabel(starter.role))}</strong><span>${escapeHtml(activeEntry.player.name)} is the ${replacementLabel} in for her in Rotation ${currentRotation}.</span></div>`;
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
  setTarget.hidden = currentMode === "serve";
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
  receiveFlowBtn.textContent = "▶ Show Serve Receive → Base";
  serveFlowBtn.textContent = "▶ Show Serve → Base";
}

function applyModeToExistingPlayers(mode) {
  currentMode = mode;
  const activeCourt = getActiveCourt(config, currentRotation);
  const primaryAttackRole = attackRoleForMode();
  activeCourt.forEach((entry) => {
    const circle = playerLayer.querySelector(`[data-slot-index="${entry.index}"]`);
    if (!circle) return;
    const coords = coordsFor(entry, currentMode);
    circle.style.left = `${coords.x}%`;
    circle.style.top = `${coords.y}%`;
    circle.classList.toggle("server", currentMode === "serve" && entry.zone === 1);
    circle.classList.toggle("hidden-setter", currentMode === "receive" && currentRotation === 1 && getSystemRole(entry.player, entry.zone) === "S" && entry.zone === 1);
    circle.classList.toggle("attack-target", Boolean(primaryAttackRole && getSystemRole(entry.player, entry.zone) === primaryAttackRole && isFrontRow(entry.zone)));
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
  animationTimers.push(setTimeout(() => applyModeToExistingPlayers("base"), 1400));
  animationTimers.push(setTimeout(() => {
    receiveFlowBtn.textContent = "↻ Play Again";
    animationTimers = [];
  }, 2800));
}

function runServeBaseAnimation() {
  stopAnimations();
  currentMode = "serve";
  render();
  serveFlowBtn.textContent = "Moving…";
  animationTimers.push(setTimeout(() => applyModeToExistingPlayers("base"), 1100));
  animationTimers.push(setTimeout(() => {
    serveFlowBtn.textContent = "↻ Play Again";
    animationTimers = [];
  }, 2500));
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
serveFlowBtn.addEventListener("click", runServeBaseAnimation);

window.addEventListener("storage", () => {
  config = loadConfig();
  selectedPlayerId = null;
  render();
});

render();
