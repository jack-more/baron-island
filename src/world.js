// Assembles the planet: terrain, district set pieces, road loop, markers, ambient life.
import * as THREE from 'three';
import { PLANET_RADIUS as R, DISTRICTS } from './data.js';
import * as P from './props.js';

const _up = new THREE.Vector3(0, 1, 0);

export function latLonToNormal(lat, lon) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    Math.cos(la) * Math.cos(lo),
    Math.sin(la),
    Math.cos(la) * Math.sin(lo)
  );
}

function tangentFrame(n) {
  const e = new THREE.Vector3().crossVectors(_up, n);
  if (e.lengthSq() < 1e-6) e.set(1, 0, 0);
  e.normalize();
  const f = new THREE.Vector3().crossVectors(n, e).normalize();
  return { e, f };
}

// Place a base-origin prop on the sphere near `anchorN`, offset (x, z) along the local tangent frame.
function placeOn(parent, obj, anchorN, x = 0, z = 0, rotY = 0, lift = 0) {
  const { e, f } = tangentFrame(anchorN);
  const dir = anchorN.clone().multiplyScalar(R).addScaledVector(e, x).addScaledVector(f, z).normalize();
  obj.position.copy(dir).multiplyScalar(R + lift);
  obj.quaternion.setFromUnitVectors(_up, dir);
  if (rotY) obj.rotateY(rotY);
  parent.add(obj);
  return obj;
}

// Sphere-cap ground patch. Stays centered on the planet origin — only rotated,
// never displaced (placeOn would shove the whole shell off the surface).
function offsetNormal(anchorN, x, z) {
  const { e, f } = tangentFrame(anchorN);
  return anchorN.clone().multiplyScalar(R).addScaledVector(e, x).addScaledVector(f, z).normalize();
}
function addGroundCap(parent, anchorN, capRadius, color, lift = 0.07, x = 0, z = 0) {
  const capAng = capRadius / R;
  const geo = new THREE.SphereGeometry(R + lift, 48, 20, 0, Math.PI * 2, 0, capAng);
  const m = new THREE.Mesh(geo, P.toon(color));
  m.receiveShadow = true;
  m.quaternion.setFromUnitVectors(_up, offsetNormal(anchorN, x, z));
  parent.add(m);
  return m;
}

// ---------- planet surface ----------
function buildPlanetMesh() {
  const geo = new THREE.SphereGeometry(R, 96, 64);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grass = new THREE.Color(0x7fbf6e);
  const grassDark = new THREE.Color(0x69a95c);
  const sand = new THREE.Color(0xd9c58e);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n1 = Math.sin(x * 0.35 + z * 0.2) * Math.cos(y * 0.3 + x * 0.15) + Math.sin(z * 0.5 - y * 0.25);
    if (n1 > 1.05) tmp.copy(sand);
    else if (n1 < -0.75) tmp.copy(grassDark);
    else tmp.copy(grass).lerp(grassDark, (n1 + 1) * 0.18);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, P.toon(0xffffff, { vertexColors: true }));
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- road ribbon ----------
function buildRoad(anchors) {
  const raised = anchors.map(a => a.clone().multiplyScalar(R));
  const curve = new THREE.CatmullRomCurve3(raised, true, 'centripetal', 0.9);
  const N = 240, width = 0.75, lift = 0.09;
  const verts = [], idx = [];
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const p = curve.getPoint(t).setLength(R + lift);
    pts.push(p);
  }
  for (let i = 0; i < N; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % N];
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
  const mesh = new THREE.Mesh(geo, P.toon(0xe6d3a3));
  mesh.receiveShadow = true;
  return { mesh, curve, samples: pts };
}

