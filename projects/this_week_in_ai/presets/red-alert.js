// THIS WEEK IN AI: Multi-Scene 3D Tech Explainer & Motion Graphics Engine
// Features: 3D Server Aisles, 3D Neural Network Architecture, 3D Gold Trophy Podium,
// 3D Accelerator Turbine, 3D Eco Battery, Laptop Workstation, Animated Charts, & COEP DSAI Club Branding.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.05);
  const cam = camera(40);

  const LOOKS = {
    cyber: { bloom: 0.75, bloomThreshold: 0.2, aperture: 0.0008, maxblur: 0.006, sat: 1.3, vig: 0.4 },
    warning: { bloom: 0.85, bloomThreshold: 0.15, aperture: 0.001, maxblur: 0.007, sat: 1.4, vig: 0.5 },
    clean: { bloom: 0.55, bloomThreshold: 0.25, aperture: 0.0005, maxblur: 0.005, sat: 1.25, vig: 0.35 },
  };

  const shoot = (sceneObj, from, to, at, at2, k, look = LOOKS.cyber, focus) => {
    if (cam.fov !== (look.fov || 40)) { cam.fov = look.fov || 40; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k));
    cam.lookAt(at2 ? mix(at, at2, k) : at);
    E.render(sceneObj, cam, {
      ...look,
      focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at),
    });
  };

  // ── Auto-Fitted Text Helper ───────────────────────────────────────────
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

  // ── Glass HUD Card Helper ─────────────────────────────────────────────
  const drawCard = (x, y, w, h, borderCol = '#EF4444', sc = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);

    // Glow & Dark glass background
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 28;
    ctx.fillStyle = 'rgba(6, 11, 26, 0.94)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 22);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Subtle top highlight reflection line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 25, -h / 2 + 4);
    ctx.lineTo(w / 2 - 25, -h / 2 + 4);
    ctx.stroke();
  };

  // ── COEP DSAI Club Persistent Watermark Badge ─────────────────────────
  const drawClubWatermark = (t) => {
    ctx.save();
    ctx.translate(540, 130);

    // Sleek translucent pill
    ctx.fillStyle = 'rgba(11, 18, 38, 0.82)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-240, -26, 480, 52, 26);
    ctx.fill();
    ctx.stroke();

    // Glowing cyan pulse dot
    const pulse = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 12 * pulse;
    ctx.beginPath();
    ctx.arc(-205, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Text: COEP DSAI CLUB • THIS WEEK IN AI
    ctx.font = '800 24px Inter, sans-serif';
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ COEP DSAI CLUB  |  THIS WEEK IN AI', 18, 0);

    ctx.restore();
  };

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 1: The Duel (Tiny Laptop vs $100M Supercomputer) ────────
  // ═════════════════════════════════════════════════════════════════════
  const sceneDuel = new THREE.Scene();
  sceneDuel.background = new THREE.Color('#030712');
  sceneDuel.fog = new THREE.FogExp2('#030712', 0.04);
  sceneDuel.add(new THREE.AmbientLight('#1E293B', 1.0));
  const duelGrid = new THREE.GridHelper(100, 50, '#EF4444', '#1E1B4B');
  duelGrid.position.y = -2;
  sceneDuel.add(duelGrid);

  // Left: Realistic 3D Laptop on metallic pedestal
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(-2.6, 0, -4);
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.3), new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.9, roughness: 0.2 }));
  const trackpad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.35), new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8 }));
  trackpad.position.set(0, 0.045, 0.4);
  const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.06), new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#DC2626', emissiveIntensity: 1.4 }));
  screenMesh.position.set(0, 0.55, -0.65);
  screenMesh.rotation.x = -0.25;
  laptopGroup.add(baseMesh, trackpad, screenMesh);
  sceneDuel.add(laptopGroup);

  // Right: Massive $100M Supercomputer tower with blinking rack modules
  const superGroup = new THREE.Group();
  superGroup.position.set(2.8, 1.5, -5);
  const superMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 6.8, 3.2), new THREE.MeshStandardMaterial({ color: '#0B0F19', metalness: 0.92, roughness: 0.2 }));
  const superLed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.0, 0.12), new THREE.MeshBasicMaterial({ color: '#EF4444' }));
  superLed.position.set(-1.32, 0, 0.6);
  superGroup.add(superMesh, superLed);
  sceneDuel.add(superGroup);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 2: The Server Farm Aisles ───────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  const sceneServers = new THREE.Scene();
  sceneServers.background = new THREE.Color('#020617');
  sceneServers.fog = new THREE.FogExp2('#020617', 0.045);
  sceneServers.add(new THREE.AmbientLight('#0F172A', 1.2));
  sceneServers.add(new THREE.GridHelper(120, 60, '#3B82F6', '#0F172A')).position.y = -2;

  const rackGeo = new THREE.BoxGeometry(1.6, 7.5, 2.5);
  const rackMat = new THREE.MeshStandardMaterial({ color: '#0B0F19', metalness: 0.85, roughness: 0.25 });
  const ledMatBlue = new THREE.MeshBasicMaterial({ color: '#F87171' });
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
  // ── 3D SCENE 3: Fully Framed 3D Neural Network Architecture ──────────
  // ═════════════════════════════════════════════════════════════════════
  // Perfectly centered at (0, 0, 0). Width spans -4.2 to +4.2; Height spans -2.6 to +2.6.
  const sceneNeural = new THREE.Scene();
  sceneNeural.background = new THREE.Color('#030712');
  sceneNeural.fog = new THREE.FogExp2('#030712', 0.03);
  sceneNeural.add(new THREE.AmbientLight('#1E1B4B', 1.2));

  const neuralFloorGrid = new THREE.GridHelper(80, 40, '#DC2626', '#0F172A');
  neuralFloorGrid.position.y = -3.8;
  sceneNeural.add(neuralFloorGrid);

  const neuralNodes = [];
  const layersDef = [
    { count: 3, x: -4.2, label: 'INPUT' },
    { count: 5, x: -1.4, label: 'HIDDEN 1' },
    { count: 5, x: 1.4, label: 'HIDDEN 2' },
    { count: 2, x: 4.2, label: 'OUTPUT' },
  ];

  const nodeGeo = new THREE.SphereGeometry(0.24, 20, 20);
  const nodeMat = new THREE.MeshStandardMaterial({
    color: '#EF4444',
    emissive: '#DC2626',
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  const layerNodes = [];
  const linePositions = [];

  layersDef.forEach((ld) => {
    const curLayer = [];
    const step = ld.count === 2 ? 1.8 : (ld.count === 3 ? 1.6 : 1.15);
    for (let nIdx = 0; nIdx < ld.count; nIdx++) {
      const y = (nIdx - (ld.count - 1) / 2) * step;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(ld.x, y, 0);
      sceneNeural.add(node);
      curLayer.push(node.position);
      neuralNodes.push(node);
    }
    layerNodes.push(curLayer);
  });

  // Connect adjacent layers with glowing synapse lines
  for (let l = 0; l < layerNodes.length - 1; l++) {
    layerNodes[l].forEach((p1) => {
      layerNodes[l + 1].forEach((p2) => {
        linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      });
    });
  }

  const neuralLineGeo = new THREE.BufferGeometry();
  neuralLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const neuralLineMat = new THREE.LineBasicMaterial({ color: '#F87171', transparent: true, opacity: 0.45 });
  const neuralLines = new THREE.LineSegments(neuralLineGeo, neuralLineMat);
  sceneNeural.add(neuralLines);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 4: Benchmark Podium & 3D Golden Championship Trophy ─────
  // ═════════════════════════════════════════════════════════════════════
  const sceneBench = new THREE.Scene();
  sceneBench.background = new THREE.Color('#030A16');
  sceneBench.fog = new THREE.FogExp2('#030A16', 0.035);
  sceneBench.add(new THREE.AmbientLight('#0F172A', 1.2));
  sceneBench.add(new THREE.GridHelper(80, 40, '#10B981', '#064E3B')).position.y = -2;

  const podiumGroup = new THREE.Group();
  podiumGroup.position.set(0, -0.6, -2);

  // 3-Tier Podium Base: #1 (center tall), #2 (left), #3 (right)
  const mat1st = new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.8, roughness: 0.3 });
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.4, 32), mat1st);
  base1.position.set(0, 0, 0);
  podiumGroup.add(base1);

  // Golden Trophy Model on top of #1 base
  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(0, 1.6, 0);

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#FACC15',
    emissive: '#CA8A04',
    emissiveIntensity: 0.6,
    metalness: 0.95,
    roughness: 0.15,
  });

  const trophyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.35, 32), goldMat);
  const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.8, 32), goldMat);
  trophyStem.position.y = 0.55;
  const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.3, 1.2, 32), goldMat);
  trophyCup.position.y = 1.4;

  const handleMat = new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.9, roughness: 0.2 });
  const handleL = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 12, 24), handleMat);
  handleL.position.set(-0.95, 1.45, 0);
  const handleR = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 12, 24), handleMat);
  handleR.position.set(0.95, 1.45, 0);

  // Rotating Star emblem inside/above the cup
  const trophyStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), goldMat);
  trophyStar.position.y = 2.3;

  trophyGroup.add(trophyBase, trophyStem, trophyCup, handleL, handleR, trophyStar);
  podiumGroup.add(trophyGroup);
  sceneBench.add(podiumGroup);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 5: Speed Accelerator Highway & Eco Green Battery ────────
  // ═════════════════════════════════════════════════════════════════════
  const sceneSpeed = new THREE.Scene();
  sceneSpeed.background = new THREE.Color('#020617');
  sceneSpeed.fog = new THREE.FogExp2('#020617', 0.04);
  sceneSpeed.add(new THREE.AmbientLight('#0F172A', 1.0));

  const speedGrid = new THREE.GridHelper(100, 50, '#F87171', '#1E293B');
  speedGrid.position.y = -2;
  sceneSpeed.add(speedGrid);

  // 3D Accelerator Turbine Ring
  const turbineGroup = new THREE.Group();
  turbineGroup.position.set(0, 0.8, -4);
  const ringMat = new THREE.MeshStandardMaterial({ color: '#F87171', emissive: '#DC2626', emissiveIntensity: 1.5 });
  const turbineRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.1, 16, 48), ringMat);
  const turbineRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 16, 48), ringMat);
  turbineGroup.add(turbineRing1, turbineRing2);
  sceneSpeed.add(turbineGroup);

  // 3D Green Battery Cell for Eco Efficiency (Shot 11)
  const batteryGroup = new THREE.Group();
  batteryGroup.position.set(0, 0.8, -3.5);

  const batteryGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 2.6, 32),
    new THREE.MeshStandardMaterial({ color: '#0F172A', metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.4 })
  );
  const batteryCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 2.3, 32),
    new THREE.MeshStandardMaterial({ color: '#10B981', emissive: '#059669', emissiveIntensity: 1.8 })
  );
  const batteryCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.9, roughness: 0.2 })
  );
  batteryCap.position.y = 1.4;
  batteryGroup.add(batteryGlass, batteryCore, batteryCap);

  // ═════════════════════════════════════════════════════════════════════
  // ── 3D SCENE 6: Workstation Desk (Shots 12, 13) ──────────────────────
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
  // ── SHOT DEFINITIONS (17 Cuts, Synced Pacing, Frame-Exact HUDs) ──────
  // ═════════════════════════════════════════════════════════════════════

  // ── Shot 00 (Line 0): "This week, a tiny three dollar AI experiment" ──
  {
    const st = cut(0), wTiny = Wd('tiny', 0);
    add({
      id: 'S00', at: st, note: 'Scene 1: Push toward $3 glowing laptop workstation',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        laptopGroup.rotation.y = Math.sin(t * 1.5) * 0.15;
        shoot(sceneDuel, V3(-2.6, 1.2, -1.0), V3(-2.6, 0.6, -2.5), V3(-2.6, 0.3, -4), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);

        // 2D Glass Card: $3 AI EXPERIMENT
        const pop = clamp((t - wTiny) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 500, 840, 240, '#EF4444', sc);
          drawFittedText('⚡ THIS WEEK IN AI', 0, -48, 780, '900 40px Inter, sans-serif', '#F87171');
          drawFittedText('$3 AI EXPERIMENT', 0, 30, 780, '900 82px Inter, sans-serif', '#FACC15');
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

        drawClubWatermark(t);

        const pop = clamp((t - wBeat) / 0.18);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 510, 860, 280, '#EF4444', sc);
          drawFittedText('CLUSTER DISRUPTED', 0, -60, 800, '900 38px Inter, sans-serif', '#F87171');
          drawFittedText('BEATS $100M SUPERCOMPUTER', 0, 20, 800, '900 64px Inter, sans-serif', '#FFFFFF');
          drawFittedText('EFFICIENCY RATIO: 33,000,000X', 0, 85, 800, '800 32px Inter, sans-serif', '#FACC15');
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
      id: 'S02', at: st, note: 'Scene 2: Red market alert & plunging stock line chart HUD',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneDuel, V3(0, 3.2, 2.5), V3(0, 1.0, -0.5), V3(0, 1.0, -5), null, k, LOOKS.warning);
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wScram) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 520, 860, 340, '#F59E0B', sc);
          drawFittedText('MARKET REACTION', 0, -105, 800, '900 38px Inter, sans-serif', '#FDE68A');
          drawFittedText('BIG TECH SCRAMBLING', 0, -48, 800, '900 68px Inter, sans-serif', '#EF4444');

          // Plunging red market chart line
          const chartProg = eo(clamp((t - wScram - 0.15) / 0.45));
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(-340, 35);
          ctx.lineTo(-140, 45);
          ctx.lineTo(50, 15);
          ctx.lineTo(lerp(50, 330, chartProg), lerp(15, 110, chartProg));
          ctx.stroke();

          drawFittedText('AI CAPEX INDEX: -18.4%', 0, 128, 800, '800 30px Inter, sans-serif', '#F87171');
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
        shoot(sceneServers, V3(0, 1.8, 14), V3(0, 1.6, -4), V3(0, 1.5, -35), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wSmart) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 500, 840, 240, '#A855F7', sc);
          drawFittedText('PREVIOUS INDUSTRY BELIEF', 0, -45, 780, '900 38px Inter, sans-serif', '#E9D5FF');
          drawFittedText('MORE SERVERS = SMARTER AI?', 0, 30, 780, '900 60px Inter, sans-serif', '#C084FC');
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
        shoot(sceneServers, V3(0, 5.8, 6), V3(0, 3.5, -12), V3(0, 0.5, -40), null, k, LOOKS.warning);
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wBurn) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 510, 840, 260, '#DC2626', sc);
          drawFittedText('BRUTE FORCE COSTS', 0, -48, 780, '900 38px Inter, sans-serif', '#FCA5A5');
          drawFittedText('$100M+ PER RUN', 0, 30, 780, '900 78px Inter, sans-serif', '#EF4444');
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
      id: 'S05', at: st, note: 'Scene 3: Perfectly framed wide view of full 4-layer 3D Neural Network',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        // Slow majestic drift framing entire neural architecture (-4.2 to +4.2)
        neuralNodes.forEach((n, i) => n.scale.setScalar(1.0 + 0.12 * Math.sin(t * 4 + i)));
        shoot(sceneNeural, V3(-3.5, 1.2, 14.5), V3(1.5, 0.4, 13.5), V3(0, 0.1, 0), null, k, { ...LOOKS.cyber, fov: 44 });
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wTrick) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 480, 840, 240, '#EF4444', sc);
          drawFittedText('SCIENTIFIC BREAKTHROUGH', 0, -45, 780, '900 38px Inter, sans-serif', '#67E8F9');
          drawFittedText('A BRAND NEW TRICK', 0, 30, 780, '900 74px Inter, sans-serif', '#EF4444');
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
      id: 'S06', at: st, note: 'Scene 3: Orbit view of neural network with parameter scale card',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        neuralNodes.forEach((n, i) => n.scale.setScalar(1.0 + 0.1 * Math.sin(t * 5 + i)));
        shoot(sceneNeural, V3(1.5, 0.4, 13.5), V3(3.8, 1.2, 13.0), V3(0, 0.1, 0), null, k, { ...LOOKS.cyber, fov: 44 });
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wBill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 500, 840, 260, '#64748B', sc);
          drawFittedText('OLD SCALING APPROACH', 0, -45, 780, '900 38px Inter, sans-serif', '#CBD5E1');
          drawFittedText('+100 BILLION PARAMETERS', 0, 32, 780, '900 62px Inter, sans-serif', '#F87171');
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
      id: 'S07', at: st, note: 'Scene 3: Synapses pulse bright gold as pathways rewire dynamically',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        // Golden synaptic pulse effect
        neuralLineMat.color.set(t % 0.4 > 0.2 ? '#FACC15' : '#EF4444');
        neuralNodes.forEach((n, i) => n.scale.setScalar(1.0 + 0.18 * Math.sin(t * 8 + i)));
        shoot(sceneNeural, V3(3.8, 1.2, 13.0), V3(0, 0.2, 11.5), V3(0, 0, 0), null, k, { ...LOOKS.cyber, fov: 42 });
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wNeural) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 500, 840, 260, '#10B981', sc);
          drawFittedText('ARCHITECTURAL REVOLUTION', 0, -45, 780, '900 38px Inter, sans-serif', '#6EE7B7');
          drawFittedText('REORGANIZED SYNAPSES', 0, 32, 780, '900 66px Inter, sans-serif', '#34D399');
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
      id: 'S08', at: st, note: 'Scene 4: 3D Championship Gold Trophy & Animated Benchmark Bar Chart',
      draw(lt, d, t, blit) {
        trophyStar.rotation.y = t * 2.5;
        trophyStar.rotation.z = t * 1.2;
        podiumGroup.rotation.y = Math.sin(t * 0.8) * 0.2;
        const k = eio(clamp(lt / d));
        shoot(sceneBench, V3(-1.5, 2.4, 4.0), V3(1.0, 1.8, 3.2), V3(0, 1.4, 0), null, k, LOOKS.clean);
        blit();

        drawClubWatermark(t);

        // 2D Benchmark Dashboard with Animated Growing Bars
        const pop = clamp((t - wPct) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 530, 860, 420, '#10B981', sc);

          drawFittedText('🏆 BENCHMARK EVALUATION (MMLU)', 0, -145, 800, '900 36px Inter, sans-serif', '#6EE7B7');
          drawFittedText('98.4% ACCURACY', 0, -65, 800, '900 86px Inter, sans-serif', '#FACC15');

          // Animated Bar 1: New Model (Green)
          const barAnim = eo(clamp((t - wPct - 0.1) / 0.5));
          const w1 = lerp(0, 580, barAnim);
          const w2 = lerp(0, 410, barAnim);

          ctx.fillStyle = '#10B981';
          ctx.beginPath(); ctx.roundRect(-290, 20, w1, 44, 10); ctx.fill();
          drawFittedText('TINY AI (OURS) - 98.4%', -270 + w1 / 2, 42, w1 - 20, '800 24px Inter, sans-serif', '#FFFFFF');

          // Animated Bar 2: Baseline Model (Gray)
          ctx.fillStyle = '#475569';
          ctx.beginPath(); ctx.roundRect(-290, 85, w2, 44, 10); ctx.fill();
          drawFittedText('FRONTIER MODEL - 72.1%', -270 + w2 / 2, 107, w2 - 20, '800 24px Inter, sans-serif', '#E2E8F0');

          drawFittedText('TEST EVALUATION PASSED', 0, 160, 800, '700 24px Inter, sans-serif', '#94A3B8');
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
      id: 'S09', at: st, note: 'Scene 4: Camera pulls back revealing full gold podium victory',
      draw(lt, d, t, blit) {
        trophyStar.rotation.y = t * 2.5;
        podiumGroup.rotation.y = Math.sin(t * 0.8) * 0.2;
        const k = eio(clamp(lt / d));
        shoot(sceneBench, V3(1.0, 1.8, 3.2), V3(0, 3.2, 6.0), V3(0, 1.4, 0), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wCrush) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 500, 840, 260, '#F59E0B', sc);
          drawFittedText('FLAGSHIP PERFORMANCE', 0, -45, 780, '900 38px Inter, sans-serif', '#FDE68A');
          drawFittedText('CRUSHES STANDARD SOTA', 0, 35, 780, '900 66px Inter, sans-serif', '#FBBF24');
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
      id: 'S10', at: st, note: 'Scene 5: 3D Speed Accelerator Highway + Circular Radial Speedometer HUD',
      draw(lt, d, t, blit) {
        turbineGroup.rotation.z = t * 4.0;
        speedGrid.position.z = (t * 15) % 10;
        const k = eio(clamp(lt / d));
        shoot(sceneSpeed, V3(0, 1.4, 3.5), V3(0, 0.8, -1.0), V3(0, 0.8, -4), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);

        // 2D Circular Radial Speedometer HUD
        const pop = clamp((t - wFast) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 520, 840, 380, '#3B82F6', sc);

          drawFittedText('INFERENCE SPEED GAUGE', 0, -135, 780, '900 38px Inter, sans-serif', '#93C5FD');

          // Circular Arc Dial
          const speedAnim = eo(clamp((t - wFast - 0.1) / 0.5));
          ctx.lineWidth = 14;
          ctx.strokeStyle = '#1E293B';
          ctx.beginPath();
          ctx.arc(0, 10, 95, Math.PI * 0.8, Math.PI * 2.2);
          ctx.stroke();

          // Glowing Speed Sweep Arc
          ctx.strokeStyle = '#F87171';
          ctx.shadowColor = '#F87171';
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(0, 10, 95, Math.PI * 0.8, Math.PI * 0.8 + speedAnim * Math.PI * 1.4);
          ctx.stroke();
          ctx.shadowBlur = 0;

          const currentX = Math.round(lerp(1, 70, speedAnim));
          drawFittedText(`${currentX}X FASTER`, 0, 15, 780, '900 74px Inter, sans-serif', '#60A5FA');
          drawFittedText('REAL-TIME HARDWARE INFERENCE', 0, 115, 780, '800 28px Inter, sans-serif', '#BFDBFE');
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
      id: 'S11', at: st, note: 'Scene 5: 3D Eco Green Battery Cell + Energy Reduction HUD',
      draw(lt, d, t, blit) {
        if (!sceneSpeed.children.includes(batteryGroup)) sceneSpeed.add(batteryGroup);
        if (sceneSpeed.children.includes(turbineGroup)) sceneSpeed.remove(turbineGroup);
        batteryGroup.rotation.y = t * 1.2;
        const k = eio(clamp(lt / d));
        shoot(sceneSpeed, V3(-1.0, 1.4, 2.5), V3(1.0, 0.8, 1.0), V3(0, 0.8, -3.5), null, k, LOOKS.clean);
        blit();

        drawClubWatermark(t);

        // 2D Battery & Energy Reduction HUD
        const pop = clamp((t - wLess) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 520, 840, 360, '#10B981', sc);

          drawFittedText('ENERGY CONSUMPTION', 0, -120, 780, '900 38px Inter, sans-serif', '#6EE7B7');
          drawFittedText('-90% ELECTRICITY', 0, -40, 780, '900 78px Inter, sans-serif', '#34D399');

          // Segmented Battery Bar
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 5;
          ctx.strokeRect(-220, 30, 440, 50);
          ctx.fillStyle = '#10B981';
          ctx.fillRect(222, 45, 16, 20);

          // Power draw level
          ctx.fillStyle = '#34D399';
          ctx.fillRect(-210, 40, 65, 30);

          drawFittedText('DRAWS ONLY 10% OF TRADITIONAL POWER', 0, 120, 780, '800 28px Inter, sans-serif', '#A7F3D0');
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
        shoot(sceneWorkstation, V3(0, 1.4, 0.5), V3(0, 0.4, -1.8), V3(0, -0.4, -3.5), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);

        // 2D Monospace Terminal HUD
        const pop = clamp((t - wLap) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 520, 860, 350, '#8B5CF6', sc);

          drawFittedText('HARDWARE COMPATIBILITY', 0, -118, 800, '900 36px Inter, sans-serif', '#DDD6FE');
          drawFittedText('💻 RUNS ON EVERYDAY LAPTOP', 0, -58, 800, '900 60px Inter, sans-serif', '#A78BFA');

          // Terminal window body
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(-380, -5, 760, 115);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(-380, -5, 760, 115);

          drawFittedText('> python run_model.py --weights 3GB', -350, 25, 700, '600 22px Courier New', '#F87171', 'left');
          drawFittedText('[OK] VRAM: 2.1 GB used | Tokens/sec: 145.2', -350, 70, 700, '600 22px Courier New', '#4ADE80', 'left');

          drawFittedText('ZERO CLOUD APIS REQUIRED', 0, 140, 800, '800 26px Inter, sans-serif', '#C4B5FD');
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
        shoot(sceneWorkstation, V3(0, 0.4, -1.8), V3(0, 2.5, 1.5), V3(0, -0.4, -3.5), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wTurn) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 500, 840, 250, '#FACC15', sc);
          drawFittedText('GLOBAL AI MILESTONE', 0, -45, 780, '900 38px Inter, sans-serif', '#FEF08A');
          drawFittedText('MAJOR TURNING POINT', 0, 35, 780, '900 72px Inter, sans-serif', '#FACC15');
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
      id: 'S14', at: st, note: 'Scene 2: High altitude majestic sweep across server horizon',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneServers, V3(0, 1.5, 0), V3(0, 6.0, -12), V3(0, 1.0, -35), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 15 (Line 15): "might not come from a trillion dollar data center," ──
  {
    const st = cut(15), wTrill = Wd('trillion', 15);
    add({
      id: 'S15', at: st, note: 'Scene 2: Red Neon Alert across $1 Trillion Data Center',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneServers, V3(0, 4.0, -6), V3(0, 2.0, 0), V3(0, 1.0, -25), null, k, LOOKS.warning);
        blit();

        drawClubWatermark(t);

        const pop = clamp((t - wTrill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 500, 860, 280, '#DC2626', sc);
          drawFittedText('THE FUTURE IS CLEAR', 0, -50, 800, '900 40px Inter, sans-serif', '#FCA5A5');
          drawFittedText('NO $1T DATA CENTER NEEDED', 0, 30, 800, '900 64px Inter, sans-serif', '#EF4444');
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
      id: 'S16', at: st, note: 'Infinite Loop: Returns to $3 laptop desk with COEP DSAI Club CTA',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        shoot(sceneDuel, V3(0, 3.5, 5), V3(-2.6, 1.2, -1.0), V3(-2.6, 0.3, -4), null, k, LOOKS.cyber);
        blit();

        drawClubWatermark(t);

        // Branded Outro Card
        const pop = clamp((t - wStart) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 520, 880, 320, '#EF4444', sc);
          drawFittedText('FOLLOW FOR WEEKLY AI BREAKDOWNS', 0, -85, 820, '900 36px Inter, sans-serif', '#F87171');
          drawFittedText('@coep_dsai', 0, -20, 820, '900 78px Inter, sans-serif', '#FACC15');
          drawFittedText("COEP'S DATA SCIENCE & AI CLUB", 0, 60, 820, '800 32px Inter, sans-serif', '#FFFFFF');
          drawFittedText('Looping to beginning...', 0, 115, 820, '600 24px Inter, sans-serif', '#94A3B8');
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wStart, 'pop', { gain: 0.9 });
  }

  return { shots: S, cues: CUES };
}
