// Landmark set pieces on the Oatmeal Planet, plus the interactive layer:
// gold mission rings, pop-balloons, the sponsor blimp, cars cruising the
// great-circle road. Everything is placed in each landmark's tangent frame.
import * as THREE from 'three';
import { LANDMARKS } from './data.js';
import { PLANET_R, ANCHORS, heightField, placeOnPlanet, tangentFrame } from './island.js';
import * as P from './props.js';
import { getHifi } from './assets.js';

// per-landmark placement helper: (obj, dx, dz, rotY, lift) in the anchor's tangent frame
function makePut(root, anchorN) {
  return (obj, dx = 0, dz = 0, rotY = 0, lift = 0) =>
    placeOnPlanet(root, obj, anchorN, dx, dz, rotY, lift);
}

function buildSouthCentral(put) {
  put(P.court(10, 6.8, '#565b66', '#fdf8ef', '#e0483e'), 0, 0, 0.2, 0.1);
  put(P.fence(11, 2.2), 0, -4.2, 0.2, 0.1);
  put(P.fence(11, 2.2), 0, 4.2, 0.2, 0.1);
  put(P.fence(7.2, 2.2), -5.7, 0, 0.2 + Math.PI / 2, 0.1);
  put(P.fence(7.2, 2.2), 5.7, 0, 0.2 + Math.PI / 2, 0.1);
  for (const [hx, hz, r, wc, rc] of [
    [-12, -6, 0.9, 0xf2d8b0, 0xc95f45],
    [-13, 1, 1.4, 0xbfd9c9, 0x8a6b4a],
    [-11, 7, 2.0, 0xf6e2c4, 0x5f7ea8],
    [3, 11, 3.4, 0xd9b8a8, 0xc95f45],
  ]) put(P.house(3.6, 2.2, 3.0, wc, rc), hx, hz, r);
  const shop = P.shop('MARKET', '#e0483e');
  shop.scale.setScalar(2);
  put(shop, 9, -8, -2.4);
  put(P.busStop(), 12, 1, -Math.PI / 2).scale.setScalar(1.8);
  put(P.palm(2.2), -5, -10);
  put(P.palm(1.9), 6, 9);
  put(P.palm(2.0), 13, -4);
  put(P.streetlight(4.4), -8, 9, 1.2);
  const baron = P.kid(0x8a5a3b, 0x2b6fd4);
  baron.scale.setScalar(2.4);
  const bb = put(baron, 1.8, 0.8, -0.7, 0.2);
  const ball = P.basketball(0.22);
  const bl = put(ball, 2.4, 1.3, 0, 0.2);
  const fan = P.kid(0x6e4429, 0xe0483e, 0x2c3240);
  fan.scale.setScalar(2.2);
  put(fan, 6, 4.8, Math.PI, 0.1);
  return { baron: bb, bball: bl };
}

function buildCrossroads(put) {
  const gym = P.gym('CROSSROADS');
  gym.scale.setScalar(2.2);
  put(gym, -7, -4, 2.4);
  const hall = P.campusHall(3, 2, 2.2);
  hall.scale.setScalar(2.4);
  put(hall, 7, -6, -2.0);
  put(P.court(9, 6.2, '#3f66a8', '#fdf8ef', '#ffc83d'), 2, 7, 1.3, 0.1);
  put(P.tree(2.6, 0x5eab63), -12, 5);
  put(P.tree(2.2, 0x6fbf74), 13, 2);
  put(P.tree(3.0, 0x4f9c58), -3, -12);
  put(P.streetlight(4.4), -2, 1, 2.2);
  for (const [tx, tz] of [[5, 1], [-4, 8], [-9, 9]]) {
    put(P.box(0.8, 0.24, 0.5, 0x22262e, 0, 0.12, 0), tx, tz, Math.random() * 3, 0.1);
  }
  return {};
}

function buildOakland(put) {
  const arena = P.arena(1.25, 0xf0e6d2, 0xfdf8ef, 0xffc83d, 'BELIEVE');
  arena.scale.setScalar(2.6);
  put(arena, -4, -3, 2.75);
  const crane1 = P.crane(); crane1.scale.setScalar(2.6);
  put(crane1, 9, -10, 2.2);
  const crane2 = P.crane(); crane2.scale.setScalar(2.4);
  put(crane2, 12, -5, 2.0);
  const wh = P.towerBlock(1.4, 1.8, 1.4, '#c9b8a0', '#ffe9b8', 3, 3);
  wh.scale.setScalar(2.6);
  put(wh, 4, -12, 0.4);
  for (const [fx, fz, r] of [[4, 4, 0.4], [7, 1, -0.3], [3, 7, 1.1]]) {
    const flag = new THREE.Group();
    flag.add(P.cyl(0.06, 0.06, 3.4, 0x3a4150, 0, 1.7, 0, 6));
    flag.add(P.box(1.5, 0.85, 0.08, 0xffc83d, 0.8, 2.85, 0));
    put(flag, fx, fz, r);
  }
  put(P.tree(2.4, 0x4f9c58), -12, 5);
  put(P.streetlight(4.4), 1, 8, -0.4);
  put(P.box(3, 0.4, 16, 0x8a6b4a, 0, 0, 0), 16, 8, 0.5, 1.4); // pier
  return {};
}

