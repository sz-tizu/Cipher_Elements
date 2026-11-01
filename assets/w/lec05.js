/* 第5回 公開鍵暗号 の図 */
(function () {
  "use strict";
  const { svgEl, el, clear, button, arrowDefs, nextId, frame, intInput } = CE;
  const W = {};
  const pw = (a, e, n) => Number(CE.bpow(a, e, n));
  function inv(a, n) { let [r0, r1, t0, t1] = [n, ((a % n) + n) % n, 0, 1]; while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [t0, t1] = [t1, t0 - q * t1]; } return ((t0 % n) + n) % n; }
  const rnd = (lo, hi) => lo + (crypto.getRandomValues(new Uint32Array(1))[0] % (hi - lo + 1));
  // 安全素数 p = 2q + 1（q も素数）。g = 4 は位数 q の部分群の生成元
  const SAFE = [23, 47, 59, 83, 107, 167, 179, 227, 263, 347, 359, 383, 467, 479, 503, 563, 587, 719, 839, 863, 887, 983];

  // ---------- §2 Diffie-Hellman 鍵交換 ----------
  W["dh-exchange"] = function (fig) {
    const c = frame(fig, "公開の値だけをやり取りして、2人だけが同じ秘密に行き着く");
    const pl = el("label", {}, c, "素数 p（p = 2q + 1）"); const ps = el("select", { "aria-label": "素数 p" }, pl);
    SAFE.forEach((p) => { const o = el("option", { value: p }, ps, `${p}（q = ${(p - 1) / 2}）`); if (p === 467) o.selected = true; });
    const again = button(c, "秘密を引き直す", "primary");
    const eve = button(c, "盗聴者が総当たりする");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 250", role: "img", "aria-label": "Diffie-Hellman 鍵交換" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("dh");
    let a, b, msg = "";
    function reset() { const q = (Number(ps.value) - 1) / 2; a = rnd(2, q - 1); b = rnd(2, q - 1); msg = ""; draw(); }
    function draw() {
      const p = Number(ps.value), g = 4, A = pw(g, a, p), B = pw(g, b, p), Ka = pw(B, a, p), Kb = pw(A, b, p);
      clear(svg); arrowDefs(svg, aid, "var(--accent)");
      const col = (x, name, color) => { svgEl("rect", { x: x - 85, y: 10, width: 170, height: 34, rx: 8, fill: "var(--accent-soft)", stroke: color }, svg); svgEl("text", { x, y: 32, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "var(--ink)" }, svg, name); };
      col(110, "アリス", "var(--accent)"); col(530, "ボブ", "var(--accent)");
      svgEl("rect", { x: 245, y: 10, width: 150, height: 34, rx: 8, fill: "var(--hot-soft)", stroke: "var(--hot)" }, svg);
      svgEl("text", { x: 320, y: 32, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "var(--ink)" }, svg, "盗聴者イブ");
      const t = (x, y, s, opt = {}) => svgEl("text", Object.assign({ x, y, "text-anchor": "middle", "font-size": 13, class: "mono", fill: "var(--ink)" }, opt), svg, s);
      t(320, 66, `公開: p = ${p}, g = ${g}`, { fill: "var(--muted)" });
      t(110, 84, `秘密 a = ${a}`, { fill: "var(--accent)", "font-weight": 700 });
      t(530, 84, `秘密 b = ${b}`, { fill: "var(--accent)", "font-weight": 700 });
      t(110, 112, `A = g^a mod p = ${A}`); t(530, 112, `B = g^b mod p = ${B}`);
      svgEl("path", { d: "M200 126H440", stroke: "var(--accent)", "stroke-width": 1.5, "marker-end": `url(#${aid})` }, svg);
      svgEl("path", { d: "M440 150H200", stroke: "var(--accent)", "stroke-width": 1.5, "marker-end": `url(#${aid})` }, svg);
      t(320, 120, `A = ${A}`); t(320, 145, `B = ${B}`);
      t(320, 178, `イブが見るもの: p, g, A = ${A}, B = ${B}`, { fill: "var(--hot)", "font-size": 12 });
      t(110, 214, `K = B^a = ${Ka}`, { "font-weight": 700 }); t(530, 214, `K = A^b = ${Kb}`, { "font-weight": 700 });
      t(320, 240, `どちらも g^(ab) = ${pw(g, (a * b) % ((p - 1) / 2), p)} に一致`, { fill: "var(--good)", "font-size": 12 });
      out.innerHTML = msg || "アリスは B を a 乗し、ボブは A を b 乗する。どちらも (g^b)^a = (g^a)^b = g^(ab) になるので、同じ鍵 K を共有できる。イブは A と B を見ても、a や b を知らないと g^(ab) を作れない。";
    }
    eve.addEventListener("click", () => {
      const p = Number(ps.value), A = pw(4, a, p);
      let x = 1, v = 4, tries = 1; while (v !== A) { v = (v * 4) % p; x++; tries++; }
      msg = `イブは g^x = A となる x を 1 から順に試し、<b>${tries} 回</b>で x = ${x} を見つけた（a = ${a}）。p が小さいので総当たりで破れる。<br>` +
        `実際の DH では、部分群の位数 q を 256 ビット程度にする。総当たりは約 2^256 回、知られた最良の汎用攻撃でも約 2^128 回かかる（第1回 §5.4）。`;
      draw();
    });
    ps.addEventListener("change", reset); again.addEventListener("click", reset);
    reset();
  };

  // ---------- §2 中間者攻撃 ----------
  W.mitm = (fig) => CE.seq(fig, {
    title: "認証のない DH は、間に入った攻撃者に2本の鍵を張られる",
    actors: ["アリス", "マロリー", "ボブ"],
    start: 1,
    steps: [
      { from: 0, to: 1, label: "A = g^a", note: "アリスはボブに A を送ったつもりだが、途中でマロリーが受け取る。" },
      { from: 1, to: 2, label: "M = g^m", note: "マロリーは自分の値 M をボブに渡す。ボブにはアリスからの値に見える。" },
      { from: 2, to: 1, label: "B = g^b", note: "ボブの返事もマロリーが受け取る。" },
      { from: 1, to: 0, label: "M = g^m", note: "マロリーはアリスにも自分の値を渡す。" },
      { at: 0, label: "鍵 g^(am)", note: "アリスはマロリーと鍵 g^(am) を共有した（ボブと共有したと思っている）。" },
      { at: 2, label: "鍵 g^(bm)", note: "ボブもマロリーと鍵 g^(bm) を共有した。" },
      { at: "both", label: "マロリーは復号して読み、暗号化し直して中継する", note: "アリスとボブは気づけない。DH は盗聴には強いが、なりすましには無力。" },
    ],
    caption: "防ぐには、受け取った値が本当に相手のものかを確かめる「認証」が要る。署名と証明書（第6回）で行い、TLS 1.3 はその組み合わせ（第7回）。",
  });

  // ---------- §4 ElGamal と展性 ----------
  W["elgamal"] = function (fig) {
    const c = frame(fig, "ElGamal 暗号: 暗号文を掛け算すると、平文も掛け算される（展性）");
    const mi = intInput(c, "平文 m（1〜466）", 42, 1, 466, nextId("eg-m"));
    const si = intInput(c, "攻撃者が掛ける数 s", 2, 1, 466, nextId("eg-s"));
    const again = button(c, "鍵と乱数を引き直す");
    const out = el("div", { class: "w-out cbc" }, fig);
    const p = 467, q = 233, g = 4;
    let x, r;
    function reset() { x = rnd(2, q - 1); r = rnd(2, q - 1); draw(); }
    function draw() {
      const m = mi.readInt() ?? 1, s = si.readInt() ?? 1, h = pw(g, x, p);
      const c1 = pw(g, r, p), c2 = (m * pw(h, r, p)) % p;
      const dec = (C1, C2) => (C2 * inv(pw(C1, x, p), p)) % p;
      const c2b = (c2 * s) % p;
      out.innerHTML = `<span class="lbl">公開鍵</span>p = ${p}, g = ${g}, h = g^x = ${h}（秘密鍵 x = ${x}）<br>` +
        `<span class="lbl">暗号化</span>乱数 r = ${r} を選び、c = (g^r, m·h^r) = (<b>${c1}</b>, <b>${c2}</b>)<br>` +
        `<span class="lbl">復号</span>m = c₂ · (c₁^x)⁻¹ = ${dec(c1, c2)} ✓<br>` +
        `<span class="lbl">攻撃者の操作</span>鍵を知らずに c₂ を ${s} 倍する → (${c1}, ${c2b})<br>` +
        `<span class="lbl">受信者の復号</span><b style="color:var(--hot)">${dec(c1, c2b)}</b> ＝ ${s} × ${m} mod ${p}。平文を狙いどおりに変えられた`;
    }
    [mi, si].forEach((i) => i.addEventListener("input", draw)); again.addEventListener("click", reset);
    reset();
  };

  // ---------- §5 教科書 RSA の展性と、復号オラクルの騙し方 ----------
  W["rsa-blind"] = function (fig) {
    const c = frame(fig, "教科書 RSA: 「この暗号文だけは復号しない」オラクルも、変装させた暗号文で騙せる");
    const mi = intInput(c, "秘密の平文 m（2〜3232）", 65, 2, 3232, nextId("rb-m"));
    const si = intInput(c, "変装用の数 s", 2, 2, 3232, nextId("rb-s"));
    const out = el("div", { class: "w-out cbc" }, fig);
    const n = 3233, e = 17, d = 2753; // p = 61, q = 53
    function draw() {
      const m = mi.readInt() ?? 2, s = si.readInt() ?? 2;
      const cm = pw(m, e, n), cp = (cm * pw(s, e, n)) % n, mp = pw(cp, d, n);
      const g = CE.gcd(s, n);
      out.innerHTML = `<span class="lbl">公開鍵</span>n = 3233, e = 17<br>` +
        `<span class="lbl">盗聴した暗号文</span>c = m^e mod n = <b>${cm}</b>（m は秘密）<br>` +
        `<span class="lbl">攻撃者の変装</span>c′ = c · s^e mod n = ${cm} · ${s}^17 mod 3233 = <b>${cp}</b>（c とは別の暗号文）<br>` +
        `<span class="lbl">オラクルの応答</span>c′ の復号 = (m·s)^(ed) = m·s mod n = <b>${mp}</b><br>` +
        (g === 1 ? `<span class="lbl">攻撃者の計算</span>m = ${mp} · s⁻¹ mod n = ${mp} · ${inv(s, n)} mod 3233 = <b style="color:var(--hot)">${(mp * inv(s, n)) % n}</b>　（秘密の m が出た）`
                 : `<span class="lbl">注意</span>s が n と互いに素でない（gcd = ${g}）。別の s を選ぶ`);
    }
    [mi, si].forEach((i) => i.addEventListener("input", draw));
    draw();
  };

  // ---------- §6 IND-CCA ゲーム ----------
  W["cca-game"] = (fig) => CE.seq(fig, {
    title: "選択暗号文攻撃ゲーム（IND-CCA2）: チャレンジ以外なら何でも復号してもらえる",
    actors: ["チャレンジャー", "攻撃者 A"],
    start: 1,
    steps: [
      { at: 0, label: "鍵の組 (pk, sk) を生成", note: "公開鍵 pk は攻撃者にも渡す。攻撃者は自分で好きなだけ暗号化できる。" },
      { from: 0, to: 1, label: "pk", note: "公開鍵暗号では、暗号化オラクルは自動的に付いてくる（IND-CPA は最低条件）。" },
      { from: 1, to: 0, label: "c を送る（復号の依頼）", note: "復号オラクル: 好きな暗号文を復号してもらえる。現実には「サーバが復号を試み、その結果や反応が分かる」状況。" },
      { from: 0, to: 1, label: "Dec(sk, c)", note: "" },
      { from: 1, to: 0, label: "m₀, m₁", note: "本番の2つの平文。" },
      { from: 0, to: 1, label: "c* = Enc(pk, m_b)", note: "" },
      { from: 1, to: 0, label: "c ≠ c* なら復号してもらえる", note: "チャレンジ c* そのもの以外なら、まだ復号を頼める（CCA2）。展性があると、c* を少し変えた暗号文で騙せる。" },
      { from: 1, to: 0, label: "推測 b′", note: "" },
    ],
    caption: "教科書 RSA や ElGamal は、c* を変装させた暗号文を復号させることで b が分かるので、IND-CCA2 ではない。",
  });

  // ---------- §5 OAEP の構造 ----------
  W.oaep = function (fig) {
    frame(fig, "RSA-OAEP: 平文に乱数を混ぜ、2回のハッシュでかき混ぜてから RSA に通す");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 250", role: "img", "aria-label": "OAEP の構造" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const aid = nextId("oa"); arrowDefs(svg, aid, "var(--muted)");
    const box = (x, y, w, t, f) => { svgEl("rect", { x, y, width: w, height: 30, rx: 7, fill: f ? "var(--accent-soft)" : "var(--panel)", stroke: f ? "var(--accent)" : "var(--line)" }, svg); svgEl("text", { x: x + w / 2, y: y + 20, "text-anchor": "middle", "font-size": 12.5, class: "mono", fill: "var(--ink)" }, svg, t); };
    const xr = (x, y) => { svgEl("circle", { cx: x, cy: y, r: 10, fill: "var(--panel)", stroke: "var(--hot)" }, svg); svgEl("text", { x, y: y + 5, "text-anchor": "middle", "font-size": 15, fill: "var(--hot)" }, svg, "⊕"); };
    const arr = (d) => svgEl("path", { d, stroke: "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
    svg.setAttribute("viewBox", "0 0 640 290");
    // 左の列: 平文側（X）、右の列: 乱数側（Y）
    box(60, 14, 220, "平文 m ‖ 00…0 ‖ ハッシュ", false); box(440, 14, 140, "乱数 r", false);
    box(330, 70, 60, "G", true); arr("M470 44V60Q470 85 452 85H392");
    xr(170, 85); arr("M170 44V73"); arr("M328 85H182");
    box(80, 120, 180, "X = 左 ⊕ G(r)"); arr("M170 95V118");
    box(330, 155, 60, "H", true); arr("M260 135H300Q312 135 312 150V170H328");
    xr(510, 170); arr("M510 44V158"); arr("M390 170H498");
    box(450, 200, 120, "Y = r ⊕ H(X)"); arr("M510 180V198");
    box(150, 248, 300, "RSA(X ‖ Y) = (X ‖ Y)^e mod n", true); arr("M170 150V246"); arr("M510 230V240Q510 263 490 263H452");
    cap.textContent = "乱数 r が毎回変わるので暗号化が確率的になり、2 段のハッシュ（Feistel 構造の 2 ラウンド）で、復号結果の形を確かめられる。改ざんされた暗号文は形が崩れて拒否されるので、展性がなくなる（ランダムオラクルモデルで IND-CCA2）。";
  };

  // ---------- §6 KEM/DEM ----------
  W["kem-dem"] = function (fig) {
    frame(fig, "ハイブリッド暗号: 公開鍵で「共通鍵」を運び、データは AEAD で暗号化する");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 210", role: "img", "aria-label": "KEM/DEM の構造" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const aid = nextId("kd"); arrowDefs(svg, aid, "var(--muted)");
    const box = (x, y, w, t, f) => { svgEl("rect", { x, y, width: w, height: 32, rx: 8, fill: f === "k" ? "var(--accent-soft)" : f === "d" ? "var(--good-soft)" : "var(--panel)", stroke: f === "k" ? "var(--accent)" : f === "d" ? "var(--good)" : "var(--line)" }, svg); svgEl("text", { x: x + w / 2, y: y + 21, "text-anchor": "middle", "font-size": 12.5, class: "mono", fill: "var(--ink)" }, svg, t); };
    const arr = (d) => svgEl("path", { d, stroke: "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
    svgEl("text", { x: 20, y: 22, "font-size": 12.5, "font-weight": 700, fill: "var(--ink)" }, svg, "送信者");
    box(20, 36, 120, "受信者の pk"); box(170, 36, 150, "KEM.Encap(pk)", "k"); arr("M140 52H168");
    box(360, 14, 110, "共通鍵 K"); box(360, 60, 110, "カプセル ck"); arr("M320 46H340Q350 46 350 36V30H358"); arr("M320 58H340Q350 58 350 68V76H358");
    box(170, 120, 150, "データ m"); box(360, 120, 110, "AEAD(K, m)", "d"); arr("M320 136H358"); arr("M415 46V118");
    box(500, 120, 120, "暗号文 cd"); arr("M470 136H498");
    box(500, 60, 120, "送る: ck, cd"); arr("M470 76H498"); arr("M560 120V94");
    svgEl("text", { x: 20, y: 192, "font-size": 12, fill: "var(--muted)" }, svg, "受信者: KEM.Decap(sk, ck) で K を取り出し、AEAD で cd を復号・検証する");
    cap.textContent = "公開鍵の計算は遅く、運べるデータも短いので、ランダムな共通鍵 K だけを公開鍵で運ぶ（KEM）。長いデータは速い AEAD で暗号化する（DEM）。KEM が IND-CCA で DEM が安全な AEAD なら、全体も IND-CCA になる。TLS 1.3、HPKE（RFC 9180）、耐量子の ML-KEM（第8回）もこの形。";
  };

  for (const k in W) CE.register(k, W[k]);
})();
