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
  const g = new THREE.Group();
  const trunkCol = 0xa9825a;
  for (let i = 0; i < 3; i++) {
    const seg = cyl(0.09 * scale, 0.12 * scale, 0.9 * scale, trunkCol, i * 0.1 * scale, (0.4 + i * 0.8) * scale, 0);
    seg.rotation.z = -0.1 * i;
    g.add(seg);
  }
  const topY = 2.6 * scale, topX = 0.28 * scale;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const frond = cone(0.16 * scale, 1.5 * scale, 0x4da26a, topX + Math.cos(a) * 0.62 * scale, topY, Math.sin(a) * 0.62 * scale, 6);
    frond.rotation.z = Math.cos(a) * 1.25 + Math.PI;
    frond.rotation.x = -Math.sin(a) * 1.25;
    frond.scale.y = 0.35;
    frond.scale.z = 0.5;
    g.add(frond);
  }
  g.add(ball(0.12 * scale, 0x7a5a36, topX, topY - 0.05 * scale, 0, 8));
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
