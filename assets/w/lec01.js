/* 第1回 数学的基盤 と、その補足ノートの図 */
(function () {
  "use strict";
  const { svgEl, el, clear, mod, minus, paren, gcd, divisors, bpow, intInput, button, arrowDefs, nextId, frame } = CE;
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


  // ---------- §2 乗算表: どの数に逆元があるか ----------
  W["mul-table"] = function (fig) {
    const c = frame(fig, "掛け算の表に 1 が現れる行だけが、逆元を持つ");
    const nl = el("label", {}, c, "法 n");
    const ns = el("select", { "aria-label": "法 n" }, nl);
    for (let n = 5; n <= 15; n++) { const o = el("option", { value: n }, ns, String(n) + (CE.divisors(n).length === 2 ? "（素数）" : "")); if (n === 10) o.selected = true; }
    const wrap = el("div", { class: "mt-wrap" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    let sel = 3;
    function draw() {
      const n = Number(ns.value); if (sel >= n) sel = 1;
      clear(wrap);
      const g = el("div", { class: "mt", role: "table" }, wrap);
      g.style.gridTemplateColumns = `3.2em repeat(${n - 1}, minmax(1.9em, 1fr))`;
      el("div", { class: "mt-h mt-corner" }, g, "a \\ b");
      for (let b = 1; b < n; b++) el("div", { class: "mt-h" }, g, String(b));
      for (let a = 1; a < n; a++) {
        const has = gcd(a, n) === 1;
        const h = el("button", { type: "button", class: "mt-h mt-row" + (has ? " ok" : " no") + (a === sel ? " sel" : ""), "aria-label": `${a} の行を選ぶ` }, g, String(a));
        h.addEventListener("click", () => { sel = a; draw(); });
        for (let b = 1; b < n; b++) {
          const v = (a * b) % n;
          el("div", { class: "mt-c" + (v === 1 ? " one" : "") + (has ? "" : " dim") + (a === sel ? " sel" : "") }, g, String(v));
        }
      }
      const units = []; for (let a = 1; a < n; a++) if (gcd(a, n) === 1) units.push(a);
      const d = gcd(sel, n);
      let msg = "";
      if (d === 1) { let inv = 1; while ((sel * inv) % n !== 1) inv++; msg = `${sel} の行には 1 がある（${sel} × ${inv} = ${sel * inv} ≡ 1）→ <b>${sel}⁻¹ = ${inv}</b>。gcd(${sel}, ${n}) = 1`; }
      else { const vals = [...new Set(Array.from({ length: n - 1 }, (_, i) => (sel * (i + 1)) % n))].sort((x, y) => x - y); msg = `${sel} の行は ${vals.join(", ")} しか出ない（どれも ${d} の倍数）→ 1 に届かないので逆元なし。gcd(${sel}, ${n}) = ${d}`; }
      out.innerHTML = msg + `<br>逆元を持つ数: Z_${n}* = {${units.join(", ")}}　個数 φ(${n}) = ${units.length}` +
        (units.length === n - 1 ? `<br><span style="color:var(--good)">n が素数なので、0 以外の全員が逆元を持つ（割り算が自由にできる＝体）</span>` : "");
    }
    ns.addEventListener("change", draw);
    draw();
  };

  // ---------- §3 a を掛けると Z_n* が並べ替わる ----------
  W.perm = function (fig) {
    const c = frame(fig, "Z_n* の全員に a を掛けると、同じ集合の並べ替えになる");
    const nl = el("label", {}, c, "法 n");
    const ns = el("select", { "aria-label": "法 n" }, nl);
    [7, 9, 10, 12, 14, 15].forEach((n) => { const o = el("option", { value: n }, ns, String(n)); if (n === 10) o.selected = true; });
    const chips = el("div", { class: "w-chips" }, fig);
    const svg = svgEl("svg", { class: "w-svg", role: "img", "aria-label": "掛け算による並べ替え" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("pm");
    let a = 3;
    function draw() {
      const n = Number(ns.value), U = []; for (let r = 1; r < n; r++) if (gcd(r, n) === 1) U.push(r);
      if (!U.includes(a)) a = U[1] || U[0];
      clear(chips);
      el("span", { class: "w-chip static" }, chips, "掛ける a:");
      U.forEach((u) => { const b = el("button", { type: "button", class: "w-chip", "aria-pressed": String(u === a) }, chips, String(u)); b.addEventListener("click", () => { a = u; draw(); }); });
      const k = U.length, gap = Math.min(80, 560 / Math.max(1, k - 1)), x0 = 320 - (gap * (k - 1)) / 2, y1 = 40, y2 = 170;
      svg.setAttribute("viewBox", "0 0 640 215"); clear(svg); arrowDefs(svg, aid, "var(--accent)");
      svgEl("text", { x: 8, y: y1 + 4, "font-size": 12, fill: "var(--muted)" }, svg, "r");
      svgEl("text", { x: 8, y: y2 + 4, "font-size": 12, fill: "var(--muted)" }, svg, "a·r");
      U.forEach((r, i) => {
        const j = U.indexOf((a * r) % n), xa = x0 + i * gap, xb = x0 + j * gap;
        svgEl("path", { d: `M${xa} ${y1 + 16}C${xa} ${(y1 + y2) / 2} ${xb} ${(y1 + y2) / 2} ${xb} ${y2 - 18}`, stroke: "var(--accent)", "stroke-width": 1.4, fill: "none", opacity: 0.8, "marker-end": `url(#${aid})` }, svg);
      });
      U.forEach((r, i) => {
        const x = x0 + i * gap;
        for (const y of [y1, y2]) {
          svgEl("circle", { cx: x, cy: y, r: 14, fill: "var(--panel)", stroke: "var(--line)", "stroke-width": 1.4 }, svg);
          svgEl("text", { x, y: y + 4.5, "text-anchor": "middle", "font-size": 13, class: "mono", fill: "var(--ink)" }, svg, String(r));
        }
      });
      svgEl("text", { x: 320, y: 207, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)" }, svg, `矢印は r ↦ ${a}·r mod ${n}。下の段にも全員がちょうど1回ずつ現れる`);
      const P = U.reduce((x, y) => (x * y) % n, 1);
      const prods = U.map((r) => `${a}·${r}`).join(" · ");
      out.innerHTML = `上の段の積 = ${U.join("·")} ≡ <b>${P}</b>　下の段の積 = ${prods} = ${a}^${k} · (上の段の積)<br>` +
        `並べ替えなので両方の積は等しい → ${a}^${k} · ${P} ≡ ${P} → 両辺に ${P}⁻¹ を掛けて <b>${a}^${k} ≡ 1 (mod ${n})</b>　（実際 ${a}^${k} mod ${n} = ${bpow(a, k, n)}）`;
    }
    ns.addEventListener("change", draw);
    draw();
  };

  // ---------- §3 square-and-multiply ----------
  W.sqm = function (fig) {
    const c = frame(fig, "指数を2進数で読むと、掛け算は約 2·log₂ e 回で済む");
    const ai = intInput(c, "a", 3, 0, 1e6, nextId("sq-a"));
    const ei = intInput(c, "指数 e", 13, 1, 1e15, nextId("sq-e"));
    const ni = intInput(c, "法 n", 7, 2, 1e6, nextId("sq-n"));
    const box = el("div", { class: "tbl" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    function draw() {
      const a = ai.readInt() ?? 0, e = ei.readInt() ?? 1, n = ni.readInt() ?? 2;
      const bits = e.toString(2); let r = 1n; const A = BigInt(a) % BigInt(n), N = BigInt(n); let sq = 0, mu = 0;
      const rows = [];
      for (let i = 0; i < bits.length; i++) {
        if (i > 0) { r = (r * r) % N; sq++; rows.push([bits[i], "2乗する", r, false]); }
        if (bits[i] === "1") { r = i === 0 ? A : (r * A) % N; if (i > 0) mu++; rows.push([bits[i], i === 0 ? "最上位ビット: a から始める" : `a を掛ける`, r, true]); }
      }
      clear(box);
      const t = el("table", { class: "w-table" }, box);
      const hr = el("tr", {}, el("thead", {}, t)); ["読んだビット", "操作", "途中の値"].forEach((h) => el("th", {}, hr, h));
      const tb = el("tbody", {}, t);
      rows.slice(0, 24).forEach(([b, op, v, hot]) => { const tr = el("tr", { class: hot ? "hot" : "" }, tb); el("td", {}, tr, b); el("td", {}, tr, op); el("td", { class: "mono" }, tr, v.toString()); });
      if (rows.length > 24) el("td", { colspan: 3 }, el("tr", {}, tb), `… 残り ${rows.length - 24} 行`);
      out.innerHTML = `e = ${e} = ${bits}₂（${bits.length} ビット）→ ${a}^${e} mod ${n} = <b>${r}</b><br>掛け算 ${sq + mu} 回（2乗 ${sq} + 掛け算 ${mu}）。素朴に掛けると ${e - 1} 回`;
    }
    [ai, ei, ni].forEach((i) => i.addEventListener("input", draw));
    draw();
  };

  // ---------- §4 CRT の表 ----------
  W["crt-grid"] = function (fig) {
    const c = frame(fig, "互いに素なら、余りの組 (x mod n₁, x mod n₂) が x をただ1つに決める");
    const mk = (label, def) => { const l = el("label", {}, c, label); const s = el("select", { "aria-label": label }, l); for (let v = 2; v <= 9; v++) { const o = el("option", { value: v }, s, String(v)); if (v === def) o.selected = true; } return s; };
    const s1 = mk("n₁", 3), s2 = mk("n₂", 5);
    const wrap = el("div", { class: "mt-wrap" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    let pick = [2, 3];
    function draw() {
      const n1 = Number(s1.value), n2 = Number(s2.value), N = n1 * n2;
      pick = [Math.min(pick[0], n1 - 1), Math.min(pick[1], n2 - 1)];
      const cells = Array.from({ length: n1 }, () => Array.from({ length: n2 }, () => []));
      for (let x = 0; x < N; x++) cells[x % n1][x % n2].push(x);
      clear(wrap);
      const g = el("div", { class: "mt" }, wrap);
      g.style.gridTemplateColumns = `4.4em repeat(${n2}, minmax(2.2em, 1fr))`;
      el("div", { class: "mt-h mt-corner" }, g, `mod ${n1} \\ ${n2}`);
      for (let j = 0; j < n2; j++) el("div", { class: "mt-h" }, g, String(j));
      for (let i = 0; i < n1; i++) {
        el("div", { class: "mt-h" }, g, String(i));
        for (let j = 0; j < n2; j++) {
          const L = cells[i][j];
          const b = el("button", { type: "button", class: "mt-c btn" + (L.length === 0 ? " empty" : "") + (L.length > 1 ? " multi" : "") + (i === pick[0] && j === pick[1] ? " sel" : "") }, g, L.join(","));
          b.addEventListener("click", () => { pick = [i, j]; draw(); });
        }
      }
      const d = gcd(n1, n2), L = cells[pick[0]][pick[1]];
      out.innerHTML = `x ≡ ${pick[0]} (mod ${n1}) かつ x ≡ ${pick[1]} (mod ${n2}) の解（0〜${N - 1}）: <b>${L.length ? L.join(", ") : "なし"}</b><br>` +
        (d === 1 ? `<span style="color:var(--good)">gcd(${n1}, ${n2}) = 1：${N} マスすべてに数がちょうど1つずつ入っている</span>`
                 : `<span style="color:var(--hot)">gcd(${n1}, ${n2}) = ${d}：空きマスと、${d} 個入ったマスができる。余りの組から x が決まらない</span>`);
    }
    s1.addEventListener("change", draw); s2.addEventListener("change", draw);
    draw();
  };

  // ---------- §6 誕生日の曲線 ----------
  W["birthday-curve"] = function (fig) {
    const c = frame(fig, "N 通りの値から q 個選ぶと、衝突の確率は q が √N 付近で急に立ち上がる");
    const bl = el("label", {}, c, "値の種類 N");
    const bs = el("select", { "aria-label": "値の種類 N" }, bl);
    [["365", 365], ["2^16", 65536], ["2^32", 2 ** 32], ["2^64", 2 ** 64], ["2^128", 2 ** 128]].forEach(([t, v], i) => { const o = el("option", { value: v }, bs, t + (i === 0 ? "（誕生日）" : "")); if (i === 0) o.selected = true; });
    const ql = el("label", {}, c);
    const qh = el("span", {}, ql, "q / √N = ");
    const qv = el("b", {}, qh, "1.18");
    const qr = el("input", { type: "range", min: 0, max: 300, value: 118, "aria-label": "q の大きさ" }, ql);
    qr.style.width = "180px";
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 230", role: "img", "aria-label": "衝突確率の曲線" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const X = (u) => 56 + (u / 3) * 560, Y = (p) => 194 - p * 160;
    function draw() {
      const N = Number(bs.value), u = Number(qr.value) / 100, q = u * Math.sqrt(N), p = 1 - Math.exp(-(q * q) / (2 * N));
      qv.textContent = u.toFixed(2);
      clear(svg);
      for (const t of [0, 0.25, 0.5, 0.75, 1]) { svgEl("line", { x1: 56, x2: 616, y1: Y(t), y2: Y(t), stroke: "var(--grid)" }, svg); svgEl("text", { x: 48, y: Y(t) + 4, "text-anchor": "end", "font-size": 11, class: "mono", fill: "var(--muted)" }, svg, t * 100 + "%"); }
      for (const t of [0, 1, 2, 3]) svgEl("text", { x: X(t), y: 210, "text-anchor": "middle", "font-size": 11, class: "mono", fill: "var(--muted)" }, svg, t === 0 ? "0" : `${t}√N`);
      let d = ""; for (let i = 0; i <= 120; i++) { const uu = (3 * i) / 120, pp = 1 - Math.exp(-(uu * uu) / 2); d += (i ? "L" : "M") + X(uu).toFixed(1) + " " + Y(pp).toFixed(1); }
      svgEl("path", { d, stroke: "var(--accent)", "stroke-width": 2.4, fill: "none" }, svg);
      let ub = ""; for (let i = 0; i <= 120; i++) { const uu = (3 * i) / 120, pp = Math.min(1, (uu * uu) / 2); ub += (i ? "L" : "M") + X(uu).toFixed(1) + " " + Y(pp).toFixed(1); }
      svgEl("path", { d: ub, stroke: "var(--muted)", "stroke-width": 1.2, "stroke-dasharray": "4 4", fill: "none" }, svg);
      svgEl("line", { x1: X(u), x2: X(u), y1: Y(0), y2: Y(p), stroke: "var(--hot)", "stroke-dasharray": "3 3" }, svg);
      svgEl("circle", { cx: X(u), cy: Y(p), r: 5, fill: "var(--hot)" }, svg);
      svgEl("text", { x: 616, y: 16, "text-anchor": "end", "font-size": 11.5, fill: "var(--muted)" }, svg, "実線: 1 − exp(−q²/2N)　点線: 上界 q²/2N");
      const fmt = (v) => v < 1e6 ? Math.round(v).toLocaleString() : "2^" + Math.log2(v).toFixed(1);
      out.innerHTML = `q ≈ <b>${fmt(q)}</b> 個選ぶと、衝突する確率は約 <b>${(p * 100).toFixed(1)}%</b>（全体 N = ${fmt(N)} のうち ${(q / N * 100 < 0.01 ? "ほんのわずか" : (q / N * 100).toFixed(2) + "%")} しか選んでいない）`;
    }
    bs.addEventListener("change", draw); qr.addEventListener("input", draw);
    draw();
  };

  // ---------- §7 多項式の逆数 vs 無視できる関数 ----------
  W["negl-race"] = function (fig) {
    const c = frame(fig, "1/n^k は、k をどれだけ大きくしても 2^(−√n) にいずれ追い抜かれる");
    const kl = el("label", {}, c);
    const kh = el("span", {}, kl, "多項式の次数 k = ");
    const kv = el("b", {}, kh, "10");
    const kr = el("input", { type: "range", min: 1, max: 80, value: 10, "aria-label": "次数 k" }, kl);
    kr.style.width = "180px";
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 250", role: "img", "aria-label": "確率の小ささの比較" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    function draw() {
      const k = Number(kr.value); kv.textContent = k;
      let cross = 1; for (let t = 1; t < 200; t += 0.01) { if (2 ** (t / 2) > k * t) { cross = t; } }
      for (let t = 200; t > 1; t -= 0.01) { if (2 ** (t / 2) <= k * t) { cross = t; break; } }
      const tmax = Math.max(16, Math.ceil(cross * 1.5)), ymax = k * tmax * 1.8;
      const X = (t) => 56 + (t / tmax) * 560, Y = (v) => 210 - (v / ymax) * 190;
      clear(svg);
      const cid = nextId("nr");
      const cp = svgEl("clipPath", { id: cid }, svgEl("defs", {}, svg)); svgEl("rect", { x: 56, y: 20, width: 560, height: 190 }, cp);
      for (let i = 0; i <= 4; i++) { const v = (ymax * i) / 4; svgEl("line", { x1: 56, x2: 616, y1: Y(v), y2: Y(v), stroke: "var(--grid)" }, svg); svgEl("text", { x: 50, y: Y(v) + 4, "text-anchor": "end", "font-size": 10.5, class: "mono", fill: "var(--muted)" }, svg, Math.round(v)); }
      const step = [2, 4, 5, 10, 20, 25, 50].find((st) => tmax / st <= 6) || 100;
      for (let t = 0; t <= tmax; t += step) svgEl("text", { x: X(t), y: 228, "text-anchor": "middle", "font-size": 10.5, class: "mono", fill: "var(--muted)" }, svg, "n=2^" + t);
      const g = svgEl("g", { "clip-path": `url(#${cid})` }, svg);
      const curve = (f, color, w) => { let d = ""; for (let i = 0; i <= 300; i++) { const t = (tmax * i) / 300; d += (i ? "L" : "M") + X(t).toFixed(1) + " " + Y(Math.min(f(t), ymax * 2)).toFixed(1); } svgEl("path", { d, stroke: color, "stroke-width": w, fill: "none" }, g); };
      curve((t) => k * t, "var(--hot)", 2.4);
      curve((t) => 2 ** (t / 2), "var(--accent)", 2.4);
      svgEl("line", { x1: X(cross), x2: X(cross), y1: 20, y2: 210, stroke: "var(--ink)", "stroke-dasharray": "3 4" }, svg);
      svgEl("text", { x: X(cross) + 6, y: 30, "font-size": 11.5, fill: "var(--ink)" }, svg, `n ≈ 2^${cross.toFixed(1)} から先は逆転しない`);
      svgEl("text", { x: 64, y: 16, "font-size": 11.5, fill: "var(--muted)" }, svg, "縦軸: 確率の小ささ log₂(1/f(n))（上ほど小さい確率）");
      out.innerHTML = `<span style="color:var(--hot)">■</span> 1/n^${k}: 小ささは ${k}·log₂ n ビットで、直線的にしか伸びない<br><span style="color:var(--accent)">■</span> 2^(−√n): 小ささは √n ビットで、指数的に伸びる → n ≈ 2^${cross.toFixed(1)} 以降はずっと 2^(−√n) のほうが小さい`;
    }
    kr.addEventListener("input", draw);
    draw();
  };
  for (const k in W) CE.register(k, W[k]);
})();
