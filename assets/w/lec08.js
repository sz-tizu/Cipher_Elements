/* 第8回 これからの暗号: 量子・AI・発展的な道具 の図 */
(function () {
  "use strict";
  const { svgEl, el, clear, button, nextId, frame, intInput } = CE;
  const W = {};
  const enc = new TextEncoder();

  // ---------- §1 量子計算機: 必要な量子ビットの見積もりと、実機の規模 ----------
  W["qubit-gap"] = function (fig) {
    const c = frame(fig, "RSA-2048 を破るのに必要な物理量子ビット数の見積もりと、実機の最大規模（対数目盛）");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 330", role: "img", "aria-label": "量子ビット数の推移" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const est = [
      [2012, 1e9, "約10億（Fowler ほか）"],
      [2019, 2e7, "2,000万（Gidney・Ekerå）"],
      [2025, 1e6, "100万未満（Gidney）"],
      [2026, 1e5, "10万未満（Iceberg Quantum の主張・未検証）"],
    ];
    const hw = [
      [2017, 50, "IBM 50"], [2019, 53, "Google Sycamore 53"], [2021, 127, "IBM Eagle 127"],
      [2022, 433, "IBM Osprey 433"], [2023, 1121, "IBM Condor 1,121"], [2025, 6100, "Caltech 中性原子 6,100（配列のみ）"],
    ];
    const X = (y) => 70 + (y - 2011) * 33, Y = (v) => 290 - (Math.log10(v) - 1) * 31;
    for (let e = 1; e <= 9; e++) {
      svgEl("path", { d: `M70 ${Y(10 ** e)}H620`, stroke: "var(--line)", "stroke-width": 1 }, svg);
      svgEl("text", { x: 62, y: Y(10 ** e) + 4, "text-anchor": "end", "font-size": 11, fill: "var(--muted)" }, svg, "10^" + e);
    }
    for (let y = 2012; y <= 2026; y += 2) svgEl("text", { x: X(y), y: 308, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" }, svg, String(y));
    const pts = (arr) => arr.map(([y, v]) => `${X(y)},${Y(v)}`).join(" ");
    svgEl("polyline", { points: pts(est), fill: "none", stroke: "var(--hot)", "stroke-width": 2.2 }, svg);
    svgEl("polyline", { points: pts(hw), fill: "none", stroke: "var(--accent)", "stroke-width": 2.2 }, svg);
    const all = est.map((d) => [...d, "est"]).concat(hw.map((d) => [...d, "hw"]));
    all.forEach(([y, v, t, k]) => {
      const dot = svgEl("circle", { cx: X(y), cy: Y(v), r: 6, fill: k === "est" ? "var(--hot)" : "var(--accent)", tabindex: 0, style: "cursor:pointer" }, svg);
      const show = () => { out.innerHTML = `<b>${y}年</b>: ${t}<br>` + (k === "est" ? "必要な物理量子ビット数の見積もり。誤り率 0.1% 程度の素子と誤り訂正を仮定している" : "実機の物理量子ビット数。誤り訂正された論理量子ビットではなく、品質（誤り率、接続、制御）も見積もりの前提に届いていない"); };
      dot.addEventListener("mouseenter", show); dot.addEventListener("focus", show); dot.addEventListener("click", show);
    });
    svgEl("text", { x: 440, y: 40, "font-size": 12.5, "font-weight": 700, fill: "var(--hot)" }, svg, "必要な規模の見積もり");
    svgEl("text", { x: 440, y: 270, "font-size": 12.5, "font-weight": 700, fill: "var(--accent)" }, svg, "実機の最大規模");
    out.innerHTML = "点にカーソルを当てるか、タップすると説明が出ます。上の線（必要量）が下がり、下の線（実機）が上がっていて、2019 年に約 5.5 桁あった差は、2026 年の主張どおりなら約 1〜2 桁に見えます。ただし実機の数は「品質を問わない個数」なので、そのまま比べると差を小さく見積もりすぎます。";
  };

  // ---------- §2 Mosca の不等式 ----------
  W["mosca"] = function (fig) {
    const c = frame(fig, "Mosca の不等式: x + y > z なら、もう遅い");
    const mk = (label, v, max) => { const l = el("label", {}, c); const s = el("span", {}, l); const i = el("input", { type: "range", min: 0, max, value: v, step: 1 }, l); return { i, s, label }; };
    const xs = mk("x", 10, 30), ys = mk("y", 7, 20), zs = mk("z", 12, 30);
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 170", role: "img", "aria-label": "Mosca の不等式" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const presets = el("div", { class: "w-chips" }, fig);
    const P = [["Web の閲覧履歴", 1, 3], ["社内システムのログ", 5, 7], ["金融取引・顧客情報", 10, 7], ["医療記録・年金", 50, 8], ["国家機密", 25, 10]];
    for (const [name, x, y] of P) { const b = button(presets, name); b.classList.add("w-chip"); b.addEventListener("click", () => { xs.i.value = Math.min(30, x); ys.i.value = y; draw(); }); }
    function draw() {
      const x = +xs.i.value, y = +ys.i.value, z = +zs.i.value, now = 2026;
      xs.s.innerHTML = `x 守る期間 <b>${x}</b> 年`; ys.s.innerHTML = `y 移行の期間 <b>${y}</b> 年`; zs.s.innerHTML = `z 量子計算機まで <b>${z}</b> 年`;
      clear(svg);
      const S = 12, X0 = 30, yr = (t) => X0 + t * S;
      svgEl("rect", { x: yr(0), y: 30, width: y * S, height: 30, rx: 4, fill: "var(--accent)", opacity: 0.25, stroke: "var(--accent)" }, svg);
      svgEl("text", { x: yr(0) + 4, y: 50, "font-size": 11.5, fill: "var(--ink)" }, svg, `移行 ${y}年`);
      svgEl("rect", { x: yr(y), y: 30, width: x * S, height: 30, rx: 4, fill: "var(--good-soft)", stroke: "var(--good)" }, svg);
      svgEl("text", { x: yr(y) + 4, y: 50, "font-size": 11.5, fill: "var(--ink)" }, svg, `保護 ${x}年`);
      svgEl("rect", { x: yr(0), y: 80, width: z * S, height: 30, rx: 4, fill: "var(--panel)", stroke: "var(--line)" }, svg);
      svgEl("text", { x: yr(0) + 4, y: 100, "font-size": 11.5, fill: "var(--muted)" }, svg, `量子計算機まで ${z}年`);
      svgEl("path", { d: `M${yr(z)} 20V125`, stroke: "var(--hot)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
      svgEl("text", { x: yr(z), y: 140, "text-anchor": "middle", "font-size": 12, fill: "var(--hot)", "font-weight": 700 }, svg, `${now + z}年`);
      if (x + y > z) svgEl("rect", { x: yr(z), y: 30, width: (x + y - z) * S, height: 30, fill: "var(--hot)", opacity: 0.35 }, svg);
      for (let t = 0; t <= 50; t += 10) svgEl("text", { x: yr(t), y: 162, "text-anchor": "middle", "font-size": 10.5, fill: "var(--muted)" }, svg, String(now + t));
      out.innerHTML = x + y > z
        ? `<b style="color:var(--hot)">危険</b>: ${x}+${y} = ${x + y} 年 > ${z} 年。移行の途中や完了直後に送ったデータが、守るべき期間のうち <b>${x + y - z} 年分</b>、量子計算機に読まれうる。今録画されている通信は、すでにこの状況にある`
        : `<b style="color:var(--good)">間に合う</b>: ${x}+${y} = ${x + y} 年 ≤ ${z} 年。ただし z の見積もりはここ数年で縮み続けている`;
    }
    [xs, ys, zs].forEach((o) => o.i.addEventListener("input", draw));
    draw();
  };

  // ---------- §3 大きさの比較 ----------
  W["pq-sizes"] = function (fig) {
    const c = frame(fig, "耐量子暗号は「大きい」: 公開鍵・暗号文・署名のバイト数");
    const sel = el("select", { "aria-label": "比べるもの" }, el("label", {}, c, "比べるもの"));
    const groups = {
      kem: ["鍵交換（クライアントが送る量 / サーバが返す量）", [["X25519", 32, 32], ["ML-KEM-512", 800, 768], ["ML-KEM-768", 1184, 1088], ["X25519MLKEM768（ハイブリッド）", 1216, 1120], ["ML-KEM-1024", 1568, 1568]]],
      sig: ["署名（公開鍵 / 署名）", [["Ed25519", 32, 64], ["ECDSA P-256", 65, 72], ["RSA-2048", 256, 256], ["FN-DSA-512", 897, 666], ["ML-DSA-44", 1312, 2420], ["ML-DSA-65", 1952, 3309], ["SLH-DSA-128s", 32, 7856], ["SLH-DSA-128f", 32, 17088]]],
      tls: ["TLS の認証に載るバイト数（公開鍵 2 個 + 署名 5 個の概算）", [["ECDSA P-256", 2 * 65 + 5 * 72], ["RSA-2048", 2 * 256 + 5 * 256], ["FN-DSA-512", 2 * 897 + 5 * 666], ["ML-DSA-44", 2 * 1312 + 5 * 2420], ["ML-DSA-65", 2 * 1952 + 5 * 3309]]],
    };
    for (const k in groups) el("option", { value: k }, sel, groups[k][0]);
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 300", role: "img", "aria-label": "サイズの比較" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    function draw() {
      clear(svg);
      const [, rows] = groups[sel.value];
      const max = Math.max(...rows.map((r) => (r[2] !== undefined ? Math.max(r[1], r[2]) : r[1])));
      const rh = Math.min(34, 280 / rows.length);
      svg.setAttribute("viewBox", `0 0 640 ${20 + rows.length * rh}`);
      rows.forEach((r, i) => {
        const y = 10 + i * rh;
        svgEl("text", { x: 200, y: y + rh / 2 + 4, "text-anchor": "end", "font-size": 11.5, fill: "var(--ink)" }, svg, r[0]);
        const vals = r[2] !== undefined ? [r[1], r[2]] : [r[1]];
        vals.forEach((v, j) => {
          const h = vals.length === 2 ? (rh - 8) / 2 : rh - 8, w = Math.max(2, (v / max) * 330);
          svgEl("rect", { x: 208, y: y + 3 + j * h, width: w, height: h - 1, rx: 2, fill: j ? "var(--hot)" : "var(--accent)", opacity: 0.8 }, svg);
          svgEl("text", { x: 214 + w, y: y + 3 + j * h + h / 2 + 3, "font-size": 10.5, fill: "var(--muted)" }, svg, v.toLocaleString() + " B");
        });
      });
      out.innerHTML = sel.value === "kem"
        ? "青が送る公開鍵、赤が返す暗号文。ML-KEM は X25519 の約 35 倍だが、1 往復あたり 2KB 程度なので、TLS では許容されて普及した。大きさより、ClientHello が1パケットに収まらなくなり、古い中継機器が通信を落とす問題のほうが厄介だった"
        : sel.value === "sig"
        ? "青が公開鍵、赤が署名。ML-DSA の署名は ECDSA の 30〜45 倍。SLH-DSA は公開鍵が小さい代わりに署名が非常に大きい。FN-DSA は小さいが、浮動小数点を使う実装が難しい"
        : "証明書チェーン（公開鍵 2 個、証明書の署名 2 個、CT の署名 2 個、CertificateVerify 1 個）を概算した値。ML-DSA にすると 15〜25KB 増え、接続が目に見えて遅くなる。これが Merkle Tree Certificates のような仕組みが検討されている理由";
    }
    sel.addEventListener("change", draw);
    draw();
  };

  // ---------- §3 LWE の直感 ----------
  W["lwe"] = function (fig) {
    const c = frame(fig, "LWE: 連立一次方程式に小さな誤差を足すだけで、消去法が効かなくなる");
    const lab = el("label", { class: "w-check" }, c);
    const noisy = el("input", { type: "checkbox", checked: "" }, lab);
    lab.appendChild(document.createTextNode(" 誤差 e を足す（−1, 0, 1 のどれか）"));
    const again = button(c, "問題を作り直す", "primary");
    const out = el("div", { class: "w-out cbc" }, fig);
    const q = 97, n = 3, m = 6;
    const rnd = (k) => crypto.getRandomValues(new Uint32Array(1))[0] % k;
    const mod = (a) => ((a % q) + q) % q;
    const inv = (a) => Number(CE.bpow(mod(a), q - 2, q));
    let A, s, e, b;
    function gen() { A = Array.from({ length: m }, () => Array.from({ length: n }, () => rnd(q))); s = Array.from({ length: n }, () => rnd(q)); draw(); }
    function solve(rows, rhs) {
      const M = rows.map((r, i) => r.concat([rhs[i]]));
      for (let col = 0; col < n; col++) {
        let p = M.findIndex((r, i) => i >= col && r[col] % q !== 0); if (p < 0) return null;
        [M[col], M[p]] = [M[p], M[col]];
        const iv = inv(M[col][col]); M[col] = M[col].map((v) => mod(v * iv));
        for (let i = 0; i < n; i++) if (i !== col) { const f = M[i][col]; M[i] = M[i].map((v, j) => mod(v - f * M[col][j])); }
      }
      return M.map((r) => r[n]);
    }
    function draw() {
      e = A.map(() => (noisy.checked ? rnd(3) - 1 : 0));
      b = A.map((r, i) => mod(r.reduce((t, a, j) => t + a * s[j], 0) + e[i]));
      const sol = solve(A.slice(0, n), b.slice(0, n));
      const check = sol ? A.map((r, i) => mod(r.reduce((t, a, j) => t + a * sol[j], 0)) === b[i]) : [];
      const okAll = sol && sol.every((v, i) => v === s[i]);
      let html = `<span class="lbl">公開</span>q = ${q}。行列 A と b = A·s + e（mod q）。秘密は s（${n} 個の数）<br>`;
      A.forEach((r, i) => { html += `<span class="lbl">式 ${i + 1}</span>${r[0]}·s₁ + ${r[1]}·s₂ + ${r[2]}·s₃ ≡ ${b[i]}${sol ? (check[i] ? ' <span style="color:var(--good)">✓</span>' : ' <span style="color:var(--hot)">✗</span>') : ""}<br>`; });
      html += `<span class="lbl">消去法の答え</span>式1〜3 から s = (${sol ? sol.join(", ") : "解なし"})　本当の s = (${s.join(", ")})<br>`;
      html += okAll ? '<span class="lbl">結果</span><b style="color:var(--hot)">秘密が求まった</b>。誤差がなければ、ただの連立方程式'
        : '<span class="lbl">結果</span><b style="color:var(--good)">外れ</b>。消去の途中で誤差が増幅され、残りの式（✗）とも合わない。誤差の候補を総当たりすると 3^式の数 通りに増える';
      out.innerHTML = html + '<br><span class="lbl">実際の規模</span>ML-KEM-768 では未知数 768 個、q = 3329。格子の最短ベクトル問題に帰着し、量子計算機でも効率よく解く方法は知られていない';
    }
    noisy.addEventListener("change", draw); again.addEventListener("click", gen);
    gen();
  };

  // ---------- §5 暗号化しても長さは漏れる ----------
  W["length-leak"] = function (fig) {
    const c = frame(fig, "暗号化しても「長さ」は漏れる: AI チャットの応答をトークンごとに送ると、話題が推測できる");
    const lab = el("label", { class: "w-check" }, c);
    const pad = el("input", { type: "checkbox" }, lab);
    lab.appendChild(document.createTextNode(" 詰め物で、全パケットを同じ大きさ（64B）にそろえる"));
    const go = button(c, "誰かの応答を盗聴する", "primary");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 170", role: "img", "aria-label": "パケットの大きさ" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const cands = [
      ["健康の相談", "その|症状|なら|早めに|受診|を|お勧め|します"],
      ["投資の相談", "その|銘柄|は|今|売却|を|検討|すべきです"],
      ["法律の相談", "その|契約|は|弁護士|に|相談|して|ください"],
    ];
    const OV = 29; // TLS レコードのヘッダと AEAD のタグ
    const sizes = (t) => t.split("|").map((w) => enc.encode(w).length + OV);
    let wins = 0, tries = 0;
    function run() {
      const k = crypto.getRandomValues(new Uint8Array(1))[0] % 3;
      const obs = sizes(cands[k][1]).map((v) => (pad.checked ? 64 : v));
      const dist = cands.map(([, t]) => { const s = sizes(t); return s.reduce((d, v, i) => d + Math.abs(v - (obs[i] ?? 0)), 0); });
      const g = dist.indexOf(Math.min(...dist));
      tries++; if (g === k) wins++;
      clear(svg);
      obs.forEach((v, i) => {
        const h = (v - 20) * 2.2;
        svgEl("rect", { x: 30 + i * 72, y: 130 - h, width: 50, height: h, rx: 3, fill: "var(--accent)", opacity: 0.75 }, svg);
        svgEl("text", { x: 55 + i * 72, y: 145, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" }, svg, `${v}B`);
      });
      svgEl("text", { x: 30, y: 164, "font-size": 11.5, fill: "var(--muted)" }, svg, "盗聴者に見えるのは、暗号化されたパケットの大きさの並びだけ");
      out.innerHTML = `<span class="lbl">本当の話題</span>${cands[k][0]}（攻撃者には見えない）<br>` +
        `<span class="lbl">攻撃者の推測</span><b style="color:${g === k ? "var(--hot)" : "var(--good)"}">${cands[g][0]}</b>（大きさの並びが一番近い候補）<br>` +
        `<span class="lbl">これまで</span>${tries} 回中 ${wins} 回的中（${Math.round((100 * wins) / tries)}%。当てずっぽうなら 33%）` + (pad.checked ? '<br><span class="lbl">注意</span>少量のランダムな詰め物を足すだけだと、平均をとれば差が残り、的中率は 33% まで下がらない' : '');
    }
    go.addEventListener("click", run);
    pad.addEventListener("change", () => { wins = 0; tries = 0; run(); });
    run();
  };

  // ---------- §6 Shamir の秘密分散 ----------
  W["shamir"] = function (fig) {
    const c = frame(fig, "Shamir の秘密分散（3-of-5）: 2次関数は3点で決まり、2点では決まらない");
    const si = intInput(c, "秘密 S（y 切片）", 42, 0, 99, nextId("sh"));
    const again = button(c, "多項式を作り直す");
    const chips = el("div", { class: "w-chips" }, fig);
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 260", role: "img", "aria-label": "秘密分散" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    let a1, a2, chosen = new Set([1, 2]);
    const r = (lo, hi) => lo + (crypto.getRandomValues(new Uint32Array(1))[0] % (hi - lo + 1));
    function coef() { a1 = r(-12, 12); a2 = r(-3, 3) || 2; draw(); }
    const btns = [];
    for (let x = 1; x <= 5; x++) { const b = button(chips, `持ち主 ${x}`); b.classList.add("w-chip"); b.addEventListener("click", () => { chosen.has(x) ? chosen.delete(x) : chosen.add(x); draw(); }); btns.push(b); }
    function draw() {
      const S = si.readInt() ?? 0, f = (x) => S + a1 * x + a2 * x * x;
      btns.forEach((b, i) => b.setAttribute("aria-pressed", chosen.has(i + 1) ? "true" : "false"));
      clear(svg);
      const xs = [...chosen].sort((a, b) => a - b);
      const ys = [0, 1, 2, 3, 4, 5].map(f);
      let lo = Math.min(...ys, 0) - 20, hi = Math.max(...ys, 100) + 20;
      const PX = (x) => 50 + x * 105, PY = (y) => 235 - ((y - lo) / (hi - lo)) * 215;
      svgEl("path", { d: `M50 ${PY(0)}H600`, stroke: "var(--line)" }, svg);
      svgEl("path", { d: "M50 20V235", stroke: "var(--line)" }, svg);
      const cid = nextId("shc");
      const cp = svgEl("clipPath", { id: cid }, svgEl("defs", {}, svg)); svgEl("rect", { x: 50, y: 10, width: 560, height: 228 }, cp);
      const curve = (g, attrs) => { let d = ""; for (let t = 0; t <= 5.2; t += 0.05) d += (d ? "L" : "M") + PX(t).toFixed(1) + " " + PY(g(t)).toFixed(1); svgEl("path", Object.assign({ d, fill: "none", "clip-path": `url(#${cid})` }, attrs), svg); };
      let html;
      if (xs.length >= 3) {
        const [p, q, t] = xs.slice(0, 3);
        const L = (x, i, j, k) => ((x - j) * (x - k)) / ((i - j) * (i - k));
        const rec = Math.round(f(p) * L(0, p, q, t) + f(q) * L(0, q, p, t) + f(t) * L(0, t, p, q));
        curve(f, { stroke: "var(--hot)", "stroke-width": 2.2 });
        svgEl("circle", { cx: PX(0), cy: PY(rec), r: 7, fill: "var(--hot)" }, svg);
        html = `<b style="color:var(--hot)">復元できた</b>: 持ち主 ${xs.join("・")} の ${xs.length} 点を通る 2 次関数は1本だけ。x = 0 での値（ラグランジュ補間）から S = <b>${rec}</b>`;
      } else {
        for (const alt of [S - 30, S, S + 25, S + 55]) {
          if (xs.length === 2) {
            const [p, q] = xs, [yp, yq] = [f(p), f(q)];
            const b2 = ((yq - alt) / q - (yp - alt) / p) / (q - p), b1 = (yp - alt) / p - b2 * p;
            curve((x) => alt + b1 * x + b2 * x * x, { stroke: "var(--muted)", "stroke-width": 1.3, "stroke-dasharray": "5 4" });
          }
        }
        html = `<b style="color:var(--good)">復元できない</b>: ${xs.length} 点を通る 2 次関数は無数にあり（点線）、どの S もあり得る。実際の方式では有限体（mod p）で計算するので、2 人の持ち分からは S について文字どおり何も分からない`;
      }
      [1, 2, 3, 4, 5].forEach((x) => {
        const on = chosen.has(x);
        svgEl("circle", { cx: PX(x), cy: PY(f(x)), r: on ? 7 : 5, fill: on ? "var(--accent)" : "var(--panel)", stroke: "var(--accent)", "stroke-width": 1.5 }, svg);
        svgEl("text", { x: PX(x), y: PY(f(x)) - 12, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" }, svg, `(${x}, ${f(x)})`);
      });
      svgEl("text", { x: 56, y: 32, "font-size": 11.5, fill: "var(--muted)" }, svg, "x = 0 での値が秘密");
      out.innerHTML = html;
    }
    si.addEventListener("input", draw); again.addEventListener("click", coef);
    coef();
  };

  for (const k in W) CE.register(k, W[k]);
})();
