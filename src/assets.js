// HiFi world system: a manifest of GLB/GLTF assets that replace procedural props
// when present. Drop CC0 packs (KayKit, Kenney, Quaternius…) into assets/world/,
// map them here, and the world upgrades — missing files fall back to procedural.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../vendor/jsm/utils/SkeletonUtils.js';

export const MANIFEST = {
  character: 'assets/world/character.glb',            // rigged + animated (KayKit Adventurers, CC0)
  building_A: 'assets/world/city/building_A.gltf',    // KayKit City Builder Bits (CC0)
  building_B: 'assets/world/city/building_B.gltf',
  building_C: 'assets/world/city/building_C.gltf',
  building_D: 'assets/world/city/building_D.gltf',
  building_E: 'assets/world/city/building_E.gltf',
  building_H: 'assets/world/city/building_H.gltf',
  bench: 'assets/world/city/bench.gltf',
  car_sedan: 'assets/world/city/car_sedan.gltf',
  car_hatchback: 'assets/world/city/car_hatchback.gltf',
  hydrant: 'assets/world/city/firehydrant.gltf',
  trafficlight: 'assets/world/city/trafficlight_A.gltf',
};

const registry = new Map();
const loader = new GLTFLoader();

export async function loadHifi() {
  const jobs = Object.entries(MANIFEST).map(([kind, url]) =>
    loader.loadAsync(url).then(
      (gltf) => {
        gltf.scene.traverse(o => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (o.material) { o.material.roughness = Math.max(o.material.roughness ?? 0.9, 0.8); }
          }
        });
        registry.set(kind, gltf);
      },
      () => { console.info(`[hifi] no asset for "${kind}" (${url}) — using procedural fallback`); }
    )
  );
  await Promise.all(jobs);
  console.info(`[hifi] loaded ${registry.size}/${Object.keys(MANIFEST).length} assets`);
  return registry;
}

export function hasHifi(kind) { return registry.has(kind); }

// clone an asset scene, scaled so its bounding-box height equals targetH (0 = keep native)
export function getHifi(kind, targetH = 0) {
  const gltf = registry.get(kind);
  if (!gltf) return null;
  const clone = SkeletonUtils.clone(gltf.scene);
  if (targetH > 0) {
    const box = new THREE.Box3().setFromObject(clone);
    const h = Math.max(box.max.y - box.min.y, 0.001);
    clone.scale.setScalar(targetH / h);
  }
  return clone;
}

export function getAnimations(kind) {
  return registry.get(kind)?.animations ?? [];
}