// ---------- district set pieces ----------
function buildSouthCentral(g, n) {
  addGroundCap(g, n, 6.2, 0x9db568, 0.06);
  const courtGrp = P.court(5, 3.4, '#565b66', '#fdf8ef', '#e0483e');
  placeOn(g, courtGrp, n, 0, 0, 0.2, 0.08);
  // chain-link around the court
  placeOn(g, P.fence(5.4), n, 0, -2.1, 0.2, 0.08);
  placeOn(g, P.fence(5.4), n, 0, 2.1, 0.2, 0.08);
  placeOn(g, P.fence(3.6), n, -2.85, 0, 0.2 + Math.PI / 2, 0.08);
  placeOn(g, P.fence(3.6), n, 2.85, 0, 0.2 + Math.PI / 2, 0.08);
  // block of houses
  placeOn(g, P.house(1.8, 1.1, 1.5, 0xf2d8b0, 0xc95f45), n, -4.4, -2.2, 0.9);
  placeOn(g, P.house(1.6, 1.0, 1.4, 0xbfd9c9, 0x8a6b4a), n, -4.8, 0.2, 1.4);
  placeOn(g, P.house(1.7, 1.2, 1.5, 0xf6e2c4, 0x5f7ea8), n, -4.2, 2.4, 2.0);
  placeOn(g, P.shop('MARKET', '#e0483e'), n, 3.2, -3.4, -2.4);
  placeOn(g, P.busStop(), n, 4.6, 0.4, -Math.PI / 2);
  // palms + streetlights + power lines
  placeOn(g, P.palm(1.15), n, -1.8, -4.2);
  placeOn(g, P.palm(0.95), n, 2.4, 4.2);
  placeOn(g, P.palm(1.05), n, 5.2, -1.8);
  placeOn(g, P.streetlight(), n, -3.2, 3.8, 1.2);
  const p1 = placeOn(g, P.powerPole(), n, -0.5, -5.2);
  const p2 = placeOn(g, P.powerPole(), n, 3.6, -5.0);
  const a1 = p1.localToWorld(new THREE.Vector3(0, 2.7, 0));
  const a2 = p2.localToWorld(new THREE.Vector3(0, 2.7, 0));
  g.add(P.wireBetween(a1, a2, 0.3));
  // young Baron on the court, dribbling
  const baron = P.kid(0x8a5a3b, 0x2b6fd4);
  placeOn(g, baron, n, 0.8, 0.4, -0.7, 0.14);
  const bball = P.basketball();
  placeOn(g, bball, n, 1.05, 0.62, 0, 0.14);
  const fan1 = P.kid(0x6e4429, 0xe0483e, 0x2c3240);
  placeOn(g, fan1, n, 2.5, 2.35, Math.PI, 0.08);
  return { animated: { baron, bball } };
}

function buildCrossroads(g, n) {
  addGroundCap(g, n, 6.2, 0xa8bd7d, 0.06);
  placeOn(g, P.gym('CROSSROADS'), n, -2.6, -1.6, 0.6);
  placeOn(g, P.campusHall(3, 2, 2.2), n, 2.6, -2.2, -0.5);
  const courtGrp = P.court(4.2, 2.9, '#3f66a8', '#fdf8ef', '#ffc83d');
  placeOn(g, courtGrp, n, 0.6, 2.6, 1.3, 0.08);
  placeOn(g, P.tree(1.2, 0x5eab63), n, -4.6, 1.8);
  placeOn(g, P.tree(1.0, 0x6fbf74), n, 4.8, 0.6);
  placeOn(g, P.tree(1.35, 0x4f9c58), n, -1.2, -4.6);
  placeOn(g, P.tree(0.9, 0x5eab63), n, 3.8, 3.6);
  placeOn(g, P.streetlight(), n, -0.8, 0.6, 2.2);
  // scattered VHS tapes (story props)
  for (const [x, z] of [[1.9, 0.4], [-1.3, 2.9], [-3.5, 3.4]]) {
    placeOn(g, P.box(0.34, 0.1, 0.22, 0x22262e, 0, 0.05, 0), n, x, z, Math.random() * 3, 0.08);
  }
  return {};
}

