// The Oatmeal Planet — a FULL globe: oceans, continents, and the whole world wraps.
// One analytic height field over the sphere drives the mesh, prop placement, and
// the flight floor, so nothing ever floats.
import * as THREE from 'three';
import { LANDMARKS } from './data.js';
import * as P from './props.js';

export const PLANET_R = 110;
const _up = new THREE.Vector3(0, 1, 0);

const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function latLonToNormal(lat, lon) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    Math.cos(la) * Math.cos(lo),
    Math.sin(la),
    Math.cos(la) * Math.sin(lo)
  );
}

export function tangentFrame(n) {
  const e = new THREE.Vector3().crossVectors(_up, n);
  if (e.lengthSq() < 1e-6) e.set(1, 0, 0);
  e.normalize();
  const f = new THREE.Vector3().crossVectors(n, e).normalize();
  return { e, f };
}

// landmark anchors (unit vectors) — spread around the globe's equatorial band
export const ANCHORS = {};
for (const L of LANDMARKS) ANCHORS[L.id] = latLonToNormal(L.lat, L.lon);
export const PALM_COURT_N = latLonToNormal(3, 40);
export const ISLET_N = latLonToNormal(-14, 195);
const HILLS_N = latLonToNormal(-2, 250);      // Bel-Air style estate ridge, near Downtown
const MOUNTAIN_N = latLonToNormal(22, 300);   // Mt. Oatmeal, behind HQ

// height above sea level (sea = 0) at a unit direction
export function heightField(n) {
  const x = n.x, y = n.y, z = n.z;
  // continents: low-frequency landmass noise
  const c = Math.sin(x * 3.1 + 1.2) * Math.cos(y * 2.7 - 0.8)
          + Math.sin(z * 2.3 + 2.1) * Math.cos(x * 3.7 + 0.4)
          + 0.6 * Math.sin(y * 1.7 + z * 2.9);
  const land = sm(-0.55, 0.35, c);
  let h = -3.2 + land * 5.6; // ocean floor -3.2 … lowland +2.4
  // rolling hills on land
  h += land * (1.5 * Math.sin(x * 9.1) * Math.cos(z * 8.3) + 0.9 * Math.sin(y * 11.7 + x * 5.1));
  // Mt. Oatmeal
  h += 15 * Math.exp((n.dot(MOUNTAIN_N) - 1) * 90);
  // estate ridge
  h += 6.5 * Math.exp((n.dot(HILLS_N) - 1) * 130);
  // Oatmeal House islet
  h += 3.4 * Math.exp((n.dot(ISLET_N) - 1) * 900);
  // palm court cove flatten
  {
    const w = sm(0.9955, 0.9985, PALM_COURT_N.dot(n));
    h = h * (1 - w) + 1.6 * w;
  }
  // landmark plateaus (forces land under every moment)
  for (const L of LANDMARKS) {
    const w = sm(0.994, 0.998, ANCHORS[L.id].dot(n));
    h = h * (1 - w) + L.ground * w;
  }
  return h;
}

export function surfaceRadiusAt(v) {
  const n = v.clone().normalize();
  return PLANET_R + heightField(n);
}

// flight floor: surface (never below sea) + bubble over each landmark's buildings
export function clearanceRadius(v) {
  const n = v.clone().normalize();
  let h = Math.max(heightField(n), 0);
  for (const L of LANDMARKS) {
    const w = sm(0.994, 0.9985, ANCHORS[L.id].dot(n));
    h = Math.max(h, L.ground * (1 - w) + (L.ground + 15) * w);
  }
  return PLANET_R + h;
}

// place a base-origin prop on the planet at anchor + tangent offset (dx, dz)
export function placeOnPlanet(parent, obj, anchorN, dx = 0, dz = 0, rotY = 0, lift = 0) {
  const { e, f } = tangentFrame(anchorN);
  const dir = anchorN.clone().multiplyScalar(PLANET_R)
    .addScaledVector(e, dx).addScaledVector(f, dz).normalize();
  const r = PLANET_R + Math.max(heightField(dir), 0);
  obj.position.copy(dir).multiplyScalar(r + lift);
  obj.quaternion.setFromUnitVectors(_up, dir);
  if (rotY) obj.rotateY(rotY);
  parent.add(obj);
  return obj;
}

