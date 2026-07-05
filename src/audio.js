// All-synthesized ambience (no assets): warm pad chords, speed-linked wind,
// chimes for rings/balloons. Starts on first user gesture; mutable.
let ctx = null;
let master = null;
let windGain = null, windFilter = null;
let muted = false;
let started = false;

const CHORDS = [
  [261.63, 329.63, 392.0, 493.88],   // Cmaj7
  [220.0, 277.18, 329.63, 415.3],    // Amaj7-ish lift
  [174.61, 220.0, 261.63, 349.23],   // Fmaj
  [196.0, 246.94, 293.66, 392.0],    // G
];

export function initAudio() {
  if (started) return;
  started = true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { return; }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);

  // ---- pad: 4 voices, slow chord drift ----
  const padBus = ctx.createGain();
  padBus.gain.value = 0.05;
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 900;
  padBus.connect(padFilter).connect(master);

  const voices = CHORDS[0].map(f => {
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'triangle'; o2.type = 'sine';
    o1.frequency.value = f; o2.frequency.value = f * 1.005;
    const vg = ctx.createGain();
    vg.gain.value = 0.22;
    o1.connect(vg); o2.connect(vg);
    vg.connect(padBus);
    o1.start(); o2.start();
    return { o1, o2 };
  });
  let chordIdx = 0;
  setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    chordIdx = (chordIdx + 1) % CHORDS.length;
    const now = ctx.currentTime;
    CHORDS[chordIdx].forEach((f, i) => {
      voices[i].o1.frequency.linearRampToValueAtTime(f, now + 3.2);
      voices[i].o2.frequency.linearRampToValueAtTime(f * 1.005, now + 3.4);
    });
  }, 9000);

  // slow filter breathing
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 320;
  lfo.connect(lfoGain).connect(padFilter.frequency);
  lfo.start();

  // ---- wind: filtered noise, gain set from flight speed ----
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf; noise.loop = true;
  windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 480;
  windFilter.Q.value = 0.6;
  windGain = ctx.createGain();
  windGain.gain.value = 0.0;
  noise.connect(windFilter).connect(windGain).connect(master);
  noise.start();
}

export function setWind(speedNorm) {
  if (!windGain || !ctx) return;
  const v = 0.015 + speedNorm * 0.06;
  windGain.gain.setTargetAtTime(v, ctx.currentTime, 0.4);
  windFilter.frequency.setTargetAtTime(380 + speedNorm * 520, ctx.currentTime, 0.4);
}

function pluck(freq, dur = 0.5, vol = 0.3, type = 'sine') {
  if (!ctx || ctx.state !== 'running') return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = ctx.createGain();
  const now = ctx.currentTime;
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  o.connect(g).connect(master);
  o.start(now);
  o.stop(now + dur + 0.05);
}

export function ringChime() {
  pluck(523.25, 0.8, 0.28);
  setTimeout(() => pluck(659.25, 0.8, 0.26), 90);
  setTimeout(() => pluck(783.99, 1.2, 0.3), 180);
}

export function balloonPop() {
  pluck(880 + Math.random() * 220, 0.25, 0.24, 'triangle');
  setTimeout(() => pluck(1318.5, 0.35, 0.16), 60);
}

export function winFanfare() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    setTimeout(() => pluck(f, 0.9, 0.26), i * 110));
}

export function cafeMelody() {
  // soft pentatonic phrase, like a radio drifting over the water
  const seq = [392.0, 440.0, 523.25, 587.33, 659.25, 523.25, 440.0];
  seq.forEach((f, i) => setTimeout(() => pluck(f, 1.1, 0.14, 'triangle'), i * 260));
}

export function toggleMute() {
  muted = !muted;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.1);
  return muted;
}

export function isMuted() { return muted; }
