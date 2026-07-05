const canvas = document.querySelector("#worldCanvas");
const ctx = canvas.getContext("2d");
const titleOverlay = document.querySelector("#titleOverlay");
const startButton = document.querySelector("#startButton");
const locationName = document.querySelector("#locationName");
const discoveryCount = document.querySelector("#discoveryCount");
const promptTitle = document.querySelector("#promptTitle");
const promptCopy = document.querySelector("#promptCopy");
const promptButton = document.querySelector("#promptButton");
const storyDialog = document.querySelector("#storyDialog");
const storyEyebrow = document.querySelector("#storyEyebrow");
const storyTitle = document.querySelector("#storyTitle");
const storyCopy = document.querySelector("#storyCopy");
const storyClose = document.querySelector("#storyClose");
const districtButtons = document.querySelectorAll("[data-district]");

const TAU = Math.PI * 2;
const OBJECT_SCALE = 0.62;
const PLAYER_SCALE = 0.72;

const ink = "#263236";
const palette = {
  sky: "#7fc6c3",
  cloud: "#bde7dc",
  planetLight: "#c8d2c0",
  planetDark: "#6f8f92",
  grass: "#4f9465",
  grassDark: "#37734e",
  road: "#d7dccd",
  roadShadow: "#8c978d",
  cream: "#fff9ec",
  gold: "#f3c85c",
  red: "#d1524b",
  blue: "#3e6cab",
  teal: "#62c8b8",
  concrete: "#aeb7ae",
  building: "#b6bdaf",
  shadow: "rgba(38, 50, 54, 0.28)"
};

const zones = [
  {
    id: "south-central",
    short: "SC",
    name: "South Central",
    chapter: "85th & Avalon",
    angle: 0,
    lat: 0.47,
    color: palette.gold,
    mission: "Start at the court, then follow the curved road out of the block.",
    story: "The origin is a round-world South Central block: low apartments, chain-link court, power lines, palms, asphalt, and a kid-sized way out."
  },
  {
    id: "staples",
    short: "LAC",
    name: "Downtown LA",
    chapter: "Staples / Clippers",
    angle: 0.95,
    lat: 0.36,
    color: palette.red,
    mission: "Run the road into the arena plaza.",
    story: "Downtown sits on the same planet road as the first court. The arena is a real stop on the route, with red-blue banners, street lights, and a plaza edge."
  },
  {
    id: "crossroads-ucla",
    short: "UCLA",
    name: "Crossroads / UCLA",
    chapter: "Westside Growth",
    angle: 1.88,
    lat: 0.42,
    color: "#79b4da",
    mission: "Follow the westside branch into school, art, and campus.",
    story: "Crossroads and UCLA share one connected westside district: studio windows, sketch tables, campus brick, and blue-gold court markings."
  },
  {
    id: "oakland",
    short: "OAK",
    name: "Oakland",
    chapter: "We Believe Warriors",
    angle: 2.9,
    lat: 0.25,
    color: palette.gold,
    mission: "Cross the bridge arc into the loud arena district.",
    story: "Oakland becomes a physical turn on the round world: transit, arena bowl, industrial supports, towels, ticket stubs, and yellow-blue fan energy."
  },
  {
    id: "investor",
    short: "INV",
    name: "Investor Tower",
    chapter: "SF / NY",
    angle: 4.02,
    lat: 0.12,
    color: palette.teal,
    mission: "Climb the glowing route toward the founder tower.",
    story: "The investor tower is still attached to the player's planet. Rooftop court, glass rooms, pitch screens, and skyline silhouettes turn the story into ownership."
  }
];