function buildDowntown(put) {
  const arena = P.arena(1.0, 0xe6e0d2, 0xd8d3c6, 0xe0483e, 'LA');
  arena.scale.setScalar(2.4);
  put(arena, -5, 5, -0.6);
  const t1 = getHifi('building_H', 12) || (() => { const b = P.towerBlock(1.5, 4.6, 1.5, '#8fa3bd', '#ffe9b8', 9, 3); b.scale.setScalar(2.6); return b; })();
  put(t1, 7, -7, 0.3);
  const t2 = getHifi('building_E', 9) || (() => { const b = P.towerBlock(1.3, 3.4, 1.3, '#a8b8cf', '#ffe9b8', 7, 3); b.scale.setScalar(2.6); return b; })();
  put(t2, 11, -1, 0.8);
  const t3 = getHifi('building_B', 7);
  if (t3) put(t3, 15, -5, 1.2);
  const bench = getHifi('bench', 1.1);
  if (bench) put(bench, -1, 4.5, 0.8);
  const hyd = getHifi('hydrant', 0.9);
  if (hyd) put(hyd, 2.5, 4.8, 0);
  put(P.domeBuilding(2.6, 3.2, '#f6ead2', 0xffc83d), 3, -12, -0.2);
  put(P.domeBuilding(1.8, 2.2, '#d9ecf2', 0xe0483e), 13, -8, 0.5);
  put(P.palm(2.2), 1, 10);
  put(P.palm(2.0), 6, 8);
  put(P.palm(2.4), -10, -4);
  put(P.streetlight(4.4), 0, 3, 0.8);
  for (const [bx, bz, c] of [[-2, 8, 0xe0483e], [-6, 9, 0x2b6fd4], [-9, 6, 0xe0483e]]) {
    const bp = new THREE.Group();
    bp.add(P.cyl(0.06, 0.06, 4.0, 0x3a4150, 0, 2.0, 0, 6));
    bp.add(P.box(0.75, 1.5, 0.08, c, 0.45, 3.1, 0));
    put(bp, bx, bz);
  }
  for (const [kx, kz, sk, jc] of [[-1, 6.5, 0x6e4429, 0xe0483e], [-3, 7.5, 0x8a5a3b, 0x2b6fd4]]) {
    const kd = P.kid(sk, jc);
    kd.scale.setScalar(2.2);
    put(kd, kx, kz, 2.4, 0.1);
  }
  return {};
}

function buildTower(put) {
  const tower = P.glassTower(6.5);
  tower.scale.setScalar(2.6);
  put(tower, -4, -3, 0.5);
  const corp = P.domeBuilding(4.6, 3.4, '#f3efe4', 0xffc83d, 'OATMEAL CORP.');
  put(corp, 7, -6, 2.4);
  put(P.domeBuilding(2.0, 2.4, '#d9ecf2', 0x9a6bff), 11, 1, -0.4);
  const portal = P.portalRing(1.05);
  portal.scale.setScalar(2.6);
  const portalRef = put(portal, 5, 8);
  const bb = new THREE.Group();
  bb.add(P.cyl(0.12, 0.16, 4.4, 0x3a4150, 0, 2.2, 0, 8));
  const tex = P.bannerTexture('SLIC', '#1d2430', '#9a6bff', 88);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.25, 0.2), P.toonMap(tex));
  sign.position.y = 5.0; sign.castShadow = true;
  bb.add(sign);
  put(bb, -1, 9, -0.5);
  put(P.tree(2.4, 0x3f8f6a), -10, 4);
  put(P.streetlight(4.4), 1, 4, 1.9);
  return { portal: portalRef };
}

const BUILDERS = {
  'south-central': buildSouthCentral,
  'crossroads-ucla': buildCrossroads,
  'oakland': buildOakland,
  'downtown-la': buildDowntown,
  'investor-tower': buildTower,
};

