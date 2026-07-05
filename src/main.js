import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { LANDMARKS, FINALE_LINE, SPONSOR_NOTE } from './data.js';
import { buildIsland, terrainHeight } from './island.js';
import { buildLandmarks } from './landmarks.js';
import { Flight } from './flight.js';
import { startMinigame } from './minigames.js';
import * as AUDIO from './audio.js';

// ---------- renderer / scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const effect = new OutlineEffect(renderer, {
  defaultThickness: 0.0025,
  defaultColor: [0.13, 0.15, 0.19],
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 2400);
scene.fog = new THREE.Fog(0xf2e3cf, 550, 1900);

// sky dome
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: {
    top: { value: new THREE.Color(0x3d9fe6) },
    horizon: { value: new THREE.Color(0xffe4bd) },
  },
  vertexShader: `
    varying vec3 vPos;
    void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform vec3 top; uniform vec3 horizon;
    varying vec3 vPos;
    void main() {
      float h = normalize(vPos).y * 0.5 + 0.5;
      vec3 c = mix(horizon, top, smoothstep(0.47, 0.72, h));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }
  `,
});
skyMat.userData.outlineParameters = { visible: false };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1600, 24, 16), skyMat);
scene.add(sky);

// lights — warm Wii-afternoon sun; shadow frustum follows the plane
scene.add(new THREE.HemisphereLight(0xcfe6f5, 0xe8cf9a, 0.95));
const sun = new THREE.DirectionalLight(0xffe3b0, 1.9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -110; sc.right = 110; sc.top = 110; sc.bottom = -110;
sc.near = 20; sc.far = 500;
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.8;
const sunDir = new THREE.Vector3(0.55, 0.62, 0.38).normalize();
const sunTarget = new THREE.Object3D();
scene.add(sunTarget);
sun.target = sunTarget;
scene.add(sun);

const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedb2, fog: false });
sunMat.userData.outlineParameters = { visible: false };
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(95, 32), sunMat);
sunDisc.position.copy(sunDir).multiplyScalar(1400);
sunDisc.lookAt(0, 0, 0);
scene.add(sunDisc);

// ---------- world ----------
const island = buildIsland(scene);
const marks = buildLandmarks(scene, island.roadCurve);
const flight = new Flight(scene);

// ---------- app state ----------
let mode = 'intro'; // intro | fly | moment
let introT = 0;
const INTRO_LEN = 9.5;
let focused = null;           // landmark record while circling
let idleTimer = 99;           // starts on autopilot
let currentGameCleanup = null;
let shownLowerThird = null;
let tourIdx = 0;

const unlocked = new Set(JSON.parse(localStorage.getItem('baronisland-stars') || '[]'));
let balloonsPopped = Number(localStorage.getItem('baronisland-balloons') || 0);
let finaleShown = localStorage.getItem('baronisland-finale') === '1';

// ---------- dom ----------
const $ = (id) => document.getElementById(id);
const titleOverlay = $('title-overlay');
const lowerThird = $('lower-third');
const hud = $('hud');
const starsEl = $('stars');
const balloonEl = $('balloon-count');
const tourChip = $('tour-chip');
const labelsRoot = $('labels');
const card = $('moment-card');
const mg = $('minigame');
const storyCard = $('story-card');
const finaleEl = $('finale');

const cafeLabel = (() => {
  const e = document.createElement('div');
  e.className = 'district-label ambient';
  e.innerHTML = '♪ Radio Café';
  labelsRoot.appendChild(e);
  return e;
})();

const labelEls = marks.landmarks.map(L => {
  const e = document.createElement('div');
  e.className = 'district-label';
  e.innerHTML = L.def.name;
  labelsRoot.appendChild(e);
  return e;
});

function renderCounters() {
  starsEl.innerHTML = LANDMARKS
    .map(d => `<span class="${unlocked.has(d.id) ? 'on' : 'off'}">★</span>`)
    .join('');
  balloonEl.textContent = `🎈 ${balloonsPopped}`;
  labelEls.forEach((e, i) => {
    const L = marks.landmarks[i];
    e.innerHTML = L.def.name + (unlocked.has(L.def.id) ? '<span class="star-mini">★</span>' : '');
  });
}
renderCounters();
if (window.innerWidth < 640 || 'ontouchstart' in window) {
  $('hint').textContent = 'drag to steer · fly through a gold ring';
}

