import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as THREE from 'three';

/* ══════════════════════════════════════════════════
   THEME — extracted from Book.jsx (strict globals)
══════════════════════════════════════════════════ */
const T = {
  bg: '#080c1f',
  grad: 'linear-gradient(135deg, #080c1f 0%, #0d1235 55%, #131a42 100%)',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.09)',
  borderBright: 'rgba(255,255,255,0.18)',
  accent: '#f5c842',
  accentDark: '#c9a020',
  text: '#eef2ff',
  muted: '#8896b0',
  // Seat colors
  seatAvailHex: '#8b5a2b',
  seatAvailC: new THREE.Color('#8b5a2b'),
  seatMaleHex: '#3b82f6',
  seatMaleC: new THREE.Color('#3b82f6'),
  seatFemaleHex: '#ec4899',
  seatFemaleC: new THREE.Color('#ec4899'),
  seatBookedMHex: '#4a3014',
  seatBookedMC: new THREE.Color('#4a3014'),
  seatBookedFHex: '#4a3014',
  seatBookedFC: new THREE.Color('#4a3014'),
  seatHoverC: new THREE.Color('#f5c842'),
};

/* ══════════════════════════════════════════════════
   SEAT GENERATOR — simulates seat.php backend logic
══════════════════════════════════════════════════ */
const genSeats = (routeId = 1, totalRows = 10) => {
  const bookedSet = new Set([2, 5, 9, 14, 18, 22, 28, 33, 37]);
  const seats = [];
  let id = 1;
  for (let row = 1; row <= totalRows; row++) {
    ['A', 'B', 'C', 'D'].forEach((col, ci) => {
      const booked = bookedSet.has(id);
      seats.push({
        id,
        seatNumber: `${String(row).padStart(2, '0')}${col}`,
        row,
        side: ci < 2 ? 'left' : 'right',
        col: ci % 2,
        status: booked ? 'booked' : 'available',
        gender: booked ? ((id + routeId) % 3 === 0 ? 'female' : 'male') : null,
      });
      id++;
    });
  }
  return seats;
};

/* ══════════════════════════════════════════════════
   ANIMATED BUS — SVG bus sliding along dotted route
══════════════════════════════════════════════════ */
const AnimBus = () => {
  const busRef = useRef(null);
  useEffect(() => {
    let pos = 0, raf;
    const tick = () => {
      pos = (pos + 0.13) % 100;
      if (busRef.current) busRef.current.style.left = pos + '%';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: 'relative', height: 22, flex: 1, minWidth: 0 }}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '2px dashed rgba(255,255,255,0.15)', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', borderLeft: '7px solid rgba(255,255,255,0.2)', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
      <div ref={busRef} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%) translateX(-50%)', willChange: 'left', filter: 'drop-shadow(0 0 8px rgba(245,200,66,0.9))' }}>
        <svg width="34" height="17" viewBox="0 0 34 17" fill="none">
          <rect x="1" y="1" width="30" height="13" rx="3" fill="#f5c842" />
          <rect x="3" y="3" width="4.5" height="4.5" rx="0.8" fill="#080c1f" opacity="0.75" />
          <rect x="9" y="3" width="4.5" height="4.5" rx="0.8" fill="#080c1f" opacity="0.75" />
          <rect x="15" y="3" width="4.5" height="4.5" rx="0.8" fill="#080c1f" opacity="0.75" />
          <rect x="21" y="3" width="4.5" height="4.5" rx="0.8" fill="#080c1f" opacity="0.75" />
          <circle cx="7" cy="14.5" r="2.2" fill="#080c1f" stroke="#f5c842" strokeWidth="1" />
          <circle cx="25" cy="14.5" r="2.2" fill="#080c1f" stroke="#f5c842" strokeWidth="1" />
          <rect x="29" y="5" width="3.5" height="4" rx="0.8" fill="#fff" opacity="0.85" />
        </svg>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   JOURNEY CARD — hero strip matching image 3 layout
══════════════════════════════════════════════════ */
const JourneyCard = ({ trip, bus }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
    padding: '20px 26px', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 12px 48px rgba(0,0,0,0.5)', animation: 'fadeUp 0.5s 0.1s ease forwards', opacity: 0,
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'Syne,sans-serif' }}>
      ✦ Selected Journey
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
      {/* Departure */}
      <div>
        <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, letterSpacing: '0.04em' }}>Departure</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: T.text, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>{bus.departure || '08:00 AM'}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{(trip.fromCity || 'KAR').slice(0, 3).toUpperCase()}</div>
      </div>
      {/* Animated bus route */}
      <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 6 }}>
        <div style={{ fontSize: 11, color: T.muted }}>{bus.duration || '14h 0m'}</div>
        <AnimBus />
      </div>
      {/* Arrival */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, letterSpacing: '0.04em' }}>Arrival</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: T.text, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>{bus.arrival || '10:00 PM'}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{(trip.toCity || 'LAH').slice(0, 3).toUpperCase()}</div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════
   INFO SIDEBAR — right panel matching image 3 style