export function buildLandmarks(scene, roadCurve) {
  const root = new THREE.Group();
  scene.add(root);

  const animated = {};
  const landmarks = LANDMARKS.map((def) => {
    const anchorN = ANCHORS[def.id];
    const put = makePut(root, anchorN);
    Object.assign(animated, BUILDERS[def.id](put) || {});
    // mission gate: a walk-through ring at ground level + a 2K-style light beam
    const ring = P.goldRing(3);
    const ringR = PLANET_R + Math.max(def.ground, 0.45) + 3.0;
    ring.position.copy(anchorN).multiplyScalar(ringR);
    const { e } = tangentFrame(anchorN);
    const m = new THREE.Matrix4().makeBasis(
      new THREE.Vector3().crossVectors(anchorN, e).normalize(),
      anchorN.clone(),
      e.clone()
    );
    ring.quaternion.setFromRotationMatrix(m);
    ring.userData.normal = e.clone(); // pickup plane normal
    root.add(ring);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd98a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.9, 34, 18, 1, true), beamMat);
    beam.position.copy(anchorN).multiplyScalar(PLANET_R + Math.max(def.ground, 0.45) + 17);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), anchorN);
    root.add(beam);
    return {
      def, ring,
      anchor: anchorN,
      center: anchorN.clone().multiplyScalar(ringR),
      surface: anchorN.clone().multiplyScalar(PLANET_R + def.ground),
    };
  });

  // balloons scattered around the whole globe
  const balloons = [];
  for (let i = 0; i < 26; i++) {
    const n = new THREE.Vector3().randomDirection();
    const b = P.starBalloon([0xffc83d, 0xff7a4d, 0x9a6bff, 0x4d7dff, 0xe0483e][i % 5]);
    b.scale.setScalar(2.0);
    const alt = 3.4 + Math.random() * 2.6;
    b.position.copy(n).multiplyScalar(PLANET_R + Math.max(heightField(n), 0) + alt);
    b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    root.add(b);
    balloons.push({ obj: b, up: n, popped: false, phase: Math.random() * 6, poppedAt: 0, baseR: b.position.length() });
  }

  // sponsor blimp orbits the globe on a tilted ring
  const blimpObj = P.blimp('OATMEAL RADIO');
  blimpObj.scale.setScalar(2.6);
  const blimpPivot = new THREE.Group();
  blimpPivot.rotation.set(0.3, 0, 0.15);
  scene.add(blimpPivot);
  blimpPivot.add(blimpObj);
  blimpObj.position.set(0, PLANET_R + 32, 0);
  blimpObj.rotation.x = Math.PI / 2;

  const cars = [0, 0.2, 0.45, 0.7, 0.9].map((offset, i) => {
    const hifiCar = getHifi(i % 2 ? 'car_sedan' : 'car_hatchback', 1.8);
    const c = hifiCar || (i % 2 ? P.sportsCar([0xe0483e, 0xffc83d, 0x1d2430][i % 3], 2.0) : P.capsuleCar([0x2b6fd4, 0x3f8f6a][i % 2]));
    if (!hifiCar && !(i % 2)) c.scale.setScalar(2.2);
    root.add(c);
    return { obj: c, offset, speed: 0.004 + (i % 2) * 0.0012, hover: false, flip: !!hifiCar };
  });

  const _p = new THREE.Vector3();
  const _ahead = new THREE.Vector3();
  const _up2 = new THREE.Vector3();
  function update(t, dt) {
    for (const L of landmarks) {
      const hoop = L.ring.getObjectByName('hoopMesh');
      hoop.rotation.z = t * 0.4;
    }
    for (const b of balloons) {
      if (b.popped) {
        const k = Math.min(1, (t - b.poppedAt) * 5);
        b.obj.scale.setScalar(2.0 * (1 + k * 1.5));
        b.obj.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, 1 - k * 1.4); } });
        if (k >= 1) b.obj.visible = false;
      } else {
        b.obj.position.copy(b.up).multiplyScalar(b.baseR + Math.sin(t * 1.4 + b.phase) * 0.6);
        b.obj.rotateY(dt * 0.3);
      }
    }
    blimpPivot.rotation.y = t * 0.02;
    if (animated.baron && animated.bball) {
      const bounce = Math.abs(Math.sin(t * 5.2));
      if (!animated.bball.userData.baseP) animated.bball.userData.baseP = animated.bball.position.clone();
      _up2.copy(animated.bball.userData.baseP).normalize();
      animated.bball.position.copy(animated.bball.userData.baseP).addScaledVector(_up2, bounce * 1.1);
    }
    if (animated.portal) {
      const spin = animated.portal.getObjectByName('spin');
      if (spin) spin.rotation.y = t * 0.8;
    }
    for (const car of cars) {
      const tt = (t * car.speed + car.offset) % 1;
      roadCurve.getPoint(tt, _p).normalize();
      const r = PLANET_R + Math.max(heightField(_p), 0.15) + 0.3;
      const pos = _p.clone().multiplyScalar(r);
      roadCurve.getPoint((tt + 0.002) % 1, _ahead).normalize().multiplyScalar(r);
      car.obj.position.copy(pos);
      const upC = pos.clone().normalize();
      const fwd = _ahead.sub(pos).normalize();
      const right = new THREE.Vector3().crossVectors(fwd, upC).normalize();
      const m = new THREE.Matrix4().makeBasis(right, upC, fwd.clone().negate());
      car.obj.quaternion.setFromRotationMatrix(m);
      if (car.flip) car.obj.rotateY(Math.PI);
    }
  }

  return { root, landmarks, balloons, update };
}