function hash(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ---------- globe terrain ----------
function buildGlobe() {
  const geo = new THREE.SphereGeometry(PLANET_R, 260, 170);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const sand = new THREE.Color(0xe8d5a3);
  const grass = new THREE.Color(0x72cb58);
  const grassDark = new THREE.Color(0x52b046);
  const rockC = new THREE.Color(0x9d9484);
  const dirt = new THREE.Color(0xc2a878);
  const deep = new THREE.Color(0x9db8a8);
  const tmp = new THREE.Color();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const h = heightField(n);
    const r = PLANET_R + h;
    pos.setXYZ(i, n.x * r, n.y * r, n.z * r);
    const nn = hash(Math.round(n.x * 40) * 0.35, Math.round((n.z + n.y) * 40) * 0.35);
    if (h < -0.6) tmp.copy(deep);
    else if (h < 0.7) tmp.copy(sand);
    else {
      tmp.copy(grass).lerp(grassDark, nn * 0.8);
      if (h < 1.4) tmp.lerp(sand, (1.4 - h) / 0.7 * 0.5);
      const rockiness = sm(8, 13, h);
      tmp.lerp(rockC.clone().lerp(dirt, nn * 0.4), rockiness);
      if (rockiness < 0.45 && Math.sin(h * 4.2) > 0.72) tmp.multiplyScalar(1.08);
    }
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = P.toon(0xffffff, { vertexColors: true });
  mat.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function buildOcean() {
  const mat = new THREE.MeshToonMaterial({
    color: 0x41bdf2, transparent: true, opacity: 0.86, emissive: 0x1580c2, emissiveIntensity: 0.32,
  });
  mat.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(PLANET_R + 0.02, 96, 64), mat);
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- great-circle road through the moments ----------
export function buildRoadCurve() {
  const pts = [];
  const order = ['south-central', 'downtown-la', 'crossroads-ucla', 'investor-tower', 'oakland'];
  for (const id of order) pts.push(ANCHORS[id].clone().multiplyScalar(PLANET_R));
  pts.splice(1, 0, PALM_COURT_N.clone().multiplyScalar(PLANET_R));
  pts.splice(4, 0, HILLS_N.clone().multiplyScalar(PLANET_R));
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.85);
}

function buildRoad(curve) {
  const N = 520, width = 2.4;
  const verts = [], idx = [], samples = [];
  for (let i = 0; i < N; i++) {
    const p = curve.getPoint(i / N).normalize();
    const r = PLANET_R + Math.max(heightField(p), 0.15) + 0.18;
    samples.push(p.multiplyScalar(r));
  }
  for (let i = 0; i < N; i++) {
    const p = samples[i], next = samples[(i + 1) % N];
    const tangent = next.clone().sub(p).normalize();
    const normal = p.clone().normalize();
    const side = new THREE.Vector3().crossVectors(normal, tangent).setLength(width / 2);
    const a = p.clone().add(side), b = p.clone().sub(side);
    verts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  for (let i = 0; i < N; i++) {
    const i0 = i * 2, i1 = i * 2 + 1;
    const j0 = ((i + 1) % N) * 2, j1 = j0 + 1;
    idx.push(i0, i1, j0, i1, j1, j0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = P.toon(0xefd9a0);
  mat.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return { mesh, samples };
}

// ---------- scatter: flora everywhere, ESTATES on the hills ----------
function scatter(root, roadSamples) {
  const _p = new THREE.Vector3();
  let estates = 0;
  for (let i = 0; i < 900; i++) {
    const n = new THREE.Vector3().randomDirection();
    const h = heightField(n);
    if (h < 0.7) continue; // ocean/beach
    if (LANDMARKS.some(L => ANCHORS[L.id].dot(n) > 0.9965)) continue;
    if (PALM_COURT_N.dot(n) > 0.997 || ISLET_N.dot(n) > 0.998) continue;
    _p.copy(n).multiplyScalar(PLANET_R + h);
    if (roadSamples.some(s => s.distanceToSquared(_p) < 20)) continue;
    let obj;
    const roll = Math.random();
    if (h > 8) obj = roll < 0.5 ? P.mesa(0.8 + Math.random() * 0.9) : P.rock(1.6 + Math.random() * 2.4);
    else if (h > 2.6 && h < 7 && roll < 0.16 && estates < 26) { obj = P.estate(0.85 + Math.random() * 0.35); estates++; }
    else if (h < 1.6) obj = P.palm(1.9 + Math.random() * 1.3);
    else if (roll < 0.3) obj = P.flowerPatch(1.5 + Math.random() * 1.5);
    else if (roll < 0.42) obj = P.bush(1.5 + Math.random(), [0x4f9c58, 0x5eab63, 0x3f8f6a][i % 3]);
    else if (roll < 0.5) obj = P.domeBuilding(1.0 + Math.random() * 0.6, 1.1 + Math.random() * 0.8,
      ['#f6ead2', '#ffd9c2', '#d9ecf2'][i % 3], [0xffc83d, 0xe0483e, 0x5fa8c9, 0x9a6bff][i % 4]);
    else obj = P.tree(1.3 + Math.random() * 1.6, [0x5eab63, 0x6fbf74, 0x4f9c58, 0x77c46a][i % 4]);
    placeOnPlanet(root, obj, n, 0, 0, Math.random() * Math.PI * 2);
  }
}

// dense Bel-Air ridge: terraced estates
function buildHills(root) {
  const spots = [
    [0, 0, 1.3], [14, 6, 1.1], [-13, 8, 1.15], [8, -12, 1.2], [-10, -10, 1.0],
    [20, -4, 0.95], [-20, -2, 1.05],
  ];
  for (const [dx, dz, s] of spots) {
    placeOnPlanet(root, P.estate(s, ['#e0483e', '#ffc83d', '#2b6fd4'][Math.floor(Math.random() * 3)]),
      HILLS_N, dx, dz, Math.random() * Math.PI * 2);
  }
}

// ---------- public ----------
export function buildIsland(scene) {
  const root = new THREE.Group();
  scene.add(root);

  root.add(buildGlobe());
  root.add(buildOcean());
  const roadCurve = buildRoadCurve();
  const road = buildRoad(roadCurve);
  root.add(road.mesh);
  scatter(root, road.samples.filter((_, i) => i % 5 === 0));
  buildHills(root);

  // Palm Court — organized grove + Radio Café cove
  const notes = [];
  {
    const C = PALM_COURT_N;
    const cafe = P.beachCafe('RADIO CAFÉ');
    cafe.scale.setScalar(1.35);
    placeOnPlanet(root, cafe, C, 0, 0, Math.PI * 0.35);
    const palmTops = [];
    for (const [arcR, count, s] of [[11, 7, 3.0], [15.5, 9, 2.4]]) {
      for (let k = 0; k < count; k++) {
        const a = (k / (count - 1) - 0.5) * Math.PI * 1.05;
        const dx = Math.sin(a) * arcR, dz = Math.cos(a) * arcR;
        const palm = P.palm(s + (k % 2) * 0.35);
        const placed = placeOnPlanet(root, palm, C, dx, dz, Math.random() * Math.PI * 2);
        if (arcR === 11) palmTops.push(placed.localToWorld(new THREE.Vector3(0, 3.6 * s * 0.62, 0)));
      }
    }
    for (let k = 0; k + 1 < palmTops.length; k++) root.add(P.stringLights(palmTops[k], palmTops[k + 1], 7, 0.8));
    for (const [dr, da, pa] of [[8, -0.5, '#ff9b85'], [9.5, 0.1, '#5fa8c9'], [8.5, 0.7, '#ffc83d']]) {
      placeOnPlanet(root, P.parasol(pa, '#fdf8ef'), C, Math.sin(da) * dr, Math.cos(da) * dr).scale.setScalar(1.3);
    }
    const radio = cafe.getObjectByName('radio');
    const radioWorld = new THREE.Vector3();
    radio.getObjectByName('antennaTip').getWorldPosition(radioWorld);
    const noteTex = P.noteTexture();
    const upDir = radioWorld.clone().normalize();
    for (let k = 0; k < 4; k++) {
      const mat = new THREE.SpriteMaterial({ map: noteTex, transparent: true, opacity: 0, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.scale.setScalar(1.6);
      sp.position.copy(radioWorld);
      root.add(sp);
      notes.push({ sp, base: radioWorld.clone(), up: upDir, phase: k * 1.7 });
    }
  }

  // Oatmeal House islet
  {
    placeOnPlanet(root, P.baronHouse(), ISLET_N, 0, 0, Math.PI);
    for (const [dx, dz, s] of [[-4.5, 2, 2.4], [4.2, -1.5, 2.1], [1.5, 4.6, 1.8]]) {
      placeOnPlanet(root, P.palm(s), ISLET_N, dx, dz, Math.random() * Math.PI * 2);
    }
  }

  // lighthouse on a coastal point near South Central
  placeOnPlanet(root, (() => { const l = P.lighthouse(); l.scale.setScalar(2.2); return l; })(),
    latLonToNormal(-2, 12), 0, 0);

  // yachts anchored offshore near the estate ridge + palm court
  const yachts = [];
  for (const [baseN, dx, dz, s] of [
    [HILLS_N, 30, 18, 1.1], [HILLS_N, 36, -8, 0.9], [PALM_COURT_N, -22, 14, 1.0], [ANCHORS['oakland'], 20, 22, 0.95],
  ]) {
    const y = P.yacht(s);
    const { e, f } = tangentFrame(baseN);
    const dir = baseN.clone().multiplyScalar(PLANET_R).addScaledVector(e, dx).addScaledVector(f, dz).normalize();
    if (heightField(dir) > -0.5) continue; // must be water
    y.position.copy(dir).multiplyScalar(PLANET_R + 0.35);
    y.quaternion.setFromUnitVectors(_up, dir);
    y.rotateY(Math.random() * Math.PI * 2);
    root.add(y);
    yachts.push({ obj: y, dir, phase: Math.random() * 6 });
  }

  // billboard clouds orbiting the globe
  const clouds = [];
  for (let i = 0; i < 22; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
    const c = P.cloud(1.4 + Math.random() * 1.4);
    c.position.set(0, PLANET_R + 13 + Math.random() * 12, 0);
    pivot.add(c);
    root.add(pivot);
    clouds.push({ pivot, cloudObj: c, speed: (0.004 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1) });
  }

  // gulls
  const birds = [];
  for (let i = 0; i < 8; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
    const b = P.bird();
    b.scale.setScalar(2.4);
    b.position.set(0, PLANET_R + 5 + Math.random() * 5, 0);
    pivot.add(b);
    root.add(pivot);
    birds.push({ pivot, bird: b, speed: 0.05 + Math.random() * 0.04, phase: Math.random() * 6 });
  }

  const _cw = new THREE.Vector3();
  function update(t, dt, camPos) {
    for (const c of clouds) {
      c.pivot.rotateY(c.speed * dt);
      if (camPos) {
        c.cloudObj.getWorldPosition(_cw);
        c.cloudObj.visible = _cw.distanceToSquared(camPos) > 1900;
      }
    }
    for (const b of birds) {
      b.pivot.rotateY(b.speed * dt);
      const flap = Math.sin(t * 8 + b.phase) * 0.7;
      b.bird.getObjectByName('wingL').rotation.z = flap;
      b.bird.getObjectByName('wingR').rotation.z = -flap;
    }
    for (const y of yachts) {
      y.obj.position.copy(y.dir).multiplyScalar(PLANET_R + 0.35 + Math.sin(t * 1.4 + y.phase) * 0.1);
    }
    for (const n of notes) {
      const cyc = ((t * 0.5 + n.phase) % 3) / 3;
      n.sp.position.copy(n.base).addScaledVector(n.up, 0.5 + cyc * 6.5);
      n.sp.material.opacity = Math.sin(cyc * Math.PI) * 0.95;
    }
  }

  return {
    root, roadCurve, update,
    palmCourt: { anchor: PALM_COURT_N, pos: PALM_COURT_N.clone().multiplyScalar(PLANET_R + 3) },
  };
}
