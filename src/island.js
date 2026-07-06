// Baron Island terrain. One analytic height function drives both the mesh and
// runtime queries (flight floor, prop placement), so nothing ever floats.
import * as THREE from 'three';
import { LANDMARKS } from './data.js';
import * as P from './props.js';

export const ISLAND_R = 190;
export const WORLD_EDGE = 260;

const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ambient flattened spots (non-landmark set pieces)
export const PALM_COURT = { x: 58, z: 132, r: 19, ground: 3.4 };
const FLAT_SPOTS = [PALM_COURT];

export function terrainHeight(x, z) {
  const d = Math.hypot(x, z);
  const mask = 1 - sm(ISLAND_R * 0.55, ISLAND_R, d);
  let h = 11 * mask - 7;
  h += (5.5 * Math.sin(x * 0.045) * Math.cos(z * 0.05)
      + 3.0 * Math.sin(x * 0.11 + 1.7) * Math.sin(z * 0.09 - 0.6)) * mask;
  // Mt. Baron
  h += 46 * Math.exp(-((x - 4) ** 2 + (z + 18) ** 2) / 2400);
  // harbor bay carve (NE)
  h += -18 * Math.exp(-((x - 118) ** 2 + (z + 118) ** 2) / 5200);
  // Baron House islet, offshore to the southeast
  h += 10 * Math.exp(-((x - 172) ** 2 + (z - 148) ** 2) / 180);
  // landmark plateaus
  for (const L of LANDMARKS) {
    const ld = Math.hypot(x - L.x, z - L.z);
    const w = 1 - sm(15, 27, ld);
    h = h * (1 - w) + L.ground * w;
  }
  for (const S of FLAT_SPOTS) {
    const sd = Math.hypot(x - S.x, z - S.z);
    const w = 1 - sm(S.r * 0.6, S.r, sd);
    h = h * (1 - w) + S.ground * w;
  }
  return h;
}

// flight floor: terrain plus a soft bubble over each landmark so the plane
// never clips through towers/arenas
export function clearanceHeight(x, z) {
  let h = terrainHeight(x, z);
  for (const L of LANDMARKS) {
    const d = Math.hypot(x - L.x, z - L.z);
    const w = 1 - sm(10, 26, d);
    h = Math.max(h, L.ground * (1 - w) + (L.ground + 17) * w);
  }
  return h;
}

export function terrainSlope(x, z) {
  const e = 1.5;
  const dx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const dz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  return Math.hypot(dx, dz) / (2 * e);
}

