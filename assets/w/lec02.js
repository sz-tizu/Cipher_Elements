/* 第2回 暗号の形式的基礎 の図 */
(function () {
  "use strict";
  const { svgEl, el, clear, intInput, button, arrowDefs, nextId, frame } = CE;
  const W = {};
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  // 英文の文字頻度（%）。一般的な英語コーパスの近似値
  const EN = [8.2, 1.5, 2.8, 4.3, 12.7, 2.2, 2.0, 6.1, 7.0, 0.15, 0.77, 4.0, 2.4, 6.7, 7.5, 1.9, 0.095, 6.0, 6.3, 9.1, 2.8, 0.98, 2.4, 0.15, 2.0, 0.074];
  const SAMPLE = "THE ENEMY KNOWS THE SYSTEM BUT NOT THE KEY. A CIPHER SHOULD REMAIN SECURE EVEN WHEN EVERYTHING ABOUT IT EXCEPT THE KEY IS PUBLIC KNOWLEDGE. THIS PRINCIPLE WAS STATED BY AUGUSTE KERCKHOFFS IN EIGHTEEN EIGHTY THREE AND IT STILL GUIDES MODERN DESIGN.";
  function shift(text, k) { return text.replace(/[A-Z]/g, (ch) => ABC[(ABC.indexOf(ch) + k + 26) % 26]); }
  function freq(text) { const f = new Array(26).fill(0); let n = 0; for (const ch of text) { const i = ABC.indexOf(ch); if (i >= 0) { f[i]++; n++; } } return f.map((v) => (n ? (v * 100) / n : 0)); }
  function chi(f) { let s = 0; for (let i = 0; i < 26; i++) s += ((f[i] - EN[i]) ** 2) / EN[i]; return s; }

  // ---------- §1 シーザー暗号と頻度解析 ----------
  W["caesar-freq"] = function (fig) {
    const c = frame(fig, "鍵を隠しても、文字の出現頻度が鍵を教えてしまう");
    const kl = el("label", {}, c); const kh = el("span", {}, kl, "鍵（ずらす数）= "); const kv = el("b", {}, kh, "7");
    const kr = el("input", { type: "range", min: 0, max: 25, value: 7, "aria-label": "鍵" }, kl);
    const crack = button(c, "鍵を知らずに解読する", "primary");
    const box = el("div", { class: "w-out" }, fig);
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 200", role: "img", "aria-label": "文字頻度" }, fig);
    const res = el("div", { class: "w-out" }, fig);
    let guess = null;
    function draw() {
      const k = Number(kr.value); kv.textContent = k;
      const ct = shift(SAMPLE, k);
      box.innerHTML = `<b>暗号文</b> ${ct.slice(0, 150)}…`;
      const f = freq(ct);
      clear(svg);
      const top = Math.max(...f, ...EN), bw = 560 / 26, X = (i) => 56 + i * bw, Y = (v) => 170 - (v / top) * 140;
      svgEl("text", { x: 56, y: 14, "font-size": 11.5, fill: "var(--muted)" }, svg, "棒: 暗号文の文字頻度　点: 英語の標準的な頻度（鍵の分だけ右にずれて重なる）");
      for (let i = 0; i < 26; i++) {
        svgEl("rect", { x: X(i) + 3, y: Y(f[i]), width: bw - 6, height: 170 - Y(f[i]), fill: "var(--accent)", opacity: 0.75, rx: 2 }, svg);
        const e = EN[(i - k + 26) % 26];
        svgEl("circle", { cx: X(i) + bw / 2, cy: Y(e), r: 3.5, fill: "var(--hot)" }, svg);
        svgEl("text", { x: X(i) + bw / 2, y: 188, "text-anchor": "middle", "font-size": 11, class: "mono", fill: "var(--muted)" }, svg, ABC[i]);
      }
      res.innerHTML = guess === null ? "「鍵を知らずに解読する」は、26 通りの鍵を全部試し、復号結果の文字頻度が英語に最も近いものを選びます。" : guess;
    }
    kr.addEventListener("input", () => { guess = null; draw(); });
    crack.addEventListener("click", () => {
      const ct = shift(SAMPLE, Number(kr.value));
      const scores = ABC.split("").map((_, k) => ({ k, s: chi(freq(shift(ct, -k))) })).sort((a, b) => a.s - b.s);
      const best = scores[0];
      guess = `26 通りを試し、英語との差（χ²）が最小なのは <b>鍵 ${best.k}</b>（χ² = ${best.s.toFixed(0)}、次点は鍵 ${scores[1].k} で ${scores[1].s.toFixed(0)}）<br>復号: ${shift(ct, -best.k).slice(0, 90)}…`;
      draw();
    });
    draw();
  };

  // ---------- §2 事前確率と事後確率 ----------
  W["posterior"] = function (fig) {
    const c = frame(fig, "暗号文を見たあとの確率が、見る前と同じなら「何も漏れていない」");
    const mk = (label, val, id) => { const l = el("label", { for: id }, c); const h = el("span", {}, l, label); const v = el("b", {}, h, ""); const r = el("input", { type: "range", min: 0, max: 100, value: val, id }, l); return { r, v }; };
    const pm = mk("事前確率 Pr[M=攻撃] = ", 70, nextId("pm"));
    const pk = mk("鍵の偏り Pr[K=0] = ", 50, nextId("pk"));
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 210", role: "img", "aria-label": "事前確率と事後確率" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    function draw() {
      const q = Number(pm.r.value) / 100, p = Number(pk.r.value) / 100;
      pm.v.textContent = q.toFixed(2); pk.v.textContent = p.toFixed(2);
      // 1ビットの OTP: 攻撃=0, 撤退=1, C = M xor K
      const pc0 = q * p + (1 - q) * (1 - p);
      const post0 = pc0 ? (q * p) / pc0 : 0, post1 = 1 - pc0 ? (q * (1 - p)) / (1 - pc0) : 0;
      clear(svg);
      const bars = [["見る前", q], ["C=0 を見た後", post0], ["C=1 を見た後", post1]];
      bars.forEach(([lab, v], i) => {
        const x = 70 + i * 190, h = 140;
        svgEl("rect", { x, y: 30, width: 120, height: h, fill: "var(--bg)", stroke: "var(--line)", rx: 6 }, svg);
        svgEl("rect", { x, y: 30 + h * (1 - v), width: 120, height: h * v, fill: i === 0 ? "var(--muted)" : "var(--accent)", opacity: 0.8, rx: 6 }, svg);
        svgEl("text", { x: x + 60, y: 24, "text-anchor": "middle", "font-size": 12.5, fill: "var(--ink)", "font-weight": 700 }, svg, lab);
        svgEl("text", { x: x + 60, y: 196, "text-anchor": "middle", "font-size": 13, class: "mono", fill: "var(--ink)" }, svg, `Pr[攻撃] = ${v.toFixed(2)}`);
      });
      svgEl("line", { x1: 60, x2: 580, y1: 30 + 140 * (1 - q), y2: 30 + 140 * (1 - q), stroke: "var(--hot)", "stroke-dasharray": "4 4" }, svg);
      const same = Math.abs(post0 - q) < 0.005 && Math.abs(post1 - q) < 0.005;
      out.innerHTML = `M（攻撃=0／撤退=1）を 1 ビットの鍵 K で C = M ⊕ K と暗号化する。<br>` +
        (same ? `<span style="color:var(--good)">鍵が一様（Pr[K=0] = 0.5）なので、暗号文を見ても確率は変わらない → 完全秘匿</span>`
              : `<span style="color:var(--hot)">鍵が偏っているので、暗号文を見ると確率が ${q.toFixed(2)} から ${post0.toFixed(2)} または ${post1.toFixed(2)} に動く → 情報が漏れている</span>`);
    }
    [pm.r, pk.r].forEach((r) => r.addEventListener("input", draw));
    draw();
  };

  // ---------- §2 OTP の鍵の使い回し ----------
  W["otp-reuse"] = function (fig) {
    const c = frame(fig, "同じ鍵で2回暗号化すると、鍵が消えて平文どうしの XOR が残る");
    const m1 = "ATTACK AT DAWN FROM THE NORTH GATE", m2 = "SEND MORE TROOPS TO THE EAST WALL ";
    const gl = el("label", {}, c, "片方に入っていそうな単語（クリブ）");
    const gi = el("input", { type: "text", value: "THE ", "aria-label": "推測する単語" }, gl); gi.style.width = "9em";
    const pl = el("label", {}, c); const ph = el("span", {}, pl, "当てはめる位置 = "); const pv = el("b", {}, ph, "0");
    const pr = el("input", { type: "range", min: 0, max: 30, value: 0, "aria-label": "位置" }, pl);
    const out = el("div", { class: "w-out otp" }, fig);
    const res = el("div", { class: "w-out" }, fig);
    // 決まった擬似乱数の鍵（デモ用）
    const key = []; let x = 2463534242; for (let i = 0; i < 40; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; key.push((x >>> 0) & 0xff); }
    const enc = (m) => Array.from(m).map((ch, i) => ch.charCodeAt(0) ^ key[i]);
    const hex = (a) => a.map((b) => b.toString(16).padStart(2, "0")).join(" ");
    const c1 = enc(m1), c2 = enc(m2), x12 = c1.map((b, i) => b ^ c2[i]);
    function draw() {
      const g = gi.value.toUpperCase().slice(0, 12), pos = Math.min(Number(pr.value), x12.length - g.length);
      pv.textContent = pos;
      out.innerHTML = `<span class="lbl">c₁ = m₁ ⊕ k</span>${hex(c1.slice(0, 18))} …<br><span class="lbl">c₂ = m₂ ⊕ k</span>${hex(c2.slice(0, 18))} …<br><span class="lbl">c₁ ⊕ c₂</span>${hex(x12.slice(0, 18))} …　＝ m₁ ⊕ m₂（鍵が消えた）`;
      let rec = "";
      for (let i = 0; i < g.length; i++) { const v = x12[pos + i] ^ g.charCodeAt(i); rec += v >= 32 && v < 127 ? String.fromCharCode(v) : "·"; }
      const readable = /^[A-Z ]+$/.test(rec);
      res.innerHTML = `m₁ の ${pos} 文字目から「${g.replace(/ /g, "␣")}」と仮定すると、m₂ の同じ位置は <b>「${rec.replace(/ /g, "␣")}」</b>` +
        (readable ? ' <span style="color:var(--good)">← 読める英字になった。当たりの可能性が高い</span>' : ' <span style="color:var(--muted)">← 意味をなさない。位置か単語が違う</span>') +
        `<br>ヒント: 位置 0 で「ATTACK」、位置 20 で「THE ␣」を試してください。片方の平文を当てると、もう片方の同じ場所が読めます。`;
    }
    gi.addEventListener("input", draw); pr.addEventListener("input", draw);
    draw();
  };

  // ---------- §4 ゲームのシーケンス図 ----------
  W["eav-game"] = (fig) => CE.seq(fig, {
    title: "盗聴者ゲーム（EAV）: 2つの平文のどちらが暗号化されたか当てる",
    actors: ["チャレンジャー", "攻撃者 A"],
    start: 0,
    steps: [
      { at: 0, label: "鍵 k を生成（A には見せない）", note: "方式の中身は公開。隠すのは鍵だけ（ケルクホフスの原理）。" },
      { from: 1, to: 0, label: "同じ長さの平文 m₀, m₁ を送る", note: "攻撃者は自分に一番有利な2つの平文を選んでよい。" },
      { at: 0, label: "公平なコインで b ∈ {0,1} を決める", note: "b は攻撃者に秘密。" },
      { from: 0, to: 1, label: "c* = Enc(k, m_b)", note: "攻撃者は暗号文だけを受け取る。" },
      { at: 1, label: "c* を好きなだけ調べる（多項式時間で）", note: "効率的な計算なら何をしてもよい。" },
      { from: 1, to: 0, label: "推測 b′ を返す", note: "b′ = b なら攻撃者の勝ち。" },
    ],
    caption: "当てずっぽうでも勝率は 1/2。安全とは「どんな効率的な攻撃者でも、勝率が 1/2 + 無視できる量 を超えない」こと。",
  });
  W["cpa-game"] = (fig) => CE.seq(fig, {
    title: "選択平文攻撃ゲーム（IND-CPA）: 暗号化を何度でも頼める",
    actors: ["チャレンジャー", "攻撃者 A"],
    start: 0,
    steps: [
      { at: 0, label: "鍵 k を生成", note: "EAV と同じ。" },
      { from: 1, to: 0, label: "m を送る（何度でも）", note: "暗号化オラクル: 好きな平文を、同じ鍵で暗号化してもらえる。" },
      { from: 0, to: 1, label: "Enc(k, m)", note: "現実には「サーバに自分のデータを暗号化させられる」状況にあたる。" },
      { from: 1, to: 0, label: "m₀, m₁ を送る", note: "ここから本番。" },
      { from: 0, to: 1, label: "c* = Enc(k, m_b)", note: "b はチャレンジャーだけが知っている。" },
      { from: 1, to: 0, label: "（まだオラクルに聞いてよい）", note: "c* を受け取ったあとも、暗号化オラクルは使える。m₀ や m₁ をもう一度暗号化させてもよい。" },
      { from: 1, to: 0, label: "推測 b′", note: "勝率から 1/2 を引いた値が攻撃者の優位性。" },
    ],
    caption: "攻撃者は m₀ を自分で暗号化させて c* と比べられる。決定的な暗号化はこれで必ず負ける。",
  });

  // ---------- §4 IND-CPA ゲームを実際に戦う ----------
  // デモ用の小さな鍵付き関数（安全ではない。形を見るためのもの）
  function prf(k, x) { let h = (k ^ 0x9e3779b9) >>> 0; for (let i = 0; i < 4; i++) { h ^= (x >>> (i * 8)) & 0xff; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0; } return h & 0xffff; }
  const rnd16 = () => (crypto.getRandomValues(new Uint16Array(1))[0]);
  const SCHEMES = {
    det: { name: "決定的: c = F(k, m)", enc: (k, m) => ({ c: prf(k, m) }), show: (c) => c.c.toString(16).padStart(4, "0") },
    ctr: { name: "ランダム化: r を毎回選び c = (r, F(k, r) ⊕ m)", enc: (k, m) => { const r = rnd16(); return { r, c: prf(k, r) ^ m }; }, show: (c) => `(${c.r.toString(16).padStart(4, "0")}, ${c.c.toString(16).padStart(4, "0")})` },
  };
  W["ind-game"] = function (fig) {
    const c = frame(fig, "IND-CPA ゲームを攻撃者として戦う");
    const sl = el("label", {}, c, "方式");
    const ss = el("select", { "aria-label": "方式" }, sl);
    for (const k in SCHEMES) el("option", { value: k }, ss, SCHEMES[k].name);
    const play = el("div", { class: "game" }, fig);
    const auto = el("div", { class: "w-controls" }, fig);
    const runA = button(auto, "定番の攻撃を 1000 回試す", "primary");
    const runR = button(auto, "当てずっぽうを 1000 回試す");
    const stat = el("div", { class: "w-out" }, fig);
    let key, log, b, cstar, m0 = 0x4142, m1 = 0x5a5a, phase;
    const hx = (v) => v.toString(16).padStart(4, "0");
    function newGame() { key = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0; log = []; b = null; cstar = null; phase = "query"; render(); }
    function render() {
      const S = SCHEMES[ss.value];
      clear(play);
      const row1 = el("div", { class: "w-controls" }, play);
      const qi = el("input", { type: "text", value: hx(m0), "aria-label": "暗号化を頼む平文（16進4桁）" }, el("label", {}, row1, "平文（16進4桁）"));
      const ask = button(row1, "暗号化を頼む");
      ask.disabled = phase === "done";
      ask.addEventListener("click", () => { const m = parseInt(qi.value, 16) & 0xffff; log.push(`Enc(${hx(m)}) = ${S.show(S.enc(key, m))}`); render(); });
      const row2 = el("div", { class: "w-controls" }, play);
      const i0 = el("input", { type: "text", value: hx(m0), "aria-label": "m0" }, el("label", {}, row2, "m₀"));
      const i1 = el("input", { type: "text", value: hx(m1), "aria-label": "m1" }, el("label", {}, row2, "m₁"));
      const ch = button(row2, "チャレンジを受ける", "primary"); ch.disabled = phase !== "query";
      ch.addEventListener("click", () => { m0 = parseInt(i0.value, 16) & 0xffff; m1 = parseInt(i1.value, 16) & 0xffff; b = crypto.getRandomValues(new Uint8Array(1))[0] & 1; cstar = S.enc(key, b ? m1 : m0); log.push(`<b>チャレンジ c* = ${S.show(cstar)}</b>（m₀ = ${hx(m0)}, m₁ = ${hx(m1)} のどちらか）`); phase = "guess"; render(); });
      const row3 = el("div", { class: "w-controls" }, play);
      const g0 = button(row3, "b′ = 0 と答える"), g1 = button(row3, "b′ = 1 と答える"), again = button(row3, "新しいゲーム");
      g0.disabled = g1.disabled = phase !== "guess";
      const answer = (g) => { phase = "done"; log.push(g === b ? `→ 正解（b = ${b}）。あなたの勝ち` : `→ 不正解（b = ${b}）`); render(); };
      g0.addEventListener("click", () => answer(0)); g1.addEventListener("click", () => answer(1)); again.addEventListener("click", newGame);
      const lg = el("div", { class: "w-out" }, play);
      lg.innerHTML = log.length ? log.join("<br>") : "まず m₀ を暗号化させてみてください。そのあとチャレンジを受け、c* と見比べて答えます。";
    }
    function trial(attack) {
      const S = SCHEMES[ss.value]; const k = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
      const bb = crypto.getRandomValues(new Uint8Array(1))[0] & 1;
      const cs = S.enc(k, bb ? m1 : m0);
      if (!attack) return (crypto.getRandomValues(new Uint8Array(1))[0] & 1) === bb;
      const ref = S.enc(k, m0); // m₀ を自分で暗号化させる
      const guess = ref.c === cs.c && ref.r === cs.r ? 0 : 1;
      return guess === bb;
    }
    function run(attack) {
      let win = 0; for (let i = 0; i < 1000; i++) if (trial(attack)) win++;
      const rate = win / 1000;
      stat.innerHTML = `${attack ? "定番の攻撃（m₀ を暗号化させて c* と比べる）" : "当てずっぽう"} を 1000 回: 勝率 <b>${(rate * 100).toFixed(1)}%</b>、優位性 |勝率 − 1/2| ≈ <b>${Math.abs(rate - 0.5).toFixed(3)}</b>` +
        (attack && rate > 0.9 ? `<br><span style="color:var(--hot)">決定的な方式は、同じ平文が同じ暗号文になるので、比べるだけで見破られる</span>` : attack ? `<br><span style="color:var(--good)">毎回ランダムな r が入るので、同じ平文でも暗号文が変わり、比べても手がかりにならない</span>` : "");
    }
    ss.addEventListener("change", () => { stat.innerHTML = ""; newGame(); });
    runA.addEventListener("click", () => run(true)); runR.addEventListener("click", () => run(false));
    newGame();
  };

  // ---------- §5 PRG と識別器 ----------
  W["prg-test"] = function (fig) {
    const c = frame(fig, "識別器は「本物の乱数」と「生成器の出力」を見分けようとする");
    const gl = el("label", {}, c, "生成器");
    const gs = el("select", { "aria-label": "生成器" }, gl);
    const GENS = {
      good: ["ChaCha 風の良い生成器（ここでは暗号論的乱数で代用）", (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (v) => v & 1)],
      lcg: ["線形合同法の最下位ビット", (n) => { let x = crypto.getRandomValues(new Uint32Array(1))[0]; const o = []; for (let i = 0; i < n; i++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; o.push(x & 1); } return o; }],
      rep: ["G(s) ‖ G(s)（同じ出力を2回つなぐ）", (n) => { const h = Array.from(crypto.getRandomValues(new Uint8Array(n / 2)), (v) => v & 1); return h.concat(h); }],
      bias: ["1 が 55% 出る偏った生成器", (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (v) => (v < 141 ? 1 : 0))],
    };
    for (const k in GENS) el("option", { value: k }, gs, GENS[k][0]);
    const tl = el("label", {}, c, "識別器のテスト");
    const ts = el("select", { "aria-label": "識別器のテスト" }, tl);
    const TESTS = {
      freq: ["1 の割合が 52% 以上なら「生成器」と答える", (b) => b.reduce((a, v) => a + v, 0) / b.length >= 0.52],
      alt: ["隣どうしが違う割合が 90% 以上なら「生成器」", (b) => { let d = 0; for (let i = 1; i < b.length; i++) d += b[i] !== b[i - 1]; return d / (b.length - 1) >= 0.9; }],
      half: ["前半と後半が一致したら「生成器」", (b) => { const h = b.length / 2; for (let i = 0; i < h; i++) if (b[i] !== b[i + h]) return false; return true; }],
    };
    for (const k in TESTS) el("option", { value: k }, ts, TESTS[k][0]);
    const go = button(c, "500 回ずつ試す", "primary");
    const sample = el("div", { class: "w-out bits" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    function run() {
      const G = GENS[gs.value][1], T = TESTS[ts.value][1], N = 256, R = 500;
      let pg = 0, pr = 0;
      for (let i = 0; i < R; i++) { if (T(G(N))) pg++; if (T(GENS.good[1](N))) pr++; }
      const s = G(64);
      sample.textContent = "生成器の出力の例: " + s.join("");
      const adv = Math.abs(pg - pr) / R;
      out.innerHTML = `Pr[識別器が「生成器」と答える | 生成器の出力] ≈ ${(pg / R).toFixed(3)}<br>Pr[識別器が「生成器」と答える | 本物の乱数] ≈ ${(pr / R).toFixed(3)}<br>優位性（2つの差）≈ <b>${adv.toFixed(3)}</b> ` +
        (adv > 0.2 ? '<span style="color:var(--hot)">← このテストで見分けられる。PRG ではない</span>' : '<span style="color:var(--muted)">← このテストでは見分けられない（ほかのテストで見分けられる可能性は残る）</span>');
    }
    go.addEventListener("click", run); gs.addEventListener("change", run); ts.addEventListener("change", run);
    run();
  };

  // ---------- §6 帰着の組み立て ----------
  W.reduction = function (fig) {
    const c = frame(fig, "帰着: 暗号を破る A を部品にして、PRG を見分ける D を組み立てる");
    const back = button(c, "戻る"), next = button(c, "次へ", "primary");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 300", role: "img", "aria-label": "帰着の構造" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const aid = nextId("rd");
    const steps = [
      "D は「PRG の識別ゲーム」に参加している。外から y が渡される。y は G(s) か、本物の乱数のどちらか（D には分からない）。",
      "D は自分の中で、A のために盗聴者ゲームを演じる。A から2つの平文 m₀, m₁ を受け取る。",
      "D はコイン b を投げ、c* = y ⊕ m_b を A に渡す。y = G(s) なら、これは本物の暗号文そのもの。",
      "A は推測 b′ を返す。",
      "D は「b′ = b なら 1（PRG の出力だと思う）、違えば 0」と答える。A が暗号を破れる分だけ、D は y を見分けられる。",
    ];
    let k = 0;
    function box(x, y, w, h, label, on, dashed) {
      svgEl("rect", { x, y, width: w, height: h, rx: 10, fill: on ? "var(--accent-soft)" : "none", stroke: on ? "var(--accent)" : "var(--line)", "stroke-width": on ? 2 : 1.3, "stroke-dasharray": dashed ? "6 4" : "" }, svg);
      svgEl("text", { x: x + 12, y: y + 20, "font-size": 13, "font-weight": 700, fill: "var(--ink)" }, svg, label);
    }
    function arrow(d, label, lx, ly, on) {
      svgEl("path", { d, stroke: on ? "var(--hot)" : "var(--accent)", "stroke-width": on ? 2.2 : 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
      if (label) svgEl("text", { x: lx, y: ly, "font-size": 12.5, class: "mono", fill: on ? "var(--hot)" : "var(--ink)", "font-weight": on ? 700 : 400 }, svg, label);
    }
    function draw() {
      clear(svg); arrowDefs(svg, aid, "var(--accent)");
      box(20, 20, 130, 260, "PRG ゲーム", false);
      svgEl("text", { x: 32, y: 60, "font-size": 12, fill: "var(--muted)" }, svg, "y = G(s) か");
      svgEl("text", { x: 32, y: 78, "font-size": 12, fill: "var(--muted)" }, svg, "本物の乱数");
      box(200, 20, 420, 260, "識別器 D（これを作る）", true, false);
      box(470, 70, 130, 150, "攻撃者 A", k >= 1, true);
      svgEl("text", { x: 482, y: 116, "font-size": 12, fill: "var(--muted)" }, svg, "中身は分からない");
      svgEl("text", { x: 482, y: 134, "font-size": 12, fill: "var(--muted)" }, svg, "（呼び出すだけ）");
      if (k >= 0) arrow("M150 80H218", "y", 175, 72, k === 0);
      if (k >= 1) arrow("M470 100H330", "m₀, m₁", 380, 92, k === 1);
      if (k >= 2) { svgEl("text", { x: 222, y: 140, "font-size": 12.5, class: "mono", fill: "var(--ink)" }, svg, "b ← {0,1}"); arrow("M330 160H468", "c* = y ⊕ m_b", 340, 152, k === 2); }
      if (k >= 3) arrow("M470 200H330", "b′", 390, 192, k === 3);
      if (k >= 4) { svgEl("text", { x: 222, y: 240, "font-size": 12.5, class: "mono", fill: "var(--ink)" }, svg, "b′ = b ? 1 : 0"); arrow("M218 256H152", "出力", 168, 248, true); }
      cap.innerHTML = `<b>手順 ${k + 1} / ${steps.length}</b>　${steps[k]}`;
      back.disabled = k === 0; next.disabled = k === steps.length - 1;
    }
    back.addEventListener("click", () => { if (k > 0) { k--; draw(); } });
    next.addEventListener("click", () => { if (k < steps.length - 1) { k++; draw(); } });
    draw();
  };

  for (const k in W) CE.register(k, W[k]);
})();
