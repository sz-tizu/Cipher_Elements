/* Cipher Elements — 講義ページの動く図
   原稿中の <figure class="widget" data-widget="名前"> を見つけて描画する。
   色はすべて site.css の CSS 変数を参照するので、ライト/ダーク両方で読める。 */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";

  // ---------- helpers ----------
  function svgEl(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function el(tag, attrs, parent, text) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  const mod = (a, n) => ((a % n) + n) % n;
  const minus = (v) => (v < 0 ? "−" + -v : String(v));
  const paren = (v) => (v < 0 ? "(−" + -v + ")" : String(v));
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
  function divisors(n) { n = Math.abs(n); const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; }
  function bpow(a, e, n) { a = BigInt(a); e = BigInt(e); n = BigInt(n); let r = 1n; a %= n; while (e > 0n) { if (e & 1n) r = r * a % n; a = a * a % n; e >>= 1n; } return Number(r); }
  function intInput(parent, label, value, min, max, id) {
    const l = el("label", { for: id }, parent, label);
    const i = el("input", { type: "number", id, value, min, max, step: 1, inputmode: "numeric" }, l);
    i.readInt = () => {
      const v = Math.round(Number(i.value));
      if (!Number.isFinite(v)) return null;
      return Math.min(max, Math.max(min, v));
    };
    return i;
  }
  function button(parent, label, cls) { return el("button", { type: "button", class: "w-btn" + (cls ? " " + cls : "") }, parent, label); }
  function arrowDefs(svg, id, color) {
    const defs = svgEl("defs", {}, svg);
    const m = svgEl("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
    svgEl("path", { d: "M0 0L10 5L0 10z", fill: color }, m);
  }
  let uid = 0;
  const nextId = (p) => p + "-" + ++uid;
  function frame(fig, title) {
    clear(fig);
    el("p", { class: "w-title" }, fig, title);
    const controls = el("div", { class: "w-controls" }, fig);
    return controls;
  }

  const W = {};

  // ---------- §1 法 n の時計 ----------
  W.clock12 = function (fig) {
    const c = frame(fig, "数を時計に置くと、余りの目盛りに落ちる");
    const xi = intInput(c, "数 x", 17, -999, 9999, nextId("ck-x"));
    const nl = el("label", {}, c, "法 n");
    const ns = el("select", { "aria-label": "法 n" }, nl);
    for (let n = 2; n <= 24; n++) { const o = el("option", { value: n }, ns, String(n)); if (n === 12) o.selected = true; }
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 290", role: "img", "aria-label": "法 n の時計" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    function draw() {
      const x = xi.readInt() ?? 0, n = Number(ns.value), r = mod(x, n), q = Math.floor(x / n);
      clear(svg);
      const cx = 150, cy = 145, R = 112, small = n > 14, rr = small ? 11 : 15;
      const pt = (k) => { const t = -Math.PI / 2 + (2 * Math.PI * k) / n; return [cx + R * Math.cos(t), cy + R * Math.sin(t)]; };
      svgEl("circle", { cx, cy, r: R, fill: "none", stroke: "var(--grid)", "stroke-width": 1.5 }, svg);
      const [hx, hy] = pt(r);
      svgEl("line", { x1: cx, y1: cy, x2: cx + (hx - cx) * 0.8, y2: cy + (hy - cy) * 0.8, stroke: "var(--hot)", "stroke-width": 3, "stroke-linecap": "round" }, svg);
      svgEl("circle", { cx, cy, r: 4, fill: "var(--hot)" }, svg);
      for (let k = 0; k < n; k++) {
        const [px, py] = pt(k), on = k === r;
        svgEl("circle", { cx: px, cy: py, r: rr, fill: on ? "var(--hot-soft)" : "var(--panel)", stroke: on ? "var(--hot)" : "var(--line)", "stroke-width": on ? 2 : 1.25 }, svg);
        svgEl("text", { x: px, y: py + (small ? 4 : 4.5), "text-anchor": "middle", "font-size": small ? 10.5 : 13, class: "mono", fill: "var(--ink)", "font-weight": on ? 700 : 400 }, svg, String(k));
      }
      const tx = 310;
      svgEl("text", { x: tx, y: 70, "font-size": 13, fill: "var(--muted)" }, svg, "割り算で書くと");
      svgEl("text", { x: tx, y: 96, "font-size": 16, class: "mono", fill: "var(--ink)" }, svg, `${minus(x)} = ${paren(q)}·${n} + ${r}`);
      svgEl("text", { x: tx, y: 136, "font-size": 13, fill: "var(--muted)" }, svg, "同じ目盛り " + r + " に落ちる数");
      const reps = [-2, -1, 0, 1, 2].map((k) => minus(r + k * n));
      svgEl("text", { x: tx, y: 162, "font-size": 15, class: "mono", fill: "var(--ink)" }, svg, "… " + reps.join(", ") + " …");
      svgEl("text", { x: tx, y: 206, "font-size": 17, class: "mono", fill: "var(--ink)", "font-weight": 700 }, svg, `${minus(x)} ≡ ${r}  (mod ${n})`);
      if (x < 0) {
        const j = x % n;
        svgEl("text", { x: tx, y: 240, "font-size": 12.5, fill: "var(--hot)" }, svg, `Java の ${minus(x)} % ${n} は ${minus(j)}、Math.floorMod は ${r}`);
      }
      cap.textContent = `n ずつ離れた数は、すべて同じ目盛りに重なります。x に負の数や大きな数を入れても、落ちる先は 0〜${n - 1} のどれかです。`;
    }
    xi.addEventListener("input", draw); ns.addEventListener("change", draw);
    draw();
  };

  // ---------- §2 長方形を正方形で切り取る ----------
  W["euclid-rect"] = function (fig) {
    const c = frame(fig, "長方形を正方形で切り取ると、残りの辺の組が互除法と同じ順に小さくなる");
    const ai = intInput(c, "横 a", 40, 1, 400, nextId("er-a"));
    const bi = intInput(c, "縦 b", 7, 1, 400, nextId("er-b"));
    const back = button(c, "戻る"), next = button(c, "次へ", "primary"), reset = button(c, "最初から"), play = button(c, "自動再生");
    const pairs = el("div", { class: "w-out" }, fig);
    const svg = svgEl("svg", { class: "w-svg", role: "img", "aria-label": "長方形の切り取り" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    let steps = [], k = 0, timer = null, fresh = false, A = 40, B = 7;
    const colors = ["var(--accent)", "var(--hot)", "var(--good)", "var(--muted)"];

    function build() {
      A = ai.readInt() ?? 1; B = bi.readInt() ?? 1;
      const Wd = Math.max(A, B), Ht = Math.min(A, B);
      steps = []; let x = 0, y = 0, w = Wd, h = Ht;
      while (w > 0 && h > 0) {
        const sq = [];
        if (w >= h) { const q = Math.floor(w / h); for (let i = 0; i < q; i++) sq.push([x + i * h, y, h]); x += q * h; w -= q * h; steps.push({ sq, q, side: h, rem: [x, y, w, h] }); }
        else { const q = Math.floor(h / w); for (let i = 0; i < q; i++) sq.push([x, y + i * w, w]); y += q * w; h -= q * w; steps.push({ sq, q, side: w, rem: [x, y, w, h] }); }
      }
      k = 0; stop(); draw();
    }
    function draw() {
      const Wd = Math.max(A, B), Ht = Math.min(A, B);
      const sc = Math.min(592 / Wd, 220 / Ht), ox = 24 + (592 - Wd * sc) / 2, oy = 12, vh = Math.round(Ht * sc + 24);
      svg.setAttribute("viewBox", `0 0 640 ${vh}`);
      clear(svg);
      svgEl("rect", { x: ox, y: oy, width: Wd * sc, height: Ht * sc, fill: "none", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      for (let j = 0; j < k; j++) {
        for (const [sx, sy, s] of steps[j].sq) {
          svgEl("rect", { x: ox + sx * sc, y: oy + sy * sc, width: Math.max(s * sc, 0.8), height: Math.max(s * sc, 0.8),
            fill: colors[j % 4], "fill-opacity": 0.22, stroke: colors[j % 4], "stroke-width": 1.4, class: "sq" + (fresh && j === k - 1 ? " fresh" : "") }, svg);
        }
      }
      if (k < steps.length) {
        const r = k === 0 ? [0, 0, Wd, Ht] : steps[k - 1].rem;
        svgEl("rect", { x: ox + r[0] * sc, y: oy + r[1] * sc, width: r[2] * sc, height: r[3] * sc, fill: "none", stroke: "var(--ink)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      }
      fresh = false;
      // 辺の組の列
      clear(pairs);
      let a = Wd, b = Ht; const seq = [[a, b]];
      while (b > 0) { [a, b] = [b, a % b]; seq.push([a, b]); }
      seq.forEach((p, i) => {
        if (i) pairs.appendChild(document.createTextNode(" → "));
        const s = el("span", {}, pairs, `(${p[0]}, ${p[1]})`);
        if (i === k) { s.style.fontWeight = "700"; s.style.color = "var(--hot)"; }
      });
      // 説明
      if (k === 0) cap.innerHTML = `<b>${Wd} × ${Ht}</b> の長方形から、短い辺を一辺とする正方形をとれるだけ取っていきます。点線が、まだ切っていない残りです。`;
      else {
        const st = steps[k - 1], prevW = k === 1 ? Wd : steps[k - 2].rem[2], prevH = k === 1 ? Ht : steps[k - 2].rem[3];
        const big = Math.max(prevW, prevH), small = Math.min(prevW, prevH), rem = big - st.q * small;
        const done = k === steps.length;
        cap.innerHTML = `${st.side} × ${st.side} の正方形が <b>${st.q} 枚</b>とれて、` +
          (done ? `ぴったり埋まりました。<b>gcd(${Wd}, ${Ht}) = ${st.side}</b>` : `${rem} × ${small} が残ります。`) +
          `　<span class="mono">${big} = ${st.q}·${small} + ${rem}</span>`;
      }
      back.disabled = k === 0; next.disabled = k === steps.length;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } play.textContent = "自動再生"; }
    back.addEventListener("click", () => { stop(); if (k > 0) { k--; draw(); } });
    next.addEventListener("click", () => { stop(); if (k < steps.length) { k++; fresh = true; draw(); } });
    reset.addEventListener("click", () => { stop(); k = 0; draw(); });
    play.addEventListener("click", () => {
      if (timer) { stop(); return; }
      if (k >= steps.length) k = 0;
      play.textContent = "停止";
      timer = setInterval(() => { if (k >= steps.length) { stop(); return; } k++; fresh = true; draw(); }, 1000);
    });
    ai.addEventListener("input", build); bi.addEventListener("input", build);
    build();
  };

  // ---------- §3 おもちゃの RSA ----------
  W["rsa-flow"] = function (fig) {
    const c = frame(fig, "公開鍵で誰でも暗号化でき、秘密鍵 d を持つ人だけが戻せる");
    const mi = intInput(c, "平文 m（0〜54）", 2, 0, 54, nextId("rsa-m"));
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 300", role: "img", "aria-label": "おもちゃの RSA の流れ" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("rsa-arrow");
    const n = 55, e = 7, d = 23;
    function box(x, y, w, label, value, strong) {
      svgEl("rect", { x, y, width: w, height: 60, rx: 8, fill: strong ? "var(--accent-soft)" : "none", stroke: strong ? "var(--accent)" : "var(--line)", "stroke-width": strong ? 2 : 1.25 }, svg);
      svgEl("text", { x: x + w / 2, y: y + 22, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)" }, svg, label);
      svgEl("text", { x: x + w / 2, y: y + 46, "text-anchor": "middle", "font-size": 18, class: "mono", "font-weight": 700, fill: "var(--ink)" }, svg, value);
    }
    function draw() {
      const m = mi.readInt() ?? 0, cph = bpow(m, e, n), back = bpow(cph, d, n);
      clear(svg); arrowDefs(svg, aid, "var(--muted)");
      svgEl("rect", { x: 24, y: 16, width: 592, height: 70, rx: 8, fill: "var(--bg)", stroke: "var(--line)" }, svg);
      svgEl("text", { x: 40, y: 42, "font-size": 13, "font-weight": 700, fill: "var(--ink)" }, svg, "鍵生成（受信者だけが行う）");
      svgEl("text", { x: 40, y: 68, "font-size": 13.5, class: "mono", fill: "var(--ink)" }, svg, "p=5, q=11 → n=55, φ(n)=40 → e=7, d=7⁻¹ mod 40=23");
      box(24, 176, 150, "平文", "m = " + m, false);
      box(245, 176, 150, "暗号文", "c = " + cph, true);
      box(466, 176, 150, "復号結果", "m = " + back, false);
      svgEl("path", { d: "M174 206H243", stroke: "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
      svgEl("path", { d: "M395 206H464", stroke: "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
      svgEl("path", { d: "M208 86V198", stroke: "var(--accent)", "stroke-width": 1.2, "stroke-dasharray": "4 4", fill: "none" }, svg);
      svgEl("path", { d: "M430 86V198", stroke: "var(--hot)", "stroke-width": 1.2, "stroke-dasharray": "4 4", fill: "none" }, svg);
      svgEl("text", { x: 216, y: 126, "font-size": 12, fill: "var(--accent)" }, svg, "公開鍵 (n, e) = (55, 7)");
      svgEl("text", { x: 438, y: 126, "font-size": 12, fill: "var(--hot)" }, svg, "秘密鍵 d = 23");
      svgEl("text", { x: 208, y: 262, "text-anchor": "middle", "font-size": 12, class: "mono", fill: "var(--muted)" }, svg, "c = m^7 mod 55");
      svgEl("text", { x: 430, y: 262, "text-anchor": "middle", "font-size": 12, class: "mono", fill: "var(--muted)" }, svg, "m = c^23 mod 55");
      svgEl("text", { x: 24, y: 290, "font-size": 12, fill: "var(--muted)" }, svg, "e·d = 161 = 4·40 + 1 なので、m^(ed) = (m^φ(n))^4 · m ≡ m に戻る");
      const big = (BigInt(m) ** 7n).toString();
      out.innerHTML = `${m}^7 = ${big} ≡ <b>${cph}</b> (mod 55)<br>${cph}^23 mod 55 = <b>${back}</b> ` + (back === m ? '<span style="color:var(--good)">元に戻った ✓</span>' : "") +
        (gcd(m, n) !== 1 && m !== 0 ? "<br>m は 55 と互いに素ではありませんが、中国剰余定理（§4）によりそれでも戻ります。" : "");
    }
    mi.addEventListener("input", draw);
    draw();
  };

  // ---------- §5 Z_7* の部分群 ----------
  W["z7-subgroups"] = function (fig) {
    const c = frame(fig, "Z_7* の部分群の位数 1, 2, 3, 6 は、すべて 6 の約数");
    el("span", {}, c, "元 g を選ぶと、g が生成する部分群 ⟨g⟩ が光ります");
    const chips = el("div", { class: "w-chips" }, fig);
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 330", role: "img", "aria-label": "Z_7* の部分群の包含関係" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const p = 7;
    const order = (g) => { let x = g % p, k = 1; while (x !== 1) { x = (x * g) % p; k++; } return k; };
    const boxes = {
      6: { x: 320, y: 62, label: "Z_7*（位数 6）", set: "{1, 2, 3, 4, 5, 6}" },
      3: { x: 170, y: 168, label: "位数 3", set: "{1, 2, 4}" },
      2: { x: 470, y: 168, label: "位数 2", set: "{1, 6}" },
      1: { x: 320, y: 274, label: "位数 1", set: "{1}" },
    };
    let g = 3;
    function draw() {
      clear(chips);
      for (let v = 1; v < p; v++) {
        const b = el("button", { type: "button", class: "w-chip", "aria-pressed": String(v === g) }, chips, `${v}`);
        el("small", {}, b, ` 位数${order(v)}`).style.opacity = "0.75";
        b.addEventListener("click", () => { g = v; draw(); });
      }
      clear(svg);
      const lines = [[6, 3], [6, 2], [3, 1], [2, 1]];
      for (const [u, l] of lines) {
        svgEl("line", { x1: boxes[u].x, y1: boxes[u].y + 28, x2: boxes[l].x, y2: boxes[l].y - 28, stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      }
      const og = order(g);
      for (const k of [6, 3, 2, 1]) {
        const b = boxes[k], on = k === og, w = 220;
        svgEl("rect", { x: b.x - w / 2, y: b.y - 28, width: w, height: 56, rx: 8, fill: on ? "var(--accent-soft)" : "var(--panel)", stroke: on ? "var(--accent)" : "var(--line)", "stroke-width": on ? 2 : 1.25 }, svg);
        svgEl("text", { x: b.x, y: b.y - 6, "text-anchor": "middle", "font-size": 13.5, "font-weight": 700, fill: "var(--ink)" }, svg, b.label);
        svgEl("text", { x: b.x, y: b.y + 16, "text-anchor": "middle", "font-size": 13, class: "mono", fill: "var(--ink)" }, svg, b.set);
      }
      svgEl("text", { x: 24, y: 322, "font-size": 11.5, fill: "var(--muted)" }, svg, "線は「下の部分群が上に含まれる」関係。位数 4 や 5 の部分群は存在しない");
      const pw = []; let x = g;
      for (let i = 1; i <= og; i++) { pw.push(`${g}^${i}=${x}`); x = (x * g) % p; }
      out.innerHTML = `${pw.join(", ")}<br>位数 <b>${og}</b> は 6 の約数 ` + (og === 6 ? `→ ${g} は<b>生成元</b>（群全体を回る）` : `→ ⟨${g}⟩ は位数 ${og} の部分群`);
    }
    draw();
  };

  // ---------- 補足: 拡張互除法のジャンプ ----------
  W["jump-line"] = function (fig) {
    const c = frame(fig, "レシピどおりに跳ぶと、その行の余りに着地する");
    const sl = el("label", {}, c, "数の組");
    const sel = el("select", { "aria-label": "数の組" }, sl);
    [[40, 7], [26, 11], [48, 18], [100, 37]].forEach(([a, b], i) => { const o = el("option", { value: `${a},${b}` }, sel, `${a} と ${b}`); if (i === 0) o.selected = true; });
    const rowsBox = el("div", { class: "w-chips" }, fig);
    const formula = el("div", { class: "w-out" }, fig);
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 210", role: "img", "aria-label": "数直線上のジャンプ" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const ida = nextId("ja"), idb = nextId("jb");
    let rows = [], k = 0, A = 40, B = 7;
    function build() {
      [A, B] = sel.value.split(",").map(Number);
      rows = [{ r: A, s: 1, t: 0 }, { r: B, s: 0, t: 1 }];
      while (rows[rows.length - 1].r !== 0) {
        const p = rows[rows.length - 2], q0 = rows[rows.length - 1], q = Math.floor(p.r / q0.r);
        const nx = { r: p.r - q * q0.r, s: p.s - q * q0.s, t: p.t - q * q0.t, q };
        if (nx.r === 0) break;
        rows.push(nx);
      }
      k = rows.length - 1; draw();
    }
    function draw() {
      clear(rowsBox);
      rows.forEach((row, i) => {
        const b = el("button", { type: "button", class: "w-chip", "aria-pressed": String(i === k) }, rowsBox, `${row.r}  (${minus(row.s)}, ${minus(row.t)})`);
        b.addEventListener("click", () => { k = i; draw(); });
      });
      const row = rows[k];
      formula.innerHTML = `<b>${row.r}</b> = ${paren(row.s)}·${A} + ${paren(row.t)}·${B} = ${minus(row.s * A)} ${row.t * B < 0 ? "−" : "+"} ${Math.abs(row.t * B)}`;
      // number line
      clear(svg); arrowDefs(svg, ida, "var(--accent)"); arrowDefs(svg, idb, "var(--hot)");
      const s0 = row.s * A, pts = [0, s0, row.r, A, B];
      let lo = Math.min(...pts), hi = Math.max(...pts); const pad = (hi - lo) * 0.06 + 2; lo -= pad; hi += pad;
      const X = (v) => 32 + ((v - lo) / (hi - lo)) * 576, ay = 120;
      svgEl("line", { x1: 24, x2: 616, y1: ay, y2: ay, stroke: "var(--line)", "stroke-width": 1.25 }, svg);
      const tickStep = A;
      for (let v = Math.ceil(lo / tickStep) * tickStep; v <= hi; v += tickStep) {
        svgEl("line", { x1: X(v), x2: X(v), y1: ay - 5, y2: ay + 5, stroke: "var(--muted)" }, svg);
        svgEl("text", { x: X(v), y: ay + 52, "text-anchor": "middle", "font-size": 11.5, class: "mono", fill: "var(--muted)" }, svg, minus(v));
      }
      const sgS = Math.sign(row.s), sgT = Math.sign(row.t);
      for (let i = 0; i < Math.abs(row.s); i++) {
        const a = i * A * sgS, b = (i + 1) * A * sgS, mx = (X(a) + X(b)) / 2, hgt = Math.min(70, Math.abs(X(b) - X(a)) * 0.6);
        svgEl("path", { d: `M${X(a)} ${ay}Q${mx} ${ay - hgt * 1.4} ${X(b)} ${ay}`, fill: "none", stroke: "var(--accent)", "stroke-width": 2, "marker-end": `url(#${ida})` }, svg);
      }
      for (let j = 0; j < Math.abs(row.t); j++) {
        const a = s0 + j * B * sgT, b = s0 + (j + 1) * B * sgT, mx = (X(a) + X(b)) / 2, hgt = Math.min(30, Math.abs(X(b) - X(a)) * 0.7);
        svgEl("path", { d: `M${X(a)} ${ay}Q${mx} ${ay + hgt} ${X(b)} ${ay}`, fill: "none", stroke: "var(--hot)", "stroke-width": 1.5, "marker-end": `url(#${idb})` }, svg);
      }
      svgEl("circle", { cx: X(0), cy: ay, r: 4, fill: "var(--muted)" }, svg);
      svgEl("line", { x1: X(row.r), x2: X(row.r), y1: ay - 6, y2: ay - 86, stroke: "var(--ink)", "stroke-dasharray": "2 3" }, svg);
      svgEl("circle", { cx: X(row.r), cy: ay, r: 6, fill: "var(--ink)" }, svg);
      svgEl("text", { x: X(row.r), y: ay - 92, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "var(--ink)" }, svg, "r = " + row.r);
      svgEl("text", { x: 24, y: 200, "font-size": 11.5, fill: "var(--accent)" }, svg, `上の弧 = ${A} のジャンプ`);
      svgEl("text", { x: 220, y: 200, "font-size": 11.5, fill: "var(--hot)" }, svg, `下の弧 = ${B} のジャンプ（右向きが進む、左向きが戻る）`);
      if (k < 2) cap.textContent = `出発点: ${row.r} は ${row.r} そのもの。レシピ (${row.s}, ${row.t})`;
      else {
        const p = rows[k - 2], q0 = rows[k - 1];
        cap.textContent = `${row.r} = ${p.r} − ${row.q}·${q0.r} なので、レシピも (${minus(p.s)}, ${minus(p.t)}) − ${row.q}·(${minus(q0.s)}, ${minus(q0.t)}) = (${minus(row.s)}, ${minus(row.t)})` +
          (k === rows.length - 1 ? `。最後の行なので ${row.r} = gcd(${A}, ${B}) です。` : "");
      }
    }
    sel.addEventListener("change", build);
    build();
  };

  // ---------- 補足: 公約数の集合は変わらない ----------
  W["common-divisors"] = function (fig) {
    const c = frame(fig, "a − q·b に置き換えても、公約数の集合は変わらない");
    const ai = intInput(c, "a", 48, 1, 2000, nextId("cd-a"));
    const bi = intInput(c, "b", 18, 1, 2000, nextId("cd-b"));
    const qi = intInput(c, "q（引く回数）", 2, -20, 2000, nextId("cd-q"));
    const qr = button(c, "q を商にする");
    const rows = el("div", {}, fig);
    const out = el("div", { class: "w-out" }, fig);
    function draw() {
      const a = ai.readInt() ?? 1, b = bi.readInt() ?? 1, q = qi.readInt() ?? 0, r = a - q * b;
      const da = divisors(a), db = divisors(b), dr = r === 0 ? null : divisors(r);
      const common = new Set(da.filter((d) => b % d === 0));
      clear(rows);
      function row(label, list) {
        const rw = el("div", { class: "w-row" }, rows);
        el("span", {}, rw, label);
        const box = el("div", { class: "w-chips" }, rw);
        if (!list) { el("span", {}, box, "0 はすべての数で割り切れる（公約数は b の約数そのもの）"); return; }
        for (const d of list) el("span", { class: "w-chip static" + (common.has(d) ? " common" : "") }, box, String(d));
      }
      row(`a = ${a}`, da); row(`b = ${b}`, db); row(`a − ${paren(q)}·b = ${minus(r)}`, dr);
      const cab = [...common], cbr = db.filter((d) => r % d === 0);
      const same = cab.length === cbr.length && cab.every((d, i) => d === cbr[i]);
      out.innerHTML = `a と b の公約数: {${cab.join(", ")}}<br>b と ${minus(r)} の公約数: {${cbr.join(", ")}}<br>` +
        (same ? `<span style="color:var(--good)">一致 ✓</span>　最大値はどちらも <b>${gcd(a, b)}</b>` : "不一致");
    }
    qr.addEventListener("click", () => { const a = ai.readInt() ?? 1, b = bi.readInt() ?? 1; qi.value = Math.floor(a / b); draw(); });
    [ai, bi, qi].forEach((i) => i.addEventListener("input", draw));
    draw();
  };

  // ---------- boot ----------
  function boot() {
    document.querySelectorAll("figure.widget[data-widget]").forEach((fig) => {
      const fn = W[fig.dataset.widget];
      if (!fn) return;
      try { fn(fig); } catch (err) { fig.textContent = "図を表示できませんでした: " + err.message; }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
