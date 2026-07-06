// Split-screen mini-games. The island keeps flying on the left; the game lives in a
// right-side panel. Flagship games (shot, beat) render real graphics on canvas.
// startMinigame(id, bodyEl, onWin) -> cleanup()

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function makeCanvas(body, w = 470, h = 290) {
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2; // retina
  c.style.width = '100%';
  c.style.borderRadius = '16px';
  c.style.border = '3px solid var(--ink)';
  c.style.display = 'block';
  body.appendChild(c);
  const g = c.getContext('2d');
  g.scale(2, 2);
  return { c, g, w, h };
}

// ---------- 1. First Shot — drawn court, ball arc, timing meter ----------
function shotGame(body, onWin) {
  body.innerHTML = '';
  const { c, g, w, h } = makeCanvas(body);
  const track = el('div', 'shot-track');
  const zone = el('div', 'shot-zone');
  const cursor = el('div', 'shot-cursor');
  track.append(zone, cursor);
  track.style.marginTop = '12px';
  const row = el('div', 'shot-row');
  const count = el('div', 'shot-count', 'MAKES&ensp;0 / 3');
  const tip = el('div', '', '<span style="font-size:12px;color:rgba(29,36,48,.55)">click / space to shoot</span>');
  row.append(count, tip);
  body.append(track, row);

  let makes = 0, zoneW = 26, zoneX = 40, pos = 0, dir = 1, speed = 1.15;
  let raf, done = false, msg = null, msgCol = '#2e9e57';
  // ball animation state
  let ball = null; // {t, from, ctrl, to, make}
  const hoop = { x: w - 78, y: 88 };

  function newZone() {
    zoneW = Math.max(11, 26 - makes * 7);
    zoneX = 12 + Math.random() * (76 - zoneW);
    zone.style.left = zoneX + '%';
    zone.style.width = zoneW + '%';
    zone.classList.toggle('perfect', makes === 2);
  }
  newZone();

  function draw() {
    // sky
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#8fd0f0'); sky.addColorStop(0.75, '#ffe9c4');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    // sun
    g.fillStyle = '#fff3bd'; g.beginPath(); g.arc(70, 52, 26, 0, Math.PI * 2); g.fill();
    // court
    g.fillStyle = '#6a6f7a'; g.fillRect(0, h - 64, w, 64);
    g.strokeStyle = '#fdf8ef'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, h - 40); g.lineTo(w, h - 40); g.stroke();
    g.beginPath(); g.arc(w - 78, h - 40, 56, Math.PI, 0); g.stroke();
    // chain-link hint
    g.strokeStyle = 'rgba(150,158,170,.5)'; g.lineWidth = 1.5;
    for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 30, h - 64); g.stroke(); }
    // hoop: pole, board, rim, net
    g.fillStyle = '#3a4150'; g.fillRect(hoop.x + 34, hoop.y - 20, 8, h - 64 - (hoop.y - 20));
    g.fillStyle = '#f3efe4'; g.fillRect(hoop.x - 6, hoop.y - 46, 52, 40);
    g.strokeStyle = '#e0483e'; g.lineWidth = 4; g.strokeRect(hoop.x + 6, hoop.y - 34, 26, 20);
    g.strokeStyle = '#ff7a4d'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(hoop.x - 20, hoop.y); g.lineTo(hoop.x + 18, hoop.y); g.stroke();
    g.strokeStyle = '#fdf8ef'; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(hoop.x - 18 + i * 9, hoop.y + 2);
      g.lineTo(hoop.x - 10 + i * 7 - 6, hoop.y + 26);
      g.stroke();
    }
    // shooter kid (simple, characterful)
    const kx = 64, ky = h - 64;
    g.fillStyle = '#2b6fd4'; g.fillRect(kx - 10, ky - 44, 20, 26); // jersey
    g.fillStyle = '#8a5a3b';
    g.beginPath(); g.arc(kx, ky - 54, 10, 0, Math.PI * 2); g.fill(); // head
    g.fillRect(kx - 9, ky - 18, 7, 18); g.fillRect(kx + 2, ky - 18, 7, 18); // legs
    g.strokeStyle = '#8a5a3b'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(kx + 8, ky - 40); g.lineTo(kx + 22, ky - 58); g.stroke(); // arm up
    // ball
    if (ball) {
      const t = ball.t;
      const bx = (1 - t) * (1 - t) * ball.from[0] + 2 * (1 - t) * t * ball.ctrl[0] + t * t * ball.to[0];
      const by = (1 - t) * (1 - t) * ball.from[1] + 2 * (1 - t) * t * ball.ctrl[1] + t * t * ball.to[1];
      g.fillStyle = '#e07830';
      g.beginPath(); g.arc(bx, by, 9, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#8a4a1d'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(bx, by, 9, 0, Math.PI * 2); g.stroke();
    } else {
      g.fillStyle = '#e07830';
      g.beginPath(); g.arc(kx + 26, ky - 62, 9, 0, Math.PI * 2); g.fill();
    }
    // message
    if (msg) {
      g.fillStyle = msgCol;
      g.font = '700 26px Futura, "Avenir Next", sans-serif';
      g.textAlign = 'center';
      g.fillText(msg, w / 2, 42);
    }
  }
  draw();

  let last = performance.now();
  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    pos += dir * speed * dt * 100;
    if (pos > 98) { pos = 98; dir = -1; }
    if (pos < 0) { pos = 0; dir = 1; }
    cursor.style.left = pos + '%';
    if (ball) {
      ball.t += dt * 1.6;
      if (ball.t >= 1) {
        if (ball.make) {
          makes++;
          count.innerHTML = `MAKES&ensp;${makes} / 3`;
          msg = makes === 3 ? 'COUNT IT!' : ['SWISH!', 'OFF GLASS!'][makes - 1];
          msgCol = makes === 3 ? '#cc9500' : '#2e9e57';
          if (makes >= 3) {
            done = true;
            draw();
            setTimeout(() => onWin(), 1000);
          } else newZone();
        } else {
          msg = ['SHORT.', 'RIMMED OUT.', 'BACK IRON.'][Math.floor(Math.random() * 3)];
          msgCol = '#c0563a';
        }
        ball = null;
      }
    }
    draw();
    if (!done) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function attempt() {
    if (done || ball) return;
    const hit = pos >= zoneX && pos <= zoneX + zoneW;
    speed += hit ? 0.35 : 0;
    ball = {
      t: 0,
      from: [90, h - 126],
      ctrl: [w / 2, 8],
      to: hit ? [hoop.x - 1, hoop.y + 4] : [hoop.x + (Math.random() < 0.5 ? -26 : 14), hoop.y - 8],
      make: hit,
    };
    msg = null;
  }
  c.style.cursor = 'pointer';
  c.addEventListener('pointerdown', attempt);
  const key = (e) => { if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); attempt(); } };
  window.addEventListener('keydown', key, true);
  return () => { done = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', key, true); };
}