══════════════════════════════════════════════════ */
const InfoSidebar = ({ trip, bus }) => {
  const fields = [
    { label: 'From:', value: trip.fromCity },
    { label: 'To:', value: trip.toCity },
    { label: 'Gender:', value: trip.gender },
    { label: 'Date:', value: trip.date },
    { label: 'Bus:', value: bus.company },
    { label: 'Price:', value: `PKR ${(bus.price || 0).toLocaleString()}`, highlight: true },
  ];
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
      padding: '24px 22px', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column', gap: 22,
      position: 'sticky', top: 24, height: 'fit-content',
      animation: 'fadeUp 0.5s 0.2s ease forwards', opacity: 0,
    }}>
      {fields.map(({ label, value, highlight }) => (
        <div key={label}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: highlight ? T.accent : T.text, fontFamily: 'Syne,sans-serif' }}>{value || '—'}</div>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   3D BUS INTERIOR — full Three.js scene (fixed)
   Fixes: proper canvas sizing, bright lighting,
   SHIFT+scroll top view, correct seat colors
══════════════════════════════════════════════════ */
const BusInterior3D = ({ seats, seatGenders, selectedSeats, onSeatToggle, onShiftHeld }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ seats, seatGenders, selectedSeats, onSeatToggle, onShiftHeld });

  useEffect(() => {
    stateRef.current = { seats, seatGenders, selectedSeats, onSeatToggle, onShiftHeld };
  });

  useEffect(() => {
    if (!seats.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;

    /* ── Canvas sizing ─ use parent rect, NOT canvas.clientWidth ── */
    const getWH = () => {
      const r = parent.getBoundingClientRect();
      return { w: Math.floor(r.width) || 900, h: Math.floor(r.height) || 500 };
    };
    const { w: initW, h: initH } = getWH();

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(initW, initH, false);
    renderer.setClearColor(0xffffff, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    /* ── Scene & Camera ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, 0.015);
    const camera = new THREE.PerspectiveCamera(72, initW / initH, 0.1, 120);
    camera.position.set(0, 1.9, 3.5);
    camera.lookAt(0, 0.9, -8);

    /* ══ LIGHTING — much brighter than original ══ */
    // 1. Strong white ambient
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));

    // 2. Overhead directional (casts shadows)
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(1, 9, 3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 0.1;
    dir.shadow.camera.far = 40;
    scene.add(dir);

    // 3. Back blue fill
    const fill = new THREE.DirectionalLight(0x4060cc, 0.9);
    fill.position.set(0, 4, -20);
    scene.add(fill);

    /* ══ BUS SHELL ══ */
    const ROWS = Math.ceil(seats.length / 4);
    const ROW_D = 1.85;
    const BUS_LEN = ROWS * ROW_D + 3.5;
    const BW = 5.2, BH = 2.6;
    const MID_Z = -(BUS_LEN / 2 - 1.5);

    const mkMat = (col, r = 0.86, m = 0.08) =>
      new THREE.MeshStandardMaterial({ color: col, roughness: r, metalness: m });

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(BW, BUS_LEN), mkMat(0xeaeaea, 0.95));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, MID_Z);
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(BW, BUS_LEN), mkMat(0xffffff, 0.9));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, BH, MID_Z);
    scene.add(ceil);

    // Side walls
    [[-BW / 2, Math.PI / 2], [BW / 2, -Math.PI / 2]].forEach(([x, ry]) => {
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(BUS_LEN, BH), mkMat(0xf5f5f5, 0.88));
      wm.rotation.y = ry;
      wm.position.set(x, BH / 2, MID_Z);
      scene.add(wm);
    });

    // Back wall
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), mkMat(0xdddddd));
    bw.position.set(0, BH / 2, -(BUS_LEN - 0.5));
    scene.add(bw);

    // Aisle carpet
    const aisleM = new THREE.Mesh(new THREE.PlaneGeometry(0.9, BUS_LEN), mkMat(0xdcdcdc, 0.98));
    aisleM.rotation.x = -Math.PI / 2;
    aisleM.position.set(0, 0.002, MID_Z);
    scene.add(aisleM);

    // Ceiling LED strips (warm) + point lights per section
    for (let i = 0; i <= ROWS; i++) {
      const z = -i * ROW_D - 0.5;
      // LED strip geometry
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.055, 1.3),
        new THREE.MeshStandardMaterial({ color: 0xf5e890, emissive: 0xf5e890, emissiveIntensity: 2.5 })
      );
      strip.position.set(0, BH - 0.04, z);
      scene.add(strip);

      // Warm point light every 2 rows
      if (i % 2 === 0) {
        const pl = new THREE.PointLight(0xffeea0, 1.8, 7, 1.5);
        pl.position.set(0, BH - 0.2, z);
        scene.add(pl);
      }
    }

    // Side accent lights (blue)
    [-BW / 2 + 0.3, BW / 2 - 0.3].forEach((x, si) => {
      for (let i = 0; i < 3; i++) {
        const sl = new THREE.PointLight(0x2050b0, 1.4, 9, 1.5);
        sl.position.set(x, 1.4, -(i * (ROWS * ROW_D / 3)) - ROW_D);
        scene.add(sl);
      }
    });

    // Window panes
    for (let i = 0; i < ROWS; i++) {
      const z = -i * ROW_D - 1.1;
      [-BW / 2 + 0.04, BW / 2 - 0.04].forEach((x, si) => {
        const wn = new THREE.Mesh(
          new THREE.PlaneGeometry(1.1, 0.8),
          new THREE.MeshStandardMaterial({
            color: 0x88aadd, emissive: 0xddffff, emissiveIntensity: 0.3,
            transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.6,
          })
        );
        wn.rotation.y = si === 0 ? Math.PI / 2 : -Math.PI / 2;
        wn.position.set(x, 1.5, z);
        scene.add(wn);

        // Window frame
        const fr = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.96, 1.22),
          mkMat(0xd0d0d0, 0.8)
        );
        fr.position.set(x + (si === 0 ? 0.045 : -0.045), 1.5, z);
        scene.add(fr);
      });
    }

    // Aisle row labels (canvas texture)
    const makeRowLabel = (num) => {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 64;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 128, 64);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num).padStart(2, '0'), 64, 32);
      return new THREE.CanvasTexture(c);
    };

    for (let row = 1; row <= ROWS; row++) {
      const lbl = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.3),
        new THREE.MeshBasicMaterial({ map: makeRowLabel(row), transparent: true, depthWrite: false })
      );
      lbl.rotation.x = -Math.PI / 2;
      lbl.position.set(0, 0.015, -(row - 1) * ROW_D - 0.9);
      scene.add(lbl);
    }

    // FRONT label
    const makeFrontLabel = () => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 256, 64);
      ctx.fillStyle = 'rgba(245,200,66,0.6)';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FRONT', 128, 32);
      return new THREE.CanvasTexture(c);
    };
    const frontLbl = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.35),
      new THREE.MeshBasicMaterial({ map: makeFrontLabel(), transparent: true, depthWrite: false })
    );
    frontLbl.rotation.x = -Math.PI / 2;
    frontLbl.position.set(0, 0.015, 0.8);
    scene.add(frontLbl);

    /* ══ SEATS ══ */
    const seatMeshes = [];
    const SW = 0.78, SD = 0.72, SH = 0.50, BACK_H = 0.95;
    const COL_X = {
      left: [-1.62, -0.84],
      right: [0.84, 1.62],
    };

    const getSeatColor3D = (seat, sel, gens) => {
      if (seat.status.includes('booked'))
        return (seat.gender === 'female' || seat.status === 'booked_female') ? T.seatBookedFC.clone() : T.seatBookedMC.clone();
      if (sel.includes(seat.id))
        return gens[seat.id] === 'female' ? T.seatFemaleC.clone() : T.seatMaleC.clone();
      return T.seatAvailC.clone();
    };

    const makeSeatNumberLabel = (num) => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 64, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num, 32, 16);
      return new THREE.CanvasTexture(c);
    };

    seats.forEach((seat) => {
      const xs = COL_X[seat.side];
      const x = xs[seat.col];
      const z = -(seat.row - 1) * ROW_D - 0.9;
      const grp = new THREE.Group();

      const initCol = getSeatColor3D(seat, [], {});
      const mat = new THREE.MeshStandardMaterial({
        color: initCol,
        roughness: 0.70,
        metalness: 0.08,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
      });

      // Seat cushion
      const cushGeo = new THREE.BoxGeometry(SW, SH, SD);
      cushGeo.translate(0, SH / 2, 0);
      const cush = new THREE.Mesh(cushGeo, mat);
      cush.castShadow = true;
      cush.receiveShadow = true;
      grp.add(cush);

      // Backrest
      const backGeo = new THREE.BoxGeometry(SW, BACK_H, 0.1);
      backGeo.translate(0, BACK_H / 2, -SD / 2 + 0.055);
      const backMesh = new THREE.Mesh(backGeo, mat.clone());
      backMesh.castShadow = true;
      grp.add(backMesh);

      // Headrest
      const hrGeo = new THREE.BoxGeometry(SW * 0.65, 0.27, 0.14);
      hrGeo.translate(0, BACK_H + 0.135, -SD / 2 + 0.07);
      const hrMesh = new THREE.Mesh(hrGeo, mat.clone());
      grp.add(hrMesh);

      // Seat Number
      const seatNumMat = new THREE.MeshBasicMaterial({ map: makeSeatNumberLabel(seat.seatNumber), transparent: true });
      const seatNumMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), seatNumMat);
      seatNumMesh.position.set(0, BACK_H - 0.1, -SD / 2 + 0.11);
      grp.add(seatNumMesh);

      // Armrests
      [-SW / 2 - 0.07, SW / 2 + 0.07].forEach((ax) => {
        const arGeo = new THREE.BoxGeometry(0.07, 0.055, SD * 0.65);
        arGeo.translate(ax, SH + 0.04, 0);
        grp.add(new THREE.Mesh(arGeo, new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 })));
      });

      // Legs
      [-SW / 2 + 0.12, SW / 2 - 0.12].forEach((lx) => {
        const legGeo = new THREE.CylinderGeometry(0.035, 0.035, SH * 0.5, 6);
        const leg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.6, roughness: 0.4 }));
        leg.position.set(lx, SH * 0.25, 0);
        grp.add(leg);
      });

      grp.position.set(x, 0, z);
      grp.userData = { seatId: seat.id, seatStatus: seat.status, mat, backMesh, hrMesh };
      scene.add(grp);
      seatMeshes.push(grp);
    });

    /* ══ RAYCASTER + INTERACTIONS ══ */
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    let hoveredGrp = null;
    let targetCamZ = 3.5;
    let currentCamZ = 3.5;
    let isShiftHeld = false;
    let topProgress = 0;

    const findGroup = (obj) => {
      let o = obj;
      while (o && !o.userData.seatId) o = o.parent;
      return o;
    };

    const onMouseMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouseVec.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseVec.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      const found = hits.length ? findGroup(hits[0].object) : null;

      if (hoveredGrp && hoveredGrp !== found) {
        const s = seats.find(s => s.id === hoveredGrp.userData.seatId);
        if (s && !s.status.includes('booked')) {
          const { selectedSeats: sel, seatGenders: gens } = stateRef.current;
          hoveredGrp.userData.mat.color.copy(getSeatColor3D(s, sel, gens || {}));
          hoveredGrp.userData.mat.emissiveIntensity = 0;
          hoveredGrp.scale.setScalar(1);
          canvas.style.cursor = 'default';
        }
      }
      hoveredGrp = found;
      if (found) {
        const s = seats.find(s => s.id === found.userData.seatId);
        if (s && !s.status.includes('booked')) {
          found.userData.mat.color.copy(T.seatHoverC);
          found.userData.mat.emissive.set(0xb08820);
          found.userData.mat.emissiveIntensity = 0.45;
          found.scale.setScalar(1.07);
          canvas.style.cursor = 'pointer';
        }
      }
    };

    const onClick = (e) => {
      const r = canvas.getBoundingClientRect();
      mouseVec.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseVec.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      if (!hits.length) return;
      const grp = findGroup(hits[0].object);
      if (!grp || grp.userData.seatStatus.includes('booked')) return;
      stateRef.current.onSeatToggle(grp.userData.seatId);
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (isShiftHeld) return;
      const maxZ = 3.5, minZ = -(ROWS * ROW_D) + 2;
      targetCamZ = Math.max(minZ, Math.min(maxZ, targetCamZ - e.deltaY * 0.011));
    };

    const onKeyDown = (e) => {
      if (e.key === 'Shift') {
        isShiftHeld = true;
        stateRef.current.onShiftHeld?.(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'Shift') {
        isShiftHeld = false;
        stateRef.current.onShiftHeld?.(false);
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ResizeObserver for responsive canvas
    const resizeObs = new ResizeObserver(() => {
      const { w: nw, h: nh } = getWH();
      if (nw < 10 || nh < 10) return;
      renderer.setSize(nw, nh, false);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    resizeObs.observe(parent);

    /* ══ ANIMATE LOOP ══ */
    let rafId, t = 0;
    const eio = (x) => x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
    const posAisle = new THREE.Vector3();
    const posTop = new THREE.Vector3();
    const tgtAisle = new THREE.Vector3();
    const tgtTop = new THREE.Vector3();
    const lerpTgt = new THREE.Vector3();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      // Camera lerp (aisle walk)
      currentCamZ += (targetCamZ - currentCamZ) * 0.06;

      // SHIFT top-view blend
      topProgress += ((isShiftHeld ? 1 : 0) - topProgress) * 0.055;
      const e = eio(Math.max(0, Math.min(1, topProgress)));

      posAisle.set(0, 1.9, currentCamZ);
      posTop.set(0, 8, currentCamZ + 6); // 45 degree upward angle
      tgtAisle.set(0, 0.9, currentCamZ - 8);
      tgtTop.set(0, 0, currentCamZ - 4);

      camera.position.lerpVectors(posAisle, posTop, e);
      lerpTgt.lerpVectors(tgtAisle, tgtTop, e);
      camera.lookAt(lerpTgt);

      // Sync seat colors from React state (via ref)
      const { selectedSeats: sel, seatGenders: gens } = stateRef.current;
      seatMeshes.forEach((grp) => {
        if (grp === hoveredGrp) return;
        const s = seats.find(s => s.id === grp.userData.seatId);
        if (!s || s.status.includes('booked')) return;

        const tc = getSeatColor3D(s, sel, gens || {});
        const isSel = sel.includes(s.id);
        const emCol = isSel
          ? (gens[s.id] === 'female' ? new THREE.Color('#801050') : new THREE.Color('#1438a0'))
          : new THREE.Color(0x000000);

        grp.userData.mat.color.lerp(tc, 0.15);
        grp.userData.mat.emissive.lerp(emCol, 0.15);
        grp.userData.mat.emissiveIntensity = isSel ? 0.38 : 0;

        if (grp.userData.backMesh)
          grp.userData.backMesh.material.color.copy(grp.userData.mat.color);
        if (grp.userData.hrMesh)
          grp.userData.hrMesh.material.color.copy(grp.userData.mat.color);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      resizeObs.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m?.dispose());
      });
      renderer.dispose();
    };
  }, [seats]); // Rebuild only when seats load

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
};

