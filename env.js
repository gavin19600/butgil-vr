// 붓길 VR — 궁궐 마당의 과거시험장 배경
import * as THREE from 'three';

// 360도 사진 설정: yawDeg 를 바꾸면 사진을 좌우로 돌려 정면에 올 건물을 맞출 수 있음
const PANO = { file: 'pano.jpg', yawDeg: 0 };

const { Vector3, Quaternion, Euler, Matrix4 } = THREE;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const lerp = THREE.MathUtils.lerp;
const TRS = (px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new Matrix4().compose(new Vector3(px, py, pz), new Quaternion().setFromEuler(new Euler(rx, ry, rz, 'YXZ')), new Vector3(sx, sy, sz));

export function buildEnvironment(scene, renderer) {
  let seed = 20261115;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (cv, rx = 1, ry = 1) => {
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
  };
  const rep = (base, rx, ry = 1) => { const t = base.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; };
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
  const root = new THREE.Group(); scene.add(root);      // 3D 배경 전체 (사진 배경일 때 숨김)
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const inst = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; root.add(m); return m; };
  const tmp = new Matrix4();

  const fog = new THREE.Fog(0xd5e4ef, 45, 130);
  scene.fog = fog;

  /* ---------------- 하늘 · 구름 · 산 ---------------- */
  {
    const c = mk(2048, 1024), g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, '#2c6cc2'); grd.addColorStop(0.6, '#8dbfea'); grd.addColorStop(1, '#deedf6');
    g.fillStyle = grd; g.fillRect(0, 0, 2048, 512);
    g.fillStyle = '#b5ad98'; g.fillRect(0, 512, 2048, 512);
    for (let i = 0; i < 40; i++) {                        // 뭉게구름
      const cx = 160 + rnd() * 1730, cy = 120 + rnd() * 250, n = 6 + Math.floor(rnd() * 7), s = 22 + rnd() * 44;
      for (let k = 0; k < n; k++) {
        const x = cx + (rnd() - 0.5) * s * 4.5, y = cy + (rnd() - 0.5) * s * 0.8, r = s * (0.6 + rnd() * 0.9);
        const rg = g.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, 'rgba(255,255,255,.6)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
    }
    const ridge = (base, freqs, color, peaks) => {        // 겹겹의 산 능선 (좌우가 이어지도록 정수 주파수)
      g.fillStyle = color; g.beginPath(); g.moveTo(0, 516);
      for (let x = 0; x <= 2048; x += 4) {
        const u = x / 2048; let h = base;
        freqs.forEach(([f, a, p]) => { h += a * Math.sin(u * Math.PI * 2 * f + p); });
        peaks.forEach(([pu, ph, pw]) => { const d = Math.min(Math.abs(u - pu), 1 - Math.abs(u - pu)); h += ph * Math.exp(-d * d * pw); });
        g.lineTo(x, 512 - Math.max(2, h));
      }
      g.lineTo(2048, 516); g.fill();
    };
    ridge(70, [[3, 14, 0.5], [7, 9, 1.7], [13, 5, 0.3], [23, 2.5, 2]], '#a3b9cb', [[0.79, 75, 500], [0.2, 40, 300]]);
    ridge(48, [[5, 9, 2.1], [11, 6, 0.9], [19, 3, 1.2], [31, 1.5, 0.4]], '#7d9a86', [[0.68, 30, 700], [0.4, 22, 500]]);
    ridge(26, [[9, 5, 0.2], [17, 3, 1.1], [41, 1.5, 2.2]], '#5f8062', []);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(75, 48, 24), new THREE.MeshBasicMaterial({ map: tex(c), side: THREE.BackSide, fog: false }));
    root.add(sky); scene.background = null;
  }

  /* ---------------- 텍스처 ---------------- */
  const stoneTex = (() => {                               // 박석
    const c = mk(1024, 1024), g = c.getContext('2d');
    g.fillStyle = '#6f6a5c'; g.fillRect(0, 0, 1024, 1024);
    const n = 6, s = 1024 / n;
    for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) {
      const j = () => rnd() * 14 - 7, x0 = q * s, y0 = r * s;
      g.fillStyle = `hsl(${36 + rnd() * 10},${7 + rnd() * 7}%,${62 + rnd() * 13}%)`;
      g.beginPath(); g.moveTo(x0 + 7 + j(), y0 + 7 + j()); g.lineTo(x0 + s - 7 + j(), y0 + 7 + j());
      g.lineTo(x0 + s - 7 + j(), y0 + s - 7 + j()); g.lineTo(x0 + 7 + j(), y0 + s - 7 + j()); g.fill();
    }
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '40,36,28' : '255,250,235'},${rnd() * 0.07})`; g.fillRect(rnd() * 1024, rnd() * 1024, 2 + rnd() * 3, 2 + rnd() * 3); }
    return tex(c, 15, 15);
  })();
  const tileTex = (() => {                                // 기와 한 골
    const c = mk(64, 256), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, '#767b83'); gr.addColorStop(0.22, '#3d4147'); gr.addColorStop(0.5, '#24272b'); gr.addColorStop(0.78, '#3d4147'); gr.addColorStop(1, '#767b83');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 32) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, 64, 3); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, y + 3, 64, 2); }
    g.fillStyle = '#9a9fa6'; [0, 64].forEach(x => { g.beginPath(); g.arc(x, 244, 11, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#5d6168'; [0, 64].forEach(x => { g.beginPath(); g.arc(x, 244, 5, 0, Math.PI * 2); g.fill(); });
    return tex(c);
  })();
  const rafterTex = (() => {                              // 처마 밑 서까래 단청
    const c = mk(64, 128), g = c.getContext('2d');
    g.fillStyle = '#20302c'; g.fillRect(0, 0, 64, 128);
    g.fillStyle = '#2f8572'; g.fillRect(8, 0, 30, 128);
    g.fillStyle = '#f2ead6'; g.fillRect(8, 100, 30, 10); g.fillStyle = '#c23a2c'; g.fillRect(8, 110, 30, 18);
    g.fillStyle = '#e9c84a'; g.beginPath(); g.arc(23, 119, 6, 0, Math.PI * 2); g.fill();
    return tex(c);
  })();
  const bandTex = (() => {                                // 단청 띠
    const c = mk(256, 64), g = c.getContext('2d');
    g.fillStyle = '#2e7d6c'; g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#b8322a'; g.fillRect(0, 0, 256, 7); g.fillStyle = '#1f3f7a'; g.fillRect(0, 57, 256, 7);
    g.fillStyle = '#f2ead6'; g.fillRect(0, 7, 256, 2); g.fillRect(0, 55, 256, 2);
    for (let x = 32; x < 256; x += 64) {
      g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(x, 32, 18, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d24a3a'; g.beginPath(); g.arc(x, 32, 15, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f1c84b'; g.beginPath(); g.arc(x, 32, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1f3f7a'; g.beginPath(); g.arc(x, 32, 3.5, 0, Math.PI * 2); g.fill();
      [x + 29, x - 35].forEach(bx => { g.fillStyle = '#f2ead6'; g.fillRect(bx - 2, 9, 10, 46); g.fillStyle = '#1f3f7a'; g.fillRect(bx, 9, 6, 46); });
    }
    return tex(c);
  })();
  const doorTex = (() => {                                // 띠살문 한 칸(두 짝)
    const c = mk(256, 256), g = c.getContext('2d');
    g.fillStyle = '#8a2c20'; g.fillRect(0, 0, 256, 256);
    [8, 132].forEach(lx => {
      const w = 116, lat = (y0, y1, stepX, bands) => {
        g.fillStyle = '#efe6cf'; g.fillRect(lx, y0, w, y1 - y0);
        g.strokeStyle = '#356b5c'; g.lineWidth = 2;
        for (let x = lx + stepX; x < lx + w; x += stepX) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
        bands.forEach(by => { for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(lx, by + k * 5); g.lineTo(lx + w, by + k * 5); g.stroke(); } });
        g.strokeStyle = '#2b5a4d'; g.lineWidth = 4; g.strokeRect(lx + 1, y0 + 1, w - 2, y1 - y0 - 2);
      };
      lat(10, 48, 12, [20, 34]);
      lat(58, 178, 9, [66, 110, 156]);
      g.fillStyle = '#74261b'; g.fillRect(lx, 186, w, 62);
      g.strokeStyle = '#531810'; g.lineWidth = 4; g.strokeRect(lx + 8, 194, w - 16, 46);
      g.strokeStyle = 'rgba(255,220,190,.18)'; g.lineWidth = 2; g.strokeRect(lx + 12, 198, w - 24, 38);
    });
    return tex(c);
  })();
  const graniteTex = (() => {
    const c = mk(256, 256), g = c.getContext('2d');
    g.fillStyle = '#bdb7aa'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '60,55,48' : '255,252,240'},${rnd() * 0.12})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
    g.fillStyle = 'rgba(50,45,38,.45)';
    for (let y = 0; y < 256; y += 64) { g.fillRect(0, y, 256, 3); for (let x = (y / 64 % 2) * 64; x < 256; x += 128) g.fillRect(x, y, 3, 64); }
    return tex(c);
  })();
  const matTex = (() => {                                 // 돗자리 (남색 테두리)
    const c = mk(256, 256), g = c.getContext('2d');
    g.fillStyle = '#d8c48f'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 3) { g.fillStyle = `rgba(120,95,50,${0.1 + rnd() * 0.14})`; g.fillRect(0, y, 256, 1); }
    for (let x = 0; x < 256; x += 32) { g.fillStyle = 'rgba(110,85,45,.18)'; g.fillRect(x, 0, 2, 256); }
    g.strokeStyle = '#27386b'; g.lineWidth = 12; g.strokeRect(6, 6, 244, 244);
    return tex(c);
  })();
  const sheetTex = (() => {                               // 글씨가 적힌 시험지
    const c = mk(128, 180), g = c.getContext('2d');
    g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, 128, 180);
    g.strokeStyle = '#1d1a17'; g.lineCap = 'round';
    for (let col = 0; col < 5; col++) for (let row = 0; row < 9; row++) {
      if (col < 1 && row > 4) continue;
      const cx = 112 - col * 22, cy = 14 + row * 18;
      for (let k = 0; k < 3; k++) { g.lineWidth = 1.5 + rnd() * 1.5; g.beginPath(); g.moveTo(cx + rnd() * 12 - 6, cy + rnd() * 10 - 5); g.lineTo(cx + rnd() * 12 - 6, cy + rnd() * 10 - 5); g.stroke(); }
    }
    return tex(c);
  })();
  const shadowTex = (() => {
    const c = mk(64, 64), g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    rg.addColorStop(0, 'rgba(0,0,0,.42)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return tex(c);
  })();
  const shadowM = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });

  /* ---------------- 바닥 ---------------- */
  const ground = add(new THREE.PlaneGeometry(110, 110), std(0xffffff, { map: stoneTex, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;

  /* ---------------- 곡선 처마의 기와지붕 ---------------- */
  const tileM = std(0xffffff, { map: tileTex, roughness: 0.7 });
  const rafterM = std(0xffffff, { map: rafterTex, side: THREE.BackSide });
  const ridgeM = std(0xd9d5cb), ornM = std(0x3a3d42);
  function roof(W, D, R, H, lift, sag, parent, y) {
    const pos = [], uv = [], idx = [], SU = 22, SV = 8;
    const yAt = (s, v) => H * (1 - v) - sag * Math.sin(Math.PI * v) + lift * Math.pow(Math.abs(s), 3) * v * v;
    const side = (rax, raz, rbx, rbz, eax, eaz, ebx, ebz, uRep) => {
      const base = pos.length / 3;
      for (let i = 0; i <= SU; i++) {
        const u = i / SU, s = u * 2 - 1;
        for (let j = 0; j <= SV; j++) {
          const v = j / SV;
          pos.push(lerp(lerp(rax, rbx, u), lerp(eax, ebx, u), v), yAt(s, v), lerp(lerp(raz, rbz, u), lerp(eaz, ebz, u), v));
          uv.push(u * uRep, 1 - v);
        }
      }
      for (let i = 0; i < SU; i++) for (let j = 0; j < SV; j++) {
        const a = base + i * (SV + 1) + j, b = a + SV + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    };
    const hw = W / 2, hd = D / 2, nu = Math.round(W / 0.36), nd = Math.round(D / 0.36);
    side(-R, 0, R, 0, -hw, hd, hw, hd, nu);          // 앞
    side(R, 0, -R, 0, hw, -hd, -hw, -hd, nu);        // 뒤
    side(R, 0, R, 0, hw, hd, hw, -hd, nd);           // 오른쪽
    side(-R, 0, -R, 0, -hw, -hd, -hw, hd, nd);       // 왼쪽
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const grp = new THREE.Group(); grp.position.y = y; parent.add(grp);
    grp.add(new THREE.Mesh(geo, tileM)); grp.add(new THREE.Mesh(geo, rafterM));
    add(new THREE.BoxGeometry(2 * R + 0.5, 0.34, 0.42), ridgeM, 0, H + 0.08, 0, grp);            // 용마루
    [-1, 1].forEach(sx => {
      add(new THREE.BoxGeometry(0.28, 0.6, 0.44), ornM, sx * (R + 0.2), H + 0.32, 0, grp);       // 취두
      [-1, 1].forEach(sz => {                                                                     // 추녀마루
        const pts = [];
        for (let k = 0; k <= 8; k++) { const v = k / 8; pts.push(new Vector3(lerp(sx * R, sx * hw, v), yAt(1, v) + 0.06, lerp(0, sz * hd, v))); }
        grp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.11, 6), ridgeM));
      });
    });
    return grp;
  }

  /* ---------------- 전각 ---------------- */
  const pillarM = std(0x9a2f22, { roughness: 0.6 }), baseM = std(0xb9b3a6), plainM = std(0x6a231a);
  const signCv = mk(512, 256);
  const signTex = tex(signCv);
  function drawSign() {
    const g = signCv.getContext('2d');
    g.fillStyle = '#16130f'; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = '#c8a03c'; g.lineWidth = 14; g.strokeRect(10, 10, 492, 236);
    g.fillStyle = '#e8c45a'; g.font = '700 170px "Noto Serif KR", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('科場', 256, 136); signTex.needsUpdate = true;
  }
  drawSign();
  document.fonts.load('700 170px "Noto Serif KR"', '科場').then(drawSign).catch(() => {});

  function hall({ w, d, h, plat, bays, roofH, x, z, ry, upper = false, lift = 0.7 }) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; root.add(grp);
    const gm = (rx, ry2 = 1) => std(0xffffff, { map: rep(graniteTex, rx, ry2) });
    let y0 = 0;
    if (upper) { add(new THREE.BoxGeometry(w + 8, 0.5, d + 8), gm((w + 8) / 2, 0.5), 0, 0.25, 0, grp); y0 = 0.5; }
    add(new THREE.BoxGeometry(w + 3.6, plat, d + 3.6), gm((w + 3.6) / 2, Math.max(0.5, plat * 2)), 0, y0 + plat / 2, 0, grp);
    const top = y0 + plat;
    if (upper) {                                         // 가운데 돌계단
      const n = Math.ceil(top / 0.18);
      for (let i = 0; i < n; i++) add(new THREE.BoxGeometry(4.5, top - i * 0.18, 0.34), gm(2, 1), 0, (top - i * 0.18) / 2, d / 2 + 4 + 0.17 + i * 0.34, grp);
      [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.3, top + 0.25, n * 0.34 + 0.2), gm(1, 1), s * 2.4, (top + 0.25) / 2, d / 2 + 4 + n * 0.17, grp));
    }
    // 벽(띠살문) + 기둥
    const sideBays = Math.max(1, Math.round(d / (w / bays)));
    const dm = r => std(0xffffff, { map: rep(doorTex, r), roughness: 0.75 });
    add(new THREE.BoxGeometry(w, h, d), [dm(sideBays), dm(sideBays), plainM, plainM, dm(bays), dm(bays)], 0, top + h / 2, 0, grp);
    const colG = new THREE.CylinderGeometry(0.19, 0.21, h, 12), bG = new THREE.CylinderGeometry(0.27, 0.3, 0.14, 12);
    for (let i = 0; i <= bays; i++) [-1, 1].forEach(s => {
      const px = -w / 2 + i * w / bays, pz = s * (d / 2 + 0.02);
      add(colG, pillarM, px, top + h / 2, pz, grp); add(bG, baseM, px, top + 0.07, pz, grp);
    });
    // 창방 · 단청 · 공포
    const bm = (r, c = 0xffffff) => std(c, { map: rep(bandTex, r) });
    const band = (bw, bd, bh, by, c) => add(new THREE.BoxGeometry(bw, bh, bd), [bm(bd / 1.1, c), bm(bd / 1.1, c), plainM, plainM, bm(bw / 1.1, c), bm(bw / 1.1, c)], 0, by, 0, grp);
    band(w + 0.5, d + 0.5, 0.5, top + h + 0.25);
    band(w + 1.3, d + 1.3, 0.36, top + h + 0.68, 0xd8d8d8);
    const ry0 = top + h + 0.86;
    if (!upper) { roof(w + 3.4, d + 3.4, Math.max(1, w / 2 - d * 0.3), roofH, lift, roofH * 0.13, grp, ry0); return; }
    // 2층 지붕
    const uw = w * 0.7, ud = d * 0.55, uh = 1.7;
    roof(w + 3.6, d + 3.6, uw / 2 + 0.3, 1.7, lift, 0.2, grp, ry0);
    const uy = ry0 + 0.9;
    add(new THREE.BoxGeometry(uw, uh, ud), [dm(2), dm(2), plainM, plainM, dm(bays - 2), dm(bays - 2)], 0, uy + uh / 2, 0, grp);
    add(new THREE.BoxGeometry(uw + 0.5, 0.5, ud + 0.5), [bm(ud), bm(ud), plainM, plainM, bm(uw), bm(uw)], 0, uy + uh + 0.25, 0, grp);
    add(new THREE.BoxGeometry(uw + 1.3, 0.36, ud + 1.3), [bm(ud, 0xd8d8d8), bm(ud, 0xd8d8d8), plainM, plainM, bm(uw, 0xd8d8d8), bm(uw, 0xd8d8d8)], 0, uy + uh + 0.68, 0, grp);
    roof(uw + 3.6, ud + 3.6, Math.max(1, uw / 2 - ud * 0.35), roofH, lift + 0.15, roofH * 0.14, grp, uy + uh + 0.86);
    const sign = add(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: signTex }), 0, uy + uh * 0.55, ud / 2 + 0.75, grp);
    sign.rotation.x = 0.18;
  }
  hall({ w: 20, d: 9, h: 4.2, plat: 0.7, bays: 5, roofH: 2.7, x: 0, z: -25, ry: 0, upper: true });   // 정전
  hall({ w: 46, d: 3.4, h: 2.9, plat: 0.35, bays: 17, roofH: 1.5, x: -17.5, z: -3, ry: Math.PI / 2, lift: 0.5 });
  hall({ w: 46, d: 3.4, h: 2.9, plat: 0.35, bays: 17, roofH: 1.5, x: 17.5, z: -3, ry: -Math.PI / 2, lift: 0.5 });
  hall({ w: 38, d: 3.4, h: 2.9, plat: 0.35, bays: 14, roofH: 1.5, x: 0, z: 19.5, ry: Math.PI, lift: 0.5 });
  hall({ w: 38, d: 3.4, h: 2.9, plat: 0.35, bays: 14, roofH: 1.5, x: 0, z: -33, ry: 0, lift: 0.5 });

  /* ---------------- 멀리 보이는 도심 빌딩 ---------------- */
  {
    const c = mk(128, 256), g = c.getContext('2d');
    g.fillStyle = '#9fb3c6'; g.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 256; y += 12) for (let x = 6; x < 128; x += 14) { g.fillStyle = rnd() < 0.3 ? '#dfeaf2' : '#6f879c'; g.fillRect(x, y, 9, 7); }
    const bt = tex(c);
    [[36, -56, 19, 6], [45, -50, 14, 6], [28, -62, 23, 5], [-40, -56, 16, 6]].forEach(([x, z, hh, ww]) =>
      add(new THREE.BoxGeometry(ww, hh, ww), std(0xdfe8f0, { map: rep(bt, 2, hh / 6), roughness: 0.4 }), x, hh / 2, z));
  }

  /* ---------------- 소나무 ---------------- */
  {
    const spots = [[-25, -22], [-26, -9], [-25, 5], [-26, 15], [25, -20], [26, -6], [25, 7], [26, 17], [-12, -40], [11, -41], [-9, 27], [8, 27], [-20, 26], [21, 26]];
    const trunks = inst(new THREE.CylinderGeometry(0.16, 0.3, 1, 8), std(0x7a4a35), spots.length);
    const crowns = inst(new THREE.SphereGeometry(1, 10, 7), std(0xffffff, { flatShading: true }), spots.length * 5);
    const col = new THREE.Color();
    spots.forEach(([x, z], i) => {
      const hgt = 6.5 + rnd() * 2.5, lean = (rnd() - 0.5) * 0.25;
      trunks.setMatrixAt(i, TRS(x, hgt / 2, z, 0, 0, lean, 1, hgt, 1));
      for (let k = 0; k < 5; k++) {
        const r = 1.5 + rnd() * 1.3;
        crowns.setMatrixAt(i * 5 + k, TRS(x + (rnd() - 0.5) * 2.6 - lean * hgt * 0.5, hgt - 0.6 + (rnd() - 0.3) * 2.2, z + (rnd() - 0.5) * 2.6, 0, rnd() * 3, 0, r, r * 0.42, r));
        crowns.setColorAt(i * 5 + k, col.setHSL(0.36 + rnd() * 0.04, 0.32 + rnd() * 0.1, 0.2 + rnd() * 0.08));
      }
    });
    crowns.instanceColor.needsUpdate = true;
  }

  /* ---------------- 깃발 · 차일 · 북 ---------------- */
  const flags = [];
  {
    const cols = [0xc8372d, 0xe8c63a, 0x2c5fa8, 0xf2efe6, 0x2a2a30];
    const poleG = new THREE.CylinderGeometry(0.03, 0.035, 4, 8), poleM = std(0x5b3a24), knobG = new THREE.SphereGeometry(0.08, 8, 6), knobM = std(0xc8372d);
    for (let i = 0; i < 9; i++) {
      const x = -8 + i * 2, z = -14.2;
      add(poleG, poleM, x, 2, z); add(knobG, knobM, x, 4.05, z);
      const geo = new THREE.PlaneGeometry(0.75, 1.5, 6, 2); geo.translate(0.4, 0, 0);
      const m = add(geo, std(cols[i % 5], { side: THREE.DoubleSide, roughness: 0.9 }), x, 3.1, z);
      flags.push({ m, base: geo.attributes.position.array.slice(), ph: rnd() * 6 });
    }
    // 차일(흰 천막)과 시험관 탁자
    const cx = 12, cz = -12.5, clothM = std(0xf4f1e8, { side: THREE.DoubleSide });
    [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([dx, dz]) => add(new THREE.CylinderGeometry(0.04, 0.04, 2.7, 6), poleM, cx + dx, 1.35, cz + dz));
    const cg = new THREE.PlaneGeometry(4.6, 4.6, 6, 6), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) cp.setZ(i, -0.22 * Math.cos(cp.getX(i) / 2.3 * Math.PI / 2) * Math.cos(cp.getY(i) / 2.3 * Math.PI / 2));
    cg.computeVertexNormals(); const can = add(cg, clothM, cx, 2.72, cz); can.rotation.x = -Math.PI / 2;
    add(new THREE.BoxGeometry(2.2, 0.7, 0.9), std(0xa8322a), cx, 0.35, cz);
    // 큰 북
    const dx = -12, dz = -13;
    const drum = add(new THREE.CylinderGeometry(0.75, 0.75, 0.7, 20), [std(0xa8322a), std(0xe9dcc0), std(0xe9dcc0)], dx, 1.5, dz); drum.rotation.x = Math.PI / 2;
    [-0.6, 0.6].forEach(s => add(new THREE.BoxGeometry(0.1, 1.6, 0.1), poleM, dx + s * 1.5, 0.8, dz));
    add(new THREE.BoxGeometry(2.0, 0.1, 0.1), poleM, dx, 2.35, dz);
    const sh = add(new THREE.PlaneGeometry(4, 2.4), shadowM, dx, 0.02, dz); sh.rotation.x = -Math.PI / 2;
  }

  /* ---------------- 시험 보는 유생들 (인스턴스) ---------------- */
  const people = [];
  for (let z = -10.4; z <= 10; z += 2.6) for (let x = -9; x <= 9.01; x += 2.25)
    if (!(Math.abs(x) < 1.6 && z > -5.5 && z < 1.8)) {
      const s = 0.93 + rnd() * 0.13;
      people.push({ M: TRS(x + rnd() * 0.24 - 0.12, 0, z + 0.3 + rnd() * 0.2 - 0.1, 0, rnd() * 0.36 - 0.18, 0, s, s, s),
                    ph: rnd() * 20, sp: 0.6 + rnd() * 0.8, lean: -0.28 - rnd() * 0.18 });
    }
  const N = people.length;
  const white = () => std(0xffffff, { roughness: 0.9 });
  const robeG = new THREE.LatheGeometry([[0.02, 0], [0.43, 0], [0.45, 0.06], [0.37, 0.17], [0.25, 0.27], [0.19, 0.36]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
  const P = {
    mat: inst(new THREE.PlaneGeometry(1.5, 2.0), std(0xffffff, { map: matTex }), N),
    shadow: inst(new THREE.PlaneGeometry(1.25, 1.25), shadowM, N),
    sheet: inst(new THREE.PlaneGeometry(0.5, 0.7), std(0xffffff, { map: sheetTex }), N),
    stone: inst(new THREE.BoxGeometry(0.09, 0.03, 0.13), std(0x1f1f22, { roughness: 0.4 }), N),
    robe: inst(robeG, white(), N),
    torso: inst(new THREE.CapsuleGeometry(0.15, 0.24, 4, 10), white(), N),
    armR: inst(new THREE.CylinderGeometry(0.055, 0.095, 1, 8), white(), N),
    armL: inst(new THREE.CylinderGeometry(0.055, 0.095, 1, 8), white(), N),
    hands: inst(new THREE.SphereGeometry(0.042, 8, 6), white(), N * 2),
    head: inst(new THREE.SphereGeometry(0.105, 14, 10), white(), N),
    hair: inst(new THREE.SphereGeometry(0.112, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), std(0x17130f), N),
    hat: inst(new THREE.BoxGeometry(0.2, 0.13, 0.18), std(0x121216, { roughness: 0.95 }), N),
  };
  const SH_R = new Vector3(0.21, 0.66, -0.13), SH_L = new Vector3(-0.21, 0.66, -0.13), HL = new Vector3(-0.2, 0.07, -0.46);
  const UP = new Vector3(0, 1, 0), dir = new Vector3(), mid = new Vector3(), q = new Quaternion(), sc = new Vector3(), hr = new Vector3();
  const armLocal = (sh, hand) => {                        // 어깨에서 손까지 넓은 소매
    dir.subVectors(sh, hand); const len = dir.length(); mid.addVectors(sh, hand).multiplyScalar(0.5);
    q.setFromUnitVectors(UP, dir.normalize()); return new Matrix4().compose(mid, q, sc.set(1, len, 1));
  };
  const put = (mesh, i, M, L) => mesh.setMatrixAt(i, tmp.multiplyMatrices(M, L));
  const col = new THREE.Color();
  people.forEach((p, i) => {
    const { M, lean } = p, up = new Vector3(0, Math.cos(lean), Math.sin(lean));
    const head = new Vector3(0, 0.5, -0.04).addScaledVector(up, 0.36), hat = head.clone().addScaledVector(new Vector3(0, Math.cos(lean - 0.1), Math.sin(lean - 0.1)), 0.105);
    put(P.mat, i, M, TRS(0, 0.012, -0.55, -Math.PI / 2));
    put(P.shadow, i, M, TRS(0, 0.016, -0.08, -Math.PI / 2));
    put(P.sheet, i, M, TRS(0.02, 0.02, -0.82, -Math.PI / 2));
    put(P.stone, i, M, TRS(0.36, 0.03, -0.7));
    put(P.robe, i, M, TRS(0, 0, 0.04, 0, 0, 0, 1.06, 1, 1));
    put(P.torso, i, M, TRS(0, 0.5, -0.04, lean, 0, 0, 1.3, 1, 0.95));
    put(P.armL, i, M, armLocal(SH_L, HL));
    put(P.hands, i * 2 + 1, M, TRS(HL.x, HL.y, HL.z));
    put(P.head, i, M, TRS(head.x, head.y, head.z, lean - 0.1, 0, 0, 0.92, 1.08, 1));
    put(P.hair, i, M, TRS(head.x, head.y + 0.004, head.z + 0.004, lean + 0.7, 0, 0));
    put(P.hat, i, M, TRS(hat.x, hat.y, hat.z, lean - 0.1, 0, 0));
    col.setHSL(0.46 + rnd() * 0.03, 0.42 + rnd() * 0.16, 0.66 + rnd() * 0.1);     // 옥색 도포
    [P.robe, P.torso, P.armR, P.armL].forEach(m => m.setColorAt(i, col));
    col.setHSL(0.07, 0.42, 0.7 + rnd() * 0.1);                                    // 살빛
    P.head.setColorAt(i, col); P.hands.setColorAt(i * 2, col); P.hands.setColorAt(i * 2 + 1, col);
  });
  [P.robe, P.torso, P.armR, P.armL, P.head, P.hands].forEach(m => { m.instanceColor.needsUpdate = true; });
  function animatePeople(t) {                             // 붓을 든 오른손이 글씨를 쓰듯 움직임
    for (let i = 0; i < N; i++) {
      const p = people[i], a = t * p.sp + p.ph, busy = Math.sin(a * 0.23) > -0.3 ? 1 : 0.15;
      hr.set(0.13 + 0.07 * Math.sin(a * 1.3) * busy, 0.11 + 0.02 * Math.sin(a * 5.1) * busy, -0.5 + 0.06 * Math.sin(a * 0.8));
      put(P.armR, i, p.M, armLocal(SH_R, hr));
      put(P.hands, i * 2, p.M, TRS(hr.x, hr.y, hr.z));
    }
    P.armR.instanceMatrix.needsUpdate = true; P.hands.instanceMatrix.needsUpdate = true;
  }
  animatePeople(0);

  /* ---------------- 서 있는 시험관 · 순찰 도는 감독관 ---------------- */
  const skinM = std(0xe6c3a0), blackM = std(0x121216), goldM = std(0xd6b04a, { roughness: 0.5 });
  function official(color) {
    const g = new THREE.Group(), rm = std(color, { roughness: 0.8 });
    add(new THREE.CylinderGeometry(0.17, 0.35, 1.32, 14), rm, 0, 0.66, 0, g);
    const ch = add(new THREE.SphereGeometry(0.24, 12, 8), rm, 0, 1.27, 0, g); ch.scale.set(1.12, 0.72, 0.8);
    add(new THREE.BoxGeometry(0.52, 0.2, 0.2), rm, 0, 1.02, -0.17, g);                     // 공수한 넓은 소매
    add(new THREE.PlaneGeometry(0.17, 0.17), goldM, 0, 1.24, -0.2, g).rotation.y = Math.PI; // 흉배
    const belt = add(new THREE.TorusGeometry(0.235, 0.018, 6, 20), blackM, 0, 0.98, 0, g); belt.rotation.x = Math.PI / 2;
    const head = add(new THREE.SphereGeometry(0.105, 14, 10), skinM, 0, 1.56, 0, g); head.scale.set(0.92, 1.08, 1);
    add(new THREE.CylinderGeometry(0.1, 0.112, 0.1, 12), blackM, 0, 1.67, 0, g);            // 사모
    add(new THREE.BoxGeometry(0.17, 0.11, 0.09), blackM, 0, 1.75, 0.04, g);
    add(new THREE.BoxGeometry(0.44, 0.035, 0.07), blackM, 0, 1.67, 0.08, g);
    const s = add(new THREE.PlaneGeometry(1.1, 1.1), shadowM, 0, 0.018, 0, g); s.rotation.x = -Math.PI / 2;
    root.add(g); return g;
  }
  [[-5, 0xa8322a], [-3, 0x2c4f8f], [-1, 0xa8322a], [1, 0xa8322a], [3, 0x2c4f8f], [5, 0xa8322a]].forEach(([x, c]) => {
    const o = official(c); o.position.set(x, 0, -15.4); o.rotation.y = Math.PI;             // 유생들을 바라봄
  });
  const seated = official(0x2f6b4f); seated.position.set(12, 0, -13.4); seated.rotation.y = Math.PI;
  const walkers = [
    { o: official(0xa8322a), pts: [[3.375, -11.6], [3.375, 9.2], [5.625, 9.2], [5.625, -11.6]], t: 0 },
    { o: official(0x2c4f8f), pts: [[-3.375, 9.2], [-3.375, -11.6], [-5.625, -11.6], [-5.625, 9.2]], t: 0.4 },
    { o: official(0xa8322a), pts: [[-8, -12.4], [8, -12.4]], t: 0.2, pingpong: true },
  ];
  walkers.forEach(w => {
    const p = w.pts.map(([x, z]) => new THREE.Vector2(x, z));
    if (w.pingpong) p.push(...p.slice(0, -1).reverse()); else p.push(p[0]);
    w.path = p; w.lens = p.slice(1).map((b, i) => b.distanceTo(p[i])); w.total = w.lens.reduce((a, b) => a + b, 0);
  });
  function animateWalkers(t) {
    walkers.forEach(w => {
      let dd = ((t * 0.45 + w.t * w.total) % w.total), k = 0;
      while (dd > w.lens[k]) { dd -= w.lens[k]; k++; }
      const a = w.path[k], b = w.path[k + 1], f = dd / w.lens[k];
      w.o.position.set(lerp(a.x, b.x, f), Math.abs(Math.sin(t * 2.9 + w.t * 9)) * 0.022, lerp(a.y, b.y, f));
      const want = Math.atan2(-(b.x - a.x), -(b.y - a.y));
      let diff = want - w.o.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      w.o.rotation.y += diff * 0.08;
    });
  }

  /* ---------------- 매 프레임 ---------------- */
  function tick(now) {
    if (!root.visible) return;
    const t = now / 1000;
    flags.forEach(f => {
      const pa = f.m.geometry.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        const bx = f.base[i * 3], by = f.base[i * 3 + 1];
        pa.setZ(i, Math.sin(t * 3.1 + bx * 5 + by * 1.5 + f.ph) * 0.11 * bx + Math.sin(t * 1.3 + f.ph) * 0.05 * bx);
      }
      pa.needsUpdate = true;
    });
    animatePeople(t); animateWalkers(t);
  }

  /* ---------------- 바람 소리와 새소리 ---------------- */
  let ambient = false;
  function startAmbience(AC) {
    if (ambient || !AC) return; ambient = true;
    try {
      const len = AC.sampleRate * 5, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      for (let i = 0; i < 4000; i++) { const f = i / 4000; d[i] *= f; d[len - 1 - i] *= f; }
      const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
      const wg = AC.createGain(); wg.gain.value = 0.05;
      const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.025;
      lfo.connect(lg).connect(wg.gain); lfo.start();
      src.connect(lp).connect(wg).connect(AC.destination); src.start();
      const chirp = () => {
        const n = 2 + Math.floor(Math.random() * 4), f0 = 2400 + Math.random() * 1800, t0 = AC.currentTime + 0.05;
        for (let k = 0; k < n; k++) {
          const o = AC.createOscillator(), gg = AC.createGain(), t = t0 + k * 0.14;
          o.frequency.setValueAtTime(f0 * (1 + Math.random() * 0.15), t); o.frequency.exponentialRampToValueAtTime(f0 * (0.75 + Math.random() * 0.5), t + 0.09);
          gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(0.012, t + 0.015); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
          o.connect(gg).connect(AC.destination); o.start(t); o.stop(t + 0.12);
        }
        setTimeout(chirp, 3500 + Math.random() * 9000);
      };
      setTimeout(chirp, 2000);
    } catch (e) {}
  }

  /* ---------------- 360도 사진 배경 ----------------
     같은 폴더에 pano.jpg (가로:세로 = 2:1 인 360도 사진)를 두면 자동으로 불러옵니다. */
  const api = { tick, startAmbience, setPhoto, hasPhoto: false, onPhotoReady: null };
  let photoMesh = null;
  function setPhoto(on) {
    const use = !!(on && photoMesh);
    root.visible = !use; if (photoMesh) photoMesh.visible = use;
    scene.fog = use ? null : fog;
    return use;
  }
  const img = new Image();
  img.onload = () => {
    const max = Math.min(renderer.capabilities.maxTextureSize, 8192);
    let src = img;
    if (img.width > max) {                                // 기기가 감당할 크기로 줄임
      const c = mk(max, Math.round(max * img.height / img.width));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); src = c;
    }
    const t = new THREE.Texture(src); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1;      // 구 안쪽에서 봐도 좌우가 뒤집히지 않게
    t.needsUpdate = true;
    photoMesh = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }));
    photoMesh.position.y = 1.4; photoMesh.rotation.y = THREE.MathUtils.degToRad(90 + PANO.yawDeg);   // 사진 가운데가 정면
    photoMesh.visible = false; scene.add(photoMesh);
    api.hasPhoto = true; if (api.onPhotoReady) api.onPhotoReady();
  };
  img.onerror = () => {};
  img.src = PANO.file;

  return api;
}
