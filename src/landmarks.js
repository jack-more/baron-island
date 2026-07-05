// Landmark set pieces on Baron Island, plus the interactive layer:
// golden mission rings, pop-balloons, the sponsor blimp, cars on the loop road.
import * as THREE from 'three';
import { LANDMARKS } from './data.js';
import { terrainHeight } from './island.js';
import * as P from './props.js';

function put(root, obj, x, z, rotY = 0, lift = 0) {
  obj.position.set(x, terrainHeight(x, z) + lift, z);
  obj.rotation.y = rotY;
  root.add(obj);
  return obj;
}

// each builder gets a group centered at (0,0) => uses put() with absolute coords
function buildSouthCentral(g, L) {
  const { x, z } = L;
  put(g, P.court(10, 6.8, '#565b66', '#fdf8ef', '#e0483e'), x, z, 0.2, 0.1);
  put(g, P.fence(11, 2.2), x, z - 4.2, 0.2, 0.1);
  put(g, P.fence(11, 2.2), x, z + 4.2, 0.2, 0.1);
  put(g, P.fence(7.2, 2.2), x - 5.7, z, 0.2 + Math.PI / 2, 0.1);
  put(g, P.fence(7.2, 2.2), x + 5.7, z, 0.2 + Math.PI / 2, 0.1);
  const hs = [
    [x - 12, z - 6, 0.9, 0xf2d8b0, 0xc95f45],
    [x - 13, z + 1, 1.4, 0xbfd9c9, 0x8a6b4a],
    [x - 11, z + 7, 2.0, 0xf6e2c4, 0x5f7ea8],
    [x + 3, z + 11, 3.4, 0xd9b8a8, 0xc95f45],
  ];
  for (const [hx, hz, r, wc, rc] of hs) {
    const h = P.house(3.6, 2.2, 3.0, wc, rc);
    put(g, h, hx, hz, r);
  }
  const shop = P.shop('MARKET', '#e0483e');
  shop.scale.setScalar(2);
  put(g, shop, x + 9, z - 8, -2.4);
  put(g, P.busStop(), x + 12, z + 1, -Math.PI / 2).scale.setScalar(1.8);
  put(g, P.palm(2.2), x - 5, z - 10);
  put(g, P.palm(1.9), x + 6, z + 9);
  put(g, P.palm(2.0), x + 13, z - 4);
  put(g, P.streetlight(4.4), x - 8, z + 9, 1.2);
  const p1 = put(g, P.powerPole(6), x - 2, z - 12);
  const p2 = put(g, P.powerPole(6), x + 8, z - 11.5);
  const a1 = p1.localToWorld(new THREE.Vector3(0, 5.4, 0));
  const a2 = p2.localToWorld(new THREE.Vector3(0, 5.4, 0));
  g.add(P.wireBetween(a1, a2, 0.8));
  const baron = P.kid(0x8a5a3b, 0x2b6fd4);
  baron.scale.setScalar(2.4);
  const bb = put(g, baron, x + 1.8, z + 0.8, -0.7, 0.2);
  const ball = P.basketball(0.22);
  const bl = put(g, ball, x + 2.4, z + 1.3, 0, 0.2);
  const fan = P.kid(0x6e4429, 0xe0483e, 0x2c3240);
  fan.scale.setScalar(2.2);
  put(g, fan, x + 6, z + 4.8, Math.PI, 0.1);
  return { baron: bb, bball: bl };
}

function buildCrossroads(g, L) {
  const { x, z } = L;
  const gym = P.gym('CROSSROADS');
  gym.scale.setScalar(2.2);
  put(g, gym, x - 7, z - 4, 2.4);
  const hall = P.campusHall(3, 2, 2.2);
  hall.scale.setScalar(2.4);
  put(g, hall, x + 7, z - 6, -2.0);
  put(g, P.court(9, 6.2, '#3f66a8', '#fdf8ef', '#ffc83d'), x + 2, z + 7, 1.3, 0.1);
  put(g, P.tree(2.6, 0x5eab63), x - 12, z + 5);
  put(g, P.tree(2.2, 0x6fbf74), x + 13, z + 2);
  put(g, P.tree(3.0, 0x4f9c58), x - 3, z - 12);
  put(g, P.streetlight(4.4), x - 2, z + 1, 2.2);
  for (const [tx, tz] of [[x + 5, z + 1], [x - 4, z + 8], [x - 9, z + 9]]) {
    put(g, P.box(0.8, 0.24, 0.5, 0x22262e, 0, 0.12, 0), tx, tz, Math.random() * 3, 0.1);
  }
  return {};
}

