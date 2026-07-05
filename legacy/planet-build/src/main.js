import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { PLANET_RADIUS as R, DISTRICTS, FINALE_LINE } from './data.js';
import { buildWorld, latLonToNormal } from './world.js';
import { startMinigame } from './minigames.js';

// ---------- renderer / scene ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const effect = new OutlineEffect(renderer, {
  defaultThickness: 0.0028,
  defaultColor: [0.13, 0.15, 0.19],
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 1200);

// sky dome
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: {
    top: { value: new THREE.Color(0x5fb0dd) },
    horizon: { value: new THREE.Color(0xf2ecd4) },
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
      vec3 c = mix(horizon, top, smoothstep(0.42, 0.75, h));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }
  `,
});
skyMat.userData.outlineParameters = { visible: false };
scene.add(new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16), skyMat));

// lights
scene.add(new THREE.HemisphereLight(0xcfeaff, 0xe0cf9f, 0.85));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.9);
sun.position.copy(latLonToNormal(38, 55).multiplyScalar(120));
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46;
sc.near = 40; sc.far = 220;
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.6;
scene.add(sun);

// visible sun disc
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4c8 });
sunMat.userData.outlineParameters = { visible: false };
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(26, 32), sunMat);
sunDisc.position.copy(latLonToNormal(38, 55).multiplyScalar(640));
sunDisc.lookAt(0, 0, 0);
scene.add(sunDisc);

// ---------- world ----------
const world = buildWorld(scene);

// ---------- camera rig (lat/lon/radius around planet center) ----------
const rig = { lat: 55, lon: -60, radius: 115 };
const lookState = { point: new THREE.Vector3(0, 0, 0) };

function camPosFrom(lat, lon, radius) {
  return latLonToNormal(lat, lon).multiplyScalar(radius);
}
const _upTmp = new THREE.Vector3();
function applyCamera() {
  camera.position.copy(camPosFrom(rig.lat, rig.lon, rig.radius));
  // blend camera-up toward the local surface normal as the look point leaves the core,
  // so districts read upright instead of tilted at the rim
  const lookLen = lookState.point.length();
  const f = Math.min(1, lookLen / 20);
  _upTmp.set(0, 1, 0).lerp(lookState.point.clone().normalize(), f).normalize();
  if (_upTmp.lengthSq() < 0.5) _upTmp.set(0, 1, 0);
  camera.up.copy(_upTmp);
  camera.lookAt(lookState.point);
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

// ---------- intro flyover keyframes ----------
const INTRO = [];
{
  INTRO.push({ t: 0.0, lat: 58, lon: -75, r: 120, blend: 0, anchor: null });
  INTRO.push({ t: 4.5, lat: 32, lon: -32, r: 74, blend: 0, anchor: null });
  DISTRICTS.forEach((d, i) => {
    const arrive = 6.5 + i * 6.0;
    INTRO.push({ t: arrive, lat: d.lat + 18, lon: d.lon - 12, r: 44, blend: 0.9, anchor: i, show: i });
    INTRO.push({ t: arrive + 3.4, lat: d.lat + 24, lon: d.lon + 16, r: 50, blend: 0.5, anchor: i });
  });
  INTRO.push({ t: 6.5 + 5 * 6.0 + 1.5, lat: 26, lon: 320, r: 88, blend: 0, anchor: null });
}
const INTRO_END = INTRO[INTRO.length - 1].t;

// ---------- app state ----------
let mode = 'intro'; // intro | orbit | focus
let introT = 0;
let focused = null; // district record
let tween = null;
let idleTimer = 0;
let currentGameCleanup = null;
let shownLowerThird = -1;

const unlocked = new Set(JSON.parse(localStorage.getItem('baronworld-stars') || '[]'));
let finaleShown = localStorage.getItem('baronworld-finale') === '1';

// ---------- dom ----------
const $ = (id) => document.getElementById(id);
const titleOverlay = $('title-overlay');
const lowerThird = $('lower-third');
const hud = $('hud');
const starsEl = $('stars');
const labelsRoot = $('labels');
const card = $('district-card');
const mg = $('minigame');
const storyCard = $('story-card');
const finaleEl = $('finale');

const labelEls = world.districts.map(d => {
  const e = document.createElement('div');
  e.className = 'district-label';
  e.innerHTML = d.def.name;
  labelsRoot.appendChild(e);
  return e;
});

function renderStars() {
  starsEl.innerHTML = DISTRICTS
    .map(d => `<span class="${unlocked.has(d.id) ? 'on' : 'off'}">★</span>`)
    .join('');
  labelEls.forEach((e, i) => {
    const d = world.districts[i];
    e.innerHTML = d.def.name + (unlocked.has(d.def.id) ? '<span class="star-mini">★</span>' : '');
  });
}
renderStars();

// ---------- tween helper ----------
function tweenTo(target, duration, onDone) {
  tween = {
    from: { lat: rig.lat, lon: rig.lon, radius: rig.radius, look: lookState.point.clone() },
    to: target,
    t: 0, duration, onDone,
  };
}

// ---------- mode transitions ----------
function endIntro() {
  if (mode !== 'intro') return;
  mode = 'orbit';
  const last = INTRO[INTRO.length - 1];
  rig.lat = last.lat; rig.lon = ((last.lon % 360) + 360) % 360; rig.radius = last.r;
  lookState.point.set(0, 0, 0);
  titleOverlay.classList.add('fading');
  setTimeout(() => titleOverlay.classList.add('hidden'), 1300);
  lowerThird.classList.add('hidden');
  hud.classList.remove('hidden');
}

function focusDistrict(rec) {
  if (mode === 'focus' && focused === rec) return;
  focused = rec;
  mode = 'focus';
  const d = rec.def;
  // shortest-path longitude
  let targetLon = d.lon - 10;
  const delta = ((targetLon - rig.lon) % 360 + 540) % 360 - 180;
  targetLon = rig.lon + delta;
  const zoomOut = camera.aspect < 0.8 ? 1.18 : 1; // narrow screens need more headroom
  tweenTo(
    { lat: d.lat + 15, lon: targetLon, radius: 41.5 * zoomOut, look: rec.anchor.clone().multiplyScalar(R + 0.8) },
    1.6,
    () => showDistrictCard(rec)
  );
  card.classList.add('hidden');
}

function backToOrbit() {
  mode = 'orbit';
  focused = null;
  card.classList.add('hidden');
  tweenTo({ lat: rig.lat * 0.5 + 14, lon: rig.lon + 14, radius: 88, look: new THREE.Vector3(0, 0, 0) }, 1.4);
  idleTimer = 0;
}

function showDistrictCard(rec) {
  const d = rec.def;
  card.querySelector('.dc-chip').textContent = d.chip + ' — ' + d.short;
  card.querySelector('.dc-chip').style.background = '#' + d.color.toString(16).padStart(6, '0');
  card.querySelector('.dc-name').textContent = d.name;
  card.querySelector('.dc-era').textContent = d.era;
  card.querySelector('.dc-feel').textContent = d.feel;
  const btn = $('play-mission');
  btn.textContent = d.missionName;
  const doneEl = card.querySelector('.dc-done');
  doneEl.classList.toggle('hidden', !unlocked.has(d.id));
  btn.textContent = unlocked.has(d.id) ? d.missionName + ' (again)' : d.missionName;
  card.classList.remove('hidden');
}

function openMinigame(rec) {
  const d = rec.def;
  card.classList.add('hidden');
  $('mg-title').textContent = d.missionName.replace('Play: ', '');
  $('mg-goal').textContent = d.goal;
  mg.classList.remove('hidden');
  currentGameCleanup = startMinigame(d.minigame, $('mg-body'), () => {
    closeMinigame();
    unlock(rec);
  });
}

function closeMinigame() {
  if (currentGameCleanup) { currentGameCleanup(); currentGameCleanup = null; }
  mg.classList.add('hidden');
}

function unlock(rec) {
  const d = rec.def;
  const first = !unlocked.has(d.id);
  unlocked.add(d.id);
  localStorage.setItem('baronworld-stars', JSON.stringify([...unlocked]));
  renderStars();
  storyCard.querySelector('.sc-zone').textContent = d.name + ' — ' + d.short;
  storyCard.querySelector('.sc-prompt').textContent = '“' + d.storyPrompt + '”';
  storyCard.classList.remove('hidden');
  storyCard.dataset.finaleNext = (first && unlocked.size === DISTRICTS.length && !finaleShown) ? '1' : '';
}

$('sc-continue').addEventListener('click', () => {
  storyCard.classList.add('hidden');
  if (storyCard.dataset.finaleNext === '1') {
    finaleShown = true;
    localStorage.setItem('baronworld-finale', '1');
    finaleEl.querySelector('.sc-prompt').textContent = FINALE_LINE;
    finaleEl.classList.remove('hidden');
  } else {
    backToOrbit();
  }
});
$('fin-continue').addEventListener('click', () => {
  finaleEl.classList.add('hidden');
  backToOrbit();
});
$('skip-intro').addEventListener('click', endIntro);
$('card-close').addEventListener('click', backToOrbit);
$('play-mission').addEventListener('click', () => focused && openMinigame(focused));
$('mg-quit').addEventListener('click', () => {
  closeMinigame();
  if (focused) showDistrictCard(focused);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (!mg.classList.contains('hidden')) { closeMinigame(); if (focused) showDistrictCard(focused); }
    else if (!storyCard.classList.contains('hidden')) { storyCard.classList.add('hidden'); backToOrbit(); }
    else if (mode === 'focus') backToOrbit();
  }
  if (mode === 'intro' && (e.code === 'Space' || e.code === 'Enter')) endIntro();
});

// ---------- pointer input ----------
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const pointers = new Map();
let dragging = false, dragMoved = 0, lastPinch = 0;

function markerHitAt(clientX, clientY) {
  pointerNdc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(world.districts.map(d => d.marker.getObjectByName('hit')));
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && !obj.userData.districtId) obj = obj.parent;
  return world.districts.find(d => d.def.id === obj?.userData.districtId) || null;
}

canvas.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (mode === 'intro') { endIntro(); return; }
  dragging = true;
  dragMoved = 0;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic pointers */ }
});

canvas.addEventListener('pointermove', (e) => {
  const prev = pointers.get(e.pointerId);
  if (pointers.size === 2 && prev) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (lastPinch) {
      rig.radius = THREE.MathUtils.clamp(rig.radius * (lastPinch / dist), 38, 120);
    }
    lastPinch = dist;
    return;
  }
  if (dragging && prev && mode !== 'intro') {
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    if (!tween) {
      rig.lon += dx * 0.25;
      rig.lat = THREE.MathUtils.clamp(rig.lat + dy * 0.22, -72, 80);
      if (mode === 'focus') {
        // dragging in focus breaks back to free orbit
        if (dragMoved > 24) { mode = 'orbit'; focused = null; card.classList.add('hidden'); lookState.point.lerp(new THREE.Vector3(0, 0, 0), 1); }
      }
      idleTimer = 0;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  } else if (!dragging) {
    const hit = markerHitAt(e.clientX, e.clientY);
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  }
});

function pointerUp(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) lastPinch = 0;
  if (!dragging) return;
  dragging = false;
  if (dragMoved < 6 && mode !== 'intro') {
    const hit = markerHitAt(e.clientX, e.clientY);
    if (hit) focusDistrict(hit);
  }
}
canvas.addEventListener('pointerup', pointerUp);
canvas.addEventListener('pointercancel', pointerUp);

canvas.addEventListener('wheel', (e) => {
  if (mode === 'intro') return;
  e.preventDefault();
  rig.radius = THREE.MathUtils.clamp(rig.radius + e.deltaY * 0.05, 38, 120);
  idleTimer = 0;
}, { passive: false });

// WASD / arrows nudge the orbit
const keys = new Set();
window.addEventListener('keydown', (e) => { keys.add(e.code); });
window.addEventListener('keyup', (e) => { keys.delete(e.code); });

// ---------- labels projection ----------
const projTmp = new THREE.Vector3();
function updateLabels() {
  const overlayOpen = mode === 'intro' || !mg.classList.contains('hidden') || !storyCard.classList.contains('hidden') || !finaleEl.classList.contains('hidden');
  world.districts.forEach((d, i) => {
    const e = labelEls[i];
    if (overlayOpen) { e.style.opacity = '0'; return; }
    projTmp.copy(d.anchor).multiplyScalar(R + 3.4);
    const camDir = camera.position.clone().normalize();
    const facing = d.anchor.dot(camDir);
    projTmp.project(camera);
    if (facing < 0.18 || projTmp.z > 1) { e.style.opacity = '0'; return; }
    e.style.opacity = focused && focused !== d ? '0.25' : '1';
    e.style.left = ((projTmp.x + 1) / 2 * window.innerWidth) + 'px';
    e.style.top = ((-projTmp.y + 1) / 2 * window.innerHeight) + 'px';
  });
}

// ---------- lower third ----------
function setLowerThird(i) {
  if (i === shownLowerThird) return;
  shownLowerThird = i;
  if (i < 0) { lowerThird.classList.add('hidden'); return; }
  const d = DISTRICTS[i];
  lowerThird.querySelector('.lt-name').textContent = d.name;
  lowerThird.querySelector('.lt-era').textContent = d.short + ' · ' + d.era;
  lowerThird.querySelector('.lt-accent').style.background = '#' + d.color.toString(16).padStart(6, '0');
  lowerThird.classList.remove('hidden');
  // retrigger entry animation
  lowerThird.style.animation = 'none';
  void lowerThird.offsetWidth;
  lowerThird.style.animation = '';
}

// ---------- intro evaluation ----------
const anchorTmp = new THREE.Vector3();
function evalIntro(t) {
  titleOverlay.classList.toggle('minified', t > 5.2);
  let k = 0;
  while (k < INTRO.length - 2 && INTRO[k + 1].t <= t) k++;
  const a = INTRO[k], b = INTRO[k + 1];
  const s = smooth(a.t, b.t, t);
  rig.lat = lerp(a.lat, b.lat, s);
  rig.lon = lerp(a.lon, b.lon, s);
  rig.radius = lerp(a.r, b.r, s);
  const blend = lerp(a.blend, b.blend, s);
  const anchorIdx = b.anchor ?? a.anchor;
  if (anchorIdx != null && blend > 0.01) {
    anchorTmp.copy(world.districts[anchorIdx].anchor).multiplyScalar(R);
    lookState.point.set(0, 0, 0).lerp(anchorTmp, blend);
  } else {
    lookState.point.set(0, 0, 0);
  }
  // lower third windows
  let show = -1;
  for (const kf of INTRO) {
    if (kf.show != null && t >= kf.t - 1.2 && t <= kf.t + 3.0) { show = kf.show; break; }
  }
  setLowerThird(show);
}

// ---------- main loop ----------
const clock = new THREE.Clock();
let elapsed = 0;

window.addEventListener('error', (e) => { window.__lastError = e.message + ' @ ' + e.filename + ':' + e.lineno; });

function frame() {
  window.__frames = (window.__frames || 0) + 1;
  const dt = Math.min(clock.getDelta(), 0.05);
  frameBody(dt);
  requestAnimationFrame(frame);
}

function frameBody(dt) {
  elapsed += dt;

  if (mode === 'intro') {
    introT += dt;
    if (introT >= INTRO_END) endIntro();
    else evalIntro(introT);
  } else if (tween) {
    tween.t += dt;
    const s = smooth(0, tween.duration, tween.t);
    rig.lat = lerp(tween.from.lat, tween.to.lat, s);
    rig.lon = lerp(tween.from.lon, tween.to.lon, s);
    rig.radius = lerp(tween.from.radius, tween.to.radius, s);
    lookState.point.copy(tween.from.look).lerp(tween.to.look, s);
    if (tween.t >= tween.duration) {
      const done = tween.onDone;
      tween = null;
      done && done();
    }
  } else {
    // keyboard nudge
    const kSpeed = 42 * dt;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) { rig.lon -= kSpeed; idleTimer = 0; }
    if (keys.has('KeyD') || keys.has('ArrowRight')) { rig.lon += kSpeed; idleTimer = 0; }
    if (keys.has('KeyW') || keys.has('ArrowUp')) { rig.lat = Math.min(80, rig.lat + kSpeed * 0.7); idleTimer = 0; }
    if (keys.has('KeyS') || keys.has('ArrowDown')) { rig.lat = Math.max(-72, rig.lat - kSpeed * 0.7); idleTimer = 0; }

    if (mode === 'orbit') {
      idleTimer += dt;
      if (idleTimer > 4 && !dragging) rig.lon += 1.6 * dt; // gentle ambient drift
    }
  }

  world.update(elapsed, dt, camera.position);
  applyCamera();
  updateLabels();
  effect.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

applyCamera();
frame();

// debug/testing hooks
window.baronWorld = {
  skipIntro: endIntro,
  focus: (id) => {
    const rec = world.districts.find(d => d.def.id === id);
    if (rec) { endIntro(); focusDistrict(rec); }
  },
  jump: (t) => { introT = t; },
  state: () => ({ mode, rig: { ...rig }, unlocked: [...unlocked] }),
  reset: () => { localStorage.clear(); location.reload(); },
  tick: (seconds) => {
    const steps = Math.round(seconds * 60);
    for (let i = 0; i < steps; i++) frameBody(1 / 60);
  },
  screenPos: (id) => {
    const rec = world.districts.find(d => d.def.id === id);
    const v = new THREE.Vector3();
    rec.marker.getObjectByName('hit').getWorldPosition(v);
    v.project(camera);
    return { x: (v.x + 1) / 2 * window.innerWidth, y: (-v.y + 1) / 2 * window.innerHeight };
  },
};