/* ══════════════════════════════════════════════════
   2D SEAT GRID — fallback matching image 2 style
   Perspective-tilted bus view with row labels, 
   colored seats, checkmarks on selected
══════════════════════════════════════════════════ */
const SeatGrid2D = ({ seats, gender, selectedSeats, onSeatToggle }) => {
  const rows = [...new Set(seats.map((s) => s.row))].sort((a, b) => a - b);
  const selColor = gender === 'Female' ? T.seatFemaleHex : T.seatMaleHex;
  const selBg = gender === 'Female' ? 'rgba(236,72,153,0.22)' : 'rgba(59,130,246,0.22)';

  const SeatBtn = ({ seat }) => {
    if (!seat) return <div />;
    const isSel = selectedSeats.includes(seat.id);
    const isBooked = seat.status === 'booked';
    const bg = isBooked
      ? (seat.gender === 'female' ? T.seatBookedFHex : T.seatBookedMHex)
      : isSel ? selBg : 'rgba(26,37,64,0.85)';
    const bdr = isBooked ? 'transparent'
      : isSel ? selColor : 'rgba(255,255,255,0.1)';
    const txt = isBooked ? 'rgba(255,255,255,0.28)'
      : isSel ? selColor : T.muted;

    return (
      <button
        onClick={() => !isBooked && onSeatToggle(seat.id)}
        style={{
          position: 'relative', background: bg, border: `1.5px solid ${bdr}`,
          borderRadius: 8, padding: '8px 3px', fontSize: 10, fontWeight: 700,
          color: txt, fontFamily: 'Syne,sans-serif',
          cursor: isBooked ? 'not-allowed' : 'pointer',
          transition: 'all 0.18s cubic-bezier(0.23,1,0.32,1)',
          transform: isSel ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isSel ? `0 0 12px ${selColor}55` : 'none',
          textAlign: 'center', minWidth: 38,
        }}
        onMouseEnter={(e) => { if (!isBooked && !isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={(e) => { if (!isBooked && !isSel) e.currentTarget.style.background = bg; }}
      >
        {isSel && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l3 3 6-6" stroke={selColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {!isSel && seat.seatNumber}
      </button>
    );
  };

  return (
    <div style={{
      height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start', padding: '20px 10px',
      background: 'rgba(6,9,26,0.95)',
    }}>
      {/* Perspective bus container */}
      <div style={{ perspective: '900px', perspectiveOrigin: '50% 20%', width: '100%', maxWidth: 460 }}>
        <div style={{
          transform: 'rotateX(12deg)', transformOrigin: 'top center',
          background: 'rgba(15,22,50,0.9)', borderRadius: 20,
          border: `1px solid ${T.border}`, padding: '20px 18px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
        }}>
          {/* FRONT badge */}
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: T.accent,
              fontFamily: 'Syne,sans-serif', textTransform: 'uppercase',
              background: 'rgba(245,200,66,0.1)', border: `1px solid rgba(245,200,66,0.2)`,
              borderRadius: 6, padding: '3px 12px',
            }}>FRONT</span>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 40px 1fr 1fr', gap: 5, marginBottom: 10 }}>
            {['', 'A', 'B', '', 'C', 'D'].map((h, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.muted }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row) => {
            const rs = seats.filter((s) => s.row === row);
            const la = rs.find((s) => s.side === 'left' && s.col === 0);
            const lb = rs.find((s) => s.side === 'left' && s.col === 1);
            const rc = rs.find((s) => s.side === 'right' && s.col === 0);
            const rd = rs.find((s) => s.side === 'right' && s.col === 1);

            return (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 40px 1fr 1fr', gap: 5, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: T.muted, fontFamily: 'Syne,sans-serif' }}>
                  {String(row).padStart(2, '0')}
                </div>
                <SeatBtn seat={la} />
                <SeatBtn seat={lb} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 1, height: 28, background: T.border }} />
                </div>
                <SeatBtn seat={rc} />
                <SeatBtn seat={rd} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   LEGEND BAR — bottom row with legend + total + CTA
══════════════════════════════════════════════════ */
const LegendBar = ({ seats, selectedSeats, price, gender, onContinue }) => {
  const count = selectedSeats.length;
  const total = count * price;
  const selCol = gender === 'Female' ? T.seatFemaleHex : T.seatMaleHex;

  const getSeatLabel = (id) => seats.find((s) => s.id === id)?.seatNumber || id;

  const legends = [
    { color: T.seatAvailHex, label: 'Available' },
    { color: selCol, label: 'Selected' },
    { color: T.seatBookedMHex, label: 'Booked (M)' },
    { color: T.seatBookedFHex, label: 'Booked (F)' },
  ];

  return (
    <div style={{
      background: 'rgba(8,12,31,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${T.border}`, borderRadius: 18,
      padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      animation: 'fadeUp 0.5s 0.35s ease forwards', opacity: 0,
    }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {legends.map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 13, height: 13, borderRadius: 3, background: color, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Selected seat tags */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        {count === 0 ? (
          <span style={{ fontSize: 12, color: T.muted }}>No seats selected</span>
        ) : (
          selectedSeats.map((id) => (
            <span key={id} style={{
              background: gender === 'Female' ? 'rgba(236,72,153,0.18)' : 'rgba(59,130,246,0.18)',
              border: `1px solid ${selCol}55`,
              color: selCol, padding: '3px 10px', borderRadius: 8,
              fontSize: 11, fontWeight: 700, fontFamily: 'Syne,sans-serif',
            }}>
              {getSeatLabel(id)}
            </span>
          ))
        )}
      </div>

      {/* Total */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.accent, fontFamily: 'Syne,sans-serif', lineHeight: 1.1 }}>
          PKR {total.toLocaleString()}
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={onContinue}
        disabled={count === 0}
        style={{
          background: count > 0 ? T.accent : 'rgba(255,255,255,0.07)',
          color: count > 0 ? '#080c1f' : T.muted,
          border: 'none', borderRadius: 12, padding: '12px 26px',
          fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14,
          cursor: count > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s cubic-bezier(0.23,1,0.32,1)',
          transform: count > 0 ? 'scale(1)' : 'scale(0.97)',
          flexShrink: 0,
          boxShadow: count > 0 ? `0 0 20px rgba(245,200,66,0.3)` : 'none',
        }}
        onMouseEnter={(e) => { if (count > 0) { e.currentTarget.style.background = '#ffd54f'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
        onMouseLeave={(e) => { if (count > 0) { e.currentTarget.style.background = T.accent; e.currentTarget.style.transform = 'scale(1)'; } }}
      >
        Continue →
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   OVERLAYS — scroll hint + shift view hint
══════════════════════════════════════════════════ */
const HintOverlay = ({ showScroll, showShift }) => (
  <>
    {/* Top center scroll hint */}
    {showScroll && (
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        padding: '6px 14px', animation: 'pulseHint 2s ease-in-out infinite',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <circle cx="7" cy="5" r="1.8" fill="rgba(245,200,66,0.7)" />
        </svg>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Syne,sans-serif' }}>
          Scroll to move inside cabin
        </span>
      </div>
    )}

    {/* Bottom center SHIFT hint */}
    <div style={{
      position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
      pointerEvents: 'none', opacity: showScroll ? 1 : 0,
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
        textTransform: 'uppercase', fontFamily: 'Syne,sans-serif', textAlign: 'center',
        background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '4px 12px',
      }}>
        Hold <span style={{ color: T.accent }}>SHIFT</span> + Scroll → Top view
      </div>
    </div>

    {/* SHIFT active indicator */}
    {showShift && (
      <div style={{
        position: 'absolute', top: 14, right: 60,
        background: 'rgba(245,200,66,0.15)', border: `1px solid rgba(245,200,66,0.4)`,
        borderRadius: 8, padding: '4px 12px',
        fontSize: 10, fontWeight: 700, color: T.accent, fontFamily: 'Syne,sans-serif',
        pointerEvents: 'none', animation: 'fadeUp 0.2s ease forwards',
      }}>
        TOP VIEW
      </div>
    )}
  </>
);

/* ══════════════════════════════════════════════════
   GENDER MODAL
   Allows choosing M/F for a specific seat selection
══════════════════════════════════════════════════ */
const GenderModal = ({ isOpen, onSelect, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: '#131a42', border: `1px solid ${T.borderBright}`, borderRadius: 24,
        padding: '32px 40px', textAlign: 'center', width: '100%', maxWidth: 400,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeUp 0.3s ease'
      }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', color: '#fff', fontSize: 24, marginBottom: 8 }}>Select Gender</h2>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>Choose passenger gender for this seat</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button
            onClick={() => onSelect('male')}
            style={{
              background: 'rgba(59,130,246,0.1)', border: `1px solid ${T.seatMaleHex}`,
              color: T.seatMaleHex, borderRadius: 16, padding: '16px', cursor: 'pointer',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: 24 }}>♂</span>
            <span style={{ fontWeight: 700 }}>Male</span>
          </button>
          <button
            onClick={() => onSelect('female')}
            style={{
              background: 'rgba(236,72,153,0.1)', border: `1px solid ${T.seatFemaleHex}`,
              color: T.seatFemaleHex, borderRadius: 16, padding: '16px', cursor: 'pointer',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: 24 }}>♀</span>
            <span style={{ fontWeight: 700 }}>Female</span>
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 24, background: 'none', border: 'none', color: T.muted,
            fontSize: 13, cursor: 'pointer', textDecoration: 'underline'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   CURSOR GLOW
══════════════════════════════════════════════════ */
const CursorGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px';
        ref.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div ref={ref} style={{
      position: 'fixed', pointerEvents: 'none', zIndex: 9999,
      width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(90,120,255,0.055) 0%, transparent 70%)',
      transform: 'translate(-50%,-50%)',
    }} />
  );
};

/* ══════════════════════════════════════════════════
   MAIN — SeatSelection page
══════════════════════════════════════════════════ */
const SeatSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trip = {}, bus = {} } = location.state || {};

  /* ── Normalize data from previous pages ── */
  const tripData = {
    fromCity: trip.fromCity || 'Karachi',
    toCity: trip.toCity || 'Lahore',
    gender: trip.gender || 'Female',
    date: trip.date || 'Apr 21, 2026',
  };
  const busData = {
    id: bus.id || 1,
    company: bus.company || 'All Ride',
    type: bus.type || 'Business Plus',
    from: bus.from || tripData.fromCity,
    to: bus.to || tripData.toCity,
    departure: bus.departure || '08:00 AM',
    arrival: bus.arrival || '10:00 PM',
    duration: bus.duration || '14h 0m',
    price: bus.price || 4500,
    seatsLeft: bus.seatsLeft || 20,
  };

  /* ── State ── */
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatGenders, setSeatGenders] = useState({}); // { seatId: 'male'|'female' }
  const [pendingSeat, setPendingSeat] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const [viewMode, setViewMode] = useState('3d');   // '3d' | '2d'
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [errorPop, setErrorPop] = useState(null); // Gender conflict message

  /* ── AUDIO LOGIC ── */
  const playSelectSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.25;
    audio.play().catch(() => {});
  }, []);

  /* ── Seat loader (API + fallback + 10s timeout) ── */
  useEffect(() => {
    let done = false;

    // 10-second timeout → force 2D fallback
    const fallbackTimer = setTimeout(() => {
      if (!done) {
        done = true;
        setSeats(genSeats(busData.id));
        setViewMode('2d');
        setIsLoading(false);
      }
    }, 10000);

    const loadSeats = async () => {
      try {
        const res = await fetch(`/api/route/seats.php?route_id=${busData.id}`);
        const json = await res.json();
        if (!done && json.status === 'success' && json.data?.length) {
          done = true;
          clearTimeout(fallbackTimer);
          setSeats(json.data.map((s, idx) => ({
            id: s.seat_id,
            seatNumber: s.seat_number,
            status: s.current_status === 'available' ? 'available' : 'booked',
            gender: s.current_status === 'booked_male' ? 'male'
              : s.current_status === 'booked_female' ? 'female' : null,
            row: Math.ceil((idx + 1) / 4),
            side: (idx % 4) < 2 ? 'left' : 'right',
            col: idx % 2,
          })));
          setIsLoading(false);
        } else {
          throw new Error('empty');
        }
      } catch {
        if (!done) {
          done = true;
          clearTimeout(fallbackTimer);
          // Use simulated seats — same as seat.php fallback
          setSeats(genSeats(busData.id));
          setIsLoading(false);
        }
      }
    };
    loadSeats();

    return () => { done = true; clearTimeout(fallbackTimer); };
  }, [busData.id]);

  /* ── Timer Logic ── */
  useEffect(() => {
    if (!timerActive || selectedSeats.length === 0) {
       setTimerActive(false);
       setTimeLeft(600);
       return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorPop("Your temporary lock has expired. Please select seats again.");
          setSelectedSeats([]);
          setSeatGenders({});
          setTimerActive(false);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, selectedSeats.length]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  /* ── Hint auto-hide ── */
  useEffect(() => {
    if (!hintVisible) return;
    const t = setTimeout(() => setHintVisible(false), 5500);
    return () => clearTimeout(t);
  }, [hintVisible]);

  /* ── Seat toggle ── */
  const handleSeatToggle = useCallback((seatId) => {
    setSelectedSeats((prev) => {
      const isAlreadySelected = prev.includes(seatId);
      if (isAlreadySelected) {
        // Deselecting -> Unlock API Call
        const token = localStorage.getItem('access_token');
        fetch('/api/booking/unlock_seat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? {'Authorization': `Bearer ${token}`} : {}) },
          body: JSON.stringify({ route_id: busData.id, seat_id: seatId })
        }).catch(err => console.error("Unlock Error:", err));

        const newGenders = { ...seatGenders };
        delete newGenders[seatId];
        setSeatGenders(newGenders);
        return prev.filter(id => id !== seatId);
      } else {
        // Checking for neighbor gender conflict (same as book.php logic)
        const seat = seats.find(s => s.id === seatId);
        const row = seat.row;
        const side = seat.side;
        // Find neighbor
        const neighbor = seats.find(s => s.id !== seatId && s.row === row && s.side === side);
        
        if (neighbor && neighbor.status === 'booked') {
          // If neighbor is booked, we must show pop-up or allow selection but check neighbor gender
          setPendingSeat(seatId);
          return prev;
        }

        setPendingSeat(seatId);
        return prev;
      }
    });
  }, [seats, seatGenders]);

  const handleGenderSelect = (gender) => {
    const seatId = pendingSeat;
    const seat = seats.find(s => s.id === seatId);
    const row = seat.row;
    const side = seat.side;
    const neighbor = seats.find(s => s.id !== seatId && s.row === row && s.side === side);

    // Rule: Cannot select Female seat if neighbor is Male (and vice versa) for booked seats
    if (neighbor && neighbor.status.includes('booked')) {
       // if we have 'booked_male' or 'booked_female', infer gender
       const neighborGender = neighbor.status === 'booked_female' ? 'female' : (neighbor.gender || 'male');
       if (neighborGender !== gender) {
          setErrorPop(`Restricted Selection: Adjacent seat is booked by a ${neighborGender}. You must select ${neighborGender} for this seat.`);
          setPendingSeat(null);
          return;
       }
    }

    // Attempt Lock
    const lockCall = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/booking/lock_seat.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? {'Authorization': `Bearer ${token}`} : {}) },
                body: JSON.stringify({ route_id: busData.id, seat_id: seatId, gender: gender === 'male' ? 'Male' : 'Female' })
            });
            const json = await res.json();
            if (json.status !== 'success') {
                setErrorPop(json.message || 'Seat is recently locked by another user. Try another.');
                setPendingSeat(null);
                return;
            }
            setSeatGenders(prev => ({ ...prev, [seatId]: gender }));
            setSelectedSeats(prev => [...prev, seatId]);
            setPendingSeat(null);
            setTimerActive(true);
            playSelectSound();
        } catch (e) {
            setErrorPop('Network Error restricting seat lock.');
            setPendingSeat(null);
        }
    };
    lockCall();
  };

  /* ── Continue → payment ── */
  const handleContinue = () => {
    navigate('/payment', {
      state: { 
        trip: tripData, 
        bus: busData, 
        selectedSeats, 
        seatGenders,
        totalPrice: selectedSeats.length * busData.price 
      },
    });
  };

  const availCount = seats.filter((s) => s.status === 'available').length;

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orb1 { 0%,100%{transform:scale(1);opacity:.22} 50%{transform:scale(1.18);opacity:.42} }
        @keyframes orb2 { 0%,100%{transform:scale(1.15);opacity:.15} 50%{transform:scale(1);opacity:.3} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulseHint { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes loadPulse { 0%,100%{opacity:.4;transform:scaleX(0.6)} 50%{opacity:1;transform:scaleX(1)} }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <CursorGlow />

      <div style={{ minHeight: '100vh', background: T.grad, fontFamily: 'DM Sans, sans-serif', color: T.text, position: 'relative', overflow: 'hidden' }}>

        {/* ── Background orbs ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-8%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 70%)', animation: 'orb1 10s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-8%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 70%)', animation: 'orb2 13s ease-in-out infinite' }} />
        </div>

        {/* ── Hero Section ── */}
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40, animation: 'fadeUp 0.8s ease forwards' }}>
            <div style={{
              display: 'inline-block', padding: '6px 14px', borderRadius: '30px',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
              color: T.accent, fontSize: 13, fontWeight: 700, marginBottom: 16,
              fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em'
            }}>
              ✦ Welcome, {location.state?.userName || 'Traveler'}
            </div>
            <h1 style={{
              fontFamily: 'Syne,sans-serif', fontSize: 'clamp(30px, 5vw, 60px)', fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, #8896b0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 10
            }}>
              Your Journey Awaits
            </h1>
            <p style={{ color: T.muted, fontSize: 18, fontFamily: 'DM Sans, sans-serif' }}>
              Confirm your route & scroll down to select your comfortable seat.
            </p>
          </div>

          <div style={{ maxWidth: 900, width: '100%', padding: '0 20px', animation: 'fadeUp 0.8s 0.2s ease forwards', opacity: 0 }}>
             <div style={{
               background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 24,
               padding: '30px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
               boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
             }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, flexWrap: 'wrap', gap: 20 }}>
                   <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 4 }}>Company</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: T.text, fontFamily: 'Syne, sans-serif' }}>{busData.company}</div>
                      <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{busData.type}</div>
                   </div>
                   <div style={{ flex: 2, minWidth: 300 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                         <div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{busData.departure}</div>
                            <div style={{ fontSize: 11, color: T.muted }}>{tripData.fromCity.slice(0,3).toUpperCase()}</div>
                         </div>
                         <div style={{ fontSize: 11, color: T.muted }}>{busData.duration}</div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{busData.arrival}</div>
                            <div style={{ fontSize: 11, color: T.muted }}>{tripData.toCity.slice(0,3).toUpperCase()}</div>
                         </div>
                      </div>
                      <div style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'center' }}>
                         <div style={{ position: 'absolute', width: '100%', height: 2, borderTop: '2px dashed rgba(255,255,255,0.1)' }} />
                         <div style={{ position: 'absolute', right: 0, width: 8, height: 8, borderTop: '2px solid rgba(255,255,255,0.2)', borderRight: '2px solid rgba(255,255,255,0.2)', transform: 'rotate(45deg)' }} />
                         <div style={{ position: 'absolute', left: '20%', animation: 'moveBus 10s linear infinite' }}>
                            <svg viewBox="0 0 36 18" width="36" height="18" fill="none">
                               <rect x="1" y="2" width="32" height="13" rx="3" fill={T.accent} opacity="0.9"/>
                               <rect x="4" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
                               <rect x="11" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
                               <rect x="18" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
                               <rect x="25" y="4.5" width="5" height="5" rx="1" fill="#0a0e27" opacity="0.7"/>
                               <circle cx="8" cy="15.5" r="2.5" fill="#1a1f3a" stroke={T.accent} strokeWidth="1"/>
                               <circle cx="26" cy="15.5" r="2.5" fill="#1a1f3a" stroke={T.accent} strokeWidth="1"/>
                            </svg>
                         </div>
                      </div>
                   </div>
                   <div style={{ flex: 1, textAlign: 'right', minWidth: 150 }}>
                      <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 4 }}>Fare</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: T.accent, fontFamily: 'Syne, sans-serif' }}>PKR {busData.price.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>Per Person</div>
                   </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                   {[
                      { label: 'Date', val: tripData.date },
                      { label: 'Gender', val: tripData.gender },
                      { label: 'Seats Left', val: busData.seatsLeft },
                      { label: 'Status', val: 'Confirmed' }
                   ].map(d => (
                      <div key={d.label}>
                         <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', marginBottom: 2 }}>{d.label}</div>
                         <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.val}</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <style>{`
             @keyframes moveBus {
                0% { left: 0%; }
                100% { left: 90%; }
             }
          `}</style>

          {/* Downward bouncing arrow */}
          <div style={{
            position: 'absolute', bottom: 40, animation: 'fadeUp 0.8s 0.6s ease forwards, pulseHint 2s infinite',
            cursor: 'pointer', opacity: 0
          }} onClick={() => document.getElementById('seat-section').scrollIntoView({ behavior: 'smooth' })}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div id="seat-section" style={{
          position: 'relative', zIndex: 1,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 260px',
          maxWidth: 1300, margin: '0 auto',
          padding: isMobile ? '18px 14px' : '24px 22px',
          gap: 18, minHeight: '100vh',
          alignContent: 'start',
        }}>

          {/* ════ LEFT COLUMN — main content ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Back nav + step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp 0.4s ease forwards', opacity: 0 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans,sans-serif',
                  padding: '4px 0', transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to results
              </button>
              <div style={{ flex: 1 }} />
              {timerActive && selectedSeats.length > 0 && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444',
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                  animation: 'pulseHint 1.5s infinite'
                }}>
                  ⏱ {formatTimer(timeLeft)}
                </div>
              )}
              <div style={{ fontSize: 12, color: T.muted }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>Step 2</span> of 3 — Select Seats
              </div>
            </div>

            {/* Journey hero card moved to Hero Section */}

            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, animation: 'fadeUp 0.5s 0.25s ease forwards', opacity: 0 }}>
              <h1 style={{
                fontFamily: 'Syne,sans-serif', fontSize: 'clamp(20px,2.8vw,30px)', fontWeight: 800,
                background: 'linear-gradient(135deg, #fff 0%, #8896b0 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Choose Your Seats
              </h1>
              {!isLoading && (
                <span style={{ fontSize: 13, color: T.muted }}>{availCount} available</span>
              )}
              {/* View toggle */}
              {!isLoading && !isMobile && (
                <button
                  onClick={() => setViewMode((v) => (v === '3d' ? '2d' : '3d'))}
                  style={{
                    marginLeft: 'auto', background: T.surface, border: `1px solid ${T.border}`,
                    color: T.muted, borderRadius: 10, padding: '5px 14px', fontSize: 11,
                    fontFamily: 'Syne,sans-serif', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s', letterSpacing: '0.06em',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
                >
                  {viewMode === '3d' ? '2D VIEW' : '3D VIEW'}
                </button>
              )}
            </div>

            <div style={{
              position: 'relative', borderRadius: 20, overflow: 'hidden',
              border: `1px solid ${T.border}`,
              height: isMobile ? 420 : 'clamp(500px, calc(100vh - 350px), 750px)',
              background: 'rgba(6,9,26,0.95)',
              animation: 'fadeUp 0.5s 0.3s ease forwards', opacity: 0,
            }}>

              {/* Loading state */}
              {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
                  <div style={{ position: 'relative', width: 52, height: 52 }}>
                    <div style={{ position: 'absolute', inset: 0, border: `2px solid ${T.border}`, borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', inset: 0, border: `2px solid transparent`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: T.muted, fontSize: 14 }}>Loading bus interior...</span>
                    <div style={{ width: 120, height: 2, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '60%', background: T.accent, borderRadius: 2, animation: 'loadPulse 1.4s ease-in-out infinite', transformOrigin: 'left' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* 2D fallback (mobile OR explicit switch OR 10s timeout) */}
              {!isLoading && (viewMode === '2d' || isMobile) && (
                <SeatGrid2D
                  seats={seats}
                  gender={tripData.gender}
                  selectedSeats={selectedSeats}
                  onSeatToggle={handleSeatToggle}
                />
              )}

              {/* 3D interior */}
              {!isLoading && viewMode === '3d' && !isMobile && (
                <>
                  <BusInterior3D
                    seats={seats}
                    seatGenders={seatGenders}
                    selectedSeats={selectedSeats}
                    onSeatToggle={handleSeatToggle}
                    onShiftHeld={setShiftHeld}
                  />
                  <HintOverlay showScroll={hintVisible} showShift={shiftHeld} />
                  {/* 3D badge */}
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(245,200,66,0.1)', border: `1px solid rgba(245,200,66,0.28)`,
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 10, fontWeight: 700, color: T.accent, fontFamily: 'Syne,sans-serif',
                    pointerEvents: 'none', letterSpacing: '0.1em',
                  }}>
                    3D INTERIOR
                  </div>
                </>
              )}
            </div>

            {/* Legend bar */}
            <LegendBar
              seats={seats}
              selectedSeats={selectedSeats}
              price={busData.price}
              gender={tripData.gender}
              onContinue={handleContinue}
            />
          </div>

          {/* ════ RIGHT COLUMN — info sidebar ════ */}
          {!isMobile && <InfoSidebar trip={tripData} bus={busData} />}
        </div>

        {/* Mobile: info strip at bottom */}
        {isMobile && (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0 0 18px 18px',
            padding: '14px 16px', display: 'flex', gap: 16, flexWrap: 'wrap',
            maxWidth: 1300, margin: '0 auto',
          }}>
            {[
              { label: 'From', value: tripData.fromCity },
              { label: 'To', value: tripData.toCity },
              { label: 'Gender', value: tripData.gender },
              { label: 'Price', value: `PKR ${busData.price.toLocaleString()}`, highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ flex: '1 1 80px' }}>
                <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? T.accent : T.text, fontFamily: 'Syne,sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        )}
        {/* ── Error Pop-up ── */}
        {errorPop && (
          <div style={{
            position: 'fixed', top: 30, left: '50%', transform: 'translateX(-50%)',
            zIndex: 11000, background: '#ef4444', color: '#fff', padding: '16px 24px',
            borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.3s ease', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontWeight: 600 }}>{errorPop}</span>
            <button onClick={() => setErrorPop(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 10, fontWeight: 800 }}>✕</button>
          </div>
        )}

        <GenderModal 
          isOpen={!!pendingSeat} 
          onSelect={handleGenderSelect} 
          onClose={() => setPendingSeat(null)} 
        />
      </div>
    </>
  );
};

export default SeatSelection;