function buildOakland(g, L) {
  const { x, z } = L;
  const arena = P.arena(1.25, 0xf0e6d2, 0xfdf8ef, 0xffc83d, 'BELIEVE');
  arena.scale.setScalar(2.6);
  put(g, arena, x - 4, z - 3, 2.75);
  const crane1 = P.crane(); crane1.scale.setScalar(2.6);
  put(g, crane1, x + 9, z - 10, 2.2);
  const crane2 = P.crane(); crane2.scale.setScalar(2.4);
  put(g, crane2, x + 12, z - 5, 2.0);
  const wh = P.towerBlock(1.4, 1.8, 1.4, '#c9b8a0', '#ffe9b8', 3, 3);
  wh.scale.setScalar(2.6);
  put(g, wh, x + 4, z - 12, 0.4);
  for (const [fx, fz, r] of [[x + 4, z + 4, 0.4], [x + 7, z + 1, -0.3], [x + 3, z + 7, 1.1]]) {
    const flag = new THREE.Group();
    flag.add(P.cyl(0.06, 0.06, 3.4, 0x3a4150, 0, 1.7, 0, 6));
    flag.add(P.box(1.5, 0.85, 0.08, 0xffc83d, 0.8, 2.85, 0));
    put(g, flag, fx, fz, r);
  }
  put(g, P.tree(2.4, 0x4f9c58), x - 12, z + 5);
  put(g, P.streetlight(4.4), x + 1, z + 8, -0.4);
  // pier out into the harbor
  const pier = P.box(3, 0.4, 16, 0x8a6b4a, 0, 0, 0);
  pier.position.set(x + 16, 1.6, z + 8);
  pier.rotation.y = 0.5;
  g.add(pier);
  return {};
}

function buildDowntown(g, L) {
  const { x, z } = L;
  const arena = P.arena(1.0, 0xe6e0d2, 0xd8d3c6, 0xe0483e, 'LA');
  arena.scale.setScalar(2.4);
  put(g, arena, x - 5, z + 5, -0.6);
  const t1 = P.towerBlock(1.5, 4.6, 1.5, '#8fa3bd', '#ffe9b8', 9, 3);
  t1.scale.setScalar(2.6);
  put(g, t1, x + 7, z - 7, 0.3);
  const t2 = P.towerBlock(1.3, 3.4, 1.3, '#a8b8cf', '#ffe9b8', 7, 3);
  t2.scale.setScalar(2.6);
  put(g, t2, x + 11, z - 1, 0.8);
  const d1 = P.domeBuilding(2.6, 3.2, '#f6ead2', 0xffc83d);
  put(g, d1, x + 3, z - 12, -0.2);
  const d2 = P.domeBuilding(1.8, 2.2, '#d9ecf2', 0xe0483e);
  put(g, d2, x + 13, z - 8, 0.5);
  put(g, P.palm(2.2), x + 1, z + 10);
  put(g, P.palm(2.0), x + 6, z + 8);
  put(g, P.palm(2.4), x - 10, z - 4);
  put(g, P.streetlight(4.4), x, z + 3, 0.8);
  put(g, P.streetlight(4.4), x + 5, z, -1.6);
  for (const [bx, bz, c] of [[x - 2, z + 8, 0xe0483e], [x - 6, z + 9, 0x2b6fd4], [x - 9, z + 6, 0xe0483e]]) {
    const bp = new THREE.Group();
    bp.add(P.cyl(0.06, 0.06, 4.0, 0x3a4150, 0, 2.0, 0, 6));
    bp.add(P.box(0.75, 1.5, 0.08, c, 0.45, 3.1, 0));
    put(g, bp, bx, bz);
  }
  for (const [kx, kz, sk, jc] of [[x - 1, z + 6.5, 0x6e4429, 0xe0483e], [x - 3, z + 7.5, 0x8a5a3b, 0x2b6fd4]]) {
    const kd = P.kid(sk, jc);
    kd.scale.setScalar(2.2);
    put(g, kd, kx, kz, 2.4, 0.1);
  }
  return {};
}

function buildTower(g, L) {
  const { x, z } = L;
  const tower = P.glassTower(6.5);
  tower.scale.setScalar(2.6);
  put(g, tower, x - 4, z - 3, 0.5);
  const corp = P.domeBuilding(4.6, 3.4, '#f3efe4', 0xffc83d, 'BARON CORP.');
  put(g, corp, x + 7, z - 6, Math.atan2(-x - 7, -z + 6) + Math.PI);
  const o2 = P.domeBuilding(2.0, 2.4, '#d9ecf2', 0x9a6bff);
  put(g, o2, x + 11, z + 1, -0.4);
  const portal = P.portalRing(1.05);
  portal.scale.setScalar(2.6);
  const portalRef = put(g, portal, x + 5, z + 8);
  const bb = new THREE.Group();
  bb.add(P.cyl(0.12, 0.16, 4.4, 0x3a4150, 0, 2.2, 0, 8));
  const tex = P.bannerTexture('B.I.G.', '#1d2430', '#9a6bff', 88);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.25, 0.2), P.toonMap(tex));
  sign.position.y = 5.0; sign.castShadow = true;
  bb.add(sign);
  put(g, bb, x - 1, z + 9, -0.5);
  put(g, P.tree(2.4, 0x3f8f6a), x - 10, z + 4);
  put(g, P.tree(2.0, 0x3f8f6a), x + 2, z + 12);
  put(g, P.streetlight(4.4), x + 1, z + 4, 1.9);
  return { portal: portalRef };
}

