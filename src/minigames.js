// Five small HUD mini-games. startMinigame(id, bodyEl, flashEl, onWin) -> cleanup()
// Each game is deliberately 20-40 seconds: a moment, not a grind.

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

// ---------- 1. First Shot (timing meter) ----------
function shotGame(body, onWin) {
  body.innerHTML = '';
  const track = el('div', 'shot-track');
  const zone = el('div', 'shot-zone');
  const cursor = el('div', 'shot-cursor');
  track.append(zone, cursor);
  const flash = el('div', 'mg-flash');
  const row = el('div', 'shot-row');
  const count = el('div', 'shot-count', 'MAKES&ensp;0 / 3');
  const tip = el('div', '', '<span style="font-size:12px;color:rgba(29,36,48,.55)">click or press space</span>');
  row.append(count, tip);
  const shootBtn = el('button', 'primary-btn', 'SHOOT');
  shootBtn.style.width = '100%';
  shootBtn.style.marginTop = '16px';
  body.append(track, row, shootBtn, flash);

  let makes = 0, zoneW = 26, zoneX = 40, pos = 0, dir = 1, speed = 1.15, raf, done = false;
  function newZone() {
    zoneW = Math.max(11, 26 - makes * 7);
    zoneX = 12 + Math.random() * (76 - zoneW);
    zone.style.left = zoneX + '%';
    zone.style.width = zoneW + '%';
    zone.classList.toggle('perfect', makes === 2);
  }
  newZone();
  let last = performance.now();
  function tick(now) {
    const dt = (now - last) / 1000; last = now;
    pos += dir * speed * dt * 100;
    if (pos > 98) { pos = 98; dir = -1; }
    if (pos < 0) { pos = 0; dir = 1; }
    cursor.style.left = pos + '%';
    if (!done) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function attempt() {
    if (done) return;
    const hit = pos >= zoneX && pos <= zoneX + zoneW;
    if (hit) {
      makes++;
      speed += 0.35;
      count.innerHTML = `MAKES&ensp;${makes} / 3`;
      flash.className = 'mg-flash ' + (makes === 3 ? 'perfect' : 'good');
      flash.textContent = makes === 3 ? 'COUNT IT — COURT LIGHTS UP' : ['SWISH!', 'OFF GLASS — GOOD!'][makes - 1];
      if (makes >= 3) {
        done = true;
        setTimeout(() => onWin(), 900);
      } else newZone();
    } else {
      flash.className = 'mg-flash bad';
      flash.textContent = ['SHORT.', 'RIMMED OUT.', 'BACK IRON.'][Math.floor(Math.random() * 3)];
    }
  }
  shootBtn.addEventListener('click', attempt);
  const key = (e) => { if (e.code === 'Space') { e.preventDefault(); attempt(); } };
  window.addEventListener('keydown', key);
  return () => { done = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', key); };
}

// ---------- 2. Fix the Tape (memory match) ----------
function tapeGame(body, onWin) {
  body.innerHTML = '';
  const labels = ['FRESHMAN FLASH', 'THE MICHIGAN DUNK', 'THE REHAB ROOM'];
  const cards = [...labels, ...labels]
    .map((label, i) => ({ label, key: label, id: i }))
    .sort(() => Math.random() - 0.5);
  const grid = el('div', 'mem-grid');
  const flash = el('div', 'mg-flash');
  body.append(grid, flash);
  let open = [], matched = 0, lock = false, done = false;
  const timers = [];
  cards.forEach(c => {
    const cardEl = el('button', 'mem-card', '<span class="tape-icon">▮▮</span>');
    cardEl.addEventListener('click', () => {
      if (lock || done || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;
      cardEl.classList.add('flipped');
      cardEl.innerHTML = c.label;
      open.push({ c, cardEl });
      if (open.length === 2) {
        lock = true;
        const [a, b] = open;
        if (a.c.key === b.c.key) {
          timers.push(setTimeout(() => {
            a.cardEl.classList.add('matched');
            b.cardEl.classList.add('matched');
            matched++;
            open = []; lock = false;
            flash.className = 'mg-flash good';
            flash.textContent = 'TAPE SPLICED';
            if (matched === 3) {
              done = true;
              flash.className = 'mg-flash perfect';
              flash.textContent = 'THE REEL PLAYS AGAIN';
              timers.push(setTimeout(() => onWin(), 900));
            }
          }, 380));
        } else {
          timers.push(setTimeout(() => {
            for (const o of open) {
              o.cardEl.classList.remove('flipped');
              o.cardEl.innerHTML = '<span class="tape-icon">▮▮</span>';
            }
            open = []; lock = false;
          }, 700));
        }
      }
    });
    grid.append(cardEl);
  });
  return () => { done = true; timers.forEach(clearTimeout); };
}

// ---------- 3. Find the Roar (pulse rhythm) ----------
function roarGame(body, onWin) {
  body.innerHTML = '';
  const stage = el('div', 'roar-stage');
  const target = el('div', 'roar-target');
  const ring = el('div', 'roar-ring');
  stage.append(target, ring);
  const meter = el('div', 'roar-meter');
  const fill = el('div', 'roar-fill');
  meter.append(fill);
  const label = el('div', 'roar-label', 'TAP WHEN THE RING MEETS THE CIRCLE');
  const flash = el('div', 'mg-flash');
  body.append(stage, meter, label, flash);

  let hits = 0, size = 260, raf, done = false;
  let speed = 130;
  function reset() { size = 240 + Math.random() * 60; }
  reset();
  let last = performance.now();
  function tick(now) {
    const dt = (now - last) / 1000; last = now;
    size -= speed * dt;
    if (size < 40) reset();
    ring.style.width = size + 'px';
    ring.style.height = size + 'px';
    const closeness = Math.abs(size - 90);
    ring.style.borderColor = closeness < 14 ? 'var(--gold)' : 'var(--accent)';
    if (!done) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function attempt() {
    if (done) return;
    const diff = Math.abs(size - 90);
    if (diff < 16) {
      hits++;
      speed += 22;
      fill.style.width = (hits / 5) * 100 + '%';
      flash.className = 'mg-flash good';
      flash.textContent = ['THE LOWER BOWL STANDS', 'TOWELS SPINNING', 'THE UPPER DECK JOINS', 'YOU CAN FEEL THE FLOOR', 'ORACLE ERUPTS'][hits - 1];
      if (hits >= 5) {
        done = true;
        flash.className = 'mg-flash perfect';
        setTimeout(() => onWin(), 900);
      } else reset();
    } else {
      flash.className = 'mg-flash bad';
      flash.textContent = diff < 40 ? 'ALMOST — STAY WITH THE CROWD' : 'TOO EARLY';
    }
  }
  stage.addEventListener('pointerdown', attempt);
  const key = (e) => { if (e.code === 'Space') { e.preventDefault(); attempt(); } };
  window.addEventListener('keydown', key);
  stage.style.cursor = 'pointer';
  return () => { done = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', key); };
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
    c.textContent = names[Math.floor(Math.random() * names.length)];
    timers.push(setTimeout(() => {
      if (!c.classList.contains('got')) { c.classList.remove('up'); c.textContent = ''; }
    }, 1050));
  }
  const popper = setInterval(popOne, 520);
  timers.push(popper);

  cells.forEach(c => c.addEventListener('click', () => {
    if (done || !c.classList.contains('up') || c.classList.contains('got')) return;
    c.classList.add('got');
    c.textContent = '✔ SIGNED';
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
      // gentle: reset progress, keep playing
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

// ---------- 5. The BIG Board (connect the ecosystem) ----------
function bigGame(body, onWin) {
  body.innerHTML = '';
  const pairs = [
    { l: 'THE PLAYER', ln: 'lived the story', r: 'OWNS THE ARCHIVE', rn: 'memory becomes IP' },
    { l: 'THE SPONSOR', ln: 'wants real attention', r: 'BUYS WORLD INVENTORY', rn: 'courtside, in-game, native' },
    { l: 'THE CREATOR', ln: 'knows the audience', r: 'DISTRIBUTES THE STORY', rn: 'clips, series, formats' },
    { l: 'THE INVESTOR', ln: 'backs the platform', r: 'SCALES TO EVERY PLAYER', rn: 'one format, many worlds' },
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
    t.dataset.key = i;
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
        flash.textContent = 'DEAL CONNECTED';
        if (linked === pairs.length) {
          done = true;
          flash.className = 'mg-flash perfect';
          flash.textContent = 'THE STORY ENGINE TURNS ON';
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