const props = [
  { type: "court", angle: -0.08, lat: 0.55, zone: 0 },
  { type: "apartment", angle: -0.23, lat: 0.35, zone: 0 },
  { type: "market", angle: 0.18, lat: 0.42, zone: 0 },
  { type: "pole", angle: 0.34, lat: 0.28, zone: 0 },
  { type: "palm", angle: -0.45, lat: 0.44, zone: 0 },
  { type: "arenaLA", angle: 0.95, lat: 0.2, zone: 1 },
  { type: "plazaBanner", angle: 0.72, lat: 0.42, zone: 1, color: palette.red, label: "LAC" },
  { type: "plazaBanner", angle: 1.16, lat: 0.39, zone: 1, color: palette.blue, label: "LA" },
  { type: "streetlight", angle: 1.28, lat: 0.47, zone: 1 },
  { type: "studio", angle: 1.72, lat: 0.34, zone: 2 },
  { type: "campus", angle: 2.03, lat: 0.28, zone: 2 },
  { type: "jacaranda", angle: 1.86, lat: 0.58, zone: 2 },
  { type: "uclaCourt", angle: 2.18, lat: 0.52, zone: 2 },
  { type: "bridge", angle: 2.56, lat: 0.34, zone: 3 },
  { type: "arenaOak", angle: 2.9, lat: 0.18, zone: 3 },
  { type: "transit", angle: 3.18, lat: 0.43, zone: 3 },
  { type: "plazaBanner", angle: 3.05, lat: 0.32, zone: 3, color: palette.gold, label: "BELIEVE" },
  { type: "tower", angle: 4.02, lat: 0.04, zone: 4 },
  { type: "rooftop", angle: 3.82, lat: 0.29, zone: 4 },
  { type: "screen", angle: 4.27, lat: 0.27, zone: 4 },
  { type: "tree", angle: 4.46, lat: 0.46, zone: 4 },
  { type: "ball", angle: -0.02, lat: 0.66, zone: 0 },
  { type: "shoes", angle: 0.08, lat: 0.63, zone: 0 },
  { type: "ticket", angle: 3.28, lat: 0.58, zone: 3 },
  { type: "briefcase", angle: 4.16, lat: 0.45, zone: 4 }
];

const state = {
  started: false,
  dialogOpen: false,
  keys: new Set(),
  player: { angle: 0, lat: 0.61 },
  target: { angle: 0, lat: 0.61 },
  targetActive: false,
  pointerHeld: false,
  cameraAngle: 0,
  facing: 0,
  moving: false,
  walkPhase: 0,
  selected: 0,
  nearby: null,
  discovered: new Set(),
  lastTime: performance.now()
};

let viewport = { width: 1, height: 1, dpr: 1 };
let planet = { x: 1, y: 1, r: 1 };

resize();
bindEvents();
updateHud();
requestAnimationFrame(tick);

function bindEvents() {
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  startButton.addEventListener("click", startGame);
  promptButton.addEventListener("click", unlockNearby);
  storyClose.addEventListener("click", () => {
    storyDialog.classList.add("hidden");
    state.dialogOpen = false;
  });
  districtButtons.forEach((button) => {
    button.addEventListener("click", () => routeToZone(Number(button.dataset.district)));
  });
}

function resize() {
  viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewport.width = Math.floor(window.innerWidth);
  viewport.height = Math.floor(window.innerHeight);
  canvas.width = Math.floor(viewport.width * viewport.dpr);
  canvas.height = Math.floor(viewport.height * viewport.dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  layoutPlanet();
}

function layoutPlanet() {
  const top = viewport.width < 720 ? 90 : 74;
  const bottom = viewport.width < 720 ? 165 : 110;
  planet.r = Math.min(viewport.width * 0.5, (viewport.height - top - bottom) * 0.68, 470);
  planet.r = Math.max(planet.r, Math.min(viewport.width, viewport.height) * 0.34);
  planet.x = viewport.width * 0.5;
  planet.y = top + planet.r * 0.9;
}

function startGame() {
  state.started = true;
  titleOverlay.classList.add("hidden");
}

function onKeyDown(event) {
  if (event.key === "Enter" && !state.started) {
    startGame();
    return;
  }
  if (state.dialogOpen && event.key === "Escape") {
    storyDialog.classList.add("hidden");
    state.dialogOpen = false;
    return;
  }
  if ((event.key === "e" || event.key === "E" || event.key === " ") && state.nearby && !state.dialogOpen) {
    event.preventDefault();
    unlockNearby();
    return;
  }
  const key = normalizeKey(event.key);
  if (!key) return;
  event.preventDefault();
  state.keys.add(key);
}

function onKeyUp(event) {
  const key = normalizeKey(event.key);
  if (!key) return;
  event.preventDefault();
  state.keys.delete(key);
}

function normalizeKey(key) {
  const lower = key.toLowerCase();
  if (lower === "w" || key === "ArrowUp") return "up";
  if (lower === "s" || key === "ArrowDown") return "down";
  if (lower === "a" || key === "ArrowLeft") return "left";
  if (lower === "d" || key === "ArrowRight") return "right";
  return null;
}

function onPointerDown(event) {
  if (state.dialogOpen) return;
  event.preventDefault();
  state.pointerHeld = true;
  setTargetFromPointer(event);
}

function onPointerMove(event) {
  if (!state.pointerHeld || state.dialogOpen) return;
  event.preventDefault();
  setTargetFromPointer(event);
}

function onPointerUp() {
  state.pointerHeld = false;
}

function setTargetFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const target = screenToWorld(x, y);
  if (!target) return;
  state.target.angle = target.angle;
  state.target.lat = target.lat;
  state.targetActive = true;
  if (!state.started) startGame();
}