// ---------- flight input ----------
const keys = new Set();
let pointerSteer = null; // {startX, startY, x, y}

function anyManualInput() {
  return pointerSteer !== null ||
    ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some(k => keys.has(k));
}

function computeSteer() {
  const s = { x: 0, y: 0, boost: keys.has('Space') || keys.has('ShiftLeft') || keys.has('ShiftRight') };
  if (keys.has('KeyA') || keys.has('ArrowLeft')) s.x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) s.x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) s.y -= 1;   // inverted: up = dive
  if (keys.has('KeyS') || keys.has('ArrowDown')) s.y += 1; // down = climb
  if (pointerSteer) {
    s.x += THREE.MathUtils.clamp(pointerSteer.x / (window.innerWidth * 0.22), -1, 1);
    s.y += THREE.MathUtils.clamp(pointerSteer.y / (window.innerHeight * 0.22), -1, 1);
    s.x = THREE.MathUtils.clamp(s.x, -1, 1);
    s.y = THREE.MathUtils.clamp(s.y, -1, 1);
  }
  return s;
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') e.preventDefault();
  keys.add(e.code);
  if (mode === 'intro' && (e.code === 'Space' || e.code === 'Enter')) endIntro();
  if (e.code === 'Escape') {
    if (!mg.classList.contains('hidden')) { closeMinigame(); if (focused) showMomentCard(focused); }
    else if (!storyCard.classList.contains('hidden')) { storyCard.classList.add('hidden'); resumeFlight(); }
    else if (mode === 'moment') resumeFlight();
  }
  AUDIO.initAudio();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

canvas.addEventListener('pointerdown', (e) => {
  AUDIO.initAudio();
  if (mode === 'intro') { endIntro(); return; }
  pointerSteer = { startX: e.clientX, startY: e.clientY, x: 0, y: 0 };
  try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (pointerSteer) {
    pointerSteer.x = e.clientX - pointerSteer.startX;
    pointerSteer.y = e.clientY - pointerSteer.startY;
  }
});
function releaseSteer() { pointerSteer = null; }
canvas.addEventListener('pointerup', releaseSteer);
canvas.addEventListener('pointercancel', releaseSteer);

// ---------- intro ----------
function endIntro() {
  if (mode !== 'intro') return;
  mode = 'fly';
  titleOverlay.classList.add('fading');
  setTimeout(() => titleOverlay.classList.add('hidden'), 1300);
  hud.classList.remove('hidden');
  flight.autopilot = true;
  aimTourTarget();
}

$('skip-intro').addEventListener('click', () => { AUDIO.initAudio(); endIntro(); });

// ---------- tour autopilot ----------
function nextTourLandmark() {
  // prefer unvisited moments, otherwise loop all
  const pending = marks.landmarks.filter(L => !unlocked.has(L.def.id));
  const list = pending.length ? pending : marks.landmarks;
  tourIdx = (tourIdx + 1) % list.length;
  return list[tourIdx];
}
let tourTarget = null;
function aimTourTarget() {
  tourTarget = nextTourLandmark();
  flight.apOrbit = null;
  flight.apTarget = tourTarget.center.clone();
}

// ---------- moment flow ----------
function enterMoment(L) {
  if (mode === 'moment') return;
  mode = 'moment';
  focused = L;
  AUDIO.ringChime();
  tourChip.classList.add('hidden');
  flight.autopilot = true;
  flight.apOrbit = { center: new THREE.Vector3(L.def.x, 0, L.def.z), radius: 46, height: L.def.ground + 22 };
  showMomentCard(L);
  setLowerThird(null);
}

function resumeFlight() {
  mode = 'fly';
  focused = null;
  card.classList.add('hidden');
  flight.apOrbit = null;
  if (flight.autopilot) aimTourTarget();
  idleTimer = 0;
}

