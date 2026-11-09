// THIS WEEK IN AI: Animated 3D & Pop Info Explainer
// Tall Tale 3D style: 2D cartoon people in a sunny 3D tech world + animated charts & numbers.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import { Toon, PROPS } from './core/toon.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const talk = (t, on = 1) => (on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 5.3)) : 0);
const blink = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);

// Cast definition
const LOOK = {
  researcher: { body: '#4FB3A9', pattern: 'vest', patCol: '#2B5E73', hat: 'cap', hatCol: '#2F8F5B', extra: ['glasses', 'pencil'] },
  ceo: { body: '#4A4560', hat: 'tophat', hatCol: '#2A2638', neck: 'bowtie', neckCol: '#D8343F', dots: 1, pattern: 'vest', patCol: '#2A2638', extra: ['monocle', 'mustache'] },
  engineer: { body: '#6FA35A', pattern: 'overalls', patCol: '#3E5FA8', hat: 'boater', hatCol: '#E8C77A', band: '#B5372E' },
  student: { body: '#7FC8E8', hat: 'bow', hatCol: '#3C6FB6', kid: false, extra: ['freckles'] },
};
const person = (k, opts) => new Toon({ ...LOOK[k], extra: [...(LOOK[k].extra || [])] }, opts);

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);
  const cam = camera(36);
  const LOOKS = {
    street: { bloom: 0.18, aperture: 0.0012, maxblur: 0.008 },
    room: { bloom: 0.32, aperture: 0.001, maxblur: 0.008 },
    field: { bloom: 0.25, aperture: 0.001, maxblur: 0.007 },
  };
  const shoot = (scene, people, from, to, at, at2, k, look, focus) => {
    if (cam.fov !== (look.fov || 36)) { cam.fov = look.fov || 36; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k)); cam.lookAt(at2 ? mix(at, at2, k) : at);
    people.forEach((p) => p.face(cam));
    E.render(scene, cam, { ...look, focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at) });
  };

  // Helper for pop-in cards
  const drawCard = (x, y, w, h, bg, border, rot = 0, sc = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-w/2 + 10, -h/2 + 15, w, h);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 24);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    ctx.stroke();
  };

  // ── Sets ─────────────────────────────────────────────────────────────
  const SHOP_ORDER = [
    ['TECH LAB', '#4FB3A9', 'brick', '#2F8F5B'],
    ['DATA CENTER', '#3E5FA8', 'brick', '#2E4E8A'],
    ['AI VENTURES', '#E58A6A', 'wood', '#2E4E3F'],
    ['SUPERCOMPUTER', '#4A4560', 'brick', '#F2C230'],
    ['HARDWARE HQ', '#B5553C', 'brick', '#F2C230'],
    ['CLOUD SERVERS', '#6FA3B8', 'wood', null],
  ];
  const ST = WD.mainStreet(E, { shops: SHOP_ORDER });
  ST.sun.key.target.position.set(-4, 0, 0); ST.sun.key.position.set(5, 13, 6);
  const LAB = ST.buildings[0];
  const stDev = person('researcher'), stCeo = person('ceo'), stEng = person('engineer');
  [stDev, stCeo, stEng].forEach((p) => ST.scene.add(p.group));

  // Interior Lab
  const viewST = (scene, from, look, people = []) => {
    const c = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 800);
    c.position.copy(from); c.lookAt(look);
    people.forEach((p) => p.face(c));
    const t = WD.snapshot(E, scene, c);
    t.wrapS = THREE.RepeatWrapping;
    return t;
  };
  const IN = WD.interior(E, {
    wall: '#1E293B',
    motif: '#334155',
    ceiling: '#0F172A',
    signText: 'AI BENCHMARKS',
    view: viewST(ST.scene, V3(2, 1.8, -12), V3(-3, 2.2, 10), ST.people),
    picture: false,
  });
  const inDev = person('researcher'), inCeo = person('ceo'), inEng = person('engineer');
  [inDev, inCeo, inEng].forEach((p) => IN.scene.add(p.group));
  const inPeople = [inDev, inCeo, inEng];

  // Executive Office / Big Tech HQ
  const OF = WD.interior(E, {
    w: 7, depth: 6,
    wall: '#2E4E8A', motif: '#3A5E9C', ceiling: '#2A2638', floor: '#7A3E24',
    signText: 'BIG TECH HQ', counterOn: false, litter: false,
    view: viewST(ST.scene, V3(0, 6, 6), V3(0, 3, -40)),
  });
  const ofCeo = person('ceo'), ofDev = person('researcher');
  [ofCeo, ofDev].forEach((p) => OF.scene.add(p.group));

  // ── Shot 00 (Line 0): "This week, a tiny three dollar AI experiment" ──
  {
    const st = cut(0), wTiny = Wd('tiny', 0), wExp = Wd('experiment', 0);
    add({
      id: 'S00', at: st, note: 'Hook: Researcher smug with tiny $3 experiment, camera pushes in',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        stDev.at(-4.8, 0.18, LAB.z - 1.2);
        stDev.set({ mood: 'smug', armR: [60, -30], armL: [30, 10], blink: blink(t) });
        stCeo.group.visible = false; stEng.group.visible = false;
        shoot(ST.scene, [stDev], V3(-2.0, 2.2, LAB.z - 6.5), V3(-4.0, 1.8, LAB.z - 3.2), V3(-4.8, 1.3, LAB.z - 1.2), null, k, LOOKS.street);
        blit();

        // 2D Pop Info: $3 VS $100M
        const pop = clamp((t - wTiny) / 0.22);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 520, 720, 260, '#0F172A', '#38BDF8', -0.04, sc);
          ctx.fillStyle = '#38BDF8'; ctx.font = '900 48px Inter'; ctx.textAlign = 'center';
          ctx.fillText('BREAKTHROUGH REPORT', 0, -60);
          ctx.fillStyle = '#FACC15'; ctx.font = '900 90px Inter';
          ctx.fillText('$3 EXPERIMENT', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st + 0.05, 'whoosh', { gain: 0.6 });
    cue(wTiny, 'ding', { gain: 0.8 });
  }

  // ── Shot 01 (Line 1): "just beat a hundred million dollar supercomputer." ──
  {
    const st = cut(1), wBeat = Wd('beat', 1), wSuper = Wd('supercomputer.', 1);
    add({
      id: 'S01', at: st, note: 'Supercomputer vs tiny laptop, huge explosion effect / ding',
      draw(lt, d, t, blit) {
        const k = eo(clamp(lt / d));
        inDev.at(2.2, 0, -2.5); inDev.set({ mood: 'proud', armR: [140, 20], armL: [140, 20], blink: blink(t) });
        inCeo.at(3.4, 0, -2.5); inCeo.set({ mood: 'shock', armL: [50, -40], armR: [50, -40], sweat: 1 });
        shoot(IN.scene, inPeople, V3(0.5, 1.8, 0.5), V3(1.2, 1.7, -0.6), V3(2.8, 1.4, -2.5), null, k, LOOKS.room);
        blit();

        // 2D Pop Info: BEATS $100M SUPERCOMPUTER
        const pop = clamp((t - wBeat) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawCard(540, 500, 780, 280, '#7F1D1D', '#EF4444', 0.03, sc);
          ctx.fillStyle = '#F87171'; ctx.font = '900 46px Inter'; ctx.textAlign = 'center';
          ctx.fillText('CRUSHED IN BENCHMARKS', 0, -55);
          ctx.fillStyle = '#FFFFFF'; ctx.font = '900 78px Inter';
          ctx.fillText('BEATS $100M CLUSTER', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wBeat, 'stamp', { gain: 1.0 });
    cue(wSuper, 'boing', { gain: 0.7 });
  }

  // ── Shot 02 (Line 2): "And the biggest tech giants are scrambling." ──
  {
    const st = cut(2), wScram = Wd('scrambling.', 2);
    add({
      id: 'S02', at: st, note: 'Big Tech CEOs running and sweating across the street',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        stCeo.at(-3.0 + k * 1.5, 0.18, LAB.z - 2.0);
        stCeo.set({ legs: 'run', phase: t * 14, mood: 'worried', sweat: 1, armL: [80, 40], armR: [80, -40] });
        stDev.group.visible = false;
        shoot(ST.scene, [stCeo], V3(-1.0, 2.0, LAB.z - 5.5), V3(-1.5, 1.9, LAB.z - 4.0), V3(-2.2, 1.3, LAB.z - 1.5), null, k, LOOKS.street);
        blit();
      }
    });
    cue(st, 'whoosh');
    cue(wScram, 'pop', { gain: 0.7 });
  }

  // ── Shot 03 (Line 3): "See, for years, companies believed making AI smarter" ──
  {
    const st = cut(3), wBel = Wd('believed', 3);
    add({
      id: 'S03', at: st, note: 'CEO presenting the old brute force AI paradigm',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        ofCeo.at(0.4, 0, -3.5);
        ofCeo.set({ mood: 'smug', armR: [110, -30], armL: [20, 10], blink: blink(t) });
        ofDev.group.visible = false;
        shoot(OF.scene, [ofCeo], V3(0.5, 1.8, -0.5), V3(0.4, 1.6, -1.8), V3(0.4, 1.4, -3.5), null, k, LOOKS.room);
        blit();
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 04 (Line 4): "meant burning millions on massive server farms." ──
  {
    const st = cut(4), wBurn = Wd('burning', 4), wFarms = Wd('farms.', 4);
    add({
      id: 'S04', at: st, note: 'Burning millions on data centers card',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        ofCeo.at(0.4, 0, -3.5);
        ofCeo.set({ mood: 'shock', armL: [80, 20], armR: [80, -20], sweat: 1 });
        shoot(OF.scene, [ofCeo], V3(0.6, 1.7, -1.0), V3(0.4, 1.6, -2.0), V3(0.4, 1.4, -3.5), null, k, LOOKS.room);
        blit();

        const pop = clamp((t - wBurn) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 520, 740, 240, '#1E1B4B', '#6366F1', -0.02, sc);
          ctx.fillStyle = '#A5B4FC'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center';
          ctx.fillText('OLD BRUTE FORCE PARADIGM', 0, -45);
          ctx.fillStyle = '#EF4444'; ctx.font = '900 76px Inter';
          ctx.fillText('MILLIONS WASTED', 0, 35);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wBurn, 'ding', { gain: 0.8 });
  }

  // ── Shot 05 (Line 5): "Then researchers tested a brand new trick." ──
  {
    const st = cut(5), wTrick = Wd('trick.', 5);
    add({
      id: 'S05', at: st, note: 'Researcher lightbulb eureka moment',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inDev.at(2.5, 0, -2.5); inDev.set({ mood: 'happy', armR: [150, 10], armL: [30, 20], blink: blink(t) });
        inCeo.group.visible = false;
        shoot(IN.scene, [inDev], V3(1.2, 1.8, -0.8), V3(1.8, 1.6, -1.6), V3(2.5, 1.4, -2.5), null, k, LOOKS.room);
        blit();
      }
    });
    cue(st, 'whoosh');
    cue(wTrick, 'ding', { gain: 0.9 });
  }

  // ── Shot 06 (Line 6): "Instead of adding billions more parameters," ──
  {
    const st = cut(6), wBill = Wd('billions', 6);
    add({
      id: 'S06', at: st, note: 'Graph showing diminishing returns of model size',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inDev.at(2.5, 0, -2.5); inDev.set({ mood: 'smug', armL: [40, 10], armR: [40, -10] });
        shoot(IN.scene, [inDev], V3(1.4, 1.7, -1.0), V3(1.9, 1.6, -1.8), V3(2.5, 1.4, -2.5), null, k, LOOKS.room);
        blit();

        const pop = clamp((t - wBill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.3, 1.0, eob(pop));
          drawCard(540, 520, 720, 240, '#0F172A', '#94A3B8', 0.02, sc);
          ctx.fillStyle = '#CBD5E1'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center';
          ctx.fillText('STANDARD SCALING LAW', 0, -45);
          ctx.fillStyle = '#F87171'; ctx.font = '900 68px Inter';
          ctx.fillText('+100B PARAMETERS', 0, 30);
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
      id: 'S07', at: st, note: 'Neural connection reorganization',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inDev.at(2.5, 0, -2.5); inDev.set({ mood: 'proud', armR: [120, -20], armL: [120, 20] });
        shoot(IN.scene, [inDev], V3(1.5, 1.7, -1.2), V3(2.0, 1.6, -2.0), V3(2.5, 1.4, -2.5), null, k, LOOKS.room);
        blit();

        const pop = clamp((t - wNeural) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.4, 1.0, eob(pop));
          drawCard(540, 520, 740, 240, '#042F2E', '#14B8A6', -0.02, sc);
          ctx.fillStyle = '#5EEAD4'; ctx.font = '900 44px Inter'; ctx.textAlign = 'center';
          ctx.fillText('ARCHITECTURAL REVOLUTION', 0, -45);
          ctx.fillStyle = '#2DD4BF'; ctx.font = '900 70px Inter';
          ctx.fillText('SPARSE PATHWAYS', 0, 32);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wNeural, 'pop', { gain: 0.8 });
  }

  // ── Shot 08 (Line 8): "The result? The model scored ninety-eight percent" ──
  {
    const st = cut(8), wRes = Wd('result?', 8), wPct = Wd('percent', 8);
    add({
      id: 'S08', at: st, note: '98% ACCURACY badge pops on screen',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inDev.at(2.5, 0, -2.5); inDev.set({ mood: 'laugh', armR: [150, 10], armL: [150, -10] });
        shoot(IN.scene, [inDev], V3(1.3, 1.8, -1.0), V3(1.8, 1.6, -1.8), V3(2.5, 1.4, -2.5), null, k, LOOKS.room);
        blit();

        const pop = clamp((t - wPct) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.8, 1.0, eob(pop));
          drawCard(540, 520, 760, 280, '#064E3B', '#10B981', 0.03, sc);
          ctx.fillStyle = '#6EE7B7'; ctx.font = '900 48px Inter'; ctx.textAlign = 'center';
          ctx.fillText('BENCHMARK ACCURACY', 0, -55);
          ctx.fillStyle = '#FACC15'; ctx.font = '900 96px Inter';
          ctx.fillText('98.4% SCORE', 0, 40);
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
      id: 'S09', at: st, note: 'Flagship models crushed, CEO dizzy',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inCeo.at(3.0, 0, -2.5); inCeo.set({ mood: 'dizzy', armL: [30, 40], armR: [30, -40], sweat: 1 });
        shoot(IN.scene, [inCeo], V3(1.8, 1.7, -1.0), V3(2.4, 1.6, -1.8), V3(3.0, 1.4, -2.5), null, k, LOOKS.room);
        blit();
      }
    });
    cue(st, 'whoosh');
    cue(wCrush, 'boing', { gain: 0.8 });
  }

  // ── Shot 10 (Line 10): "It runs seventy times faster," ──
  {
    const st = cut(10), wFast = Wd('faster,', 10);
    add({
      id: 'S10', at: st, note: '70X FASTER Speedometer metric card',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inDev.at(2.5, 0, -2.5); inDev.set({ mood: 'proud', armR: [90, 30], armL: [20, 10] });
        shoot(IN.scene, [inDev], V3(1.5, 1.7, -1.0), V3(2.0, 1.6, -1.8), V3(2.5, 1.4, -2.5), null, k, LOOKS.room);
        blit();

        const pop = clamp((t - wFast) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.6, 1.0, eob(pop));
          drawCard(540, 520, 720, 260, '#172554', '#3B82F6', -0.03, sc);
          ctx.fillStyle = '#93C5FD'; ctx.font = '900 46px Inter'; ctx.textAlign = 'center';
          ctx.fillText('INFERENCE SPEED', 0, -50);
          ctx.fillStyle = '#60A5FA'; ctx.font = '900 92px Inter';
          ctx.fillText('70X FASTER', 0, 38);
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
      id: 'S11', at: st, note: '90% LESS POWER Energy savings badge',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inDev.at(2.5, 0, -2.5); inDev.set({ mood: 'happy', armL: [120, -20], armR: [120, 20] });
        shoot(IN.scene, [inDev], V3(1.4, 1.7, -1.0), V3(1.9, 1.6, -1.8), V3(2.5, 1.4, -2.5), null, k, LOOKS.room);
        blit();

        const pop = clamp((t - wLess) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 520, 720, 260, '#14532D', '#22C55E', 0.02, sc);
          ctx.fillStyle = '#86EFAC'; ctx.font = '900 46px Inter'; ctx.textAlign = 'center';
          ctx.fillText('POWER CONSUMPTION', 0, -50);
          ctx.fillStyle = '#4ADE80'; ctx.font = '900 86px Inter';
          ctx.fillText('-90% ELECTRICITY', 0, 36);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wLess, 'pop', { gain: 0.8 });
  }

  // ── Shot 12 (Line 12): "and can run locally on an everyday laptop." ──
  {
    const st = cut(12), wLap = Wd('laptop.', 12);
    add({
      id: 'S12', at: st, note: 'Researcher holding everyday laptop triumphantly',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        inDev.at(2.5, 0, -2.5); inDev.set({ mood: 'smug', armR: [140, 30], armL: [40, -20], blink: blink(t) });
        shoot(IN.scene, [inDev], V3(1.6, 1.7, -1.2), V3(2.1, 1.6, -1.9), V3(2.5, 1.4, -2.5), null, k, LOOKS.room);
        blit();

        const pop = clamp((t - wLap) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 520, 740, 260, '#312E81', '#818CF8', -0.02, sc);
          ctx.fillStyle = '#C7D2FE'; ctx.font = '900 46px Inter'; ctx.textAlign = 'center';
          ctx.fillText('HARDWARE REQUIREMENTS', 0, -50);
          ctx.fillStyle = '#A5B4FC'; ctx.font = '900 80px Inter';
          ctx.fillText('RUNS ON LAPTOP', 0, 36);
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
      id: 'S13', at: st, note: 'Engineers cheering outside tech lab',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        stDev.at(-4.8, 0.18, LAB.z - 1.2); stDev.set({ mood: 'laugh', armR: [150, 10], armL: [150, -10] });
        stEng.at(-3.8, 0.18, LAB.z - 1.6); stEng.set({ mood: 'proud', armL: [130, 20], armR: [30, -20] });
        shoot(ST.scene, [stDev, stEng], V3(-2.2, 2.2, LAB.z - 6.5), V3(-3.5, 1.9, LAB.z - 3.8), V3(-4.3, 1.3, LAB.z - 1.4), null, k, LOOKS.street);
        blit();
      }
    });
    cue(st, 'whoosh');
    cue(wTurn, 'stamp', { gain: 0.8 });
  }

  // ── Shot 14 (Line 14): "Because tomorrow's most powerful AI" ──
  {
    const st = cut(14), wPower = Wd('powerful', 14);
    add({
      id: 'S14', at: st, note: 'Dramatic camera ascent towards the sunny tech horizon',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        stDev.at(-4.8, 0.18, LAB.z - 1.2); stDev.set({ mood: 'proud', armR: [70, -20], armL: [70, 20] });
        shoot(ST.scene, [stDev], V3(-3.0, 2.4, LAB.z - 5.0), V3(-3.8, 3.2, LAB.z - 3.5), V3(-4.8, 1.5, LAB.z - 1.2), null, k, LOOKS.street);
        blit();
      }
    });
    cue(st, 'whoosh');
  }

  // ── Shot 15 (Line 15): "might not come from a trillion dollar data center," ──
  {
    const st = cut(15), wTrill = Wd('trillion', 15);
    add({
      id: 'S15', at: st, note: 'Trillion dollar data center crossing out',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        stCeo.at(-3.2, 0.18, LAB.z - 2.0); stCeo.set({ mood: 'worried', sweat: 1, armL: [60, 20], armR: [60, -20] });
        shoot(ST.scene, [stCeo], V3(-1.2, 2.0, LAB.z - 5.0), V3(-2.0, 1.9, LAB.z - 3.5), V3(-3.2, 1.3, LAB.z - 2.0), null, k, LOOKS.street);
        blit();

        const pop = clamp((t - wTrill) / 0.2);
        if (pop > 0) {
          const sc = lerp(1.5, 1.0, eob(pop));
          drawCard(540, 520, 760, 260, '#450A0A', '#DC2626', -0.03, sc);
          ctx.fillStyle = '#FCA5A5'; ctx.font = '900 46px Inter'; ctx.textAlign = 'center';
          ctx.fillText('NO NEED FOR', 0, -50);
          ctx.fillStyle = '#EF4444'; ctx.font = '900 78px Inter';
          ctx.fillText('$1 TRILLION CLUSTERS', 0, 36);
          ctx.restore();
        }
      }
    });
    cue(st, 'whoosh');
    cue(wTrill, 'ding', { gain: 0.8 });
  }

  // ── Shot 16 (Line 16): "and it all started when..." ──
  {
    const st = cut(16), wStart = Wd('started', 16);
    add({
      id: 'S16', at: st, note: 'Loop Climax: Camera zooms right back to researcher at start',
      draw(lt, d, t, blit) {
        const k = eio(clamp(lt / d));
        stDev.at(-4.8, 0.18, LAB.z - 1.2); stDev.set({ mood: 'smug', armR: [60, -30], armL: [30, 10], blink: blink(t) });
        shoot(ST.scene, [stDev], V3(-3.5, 2.0, LAB.z - 4.5), V3(-2.0, 2.2, LAB.z - 6.5), V3(-4.8, 1.3, LAB.z - 1.2), null, k, LOOKS.street);
        blit();
      }
    });
    cue(st, 'whoosh');
    cue(wStart, 'pop', { gain: 0.9 });
  }

  return { shots: S, cues: CUES };
}