// ---------- 2. Fix the Tape — cassette memory match ----------
function cassetteBg(label) {
  const c = document.createElement('canvas');
  c.width = 220; c.height = 150;
  const g = c.getContext('2d');
  g.fillStyle = '#22262e'; g.fillRect(0, 0, 220, 150);
  g.fillStyle = '#f6ead2'; g.fillRect(18, 16, 184, 74);
  g.fillStyle = '#22262e';
  g.font = '700 17px Futura, "Avenir Next", sans-serif';
  g.textAlign = 'center';
  const lines = label.split('\n');
  lines.forEach((ln, i) => g.fillText(ln, 110, 40 + i * 22));
  // reels
  for (const rx of [70, 150]) {
    g.fillStyle = '#fdf8ef'; g.beginPath(); g.arc(rx, 112, 17, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#22262e'; g.lineWidth = 4;
    g.beginPath(); g.arc(rx, 112, 17, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(rx, 112, 6, 0, Math.PI * 2); g.stroke();
  }
  return `url(${c.toDataURL()})`;
}
const TAPE_BACK = (() => {
  const c = document.createElement('canvas');
  c.width = 220; c.height = 150;
  const g = c.getContext('2d');
  g.fillStyle = '#2f4f4a'; g.fillRect(0, 0, 220, 150);
  g.fillStyle = '#ffc83d';
  g.font = '700 44px Futura, "Avenir Next", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('▮▮', 110, 78);
  return `url(${c.toDataURL()})`;
})();

function tapeGame(body, onWin) {
  body.innerHTML = '';
  const labels = ['FRESHMAN\nFLASH', 'THE MICHIGAN\nDUNK', 'THE REHAB\nROOM'];
  const faces = labels.map(cassetteBg);
  const cards = labels.flatMap((_, i) => [i, i]).sort(() => Math.random() - 0.5);
  const grid = el('div', 'mem-grid');
  const flash = el('div', 'mg-flash');
  body.append(grid, flash);
  let open = [], matched = 0, lock = false, done = false;
  const timers = [];
  cards.forEach(key => {
    const cardEl = el('button', 'mem-card tape');
    cardEl.style.backgroundImage = TAPE_BACK;
    cardEl.addEventListener('click', () => {
      if (lock || done || cardEl.dataset.state) return;
      cardEl.dataset.state = 'flipped';
      cardEl.style.backgroundImage = faces[key];
      open.push({ key, cardEl });
      if (open.length === 2) {
        lock = true;
        const [a, b] = open;
        if (a.key === b.key) {
          timers.push(setTimeout(() => {
            a.cardEl.dataset.state = 'matched'; b.cardEl.dataset.state = 'matched';
            a.cardEl.classList.add('matched'); b.cardEl.classList.add('matched');
            matched++; open = []; lock = false;
            flash.className = 'mg-flash good'; flash.textContent = 'TAPE SPLICED';
            if (matched === 3) {
              done = true;
              flash.className = 'mg-flash perfect'; flash.textContent = 'THE REEL PLAYS AGAIN';
              timers.push(setTimeout(() => onWin(), 900));
            }
          }, 380));
        } else {
          timers.push(setTimeout(() => {
            for (const o of open) { delete o.cardEl.dataset.state; o.cardEl.style.backgroundImage = TAPE_BACK; }
            open = []; lock = false;
          }, 750));
        }
      }
    });
    grid.append(cardEl);
  });
  return () => { done = true; timers.forEach(clearTimeout); };
}

// ---------- 3. Drop the Beat — spinning vinyl, tap on the pulse ----------
function roarGame(body, onWin) {
  body.innerHTML = '';
  const { c, g, w, h } = makeCanvas(body);
  const label = el('div', 'roar-label', 'TAP WHEN THE PULSE HITS THE RECORD');
  body.append(label);

  let hits = 0, ringR = 130, speed = 60, done = false, raf;
  let spin = 0, msg = null, msgCol = '#2e9e57';
  const eq = new Array(12).fill(6);
  const cx = w / 2, cy = h / 2 - 14, recordR = 62;

  function reset() { ringR = 120 + Math.random() * 26; }
  reset();

  function draw() {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2a3140'); bg.addColorStop(1, '#1d2430');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // equalizer bars
    const bw = w / eq.length;
    for (let i = 0; i < eq.length; i++) {
      g.fillStyle = `hsl(${38 + i * 6}, 85%, ${52 + (i % 3) * 6}%)`;
      g.fillRect(i * bw + 4, h - eq[i], bw - 8, eq[i]);
    }
    // vinyl
    g.save();
    g.translate(cx, cy); g.rotate(spin);
    g.fillStyle = '#14171d';
    g.beginPath(); g.arc(0, 0, recordR, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.12)';
    for (let r = 18; r < recordR - 6; r += 9) { g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#ffc83d';
    g.beginPath(); g.arc(0, 0, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1d2430';
    g.font = '700 7px Futura, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('STEELCUT', 0, 0);
    g.restore();
    // pulse ring
    const closeness = Math.abs(ringR - recordR);
    g.strokeStyle = closeness < 12 ? '#ffc83d' : '#ff7a4d';
    g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, Math.max(ringR, 6), 0, Math.PI * 2); g.stroke();
    // hits meter
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i < hits ? '#ffc83d' : 'rgba(253,248,239,.25)';
      g.beginPath(); g.arc(28 + i * 22, 26, 7, 0, Math.PI * 2); g.fill();
    }
    if (msg) {
      g.fillStyle = msgCol;
      g.font = '700 22px Futura, "Avenir Next", sans-serif';
      g.textAlign = 'center';
      g.fillText(msg, cx, 34);
    }
  }
  draw();

  let last = performance.now();
  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    spin += dt * 2.4;
    ringR -= speed * dt;
    if (ringR < recordR - 26) reset();
    for (let i = 0; i < eq.length; i++) {
      eq[i] = Math.max(6, eq[i] - dt * 60 + (Math.random() < 0.08 ? 14 : 0));
    }
    draw();
    if (!done) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function attempt() {
    if (done) return;
    const diff = Math.abs(ringR - recordR);
    if (diff < 14) {
      hits++;
      speed += 12;
      for (let i = 0; i < eq.length; i++) eq[i] = 20 + Math.random() * 40;
      msg = ['THE LOWER BOWL STANDS', 'TOWELS SPINNING', 'THE UPPER DECK JOINS', 'YOU CAN FEEL THE FLOOR', 'ORACLE ERUPTS'][hits - 1];
      msgCol = '#ffc83d';
      if (hits >= 5) { done = true; draw(); setTimeout(() => onWin(), 1000); }
      else reset();
    } else {
      msg = diff < 34 ? 'ALMOST — STAY ON IT' : 'TOO EARLY';
      msgCol = '#ff8a70';
    }
  }
  c.style.cursor = 'pointer';
  c.addEventListener('pointerdown', attempt);
  const key = (e) => { if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); attempt(); } };
  window.addEventListener('keydown', key, true);
  return () => { done = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', key, true); };
}

// ---------- 4. Sign the Board (pop-up catch) ----------
function signGame(body, onWin) {
  body.innerHTML = '';
  const grid = el('div', 'sig-grid');
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const c = el('button', 'sig-cell', '');
    grid.append(c);
    cells.push(c);
  }
  const row = el('div', 'sig-row');
  const score = el('div', '', 'SIGNATURES&ensp;0 / 8');
  const clock = el('div', '', '25s');
  row.append(score, clock);
  const flash = el('div', 'mg-flash');
  body.append(grid, row, flash);

  let got = 0, timeLeft = 25, done = false;
  const timers = [];
  const names = ['LIL MARCUS', 'KEISHA', 'COACH RAY', 'DEE', 'THE TWINS', 'MS. JOHNSON', 'J-ROD', 'TAY', 'BIG E'];

  function popOne() {
    if (done) return;
    const free = cells.filter(c => !c.classList.contains('up'));
    if (!free.length) return;
    const c = free[Math.floor(Math.random() * free.length)];
    c.classList.add('up');
    c.innerHTML = '✋<br>' + names[Math.floor(Math.random() * names.length)];
    timers.push(setTimeout(() => {
      if (!c.classList.contains('got')) { c.classList.remove('up'); c.textContent = ''; }
    }, 1050));
  }
  const popper = setInterval(popOne, 520);
  timers.push(popper);

  cells.forEach(c => c.addEventListener('click', () => {
    if (done || !c.classList.contains('up') || c.classList.contains('got')) return;
    c.classList.add('got');
    c.innerHTML = '✔<br>SIGNED';
    got++;
    score.innerHTML = `SIGNATURES&ensp;${got} / 8`;
    timers.push(setTimeout(() => { c.classList.remove('up', 'got'); c.textContent = ''; }, 450));
    if (got >= 8) {
      done = true;
      clearInterval(popper);
      flash.className = 'mg-flash perfect';
      flash.textContent = 'THE BOARD GOES TO THE TUNNEL';
      timers.push(setTimeout(() => onWin(), 900));
    }
  }));

  const clockTimer = setInterval(() => {
    if (done) return;
    timeLeft--;
    clock.textContent = timeLeft + 's';
    if (timeLeft <= 0) {
      got = Math.max(0, got - 2);
      timeLeft = 25;
      score.innerHTML = `SIGNATURES&ensp;${got} / 8`;
      flash.className = 'mg-flash bad';
      flash.textContent = 'TIPOFF DELAYED — KEEP SIGNING';
    }
  }, 1000);
  timers.push(clockTimer);

  return () => {
    done = true;
    timers.forEach(t => { clearTimeout(t); clearInterval(t); });
  };
}