function showMomentCard(L) {
  const d = L.def;
  card.querySelector('.dc-chip').textContent = d.chip + ' — ' + d.short;
  card.querySelector('.dc-chip').style.background = '#' + d.color.toString(16).padStart(6, '0');
  card.querySelector('.dc-name').textContent = d.name;
  card.querySelector('.dc-era').textContent = d.era;
  card.querySelector('.dc-feel').textContent = d.feel;
  card.querySelector('.dc-sponsor-tag').textContent = 'PRESENTED BY ' + d.sponsor.name;
  card.querySelector('.dc-sponsor-tag').style.background = d.sponsor.color;
  card.querySelector('.dc-sponsor-note').textContent = SPONSOR_NOTE;
  const btn = $('play-mission');
  btn.textContent = (unlocked.has(d.id) ? 'Play again: ' : 'Play: ') + d.missionName;
  card.querySelector('.dc-done').classList.toggle('hidden', !unlocked.has(d.id));
  card.classList.remove('hidden');
}

function openMinigame(L) {
  const d = L.def;
  card.classList.add('hidden');
  $('mg-title').textContent = d.missionName;
  $('mg-sponsor').textContent = 'presented by ' + d.sponsor.name;
  $('mg-goal').textContent = d.goal;
  mg.classList.remove('hidden');
  currentGameCleanup = startMinigame(d.minigame, $('mg-body'), () => {
    closeMinigame();
    unlock(L);
  });
}

function closeMinigame() {
  if (currentGameCleanup) { currentGameCleanup(); currentGameCleanup = null; }
  mg.classList.add('hidden');
}

function unlock(L) {
  const d = L.def;
  const first = !unlocked.has(d.id);
  unlocked.add(d.id);
  localStorage.setItem('baronisland-stars', JSON.stringify([...unlocked]));
  renderCounters();
  AUDIO.winFanfare();
  storyCard.querySelector('.sc-zone').textContent = d.name + ' — ' + d.short;
  storyCard.querySelector('.sc-prompt').textContent = '“' + d.storyPrompt + '”';
  storyCard.classList.remove('hidden');
  storyCard.dataset.finaleNext = (first && unlocked.size === LANDMARKS.length && !finaleShown) ? '1' : '';
}

$('sc-continue').addEventListener('click', () => {
  storyCard.classList.add('hidden');
  if (storyCard.dataset.finaleNext === '1') {
    finaleShown = true;
    localStorage.setItem('baronisland-finale', '1');
    finaleEl.querySelector('.sc-prompt').textContent = FINALE_LINE;
    finaleEl.classList.remove('hidden');
  } else {
    resumeFlight();
  }
});
$('fin-continue').addEventListener('click', () => { finaleEl.classList.add('hidden'); resumeFlight(); });
$('card-close').addEventListener('click', resumeFlight);
$('play-mission').addEventListener('click', () => focused && openMinigame(focused));
$('mg-quit').addEventListener('click', () => { closeMinigame(); if (focused) showMomentCard(focused); });
$('mute-btn').addEventListener('click', () => {
  AUDIO.initAudio();
  $('mute-btn').textContent = AUDIO.toggleMute() ? '♪̶' : '♪';
});

// ---------- lower third ----------
function setLowerThird(L) {
  if (L === shownLowerThird) return;
  shownLowerThird = L;
  if (!L) { lowerThird.classList.add('hidden'); return; }
  const d = L.def;
  lowerThird.querySelector('.lt-name').textContent = d.name;
  lowerThird.querySelector('.lt-era').textContent = d.short + ' · ' + d.era;
  lowerThird.querySelector('.lt-accent').style.background = '#' + d.color.toString(16).padStart(6, '0');
  lowerThird.classList.remove('hidden');
  lowerThird.style.animation = 'none';
  void lowerThird.offsetWidth;
  lowerThird.style.animation = '';
}