function buildOakland(g, n) {
  addGroundCap(g, n, 6.4, 0x9caf72, 0.06);
  const arenaGrp = P.arena(1.25, 0xf0e6d2, 0xfdf8ef, 0xffc83d, 'BELIEVE');
  placeOn(g, arenaGrp, n, -1.6, -1.2, 2.75);
  // bay water + bridge + port cranes
  addGroundCap(g, n, 2.8, 0x5fa8c9, 0.045, 5.4, 3.6);
  placeOn(g, P.bridge(6.6, 2.4), n, 5.4, 3.6, 0.65, 0.05);
  placeOn(g, P.crane(), n, 3.4, -3.8, 2.2);
  placeOn(g, P.crane(), n, 4.6, -2.4, 2.0);
  placeOn(g, P.towerBlock(1.4, 1.8, 1.4, '#c9b8a0', '#ffe9b8', 3, 3), n, 1.6, -4.6, 0.4);
  // rally flags
  for (const [x, z, r] of [[1.8, 1.6, 0.4], [2.6, 0.4, -0.3], [1.2, 2.9, 1.1]]) {
    const flag = new THREE.Group();
    flag.add(P.cyl(0.03, 0.03, 1.6, 0x3a4150, 0, 0.8, 0, 6));
    flag.add(P.box(0.72, 0.4, 0.04, 0xffc83d, 0.38, 1.35, 0));
    placeOn(g, flag, n, x, z, r);
  }
  placeOn(g, P.tree(1.1, 0x4f9c58), n, -4.8, 2.2);
  placeOn(g, P.streetlight(), n, 0.4, 3.4, -0.4);
  return {};
}

function buildDowntown(g, n) {
  addGroundCap(g, n, 6.2, 0xb9b3a2, 0.06);
  const arenaGrp = P.arena(1.0, 0xe6e0d2, 0xd8d3c6, 0xe0483e, 'LA');
  placeOn(g, arenaGrp, n, -1.8, 1.8, 2.0);
  placeOn(g, P.towerBlock(1.5, 4.6, 1.5, '#8fa3bd', '#ffe9b8', 9, 3), n, 2.8, -2.6, 0.3);
  placeOn(g, P.towerBlock(1.3, 3.4, 1.3, '#a8b8cf', '#ffe9b8', 7, 3), n, 4.3, -0.8, 0.8);
  placeOn(g, P.towerBlock(1.2, 2.6, 1.2, '#c4b49c', '#ffe9b8', 5, 3), n, 1.4, -4.4, -0.2);
  // plaza palms + lights
  placeOn(g, P.palm(1.1), n, 0.6, 3.8);
  placeOn(g, P.palm(1.0), n, 2.2, 3.0);
  placeOn(g, P.palm(1.2), n, -3.8, -1.6);
  placeOn(g, P.streetlight(), n, 0.2, 1.4, 0.8);
  placeOn(g, P.streetlight(), n, 2.0, 0.2, -1.6);
  // banner poles, red & blue
  for (const [x, z, c] of [[-0.6, 3.2, 0xe0483e], [-2.2, 3.6, 0x2b6fd4], [-3.6, 2.4, 0xe0483e]]) {
    const bp = new THREE.Group();
    bp.add(P.cyl(0.03, 0.03, 1.9, 0x3a4150, 0, 0.95, 0, 6));
    bp.add(P.box(0.34, 0.7, 0.04, c, 0.2, 1.45, 0));
    placeOn(g, bp, n, x, z);
  }
  const fan = P.kid(0x6e4429, 0xe0483e);
  placeOn(g, fan, n, -0.4, 2.6, 2.6, 0.08);
  const fan2 = P.kid(0x8a5a3b, 0x2b6fd4);
  placeOn(g, fan2, n, -1.2, 3.1, 2.2, 0.08);
  return {};
}