// ---------- 5. The Oatmeal Board (connect the ecosystem) ----------
function bigGame(body, onWin) {
  body.innerHTML = '';
  const pairs = [
    { l: 'THE ARTIST', ln: 'Bart Oatmeal — lived the story', r: 'OWNS THE ARCHIVE', rn: 'memory becomes music & IP' },
    { l: 'THE CAFÉ', ln: 'coffee, radio, community', r: 'GATHERS THE PEOPLE', rn: 'barista A&Rs → managers → owners' },
    { l: 'THE SPONSOR', ln: 'wants real attention', r: 'BUYS WORLD INVENTORY', rn: 'rings, blimps, presenting rights' },
    { l: 'THE FOUNDATION', ln: 'second chances', r: 'FUNDS THE MISSION', rn: 'prison & foster care reform' },
  ];
  const board = el('div', 'big-board');
  const colL = el('div', 'big-col');
  const mid = el('div', 'big-mid', '⇄');
  const colR = el('div', 'big-col');
  board.append(colL, mid, colR);
  const flash = el('div', 'mg-flash');
  body.append(board, flash);

  const shuffledR = [...pairs].sort(() => Math.random() - 0.5);
  let selected = null, linked = 0, done = false;
  const timers = [];

  pairs.forEach((p, i) => {
    const t = el('button', 'big-tile', `${p.l}<small>${p.ln}</small>`);
    t.addEventListener('click', () => {
      if (done || t.classList.contains('linked')) return;
      colL.querySelectorAll('.big-tile').forEach(x => x.classList.remove('sel'));
      t.classList.add('sel');
      selected = { key: i, el: t };
    });
    colL.append(t);
  });
  shuffledR.forEach((p) => {
    const key = pairs.indexOf(p);
    const t = el('button', 'big-tile', `${p.r}<small>${p.rn}</small>`);
    t.addEventListener('click', () => {
      if (done || t.classList.contains('linked') || !selected) return;
      if (selected.key === key) {
        t.classList.add('linked');
        selected.el.classList.add('linked');
        selected.el.classList.remove('sel');
        selected = null;
        linked++;
        flash.className = 'mg-flash good';
        flash.textContent = 'CONNECTED';
        if (linked === pairs.length) {
          done = true;
          flash.className = 'mg-flash perfect';
          flash.textContent = 'THE ECOSYSTEM TURNS ON';
          timers.push(setTimeout(() => onWin(), 900));
        }
      } else {
        t.classList.add('wrong');
        timers.push(setTimeout(() => t.classList.remove('wrong'), 350));
        flash.className = 'mg-flash bad';
        flash.textContent = 'NOT THAT SEAT AT THE TABLE';
      }
    });
    colR.append(t);
  });
  return () => { done = true; timers.forEach(clearTimeout); };
}

const GAMES = { shot: shotGame, tape: tapeGame, roar: roarGame, sign: signGame, big: bigGame };

export function startMinigame(id, bodyEl, onWin) {
  const game = GAMES[id];
  if (!game) { onWin(); return () => {}; }
  return game(bodyEl, onWin);
}