// ---------- labels projection ----------
const projTmp = new THREE.Vector3();
function updateLabels() {
  const overlayOpen = mode === 'intro' || !mg.classList.contains('hidden') ||
    !storyCard.classList.contains('hidden') || !finaleEl.classList.contains('hidden');
  marks.landmarks.forEach((L, i) => {
    const e = labelEls[i];
    if (overlayOpen) { e.style.opacity = '0'; return; }
    projTmp.copy(L.center);
    projTmp.y += 8;
    const dist = projTmp.distanceTo(camera.position);
    projTmp.project(camera);
    if (projTmp.z > 1 || dist > 420 || Math.abs(projTmp.x) > 1.1) { e.style.opacity = '0'; return; }
    e.style.opacity = dist < 70 ? '0' : '1';
    e.style.left = ((projTmp.x + 1) / 2 * window.innerWidth) + 'px';
    e.style.top = ((-projTmp.y + 1) / 2 * window.innerHeight) + 'px';
  });
}

// café label projection + drift-by melody
const cafePos = new THREE.Vector3(island.palmCourt.x, island.palmCourt.ground + 9, island.palmCourt.z);
let lastMelody = -30;
function updateCafe() {
  const overlayOpen = mode === 'intro' || !mg.classList.contains('hidden') ||
    !storyCard.classList.contains('hidden') || !finaleEl.classList.contains('hidden');
  projTmp.copy(cafePos);
  const dist = projTmp.distanceTo(camera.position);
  projTmp.project(camera);
  if (overlayOpen || projTmp.z > 1 || dist > 260 || Math.abs(projTmp.x) > 1.1) {
    cafeLabel.style.opacity = '0';
  } else {
    cafeLabel.style.opacity = dist < 40 ? '0' : '0.92';
    cafeLabel.style.left = ((projTmp.x + 1) / 2 * window.innerWidth) + 'px';
    cafeLabel.style.top = ((-projTmp.y + 1) / 2 * window.innerHeight) + 'px';
  }
  if (mode !== 'intro' && flight.pos.distanceTo(cafePos) < 60 && elapsed - lastMelody > 14) {
    lastMelody = elapsed;
    AUDIO.cafeMelody();
  }
}

// ---------- pickups ----------
const _d = new THREE.Vector3();
function checkPickups(t) {
  // rings
  if (mode === 'fly') {
    for (const L of marks.landmarks) {
      _d.copy(flight.pos).sub(L.ring.position);
      // distance to ring plane (ring faces its local z after rotY)
      const planeN = new THREE.Vector3(Math.sin(L.ring.rotation.y), 0, Math.cos(L.ring.rotation.y));
      const dPlane = Math.abs(_d.dot(planeN));
      const dRadial = Math.sqrt(Math.max(0, _d.lengthSq() - dPlane * dPlane));
      if (dPlane < 5 && dRadial < 9) { enterMoment(L); return; }
      // near-miss also counts if very close to center
      if (_d.length() < 9) { enterMoment(L); return; }
    }
  }
  // balloons
  for (const b of marks.balloons) {
    if (b.popped || !b.obj.visible) continue;
    if (b.obj.position.distanceToSquared(flight.pos) < 42) {
      b.popped = true;
      b.poppedAt = t;
      balloonsPopped++;
      localStorage.setItem('baronisland-balloons', String(balloonsPopped));
      renderCounters();
      AUDIO.balloonPop();
    }
  }
}

// ---------- chase camera ----------
const camPos = new THREE.Vector3(0, 160, -430);
const camLook = new THREE.Vector3();
const _fwd = new THREE.Vector3();
function updateCamera(dt) {
  flight.forward(_fwd);
  let desired, look;
  if (mode === 'intro') {
    // wide establishing arc that hands off to the chase cam
    const k = Math.min(1, introT / INTRO_LEN);
    const a = -0.9 + k * 1.6;
    desired = new THREE.Vector3(Math.sin(a) * 330 * (1 - k * 0.55), 150 - k * 100, Math.cos(a) * -330 * (1 - k * 0.4));
    look = new THREE.Vector3(0, 20, 0).lerp(flight.pos, k * 0.9);
  } else {
    desired = flight.pos.clone().addScaledVector(_fwd, -16).add(new THREE.Vector3(0, 6.2, 0));
    look = flight.pos.clone().addScaledVector(_fwd, 18);
    if (mode === 'moment') {
      desired = flight.pos.clone().addScaledVector(_fwd, -22).add(new THREE.Vector3(0, 9, 0));
      look = new THREE.Vector3(focused.def.x, focused.def.ground + 8, focused.def.z).lerp(flight.pos, 0.25);
    }
  }
  // keep camera above terrain
  const floor = terrainHeight(desired.x, desired.z) + 3;
  if (desired.y < floor) desired.y = floor;
  const stiff = mode === 'intro' ? 1.2 : 3.4;
  camPos.lerp(desired, Math.min(1, stiff * dt));
  camLook.lerp(look, Math.min(1, 5 * dt));
  camera.position.copy(camPos);
  camera.up.set(0, 1, 0);
  camera.lookAt(camLook);
  // subtle roll with the plane + boost FOV
  camera.rotateZ(flight.roll * 0.22);
  const targetFov = (flight.speed > 36 ? 62 : 55);
  camera.fov += (targetFov - camera.fov) * Math.min(1, 3 * dt);
  camera.updateProjectionMatrix();
}

