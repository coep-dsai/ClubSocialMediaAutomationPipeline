// Sthānika Sieve-31Bv3 AI Breakthrough: Deep Dive 3D shot list.
// Zack D. Films style 3D medical/technical explainer:
// 1. Sunlit lab real world -> 2. X-ray neural cortex -> 3. High-speed weight pruning stream
// 4. Decision benchmarks -> 5. Victory over Perplexity & Jev -> 6. Efficiency payoff with @dsai_coep.

import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets.js';
import { label, pill, warning, blackout } from './core/look2d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
function screen(p, cam) {
  const v = p.clone().project(cam);
  return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H];
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(30);

  const KLOOK = { aperture: 0.0035, maxblur: 0.012, bloom: 0.25 };
  const XLOOK = { aperture: 0.0018, bloom: 0.6, bloomThreshold: 0.35, vignette: 0.5 };
  const VLOOK = { aperture: 0.005, maxblur: 0.014, bloom: 0.7, bloomThreshold: 0.45, focus: 3.2 };

  // ── 3D Environments & Characters ──────────────────────────────────────
  const K = SETS.kitchen(E);
  const hero = new Human({});
  hero.group.position.set(0.1, 0, -0.6);
  K.scene.add(hero.group);

  const X = SETS.xrayStage(E);
  const xh = new Human({});
  const xmat = SETS.xrayMaterial('#4FD1E8');
  xh.setBodyMaterial(xmat);
  const I = SETS.insides();
  xh.spine.add(I.group);
  X.scene.add(xh.group);

  const VS = SETS.vessel(E);

  const CYAN = new THREE.Color('#4FD1E8');
  const RED = new THREE.Color('#FF3B3B');
  const GOLD = new THREE.Color('#FACC15');

  const chest = (h, k) => h.parts[0].scale.set(1 + 0.03 * k, 1 + 0.012 * k, 1 + 0.08 * k);
  const lungs = (k) => I.lungs.forEach((l) => l.scale.set(1 + 0.12 * k, 1 + 0.1 * k, 1 + 0.12 * k));
  const reset = () => {
    hero.pose({});
    chest(hero, 0);
    xh.pose({});
    chest(xh, 0);
    lungs(0);
    I.heart.scale.setScalar(1);
    xmat.uniforms.uCol.value.copy(CYAN);
  };

  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const FACE = V3(0.1, 1.68, -0.6);

  // ── S01 · HOOK: What happens when 31B takes on supercomputers? ─────────
  {
    const st = cut(0);
    add({
      id: 'S01',
      at: st,
      note: 'face close-up: intense researcher gaze, camera pushing in',
      draw(lt, d, t, blit) {
        reset();
        const k = eo(seg(lt, 0.1, 1.4));
        hero.pose({
          head: [-6 * k, 3 * k, 0],
          spine: [-2 * k, 0, 0],
          lid: lerp(0, -0.3, k),
          look: [0, -3 * k],
          shL: [4, 0, 6],
          shR: [4, 0, 6],
        });
        chest(hero, k * 0.8);
        cam.position.copy(lerpV(V3(0.42, 1.74, 0.5), V3(0.28, 1.7, 0.14), eio(lt / d)));
        cam.lookAt(FACE);
        kitchenRender(cam.position.distanceTo(FACE));
        blit();
        pill('31B vs SUPERCOMPUTERS', 540, 1180, eob(seg(lt, 0.2, 0.5)), '#FFD43B', 'rgba(12,14,20,0.85)', 68);
      },
    });
    cue(st + 0.1, 'whoosh');
    cue(st + 0.25, 'pop', { gain: 0.6 });
  }

  // ── S02 · Indian lab Sthanika shocks the world ─────────────────────────
  {
    const st = cut(1);
    add({
      id: 'S02',
      at: st,
      note: 'medium orbit: researcher at workstation, Sthanika reveal',
      draw(lt, d, t, blit) {
        reset();
        hero.pose({ head: [2, -8 + Math.sin(lt * 2.5) * 4, 0], lid: -0.1, look: [4, 0] });
        chest(hero, 0.5);
        hero.group.position.y = Math.sin(lt * 3) * 0.003;
        const a = lerp(0.55, 0.15, eio(lt / d));
        cam.position.set(0.1 + Math.sin(a) * 2.2, 1.48, -0.6 + Math.cos(a) * 2.2);
        cam.lookAt(0.1, 1.25, -0.6);
        kitchenRender(2.2);
        blit();
        pill('🇮🇳 LAB: STHĀNIKA', 540, 1180, eob(seg(lt, 0.15, 0.45)), '#38BDF8', 'rgba(12,14,20,0.85)', 72);
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.2, 'pop', { gain: 0.5 });
  }

  // ── S03 · Re-engineered decision cortex (Transition to X-Ray) ───────────
  {
    const st = cut(2);
    add({
      id: 'S03',
      at: st,
      note: 'cyan x-ray cutaway: glowing neural brain and decision cortex',
      draw(lt, d, t, blit) {
        reset();
        lungs(1 + Math.sin(lt * 3) * 0.05);
        chest(xh, 0.8);
        xh.pose({ head: [4, -4, 0] });
        cam.position.copy(lerpV(V3(0.55, 1.55, 1.6), V3(0.25, 1.45, 1.05), eio(lt / d)));
        cam.lookAt(0, 1.35, 0);
        E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.35, 0)) });
        blit();
        const [lx, ly] = screen(V3(0.08, 1.48, 0.05), cam);
        label('DECISION CORTEX', 760, 520, lx, ly, eob(seg(lt, 0.2, 0.45)));
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.3, 'pop', { gain: 0.6 });
  }

  // ── S04 · Inside the model: Trillions of weights prune noise ────────────
  {
    const st = cut(3);
    add({
      id: 'S04',
      at: st,
      note: 'macro neural stream: high speed matrix calculations in cyan & gold',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        VS.update(t, -lt * 1.8, 0.1, 0.1);
        cam.position.set(Math.sin(lt * 1.2) * 0.08, 0, -lt * 1.8);
        cam.lookAt(0.1, -0.05, -lt * 1.8 - 5);
        E.render(VS.scene, cam, VLOOK);
        blit();
        pill('31B WEIGHTS PRUNED ✓', 540, 330, eob(seg(lt, 0.15, 0.4)), '#7CF29A', 'rgba(12,14,20,0.85)', 68);
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.1, 'slide', { dur: cut(4) - st, gain: 0.5 });
  }

  // ── S05 · Crucial test: Decision benchmarks peak pressure ──────────────
  {
    const st = cut(4);
    add({
      id: 'S05',
      at: st,
      note: 'x-ray body pulses gold & cyan under benchmark stress',
      draw(lt, d, t, blit) {
        reset();
        chest(xh, 1);
        lungs(1);
        const p = 0.5 + 0.5 * Math.sin(lt * 8);
        xmat.uniforms.uCol.value.copy(CYAN).lerp(GOLD, clamp(lt / 0.8) * (0.6 + 0.4 * p));
        xh.pose({ head: [-3, 8 * Math.sin(lt * 1.5), 0], spine: [0, 0, Math.sin(lt * 8) * 1.0], lid: -0.3 });
        cam.position.copy(lerpV(V3(-0.35, 1.58, 1.8), V3(-0.12, 1.55, 1.2), eio(lt / d)));
        cam.lookAt(0, 1.4, 0);
        E.render(X.scene, cam, { ...XLOOK, bloom: 0.75, focus: cam.position.distanceTo(V3(0, 1.4, 0)) });
        blit();
        pill('DECISION BENCHMARK', 540, 1200, eob(seg(lt, 0.2, 0.45)), '#FACC15', 'rgba(12,14,20,0.85)', 70);
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.2, 'alarm', { dur: cut(5) - st - 0.2 });
  }

  // ── S06 · Beat Perplexity and Jev ──────────────────────────────────────
  {
    const st = cut(5);
    add({
      id: 'S06',
      at: st,
      note: 'camera push: competitor defeat visual & heart acceleration',
      draw(lt, d, t, blit) {
        reset();
        chest(xh, 1.1);
        lungs(1.2);
        xmat.uniforms.uCol.value.copy(CYAN);
        xh.pose({ spine: [4, 0, 0], head: [2, -12, 0], lid: -0.2 });
        cam.position.copy(lerpV(V3(1.15, 1.4, 1.1), V3(0.85, 1.35, 0.85), eio(lt / d)));
        cam.lookAt(0, 1.3, 0);
        E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.3, 0)) });
        blit();
        pill('BEATS PERPLEXITY & JEV', 540, 330, eob(seg(lt, 0.2, 0.45)), '#38BDF8', 'rgba(12,14,20,0.85)', 66);
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.2, 'thud', { gain: 0.5 });
  }

  // ── S07 · Tying for first place globally ────────────────────────────────
  {
    const st = cut(6);
    add({
      id: 'S07',
      at: st,
      note: 'heart glowing gold & cyan, #1 trophy global tie pill',
      draw(lt, d, t, blit) {
        reset();
        chest(xh, 1);
        lungs(1);
        const p = 0.5 + 0.5 * Math.sin(lt * 6);
        I.heart.scale.setScalar(1 + p * 0.2);
        I.heart.material.emissiveIntensity = 0.3 + p * 0.9;
        const H0 = V3(0.025, 1.41, 0.07);
        cam.position.copy(lerpV(V3(0.28, 1.48, 0.65), V3(0.14, 1.44, 0.44), eio(lt / d)));
        cam.lookAt(H0);
        E.render(X.scene, cam, { ...XLOOK, bloom: 0.7, focus: cam.position.distanceTo(H0), aperture: 0.004 });
        blit();
        pill('🏆 #1 TIED GLOBALLY', 540, 1180, eob(seg(lt, 0.15, 0.45)), '#FACC15', 'rgba(12,14,20,0.85)', 74);
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.2, 'pop', { gain: 0.7 });
  }

  // ── S08 · Proving intelligent architecture beats compute ───────────────
  {
    const st = cut(7);
    add({
      id: 'S08',
      at: st,
      note: 'return to real world: researcher smiling with confidence',
      draw(lt, d, t, blit) {
        reset();
        const k = eio(clamp(lt / d));
        hero.pose({
          head: [-2, 0, 0],
          spine: [0, 0, 0],
          lid: 0.0,
          look: [0, 0],
          shL: [2, 0, 4],
          shR: [2, 0, 4],
        });
        chest(hero, 0.4);
        cam.position.copy(lerpV(V3(0.0, 1.65, 1.0), V3(0.06, 1.66, 0.6), eio(lt / d)));
        cam.lookAt(0.1, 1.62, -0.6);
        kitchenRender(cam.position.distanceTo(FACE));
        blit();
        pill('ARCHITECTURE > COMPUTE', 540, 1180, eob(seg(lt, 0.2, 0.5)), '#7CF29A', 'rgba(12,14,20,0.85)', 68);
      },
    });
    cue(st, 'whoosh');
    cue(st + 0.25, 'slam', { gain: 0.6 });
  }

  // ── S09 · Outro: Follow COEP DSAI ──────────────────────────────────────
  {
    const st = cut(8);
    add({
      id: 'S09',
      at: st,
      note: 'outro: hero confident gaze, COEP DSAI watermark and follow CTA',
      draw(lt, d, t, blit) {
        reset();
        hero.pose({ head: [0, 0, 0], lid: 0.0, look: [0, 0] });
        chest(hero, 0.2);
        cam.position.copy(lerpV(V3(0.06, 1.66, 0.6), V3(0.08, 1.68, 0.42), eio(lt / d)));
        cam.lookAt(0.1, 1.64, -0.6);
        kitchenRender(cam.position.distanceTo(FACE));
        blit();
        pill('FOLLOW @dsai_coep ⚡', 540, 1180, eob(seg(lt, 0.15, 0.45)), '#38BDF8', 'rgba(12,14,20,0.85)', 72);
      },
    });
    cue(st, 'whoosh');
  }

  return { shots: S, cues: CUES };
}