const BUILDERS = {
  'south-central': buildSouthCentral,
  'crossroads-ucla': buildCrossroads,
  'oakland': buildOakland,
  'downtown-la': buildDowntown,
  'investor-tower': buildTower,
};

const BALLOON_SPOTS = [
  [40, 140, 22], [130, 30, 30], [150, -60, 26], [90, -120, 34], [0, -150, 40],
  [-90, -110, 36], [-150, -30, 30], [-150, 80, 26], [-60, 150, 24], [30, 90, 45],
  [-60, -20, 60], [60, -30, 68], [0, 60, 38], [-30, 100, 30], [110, -20, 42],
  [12, -95, 52], [-115, -70, 44], [170, -110, 28], [-40, 40, 74], [80, 40, 36], [172, 148, 18],
];

export function buildLandmarks(scene, roadCurve) {
  const root = new THREE.Group();
  scene.add(root);

  const animated = {};
  const landmarks = LANDMARKS.map((def) => {
    const g = new THREE.Group();
    Object.assign(animated, BUILDERS[def.id](g, def) || {});
    root.add(g);
    // mission ring floats above the landmark
    const ring = P.goldRing(7);
    const ringY = def.ground + 16;
    ring.position.set(def.x, ringY, def.z);
    // face the ring across the likely approach (tangent to island loop)
    ring.rotation.y = Math.atan2(def.x, def.z) + Math.PI / 2;
    root.add(ring);
    return { def, ring, center: new THREE.Vector3(def.x, ringY, def.z), group: g };
  });

  const balloons = BALLOON_SPOTS.map(([x, z, y], i) => {
    const b = P.starBalloon([0xffc83d, 0xff7a4d, 0x9a6bff, 0x4d7dff, 0xe0483e][i % 5]);
    b.scale.setScalar(2.0);
    b.position.set(x, Math.max(y, terrainHeight(x, z) + 12), z);
    root.add(b);
    return { obj: b, popped: false, phase: Math.random() * 6, poppedAt: 0 };
  });

  const blimpObj = P.blimp('SLEEPER');
  blimpObj.scale.setScalar(2.6);
  root.add(blimpObj);

  const cars = [0, 0.25, 0.5, 0.75].map((offset, i) => {
    const c = P.capsuleCar([0xe0483e, 0x2b6fd4, 0xffc83d, 0x3f8f6a][i]);
    c.scale.setScalar(2.2);
    root.add(c);
    return { obj: c, offset, speed: 0.006 + (i % 2) * 0.0015 };
  });

  const _p = new THREE.Vector3();
  function update(t, dt) {
    for (const L of landmarks) {
      const hoop = L.ring.getObjectByName('hoopMesh');
      hoop.rotation.z = t * 0.4;
      L.ring.position.y = L.center.y + Math.sin(t * 1.2 + L.center.x) * 0.8;
    }
    for (const b of balloons) {
      if (b.popped) {
        // pop scale-out
        const k = Math.min(1, (t - b.poppedAt) * 5);
        b.obj.scale.setScalar(2.0 * (1 + k * 1.5));
        b.obj.traverse(o => { if (o.material && o.material.transparent !== undefined) { o.material.transparent = true; o.material.opacity = Math.max(0, 1 - k * 1.4); } });
        if (k >= 1) b.obj.visible = false;
      } else {
        b.obj.position.y += Math.sin(t * 1.4 + b.phase) * 0.012;
        b.obj.rotation.y = t * 0.3 + b.phase;
      }
    }
    // blimp circles high above
    const ba = t * 0.03;
    blimpObj.position.set(Math.cos(ba) * 150, 84, Math.sin(ba) * 150);
    blimpObj.rotation.y = -ba;
    if (animated.baron && animated.bball) {
      const bounce = Math.abs(Math.sin(t * 5.2));
      if (!animated.bball.userData.baseY) animated.bball.userData.baseY = animated.bball.position.y;
      animated.bball.position.y = animated.bball.userData.baseY + bounce * 1.1;
      if (!animated.baron.userData.baseY) animated.baron.userData.baseY = animated.baron.position.y;
      animated.baron.position.y = animated.baron.userData.baseY + Math.max(0, Math.sin(t * 5.2 + 1.4)) * 0.14;
    }
    if (animated.portal) {
      const spin = animated.portal.getObjectByName('spin');
      if (spin) spin.rotation.y = t * 0.8;
    }
    for (const car of cars) {
      const tt = (t * car.speed + car.offset) % 1;
      const p = roadCurve.getPoint(tt);
      const ahead = roadCurve.getPoint((tt + 0.003) % 1);
      p.y = terrainHeight(p.x, p.z) + 0.9 + Math.sin(t * 3 + car.offset * 20) * 0.18;
      ahead.y = p.y;
      car.obj.position.copy(p);
      car.obj.lookAt(ahead);
      car.obj.rotateY(-Math.PI / 2);
    }
  }

  return { root, landmarks, balloons, update };
}
