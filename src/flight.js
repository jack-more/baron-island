// Flight model: an always-forward seaplane with bank-to-turn steering,
// terrain-following floor, soft ceiling and bounds, plus an autopilot that can
// tour waypoints or orbit a landmark. Feel target: Wii Sports Resort island flyover.
import * as THREE from 'three';
import { clearanceHeight, WORLD_EDGE } from './island.js';
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

    this.pos = new THREE.Vector3(0, 90, -330);
    this.yaw = 0;            // heading, 0 = -z... we use standard: fwd derived below
    this.pitch = 0;
    this.roll = 0;
    this.speed = 26;
    this.baseSpeed = 26;
    this.boostSpeed = 46;
    this.steer = { x: 0, y: 0, boost: false };

    this.autopilot = true;
    this.apTarget = new THREE.Vector3(0, 30, 0);
    this.apOrbit = null;     // {center: Vector3, radius, height}

    this._fwd = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
  }

  forward(out) {
    const cp = Math.cos(this.pitch);
    return out.set(Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  // steer toward a world point; returns synthetic steer values
  _steerToward(target, dt) {
    const dx = target.x - this.pos.x;
    const dz = target.z - this.pos.z;
    const desiredYaw = Math.atan2(dx, -dz);
    let dyaw = desiredYaw - this.yaw;
    dyaw = ((dyaw % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    const dist = Math.hypot(dx, dz);
    const desiredPitch = Math.atan2(target.y - this.pos.y, Math.max(dist, 1));
    return {
      x: THREE.MathUtils.clamp(-dyaw * 1.6, -1, 1),
      y: THREE.MathUtils.clamp((desiredPitch - this.pitch) * 2.2, -1, 1),
      boost: dist > 150,
    };
  }

  update(dt, t) {
    let s = this.steer;
    if (this.autopilot) {
      if (this.apOrbit) {
        const o = this.apOrbit;
        // aim at a point ~70 degrees ahead on the orbit circle
        const cur = Math.atan2(this.pos.x - o.center.x, this.pos.z - o.center.z);
        const ahead = cur + 1.2;
        const tgt = new THREE.Vector3(
          o.center.x + Math.sin(ahead) * o.radius,
          o.height,
          o.center.z + Math.cos(ahead) * o.radius
        );
        s = this._steerToward(tgt, dt);
        s.boost = false;
      } else {
        s = this._steerToward(this.apTarget, dt);
      }
    }

    // bank-to-turn
    const targetRoll = -s.x * 0.85;
    this.roll += (targetRoll - this.roll) * Math.min(1, 5 * dt);
    this.yaw += -s.x * 1.05 * dt * (this.speed / this.boostSpeed + 0.55);
    const targetPitch = THREE.MathUtils.clamp(s.y, -1, 1) * 0.5;
    this.pitch += (targetPitch - this.pitch) * Math.min(1, 3.2 * dt);

    const targetSpeed = s.boost ? this.boostSpeed : this.baseSpeed;
    this.speed += (targetSpeed - this.speed) * Math.min(1, 1.6 * dt);

    this.forward(this._fwd);
    this.pos.addScaledVector(this._fwd, this.speed * dt);

    // terrain floor + soft ceiling
    const floor = clearanceHeight(this.pos.x, this.pos.z) + 6;
    if (this.pos.y < floor) {
      this.pos.y += (floor - this.pos.y) * Math.min(1, 6 * dt);
      this.pitch = Math.max(this.pitch, 0.06);
    }
    if (this.pos.y > 130) this.pos.y += (130 - this.pos.y) * Math.min(1, 2 * dt);
    if (this.pos.y < 7) this.pos.y = 7;

    // world bounds: gently turn back toward the island
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > WORLD_EDGE && !this.autopilot) {
      const backYaw = Math.atan2(-this.pos.x, this.pos.z);
      let d = ((backYaw - this.yaw) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      this.yaw += THREE.MathUtils.clamp(d, -1, 1) * dt * 1.4 * Math.min(1, (r - WORLD_EDGE) / 40);
    }

    // pose the plane (yaw/pitch then roll around forward axis) + gentle bob
    this.group.position.copy(this.pos);
    this.group.position.y += Math.sin(t * 1.8) * 0.15;
    this._e.set(this.pitch, -this.yaw, 0, 'YXZ');
    this.group.quaternion.setFromEuler(this._e);
    this.group.rotateZ(this.roll);

    // prop spin
    const prop = this.plane.getObjectByName('prop');
    prop.rotation.z += dt * (18 + this.speed * 0.6);

    // banner trails behind and below, waving
    this.banner.position.set(0, -0.55, 4.9);
    const bp = this.cloth.geometry.attributes.position;
    const base = this.cloth.userData.basePos;
    for (let i = 0; i < bp.count; i++) {
      const bx = base[i * 3];
      const wave = Math.sin(t * 6 + bx * 1.4) * 0.16 * (0.25 + (bx + 2.8) / 5.6);
      bp.setZ(i, base[i * 3 + 2] + wave);
      bp.setY(i, base[i * 3 + 1] + wave * 0.5);
    }
    bp.needsUpdate = true;
  }
}
