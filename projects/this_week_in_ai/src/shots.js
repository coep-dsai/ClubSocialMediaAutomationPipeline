// THIS WEEK IN AI: Multi-Scene 3D Tech Explainer & Motion Graphics Engine
// Features: 3D Server Aisles, 3D Neural Network, Animated Bar Charts, Radial Speedometer, Battery Dial, & Terminal HUD.
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
    cyber: { bloom: 0.8, bloomThreshold: 0.2, aperture: 0.0008, maxblur: 0.006, sat: 1.3, vig: 0.4 },
    warning: { bloom: 0.9, bloomThreshold: 0.15, aperture: 0.001, maxblur: 0.007, sat: 1.4, vig: 0.5 },
    clean: { bloom: 0.5, bloomThreshold: 0.3, aperture: 0.0005, maxblur: 0.005, sat: 1.2, vig: 0.3 },
  };

  const shoot = (sceneObj, from, to, at, at2, k, look = LOOKS.cyber, focus) => {
    if (cam.fov !== (look.fov || 38)) { cam.fov = look.fov || 38; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k));
    cam.lookAt(at2 ? mix(at, at2, k) : at);
    E.render(sceneObj, cam, {
      ...look,
      focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at),
    });
  };

  // ── Auto-Fitted Text & Glass Card Helpers ────────────────────────────
  const drawFittedText = (text, x, y, maxW, fontSpec, fillCol, align = 'center') => {
    ctx.save();
    ctx.font = fontSpec;
    ctx.fillStyle = fillCol;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const measured = ctx.measureText(text).width;
    if (measured > maxW && maxW > 0) {
      const scale = maxW / measured;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillText(text, 0, 0);
    } else {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  };

  const drawCard = (x, y, w, h, borderCol = '#00F0FF', sc = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);

    // Glow & Dark glass
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(6, 11, 26, 0.94)';
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 20);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Top highlight line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w/2 + 20, -h/2 + 5);
    ctx.lineTo(w/2 - 20, -h/2 + 5);
    ctx.stroke();
  };

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 1: The Duel (Tiny Laptop vs $100M Supercomputer) ────────
  // ═════════════════════════════════════════════════════════════════════
  const sceneDuel = new THREE.Scene();
  sceneDuel.background = new THREE.Color('#030712');
  sceneDuel.fog = new THREE.FogExp2('#030712', 0.04);
  sceneDuel.add(new THREE.AmbientLight('#1E293B', 1.0));
  const duelGrid = new THREE.GridHelper(100, 50, '#00F0FF', '#1E1B4B');
  duelGrid.position.y = -2;
  sceneDuel.add(duelGrid);

  // Left side: Sleek glowing holographic laptop on pedestal
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(-2.5, 0, -4);
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: '#0F172A', metalness: 0.8 }));
  const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), new THREE.MeshStandardMaterial({ color: '#00F0FF', emissive: '#0284C7', emissiveIntensity: 1.2 }));
  screenMesh.position.set(0, 0.5, -0.6);
  screenMesh.rotation.x = -0.2;
  laptopGroup.add(baseMesh, screenMesh);
  sceneDuel.add(laptopGroup);

  // Right side: Massive ominous supercomputer tower with red alert LEDs
  const superGroup = new THREE.Group();
  superGroup.position.set(2.8, 1.5, -5);
  const superMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.5, 3.0), new THREE.MeshStandardMaterial({ color: '#0B0F19', metalness: 0.9, roughness: 0.2 }));
  const ledRed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.8, 0.12), new THREE.MeshBasicMaterial({ color: '#EF4444' }));
  ledRed.position.set(-1.22, 0, 0.5);
  superGroup.add(superMesh, ledRed);
  sceneDuel.add(superGroup);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 2: The Data Center Aisles (Massive Server Monoliths) ────
  // ═════════════════════════════════════════════════════════════════════
  const sceneServers = new THREE.Scene();
  sceneServers.background = new THREE.Color('#020617');
  sceneServers.fog = new THREE.FogExp2('#020617', 0.045);
  sceneServers.add(new THREE.AmbientLight('#0F172A', 1.2));
  sceneServers.add(new THREE.GridHelper(120, 60, '#3B82F6', '#0F172A')).position.y = -2;

  const rackGeo = new THREE.BoxGeometry(1.6, 7.5, 2.5);
  const rackMat = new THREE.MeshStandardMaterial({ color: '#0B0F19', metalness: 0.85, roughness: 0.25 });
  const ledMatBlue = new THREE.MeshBasicMaterial({ color: '#38BDF8' });
  const ledMatGreen = new THREE.MeshBasicMaterial({ color: '#10B981' });

  for (let z = -40; z <= 20; z += 5) {
    [-4.5, 4.5].forEach((x, side) => {
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(x, 1.5, z);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6.5, 0.08), side === 0 ? ledMatBlue : ledMatGreen);
      stripe.position.set(side === 0 ? 0.82 : -0.82, 0, 0);
      rack.add(stripe);
      sceneServers.add(rack);
    });
  }

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 3: Dynamic 3D Neural Network Architecture ───────────────
  // ═════════════════════════════════════════════════════════════════════
  const sceneNeural = new THREE.Scene();
  sceneNeural.background = new THREE.Color('#040714');
  sceneNeural.fog = new THREE.FogExp2('#040714', 0.035);
  sceneNeural.add(new THREE.AmbientLight('#1E1B4B', 1.0));

  const neuralNodes = [];
  const layers = [3, 5, 5, 3];
  const layerSpacing = 3.5;
  const nodeGeo = new THREE.SphereGeometry(0.22, 16, 16);
  const nodeMat = new THREE.MeshStandardMaterial({ color: '#00F0FF', emissive: '#0284C7', emissiveIntensity: 2.0 });

  const linePositions = [];
  const layerNodes = [];

  layers.forEach((count, lIdx) => {
    const x = (lIdx - 1.5) * layerSpacing;
    const currentLayer = [];
    for (let nIdx = 0; nIdx < count; nIdx++) {
      const y = (nIdx - (count - 1) / 2) * 1.4 + 1.0;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, -5);
      sceneNeural.add(node);
      currentLayer.push(node.position);
      neuralNodes.push(node);
    }
    layerNodes.push(currentLayer);
  });

  // Connect adjacent layers with lines
  for (let l = 0; l < layerNodes.length - 1; l++) {
    layerNodes[l].forEach((p1) => {
      layerNodes[l + 1].forEach((p2) => {
        linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      });
    });
  }
  const neuralLineGeo = new THREE.BufferGeometry();
  neuralLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const neuralLineMat = new THREE.LineBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.35 });
  const neuralLines = new THREE.LineSegments(neuralLineGeo, neuralLineMat);
  sceneNeural.add(neuralLines);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 4: Benchmark Arena (Gold Trophy & Hologram Rings) ───────
  // ═════════════════════════════════════════════════════════════════════
  const sceneBench = new THREE.Scene();
  sceneBench.background = new THREE.Color('#030A14');
  sceneBench.fog = new THREE.FogExp2('#030A14', 0.035);
  sceneBench.add(new THREE.AmbientLight('#0F172A', 1.2));
  sceneBench.add(new THREE.GridHelper(80, 40, '#10B981', '#064E3B')).position.y = -2;

  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(0, 1.2, -5.5);
  const trophyMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.6, 0),
    new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.9, roughness: 0.1, emissive: '#CA8A04', emissiveIntensity: 0.8 })
  );
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.04, 12, 48), new THREE.MeshBasicMaterial({ color: '#10B981' }));
  trophyGroup.add(trophyMesh, ringA);
  sceneBench.add(trophyGroup);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 5: Warp Speed Tunnel Lines ──────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const sceneSpeed = new THREE.Scene();
  sceneSpeed.background = new THREE.Color('#020617');
  const warpGeo = new THREE.BufferGeometry();
  const warpCount = 180;
  const warpPos = [];
  for (let i = 0; i < warpCount; i++) {
    const x = (Math.random() - 0.5) * 16;
    const y = (Math.random() - 0.5) * 20;
    const z1 = (Math.random() - 0.5) * 40;
    warpPos.push(x, y, z1, x, y, z1 - 6);
  }
  warpGeo.setAttribute('position', new THREE.Float32BufferAttribute(warpPos, 3));
  const warpMat = new THREE.LineBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.7 });
  const warpLines = new THREE.LineSegments(warpGeo, warpMat);
  sceneSpeed.add(warpLines);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 6: Consumer Laptop Workstation Desk ─────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const sceneWorkstation = new THREE.Scene();
  sceneWorkstation.background = new THREE.Color('#030712');
  sceneWorkstation.add(new THREE.AmbientLight('#1E293B', 1.2));
  const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.15, 3.5), new THREE.MeshStandardMaterial({ color: '#0F172A', metalness: 0.7 }));
  deskMesh.position.set(0, -0.6, -3.5);
  const laptopOnDesk = laptopGroup.clone();
  laptopOnDesk.position.set(0, -0.5, -3.5);
  sceneWorkstation.add(deskMesh, laptopOnDesk);

  // ═════════════════════════════════════════════════════════════════════
  // ── SHOT DEFINITIONS (17 Cuts, Diverse Visuals, No Repetition) ───────
  // ═════════════════════════════════════════════════════════════════════

  // ── Shot 00 (Line 0): "This week, a tiny three dollar AI experiment" ──
  {
    const st = cut(0), wTiny = Wd('tiny', 0);
    add({
      id: 'S00', at: st, note: 'Scene 1: Close-up push toward $3 glowing laptop workstation',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        laptopGroup.rotation.y = Math.sin(t * 1.5) * 0.15;
        shoot(sceneDuel, V3(-2.5, 1.2, -1.0), V3(-2.5, 0.6, -2.5), V3(-2.5, 0.3, -4), null, k, LOOKS.cyber);
        blit();

        // 2D Card: $3 EXPERIMENT
        const pop = clamp((t - wTiny) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 480, 840, 240, '#00F0FF', sc);
          drawFittedText('⚡ THIS WEEK IN AI', 0, -50, 780, '900 42px Inter', '#38BDF8');
          drawFittedText('$3 AI EXPERIMENT', 0, 30, 780, '900 84px Inter', '#FACC15');
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
      id: 'S01', at: st, note: 'Scene 1: Whip pan across to massive $100M red supercomputer',
      draw(lt, d, t, blit) {
        const k = eo(clamp(lt / d));
        superMesh.rotation.y = Math.sin(t * 2) * 0.05;
        shoot(sceneDuel, V3(1.0, 2.8, -1.5), V3(2.8, 1.8, -2.5), V3(2.8, 1.5, -5), null, k, LOOKS.warning);
        blit();

        const pop = clamp((t - wBeat) / 0.18);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 490, 860, 280, '#EF4444', sc);
          drawFittedText('CLUSTER DISRUPTED', 0, -60, 800, '900 40px Inter', '#F87171');
          drawFittedText('BEATS $100M SUPERCOMPUTER', 0, 20, 800, '900 66px Inter', '#FFFFFF');
          drawFittedText('EFFICIENCY RATIO: 33,000,000X', 0, 85, 800, '800 32px Inter', '#FACC15');
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
      id: 'S02', at: st, note: 'Scene 2: Red flashing market alert & plunging stock chart HUD',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneDuel, V3(0, 3.5, 2), V3(0, 1.0, -1), V3(0, 1.0, -5), null, k, LOOKS.warning);
        blit();

        // 2D Market Chart HUD
        const pop = clamp((t - wScram) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 500, 860, 340, '#F59E0B', sc);
          drawFittedText('MARKET REACTION', 0, -110, 800, '900 38px Inter', '#FDE68A');
          drawFittedText('BIG TECH SCRAMBLING', 0, -50, 800, '900 70px Inter', '#EF4444');

          // Plunging red market line
          const chartProg = eo(clamp((t - wScram - 0.15) / 0.4));
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(-350, 40);
          ctx.lineTo(-150, 50);
          ctx.lineTo(50, 20);
          ctx.lineTo(lerp(50, 320, chartProg), lerp(20, 110, chartProg));
          ctx.stroke();

          drawFittedText('AI CAPEX INDEX: -18.4%', 0, 125, 800, '800 30px Inter', '#F87171');
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wScram, 'pop', { gain: 0.8 });
  }

  // ── Shot 03 (Line 3): "See, for years, companies believed making AI smarter" ──
  {
    const st = cut(3), wSmart = Wd('smarter', 3);
    add({
      id: 'S03', at: st, note: 'Scene 2: Camera flies down deep server farm aisles',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneServers, V3(0, 1.8, 12), V3(0, 1.6, -6), V3(0, 1.5, -35), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wSmart) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 480, 840, 240, '#A855F7', sc);
          drawFittedText('PREVIOUS INDUSTRY BELIEF', 0, -45, 780, '900 38px Inter', '#E9D5FF');
          drawFittedText('MORE SERVERS = SMARTER AI?', 0, 30, 780, '900 62px Inter', '#C084FC');
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 04 (Line 4): "meant burning millions on massive server farms." ──
  {
    const st = cut(4), wBurn = Wd('burning', 4);
    add({
      id: 'S04', at: st, note: 'Scene 2: High angle flight over server towers, burning cash HUD',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneServers, V3(0, 6.0, 5), V3(0, 3.5, -15), V3(0, 0.5, -40), null, k, LOOKS.warning);
        blit();

        const pop = clamp((t - wBurn) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 500, 840, 260, '#DC2626', sc);
          drawFittedText('BRUTE FORCE COSTS', 0, -50, 780, '900 38px Inter', '#FCA5A5');
          drawFittedText('$100M+ PER RUN', 0, 30, 780, '900 80px Inter', '#EF4444');
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
      id: 'S05', at: st, note: 'Scene 3: Camera plunges straight into the 3D Neural Network',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        neuralNodes.forEach((n, i) => n.scale.setScalar(1.0 + 0.15 * Math.sin(t * 6 + i)));
        shoot(sceneNeural, V3(0, 1.0, 4), V3(0, 1.0, -2.5), V3(0, 1.0, -5), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wTrick) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 480, 840, 240, '#00F0FF', sc);
          drawFittedText('THE SCIENTIFIC DISCOVERY', 0, -45, 780, '900 38px Inter', '#67E8F9');
          drawFittedText('A BRAND NEW TRICK', 0, 30, 780, '900 78px Inter', '#00F0FF');
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
      id: 'S06', at: st, note: 'Scene 3: Dense parameter matrix comparison',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneNeural, V3(-3.0, 2.0, -1), V3(-1.0, 1.2, -3.5), V3(0, 1.0, -5), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wBill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 500, 840, 260, '#64748B', sc);
          drawFittedText('OLD SCALING METHOD', 0, -45, 780, '900 38px Inter', '#CBD5E1');
          drawFittedText('+100 BILLION PARAMETERS', 0, 32, 780, '900 64px Inter', '#F87171');
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
      id: 'S07', at: st, note: 'Scene 3: Synapses pulse bright gold as pathways reorganize',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        neuralLineMat.color.set(t % 0.5 > 0.25 ? '#FACC15' : '#00F0FF');
        shoot(sceneNeural, V3(3.0, 1.5, -2), V3(0.5, 1.0, -3.8), V3(0, 1.0, -5), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wNeural) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 500, 840, 260, '#10B981', sc);
          drawFittedText('ARCHITECTURAL REVOLUTION', 0, -45, 780, '900 38px Inter', '#6EE7B7');
          drawFittedText('REORGANIZED SYNAPSES', 0, 32, 780, '900 68px Inter', '#34D399');
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
      id: 'S08', at: st, note: 'Scene 4: Trophy rotates, Animated 98.4% Benchmark Bar Chart grows',
      draw(lt, d, t, blit) {
        trophyMesh.rotation.y = t * 1.5;
        trophyMesh.rotation.x = t * 0.8;
        ringA.rotation.z = -t * 1.2;
        const k = eio(clamp(lt / d));
        shoot(sceneBench, V3(0, 2.8, 1), V3(0, 1.4, -2.5), V3(0, 1.2, -5.5), null, k, LOOKS.clean);
        blit();

        // 2D Benchmark Dashboard with Animated Growing Bars
        const pop = clamp((t - wPct) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawCard(540, 520, 860, 420, '#10B981', sc);

          drawFittedText('🏆 BENCHMARK EVALUATION (MMLU)', 0, -145, 800, '900 36px Inter', '#6EE7B7');
          drawFittedText('98.4% ACCURACY', 0, -65, 800, '900 88px Inter', '#FACC15');

          // Animated Bar 1: New Model
          const barAnim = eo(clamp((t - wPct - 0.1) / 0.45));
          const w1 = lerp(0, 580, barAnim);
          const w2 = lerp(0, 410, barAnim);

          ctx.fillStyle = '#10B981';
          ctx.beginPath(); ctx.roundRect(-290, 20, w1, 44, 10); ctx.fill();
          drawFittedText('TINY AI (OURS) - 98.4%', -270 + w1/2, 42, w1 - 20, '800 24px Inter', '#FFFFFF');

          // Animated Bar 2: Baseline Model
          ctx.fillStyle = '#475569';
          ctx.beginPath(); ctx.roundRect(-290, 85, w2, 44, 10); ctx.fill();
          drawFittedText('FRONTIER MODEL - 72.1%', -270 + w2/2, 107, w2 - 20, '800 24px Inter', '#E2E8F0');

          drawFittedText('TEST EVALUATION PASSED', 0, 160, 800, '700 24px Inter', '#94A3B8');
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
      id: 'S09', at: st, note: 'Scene 4: Camera pulls back revealing full benchmark dominance',
      draw(lt, d, t, blit) {
        trophyMesh.rotation.y = t * 1.5;
        const k = eio(clamp(lt / d));
        shoot(sceneBench, V3(0, 1.2, -3), V3(0, 3.5, 4), V3(0, 1.2, -5.5), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wCrush) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 500, 840, 260, '#F59E0B', sc);
          drawFittedText('FLAGSHIP PERFORMANCE', 0, -45, 780, '900 38px Inter', '#FDE68A');
          drawFittedText('CRUSHES STANDARD SOTA', 0, 35, 780, '900 68px Inter', '#FBBF24');
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
      id: 'S10', at: st, note: 'Scene 5: 3D Warp speed lines + Circular Radial Speedometer HUD',
      draw(lt, d, t, blit) {
        warpLines.rotation.z = t * 0.8;
        const k = eio(clamp(lt / d));
        shoot(sceneSpeed, V3(0, 0, 15), V3(0, 0, -5), V3(0, 0, -30), null, k, LOOKS.cyber);
        blit();

        // 2D High-Tech Circular Radial Speedometer HUD
        const pop = clamp((t - wFast) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawCard(540, 520, 840, 380, '#3B82F6', sc);

          drawFittedText('INFERENCE SPEED GAUGE', 0, -135, 780, '900 38px Inter', '#93C5FD');

          // Circular Arc Dial
          const speedAnim = eo(clamp((t - wFast - 0.1) / 0.45));
          ctx.lineWidth = 14;
          ctx.strokeStyle = '#1E293B';
          ctx.beginPath();
          ctx.arc(0, 10, 95, Math.PI * 0.8, Math.PI * 2.2);
          ctx.stroke();

          // Glowing Speed Sweep Arc
          ctx.strokeStyle = '#38BDF8';
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 10, 95, Math.PI * 0.8, Math.PI * 0.8 + speedAnim * Math.PI * 1.4);
          ctx.stroke();
          ctx.shadowBlur = 0;

          const currentX = Math.round(lerp(1, 70, speedAnim));
          drawFittedText(`${currentX}X FASTER`, 0, 15, 780, '900 76px Inter', '#60A5FA');
          drawFittedText('REAL-TIME GENERATION', 0, 115, 780, '800 28px Inter', '#BFDBFE');
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
      id: 'S11', at: st, note: 'Scene 5: Green Eco Energy Consumption & Battery HUD',
      draw(lt, d, t, blit) {
        warpLines.rotation.z = -t * 0.5;
        const k = eio(clamp(lt / d));
        shoot(sceneSpeed, V3(0, 0, 5), V3(0, 0, -10), V3(0, 0, -30), null, k, LOOKS.cyber);
        blit();

        // 2D Battery & Energy Reduction HUD
        const pop = clamp((t - wLess) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawCard(540, 520, 840, 360, '#10B981', sc);

          drawFittedText('ENERGY CONSUMPTION', 0, -120, 780, '900 38px Inter', '#6EE7B7');
          drawFittedText('-90% ELECTRICITY', 0, -40, 780, '900 80px Inter', '#34D399');

          // Segmented Battery Bar
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 6;
          ctx.strokeRect(-220, 30, 440, 50);
          ctx.fillStyle = '#10B981';
          ctx.fillRect(222, 45, 16, 20); // battery terminal tip

          // Active remaining power cell
          ctx.fillStyle = '#34D399';
          ctx.fillRect(-210, 40, 60, 30);

          drawFittedText('SAVING 400 MEGAWATTS PER CLUSTER', 0, 120, 780, '800 28px Inter', '#A7F3D0');
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
      id: 'S12', at: st, note: 'Scene 6: 3D Laptop on desk + Monospace Code Terminal HUD',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneWorkstation, V3(0, 1.2, 0), V3(0, 0.4, -2.0), V3(0, -0.4, -3.5), null, k, LOOKS.cyber);
        blit();

        // 2D Monospace Terminal HUD
        const pop = clamp((t - wLap) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 510, 860, 340, '#8B5CF6', sc);

          drawFittedText('HARDWARE COMPATIBILITY', 0, -115, 800, '900 36px Inter', '#DDD6FE');
          drawFittedText('💻 RUNS ON EVERYDAY LAPTOP', 0, -55, 800, '900 62px Inter', '#A78BFA');

          // Terminal window body
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(-380, 0, 760, 110);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(-380, 0, 760, 110);

          drawFittedText('> python run_model.py --weights 3GB', -360, 30, 720, '600 22px Courier New', '#38BDF8', 'left');
          drawFittedText('[OK] VRAM: 2.1 GB used | Tokens/sec: 145.2', -360, 75, 720, '600 22px Courier New', '#4ADE80', 'left');

          drawFittedText('NO CLOUD API REQUIRED', 0, 135, 800, '800 26px Inter', '#C4B5FD');
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
      id: 'S13', at: st, note: 'Scene 6: Camera rises revealing major turning point card',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneWorkstation, V3(0, 0.4, -2.0), V3(0, 2.5, 1.0), V3(0, -0.4, -3.5), null, k, LOOKS.cyber);
        blit();

        const pop = clamp((t - wTurn) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 490, 840, 250, '#FACC15', sc);
          drawFittedText('GLOBAL AI MILESTONE', 0, -45, 780, '900 38px Inter', '#FEF08A');
          drawFittedText('MAJOR TURNING POINT', 0, 35, 780, '900 74px Inter', '#FACC15');
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
      id: 'S14', at: st, note: 'Scene 2: High altitude majestic sweep across cyber horizon',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneServers, V3(0, 1.5, 0), V3(0, 6.0, -12), V3(0, 1.0, -35), null, k, LOOKS.cyber);
        blit();
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 15 (Line 15): "might not come from a trillion dollar data center," ──
  {
    const st = cut(15), wTrill = Wd('trillion', 15);
    add({
      id: 'S15', at: st, note: 'Scene 2: Red Neon Laser cross out $1 Trillion Data Center',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneServers, V3(0, 4.0, -6), V3(0, 2.0, 0), V3(0, 1.0, -25), null, k, LOOKS.warning);
        blit();

        const pop = clamp((t - wTrill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawCard(540, 500, 860, 280, '#DC2626', sc);
          drawFittedText('THE TRUTH IS CLEAR', 0, -50, 800, '900 40px Inter', '#FCA5A5');
          drawFittedText('NO $1T DATA CENTER NEEDED', 0, 30, 800, '900 66px Inter', '#EF4444');
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
      id: 'S16', at: st, note: 'Infinite Loop: Camera plunges straight back to opening $3 laptop position',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneDuel, V3(0, 3.5, 5), V3(-2.5, 1.2, -1.0), V3(-2.5, 0.3, -4), null, k, LOOKS.cyber);
        blit();
      }
    });
    cue(st, 'whoosh');
    cue(wStart, 'pop', { gain: 0.9 });
  }

  return { shots: S, cues: CUES };
}