// deterministic hash noise for color speckle
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function buildTerrain() {
  const SIZE = 560, SEG = 200;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const sand = new THREE.Color(0xe8d5a3);
  const sandWet = new THREE.Color(0xd9c58e);
  const grass = new THREE.Color(0x72cb58);
  const grassDark = new THREE.Color(0x52b046);
  const rockC = new THREE.Color(0x9d9484);
  const dirt = new THREE.Color(0xc2a878);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = terrainHeight(x, z);
    pos.setY(i, h);
    const slope = terrainSlope(x, z);
    const n = hash(Math.round(x * 0.35), Math.round(z * 0.35));
    if (h < 1.6) tmp.copy(h < 0.4 ? sandWet : sand);
    else {
      tmp.copy(grass).lerp(grassDark, n * 0.8);
      if (h < 3.2) tmp.lerp(sand, (3.2 - h) / 1.6 * 0.5);
      // blend to rock on steep slopes and up the mountain
      const rockiness = Math.max(sm(0.8, 1.25, slope), sm(26, 38, h));
      tmp.lerp(rockC.clone().lerp(dirt, n * 0.4), rockiness);
      // faint illustrated contour bands
      if (rockiness < 0.45 && Math.sin(h * 1.85) > 0.78) tmp.multiplyScalar(1.08);
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

function buildWater() {
  const mat = new THREE.MeshToonMaterial({
    color: 0x41bdf2, transparent: true, opacity: 0.88, emissive: 0x1580c2, emissiveIntensity: 0.32,
  });
  mat.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(900, 48), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.receiveShadow = true;
  return mesh;
}

// scenic loop road through every landmark
export function buildRoadCurve() {
  const pts = [];
  const order = ['south-central', 'downtown-la', 'crossroads-ucla', 'investor-tower', 'oakland'];
  for (const id of order) {
    const L = LANDMARKS.find(l => l.id === id);
    pts.push(new THREE.Vector3(L.x, 0, L.z));
  }
  // scenic control points between landmarks
  pts.splice(1, 0, new THREE.Vector3(75, 0, 125));
  pts.splice(3, 0, new THREE.Vector3(-85, 0, 105));
  pts.splice(5, 0, new THREE.Vector3(-95, 0, -45));
  pts.push(new THREE.Vector3(115, 0, -20));
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.7);
}

function buildRoad(curve) {
  const N = 420, width = 2.4;
  const verts = [], idx = [];
  const samples = [];
  for (let i = 0; i < N; i++) {
    const p = curve.getPoint(i / N);
    p.y = terrainHeight(p.x, p.z) + 0.22;
    samples.push(p);
  }
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const p = samples[i], next = samples[(i + 1) % N];
    const tangent = next.clone().sub(p).setY(0).normalize();
    const side = new THREE.Vector3().crossVectors(up, tangent).setLength(width / 2);
    const a = p.clone().add(side), b = p.clone().sub(side);
    a.y = terrainHeight(a.x, a.z) + 0.22;
    b.y = terrainHeight(b.x, b.z) + 0.22;
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

function scatter(root, roadSamples) {
  const placed = [];
  for (let i = 0; i < 560; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (ISLAND_R * 0.96);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = terrainHeight(x, z);
    if (h < 1.2) continue; // underwater / beach edge
    if (LANDMARKS.some(L => Math.hypot(x - L.x, z - L.z) < 24)) continue;
    if (Math.hypot(x - PALM_COURT.x, z - PALM_COURT.z) < PALM_COURT.r + 4) continue;
    if (roadSamples.some(s => (s.x - x) ** 2 + (s.z - z) ** 2 < 16)) continue;
    const slope = terrainSlope(x, z);
    if (slope > 1.1) continue;
    let obj;
    if (h < 4.5) obj = P.palm(1.9 + Math.random() * 1.4);
    else if (h > 24 || slope > 0.7) obj = Math.random() < 0.5
      ? P.mesa(0.8 + Math.random() * 0.9)
      : P.rock(1.6 + Math.random() * 2.6);
    else if (Math.random() < 0.07) obj = P.domeBuilding(
      1.1 + Math.random() * 0.7, 1.2 + Math.random() * 0.9,
      ['#f6ead2', '#ffd9c2', '#d9ecf2'][i % 3],
      [0xffc83d, 0xe0483e, 0x5fa8c9, 0x9a6bff][i % 4]);
    else if (Math.random() < 0.16) obj = P.flowerPatch(1.6 + Math.random() * 1.6);
    else if (Math.random() < 0.14) obj = P.bush(1.6 + Math.random(), [0x4f9c58, 0x5eab63, 0x3f8f6a][i % 3]);
    else if (Math.random() < 0.1) obj = P.house(1.4 + Math.random(), 1.0, 1.3,
      [0xf2d8b0, 0xbfd9c9, 0xf6e2c4, 0xd9b8a8][i % 4], [0xc95f45, 0x8a6b4a, 0x5f7ea8][i % 3]);
    else obj = P.tree(1.4 + Math.random() * 1.7, [0x5eab63, 0x6fbf74, 0x4f9c58, 0x77c46a][i % 4]);
    obj.position.set(x, h, z);
    obj.rotation.y = Math.random() * Math.PI * 2;
    root.add(obj);
    placed.push(obj);
  }
  return placed;
}

export function buildIsland(scene) {
  const root = new THREE.Group();
  scene.add(root);

  root.add(buildTerrain());
  root.add(buildWater());
  const roadCurve = buildRoadCurve();
  const road = buildRoad(roadCurve);
  root.add(road.mesh);
  scatter(root, road.samples.filter((_, i) => i % 4 === 0));

  // ---- Palm Court: organized grove + Radio Café cove ----
  const notes = [];
  {
    const C = PALM_COURT;
    const gy = (x, z) => terrainHeight(x, z);
    const cafe = P.beachCafe('RADIO CAFÉ');
    cafe.scale.setScalar(1.35);
    cafe.position.set(C.x, gy(C.x, C.z), C.z);
    cafe.rotation.y = Math.atan2(-C.x, -C.z) + Math.PI; // face the sea
    root.add(cafe);
    // two neat palm arcs framing the cove — the organized grove
    const palmTops = [];
    for (const [arcR, count, s] of [[11, 7, 3.0], [15.5, 9, 2.4]]) {
      for (let k = 0; k < count; k++) {
        const a = (k / (count - 1) - 0.5) * Math.PI * 1.05 + Math.atan2(-C.x, -C.z) + Math.PI;
        const px = C.x + Math.sin(a) * arcR, pz = C.z + Math.cos(a) * arcR;
        const palm = P.palm(s + (k % 2) * 0.35);
        palm.position.set(px, gy(px, pz), pz);
        palm.rotation.y = Math.random() * Math.PI * 2;
        root.add(palm);
        if (arcR === 11) palmTops.push(new THREE.Vector3(px, gy(px, pz) + 3.6 * s * 0.62, pz));
      }
    }
    // string lights between the inner palms
    for (let k = 0; k + 1 < palmTops.length; k++) {
      root.add(P.stringLights(palmTops[k], palmTops[k + 1], 7, 0.8));
    }
    // parasols + chairs on the sand side
    const seaA = Math.atan2(C.x, C.z);
    for (const [dr, da, pa, pb] of [[8, -0.5, '#ff9b85', '#fdf8ef'], [9.5, 0.1, '#5fa8c9', '#fdf8ef'], [8.5, 0.7, '#ffc83d', '#fdf8ef']]) {
      const px = C.x + Math.sin(seaA + da) * dr, pz = C.z + Math.cos(seaA + da) * dr;
      const u = P.parasol(pa, pb);
      u.scale.setScalar(1.3);
      u.position.set(px, gy(px, pz), pz);
      root.add(u);
      const ch = P.beachChair([0x5fa8c9, 0xff9b85, 0x3f8f6a][Math.floor(dr) % 3]);
      ch.scale.setScalar(1.3);
      ch.position.set(px + 1.6, gy(px + 1.6, pz + 0.5), pz + 0.5);
      ch.rotation.y = seaA + da;
      root.add(ch);
    }
    // music notes drifting up from the rooftop radio
    const radio = cafe.getObjectByName('radio');
    const radioWorld = new THREE.Vector3();
    radio.getObjectByName('antennaTip').getWorldPosition(radioWorld);
    const noteTex = P.noteTexture();
    for (let k = 0; k < 4; k++) {
      const mat = new THREE.SpriteMaterial({ map: noteTex, transparent: true, opacity: 0 });
      const sp = new THREE.Sprite(mat);
      sp.scale.setScalar(1.6);
      sp.position.copy(radioWorld);
      root.add(sp);
      notes.push({ sp, base: radioWorld.clone(), phase: k * 1.7 });
    }
  }

  // ---- Palm Drive: paired palms flanking coastal road stretches ----
  {
    const stride = 9;
    const up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < road.samples.length; k += stride) {
      const s = road.samples[k];
      const h = terrainHeight(s.x, s.z);
      if (h < 1.8 || h > 6.5) continue;
      if (LANDMARKS.some(L => Math.hypot(s.x - L.x, s.z - L.z) < 26)) continue;
      if (Math.hypot(s.x - PALM_COURT.x, s.z - PALM_COURT.z) < PALM_COURT.r + 6) continue;
      const next = road.samples[(k + 1) % road.samples.length];
      const tangent = next.clone().sub(s).setY(0).normalize();
      const side = new THREE.Vector3().crossVectors(up, tangent);
      for (const dir of [1, -1]) {
        const px = s.x + side.x * 2.6 * dir, pz = s.z + side.z * 2.6 * dir;
        const palm = P.palm(2.3 + Math.random() * 0.7);
        palm.position.set(px, terrainHeight(px, pz), pz);
        palm.rotation.y = Math.random() * Math.PI * 2;
        root.add(palm);
      }
    }
  }

  // lighthouse on the southern point
  {
    const lx = 30, lz = 152;
    const lh = P.lighthouse();
    const y = Math.max(terrainHeight(lx, lz), 1.2);
    lh.position.set(lx, y, lz);
    lh.scale.setScalar(2.2);
    root.add(lh);
  }

  // Baron House islet — a little offshore hideout
  {
    const bx = 172, bz = 148;
    const hy = terrainHeight(bx, bz);
    const house = P.baronHouse();
    house.position.set(bx, hy, bz);
    house.rotation.y = Math.atan2(-bx, -bz) + Math.PI; // sign faces the island
    root.add(house);
    for (const [dx, dz, s] of [[-4.5, 2, 2.4], [4.2, -1.5, 2.1], [1.5, 4.6, 1.8]]) {
      const palm = P.palm(s);
      palm.position.set(bx + dx, terrainHeight(bx + dx, bz + dz), bz + dz);
      palm.rotation.y = Math.random() * Math.PI * 2;
      root.add(palm);
    }
  }

  // clouds drift with the wind
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const c = P.cloud(2.2 + Math.random() * 2.6);
    c.position.set((Math.random() - 0.5) * 700, 62 + Math.random() * 40, (Math.random() - 0.5) * 700);
    root.add(c);
    clouds.push({ obj: c, speed: 1.2 + Math.random() * 1.4 });
  }

  // gulls
  const birds = [];
  for (let i = 0; i < 7; i++) {
    const pivot = new THREE.Group();
    pivot.position.set((Math.random() - 0.5) * 220, 26 + Math.random() * 26, (Math.random() - 0.5) * 220);
    const b = P.bird();
    b.scale.setScalar(2.4);
    b.position.x = 10 + Math.random() * 8;
    pivot.add(b);
    root.add(pivot);
    birds.push({ pivot, bird: b, speed: 0.25 + Math.random() * 0.2, phase: Math.random() * 6 });
  }

  // sailboats circling offshore
  const boats = [];
  for (const [cx, cz, cr, col] of [[150, -140, 36, 0xe0483e], [-160, 120, 30, 0x2b6fd4], [190, 60, 26, 0xffc83d]]) {
    const b = P.sailboat(col);
    b.scale.setScalar(2.0);
    root.add(b);
    boats.push({ obj: b, cx, cz, cr, phase: Math.random() * 6, speed: 0.06 + Math.random() * 0.04 });
  }

  const _v = new THREE.Vector3();
  function update(t, dt, camPos) {
    for (const n of notes) {
      const cyc = ((t * 0.5 + n.phase) % 3) / 3; // 0..1
      n.sp.position.set(
        n.base.x + Math.sin((t + n.phase) * 1.3) * 0.8,
        n.base.y + 0.5 + cyc * 6.5,
        n.base.z + Math.cos((t + n.phase) * 1.1) * 0.8
      );
      n.sp.material.opacity = Math.sin(cyc * Math.PI) * 0.95;
    }
    for (const c of clouds) {
      c.obj.position.x += c.speed * dt;
      if (c.obj.position.x > 380) c.obj.position.x = -380;
      if (camPos) c.obj.visible = c.obj.position.distanceToSquared(camPos) > 400;
    }
    for (const b of birds) {
      b.pivot.rotation.y += b.speed * dt;
      const flap = Math.sin(t * 8 + b.phase) * 0.7;
      b.bird.getObjectByName('wingL').rotation.z = flap;
      b.bird.getObjectByName('wingR').rotation.z = -flap;
    }
    for (const b of boats) {
      const a = t * b.speed + b.phase;
      b.obj.position.set(b.cx + Math.cos(a) * b.cr, 0.15 + Math.sin(t * 1.7 + b.phase) * 0.12, b.cz + Math.sin(a) * b.cr);
      b.obj.rotation.y = -a - Math.PI / 2;
      b.obj.rotation.z = Math.sin(t * 1.3 + b.phase) * 0.04;
    }
  }

  return { root, roadCurve, update, palmCourt: PALM_COURT };
}