function tick(now) {
  const delta = Math.min((now - state.lastTime) / 1000, 0.04);
  state.lastTime = now;
  update(delta);
  render();
  requestAnimationFrame(tick);
}

function update(delta) {
  state.moving = false;
  if (state.started && !state.dialogOpen) {
    const move = getMoveVector();
    if (Math.abs(move.angle) + Math.abs(move.lat) > 0.001) {
      state.player.angle = wrapAngle(state.player.angle + move.angle * delta);
      state.player.lat = clamp(state.player.lat + move.lat * delta, 0.02, 0.72);
      state.facing = Math.sign(move.angle || state.facing || 1);
      state.walkPhase += delta * 10;
      state.moving = true;
    }
  }

  state.cameraAngle += angleDelta(state.cameraAngle, state.player.angle) * Math.min(delta * 6, 1);
  updateNearby();
}

function getMoveVector() {
  const move = { angle: 0, lat: 0 };
  if (state.keys.has("left")) move.angle -= 1.15;
  if (state.keys.has("right")) move.angle += 1.15;
  if (state.keys.has("up")) move.lat -= 0.5;
  if (state.keys.has("down")) move.lat += 0.5;

  if (Math.abs(move.angle) + Math.abs(move.lat) > 0.001) {
    state.targetActive = false;
    return move;
  }

  if (state.targetActive) {
    const da = angleDelta(state.player.angle, state.target.angle);
    const dl = state.target.lat - state.player.lat;
    const distance = Math.hypot(da * 1.15, dl * 1.8);
    if (distance < 0.025) {
      state.targetActive = false;
      return move;
    }
    move.angle = clamp(da * 2.2, -1.25, 1.25);
    move.lat = clamp(dl * 2.2, -0.62, 0.62);
  }
  return move;
}

function updateNearby() {
  let closest = null;
  let closestDistance = Infinity;
  zones.forEach((zone, index) => {
    const distance = Math.hypot(angleDelta(state.player.angle, zone.angle) * 1.2, (state.player.lat - zone.lat) * 1.8);
    if (distance < closestDistance) {
      closest = { zone, index };
      closestDistance = distance;
    }
  });
  state.selected = closest.index;
  state.nearby = closestDistance < 0.32 ? closest.zone : null;
  updateHud();
}

function updateHud() {
  const active = state.nearby || zones[state.selected];
  locationName.textContent = active.name;
  promptTitle.textContent = active.chapter;
  promptCopy.textContent = active.mission;
  promptButton.textContent = state.discovered.has(active.id) ? "Replay" : "Open";
  promptButton.disabled = !state.nearby;
  discoveryCount.textContent = `${state.discovered.size}/${zones.length}`;
  districtButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.district) === state.selected);
  });
}

function routeToZone(index) {
  const zone = zones[index];
  state.selected = index;
  state.target.angle = zone.angle;
  state.target.lat = zone.lat + 0.08;
  state.targetActive = true;
  if (!state.started) startGame();
  updateHud();
}

