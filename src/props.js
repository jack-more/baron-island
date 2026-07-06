// Toon prop factories. Every builder returns a THREE.Group whose origin sits at its base (y = 0).
import * as THREE from 'three';

// ---------- shared toon shading ----------
const gradientTex = (() => {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 1;
  const g = c.getContext('2d');
  ['#666666', '#999999', '#cccccc', '#ffffff'].forEach((col, i) => {
    g.fillStyle = col; g.fillRect(i, 0, 1, 1);
  });
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  return t;
})();

const matCache = new Map();
export function toon(color, opts = {}) {
  const key = `${color}|${JSON.stringify(opts)}`;
  if (!opts.map && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradientTex, ...opts });
  if (!opts.map) matCache.set(key, m);
  return m;
}

export function toonMap(tex, opts = {}) {
  return new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientTex, ...opts });
}

function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export const box = (w, h, d, color, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), toon(color), x, y, z);
export const cyl = (rt, rb, h, color, x, y, z, seg = 12) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color), x, y, z);
export const cone = (r, h, color, x, y, z, seg = 12) => mesh(new THREE.ConeGeometry(r, h, seg), toon(color), x, y, z);
export const ball = (r, color, x, y, z, seg = 14) => mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4)), toon(color), x, y, z);

// ---------- canvas textures ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function windowTexture(base, lit, rows = 5, cols = 4, litChance = 0.45) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const mx = 26, my = 22;
    const cw = (w - mx * 2) / cols, ch = (h - my * 2) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.fillStyle = Math.random() < litChance ? lit : 'rgba(20,26,38,0.82)';
        g.fillRect(mx + c * cw + cw * 0.18, my + r * ch + ch * 0.2, cw * 0.64, ch * 0.58);
      }
    }
  });
}

