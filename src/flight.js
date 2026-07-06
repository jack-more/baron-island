// Spherical flight: the seaplane flies around a full globe. Position is a world
// vector; heading is a unit tangent that parallel-transports as the plane moves.
// Local up is always away from the planet core — the world wraps, no edges.
import * as THREE from 'three';
import { PLANET_R, heightField, clearanceRadius } from './island.js';
import * as P from './props.js';

export class Flight {
  constructor(scene) {
    this.group = new THREE.Group();
    this.plane = P.seaplane();
    this.group.add(this.plane);

    this.banner = P.towBanner('BART OATMEAL');
    this.cloth = this.banner.getObjectByName('cloth');
    this.group.add(this.banner);

    scene.add(this.group);

    this.pos = new THREE.Vector3(0.2, 0.35, 1).normalize().multiplyScalar(PLANET_R + 55);
    this.heading = new THREE.Vector3(1, 0, 0);
    this.pitch = 0;          // climb angle
    this.roll = 0;
    this.speed = 26;
    this.baseSpeed = 26;
    this.boostSpeed = 46;
    this.steer = { x: 0, y: 0, boost: false };

    this.autopilot = true;
    this.apTarget = this.pos.clone();
    this.apOrbit = null;     // {anchor: unit Vector3, radius (arc len), height (above sea)}

    this.landed = false;
    this.events = [];

    this._upv = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._m = new THREE.Matrix4();
    this._tmp = new THREE.Vector3();
  }

  up(out) { return (out || this._upv).copy(this.pos).normalize(); }
  forward(out) { return out.copy(this.heading); }
  get altitude() { return this.pos.length() - PLANET_R; }

  // signed steering toward a world point, using the local tangent plane
  _steerToward(target, up) {
    const to = this._tmp.copy(target).sub(this.pos);
    const vertical = to.dot(up);
    to.addScaledVector(up, -vertical);
    const dist = to.length();
    if (dist > 0.001) to.divideScalar(dist);
    const right = new THREE.Vector3().crossVectors(up, this.heading).negate();
    const turn = to.dot(right);
    const ahead = to.dot(this.heading);
    let x = THREE.MathUtils.clamp(turn * 2.2, -1, 1);
    if (ahead < -0.2) x = x >= 0 ? 1 : -1; // target behind: commit to the turn
    const targetAlt = target.length() - PLANET_R;
    const y = THREE.MathUtils.clamp((targetAlt - this.altitude) * 0.14 - this.pitch * 1.2, -1, 1);
    return { x, y, boost: dist > 120 };
  }