function unlockNearby() {
  const zone = state.nearby || zones[state.selected];
  state.discovered.add(zone.id);
  discoveryCount.textContent = `${state.discovered.size}/${zones.length}`;
  promptButton.textContent = "Replay";
  storyEyebrow.textContent = "Round World";
  storyTitle.textContent = `${zone.name}: ${zone.chapter}`;
  storyCopy.textContent = zone.story;
  storyDialog.classList.remove("hidden");
  state.dialogOpen = true;
}

function render() {
  layoutPlanet();
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  drawSky();
  drawPlanetBase();
  drawBackRoads();
  drawSurfaceLand();
  drawFrontRoads();
  drawZones();
  drawEntities();
  drawPlayer();
  drawAtmosphere();
  drawVignette();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, viewport.height);
  gradient.addColorStop(0, palette.sky);
  gradient.addColorStop(1, "#a6d4c3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.save();
  ctx.globalAlpha = 0.72;
  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 239 + 80) % 960) / 960 * viewport.width;
    const y = 42 + ((i * 131) % 310);
    drawCloudSlash(x, y, 130 + (i % 4) * 42, 22 + (i % 3) * 9);
  }
  ctx.restore();
}

function drawPlanetBase() {
  ctx.save();
  ctx.translate(planet.x, planet.y);
  const gradient = ctx.createRadialGradient(-planet.r * 0.36, -planet.r * 0.42, planet.r * 0.08, 0, 0, planet.r);
  gradient.addColorStop(0, "#dbe6d0");
  gradient.addColorStop(0.55, "#8fb3a5");
  gradient.addColorStop(1, "#557c84");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, planet.r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawSurfaceLand() {
  clipPlanet(() => {
    drawLatBlob(0.2, 0.54, 0.72, 0.18, "#869d7c");
    drawLatBlob(0.95, 0.42, 0.58, 0.16, "#969d98");
    drawLatBlob(1.88, 0.52, 0.52, 0.16, "#829d80");
    drawLatBlob(2.9, 0.36, 0.52, 0.16, "#919a9a");
    drawLatBlob(4.05, 0.28, 0.6, 0.17, "#78989b");
    drawLatBlob(5.0, 0.5, 0.8, 0.18, "#5b9066");
  });
}

function drawBackRoads() {
  drawRoundRoad(false);
}

function drawFrontRoads() {
  drawRoundRoad(true);
  zones.forEach((zone) => {
    drawRoadBranch(zone.angle, 0.48, zone.lat, true);
  });
}

function drawRoundRoad(front) {
  const points = [];
  for (let i = 0; i <= 150; i += 1) {
    const angle = state.cameraAngle - Math.PI + (i / 150) * TAU;
    const projected = project(angle, 0.49);
    if ((projected.depth >= 0) === front) {
      points.push(projected);
    } else if (points.length > 1) {
      strokeProjectedRoad(points, front);
      points.length = 0;
    }
  }
  if (points.length > 1) strokeProjectedRoad(points, front);
}

function drawRoadBranch(angle, fromLat, toLat, front) {
  const points = [];
  const steps = 16;
  for (let i = 0; i <= steps; i += 1) {
    const lat = fromLat + (toLat - fromLat) * (i / steps);
    const projected = project(angle, lat);
    if (projected.depth >= -0.05 || !front) points.push(projected);
  }
  if (points.length > 1) strokeProjectedRoad(points, true, 34);
}

function strokeProjectedRoad(points, front, width = 52) {
  ctx.save();
  ctx.globalAlpha = front ? 1 : 0.24;
  drawProjectedLine(points, width + 18, ink);
  drawProjectedLine(points, width, palette.roadShadow);
  drawProjectedLine(points, width * 0.78, palette.road);
  drawProjectedLine(points, 3, "rgba(255,249,236,0.65)");
  ctx.restore();
}

function drawProjectedLine(points, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
}

function drawZones() {
  zones.forEach((zone) => {
    const p = project(zone.angle, zone.lat + 0.1);
    if (p.depth < -0.18) return;
    const near = state.nearby?.id === zone.id;
    ctx.save();
    ctx.globalAlpha = near ? 0.92 : 0.55;
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = near ? 5 : 3;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 44 * p.scale, 13 * p.scale, 0, 0, TAU);
    ctx.stroke();
    if (near) {
      ctx.fillStyle = zone.color;
      ctx.globalAlpha = 0.17;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 74 * p.scale, 22 * p.scale, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawEntities() {
  props
    .map((prop) => ({ prop, p: project(prop.angle, prop.lat) }))
    .filter((item) => item.p.depth > -0.18)
    .sort((a, b) => a.p.y - b.p.y)
    .forEach((item) => drawProp(item.prop, item.p));
}

function drawProp(prop, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.scale * OBJECT_SCALE, p.scale * OBJECT_SCALE);
  ctx.globalAlpha = clamp(0.4 + p.depth * 0.7, 0.2, 1);
  if (prop.type === "court") drawCourt();
  if (prop.type === "apartment") drawApartment();
  if (prop.type === "market") drawMarket();
  if (prop.type === "pole") drawPole();
  if (prop.type === "palm") drawPalm();
  if (prop.type === "arenaLA") drawArenaLA();
  if (prop.type === "plazaBanner") drawBanner(prop.color, prop.label);
  if (prop.type === "streetlight") drawStreetlight();
  if (prop.type === "studio") drawStudio();
  if (prop.type === "campus") drawCampus();
  if (prop.type === "jacaranda") drawJacaranda();
  if (prop.type === "uclaCourt") drawSmallCourt();
  if (prop.type === "bridge") drawBridge();
  if (prop.type === "arenaOak") drawArenaOak();
  if (prop.type === "transit") drawTransit();
  if (prop.type === "tower") drawTower();
  if (prop.type === "rooftop") drawRooftop();
  if (prop.type === "screen") drawScreen();
  if (prop.type === "tree") drawTree();
  if (prop.type === "ball") drawBall(0, 0, 15);
  if (prop.type === "shoes") drawShoes();
  if (prop.type === "ticket") drawTicket();
  if (prop.type === "briefcase") drawBriefcase();
  ctx.restore();
}

function drawPlayer() {
  const p = project(state.player.angle, state.player.lat);
  const stride = state.moving ? Math.sin(state.walkPhase) : 0;
  const bob = state.moving ? -Math.abs(stride) * 5 : Math.sin(performance.now() * 0.002) * 1.2;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  const size = clamp(p.scale * PLAYER_SCALE, 0.56, 0.82);
  ctx.scale(size, size);
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 20, 34, 11, 0, 0, TAU);
  ctx.fill();
  drawLeg(-12, 12, stride * 0.23);
  drawLeg(12, 12, -stride * 0.23);
  drawArm(-28, -54, -stride * 0.15);
  drawArm(28, -54, stride * 0.15);
  roughRect(-28, -80, 56, 74, "#fff9ec", ink, 3);
  roughRect(-25, -70, 50, 58, palette.blue, ink, 3);
  drawBackpack(0, -52);
  drawHead(0, -118);
  drawBall(-28, -40, 8);
  ctx.restore();
}

function drawLeg(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  roughRect(-8, 0, 16, 42, "#613e49", ink, 3);
  roughRect(-12, 36, 24, 15, palette.gold, ink, 3);
  ctx.restore();
}

function drawArm(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  roughLine(0, 0, 0, 48, "#e0b8af", 10, ink, 3);
  ctx.restore();
}

function drawHead(x, y) {
  ctx.save();
  ctx.translate(x, y);
  roughBlob([[-20, -8], [-16, -25], [0, -34], [21, -25], [24, -6], [12, 13], [-10, 13]], "#dbaca4", ink, 3);
  roughBlob([[-29, -18], [-18, -40], [2, -48], [27, -31], [31, -7], [17, 4], [4, -8], [-12, 4], [-29, -5]], "#263236", ink, 3);
  ctx.restore();
}

function drawBackpack(x, y) {
  ctx.save();
  ctx.translate(x, y);
  roughRect(-21, -24, 42, 56, "#20292d", ink, 3);
  roughRect(-10, -3, 20, 18, "#303c40", ink, 2);
  roughLine(-22, -18, -29, 24, palette.cream, 5, ink, 2);
  roughLine(22, -18, 29, 24, palette.cream, 5, ink, 2);
  ctx.restore();
}

function drawCourt() {
  roughRect(-120, -58, 240, 116, palette.blue, ink, 3);
  ctx.strokeStyle = palette.cream;
  ctx.lineWidth = 4;
  ctx.strokeRect(-95, -42, 190, 84);
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, TAU);
  ctx.stroke();
  drawHoop(58, -56);
}

function drawSmallCourt() {
  roughRect(-95, -44, 190, 88, palette.blue, ink, 3);
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(-74, -30, 148, 60);
}

function drawApartment() {
  roughRect(-95, -190, 190, 190, palette.building, ink, 3);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      roughRect(-70 + col * 55, -168 + row * 52, 30, 26, "#71807c", ink, 2);
    }
  }
}