function buildTower(g, n) {
  addGroundCap(g, n, 6.0, 0x8fae9a, 0.06);
  const tower = P.glassTower(6.5);
  placeOn(g, tower, n, -1.4, -1.2, 0.5);
  placeOn(g, P.towerBlock(1.6, 2.8, 1.6, '#3c4f68', '#ffd98a', 5, 4), n, 2.4, -2.8, 0.2);
  placeOn(g, P.towerBlock(1.3, 2.0, 1.3, '#54677f', '#ffd98a', 4, 3), n, 3.8, -0.6, -0.4);
  const portal = P.portalRing(1.05);
  placeOn(g, portal, n, 2.2, 3.2);
  // B.I.G. billboard
  const bb = new THREE.Group();
  bb.add(P.cyl(0.06, 0.08, 2.2, 0x3a4150, 0, 1.1, 0, 8));
  const tex = P.bannerTexture('B.I.G.', '#1d2430', '#9a6bff', 88);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.62, 0.1), new THREE.MeshToonMaterial({ map: tex }));
  sign.position.y = 2.5; sign.castShadow = true;
  bb.add(sign);
  placeOn(g, bb, n, -0.4, 3.6, -0.5);
  placeOn(g, P.tree(1.1, 0x3f8f6a), n, -4.2, 1.6);
  placeOn(g, P.tree(0.9, 0x3f8f6a), n, 0.8, 4.7);
  placeOn(g, P.streetlight(), n, 0.6, 1.8, 1.9);
  return { animated: { portal } };
}

const BUILDERS = {
  'south-central': buildSouthCentral,
  'crossroads-ucla': buildCrossroads,
  'oakland': buildOakland,
  'downtown-la': buildDowntown,
  'investor-tower': buildTower,
};

// ---------- markers ----------
function buildMarker(color) {
  const g = new THREE.Group();
  const pin = new THREE.Group();
  const head = P.ball(0.55, color, 0, 1.9, 0, 16);
  head.material = P.toon(color, { emissive: color, emissiveIntensity: 0.35 });
  const tip = P.cone(0.34, 1.1, color, 0, 1.0, 0, 12);
  tip.material = head.material;
  tip.rotation.x = Math.PI;
  pin.add(head, tip);
  pin.name = 'pin';
  g.add(pin);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 1.0, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  ring.name = 'ring';
  g.add(ring);
  // generous invisible hitbox
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 1.6;
  hit.name = 'hit';
  g.add(hit);
  return g;
}

// ---------- deco scatter ----------
function scatterDeco(root, anchors, roadSamples) {
  const count = 170;
  for (let i = 0; i < count; i++) {
    const n = new THREE.Vector3().randomDirection();
    if (anchors.some(a => a.angleTo(n) < 0.34)) continue;
    const p = n.clone().multiplyScalar(R);
    if (roadSamples.some(s => s.distanceToSquared(p) < 4.5)) continue;
    const roll = Math.random();
    let obj;
    if (roll < 0.42) obj = P.tree(0.7 + Math.random() * 0.8, [0x5eab63, 0x6fbf74, 0x4f9c58][i % 3]);
    else if (roll < 0.6) obj = P.palm(0.7 + Math.random() * 0.6);
    else if (roll < 0.78) obj = P.rock(0.7 + Math.random() * 1.2);
    else obj = P.house(1.1 + Math.random() * 0.6, 0.8, 1.0, [0xf2d8b0, 0xbfd9c9, 0xf6e2c4, 0xd9b8a8][i % 4], [0xc95f45, 0x8a6b4a, 0x5f7ea8][i % 3]);
    placeOn(root, obj, n, 0, 0, Math.random() * Math.PI * 2);
  }
}

// ---------- ambient life ----------
function buildClouds(root) {
  const clouds = [];
  for (let i = 0; i < 13; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
    const c = P.cloud(0.9 + Math.random() * 1.3);
    c.position.set(0, R + 10 + Math.random() * 6, 0);
    pivot.add(c);
    root.add(pivot);
    clouds.push({ pivot, speed: (0.008 + Math.random() * 0.012) * (Math.random() < 0.5 ? 1 : -1) });
  }
  return clouds;
}

