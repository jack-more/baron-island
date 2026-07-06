// Third-person walker — 2K-lobby feel on a full globe. The avatar walks perpetually
// (auto-forward), you steer; jog with space; it even walks on water, leaving ripples.
// Class keeps the old Flight name/API so the app shell stays unchanged.
import * as THREE from 'three';
import { PLANET_R, heightField } from './island.js';
import { getHifi, getAnimations } from './assets.js';
import * as P from './props.js';

export class Flight {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // character: hi-fi rigged GLB when available, procedural fallback otherwise
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    const hifi = getHifi('character', 2.8);
    if (hifi) {
      this.character = hifi;
      this.character.rotation.y = Math.PI; // KayKit faces +Z; we travel -Z
      // street clothes only: strip the adventure-pack weapons
      this.character.traverse(o => {
        if (/dagger|sword|axe|bow|shield|knife|blade|arrow|quiver|crossbow|smokebomb|spellbook|staff/i.test(o.name)) o.visible = false;
      });
      this.group.add(this.character);
      this.mixer = new THREE.AnimationMixer(this.character);
      const clips = getAnimations('character');
      const find = (re) => clips.find(c => re.test(c.name));
      const idle = find(/idle/i) || clips[0];
      const walk = find(/walk/i) || idle;
      const run = find(/run|sprint|jog/i) || walk;
      if (idle) this.actions.idle = this.mixer.clipAction(idle);
      if (walk) this.actions.walk = this.mixer.clipAction(walk);
      if (run) this.actions.run = this.mixer.clipAction(run);
      if (this.actions.idle) { this.actions.idle.play(); this.currentAction = this.actions.idle; }
    } else {
      this.character = P.kid(0x8a5a3b, 0x2b6fd4);
      this.character.scale.setScalar(3.2);
      this.group.add(this.character);
    }

    this.pos = new THREE.Vector3(0.2, 0.35, 1).normalize();
    this.pos.multiplyScalar(PLANET_R + Math.max(heightField(this.pos.clone().normalize()), 0.45));
    this.heading = new THREE.Vector3(1, 0, 0);
    this.speed = 0;
    this.walkSpeed = 5.2;
    this.jogSpeed = 10.5;
    this.steer = { x: 0, y: 0, boost: false };

    this.autopilot = true;
    this.apTarget = this.pos.clone();
    this.apOrbit = null;      // {anchor, radius}

    this.landed = false;      // legacy flag (kept false; walker never "lands")
    this.onWater = false;
    this.events = [];

    this._upv = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._m = new THREE.Matrix4();
    this._tmp = new THREE.Vector3();
  }

  up(out) { return (out || this._upv).copy(this.pos).normalize(); }
  forward(out) { return out.copy(this.heading); }
  get altitude() { return 0; }

  _steerToward(target, up) {
    const to = this._tmp.copy(target).sub(this.pos);
    to.addScaledVector(up, -to.dot(up));
    const dist = to.length();
    if (dist > 0.001) to.divideScalar(dist);
    const right = new THREE.Vector3().crossVectors(this.heading, up).normalize();
    const turn = to.dot(right);
    const ahead = to.dot(this.heading);
    let x = THREE.MathUtils.clamp(turn * 2.6, -1, 1);
    if (ahead < -0.2) x = x >= 0 ? 1 : -1;
    return { x, y: 1, boost: dist > 60 };
  }

  _setAction(name, fade = 0.25) {
    const next = this.actions[name];
    if (!next || next === this.currentAction) return;
    next.reset().fadeIn(fade).play();
    if (this.currentAction) this.currentAction.fadeOut(fade);
    this.currentAction = next;
  }

  update(dt, t) {
    const up = this.up();
    let s = this.steer;

    if (this.autopilot) {
      if (this.apOrbit) {
        const o = this.apOrbit;
        const rel = this.pos.clone().normalize();
        const e = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), o.anchor).normalize();
        const f = new THREE.Vector3().crossVectors(o.anchor, e).normalize();
        const cur = Math.atan2(rel.dot(e), rel.dot(f));
        const ang = cur + 0.6;
        const theta = (o.radius || 16) / PLANET_R;
        const dir = o.anchor.clone().multiplyScalar(Math.cos(theta))
          .addScaledVector(e, Math.sin(theta) * Math.sin(ang))
          .addScaledVector(f, Math.sin(theta) * Math.cos(ang))
          .normalize();
        s = this._steerToward(dir.multiplyScalar(PLANET_R), up);
        s.boost = false;
      } else {
        s = this._steerToward(this.apTarget, up);
      }
    }

    // steer + perpetual walk
    this.heading.applyAxisAngle(up, -s.x * 2.4 * dt);
    let targetSpeed = this.walkSpeed;
    if (s.boost || s.y > 0.4) targetSpeed = this.jogSpeed;
    if (s.y < -0.4) targetSpeed = 0; // pull back to stand still
    this.speed += (targetSpeed - this.speed) * Math.min(1, 6 * dt);

    this.pos.addScaledVector(this.heading, this.speed * dt);
    const n = this.pos.clone().normalize();
    const h = heightField(n);
    this.onWater = h < 0.1;
    this.pos.copy(n).multiplyScalar(PLANET_R + Math.max(h, 0.45));

    // re-orthogonalize heading
    const newUp = this.up(new THREE.Vector3());
    this.heading.addScaledVector(newUp, -this.heading.dot(newUp)).normalize();

    // pose
    this._right.crossVectors(this.heading, newUp).normalize();
    this._m.makeBasis(this._right, newUp, this.heading.clone().negate());
    this.group.quaternion.setFromRotationMatrix(this._m);
    this.group.position.copy(this.pos);

    // animation
    if (this.mixer) {
      if (this.speed < 1) this._setAction('idle');
      else if (this.speed < this.walkSpeed + 1.5) this._setAction('walk');
      else this._setAction('run');
      this.mixer.update(dt);
    } else {
      // procedural bob for the fallback character
      this.group.position.addScaledVector(newUp, this.speed > 1 ? Math.abs(Math.sin(t * 8)) * 0.14 : 0);
    }
  }
}