function drawMarket() {
  roughRect(-92, -128, 184, 128, "#c1b49c", ink, 3);
  drawAwning(-78, -92, 156, 28, palette.blue);
  roughRect(-62, -62, 48, 62, "#6f8f92", ink, 2);
  roughRect(12, -58, 58, 40, "#9ecbca", ink, 2);
}

function drawPole() {
  roughLine(0, 20, 0, -220, "#606c6b", 11, ink, 3);
  roughLine(-58, -195, 58, -205, "#606c6b", 8, ink, 2);
  for (let i = 0; i < 3; i += 1) roughLine(-180, -186 + i * 13, 170, -202 + i * 13, ink, 2);
}

function drawPalm() {
  roughLine(0, 10, 20, -135, "#806f50", 17, ink, 3);
  for (let i = 0; i < 8; i += 1) {
    const a = i / 8 * TAU;
    roughLine(20, -135, 20 + Math.cos(a) * 76, -135 + Math.sin(a) * 32, palette.grassDark, 13, ink, 2);
  }
}

function drawArenaLA() {
  roughBlob([[-150, -10], [-118, -120], [118, -120], [160, -8], [132, 52], [-130, 52]], "#a6abad", ink, 4);
  roughRect(-108, -22, 216, 46, "#d8ddd0", ink, 2);
  roughLine(-90, -83, 92, -84, palette.red, 7, ink, 2);
}