// ---------- main loop ----------
const clock = new THREE.Clock();
let elapsed = 0;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  frameBody(dt);
  requestAnimationFrame(frame);
}

function frameBody(dt) {
  elapsed += dt;

  if (mode === 'intro') {
    introT += dt;
    flight.autopilot = true;
    flight.apTarget = new THREE.Vector3(60, 34, 40);
    if (introT >= INTRO_LEN) endIntro();
  } else if (mode === 'fly') {
    const manual = anyManualInput();
    if (manual) {
      flight.autopilot = false;
      idleTimer = 0;
      tourChip.classList.add('hidden');
    } else {
      idleTimer += dt;
      if (idleTimer > 10 && !flight.autopilot) {
        flight.autopilot = true;
        aimTourTarget();
      }
    }
    if (!flight.autopilot) flight.steer = computeSteer();
    tourChip.classList.toggle('hidden', !(flight.autopilot && mode === 'fly'));
    // reached tour target -> pick the next one. Pending rings are entered via the
    // ring pickup itself, so only skip ahead once we're basically on top of it
    // (or it's an already-unlocked stop on the scenic loop).
    if (flight.autopilot && tourTarget) {
      const arriveDist = unlocked.has(tourTarget.def.id) ? 26 : 9;
      if (flight.pos.distanceTo(tourTarget.center) < arriveDist) aimTourTarget();
    }
    // approach callouts
    let near = null;
    for (const L of marks.landmarks) {
      if (flight.pos.distanceTo(L.center) < 110) { near = L; break; }
    }
    setLowerThird(near);
  }

  flight.update(dt, elapsed);
  island.update(elapsed, dt, camera.position);
  marks.update(elapsed, dt);
  checkPickups(elapsed);

  // sun shadow frustum follows the plane
  sunTarget.position.copy(flight.pos).setY(0);
  sun.position.copy(sunTarget.position).addScaledVector(sunDir, 260);

  AUDIO.setWind(Math.min(1, (flight.speed - 20) / 30));

  updateCamera(dt);
  updateLabels();
  updateCafe();
  effect.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

frame();

// debug/testing hooks
window.baronWorld = {
  skipIntro: endIntro,
  state: () => ({ mode, pos: flight.pos.toArray().map(v => Math.round(v)), autopilot: flight.autopilot, unlocked: [...unlocked], balloons: balloonsPopped }),
  flyTo: (id) => {
    endIntro();
    const L = marks.landmarks.find(l => l.def.id === id);
    if (!L) return;
    flight.pos.set(L.def.x - 60, L.def.ground + 24, L.def.z + 40);
    flight.yaw = Math.atan2(L.def.x - flight.pos.x, -(L.def.z - flight.pos.z));
    flight.autopilot = true;
    flight.apOrbit = null;
    flight.apTarget = L.center.clone();
  },
  hitRing: (id) => {
    endIntro();
    const L = marks.landmarks.find(l => l.def.id === id);
    if (L) enterMoment(L);
  },
  tick: (seconds) => {
    const steps = Math.round(seconds * 60);
    for (let i = 0; i < steps; i++) frameBody(1 / 60);
  },
  reset: () => { localStorage.clear(); location.reload(); },
  _scene: scene, _marks: marks, _flight: flight, _keys: keys,
};
