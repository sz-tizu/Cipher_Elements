/* 第3回 共通鍵暗号 の図（AES の計算は assets/w/aes.js） */
(function () {
  "use strict";
  const { svgEl, el, clear, button, arrowDefs, nextId, frame } = CE;
  const A = window.AES;
  const W = {};
  const rb = (n) => crypto.getRandomValues(new Uint8Array(n));
  const h2 = (v) => v.toString(16).padStart(2, "0");

  // ---------- §1 ランダム関数とランダム置換 ----------
  W["prf-table"] = function (fig) {
    const c = frame(fig, "ランダムな関数は出力が重なりうるが、ランダムな置換は重ならない");
    const again = button(c, "引き直す", "primary");
    const grid = el("div", { class: "cols" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    function table(parent, title, vals) {
      const box = el("div", {}, parent);
      el("h4", {}, box, title);
      const t = el("table", { class: "w-table" }, box);
      const hr = el("tr", {}, el("thead", {}, t)); el("th", {}, hr, "入力 x"); el("th", {}, hr, "出力 f(x)");
      const tb = el("tbody", {}, t);
      const count = {}; vals.forEach((v) => (count[v] = (count[v] || 0) + 1));
      vals.forEach((v, i) => { const tr = el("tr", { class: count[v] > 1 ? "hot" : "" }, tb); el("td", { class: "mono" }, tr, i.toString(2).padStart(3, "0")); el("td", { class: "mono" }, tr, v.toString(2).padStart(3, "0") + (count[v] > 1 ? "  ← 重なり" : "")); });
      return Object.values(count).some((x) => x > 1);
    }
    function draw() {
      clear(grid);
      const f = Array.from(rb(8), (v) => v & 7);
      const p = [0, 1, 2, 3, 4, 5, 6, 7]; for (let i = 7; i > 0; i--) { const j = rb(1)[0] % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
      const col = table(grid, "ランダムな関数（各行を独立に選ぶ）", f);
      table(grid, "ランダムな置換（並べ替え）", p);
      out.innerHTML = `3 ビット → 3 ビットの関数は 8^8 ≈ 1677 万通り、置換は 8! = 40320 通り。<br>ランダムな関数に重なりが<b>${col ? "出た" : "出なかった"}</b>。8 行すべてが異なる確率は 8!/8^8 ≈ 0.24% しかない。` +
        `<br>入力が 128 ビットなら、重なりが出始めるのは約 2^64 回問い合わせてから（第1回の誕生日の確率）。それより少なければ、PRF と PRP はほぼ見分けられない。`;
    }
    again.addEventListener("click", draw);
    draw();
  };

  // ---------- §1 1つの鍵で暗号化してよい量 ----------
  W["data-limit"] = function (fig) {
    const c = frame(fig, "ブロック長 n の暗号は、同じ鍵で約 2^(n/2) ブロックを超えると危うくなる");
    const nl = el("label", {}, c, "ブロック長");
    const ns = el("select", { "aria-label": "ブロック長" }, nl);
    [["64 ビット（DES、3DES、Blowfish）", 64], ["128 ビット（AES）", 128]].forEach(([t, v], i) => { const o = el("option", { value: v }, ns, t); if (i === 0) o.selected = true; });
    const ql = el("label", {}, c); const qh = el("span", {}, ql, "暗号化したブロック数 q = 2^"); const qv = el("b", {}, qh, "32");
    const qr = el("input", { type: "range", min: 0, max: 70, value: 32, "aria-label": "ブロック数" }, ql); qr.style.width = "200px";
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 120", role: "img", "aria-label": "見分けられる確率の上限" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    function fmt(bytes) { let i = 0; while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; } return bytes.toFixed(bytes < 10 ? 1 : 0) + " " + units[i]; }
    function draw() {
      const n = Number(ns.value), lq = Number(qr.value); qv.textContent = lq;
      const ladv = Math.min(0, 2 * lq - (n + 1)), adv = Math.pow(2, ladv);
      clear(svg);
      const X = (v) => 30 + ((v + 64) / 64) * 580;
      svgEl("rect", { x: 30, y: 40, width: 580, height: 22, rx: 6, fill: "var(--bg)", stroke: "var(--line)" }, svg);
      svgEl("rect", { x: X(-64), y: 40, width: X(-32) - X(-64), height: 22, rx: 6, fill: "var(--good)", opacity: 0.25 }, svg);
      svgEl("rect", { x: X(-32), y: 40, width: X(-10) - X(-32), height: 22, fill: "var(--hot)", opacity: 0.15 }, svg);
      svgEl("rect", { x: X(-10), y: 40, width: X(0) - X(-10), height: 22, rx: 6, fill: "var(--hot)", opacity: 0.4 }, svg);
      for (const t of [-64, -48, -32, -16, 0]) svgEl("text", { x: X(t), y: 82, "text-anchor": "middle", "font-size": 11, class: "mono", fill: "var(--muted)" }, svg, t === 0 ? "1" : "2^" + t);
      svgEl("text", { x: X(-48), y: 30, "text-anchor": "middle", "font-size": 11.5, fill: "var(--good)" }, svg, "十分に安全");
      svgEl("text", { x: X(-21), y: 30, "text-anchor": "middle", "font-size": 11.5, fill: "var(--hot)" }, svg, "鍵を替える目安を超える");
      svgEl("text", { x: X(-5), y: 30, "text-anchor": "middle", "font-size": 11.5, fill: "var(--hot)" }, svg, "危険");
      const x = X(Math.max(-64, ladv));
      svgEl("path", { d: `M${x} 36V66`, stroke: "var(--ink)", "stroke-width": 3 }, svg);
      svgEl("text", { x: 320, y: 108, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)" }, svg, "横軸: 攻撃者が「本物のランダム置換ではない」と見分けられる確率の上限 q²/2^(n+1)");
      out.innerHTML = `${n} ビットのブロックを 2^${lq} 個 ＝ <b>${fmt(Math.pow(2, lq) * (n / 8))}</b> 暗号化すると、見分けられる確率の上限は <b>${ladv <= -64 ? "2^" + ladv : adv < 0.001 ? "2^" + ladv : adv.toFixed(3)}</b>` +
        (n === 64 && lq >= 32 ? `<br><span style="color:var(--hot)">64 ビット暗号では、数十 GB で危険域に入る。Sweet32 攻撃は、HTTPS の長時間接続で 3DES のこの性質を突いた</span>` : n === 128 && lq <= 48 ? `<br><span style="color:var(--good)">AES なら、2^48 ブロック（4 PB）でも上限は 2^−33 程度</span>` : "");
    }
    ns.addEventListener("change", draw); qr.addEventListener("input", draw);
    draw();
  };

  // ---------- §2 Feistel 構造 ----------
  W.feistel = function (fig) {
    const c = frame(fig, "F が逆算できない関数でも、Feistel 構造なら必ず復号できる");
    const mk = (label, val, id) => { const l = el("label", { for: id }, c, label); const i = el("input", { type: "text", value: val, id, "aria-label": label }, l); return i; };
    const pi = mk("平文（16進4桁）", "c0de", nextId("fe-p"));
    const ki = mk("鍵（16進8桁）", "1f2e3d4c", nextId("fe-k"));
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 330", role: "img", "aria-label": "Feistel 構造の4ラウンド" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("fe");
    // 下位2ビットを捨てるので単射でない（逆算できない）ラウンド関数
    const F = (x, k) => (((x ^ k) * 157 + 59) & 0xff) & 0xfc;
    function draw() {
      const p = parseInt(pi.value, 16) & 0xffff, key = parseInt(ki.value, 16) >>> 0;
      const ks = [0, 1, 2, 3].map((i) => (key >>> (8 * (3 - i))) & 0xff);
      let L = p >> 8, R = p & 0xff; const rows = [[L, R]];
      for (let i = 0; i < 4; i++) { [L, R] = [R, L ^ F(R, ks[i])]; rows.push([L, R]); }
      const ct = (L << 8) | R;
      let dL = ct >> 8, dR = ct & 0xff;
      for (let i = 3; i >= 0; i--) { [dL, dR] = [dR ^ F(dL, ks[i]), dL]; }
      const dec = (dL << 8) | dR;
      clear(svg); arrowDefs(svg, aid, "var(--muted)");
      const xL = 150, xR = 470, y0 = 26, dy = 74;
      svg.setAttribute("viewBox", `0 0 640 ${y0 + 4 * dy + 44}`);
      rows.forEach(([l, r], i) => {
        const y = y0 + i * dy;
        for (const [x, v] of [[xL, l], [xR, r]]) {
          svgEl("rect", { x: x - 40, y: y - 14, width: 80, height: 28, rx: 6, fill: "var(--panel)", stroke: "var(--line)" }, svg);
          svgEl("text", { x, y: y + 5, "text-anchor": "middle", "font-size": 14, class: "mono", fill: "var(--ink)" }, svg, h2(v));
        }
        svgEl("text", { x: 20, y: y + 5, "font-size": 12, fill: "var(--muted)" }, svg, i === 0 ? "入力" : i === 4 ? "出力" : `${i} 回後`);
        if (i < 4) {
          const yf = y + 30, yc = y + 44, yn = y + dy - 14;
          // 上段: R を F に通して L に XOR する
          svgEl("rect", { x: 280, y: yf - 11, width: 80, height: 22, rx: 6, fill: "var(--accent-soft)", stroke: "var(--accent)" }, svg);
          svgEl("text", { x: 320, y: yf + 4.5, "text-anchor": "middle", "font-size": 12, fill: "var(--ink)" }, svg, `F(·, k${i + 1})`);
          svgEl("path", { d: `M${xR} ${y + 14}V${yf}H362`, stroke: "var(--accent)", fill: "none", "marker-end": `url(#${aid})` }, svg);
          svgEl("path", { d: `M278 ${yf}H${xL + 11}`, stroke: "var(--accent)", fill: "none", "marker-end": `url(#${aid})` }, svg);
          svgEl("path", { d: `M${xL} ${y + 14}V${yf - 10}`, stroke: "var(--muted)", fill: "none" }, svg);
          svgEl("circle", { cx: xL, cy: yf, r: 9, fill: "var(--panel)", stroke: "var(--hot)" }, svg);
          svgEl("text", { x: xL, y: yf + 4.5, "text-anchor": "middle", "font-size": 14, fill: "var(--hot)" }, svg, "⊕");
          // 下段: 左右を入れ替える（XOR の結果は右へ、R はそのまま左へ）
          svgEl("path", { d: `M${xL} ${yf + 9}V${yc}L${xR - 24} ${yn}`, stroke: "var(--hot)", fill: "none", "marker-end": `url(#${aid})` }, svg);
          svgEl("path", { d: `M${xR} ${yf}V${yc}L${xL + 24} ${yn}`, stroke: "var(--muted)", fill: "none", "stroke-dasharray": "4 3", "marker-end": `url(#${aid})` }, svg);
        }
      });
      svgEl("text", { x: 600, y: y0 + 4 * dy + 38, "text-anchor": "end", "font-size": 11.5, fill: "var(--muted)" }, svg, "実線: L ⊕ F(R) が次の右半分へ　点線: R がそのまま次の左半分へ");
      // F が単射でない例
      let col = null; for (let a = 0; a < 256 && !col; a++) for (let b = a + 1; b < 256; b++) if (F(a, ks[0]) === F(b, ks[0])) { col = [a, b]; break; }
      out.innerHTML = `暗号文 <b>${ct.toString(16).padStart(4, "0")}</b>　→　同じ F を逆の順に使って復号: <b>${dec.toString(16).padStart(4, "0")}</b> ${dec === p ? '<span style="color:var(--good)">元に戻った ✓</span>' : ""}` +
        `<br>F 自体は逆算できない: F(${h2(col[0])}, k1) = F(${h2(col[1])}, k1) = ${h2(F(col[0], ks[0]))}（違う入力が同じ出力になる）` +
        `<br>各ラウンドは「右半分をそのまま左へ」「左半分に F(右半分) を XOR して右へ」。右半分が残るので、F を再計算して XOR を外せば戻せる。`;
    }
    pi.addEventListener("input", draw); ki.addEventListener("input", draw);
    draw();
  };

  // ---------- §3 AES のラウンドを覗く ----------
  const STEP_NOTE = {
    "入力": "16 バイトの平文を、4×4 のマス目に縦（列）の順に並べる。",
    "AddRoundKey": "ラウンド鍵と XOR。鍵が混ざるのはこの操作だけ。",
    "SubBytes": "各バイトを S-box で置き換える。GF(2^8) の逆元に基づく非線形な変換で、線形な解析を壊す（混乱）。",
    "ShiftRows": "2 行目を 1、3 行目を 2、4 行目を 3 バイト左へ回す。列の中身を別の列へ散らす。",
    "MixColumns": "各列の4バイトを GF(2^8) の行列で混ぜる。1 バイトの違いが列全体の4バイトに広がる（拡散）。",
  };
  W["aes-round"] = function (fig) {
    const c = frame(fig, "AES-128 の 10 ラウンドを、操作ごとに追う");
    const pl = el("label", {}, c, "平文（16進32桁）"); const pi = el("input", { type: "text", value: "3243f6a8885a308d313198a2e0370734", "aria-label": "平文" }, pl); pi.style.width = "21em";
    const kl = el("label", {}, c, "鍵（16進32桁）"); const ki = el("input", { type: "text", value: "2b7e151628aed2a6abf7158809cf4f3c", "aria-label": "鍵" }, kl); ki.style.width = "21em";
    const nav = el("div", { class: "w-controls" }, fig);
    const back = button(nav, "戻る"), next = button(nav, "次へ", "primary"), last = button(nav, "最後へ"), first = button(nav, "最初へ");
    const stage = el("div", { class: "aes-stage" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    let tr = [], k = 0;
    function build() {
      const p = A.fromHex(pi.value), key = A.fromHex(ki.value);
      if (p.length !== 16 || key.length !== 16) { cap.textContent = "平文と鍵は、それぞれ 16 進 32 桁（16 バイト）で入れてください。"; tr = []; clear(stage); return; }
      tr = A.encryptTrace(p, key).trace; k = Math.min(k, tr.length - 1); draw();
    }
    function grid(parent, st, prev, label) {
      const box = el("div", { class: "aes-box" }, parent);
      el("div", { class: "aes-label" }, box, label);
      const g = el("div", { class: "aes-grid" }, box);
      for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
        const i = r + 4 * col, changed = prev && prev[i] !== st[i];
        el("div", { class: "aes-cell" + (changed ? " ch" : "") }, g, h2(st[i]));
      }
    }
    function draw() {
      if (!tr.length) return;
      clear(stage);
      const cur = tr[k], prev = k ? tr[k - 1] : null;
      grid(stage, prev ? prev.state : cur.state, null, prev ? `前（${prev.round ? "ラウンド " + prev.round + " " : ""}${prev.step}）` : "—");
      el("div", { class: "aes-arrow" }, stage, "→");
      grid(stage, cur.state, prev ? prev.state : null, `ラウンド ${cur.round}: ${cur.step}`);
      const done = k === tr.length - 1;
      cap.innerHTML = `<b>手順 ${k + 1} / ${tr.length}</b>　${STEP_NOTE[cur.step]}` + (cur.round === 10 && cur.step === "ShiftRows" ? "　最終ラウンドには MixColumns がない。" : "") +
        (done ? `<br>暗号文: <span class="mono">${A.hex(cur.state)}</span>` + (A.hex(cur.state) === "3925841d02dc09fbdc118597196a0b32" ? "（FIPS 197 付録 B の値と一致）" : "") : "") +
        "<br>色の付いたマスは、直前の操作で値が変わったバイト。";
      back.disabled = first.disabled = k === 0; next.disabled = last.disabled = done;
    }
    back.addEventListener("click", () => { k--; draw(); }); next.addEventListener("click", () => { k++; draw(); });
    first.addEventListener("click", () => { k = 0; draw(); }); last.addEventListener("click", () => { k = tr.length - 1; draw(); });
    pi.addEventListener("input", build); ki.addEventListener("input", build);
    build();
  };

  // ---------- §3 雪崩効果 ----------
  W["aes-avalanche"] = function (fig) {
    const c = frame(fig, "平文の1ビットを変えると、2 ラウンドで約半分のビットが変わる");
    const bl = el("label", {}, c); const bh = el("span", {}, bl, "反転するビットの位置 = "); const bv = el("b", {}, bh, "0");
    const br = el("input", { type: "range", min: 0, max: 127, value: 0, "aria-label": "ビット位置" }, bl); br.style.width = "200px";
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 220", role: "img", "aria-label": "ラウンドごとの差分ビット数" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const key = A.fromHex("2b7e151628aed2a6abf7158809cf4f3c"), p = A.fromHex("3243f6a8885a308d313198a2e0370734");
    const pop = (x) => { let n = 0; while (x) { n += x & 1; x >>= 1; } return n; };
    function afterRounds(block) { return A.encryptTrace(block, key).trace.filter((t) => t.step === "AddRoundKey").map((t) => t.state); }
    function draw() {
      const bit = Number(br.value); bv.textContent = bit;
      const q = Uint8Array.from(p); q[bit >> 3] ^= 0x80 >> (bit & 7);
      const a = afterRounds(p), b = afterRounds(q);
      const diff = a.map((s, r) => s.reduce((acc, v, i) => acc + pop(v ^ b[r][i]), 0));
      clear(svg);
      const X = (i) => 70 + i * 52, Y = (v) => 180 - (v / 128) * 160;
      for (const t of [0, 32, 64, 96, 128]) { svgEl("line", { x1: 60, x2: 630, y1: Y(t), y2: Y(t), stroke: "var(--grid)" }, svg); svgEl("text", { x: 54, y: Y(t) + 4, "text-anchor": "end", "font-size": 11, class: "mono", fill: "var(--muted)" }, svg, String(t)); }
      svgEl("line", { x1: 60, x2: 630, y1: Y(64), y2: Y(64), stroke: "var(--good)", "stroke-dasharray": "5 4" }, svg);
      svgEl("text", { x: 628, y: Y(64) - 6, "text-anchor": "end", "font-size": 11, fill: "var(--good)" }, svg, "理想: 128 ビット中 64");
      diff.forEach((d, r) => {
        svgEl("rect", { x: X(r) + 8, y: Y(d), width: 34, height: 180 - Y(d), rx: 3, fill: "var(--accent)", opacity: 0.8 }, svg);
        svgEl("text", { x: X(r) + 25, y: Y(d) - 5, "text-anchor": "middle", "font-size": 11, class: "mono", fill: "var(--ink)" }, svg, String(d));
        svgEl("text", { x: X(r) + 25, y: 198, "text-anchor": "middle", "font-size": 11, class: "mono", fill: "var(--muted)" }, svg, r === 0 ? "0" : "R" + r);
      });
      svgEl("text", { x: 345, y: 216, "text-anchor": "middle", "font-size": 11.5, fill: "var(--muted)" }, svg, "各ラウンドの AddRoundKey 後に、2つの状態で異なるビットの数");
      out.innerHTML = `ラウンド 0 では 1 ビットだけ違う。ラウンド 1 で S-box と MixColumns により1列（最大 32 ビット）に広がり、ラウンド 2 で全体に広がる。最終的な差は <b>${diff[10]}</b> ビット。`;
    }
    br.addEventListener("input", draw);
    draw();
  };

  // ---------- §4 運用モードの構造 ----------
  W["modes-diagram"] = function (fig) {
    const c = frame(fig, "運用モードは、ブロック暗号 E を何個どうつなぐかの設計");
    const ml = el("label", {}, c, "モード"); const ms = el("select", { "aria-label": "モード" }, ml);
    [["ECB", "ecb"], ["CBC", "cbc"], ["CTR", "ctr"]].forEach(([t, v], i) => { const o = el("option", { value: v }, ms, t); if (i === 1) o.selected = true; });
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 270", role: "img", "aria-label": "運用モードの構造" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("md");
    const NOTE = {
      ecb: "各ブロックを独立に E で暗号化する。同じ平文ブロックは同じ暗号文ブロックになるので、IND-CPA 安全ではない（第2回 §4.4）。",
      cbc: "前の暗号文ブロックを、次の平文ブロックに XOR してから暗号化する。最初は IV（毎回、予測できない乱数）を使う。暗号化は順番にしかできない。",
      ctr: "ノンスとカウンタを E に通して鍵の列を作り、平文と XOR する（第2回の疑似ワンタイムパッドを、入力を変えながら繰り返す形）。E の逆関数は要らず、並列に計算できる。",
    };
    function box(x, y, w, h, t, fill) { svgEl("rect", { x, y, width: w, height: h, rx: 8, fill: fill || "var(--panel)", stroke: fill ? "var(--accent)" : "var(--line)", "stroke-width": 1.3 }, svg); svgEl("text", { x: x + w / 2, y: y + h / 2 + 5, "text-anchor": "middle", "font-size": 13, class: "mono", fill: "var(--ink)" }, svg, t); }
    function xorAt(x, y) { svgEl("circle", { cx: x, cy: y, r: 10, fill: "var(--panel)", stroke: "var(--hot)", "stroke-width": 1.4 }, svg); svgEl("text", { x, y: y + 5, "text-anchor": "middle", "font-size": 15, fill: "var(--hot)" }, svg, "⊕"); }
    const line = (d, dash) => svgEl("path", { d, stroke: "var(--muted)", "stroke-width": 1.3, fill: "none", "stroke-dasharray": dash || "", "marker-end": `url(#${aid})` }, svg);
    function draw() {
      const m = ms.value; clear(svg); arrowDefs(svg, aid, "var(--muted)");
      const xs = [170, 340, 510];
      if (m === "cbc") box(20, 20, 80, 30, "IV");
      if (m === "ctr") xs.forEach((x, i) => box(x - 60, 20, 120, 30, `N ‖ ${i}`));
      xs.forEach((x, i) => {
        if (m !== "ctr") box(x - 40, 20, 80, 30, `P${i + 1}`);
        if (m === "cbc") { xorAt(x, 82); line(`M${x} 50V70`); line(`M${x} 92V118`); if (i === 0) line(`M100 35H130Q150 35 150 60V82H${x - 12}`); }
        if (m === "ecb") line(`M${x} 50V118`);
        if (m === "ctr") line(`M${x} 50V118`);
        box(x - 40, 120, 80, 36, "E_k", "var(--accent-soft)");
        if (m === "ctr") { line(`M${x} 156V186`); xorAt(x, 198); box(x + 30, 183, 60, 30, `P${i + 1}`); line(`M${x + 30} 198H${x + 12}`); line(`M${x} 208V226`); box(x - 40, 228, 80, 30, `C${i + 1}`); }
        else { line(`M${x} 156V196`); box(x - 40, 198, 80, 30, `C${i + 1}`); }
        if (m === "cbc" && i < 2) line(`M${x + 40} 213H${x + 85}Q${x + 100} 213 ${x + 100} 198V95Q${x + 100} 82 ${xs[i + 1] - 12} 82`, "4 3");
      });
      out.textContent = NOTE[m];
    }
    ms.addEventListener("change", draw);
    draw();
  };

  // ---------- §4 ECB の画像 ----------
  W["ecb-image"] = function (fig) {
    const c = frame(fig, "ECB では、同じ平文ブロックが同じ暗号文ブロックになり、模様が透けて見える");
    const again = button(c, "鍵と IV を引き直す", "primary");
    const row = el("div", { class: "img-row" }, fig);
    const out = el("p", { class: "w-cap" }, fig);
    const Wd = 256, Ht = 128;
    // 1 画素 1 バイトの画像（0: 背景, 1: 図形, 2: 文字）
    const img = new Uint8Array(Wd * Ht);
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
      let v = 0;
      if ((x - 70) ** 2 + (y - 64) ** 2 < 46 ** 2) v = 1;
      if (x > 140 && x < 230 && ((y > 26 && y < 44) || (y > 56 && y < 74) || (y > 86 && y < 104))) v = 2;
      img[y * Wd + x] = v * 85 + 40;
    }
    const pal = [[244, 245, 249], [51, 67, 181], [191, 84, 24]];
    function canvas(title) {
      const box = el("figure", { class: "img-box" }, row);
      const cv = el("canvas", { width: Wd, height: Ht }, box); el("figcaption", {}, box, title);
      return cv.getContext("2d");
    }
    function paint(ctx, bytes, plain) {
      const d = ctx.createImageData(Wd, Ht);
      for (let i = 0; i < bytes.length; i++) {
        let r, g, b;
        if (plain) [r, g, b] = pal[Math.round((bytes[i] - 40) / 85)];
        else { const v = bytes[i]; r = (v * 7) & 255; g = (v * 13 + 60) & 255; b = (v * 29 + 120) & 255; }
        d.data.set([r, g, b, 255], i * 4);
      }
      ctx.putImageData(d, 0, 0);
    }
    const c0 = canvas("平文の画像"), c1 = canvas("ECB で暗号化"), c2 = canvas("CBC で暗号化（ランダムな IV）");
    function draw() {
      const rk = A.expandKey(rb(16));
      paint(c0, img, true);
      paint(c1, A.ecb(img, rk), false);
      paint(c2, A.cbcEnc(img, rk, rb(16)), false);
      out.textContent = "画像は 1 画素 1 バイトで、横 16 画素が AES の 1 ブロック。背景のように同じ色が続く場所は同じ平文ブロックになるので、ECB では同じ暗号文ブロックが並び、形がそのまま浮かぶ。CBC は前のブロックの暗号文が混ざるので、同じ平文ブロックでも毎回違う暗号文になる。";
    }
    again.addEventListener("click", draw);
    draw();
  };

  // ---------- §4 CBC のビット反転 ----------
  W["cbc-flip"] = function (fig) {
    const c = frame(fig, "CBC は改ざんを検知しない: 前のブロックをいじると、次のブロックを狙いどおりに書き換えられる");
    const tl = el("label", {}, c, "2 ブロック目をこう書き換えたい（16 文字）");
    const ti = el("input", { type: "text", value: "role=admin;id=42", maxlength: 16, "aria-label": "書き換え後の文字列" }, tl); ti.style.width = "13em";
    const again = button(c, "鍵と IV を引き直す");
    const out = el("div", { class: "w-out cbc" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const enc = new TextEncoder(), dec = new TextDecoder("latin1");
    const P = enc.encode("msg=hello-world;role=guest;id=42");
    let rk, iv, C;
    function reset() { rk = A.expandKey(rb(16)); iv = rb(16); C = A.cbcEnc(P, rk, iv); draw(); }
    const show = (b) => Array.from(b, (v) => (v >= 32 && v < 127 ? String.fromCharCode(v) : "·")).join("");
    function draw() {
      const want = enc.encode(ti.value.padEnd(16, " ").slice(0, 16));
      const delta = want.map((v, i) => v ^ P[16 + i]);
      const C2 = Uint8Array.from(C); for (let i = 0; i < 16; i++) C2[i] ^= delta[i];
      const D = A.cbcDec(C2, rk, iv);
      const changed = Array.from(delta).filter((v) => v).length;
      out.innerHTML = `<span class="lbl">元の平文</span>${show(P.subarray(0, 16))} | ${show(P.subarray(16))}<br>` +
        `<span class="lbl">攻撃者の操作</span>暗号文の 1 ブロック目の ${changed} バイトに、(元の文字 ⊕ 狙いの文字) を XOR する（鍵は使わない）<br>` +
        `<span class="lbl">受信者の復号</span><span style="color:var(--hot)">${show(D.subarray(0, 16))}</span> | <b>${show(D.subarray(16))}</b>`;
      cap.innerHTML = "CBC の復号では P₂ = Dec(C₂) ⊕ C₁ なので、C₁ を XOR で変えると P₂ も同じだけ変わる。代わりに 1 ブロック目は壊れる（赤）が、アプリがそれを検査しなければ通ってしまう。暗号化は秘匿性しか守らない。改ざんを防ぐには第4回の MAC や AEAD が要る。";
    }
    ti.addEventListener("input", draw); again.addEventListener("click", reset);
    reset();
  };

  for (const k in W) CE.register(k, W[k]);
})();