function drawArenaOak() {
  roughBlob([[-150, -8], [-118, -122], [118, -122], [156, -8], [126, 52], [-132, 52]], "#8f9899", ink, 4);
  roughLine(-96, -82, 98, -82, palette.gold, 8, ink, 2);
  roughRect(-54, -22, 108, 46, "#c5cbbf", ink, 2);
}

function drawStudio() {
  roughRect(-90, -136, 180, 136, "#c9cfbf", ink, 3);
  roughRect(-66, -106, 64, 68, "#a9d4c5", ink, 2);
  roughRect(18, -100, 54, 54, "#98c5c4", ink, 2);
  roughLine(-62, -20, -14, -66, palette.gold, 7, ink, 2);
  roughLine(-58, -62, -10, -22, palette.blue, 7, ink, 2);
}

function drawCampus() {
  roughRect(-104, -150, 208, 150, "#b98567", ink, 3);
  for (let i = 0; i < 3; i += 1) roughRect(-72 + i * 62, -112, 34, 70, "#7a6d5a", ink, 2);
  roughBlob([[-32, -150], [-22, -220], [0, -250], [24, -220], [34, -150]], "#ad755d", ink, 3);
}

function drawBridge() {
  roughLine(-150, 0, 150, 0, "#707b7d", 18, ink, 4);
  for (let i = 0; i < 4; i += 1) {
    const x = -130 + i * 85;
    roughLine(x, 0, x + 32, -110, ink, 3);
    roughLine(x + 32, -110, x + 68, 0, ink, 3);
  }
}

function drawTransit() {
  roughRect(-132, -38, 264, 76, "#8c9695", ink, 3);
  for (let i = 0; i < 4; i += 1) roughRect(-98 + i * 56, -16, 34, 28, "#bde7dc", ink, 2);
  roughLine(-110, 25, 110, 25, palette.gold, 4, ink, 1);
}