export function bannerTexture(text, bg, fg, fontPx = 92) {
  return canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.font = `700 ${fontPx}px Futura, "Avenir Next", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

export function courtTexture(asphalt, line, keyColor) {
  return canvasTex(512, 340, (g, w, h) => {
    g.fillStyle = asphalt; g.fillRect(0, 0, w, h);
    g.strokeStyle = line; g.lineWidth = 6;
    g.strokeRect(18, 18, w - 36, h - 36);
    // center line + circle
    g.beginPath(); g.moveTo(w / 2, 18); g.lineTo(w / 2, h - 18); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 46, 0, Math.PI * 2); g.stroke();
    // keys
    g.fillStyle = keyColor;
    g.fillRect(18, h / 2 - 55, 92, 110);
    g.fillRect(w - 110, h / 2 - 55, 92, 110);
    g.strokeRect(18, h / 2 - 55, 92, 110);
    g.strokeRect(w - 110, h / 2 - 55, 92, 110);
    g.beginPath(); g.arc(110, h / 2, 55, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.beginPath(); g.arc(w - 110, h / 2, 55, Math.PI / 2, Math.PI * 1.5); g.stroke();
  });
}

const fenceTex = (() => {
  const t = canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150,158,170,0.95)'; g.lineWidth = 3;
    for (let i = -h; i < w + h; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
      g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
})();

// ---------- nature ----------
export function palm(scale = 1) {
  // curved trunk, drooping two-tone fronds — silhouette-first
  const g = new THREE.Group();
  const trunkCol = 0x9c7a52;
  const segs = 6;
  let px = 0, py = 0, lean = 0;
  const leanStep = 0.09 + Math.random() * 0.05;
  let crown = { x: 0, y: 0 };
  for (let i = 0; i < segs; i++) {
    const segLen = 0.62 * scale;
    const r = (0.13 - i * 0.012) * scale;
    const seg = cyl(r * 0.88, r, segLen * 1.15, trunkCol, 0, 0, 0, 7);
    lean += leanStep;
    px += Math.sin(lean) * segLen;
    py += Math.cos(lean) * segLen;
    seg.position.set(px, py - segLen / 2, 0);
    seg.rotation.z = -lean;
    g.add(seg);
    crown = { x: px, y: py };
  }
  const frondCols = [0x3f9c5c, 0x5fbf78, 0x4bae68];
  const fronds = 9;
  const _y = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 + 0.3;
    const col = frondCols[i % 3];
    const L1 = (1.05 + (i % 2) * 0.2) * scale;
    const L2 = (0.95 + ((i + 1) % 2) * 0.2) * scale;
    // inner segment: out and slightly up
    const d1 = new THREE.Vector3(Math.cos(a), 0.22, Math.sin(a)).normalize();
    const seg1 = cone(0.15 * scale, L1, col, 0, 0, 0, 4);
    seg1.quaternion.setFromUnitVectors(_y, d1);
    seg1.scale.z = 0.3;
    seg1.position.set(crown.x + d1.x * L1 / 2, crown.y + d1.y * L1 / 2, d1.z * L1 / 2);
    g.add(seg1);
    // outer segment: drooping tip
    const d2 = new THREE.Vector3(Math.cos(a), -0.62, Math.sin(a)).normalize();
    const tipBase = new THREE.Vector3(crown.x + d1.x * L1, crown.y + d1.y * L1, d1.z * L1);
    const seg2 = cone(0.11 * scale, L2, col, 0, 0, 0, 4);
    seg2.quaternion.setFromUnitVectors(_y, d2);
    seg2.scale.z = 0.3;
    seg2.position.set(tipBase.x + d2.x * L2 / 2, tipBase.y + d2.y * L2 / 2, tipBase.z + d2.z * L2 / 2);
    g.add(seg2);
  }
  for (let i = 0; i < 3; i++) {
    const ca = i * 2.1;
    g.add(ball(0.11 * scale, 0x6d4f2f, crown.x + Math.cos(ca) * 0.18 * scale, crown.y - 0.05 * scale, Math.sin(ca) * 0.18 * scale, 7));
  }
  return g;
}

export function tree(scale = 1, leaf = 0x5eab63) {
  const g = new THREE.Group();
  g.add(cyl(0.1 * scale, 0.14 * scale, 0.7 * scale, 0x8a6b4a, 0, 0.35 * scale, 0));
  g.add(ball(0.55 * scale, leaf, 0, 0.95 * scale, 0, 10));
  g.add(ball(0.4 * scale, leaf, 0.3 * scale, 0.75 * scale, 0.1 * scale, 10));
  g.add(ball(0.36 * scale, leaf, -0.28 * scale, 0.8 * scale, -0.08 * scale, 10));
  return g;
}

export function rock(scale = 1) {
  const m = mesh(new THREE.IcosahedronGeometry(0.3 * scale, 0), toon(0xb9b2a4));
  m.position.y = 0.15 * scale;
  m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  const g = new THREE.Group(); g.add(m); return g;
}

// ---------- streets ----------
export function streetlight(h = 2.4) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.07, h, 0x3a4150, 0, h / 2, 0, 8));
  const arm = box(0.7, 0.07, 0.07, 0x3a4150, 0.3, h, 0);
  g.add(arm);
  const lamp = ball(0.11, 0xfff2c0, 0.62, h - 0.05, 0, 8);
  lamp.material = toon(0xfff2c0, { emissive: 0xffe9a8, emissiveIntensity: 0.7 });
  g.add(lamp);
  return g;
}

export function powerPole(h = 3) {
  const g = new THREE.Group();
  g.add(cyl(0.06, 0.08, h, 0x6d5a44, 0, h / 2, 0, 6));
  g.add(box(1.4, 0.08, 0.08, 0x6d5a44, 0, h - 0.3, 0));
  g.add(box(1.0, 0.08, 0.08, 0x6d5a44, 0, h - 0.7, 0));
  return g;
}

export function wireBetween(a, b, sag = 0.35, color = 0x2c3240) {
  // droopy powerline between two world points
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.setLength(mid.length() - sag);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const geo = new THREE.TubeGeometry(curve, 10, 0.018, 4);
  const m = new THREE.Mesh(geo, toon(color));
  return m;
}

export function fence(len = 4, h = 1.2) {
  const g = new THREE.Group();
  const posts = Math.max(2, Math.round(len / 1.4) + 1);
  for (let i = 0; i < posts; i++) {
    g.add(cyl(0.035, 0.035, h, 0x8b93a1, -len / 2 + (len / (posts - 1)) * i, h / 2, 0, 6));
  }
  g.add(box(len, 0.05, 0.05, 0x8b93a1, 0, h - 0.03, 0));
  const tex = fenceTex.clone();
  tex.needsUpdate = true;
  tex.repeat.set(len / 1.2, h / 1.2);
  const mat = new THREE.MeshToonMaterial({
    map: tex, gradientMap: gradientTex, transparent: true, side: THREE.DoubleSide, color: 0xffffff,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, h - 0.1), mat);
  panel.position.y = h / 2;
  g.add(panel);
  return g;
}

export function busStop() {
  const g = new THREE.Group();
  g.add(cyl(0.04, 0.04, 1.9, 0x3a4150, -0.7, 0.95, 0, 6));
  g.add(cyl(0.04, 0.04, 1.9, 0x3a4150, 0.7, 0.95, 0, 6));
  const roof = box(1.9, 0.08, 0.9, 0xe0483e, 0, 1.9, 0);
  g.add(roof);
  g.add(box(1.5, 0.08, 0.45, 0x8a6b4a, 0, 0.5, 0.1));
  g.add(box(0.08, 0.42, 0.45, 0x8a6b4a, -0.65, 0.29, 0.1));
  g.add(box(0.08, 0.42, 0.45, 0x8a6b4a, 0.65, 0.29, 0.1));
  return g;
}

// ---------- buildings ----------
export function house(w = 1.8, h = 1.2, d = 1.5, wallColor = 0xf2d8b0, roofColor = 0xc95f45) {
  const g = new THREE.Group();
  const walls = mesh(new THREE.BoxGeometry(w, h, d), toon(wallColor), 0, h / 2, 0);
  g.add(walls);
  const roof = cone(Math.hypot(w, d) / 2 * 1.05, h * 0.6, roofColor, 0, h + h * 0.3, 0, 4);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(box(w * 0.22, h * 0.5, 0.06, 0x5a4632, 0, h * 0.25, d / 2 + 0.02)); // door
  g.add(box(w * 0.24, h * 0.28, 0.05, 0xbfe3f2, -w * 0.28, h * 0.55, d / 2 + 0.02)); // window
  g.add(box(w * 0.24, h * 0.28, 0.05, 0xbfe3f2, w * 0.28, h * 0.55, d / 2 + 0.02));
  return g;
}

export function shop(text = 'MARKET', bg = '#e0483e') {
  const g = new THREE.Group();
  g.add(box(2.6, 1.5, 2, 0xf6e2c4, 0, 0.75, 0));
  const signTex = bannerTexture(text, bg, '#fdf8ef', 78);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.12), new THREE.MeshToonMaterial({ map: signTex, gradientMap: gradientTex }));
  sign.position.set(0, 1.72, 1.0);
  sign.castShadow = true;
  g.add(sign);
  // awning stripes
  const awn = box(2.2, 0.06, 0.7, 0xffc83d, 0, 1.28, 1.28);
  awn.rotation.x = 0.35;
  g.add(awn);
  g.add(box(0.5, 0.9, 0.06, 0x5a4632, -0.7, 0.45, 1.02));
  g.add(box(1.0, 0.6, 0.05, 0xbfe3f2, 0.5, 0.7, 1.02));
  return g;
}

export function towerBlock(w, h, d, base, lit, rows = 6, cols = 3) {
  const g = new THREE.Group();
  const tex = windowTexture(base, lit, rows, cols);
  const side = new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientTex });
  const cap = toon(new THREE.Color(base).multiplyScalar(0.8).getHex());
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, cap, cap, side, side]);
  m.position.y = h / 2;
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  return g;
}

export function glassTower(h = 7) {
  const g = new THREE.Group();
  const tex = windowTexture('#26364f', '#ffd98a', 12, 5, 0.6);
  const side = new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientTex });
  const cap = toon(0x1d2836);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, h, 2.6), [side, side, cap, cap, side, side]);
  body.position.y = h / 2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  // rooftop court
  const courtT = courtTexture('#3f6d52', '#fdf8ef', '#ffc83d');
  const court = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.6), new THREE.MeshToonMaterial({ map: courtT, gradientMap: gradientTex }));
  court.position.y = h + 0.05;
  g.add(court);
  const hp = hoop(0.65);
  hp.position.set(0.95, h + 0.08, 0);
  hp.rotation.y = -Math.PI / 2;
  g.add(hp);
  g.add(cyl(0.03, 0.03, 1.4, 0x3a4150, -1.1, h + 0.7, -1.1, 6));
  const beacon = ball(0.08, 0xff7a4d, -1.1, h + 1.45, -1.1, 8);
  beacon.material = toon(0xff7a4d, { emissive: 0xff7a4d, emissiveIntensity: 1 });
  beacon.name = 'beacon';
  g.add(beacon);
  return g;
}

export function portalRing(r = 1.1) {
  const g = new THREE.Group();
  const ring = mesh(new THREE.TorusGeometry(r, 0.09, 10, 40), toon(0x9a6bff, { emissive: 0x7a4bff, emissiveIntensity: 0.55 }));
  ring.position.y = r + 0.4;
  ring.name = 'spin';
  g.add(ring);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(r * 0.86, 32),
    new THREE.MeshBasicMaterial({ color: 0xcdb8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  disc.position.y = r + 0.4;
  disc.name = 'spin2';
  g.add(disc);
  g.add(cyl(0.12, 0.18, 0.4, 0x3a4150, 0, 0.2, 0, 8));
  return g;
}

// ---------- basketball ----------
export function hoop(scale = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.05 * scale, 0.06 * scale, 2.4 * scale, 0x3a4150, 0, 1.2 * scale, 0, 8));
  g.add(box(1.1 * scale, 0.75 * scale, 0.06 * scale, 0xf3efe4, 0, 2.55 * scale, 0.06 * scale));
  g.add(box(0.5 * scale, 0.35 * scale, 0.07 * scale, 0xe0483e, 0, 2.45 * scale, 0.07 * scale));
  const rim = mesh(new THREE.TorusGeometry(0.22 * scale, 0.03 * scale, 6, 16), toon(0xff7a4d));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 2.25 * scale, 0.32 * scale);
  g.add(rim);
  const net = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * scale, 0.12 * scale, 0.3 * scale, 8, 2, true),
    new THREE.MeshBasicMaterial({ color: 0xfdf8ef, wireframe: true })
  );
  net.position.set(0, 2.08 * scale, 0.32 * scale);
  g.add(net);
  return g;
}

export function court(w = 5, d = 3.4, asphalt = '#4b4f58', line = '#fdf8ef', key = '#e0483e') {
  const g = new THREE.Group();
  const tex = courtTexture(asphalt, line, key);
  const top = new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientTex });
  const sideMat = toon(0x3c4049);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), [sideMat, sideMat, top, sideMat, sideMat, sideMat]);
  slab.position.y = 0.06;
  slab.receiveShadow = true;
  g.add(slab);
  const h1 = hoop(0.9); h1.position.set(-w / 2 + 0.3, 0.12, 0); h1.rotation.y = Math.PI / 2; g.add(h1);
  const h2 = hoop(0.9); h2.position.set(w / 2 - 0.3, 0.12, 0); h2.rotation.y = -Math.PI / 2; g.add(h2);
  return g;
}

// ---------- arenas & landmarks ----------
export function arena(scale = 1, wallColor = 0xf0e6d2, roofColor = 0xfdf8ef, trimColor = 0xffc83d, text = null) {
  const g = new THREE.Group();
  const pts = [];
  pts.push(new THREE.Vector2(2.4 * scale, 0));
  pts.push(new THREE.Vector2(2.6 * scale, 0.5 * scale));
  pts.push(new THREE.Vector2(2.35 * scale, 1.5 * scale));
  pts.push(new THREE.Vector2(2.0 * scale, 1.7 * scale));
  const bowl = mesh(new THREE.LatheGeometry(pts, 36), toon(wallColor));
  g.add(bowl);
  const roof = mesh(new THREE.SphereGeometry(2.05 * scale, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), toon(roofColor));
  roof.scale.y = 0.42;
  roof.position.y = 1.62 * scale;
  g.add(roof);
  const trim = mesh(new THREE.TorusGeometry(2.18 * scale, 0.07 * scale, 8, 36), toon(trimColor));
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 1.66 * scale;
  g.add(trim);
  if (text) {
    const tex = bannerTexture(text, '#1d2430', '#ffc83d', 84);
    const banner = new THREE.Mesh(new THREE.BoxGeometry(2.4 * scale, 0.5 * scale, 0.1), new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientTex }));
    banner.position.set(0, 0.9 * scale, 2.52 * scale);
    banner.castShadow = true;
    g.add(banner);
  }
  return g;
}

export function crane(color = 0xd97b29) {
  // Port of Oakland container crane silhouette
  const g = new THREE.Group();
  const legMat = color;
  g.add(box(0.12, 2.6, 0.12, legMat, -0.55, 1.3, -0.4));
  g.add(box(0.12, 2.6, 0.12, legMat, 0.55, 1.3, -0.4));
  g.add(box(0.12, 2.6, 0.12, legMat, -0.55, 1.3, 0.4));
  g.add(box(0.12, 2.6, 0.12, legMat, 0.55, 1.3, 0.4));
  g.add(box(1.35, 0.12, 0.12, legMat, 0, 1.5, -0.4));
  g.add(box(1.35, 0.12, 0.12, legMat, 0, 1.5, 0.4));
  const boom = box(0.14, 0.14, 3.4, legMat, 0, 2.7, 0.6);
  boom.rotation.x = -0.18;
  g.add(boom);
  g.add(box(0.7, 0.5, 0.7, 0x9aa2ad, 0, 2.35, -0.2));
  return g;
}

export function bridge(len = 7, towerH = 2.6, deckColor = 0xc9553f) {
  const g = new THREE.Group();
  const deck = box(len, 0.14, 0.8, deckColor, 0, 1.1, 0);
  g.add(deck);
  for (const tx of [-len / 4, len / 4]) {
    g.add(box(0.16, towerH, 0.16, deckColor, tx, towerH / 2 + 0.4, -0.3));
    g.add(box(0.16, towerH, 0.16, deckColor, tx, towerH / 2 + 0.4, 0.3));
    g.add(box(0.16, 0.16, 0.78, deckColor, tx, towerH + 0.25, 0));
    g.add(box(0.16, 0.16, 0.78, deckColor, tx, towerH - 0.7, 0));
  }
  // suspension cables
  for (const zz of [-0.3, 0.3]) {
    for (const [x1, x2] of [[-len / 2, -len / 4], [-len / 4, len / 4], [len / 4, len / 2]]) {
      const a = new THREE.Vector3(x1, x1 === -len / 2 || x1 === len / 4 ? 1.2 : towerH + 0.3, zz);
      const start = new THREE.Vector3(x1, Math.abs(x1) === len / 2 ? 1.25 : towerH + 0.3, zz);
      const end = new THREE.Vector3(x2, Math.abs(x2) === len / 2 ? 1.25 : towerH + 0.3, zz);
      const mid = start.clone().add(end).multiplyScalar(0.5); mid.y = 1.35;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.03, 4), toon(deckColor)));
    }
  }
  return g;
}

export function campusHall(w = 3, h = 2, d = 2.2) {
  const g = new THREE.Group();
  const tex = windowTexture('#b45f45', '#ffe9b8', 3, 5, 0.3);
  const side = new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientTex });
  const cap = toon(0x8a4634);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, cap, cap, side, side]);
  body.position.y = h / 2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const roof = cone(Math.hypot(w, d) / 2 * 0.82, 0.8, 0x8a4634, 0, h + 0.4, 0, 4);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  // columns + steps
  for (let i = -1; i <= 1; i++) g.add(cyl(0.09, 0.09, 1.1, 0xf3efe4, i * 0.7, 0.55, d / 2 + 0.25, 8));
  g.add(box(w * 0.9, 0.12, 0.5, 0xe8ddc8, 0, 0.06, d / 2 + 0.45));
  g.add(box(w * 0.75, 0.12, 0.4, 0xe8ddc8, 0, 0.18, d / 2 + 0.32));
  return g;
}

export function gym(text = 'CROSSROADS') {
  const g = new THREE.Group();
  g.add(box(3.2, 1.6, 2.4, 0x6f8fc9, 0, 0.8, 0));
  const roof = mesh(new THREE.CylinderGeometry(1.22, 1.22, 3.2, 16, 1, false, 0, Math.PI), toon(0xf3efe4));
  roof.rotation.z = Math.PI / 2;
  roof.scale.y = 1;
  roof.position.y = 1.6;
  g.add(roof);
  const tex = bannerTexture(text, '#1d2430', '#fdf8ef', 64);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.44, 0.1), new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientTex }));
  sign.position.set(0, 1.25, 1.26);
  g.add(sign);
  g.add(box(0.7, 1.0, 0.08, 0x33405c, 0, 0.5, 1.22));
  return g;
}

// ---------- characters ----------
export function kid(skin = 0x8a5a3b, jersey = 0x2b6fd4, shorts = 0xfdf8ef) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.05, 0.22, skin, -0.07, 0.11, 0, 6));
  g.add(cyl(0.05, 0.05, 0.22, skin, 0.07, 0.11, 0, 6));
  g.add(box(0.24, 0.14, 0.16, shorts, 0, 0.28, 0));
  g.add(box(0.26, 0.3, 0.18, jersey, 0, 0.5, 0));
  const armL = cyl(0.04, 0.04, 0.26, skin, -0.17, 0.5, 0, 6); armL.rotation.z = 0.5; g.add(armL);
  const armR = cyl(0.04, 0.04, 0.26, skin, 0.17, 0.5, 0, 6); armR.rotation.z = -0.5; g.add(armR);
  g.add(ball(0.12, skin, 0, 0.76, 0, 10));
  const hair = ball(0.12, 0x22160c, 0, 0.8, -0.01, 10);
  hair.scale.y = 0.75;
  g.add(hair);
  return g;
}

export function basketball(r = 0.09) {
  return ball(r, 0xe07830, 0, r, 0, 10);
}

export function car(color = 0xe0483e) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.22, 0.44, color, 0, 0.24, 0));
  g.add(box(0.5, 0.18, 0.4, 0xbfe3f2, -0.04, 0.44, 0));
  for (const [x, z] of [[-0.28, 0.22], [0.28, 0.22], [-0.28, -0.22], [0.28, -0.22]]) {
    const w = cyl(0.09, 0.09, 0.06, 0x22262e, x, 0.1, z, 10);
    w.rotation.x = Math.PI / 2;
    g.add(w);
  }
  return g;
}

export function cloud(scale = 1) {
  const g = new THREE.Group();
  const m = toon(0xffffff, { transparent: true, opacity: 0.92, emissive: 0xffffff, emissiveIntensity: 0.42 });
  m.userData.outlineParameters = { visible: false };
  const blobs = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobs; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.45, 10, 8), m);
    b.position.set((i - blobs / 2) * 0.7, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.5);
    b.scale.y = 0.55;
    b.scale.multiplyScalar(scale);
    b.position.multiplyScalar(scale);
    g.add(b);
  }
  return g;
}

export function bird() {
  const g = new THREE.Group();
  const mat = toon(0x2c3240);
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, 0, 0.3, 0.05, -0.05, 0.3, 0.05, 0.08,
  ]), 3));
  wingGeo.computeVertexNormals();
  const w1 = new THREE.Mesh(wingGeo, mat);
  const w2 = new THREE.Mesh(wingGeo, mat);
  w2.scale.x = -1;
  w1.name = 'wingL'; w2.name = 'wingR';
  g.add(w1, w2);
  g.add(ball(0.045, 0x2c3240, 0, 0.01, 0, 6));
  return g;
}

// ============ Baron Island additions ============

export function seaplane() {
  const g = new THREE.Group();
  const blue = 0x2b6fd4, gold = 0xffc83d, cream = 0xfdf8ef;
  // fuselage
  const body = cyl(0.34, 0.42, 2.6, blue, 0, 0, 0, 12);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const nose = cone(0.4, 0.55, gold, 0, 0, -1.55, 12);
  nose.rotation.x = -Math.PI / 2;
  g.add(nose);
  const tailCone = cone(0.32, 0.7, blue, 0, 0.02, 1.62, 10);
  tailCone.rotation.x = Math.PI / 2;
  tailCone.scale.y = 0.6;
  g.add(tailCone);
  // canopy
  const canopy = ball(0.3, 0xbfe3f2, 0, 0.32, -0.45, 10);
  canopy.scale.set(0.8, 0.7, 1.1);
  g.add(canopy);
  // high wing
  const wing = box(4.6, 0.09, 1.05, cream, 0, 0.42, -0.25);
  g.add(wing);
  g.add(box(4.6, 0.02, 0.2, gold, 0, 0.48, -0.62));
  // tail
  g.add(box(1.7, 0.07, 0.55, cream, 0, 0.12, 1.75));
  const fin = box(0.08, 0.75, 0.6, gold, 0, 0.45, 1.8);
  g.add(fin);
  // pontoons
  for (const sx of [-0.75, 0.75]) {
    const p = cyl(0.13, 0.13, 1.7, cream, sx, -0.62, -0.1, 8);
    p.rotation.x = Math.PI / 2;
    g.add(p);
    const pn = cone(0.13, 0.3, cream, sx, -0.62, -1.1, 8);
    pn.rotation.x = -Math.PI / 2;
    g.add(pn);
    g.add(cyl(0.04, 0.04, 0.5, blue, sx, -0.35, -0.1, 6));
  }
  // propeller (spun in update)
  const prop = new THREE.Group();
  prop.add(box(0.08, 1.5, 0.05, 0x22262e, 0, 0, 0));
  prop.add(box(1.5, 0.08, 0.05, 0x22262e, 0, 0, 0));
  const hub = ball(0.09, 0x22262e, 0, 0, 0, 8);
  prop.add(hub);
  prop.position.set(0, 0, -1.88);
  prop.name = 'prop';
  g.add(prop);
  return g;
}

export function towBanner(text = 'BART OATMEAL') {
  const g = new THREE.Group();
  const tex = bannerTexture(text, '#f6ead2', '#1d2430', 70);
  const mat = toonMap(tex, { side: THREE.DoubleSide });
  const geo = new THREE.PlaneGeometry(3.4, 0.7, 18, 1);
  const banner = new THREE.Mesh(geo, mat);
  banner.name = 'cloth';
  banner.userData.basePos = geo.attributes.position.array.slice();
  banner.rotation.y = Math.PI / 2; // face sideways like a real tow banner
  g.add(banner);
  // tow lines back to the tail
  for (const sy of [0.3, -0.3]) {
    const line = cyl(0.012, 0.012, 2.3, 0x3a4150, 0, sy * 0.5, -1.85, 4);
    line.rotation.x = Math.PI / 2 - sy * 0.12;
    g.add(line);
  }
  return g;
}

export function blimp(text = 'SLEEPER') {
  const g = new THREE.Group();
  const hull = ball(1, 0xf3efe4, 0, 0, 0, 20);
  hull.scale.set(2.2, 2.2, 6.0);
  g.add(hull);
  for (const [ry, rz] of [[0.9, 0], [-0.9, 0], [0, 0.9]]) {
    const fin = box(0.12, 1.5, 1.3, 0xe0483e, 0, ry * 1.6, 5.2);
    if (rz) { fin.rotation.z = Math.PI / 2; fin.position.set(rz * 1.6, 0, 5.2); }
    g.add(fin);
  }
  g.add(box(1.0, 0.55, 2.2, 0x3a4150, 0, -2.25, -0.6));
  const tex = bannerTexture(text, '#1d2430', '#ffc83d', 84);
  for (const s of [-1, 1]) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), toonMap(tex));
    sign.position.set(s * 2.24, 0.1, -0.4);
    sign.rotation.y = s * Math.PI / 2;
    g.add(sign);
  }
  return g;
}

export function starBalloon(color = 0xffc83d) {
  const g = new THREE.Group();
  const b = ball(1.15, color, 0, 0, 0, 14);
  b.material = toon(color, { emissive: color, emissiveIntensity: 0.28 });
  b.scale.y = 1.15;
  b.name = 'body';
  g.add(b);
  const knot = cone(0.18, 0.3, color, 0, -1.4, 0, 8);
  g.add(knot);
  const string = cyl(0.015, 0.015, 2.2, 0x3a4150, 0, -2.6, 0, 4);
  g.add(string);
  return g;
}

export function goldRing(radius = 6) {
  const g = new THREE.Group();
  const ring = mesh0(new THREE.TorusGeometry(radius, 0.35, 12, 44),
    toon(0xffc83d, { emissive: 0xffb300, emissiveIntensity: 0.6 }));
  ring.name = 'hoopMesh';
  g.add(ring);
  return g;
}

function mesh0(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  return m;
}

export function sailboat(hullColor = 0xe0483e) {
  const g = new THREE.Group();
  const hull = box(0.9, 0.35, 2.2, hullColor, 0, 0.18, 0);
  g.add(hull);
  g.add(box(0.7, 0.18, 1.0, 0xf3efe4, 0, 0.42, 0.2));
  g.add(cyl(0.04, 0.04, 2.2, 0x8a6b4a, 0, 1.5, -0.1, 6));
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0.5, -0.12, 0, 2.5, -0.12, 1.1, 0.5, -0.12,
  ]), 3));
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, toon(0xfdf8ef, { side: THREE.DoubleSide }));
  g.add(sail);
  return g;
}

export function lighthouse() {
  const g = new THREE.Group();
  const t1 = cyl(0.55, 0.8, 3.2, 0xfdf8ef, 0, 1.6, 0, 12);
  g.add(t1);
  g.add(cyl(0.62, 0.66, 0.5, 0xe0483e, 0, 1.1, 0, 12));
  g.add(cyl(0.58, 0.62, 0.5, 0xe0483e, 0, 2.3, 0, 12));
  const cab = cyl(0.42, 0.42, 0.55, 0x3a4150, 0, 3.5, 0, 10);
  g.add(cab);
  const lamp = ball(0.28, 0xfff2c0, 0, 3.5, 0, 10);
  lamp.material = toon(0xfff2c0, { emissive: 0xffe9a8, emissiveIntensity: 1.0 });
  g.add(lamp);
  const roof = cone(0.5, 0.5, 0xe0483e, 0, 3.95, 0, 10);
  g.add(roof);
  return g;
}

// ============ Palm Court / Radio Café ============

export function stripeTexture(a = '#ffb1a1', b = '#fdf8ef', stripes = 8) {
  return canvasTex(256, 64, (g, w, h) => {
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect((w / stripes) * i, 0, w / stripes + 1, h);
    }
  });
}

export function beachCafe(name = 'RADIO CAFÉ') {
  const g = new THREE.Group();
  // wooden deck
  g.add(box(9.5, 0.4, 7.5, 0xb08a5e, 0, 0.2, 0.6));
  // cafe body
  g.add(box(6.4, 3.0, 4.2, 0xfdf3e0, 0, 1.9, -0.8));
  // big front window
  g.add(box(3.4, 1.4, 0.1, 0x9fd4e8, -0.6, 1.8, 1.32));
  g.add(box(0.9, 2.0, 0.1, 0x5a4632, 2.1, 1.4, 1.32)); // door
  // striped awning
  const awn = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.09, 2.2), toonMap(stripeTexture('#ff9b85', '#fdf8ef', 10)));
  awn.castShadow = true;
  awn.position.set(0, 2.85, 2.1);
  awn.rotation.x = 0.3;
  g.add(awn);
  // sign
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.9, 0.16), toonMap(bannerTexture(name, '#2f4f4a', '#ffe9c9', 64)));
  sign.castShadow = true;
  sign.position.set(0, 3.85, 1.35);
  g.add(sign);
  // rooftop radio: body + dial + antenna
  const radio = new THREE.Group();
  radio.add(box(1.7, 1.0, 0.9, 0x8a5a3b, 0, 0.5, 0));
  radio.add(cyl(0.26, 0.26, 0.1, 0xf6ead2, -0.38, 0.52, 0.48, 14).rotateX(Math.PI / 2));
  radio.add(box(0.55, 0.4, 0.06, 0x2f4f4a, 0.42, 0.52, 0.46));
  radio.add(cyl(0.03, 0.03, 1.7, 0x3a4150, 0.6, 1.8, 0, 5));
  const tip = ball(0.09, 0xff7a4d, 0.6, 2.7, 0, 8);
  tip.material = toon(0xff7a4d, { emissive: 0xff7a4d, emissiveIntensity: 0.9 });
  tip.name = 'antennaTip';
  radio.add(tip);
  radio.position.set(-1.4, 3.4, -1.2);
  radio.name = 'radio';
  g.add(radio);
  return g;
}

export function parasol(a = '#ff9b85', b = '#fdf8ef') {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.05, 2.4, 0xd9c58e, 0, 1.2, 0, 6));
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.55, 10), toonMap(stripeTexture(a, b, 10)));
  top.castShadow = true;
  top.position.y = 2.35;
  g.add(top);
  return g;
}

export function beachChair(color = 0x5fa8c9) {
  const g = new THREE.Group();
  const seat = box(0.8, 0.08, 1.5, color, 0, 0.35, 0);
  seat.rotation.x = -0.25;
  g.add(seat);
  g.add(box(0.08, 0.35, 0.08, 0xd9c58e, -0.32, 0.18, 0.55));
  g.add(box(0.08, 0.35, 0.08, 0xd9c58e, 0.32, 0.18, 0.55));
  g.add(box(0.08, 0.5, 0.08, 0xd9c58e, -0.32, 0.25, -0.55));
  g.add(box(0.08, 0.5, 0.08, 0xd9c58e, 0.32, 0.25, -0.55));
  return g;
}

export function noteTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#2f4f4a';
    g.font = '700 46px "Avenir Next", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('♪', w / 2, h / 2 + 2);
  });
}

export function stringLights(a, b, bulbs = 7, sag = 0.6) {
  // droopy wire with warm bulbs between two world points
  const g = new THREE.Group();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.02, 4), toon(0x3a4150)));
  const bulbMat = toon(0xffd98a, { emissive: 0xffc85e, emissiveIntensity: 0.9 });
  for (let i = 1; i < bulbs; i++) {
    const p = curve.getPoint(i / bulbs);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), bulbMat);
    bulb.position.copy(p).add(new THREE.Vector3(0, -0.09, 0));
    g.add(bulb);
  }
  return g;
}

// ============ DBZ Los Angeles kit ============

export function portholeTexture(base, lit = '#ffe9b8', rows = 3, cols = 5, litChance = 0.5) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.fillStyle = Math.random() < litChance ? lit : 'rgba(24,32,46,0.85)';
        g.beginPath();
        g.arc(c * cw + cw / 2, r * ch + ch / 2, Math.min(cw, ch) * 0.26, 0, Math.PI * 2);
        g.fill();
        g.lineWidth = 5; g.strokeStyle = 'rgba(24,32,46,0.5)';
        g.stroke();
      }
    }
  });
}

// Capsule-style dome building: cylinder base + hemisphere dome + optional name band
export function domeBuilding(r = 2, h = 2, bodyColor = '#f6ead2', domeColor = 0xffc83d, text = null, textColor = '#1d2430') {
  const g = new THREE.Group();
  const tex = portholeTexture(bodyColor, '#ffe9b8', Math.max(2, Math.round(h / 1.1)), Math.max(4, Math.round(r * 3)));
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 20), toonMap(tex));
  body.position.y = h / 2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const dome = ball(r * 0.99, domeColor, 0, h, 0, 20);
  dome.scale.y = 0.72;
  g.add(dome);
  if (text) {
    // sign band wrapped on the dome front
    const bandTex = bannerTexture(text, '#00000000', textColor, 78);
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 1.01, r * 1.03, h * 0.32, 20, 1, true, -0.8, 1.6),
      new THREE.MeshToonMaterial({ map: bandTex, transparent: true, side: THREE.DoubleSide })
    );
    band.position.y = h * 0.62;
    g.add(band);
  }
  g.add(box(r * 0.5, h * 0.45, 0.1, 0x2f4f4a, 0, h * 0.22, r * 1.02));
  return g;
}

// Toriyama wasteland mesa: stacked rounded slabs
export function mesa(scale = 1) {
  const g = new THREE.Group();
  const cols = [0xd98e5a, 0xc97f4e, 0xb96f42];
  let y = 0;
  const tiers = 2 + Math.floor(Math.random() * 2);
  let r = (1.2 + Math.random() * 0.7) * scale;
  for (let i = 0; i < tiers; i++) {
    const th = (0.9 + Math.random() * 0.7) * scale;
    const slab = cyl(r * 0.92, r, th, cols[i % 3], 0, y + th / 2, 0, 9);
    g.add(slab);
    y += th;
    r *= 0.72;
  }
  // grassy cap
  const cap = cyl(r * 1.15, r * 1.25, 0.18 * scale, 0x74c95e, 0, y + 0.09 * scale, 0, 9);
  g.add(cap);
  return g;
}

// hover capsule car — no wheels, DBZ style
export function capsuleCar(color = 0xe0483e) {
  const g = new THREE.Group();
  const bodyMesh = ball(1, color, 0, 0.5, 0, 14);
  bodyMesh.scale.set(1.05, 0.42, 0.5);
  g.add(bodyMesh);
  const canopy = ball(0.42, 0xbfe3f2, -0.05, 0.72, 0, 12);
  canopy.scale.set(0.9, 0.62, 0.78);
  g.add(canopy);
  const skirt = cyl(0.32, 0.38, 0.12, 0x2c3240, 0, 0.28, 0, 10);
  skirt.scale.x = 2.4;
  g.add(skirt);
  const glow = ball(0.16, 0x7fd4ff, 0, 0.16, 0, 8);
  glow.material = toon(0x7fd4ff, { emissive: 0x7fd4ff, emissiveIntensity: 0.9 });
  glow.scale.set(2.6, 0.4, 1.0);
  g.add(glow);
  return g;
}

// Kame-House-style beach house for the offshore islet
export function baronHouse(name = 'OATMEAL HOUSE') {
  const g = new THREE.Group();
  const tex = portholeTexture('#ffb8c4', '#fff3d0', 2, 6, 0.4);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.6, 2.4, 18), toonMap(tex));
  body.position.y = 1.2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const roof = ball(2.5, 0xe0483e, 0, 2.4, 0, 18);
  roof.scale.y = 0.55;
  g.add(roof);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 0.14), toonMap(bannerTexture(name, '#e0483e', '#fdf8ef', 56)));
  sign.position.set(0, 2.1, 2.35);
  sign.castShadow = true;
  g.add(sign);
  g.add(box(0.9, 1.4, 0.1, 0x5a4632, 0, 0.7, 2.52));
  return g;
}


export function flowerPatch(scale = 1) {
  const g = new THREE.Group();
  const cols = [0xff8ab0, 0xffc83d, 0xff7a4d, 0xb98aff, 0xfdf8ef];
  const n = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 1.1 * scale;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    g.add(cyl(0.02 * scale, 0.02 * scale, 0.3 * scale, 0x4f9c58, x, 0.15 * scale, z, 4));
    g.add(ball(0.09 * scale, cols[i % 5], x, 0.34 * scale, z, 6));
  }
  return g;
}

export function bush(scale = 1, leaf = 0x4f9c58) {
  const g = new THREE.Group();
  g.add(ball(0.5 * scale, leaf, 0, 0.32 * scale, 0, 8));
  g.add(ball(0.36 * scale, leaf, 0.35 * scale, 0.22 * scale, 0.1 * scale, 8));
  g.add(ball(0.3 * scale, 0xff8ab0, -0.2 * scale, 0.5 * scale, 0.15 * scale, 6));
  return g;
}