  update(dt, t) {
    const up = this.up();
    let s = this.steer;

    if (this.autopilot) {
      if (this.apOrbit) {
        const o = this.apOrbit;
        // aim at a point ahead on the circle around the anchor
        const rel = this.pos.clone().normalize();
        const e = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), o.anchor).normalize();
        const f = new THREE.Vector3().crossVectors(o.anchor, e).normalize();
        const cur = Math.atan2(rel.dot(e), rel.dot(f));
        const ang = cur + 0.55;
        const theta = o.radius / PLANET_R;
        const dir = o.anchor.clone().multiplyScalar(Math.cos(theta))
          .addScaledVector(e, Math.sin(theta) * Math.sin(ang))
          .addScaledVector(f, Math.sin(theta) * Math.cos(ang))
          .normalize();
        const tgt = dir.multiplyScalar(PLANET_R + o.height);
        s = this._steerToward(tgt, up);
        s.boost = false;
      } else {
        s = this._steerToward(this.apTarget, up);
      }
    }

    const overWater = heightField(this.pos.clone().normalize()) < -0.2;

    if (this.landed) {
      // taxi on the sea surface
      this.pitch += (0 - this.pitch) * Math.min(1, 5 * dt);
      const targetRoll = -s.x * 0.28 + Math.sin(t * 1.6) * 0.02;
      this.roll += (targetRoll - this.roll) * Math.min(1, 5 * dt);
      this.heading.applyAxisAngle(up, -s.x * 0.9 * dt);
      const taxiTarget = s.boost ? 34 : 7;
      this.speed += (taxiTarget - this.speed) * Math.min(1, (s.boost ? 0.9 : 1.8) * dt);
      this.pos.addScaledVector(this.heading, this.speed * dt);
      this.pos.setLength(PLANET_R + 1.25 + Math.sin(t * 2.1) * 0.08);
      if (this.speed > 27) {
        this.landed = false;
        this.pitch = 0.22;
        this.events.push('takeoff');
      }
      const aheadN = this.pos.clone().addScaledVector(this.heading, 6).normalize();
      if (heightField(aheadN) > -0.4) {
        this.landed = false;
        this.pitch = 0.3;
        this.speed = Math.max(this.speed, 22);
        this.events.push('hop');
      }
    } else {
      // airborne
      const targetRoll = -s.x * 0.85;
      this.roll += (targetRoll - this.roll) * Math.min(1, 5 * dt);
      this.heading.applyAxisAngle(up, -s.x * 1.05 * dt * (this.speed / this.boostSpeed + 0.55));
      const targetPitch = THREE.MathUtils.clamp(s.y, -1, 1) * 0.5;
      this.pitch += (targetPitch - this.pitch) * Math.min(1, 3.2 * dt);

      const targetSpeed = s.boost ? this.boostSpeed : this.baseSpeed;
      this.speed += (targetSpeed - this.speed) * Math.min(1, 1.6 * dt);

      this.pos.addScaledVector(this.heading, this.speed * Math.cos(this.pitch) * dt);
      this.pos.addScaledVector(up, this.speed * Math.sin(this.pitch) * dt);

      if (overWater && !this.autopilot) {
        if (this.altitude <= 1.45) {
          this.landed = true;
          this.pos.setLength(PLANET_R + 1.25);
          this.roll *= 0.3;
          this.events.push('splash');
        }
      } else {
        const floorR = clearanceRadius(this.pos) + 6;
        const r = this.pos.length();
        if (r < floorR) {
          this.pos.setLength(r + (floorR - r) * Math.min(1, 6 * dt));
          this.pitch = Math.max(this.pitch, 0.06);
        }
      }
      // soft ceiling
      if (this.altitude > 55) {
        this.pos.setLength(PLANET_R + 55 + (this.altitude - 55) * Math.max(0, 1 - 2 * dt));
        this.pitch = Math.min(this.pitch, 0);
      }
    }

    // re-orthogonalize heading to the sphere at the new position
    const newUp = this.up(new THREE.Vector3());
    this.heading.addScaledVector(newUp, -this.heading.dot(newUp)).normalize();

    // pose: nose (-Z) along heading, +Y along local up; then pitch and roll
    this._right.crossVectors(this.heading, newUp).normalize();
    this._m.makeBasis(this._right, newUp, this.heading.clone().negate());
    this.group.quaternion.setFromRotationMatrix(this._m);
    this.group.rotateX(this.pitch);
    this.group.rotateZ(this.roll);
    this.group.position.copy(this.pos);
    if (!this.landed) this.group.position.addScaledVector(newUp, Math.sin(t * 1.8) * 0.15);

    const prop = this.plane.getObjectByName('prop');
    prop.rotation.z += dt * (this.landed ? 6 + this.speed * 0.5 : 18 + this.speed * 0.6);

    this.banner.position.set(0, this.landed ? 0.45 : -0.55, 4.9);
    const bp = this.cloth.geometry.attributes.position;
    const base = this.cloth.userData.basePos;
    for (let i = 0; i < bp.count; i++) {
      const bx = base[i * 3];
      const wave = Math.sin(t * 6 + bx * 1.4) * 0.16 * (0.25 + (bx + 1.7) / 3.4);
      bp.setZ(i, base[i * 3 + 2] + wave);
      bp.setY(i, base[i * 3 + 1] + wave * 0.5);
    }
    bp.needsUpdate = true;
  }
}