function drawTower() {
  roughRect(-82, -310, 164, 310, "#48636a", ink, 4);
  roughRect(-50, -270, 100, 230, "#6f999d", ink, 2);
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      ctx.fillStyle = row % 2 ? "#f4d37b" : "#9ecbca";
      ctx.fillRect(-35 + col * 48, -240 + row * 36, 24, 14);
    }
  }
}

function drawRooftop() {
  roughRect(-110, -42, 220, 84, palette.blue, ink, 3);
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(-86, -27, 172, 54);
}

function drawScreen() {
  roughRect(-48, -70, 96, 70, "#314347", ink, 3);
  ctx.fillStyle = palette.teal;
  ctx.fillRect(-30, -52, 60, 10);
  ctx.fillStyle = palette.gold;
  ctx.fillRect(-30, -30, 38, 9);
}

function drawBanner(color, label) {
  roughLine(0, 24, 0, -108, ink, 5);
  roughRect(6, -104, 58, 78, color, ink, 3);
  ctx.fillStyle = palette.cream;
  ctx.font = "900 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 35, -65, 50);
}

function drawStreetlight() {
  roughLine(0, 12, 0, -150, ink, 7);
  roughLine(0, -150, 52, -132, ink, 5);
  drawBall(58, -128, 7, palette.gold);
}

function drawJacaranda() {
  roughLine(0, 14, 0, -90, "#575447", 21, ink, 3);
  drawLeaf(-38, -112, 62, "#8d78b5");
  drawLeaf(28, -124, 70, "#9a83c5");
  drawLeaf(0, -86, 58, "#7d6da6");
}

function drawTree() {
  roughLine(0, 14, 0, -82, "#575447", 21, ink, 3);
  drawLeaf(-34, -104, 62, palette.grass);
  drawLeaf(30, -116, 70, "#5a9e72");
  drawLeaf(0, -78, 60, "#4b8b62");
}

function drawLeaf(x, y, r, fill) {
  roughBlob([[x - r * 0.78, y], [x - r * 0.36, y - r * 0.55], [x + r * 0.24, y - r * 0.66], [x + r * 0.78, y - r * 0.12], [x + r * 0.5, y + r * 0.45], [x, y + r * 0.58], [x - r * 0.58, y + r * 0.34]], fill, ink, 3);
}

function drawBall(x, y, r, fill = "#c77534") {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y + r);
  ctx.stroke();
  ctx.restore();
}

function drawShoes() {
  roughRect(-28, -9, 44, 18, palette.cream, ink, 2);
  roughRect(8, -2, 44, 18, palette.cream, ink, 2);
  ctx.fillStyle = palette.blue;
  ctx.fillRect(-18, -2, 16, 5);
  ctx.fillRect(18, 4, 16, 5);
}

function drawTicket() {
  roughRect(-34, -13, 68, 26, "#d7dccd", ink, 2);
  roughLine(-18, -8, 22, 7, palette.gold, 4);
}

function drawBriefcase() {
  roughRect(-26, -16, 52, 32, "#4d3e35", ink, 3);
  roughRect(-11, -26, 22, 12, "#4d3e35", ink, 2);
}

function drawHoop(x, y) {
  roughLine(x, y + 66, x, y, ink, 5);
  roughRect(x - 34, y - 24, 68, 44, palette.cream, ink, 3);
  ctx.strokeStyle = palette.red;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 20, 8, 0, 0, TAU);
  ctx.stroke();
}

function drawAwning(x, y, w, h, color) {
  roughRect(x, y, w, h, color, ink, 2);
  ctx.fillStyle = palette.cream;
  for (let i = 0; i < 5; i += 1) ctx.fillRect(x + i * (w / 5), y, w / 10, h);
}

