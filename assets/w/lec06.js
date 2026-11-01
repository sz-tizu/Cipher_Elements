/* 第6回 署名・PKI・ランダムオラクル の図（assets/w/sha256.js を使う） */
(function () {
  "use strict";
  const { svgEl, el, clear, button, arrowDefs, nextId, frame, intInput } = CE;
  const S = window.SHA256;
  const W = {};
  const enc = new TextEncoder();
  const rb = (n) => crypto.getRandomValues(new Uint8Array(n));
  const hx = (b) => S.hex(b);
  const pw = (a, e, n) => Number(CE.bpow(a, e, n));
  function inv(a, n) { let [r0, r1, t0, t1] = [n, ((a % n) + n) % n, 0, 1]; while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [t0, t1] = [t1, t0 - q * t1]; } return ((t0 % n) + n) % n; }
  const mod = (a, n) => ((a % n) + n) % n;

  // ---------- §2 Lamport 署名 ----------
  W.lamport = function (fig) {
    const c = frame(fig, "Lamport 署名: 1回なら安全、2回使うと偽造される");
    const ml = el("label", {}, c, "署名するメッセージ（8 ビット）");
    const mi = el("input", { type: "text", value: "10110010", maxlength: 8, "aria-label": "メッセージ" }, ml); mi.style.width = "7em";
    const sign = button(c, "署名する", "primary"), reset = button(c, "鍵を作り直す");
    const grid = el("div", { class: "lam" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    let sk, pk, used;
    function keygen() {
      sk = Array.from({ length: 8 }, () => [rb(4), rb(4)]);
      pk = sk.map(([a, b]) => [S.sha256(a).slice(0, 4), S.sha256(b).slice(0, 4)]);
      used = []; draw();
    }
    function draw() {
      clear(grid);
      el("div", { class: "lam-h" }, grid, "ビット位置");
      for (let i = 0; i < 8; i++) el("div", { class: "lam-h" }, grid, String(i));
      for (const bit of [0, 1]) {
        el("div", { class: "lam-h" }, grid, `秘密 sk[${bit}]`);
        for (let i = 0; i < 8; i++) {
          const open = used.some((m) => m[i] === String(bit));
          el("div", { class: "lam-c" + (open ? " open" : "") }, grid, open ? hx(sk[i][bit]).slice(0, 6) : "••••••");
        }
      }
      const forgeable = [];
      for (let v = 0; v < 256; v++) {
        const m = v.toString(2).padStart(8, "0");
        if (used.includes(m)) continue;
        if ([...m].every((b, i) => used.some((u) => u[i] === b))) forgeable.push(m);
      }
      out.innerHTML = `公開鍵は、各秘密値のハッシュ 16 個。署名は、メッセージの各ビットに対応する秘密値を1つずつ公開する。<br>` +
        (used.length ? `署名したメッセージ: ${used.join(", ")}<br>公開された秘密値だけで、<b>${forgeable.length} 個</b>の新しいメッセージに正しい署名を作れる` + (forgeable.length ? `（例: ${forgeable.slice(0, 4).join(", ")}${forgeable.length > 4 ? " …" : ""}）` : "") +
          (used.length === 1 ? '<br><span style="color:var(--good)">1 回だけなら、各ビットの片方しか公開されないので、別のメッセージは作れない</span>' : '<br><span style="color:var(--hot)">2 回目の署名で両方が公開されたビットは、0 と 1 を自由に選べるようになる</span>') : "メッセージを入れて「署名する」を押してください。");
    }
    sign.addEventListener("click", () => { const m = mi.value.replace(/[^01]/g, "").padEnd(8, "0").slice(0, 8); if (!used.includes(m)) used.push(m); draw(); });
    reset.addEventListener("click", keygen);
    keygen();
  };

  // ---------- §3 教科書 RSA 署名の偽造 ----------
  W["rsa-sig-forge"] = function (fig) {
    const c = frame(fig, "教科書 RSA 署名は、秘密鍵なしで「何かのメッセージ」の署名を作れてしまう");
    const si = intInput(c, "攻撃者が選ぶ署名 s", 1234, 2, 3232, nextId("rs-s"));
    const m1i = intInput(c, "署名をもらう m₁", 7, 2, 3232, nextId("rs-a"));
    const m2i = intInput(c, "署名をもらう m₂", 11, 2, 3232, nextId("rs-b"));
    const out = el("div", { class: "w-out cbc" }, fig);
    const n = 3233, e = 17, d = 2753;
    function draw() {
      const s = si.readInt() ?? 2, m1 = m1i.readInt() ?? 2, m2 = m2i.readInt() ?? 2;
      const m = pw(s, e, n), s1 = pw(m1, d, n), s2 = pw(m2, d, n), s12 = (s1 * s2) % n, m12 = (m1 * m2) % n;
      out.innerHTML = `<span class="lbl">公開鍵</span>n = 3233, e = 17。検証は「s^e mod n = m か」<br>` +
        `<span class="lbl">偽造その1</span>先に s = ${s} を選び、m = s^e mod n = <b>${m}</b> とすれば、(m, s) は正しい署名の組。ただし m は選べない（でたらめな値）<br>` +
        `<span class="lbl">偽造その2</span>m₁ と m₂ の署名 s₁ = ${s1}, s₂ = ${s2} をもらえば、s₁·s₂ mod n = <b>${s12}</b> は m₁·m₂ = <b>${m12}</b> の正しい署名（${pw(s12, e, n) === m12 ? "検証 ✓" : "×"}）<br>` +
        `<span class="lbl">対策</span>m をそのまま署名せず、ハッシュと乱数で形を整えた値に署名する（RSA-FDH、RSA-PSS）。s から逆算した値も、積も、正しい形にならない`;
    }
    [si, m1i, m2i].forEach((i) => i.addEventListener("input", draw));
    draw();
  };

  // ---------- §4 Schnorr の識別プロトコル ----------
  W["schnorr-id"] = (fig) => CE.seq(fig, {
    title: "Schnorr の識別: 秘密 x を明かさずに「x を知っている」と示す",
    actors: ["証明者（x を知る）", "検証者（y = g^x を知る）"],
    start: 1,
    steps: [
      { at: 0, label: "乱数 k を選び、R = g^k を計算", note: "コミットメント。k は毎回新しい乱数でなければならない。" },
      { from: 0, to: 1, label: "R", note: "先に R を渡して、あとから変えられないようにする。" },
      { from: 1, to: 0, label: "チャレンジ e（乱数）", note: "検証者が予測できない問題を出す。" },
      { from: 0, to: 1, label: "s = k + x·e mod q", note: "x を知っていれば計算できる。k が x を隠すので、s から x は分からない。" },
      { at: 1, label: "g^s = R · y^e を確認", note: "g^s = g^(k + xe) = g^k · (g^x)^e = R · y^e。等しければ受理。" },
    ],
    caption: "Fiat-Shamir 変換: チャレンジ e を検証者に聞く代わりに e = H(R ‖ メッセージ) とすると、やり取りなしの署名になる（Schnorr 署名）。",
  });

  // ---------- §4 DSA のノンス再利用 ----------
  W["dsa-nonce"] = function (fig) {
    const c = frame(fig, "同じノンス k で2回署名すると、秘密鍵が計算で求まる");
    const rl = el("label", { class: "w-check" }, c);
    const reuse = el("input", { type: "checkbox", checked: "" }, rl);
    rl.appendChild(document.createTextNode(" 同じ k を使い回す（実装のバグ）"));
    const again = button(c, "鍵を作り直して2回署名する", "primary");
    const out = el("div", { class: "w-out cbc" }, fig);
    // 位数 q = 233 の部分群（p = 467, g = 4）で動く DSA
    const p = 467, q = 233, g = 4;
    const H = (m) => { const h = S.sha256(enc.encode(m)); return ((h[0] << 8) | h[1]) % q; };
    const rnd = () => 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % (q - 1));
    function sign(x, m, k) {
      const r = pw(g, k, p) % q, z = H(m), s = mod(inv(k, q) * (z + x * r), q);
      return { m, z, r, s, k };
    }
    function run() {
      const x = rnd(), y = pw(g, x, p);
      let k1 = rnd(), k2 = reuse.checked ? k1 : rnd();
      let s1, s2;
      for (let t = 0; t < 50; t++) { s1 = sign(x, "送金 1000 円", k1); s2 = sign(x, "送金 5 円", k2); if (s1.r && s1.s && s2.r && s2.s && mod(s1.s - s2.s, q)) break; k1 = rnd(); k2 = reuse.checked ? k1 : rnd(); }
      let html = `<span class="lbl">公開鍵</span>p = ${p}, q = ${q}, g = ${g}, y = g^x = ${y}（秘密鍵 x = ${x}）<br>` +
        `<span class="lbl">署名 1</span>「${s1.m}」 z = H(m) = ${s1.z}, (r, s) = (<b>${s1.r}</b>, ${s1.s})<br>` +
        `<span class="lbl">署名 2</span>「${s2.m}」 z = H(m) = ${s2.z}, (r, s) = (<b>${s2.r}</b>, ${s2.s})<br>`;
      if (s1.r === s2.r) {
        const k = mod((s1.z - s2.z) * inv(s1.s - s2.s, q), q);
        const xr = mod((s1.s * k - s1.z) * inv(s1.r, q), q);
        html += `<span class="lbl">攻撃者の気づき</span>r が同じ → 同じ k が使われた<br>` +
          `<span class="lbl">k を求める</span>s₁ − s₂ = k⁻¹(z₁ − z₂) なので、k = (z₁ − z₂)/(s₁ − s₂) mod q = <b>${k}</b><br>` +
          `<span class="lbl">x を求める</span>x = (s₁·k − z₁)/r mod q = <b style="color:var(--hot)">${xr}</b> ${xr === x ? "（秘密鍵と一致。以後、好きな署名を作れる）" : ""}`;
      } else {
        html += `<span class="lbl">攻撃者の気づき</span>r が違うので、2つの式に未知数（k₁, k₂, x）が3つあり、解けない`;
      }
      out.innerHTML = html;
    }
    again.addEventListener("click", run); reuse.addEventListener("change", run);
    run();
  };

  // ---------- §6 証明書チェーンの検証 ----------
  W["cert-chain"] = function (fig) {
    const c = frame(fig, "証明書チェーン: 信頼できる根から、1つずつ署名をたどって確かめる");
    const opts = [
      ["host", "接続先は shop.example.com（証明書の名前と一致）", true],
      ["exp", "サーバ証明書の有効期限内", true],
      ["sig", "中間 CA の署名が正しい（改ざんなし）", true],
      ["root", "ルート CA が OS・ブラウザの信頼ストアにある", true],
      ["rev", "失効していない", true],
    ];
    const state = {};
    const box = el("div", { class: "w-chips cert-opts" }, c);
    opts.forEach(([k, t, v]) => { state[k] = v; const id = nextId("cc"); const lab = el("label", { for: id, class: "w-chip" }, box); const cb = el("input", { type: "checkbox", id }, lab); cb.checked = v; lab.appendChild(document.createTextNode(" " + t)); cb.addEventListener("change", () => { state[k] = cb.checked; draw(); }); });
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 260", role: "img", "aria-label": "証明書チェーン" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("cc");
    function card(x, title, lines, ok, kind) {
      const color = ok ? (kind === "root" ? "var(--good)" : "var(--accent)") : "var(--hot)";
      svgEl("rect", { x, y: 40, width: 180, height: 150, rx: 10, fill: ok ? "var(--panel)" : "var(--hot-soft)", stroke: color, "stroke-width": 1.8 }, svg);
      svgEl("rect", { x, y: 40, width: 180, height: 30, rx: 10, fill: color, opacity: 0.15 }, svg);
      svgEl("text", { x: x + 90, y: 61, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "var(--ink)" }, svg, title);
      lines.forEach((l, i) => svgEl("text", { x: x + 12, y: 92 + i * 22, "font-size": 11.5, fill: "var(--ink)" }, svg, l));
    }
    function draw() {
      clear(svg); arrowDefs(svg, aid, "var(--muted)");
      card(20, "ルート CA", ["主体: Example Root", "発行者: 自分自身", "公開鍵: pk_root", "信頼ストアに事前登録"], state.root, "root");
      card(230, "中間 CA", ["主体: Example CA 1", "発行者: Example Root", "公開鍵: pk_ca", "署名: pk_root で検証"], state.sig, "mid");
      card(440, "サーバ証明書", ["主体: shop.example.com", "発行者: Example CA 1", "公開鍵: pk_server", "署名: pk_ca で検証"], state.host && state.exp && state.rev, "leaf");
      svgEl("path", { d: "M200 115H228", stroke: "var(--muted)", "stroke-width": 1.5, "marker-end": `url(#${aid})` }, svg);
      svgEl("path", { d: "M410 115H438", stroke: "var(--muted)", "stroke-width": 1.5, "marker-end": `url(#${aid})` }, svg);
      svgEl("text", { x: 214, y: 106, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" }, svg, "署名");
      svgEl("text", { x: 424, y: 106, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" }, svg, "署名");
      svgEl("text", { x: 530, y: 222, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)" }, svg, "TLS ではサーバが送ってくる");
      svgEl("text", { x: 110, y: 222, "text-anchor": "middle", "font-size": 12, fill: "var(--muted)" }, svg, "OS やブラウザに最初から入っている");
      const fails = opts.filter(([k]) => !state[k]).map(([, t]) => t);
      out.innerHTML = fails.length
        ? `<b style="color:var(--hot)">接続を拒否</b>: ${fails.map((t) => "「" + t + "」が満たされない").join("、")}。どれか1つでも欠けると、署名がどれだけ正しくても信頼できない`
        : `<b style="color:var(--good)">検証成功</b>: ルート（信頼の起点）の公開鍵で中間 CA の署名を、中間 CA の公開鍵でサーバ証明書の署名を確かめ、名前・期限・失効も確認できた。これで pk_server が shop.example.com のものだと信じられる`;
    }
    draw();
  };

  for (const k in W) CE.register(k, W[k]);
})();