function buildBirds(root) {
  const birds = [];
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
    const b = P.bird();
    b.position.set(0, R + 3.5 + Math.random() * 2.5, 0);
    pivot.add(b);
    root.add(pivot);
    birds.push({ pivot, bird: b, speed: 0.05 + Math.random() * 0.04, phase: Math.random() * 6 });
  }
  return birds;
}

// ---------- public ----------
export function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);

  root.add(buildPlanetMesh());

  const anchors = DISTRICTS.map(d => latLonToNormal(d.lat, d.lon));
  const road = buildRoad(anchors);
  root.add(road.mesh);

  const animated = [];
  const districts = DISTRICTS.map((def, i) => {
    const n = anchors[i];
    const g = new THREE.Group();
    const extras = BUILDERS[def.id](g, n) || {};
    if (extras.animated) animated.push(extras.animated);
    root.add(g);
    const marker = buildMarker(def.color);
    placeOn(root, marker, n, 0, -4.6, 0, 0.05);
    marker.userData.districtId = def.id;
    return { def, anchor: n, marker, group: g };
  });

  scatterDeco(root, anchors, road.samples);
  const clouds = buildClouds(root);
  const birds = buildBirds(root);

  // cars cruising the loop
  const cars = [0, 0.33, 0.66].map((offset, i) => {
    const c = P.car([0xe0483e, 0x2b6fd4, 0xffc83d][i]);
    root.add(c);
    return { obj: c, offset, speed: 0.011 + i * 0.002 };
  });

  const baronAnim = animated.find(a => a.baron);
  const portalAnim = animated.find(a => a.portal);

  const _cw = new THREE.Vector3();
  function update(t, dt, camPos) {
    for (const c of clouds) {
      c.pivot.rotateY(c.speed * dt);
      if (camPos) {
        c.pivot.children[0].getWorldPosition(_cw);
        c.pivot.children[0].visible = _cw.distanceToSquared(camPos) > 64;
      }
    }
    for (const b of birds) {
      b.pivot.rotateY(b.speed * dt);
      const flap = Math.sin(t * 9 + b.phase) * 0.7;
      b.bird.getObjectByName('wingL').rotation.z = flap;
      b.bird.getObjectByName('wingR').rotation.z = -flap;
    }
    for (const d of districts) {
      const pin = d.marker.getObjectByName('pin');
      pin.position.y = 0.25 + Math.sin(t * 2 + d.anchor.x * 5) * 0.18;
      const ring = d.marker.getObjectByName('ring');
      const s = 1 + Math.sin(t * 2.4) * 0.08;
      ring.scale.set(s, s, 1);
    }
    if (baronAnim) {
      const bounce = Math.abs(Math.sin(t * 5.2));
      baronAnim.bball.position.copy(
        baronAnim.bball.userData.base ??
        (baronAnim.bball.userData.base = baronAnim.bball.position.clone())
      );
      const nrm = baronAnim.bball.position.clone().normalize();
      baronAnim.bball.position.addScaledVector(nrm, bounce * 0.5);
      baronAnim.baron.position.copy(
        baronAnim.baron.userData.base ??
        (baronAnim.baron.userData.base = baronAnim.baron.position.clone())
      );
      baronAnim.baron.position.addScaledVector(nrm, Math.max(0, Math.sin(t * 5.2 + 1.4)) * 0.06);
    }
    if (portalAnim) {
      portalAnim.portal.getObjectByName('spin').rotation.y = t * 0.8;
    }
    for (const car of cars) {
      const tt = (t * car.speed + car.offset) % 1;
      const p = road.curve.getPoint(tt).setLength(R + 0.12);
      const ahead = road.curve.getPoint((tt + 0.004) % 1).setLength(R + 0.12);
      car.obj.position.copy(p);
      const up = p.clone().normalize();
      const fwd = ahead.sub(p).normalize();
      const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
      const fixedFwd = new THREE.Vector3().crossVectors(right, up).normalize();
      const m = new THREE.Matrix4().makeBasis(fixedFwd, up, right);
      car.obj.quaternion.setFromRotationMatrix(m);
    }
  }

  return { root, districts, update, roadCurve: road.curve };
}