function drawLatBlob(angle, lat, width, height, fill) {
  const center = project(angle, lat);
  if (center.depth < -0.25) return;
  ctx.save();
  ctx.globalAlpha = clamp(0.42 + center.depth * 0.5, 0.2, 0.95);
  ctx.translate(center.x, center.y);
  ctx.scale(center.scale, center.scale * 0.65);
  roughBlob([[-planet.r * width * 0.24, -planet.r * height * 0.2], [-planet.r * width * 0.05, -planet.r * height * 0.5], [planet.r * width * 0.25, -planet.r * height * 0.32], [planet.r * width * 0.32, planet.r * height * 0.1], [planet.r * width * 0.02, planet.r * height * 0.5], [-planet.r * width * 0.3, planet.r * height * 0.26]], fill, "rgba(38,50,54,0.34)", 2);
  ctx.restore();
}

function drawCloudSlash(x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.15);
  roughBlob([[-w / 2, 0], [-w * 0.18, -h], [w * 0.3, -h * 0.62], [w / 2, 0], [w * 0.14, h], [-w * 0.34, h * 0.54]], palette.cloud, "rgba(38,50,54,0.12)", 1);
  ctx.restore();
}

function drawAtmosphere() {
  ctx.save();
  ctx.translate(planet.x, planet.y);
  const shine = ctx.createRadialGradient(-planet.r * 0.4, -planet.r * 0.44, 0, -planet.r * 0.4, -planet.r * 0.44, planet.r * 0.9);
  shine.addColorStop(0, "rgba(255,249,236,0.34)");
  shine.addColorStop(1, "rgba(255,249,236,0)");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(0, 0, planet.r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(
    viewport.width * 0.5,
    viewport.height * 0.42,
    viewport.height * 0.2,
    viewport.width * 0.5,
    viewport.height * 0.55,
    viewport.height * 0.86
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(9,22,26,0.18)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function clipPlanet(draw) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(planet.x, planet.y, planet.r, 0, TAU);
  ctx.clip();
  draw();
  ctx.restore();
}

function project(angle, lat) {
  let d = angleDelta(state.cameraAngle, angle);
  const depth = Math.cos(d);
  const x = planet.x + Math.sin(d) * planet.r * 0.82;
  const y = planet.y + lat * planet.r * 0.74 + depth * planet.r * 0.1;
  const scale = 0.5 + clamp((depth + 1) / 2, 0, 1) * 0.62;
  return { x, y, depth, scale, d };
}

function screenToWorld(x, y) {
  const dx = (x - planet.x) / (planet.r * 0.82);
  const dy = y - planet.y;
  const circleDistance = Math.hypot(x - planet.x, y - planet.y);
  if (circleDistance > planet.r * 1.18 || Math.abs(dx) > 1.08) return null;
  const local = Math.asin(clamp(dx, -1, 1));
  const depth = Math.cos(local);
  const lat = clamp((dy - depth * planet.r * 0.1) / (planet.r * 0.74), 0.02, 0.72);
  return { angle: wrapAngle(state.cameraAngle + local), lat };
}

function roughRect(x, y, w, h, fill, stroke = ink, lineWidth = 2) {
  roughBlob([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, stroke, lineWidth);
}

function roughBlob(points, fill, stroke = ink, lineWidth = 2) {
  ctx.save();
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const jx = x + jitter(x, y, index) * 3;
    const jy = y + jitter(y, x, index + 9) * 3;
    if (index === 0) ctx.moveTo(jx, jy);
    else ctx.lineTo(jx, jy);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke && lineWidth) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  ctx.restore();
}

function roughLine(x1, y1, x2, y2, color, width, outline, outlineWidth = 0) {
  if (outline && outlineWidth) {
    linePath(x1, y1, x2, y2, outline, width + outlineWidth * 2);
  }
  linePath(x1, y1, x2, y2, color, width);
}

function linePath(x1, y1, x2, y2, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const steps = 5;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    ctx.lineTo(x1 + (x2 - x1) * t + jitter(x1 + x2, y1 + y2, i) * 2, y1 + (y2 - y1) * t + jitter(y1 + y2, x1 + x2, i) * 2);
  }
  ctx.stroke();
  ctx.restore();
}

function jitter(a, b, c) {
  const n = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return (n - Math.floor(n)) - 0.5;
}

function angleDelta(from, to) {
  let delta = wrapAngle(to - from);
  if (delta > Math.PI) delta -= TAU;
  return delta;
}

function wrapAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
