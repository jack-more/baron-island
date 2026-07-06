import * as THREE from 'three';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';
import { LANDMARKS, FINALE_LINE, SPONSOR_NOTE, PRIZES, RAFFLE_NOTE, TICKETS_PER_WIN, TICKETS_PER_REPLAY, TICKETS_PER_BALLOON } from './data.js';
import { buildIsland, surfaceRadiusAt, heightField, PLANET_R, ANCHORS, tangentFrame } from './island.js';
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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 2400);

const composer = new EffectComposer(renderer);
scene.fog = new THREE.Fog(0xfae4cb, 120, 430); // near/far adapt to camera altitude each frame

// sky dome
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: {
    top: { value: new THREE.Color(0x8ec3ec) },
    horizon: { value: new THREE.Color(0xfae4cb) },
    upDir: { value: new THREE.Vector3(0, 1, 0) },
  },
  vertexShader: `
    varying vec3 vPos;
    void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform vec3 top; uniform vec3 horizon; uniform vec3 upDir;
    varying vec3 vPos;
    void main() {
      float h = dot(normalize(vPos), upDir) * 0.5 + 0.5;
      vec3 c = mix(horizon, top, smoothstep(0.495, 0.66, h));
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
const sun = new THREE.DirectionalLight(0xffdfae, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 7;
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

// ---------- postprocessing: soft dream bloom ----------
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.28, 0.85, 0.78);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- app state ----------
let mode = 'intro'; // intro | fly | moment
let introT = 0;
const INTRO_LEN = 9.5;
let focused = null;           // landmark record while circling
let idleTimer = 99;           // starts on autopilot
let currentGameCleanup = null;
let shownLowerThird = null;
let tourIdx = 0;

const unlocked = new Set(JSON.parse(localStorage.getItem('oatmeal-stars') || '[]'));
let tickets = Number(localStorage.getItem('oatmeal-tickets') || 0);
const raffleEntries = new Set(JSON.parse(localStorage.getItem('oatmeal-entries') || '[]'));
let finaleShown = localStorage.getItem('oatmeal-finale') === '1';
function saveTickets() { localStorage.setItem('oatmeal-tickets', String(tickets)); }

// ---------- dom ----------
const $ = (id) => document.getElementById(id);
const titleOverlay = $('title-overlay');
const lowerThird = $('lower-third');
const hud = $('hud');
const starsEl = $('stars');
const ticketEl = $('ticket-count');
const tourChip = $('tour-chip');
const labelsRoot = $('labels');
const card = $('moment-card');
const mg = $('minigame');
const storyCard = $('story-card');
const finaleEl = $('finale');

const cafeLabel = (() => {
  const e = document.createElement('div');
  e.className = 'district-label ambient';
  e.innerHTML = '♪ Oatmeal Radio Café';
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
  ticketEl.textContent = `🎟 ${tickets}`;
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
    if (!pzModal.classList.contains('hidden')) { pzModal.classList.add('hidden'); }
    else if (!mg.classList.contains('hidden')) { closeMinigame(); if (focused) showMomentCard(focused); }
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
  flight.apOrbit = { anchor: L.anchor.clone(), radius: 42, height: L.def.ground + 18 };
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
  localStorage.setItem('oatmeal-stars', JSON.stringify([...unlocked]));
  const award = first ? TICKETS_PER_WIN : TICKETS_PER_REPLAY;
  tickets += award;
  saveTickets();
  renderCounters();
  AUDIO.winFanfare();
  storyCard.querySelector('.sc-label').textContent = `STORY UNLOCKED · +${award} 🎟`;
  storyCard.querySelector('.sc-zone').textContent = d.name + ' — ' + d.short;
  storyCard.querySelector('.sc-prompt').textContent = '“' + d.storyPrompt + '”';
  storyCard.classList.remove('hidden');
  storyCard.dataset.finaleNext = (first && unlocked.size === LANDMARKS.length && !finaleShown) ? '1' : '';
}

$('sc-continue').addEventListener('click', () => {
  storyCard.classList.add('hidden');
  if (storyCard.dataset.finaleNext === '1') {
    finaleShown = true;
    localStorage.setItem('oatmeal-finale', '1');
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
// ---------- raffle shelf ----------
const pzModal = $('prizes-modal');
function renderPrizes() {
  pzModal.querySelector('.pz-sub').textContent = `you have ${tickets} tickets`;
  pzModal.querySelector('.pz-note').textContent = RAFFLE_NOTE + ' · demo — entries are illustrative';
  const list = $('pz-list');
  list.innerHTML = '';
  for (const p of PRIZES) {
    const item = document.createElement('div');
    item.className = 'pz-item';
    const entered = raffleEntries.has(p.id);
    item.innerHTML = `
      <div class="pz-icon">${p.icon}</div>
      <div class="pz-info"><div class="pz-name">${p.name}</div><div class="pz-desc">${p.note}</div></div>
      <div class="pz-cost">${p.cost} 🎟</div>`;
    const btn = document.createElement('button');
    btn.className = 'pz-enter' + (entered ? ' entered' : '');
    btn.textContent = entered ? 'ENTERED ✓' : 'ENTER';
    btn.disabled = !entered && tickets < p.cost;
    btn.addEventListener('click', () => {
      if (raffleEntries.has(p.id) || tickets < p.cost) return;
      tickets -= p.cost;
      raffleEntries.add(p.id);
      localStorage.setItem('oatmeal-entries', JSON.stringify([...raffleEntries]));
      saveTickets();
      renderCounters();
      renderPrizes();
      AUDIO.winFanfare();
    });
    item.appendChild(btn);
    list.appendChild(item);
  }
}
function openPrizes() { renderPrizes(); pzModal.classList.remove('hidden'); }
$('prizes-btn').addEventListener('click', openPrizes);
$('ticket-count').addEventListener('click', openPrizes);
$('pz-close').addEventListener('click', () => pzModal.classList.add('hidden'));

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
const _camN = new THREE.Vector3();
function updateLabels() {
  const overlayOpen = mode === 'intro' || !storyCard.classList.contains('hidden') ||
    !finaleEl.classList.contains('hidden') || !pzModal.classList.contains('hidden');
  marks.landmarks.forEach((L, i) => {
    const e = labelEls[i];
    if (overlayOpen) { e.style.opacity = '0'; return; }
    projTmp.copy(L.center).addScaledVector(L.anchor, 8);
    const dist = projTmp.distanceTo(camera.position);
    const facing = L.anchor.dot(_camN.copy(camera.position).normalize());
    projTmp.project(camera);
    if (facing < 0.35 || projTmp.z > 1 || dist > 420 || Math.abs(projTmp.x) > 1.1) { e.style.opacity = '0'; return; }
    e.style.opacity = dist < 70 ? '0' : '1';
    e.style.left = ((projTmp.x + 1) / 2 * window.innerWidth) + 'px';
    e.style.top = ((-projTmp.y + 1) / 2 * window.innerHeight) + 'px';
  });
}

// café label projection + drift-by melody
const cafePos = island.palmCourt.pos.clone().addScaledVector(island.palmCourt.anchor, 6);
let lastMelody = -30;
function updateCafe() {
  const overlayOpen = mode === 'intro' || !storyCard.classList.contains('hidden') ||
    !finaleEl.classList.contains('hidden') || !pzModal.classList.contains('hidden');
  projTmp.copy(cafePos);
  const dist = projTmp.distanceTo(camera.position);
  const facingC = island.palmCourt.anchor.dot(_camN.copy(camera.position).normalize());
  projTmp.project(camera);
  if (overlayOpen || facingC < 0.35 || projTmp.z > 1 || dist > 260 || Math.abs(projTmp.x) > 1.1) {
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

// ---------- water FX: splash rings + pontoon wake ----------
const RING_POOL = 42;
const waterFx = [];
{
  const geo = new THREE.RingGeometry(0.7, 1.0, 22);
  for (let i = 0; i < RING_POOL; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide });
    mat.userData.outlineParameters = { visible: false };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    scene.add(mesh);
    waterFx.push({ mesh, t: 0, life: 0, grow: 1 });
  }
}
const _rd = new THREE.Vector3();
function spawnRing(worldPos, scale = 1, life = 0.8, grow = 6) {
  const fx = waterFx.find(f => f.life <= 0);
  if (!fx) return;
  _rd.copy(worldPos).normalize();
  fx.mesh.position.copy(_rd).multiplyScalar(PLANET_R + 1.3);
  fx.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _rd);
  fx.mesh.scale.setScalar(scale);
  fx.baseScale = scale;
  fx.t = 0; fx.life = life; fx.grow = grow;
  fx.mesh.visible = true;
}
let wakeTimer = 0;
const _wk = new THREE.Vector3();
function updateWaterFx(dt) {
  for (const fx of waterFx) {
    if (fx.life <= 0) continue;
    fx.t += dt;
    const k = fx.t / fx.life;
    if (k >= 1) { fx.life = 0; fx.mesh.visible = false; continue; }
    fx.mesh.scale.setScalar(fx.baseScale + fx.t * fx.grow);
    fx.mesh.material.opacity = 0.75 * (1 - k);
  }
  // pontoon wake while taxiing
  if (flight.landed && flight.speed > 3) {
    wakeTimer -= dt;
    if (wakeTimer <= 0) {
      wakeTimer = 0.09;
      flight.forward(_wk);
      const upW = flight.up(new THREE.Vector3());
      const side = new THREE.Vector3().crossVectors(upW, _wk);
      for (const d of [1, -1]) {
        spawnRing(flight.pos.clone().addScaledVector(side, 0.9 * d).addScaledVector(_wk, -1.2), 0.5, 0.55, 2.4);
      }
    }
  }
}

// ---------- toast ----------
const toastEl = $('toast');
let toastTimer = null;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.remove('hidden');
  toastEl.style.animation = 'none';
  void toastEl.offsetWidth;
  toastEl.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2600);
}

// ---------- landing events ----------
const hintEl = $('hint');
const defaultHint = hintEl.textContent;
function consumeFlightEvents() {
  for (const ev of flight.events) {
    if (ev === 'splash') {
      AUDIO.splash(true);
      for (let i = 0; i < 4; i++) spawnRing(flight.pos, 1 + i * 0.7, 0.9 + i * 0.12, 9);
      if (!localStorage.getItem('oatmeal-landed')) {
        localStorage.setItem('oatmeal-landed', '1');
        tickets += 3;
        saveTickets();
        renderCounters();
        showToast('SMOOTH LANDING · +3 🎟');
      } else {
        showToast('ON THE WATER');
      }
    } else if (ev === 'takeoff') {
      AUDIO.splash(false);
      for (let i = 0; i < 2; i++) spawnRing(flight.pos, 1 + i, 0.7, 7);
      showToast('AIRBORNE');
    } else if (ev === 'hop') {
      AUDIO.splash(false);
      spawnRing(flight.pos, 1.4, 0.7, 7);
    }
  }
  flight.events.length = 0;
  hintEl.textContent = flight.landed
    ? 'taxi: A / D · hold space to throttle up and take off'
    : defaultHint;
}

// ---------- pickups ----------
const _d = new THREE.Vector3();
function checkPickups(t) {
  // rings
  if (mode === 'fly') {
    for (const L of marks.landmarks) {
      _d.copy(flight.pos).sub(L.ring.position);
      const planeN = L.ring.userData.normal;
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
      tickets += TICKETS_PER_BALLOON;
      saveTickets();
      renderCounters();
      AUDIO.balloonPop();
    }
  }
}

// ---------- chase camera ----------
const camPos = new THREE.Vector3(0, PLANET_R * 1.6, PLANET_R * 3.0);
const camLook = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _camUp = new THREE.Vector3(0, 1, 0);
function updateCamera(dt) {
  flight.forward(_fwd);
  const upV = flight.up(new THREE.Vector3());
  let desired, look;
  if (mode === 'intro') {
    // pull from a full-globe view down into the chase cam
    const k = Math.min(1, introT / INTRO_LEN);
    const orbitDir = new THREE.Vector3(Math.sin(k * 1.4 - 0.6), 0.55 - k * 0.25, Math.cos(k * 1.4 - 0.6)).normalize();
    const farPos = orbitDir.multiplyScalar(PLANET_R * 3.1 - k * PLANET_R * 1.9);
    const chase = flight.pos.clone().addScaledVector(_fwd, -16).addScaledVector(upV, 6.2);
    desired = farPos.lerp(chase, k * k);
    look = new THREE.Vector3(0, 0, 0).lerp(flight.pos, k);
  } else {
    desired = flight.pos.clone().addScaledVector(_fwd, -16).addScaledVector(upV, 6.2);
    look = flight.pos.clone().addScaledVector(_fwd, 18);
    if (flight.landed) {
      desired = flight.pos.clone().addScaledVector(_fwd, -10.5).addScaledVector(upV, 3.1);
      look = flight.pos.clone().addScaledVector(_fwd, 16).addScaledVector(upV, 1.2);
    }
    if (mode === 'moment') {
      desired = flight.pos.clone().addScaledVector(_fwd, -22).addScaledVector(upV, 9);
      look = focused.surface.clone().addScaledVector(focused.anchor, 6).lerp(flight.pos, 0.25);
    }
  }
  // keep camera above the globe surface
  const floorR = surfaceRadiusAt(desired) + 3;
  if (desired.length() < floorR) desired.setLength(floorR);
  const stiff = mode === 'intro' ? 1.6 : 3.4;
  camPos.lerp(desired, Math.min(1, stiff * dt));
  camLook.lerp(look, Math.min(1, 5 * dt));
  camera.position.copy(camPos);
  _camUp.lerp(mode === 'intro' ? new THREE.Vector3(0, 1, 0) : upV, Math.min(1, 4 * dt)).normalize();
  camera.up.copy(_camUp);
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
    flight.apTarget = ANCHORS['south-central'].clone().multiplyScalar(PLANET_R + 22);
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
  consumeFlightEvents();
  updateWaterFx(dt);
  island.update(elapsed, dt, camera.position);
  marks.update(elapsed, dt);
  checkPickups(elapsed);

  // sky horizon follows the local up on the globe
  skyMat.uniforms.upDir.value.copy(camera.position).normalize();
  // dream haze: melt the horizon in flight, keep the whole-planet view readable
  {
    const camDist = camera.position.length();
    const k = THREE.MathUtils.clamp((camDist - 140) / 200, 0, 1);
    scene.fog.near = THREE.MathUtils.lerp(85, 270, k);
    scene.fog.far = THREE.MathUtils.lerp(300, 580, k);
  }

  // sun shadow frustum follows the plane
  sunTarget.position.copy(flight.pos).setY(0);
  sun.position.copy(sunTarget.position).addScaledVector(sunDir, 260);

  AUDIO.setWind(flight.landed ? 0.06 : Math.min(1, (flight.speed - 20) / 30));

  updateCamera(dt);
  updateLabels();
  updateCafe();
  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

frame();

// debug/testing hooks
window.baronWorld = {
  skipIntro: endIntro,
  state: () => ({ mode, pos: flight.pos.toArray().map(v => Math.round(v)), autopilot: flight.autopilot, landed: flight.landed, unlocked: [...unlocked], tickets }),
  flyTo: (id) => {
    endIntro();
    const L = marks.landmarks.find(l => l.def.id === id);
    if (!L) return;
    const { e } = tangentFrame(L.anchor);
    flight.pos.copy(L.anchor).multiplyScalar(PLANET_R + L.def.ground + 20).addScaledVector(e, -55);
    flight.heading.copy(e);
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
  _scene: scene, _marks: marks, _flight: flight, _keys: keys, _hf: heightField, _R: PLANET_R,
};
