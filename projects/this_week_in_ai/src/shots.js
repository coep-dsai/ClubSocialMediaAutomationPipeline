// THIS WEEK IN AI: Neon 3D & Tech Explainer
// High-tech 3D Cyberpunk scene + Sleek Data HUDs, Animated Benchmark Charts, & Neural Networks.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.05);
  const cam = camera(38);

  const LOOKS = {
    cyber: { bloom: 0.75, bloomThreshold: 0.25, aperture: 0.0008, maxblur: 0.006, sat: 1.25, vig: 0.4 },
    intense: { bloom: 0.95, bloomThreshold: 0.15, aperture: 0.001, maxblur: 0.007, sat: 1.35, vig: 0.5 },
  };

  const shoot = (scene, from, to, at, at2, k, look = LOOKS.cyber, focus) => {
    if (cam.fov !== (look.fov || 38)) { cam.fov = look.fov || 38; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k));
    cam.lookAt(at2 ? mix(at, at2, k) : at);
    E.render(scene, cam, {
      ...look,
      focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at),
    });
  };

  // ── 2D Tech HUD Helper Functions ─────────────────────────────────────
  const drawGlassCard = (x, y, w, h, borderCol = '#00F0FF', rot = 0, sc = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sc, sc);

    // Outer glow / shadow
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 35;
    ctx.fillStyle = 'rgba(6, 11, 25, 0.92)';
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 24);
    ctx.fill();

    // Sharp Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Top subtle highlight line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w/2 + 20, -h/2 + 6);
    ctx.lineTo(w/2 - 20, -h/2 + 6);
    ctx.stroke();
  };

  // ── Build 3D Neon World ──────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#040711');
  scene.fog = new THREE.FogExp2('#040711', 0.038);

  // Lights
  const ambLight = new THREE.AmbientLight('#1E293B', 1.2);
  scene.add(ambLight);
  const keyLight = new THREE.PointLight('#00F0FF', 3.5, 50);
  keyLight.position.set(0, 10, 5);
  scene.add(keyLight);
  const purpleLight = new THREE.PointLight('#A855F7', 3.0, 45);
  purpleLight.position.set(0, -2, -10);
  scene.add(purpleLight);

  // 1. Neon Grid Floor
  const gridHelper = new THREE.GridHelper(120, 60, '#00F0FF', '#1E1B4B');
  gridHelper.position.y = -2.5;
  scene.add(gridHelper);

  // 2. Futuristic Server Monoliths flanking the cyber highway
  const monoliths = [];
  const monoGeo = new THREE.BoxGeometry(1.6, 7.0, 2.2);
  const monoMat = new THREE.MeshStandardMaterial({
    color: '#0A0F1D',
    metalness: 0.9,
    roughness: 0.2,
  });
  const ledMatCyan = new THREE.MeshBasicMaterial({ color: '#00F0FF' });
  const ledMatPurple = new THREE.MeshBasicMaterial({ color: '#A855F7' });
  const ledGeo = new THREE.BoxGeometry(0.1, 6.2, 0.1);

  for (let z = -35; z <= 15; z += 6) {
    [-4.5, 4.5].forEach((x, side) => {
      const tower = new THREE.Mesh(monoGeo, monoMat);
      tower.position.set(x, 1.0, z);
      const led = new THREE.Mesh(ledGeo, side === 0 ? ledMatCyan : ledMatPurple);
      led.position.set(side === 0 ? 0.82 : -0.82, 0, 0);
      tower.add(led);
      scene.add(tower);
      monoliths.push(tower);
    });
  }

  // 3. Central Glowing 3D AI Core (Rotating wireframe icosahedron + inner core)
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 1.2, -6.0);
  scene.add(coreGroup);

  const icoGeo = new THREE.IcosahedronGeometry(2.2, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: '#00F0FF',
    wireframe: true,
  });
  const icoMesh = new THREE.Mesh(icoGeo, icoMat);
  coreGroup.add(icoMesh);

  const innerGeo = new THREE.SphereGeometry(1.0, 24, 24);
  const innerMat = new THREE.MeshStandardMaterial({
    color: '#38BDF8',
    emissive: '#0284C7',
    emissiveIntensity: 2.0,
    metalness: 0.5,
    roughness: 0.1,
  });
  const innerCore = new THREE.Mesh(innerGeo, innerMat);
  coreGroup.add(innerCore);

  // Orbiting Rings
  const ringGeo1 = new THREE.TorusGeometry(3.0, 0.05, 12, 64);
  const ringMat1 = new THREE.MeshBasicMaterial({ color: '#A855F7' });
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  coreGroup.add(ring1);

  const ringGeo2 = new THREE.TorusGeometry(3.5, 0.04, 12, 64);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: '#FACC15' });
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.x = Math.PI / 3;
  coreGroup.add(ring2);

  // 4. Floating Neural Particles Cloud
  const partGeo = new THREE.BufferGeometry();
  const partCount = 250;
  const partPos = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount * 3; i += 3) {
    partPos[i] = (Math.random() - 0.5) * 30;
    partPos[i+1] = (Math.random() - 0.2) * 16;
    partPos[i+2] = (Math.random() - 0.5) * 45;
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
  const partMat = new THREE.PointsMaterial({
    color: '#38BDF8',
    size: 0.18,
    transparent: true,
    opacity: 0.85,
  });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  // Dynamic animation updater
  const update3D = (t) => {
    icoMesh.rotation.x = t * 0.45;
    icoMesh.rotation.y = t * 0.7;
    ring1.rotation.x = t * 0.8;
    ring1.rotation.y = t * 0.3;
    ring2.rotation.y = -t * 0.6;
    ring2.rotation.z = t * 0.4;
    innerCore.scale.setScalar(1.0 + 0.08 * Math.sin(t * 6));
    gridHelper.position.z = (t * 4) % 2;
  };

  // ── Shot 00 (Line 0): "This week, a tiny three dollar AI experiment" ──
  {
    const st = cut(0), wTiny = Wd('tiny', 0), wExp = Wd('experiment', 0);
    add({
      id: 'S00', at: st, note: 'Hook: Camera rushes through neon server corridor towards glowing AI core',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 1.8, 12), V3(0, 1.4, 4), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        // 2D Pop Info: $3 BREAKTHROUGH
        const pop = clamp((t - wTiny) / 0.22);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawGlassCard(540, 480, 800, 280, '#00F0FF', -0.02, sc);
          ctx.fillStyle = '#38BDF8'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('⚡ THIS WEEK IN AI', 0, -60);
          ctx.fillStyle = '#FACC15'; ctx.font = '900 88px Inter';
          ctx.fillText('$3 EXPERIMENT', 0, 30);
          ctx.restore();
        }
      }
    });
    cue(st + 0.02, 'whoosh', { gain: 0.7 });
    cue(wTiny, 'ding', { gain: 0.9 });
  }

  // ── Shot 01 (Line 1): "just beat a hundred million dollar supercomputer." ──
  {
    const st = cut(1), wBeat = Wd('beat', 1), wSuper = Wd('supercomputer', 1);
    add({
      id: 'S01', at: st, note: 'Shockwave pulse around core, $100M Supercomputer defeated badge',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eo(clamp(lt / d));
        shoot(scene, V3(2.5, 2.8, 3), V3(-1.5, 1.2, 0.5), V3(0, 1.2, -6), null, k, LOOKS.intense);
        blit();

        const pop = clamp((t - wBeat) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawGlassCard(540, 490, 840, 300, '#EF4444', 0.02, sc);
          ctx.fillStyle = '#F87171'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('SOTA CLUSTER DISRUPTED', 0, -65);
          ctx.fillStyle = '#FFFFFF'; ctx.font = '900 78px Inter';
          ctx.fillText('BEATS $100M CLOUD', 0, 25);
          ctx.fillStyle = '#FACC15'; ctx.font = '800 36px Inter';
          ctx.fillText('SUPERCOMPUTER OUTPERFORMED', 0, 95);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wBeat, 'stamp', { gain: 1.0 });
    cue(wSuper, 'ding', { gain: 0.8 });
  }

  // ── Shot 02 (Line 2): "And the biggest tech giants are scrambling." ──
  {
    const st = cut(2), wScram = Wd('scrambling', 2);
    add({
      id: 'S02', at: st, note: 'Rapid camera spin around AI Core with flashing warning HUD',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        const ang = k * Math.PI * 0.8;
        const camPos = V3(Math.sin(ang) * 6, 2.0, -6 + Math.cos(ang) * 6);
        shoot(scene, camPos, camPos, V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wScram) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawGlassCard(540, 480, 800, 240, '#F59E0B', -0.01, sc);
          ctx.fillStyle = '#FDE68A'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('MARKET REACTION', 0, -45);
          ctx.fillStyle = '#F59E0B'; ctx.font = '900 74px Inter';
          ctx.fillText('BIG TECH SCRAMBLING', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wScram, 'pop', { gain: 0.8 });
  }

  // ── Shot 03 (Line 3): "See, for years, companies believed making AI smarter" ──
  {
    const st = cut(3), wSmarter = Wd('smarter', 3);
    add({
      id: 'S03', at: st, note: 'Camera ascends showing server monolith data highway',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 0.5, 6), V3(0, 5.5, -1), V3(0, 1.0, -18), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wSmarter) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawGlassCard(540, 490, 800, 250, '#A855F7', 0.01, sc);
          ctx.fillStyle = '#E9D5FF'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('THE PREVIOUS CONSENSUS', 0, -45);
          ctx.fillStyle = '#C084FC'; ctx.font = '900 68px Inter';
          ctx.fillText('BIGGER = SMARTER?', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 04 (Line 4): "meant burning millions on massive server farms." ──
  {
    const st = cut(4), wBurn = Wd('burning', 4), wFarms = Wd('farms', 4);
    add({
      id: 'S04', at: st, note: 'High altitude view over dark server towers, flashing warning cards',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 6.0, 0), V3(0, 3.5, -8), V3(0, 0.5, -25), null, k, LOOKS.intense);
        blit();

        const pop = clamp((t - wBurn) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawGlassCard(540, 500, 820, 270, '#DC2626', -0.02, sc);
          ctx.fillStyle = '#FCA5A5'; ctx.font = '900 40px Inter'; ctx.textAlign = 'center';
          ctx.fillText('DATA CENTER CAPEX', 0, -50);
          ctx.fillStyle = '#EF4444'; ctx.font = '900 78px Inter';
          ctx.fillText('$100M+ PER RUN', 0, 30);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wBurn, 'ding', { gain: 0.8 });
  }

  // ── Shot 05 (Line 5): "Then researchers tested a brand new trick." ──
  {
    const st = cut(5), wTrick = Wd('trick', 5);
    add({
      id: 'S05', at: st, note: 'Dramatic camera swoop into center of glowing 3D AI Core',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(-4, 2.5, 2), V3(-1.0, 1.5, -3.5), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wTrick) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawGlassCard(540, 480, 800, 240, '#00F0FF', 0.02, sc);
          ctx.fillStyle = '#67E8F9'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('NEW DISCOVERY', 0, -45);
          ctx.fillStyle = '#00F0FF'; ctx.font = '900 76px Inter';
          ctx.fillText('ARCHITECTURAL SHIFT', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wTrick, 'ding', { gain: 0.9 });
  }

  // ── Shot 06 (Line 6): "Instead of adding billions more parameters," ──
  {
    const st = cut(6), wBill = Wd('billions', 6);
    add({
      id: 'S06', at: st, note: 'Diminishing returns parameter chart',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(3.5, 1.8, -2), V3(1.5, 1.4, -4), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wBill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawGlassCard(540, 500, 820, 260, '#64748B', -0.01, sc);
          ctx.fillStyle = '#CBD5E1'; ctx.font = '900 40px Inter'; ctx.textAlign = 'center';
          ctx.fillText('BRUTE FORCE SCALING', 0, -45);
          ctx.fillStyle = '#F87171'; ctx.font = '900 72px Inter';
          ctx.fillText('+100 BILLION WEIGHTS', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 07 (Line 7): "they reorganized the neural pathways." ──
  {
    const st = cut(7), wNeural = Wd('neural', 7);
    add({
      id: 'S07', at: st, note: 'Core expands, pulsing neon data routing',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 0.8, -1), V3(0, 1.2, -4.2), V3(0, 1.2, -6), null, k, LOOKS.intense);
        blit();

        const pop = clamp((t - wNeural) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawGlassCard(540, 500, 820, 260, '#10B981', 0.02, sc);
          ctx.fillStyle = '#6EE7B7'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('ALGORITHMIC INNOVATION', 0, -45);
          ctx.fillStyle = '#34D399'; ctx.font = '900 72px Inter';
          ctx.fillText('OPTIMIZED ROUTING', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wNeural, 'pop', { gain: 0.8 });
  }

  // ── Shot 08 (Line 8): "The result? The model scored ninety-eight percent" ──
  {
    const st = cut(8), wRes = Wd('result', 8), wPct = Wd('percent', 8);
    add({
      id: 'S08', at: st, note: '98.4% SOTA Accuracy Benchmark Card with Animated Bar Charts',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 2.5, 3), V3(0, 1.6, -1), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wPct) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.7, 1.0, eob(pop));
          drawGlassCard(540, 520, 840, 420, '#10B981', 0.0, sc);

          ctx.fillStyle = '#6EE7B7'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center';
          ctx.fillText('🏆 BENCHMARK EVALUATION', 0, -140);
          ctx.fillStyle = '#FACC15'; ctx.font = '900 96px Inter';
          ctx.fillText('98.4% ACCURACY', 0, -40);

          // Side-by-side Animated Comparison Bars
          const barAnim = eo(clamp((t - wPct - 0.2) / 0.4));
          const w1 = lerp(0, 520, barAnim);
          const w2 = lerp(0, 380, barAnim);

          // New Model Bar
          ctx.fillStyle = '#10B981';
          ctx.beginPath(); ctx.roundRect(-260, 40, w1, 40, 12); ctx.fill();
          ctx.fillStyle = '#FFFFFF'; ctx.font = '800 28px Inter'; ctx.textAlign = 'left';
          ctx.fillText('NEW MODEL (98.4%)', -250, 68);

          // Standard Model Bar
          ctx.fillStyle = '#64748B';
          ctx.beginPath(); ctx.roundRect(-260, 100, w2, 40, 12); ctx.fill();
          ctx.fillStyle = '#E2E8F0'; ctx.font = '800 28px Inter'; ctx.textAlign = 'left';
          ctx.fillText('BASELINE CLOUD (72.1%)', -250, 128);

          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wPct, 'stamp', { gain: 1.0 });
  }

  // ── Shot 09 (Line 9): "on benchmarks that usually crush flagship models." ──
  {
    const st = cut(9), wCrush = Wd('crush', 9);
    add({
      id: 'S09', at: st, note: 'Camera pulls back fast revealing full benchmark dominance',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 1.5, -2), V3(0, 3.2, 5), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wCrush) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawGlassCard(540, 500, 820, 260, '#F59E0B', 0.02, sc);
          ctx.fillStyle = '#FDE68A'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('TEST HARNESS RESULTS', 0, -45);
          ctx.fillStyle = '#FBBF24'; ctx.font = '900 72px Inter';
          ctx.fillText('CRUSHES FRONTIER SOTA', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wCrush, 'boing', { gain: 0.8 });
  }

  // ── Shot 10 (Line 10): "It runs seventy times faster," ──
  {
    const st = cut(10), wFast = Wd('faster', 10);
    add({
      id: 'S10', at: st, note: '70X FASTER Speedometer / Throughput HUD',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(-3.0, 1.8, 1), V3(-1.0, 1.4, -2.5), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wFast) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawGlassCard(540, 500, 820, 300, '#3B82F6', -0.02, sc);
          ctx.fillStyle = '#93C5FD'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center';
          ctx.fillText('INFERENCE LATENCY', 0, -60);
          ctx.fillStyle = '#60A5FA'; ctx.font = '900 96px Inter';
          ctx.fillText('⚡ 70X FASTER', 0, 35);
          ctx.fillStyle = '#BFDBFE'; ctx.font = '800 32px Inter';
          ctx.fillText('REAL-TIME GENERATION', 0, 95);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wFast, 'ding', { gain: 0.9 });
  }

  // ── Shot 11 (Line 11): "uses ninety percent less electricity," ──
  {
    const st = cut(11), wLess = Wd('less', 11);
    add({
      id: 'S11', at: st, note: '-90% ELECTRICITY Green Energy Efficiency Dial',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(3.0, 1.8, 1), V3(1.0, 1.4, -2.5), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wLess) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawGlassCard(540, 500, 820, 300, '#10B981', 0.02, sc);
          ctx.fillStyle = '#6EE7B7'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center';
          ctx.fillText('POWER CONSUMPTION', 0, -60);
          ctx.fillStyle = '#34D399'; ctx.font = '900 90px Inter';
          ctx.fillText('🌱 -90% ENERGY', 0, 35);
          ctx.fillStyle = '#A7F3D0'; ctx.font = '800 32px Inter';
          ctx.fillText('ZERO CARBON FOOTPRINT', 0, 95);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wLess, 'pop', { gain: 0.8 });
  }

  // ── Shot 12 (Line 12): "and can run locally on an everyday laptop." ──
  {
    const st = cut(12), wLap = Wd('laptop', 12);
    add({
      id: 'S12', at: st, note: 'Hardware requirements badge: RUNS LOCALLY',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 0.5, 3), V3(0, 1.5, -2), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wLap) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawGlassCard(540, 500, 840, 300, '#8B5CF6', -0.01, sc);
          ctx.fillStyle = '#DDD6FE'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center';
          ctx.fillText('CONSUMER HARDWARE', 0, -60);
          ctx.fillStyle = '#A78BFA'; ctx.font = '900 82px Inter';
          ctx.fillText('💻 RUNS ON LAPTOP', 0, 30);
          ctx.fillStyle = '#C4B5FD'; ctx.font = '800 32px Inter';
          ctx.fillText('NO CLOUD API REQUIRED', 0, 95);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wLap, 'ding', { gain: 0.9 });
  }

  // ── Shot 13 (Line 13): "Which is why engineers are calling this a turning point." ──
  {
    const st = cut(13), wTurn = Wd('turning', 13);
    add({
      id: 'S13', at: st, note: 'MAJOR TURNING POINT Banner over glowing data streams',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(-2.5, 3.2, 5), V3(0, 2.0, 1), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wTurn) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawGlassCard(540, 490, 840, 260, '#FACC15', 0.01, sc);
          ctx.fillStyle = '#FEF08A'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('INDUSTRY CONSENSUS', 0, -45);
          ctx.fillStyle = '#FACC15'; ctx.font = '900 76px Inter';
          ctx.fillText('MAJOR TURNING POINT', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wTurn, 'stamp', { gain: 0.9 });
  }

  // ── Shot 14 (Line 14): "Because tomorrow's most powerful AI" ──
  {
    const st = cut(14), wPower = Wd('powerful', 14);
    add({
      id: 'S14', at: st, note: 'Camera ascends towards the glowing horizon of the cyber highway',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 1.0, 2), V3(0, 6.0, -10), V3(0, 1.5, -30), null, k, LOOKS.cyber);
        blit();
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 15 (Line 15): "might not come from a trillion dollar data center," ──
  {
    const st = cut(15), wTrill = Wd('trillion', 15);
    add({
      id: 'S15', at: st, note: 'Trillion dollar datacenter crossed out with red neon laser',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 4.0, -8), V3(0, 2.0, -2), V3(0, 1.2, -6), null, k, LOOKS.intense);
        blit();

        const pop = clamp((t - wTrill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawGlassCard(540, 500, 840, 280, '#DC2626', -0.02, sc);
          ctx.fillStyle = '#FCA5A5'; ctx.font = '900 42px Inter'; ctx.textAlign = 'center';
          ctx.fillText('NO NEED FOR', 0, -50);
          ctx.fillStyle = '#EF4444'; ctx.font = '900 78px Inter';
          ctx.fillText('$1 TRILLION CLUSTERS', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wTrill, 'ding', { gain: 0.9 });
  }

  // ── Shot 16 (Line 16): "and it all started when..." ──
  {
    const st = cut(16), wStart = Wd('started', 16);
    add({
      id: 'S16', at: st, note: 'Infinite Loop: Camera plunges right back into opening position',
      draw(lt, d, t, blit) {
        update3D(t);
        const k = eio(clamp(lt / d));
        shoot(scene, V3(0, 3.0, 2), V3(0, 1.8, 12), V3(0, 1.2, -6), null, k, LOOKS.cyber);
        blit();
      }
    });
    cue(st, 'whoosh');
    cue(wStart, 'pop', { gain: 0.9 });
  }

  return { shots: S, cues: CUES };
}
