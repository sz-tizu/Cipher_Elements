/* 第4回 ハッシュ・MAC・AEAD の図（assets/w/aes.js と assets/w/sha256.js を使う） */
(function () {
  "use strict";
  const { svgEl, el, clear, button, arrowDefs, nextId, frame } = CE;
  const A = window.AES, S = window.SHA256;
  const W = {};
  const enc = new TextEncoder();
  const rb = (n) => crypto.getRandomValues(new Uint8Array(n));
  const cat = (...arrs) => { const n = arrs.reduce((a, x) => a + x.length, 0), o = new Uint8Array(n); let p = 0; for (const x of arrs) { o.set(x, p); p += x.length; } return o; };
  const show = (b) => Array.from(b, (v) => (v >= 32 && v < 127 ? String.fromCharCode(v) : "·")).join("");
  const h2 = (v) => v.toString(16).padStart(2, "0");

  // ---------- §2 原像探索と衝突探索の手間 ----------
  W["hash-search"] = function (fig) {
    const c = frame(fig, "出力を t ビットに切り詰めた SHA-256 で、原像と衝突を実際に探す");
    const tl = el("label", {}, c); const th = el("span", {}, tl, "出力の長さ t = "); const tv = el("b", {}, th, "16");
    const tr = el("input", { type: "range", min: 8, max: 22, value: 16, "aria-label": "出力ビット数" }, tl); tr.style.width = "160px";
    const bp = button(c, "原像を探す", "primary"), bc = button(c, "衝突を探す", "primary");
    const out = el("div", { class: "w-out" }, fig);
    let busy = false;
    const prefix = (h, t) => ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> (32 - t);
    const inp = (i) => { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, i); return b; };
    function run(kind) {
      if (busy) return; busy = true; bp.disabled = bc.disabled = true;
      const t = Number(tr.value), salt = rb(4);
      const H = (i) => S.sha256(cat(salt, inp(i)));
      const target = kind === "pre" ? prefix(S.sha256(rb(16)), t) : null;
      const seen = new Map(); let i = 0, found = null;
      const t0 = performance.now();
      (function chunk() {
        const end = performance.now() + 30;
        while (performance.now() < end && !found) {
          const p = prefix(H(i), t);
          if (kind === "pre") { if (p === target) found = [i]; }
          else { if (seen.has(p)) found = [seen.get(p), i]; else seen.set(p, i); }
          i++;
        }
        out.innerHTML = `${kind === "pre" ? "原像" : "衝突"}を探索中… ${i.toLocaleString()} 回`;
        if (!found) { setTimeout(chunk, 0); return; }
        const n = i, exp = kind === "pre" ? 2 ** t : Math.sqrt(Math.PI * 2 ** t / 2);
        out.innerHTML = `${kind === "pre" ? `目標の値 ${target.toString(16)} になる入力` : "同じ出力になる2つの入力"}を <b>${n.toLocaleString()} 回</b>で発見（${((performance.now() - t0) / 1000).toFixed(2)} 秒）<br>` +
          `理論上の目安: ${kind === "pre" ? `2^${t} = ${(2 ** t).toLocaleString()} 回` : `√(π·2^${t}/2) ≈ ${Math.round(exp).toLocaleString()} 回（約 2^${t / 2}）`}<br>` +
          `<span style="color:var(--muted)">t を 2 増やすと、原像は約 4 倍、衝突は約 2 倍の手間になる。256 ビットなら原像 2^256、衝突 2^128</span>`;
        busy = false; bp.disabled = bc.disabled = false;
      })();
    }
    tr.addEventListener("input", () => (tv.textContent = tr.value));
    bp.addEventListener("click", () => run("pre")); bc.addEventListener("click", () => run("col"));
    out.innerHTML = "ボタンを押すと、ブラウザの中で SHA-256 を実際に計算して探します。t = 20 以上の原像探索は数秒かかります。";
  };

  // ---------- §3 Merkle-Damgård 構造 ----------
  W["md-chain"] = function (fig) {
    const c = frame(fig, "Merkle-Damgård 構造では、出力がそのまま最後の内部状態になっている");
    const tg = button(c, "長さ拡張を表示する", "primary");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 210", role: "img", "aria-label": "Merkle-Damgård 構造" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const aid = nextId("md"); let ext = false;
    function draw() {
      clear(svg); arrowDefs(svg, aid, "var(--muted)");
      const blk = ["M₁", "M₂", "M₃‖pad"], fx = [150, 290, 430];
      const box = (x, y, w, h, t, kind) => { svgEl("rect", { x, y, width: w, height: h, rx: 8, fill: kind === "f" ? "var(--accent-soft)" : kind === "hot" ? "var(--hot-soft)" : "var(--panel)", stroke: kind === "f" ? "var(--accent)" : kind === "hot" ? "var(--hot)" : "var(--line)" }, svg); svgEl("text", { x: x + w / 2, y: y + h / 2 + 5, "text-anchor": "middle", "font-size": 13, class: "mono", fill: "var(--ink)" }, svg, t); };
      const arr = (d, hot) => svgEl("path", { d, stroke: hot ? "var(--hot)" : "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
      box(14, 100, 60, 34, "IV");
      blk.forEach((b, i) => { box(fx[i] - 40, 20, 80, 30, b); box(fx[i] - 30, 100, 60, 34, "f", "f"); arr(`M${fx[i]} 50V98`); arr(`M${i ? fx[i - 1] + 30 : 74} 117H${fx[i] - 32}`); });
      box(510, 100, 110, 34, "H = 出力", "out");
      arr("M460 117H508");
      svgEl("text", { x: 220, y: 156, "text-anchor": "middle", "font-size": 11.5, fill: "var(--muted)" }, svg, "内部状態（32 バイト）");
      if (ext) {
        box(470, 160, 150, 30, "追加分‖pad′", "hot");
        box(390, 160, 60, 30, "f", "f");
        arr("M565 136Q565 150 545 150H430Q420 150 420 158", true);
        arr("M468 175H452", true);
        arr("M388 175H330", true);
        box(220, 160, 108, 30, "H′（偽造）", "hot");
      }
      cap.innerHTML = ext ? "攻撃者は出力 H を「途中の内部状態」として f に入れ直し、追加分を処理できる。秘密の鍵を含む最初の部分を知らなくても、H(鍵 ‖ m ‖ pad ‖ 追加分) が計算できてしまう。"
        : "メッセージをブロックに区切り、圧縮関数 f で内部状態を順に更新する。最後の内部状態が、そのままハッシュ値として出力される。";
      tg.textContent = ext ? "長さ拡張を隠す" : "長さ拡張を表示する";
    }
    tg.addEventListener("click", () => { ext = !ext; draw(); });
    draw();
  };

  // ---------- §3 長さ拡張攻撃 ----------
  W["length-ext"] = function (fig) {
    const c = frame(fig, "H(鍵 ‖ メッセージ) を MAC に使うと、鍵を知らずに偽造できる");
    const kl = el("label", {}, c); const kh = el("span", {}, kl, "攻撃者が推測する鍵の長さ = "); const kv = el("b", {}, kh, "8");
    const kr = el("input", { type: "range", min: 1, max: 32, value: 8, "aria-label": "鍵の長さ" }, kl); kr.style.width = "160px";
    const el2 = el("label", {}, c, "付け足す文字列"); const ei = el("input", { type: "text", value: "&role=admin", "aria-label": "付け足す文字列" }, el2); ei.style.width = "10em";
    const again = button(c, "サーバの鍵を引き直す");
    const out = el("div", { class: "w-out cbc" }, fig);
    const msg = enc.encode("user=alice&role=user");
    let key;
    function reset() { key = rb(10 + (rb(1)[0] % 13)); draw(); }
    function draw() {
      kv.textContent = kr.value;
      const tag = S.sha256(cat(key, msg));
      const L = Number(kr.value), ext = enc.encode(ei.value);
      const glue = S.padding(L + msg.length);
      const forgedMsg = cat(msg, glue, ext);
      const forgedTag = S.toBytes(S.hashFrom(S.fromBytes(tag), ext, L + msg.length + glue.length));
      const ok = S.hex(S.sha256(cat(key, forgedMsg))) === S.hex(forgedTag);
      out.innerHTML = `<span class="lbl">公開されている</span>m = ${show(msg)}、tag = ${S.hex(tag).slice(0, 24)}…<br>` +
        `<span class="lbl">偽造メッセージ</span>${show(msg)}<span style="color:var(--muted)">${show(glue).replace(/·/g, "·")}</span><b>${show(ext)}</b><br>` +
        `<span class="lbl">偽造タグ</span>${S.hex(forgedTag).slice(0, 24)}…（tag を内部状態として続きを計算しただけ）<br>` +
        `<span class="lbl">サーバの検証</span>` + (ok ? `<b style="color:var(--hot)">受理された。鍵を知らないのに "${show(ext)}" を付け足せた</b>` : `拒否（鍵の長さの推測が違う。正しい長さで受理される。実際の攻撃では 1〜64 を全部試せばよい）`);
    }
    kr.addEventListener("input", draw); ei.addEventListener("input", draw); again.addEventListener("click", reset);
    reset();
  };

  // ---------- §4 MAC の偽造ゲーム ----------
  W["euf-game"] = (fig) => CE.seq(fig, {
    title: "選択メッセージ攻撃のもとでの偽造（EUF-CMA）ゲーム",
    actors: ["チャレンジャー", "攻撃者 A"],
    start: 1,
    steps: [
      { at: 0, label: "鍵 k を生成", note: "MAC の鍵。攻撃者には見せない。" },
      { from: 1, to: 0, label: "m を送る（何度でも）", note: "タグ生成オラクル: 好きなメッセージにタグを付けてもらえる。" },
      { from: 0, to: 1, label: "t = MAC(k, m)", note: "現実には「正規の通信を大量に観察できる」「自分のデータに正規のタグを付けさせられる」状況。" },
      { from: 1, to: 0, label: "(m*, t*) を提出", note: "m* はまだタグをもらっていない新しいメッセージでなければならない。" },
      { at: 0, label: "Verify(k, m*, t*) を確認", note: "正しいタグなら攻撃者の勝ち（偽造成功）。" },
    ],
    caption: "どんな PPT の攻撃者でも、偽造の成功確率が無視できるとき、MAC は EUF-CMA 安全という。",
  });

  // ---------- §4 HMAC の構造 ----------
  W["hmac-diagram"] = function (fig) {
    frame(fig, "HMAC: 鍵を2回、内側と外側で混ぜる");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 170", role: "img", "aria-label": "HMAC の構造" }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const aid = nextId("hm"); arrowDefs(svg, aid, "var(--muted)");
    const box = (x, y, w, h, t, f) => { svgEl("rect", { x, y, width: w, height: h, rx: 8, fill: f ? "var(--accent-soft)" : "var(--panel)", stroke: f ? "var(--accent)" : "var(--line)" }, svg); svgEl("text", { x: x + w / 2, y: y + h / 2 + 5, "text-anchor": "middle", "font-size": 12.5, class: "mono", fill: "var(--ink)" }, svg, t); };
    const arr = (d) => svgEl("path", { d, stroke: "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
    box(20, 20, 150, 32, "K ⊕ ipad"); box(180, 20, 110, 32, "m"); box(330, 20, 60, 32, "H", true); arr("M290 36H328");
    box(20, 100, 150, 32, "K ⊕ opad"); box(180, 100, 110, 32, "内側の値"); box(330, 100, 60, 32, "H", true); arr("M290 116H328");
    arr("M390 36H420Q440 36 440 56V70Q440 82 420 82H250Q235 82 235 92V98");
    box(450, 100, 170, 32, "tag = HMAC(K, m)"); arr("M390 116H448");
    cap.textContent = "外側のハッシュが内側の出力を包むので、長さ拡張で付け足しても、外側の鍵を知らない限り正しいタグは作れない。ipad = 0x36 の繰り返し、opad = 0x5c の繰り返し。";
  };

  // ---------- §5 暗号化と MAC の組み合わせ方 ----------
  W.compose = function (fig) {
    const c = frame(fig, "暗号化と MAC は、どの順で組み合わせるかで安全性が変わる");
    const ml = el("label", {}, c, "組み合わせ方"); const ms = el("select", { "aria-label": "組み合わせ方" }, ml);
    [["Encrypt-and-MAC（SSH）", "eam"], ["MAC-then-Encrypt（TLS 1.2 以前の CBC）", "mte"], ["Encrypt-then-MAC（IPsec、推奨）", "etm"]].forEach(([t, v], i) => { const o = el("option", { value: v }, ms, t); if (i === 2) o.selected = true; });
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 170", role: "img", "aria-label": "組み合わせの構造" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("cp");
    const NOTE = {
      eam: ["送るもの: Enc(m) と MAC(m)。", "MAC は秘匿性を約束しないので、MAC(m) から平文の情報が漏れうる（同じ平文なら同じタグ、など）。一般には安全とは言えない。"],
      mte: ["送るもの: Enc(m ‖ MAC(m))。", "受信者は復号してからタグを検査する。改ざんされた暗号文でも先に復号・パディング処理が走るので、その反応の違い（エラーの種類や時間）が攻撃の手がかりになる。パディングオラクル攻撃や Lucky Thirteen の原因。"],
      etm: ["送るもの: c = Enc(m) と MAC(c)。", "受信者はまずタグを検査し、改ざんされた暗号文は復号せずに捨てる。暗号化が IND-CPA、MAC が強い偽造不能性を満たせば、全体は IND-CCA かつ暗号文の完全性を満たす（Bellare-Namprempre）。"],
    };
    function draw() {
      const m = ms.value; clear(svg); arrowDefs(svg, aid, "var(--muted)");
      const box = (x, y, w, t, f) => { svgEl("rect", { x, y, width: w, height: 32, rx: 8, fill: f === "e" ? "var(--accent-soft)" : f === "m" ? "var(--good-soft)" : "var(--panel)", stroke: f === "e" ? "var(--accent)" : f === "m" ? "var(--good)" : "var(--line)" }, svg); svgEl("text", { x: x + w / 2, y: y + 21, "text-anchor": "middle", "font-size": 12.5, class: "mono", fill: "var(--ink)" }, svg, t); };
      const arr = (d) => svgEl("path", { d, stroke: "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
      box(20, 66, 60, "m");
      if (m === "eam") { box(140, 20, 90, "Enc", "e"); box(140, 112, 90, "MAC", "m"); arr("M80 82Q110 82 110 50 V36H138"); arr("M80 82Q110 82 110 114V128H138"); box(300, 20, 110, "c"); box(300, 112, 110, "t = MAC(m)"); arr("M230 36H298"); arr("M230 128H298"); box(480, 66, 140, "送信: (c, t)"); arr("M410 36Q450 36 450 70V82H478"); arr("M410 128Q450 128 450 96V82H478"); }
      if (m === "mte") { box(120, 66, 80, "MAC", "m"); arr("M80 82H118"); box(230, 66, 110, "m ‖ t"); arr("M200 82H228"); box(370, 66, 80, "Enc", "e"); arr("M340 82H368"); box(480, 66, 140, "送信: c"); arr("M450 82H478"); }
      if (m === "etm") { box(120, 66, 80, "Enc", "e"); arr("M80 82H118"); box(230, 66, 80, "c"); arr("M200 82H228"); box(350, 112, 80, "MAC", "m"); arr("M310 82Q330 82 330 110V128H348"); box(480, 66, 140, "送信: (c, MAC(c))"); arr("M310 82H478"); arr("M430 128Q455 128 455 100V90H478"); }
      out.innerHTML = `${NOTE[m][0]}<br>${NOTE[m][1]}`;
    }
    ms.addEventListener("change", draw);
    draw();
  };

  // ---------- §5 パディングオラクル攻撃 ----------
  W["padding-oracle"] = function (fig) {
    const c = frame(fig, "「パディングが正しいか」の1ビットだけで、鍵なしに平文を1バイトずつ復元する");
    const sl = el("label", {}, c, "サーバの実装"); const ss = el("select", { "aria-label": "サーバの実装" }, sl);
    el("option", { value: "cbc" }, ss, "AES-CBC: パディングエラーと MAC エラーを区別して返す");
    el("option", { value: "aead" }, ss, "AEAD: 改ざんは一律「認証失敗」で、復号もしない");
    const nav = el("div", { class: "w-controls" }, fig);
    const b1 = button(nav, "1 バイト解く", "primary"), bAll = button(nav, "このブロックを全部解く"), bReset = button(nav, "最初から");
    const grid = el("div", { class: "po" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const plain = enc.encode("uid=1001;role=user;note=hi");
    let key, rk, iv, ct, I, P, j, queries, logs, blocks, target, stuck, recovered;
    function pkcs7(m) { const p = 16 - (m.length % 16), o = new Uint8Array(m.length + p); o.set(m); o.fill(p, m.length); return o; }
    function oracle(ivx, c1) {
      queries++;
      if (ss.value === "aead") return false; // 改ざんされた暗号文は認証で必ず弾かれる
      const d = A.cbcDec(c1, rk, ivx), p = d[15];
      if (p < 1 || p > 16) return false;
      for (let i = 16 - p; i < 16; i++) if (d[i] !== p) return false;
      return true;
    }
    function reset() {
      key = rb(16); rk = A.expandKey(key); iv = rb(16);
      ct = A.cbcEnc(pkcs7(plain), rk, iv); blocks = ct.length / 16;
      target = blocks - 1; I = new Array(16).fill(null); P = new Array(16).fill(null); j = 15; queries = 0; logs = []; stuck = false; recovered = {};
      draw();
    }
    const prevOf = (t) => (t === 0 ? iv : ct.subarray(16 * (t - 1), 16 * t));
    function solveByte() {
      if (j < 0 || stuck) return;
      const C = ct.subarray(16 * target, 16 * target + 16), prev = prevOf(target), p = 16 - j;
      const f = new Uint8Array(16);
      for (let k = j + 1; k < 16; k++) f[k] = I[k] ^ p;
      const start = queries; let hit = null;
      for (let g = 0; g < 256; g++) {
        f[j] = g;
        if (!oracle(f, C)) continue;
        if (j === 15) { const f2 = Uint8Array.from(f); f2[14] ^= 1; if (!oracle(f2, C)) continue; } // 偶然 0x02 0x02 になった場合を除く
        hit = g; break;
      }
      if (hit === null) { stuck = true; logs.unshift(`${j} バイト目: 256 通り試しても「正しい」応答が一度も返らない。攻撃は進めない（${queries - start} 回）`); return; }
      I[j] = hit ^ p; P[j] = I[j] ^ prev[j];
      logs.unshift(`${j} バイト目: 偽の前ブロックの値 ${h2(hit)} で「パディングが正しい（末尾 ${p} バイトが 0x${h2(p)}）」→ 中間値 = ${h2(hit)} ⊕ ${h2(p)} = ${h2(I[j])}、平文 = ${h2(I[j])} ⊕ ${h2(prev[j])} = ${h2(P[j])}（${queries - start} 回）`);
      j--;
      if (j < 0) recovered[target] = show(Uint8Array.from(P));
      if (j < 0 && target > 0) { logs.unshift(`ブロック ${target + 1} を復元: 「${show(Uint8Array.from(P))}」。次は1つ前のブロックへ`); target--; I = new Array(16).fill(null); P.fill(null); j = 15; }
    }
    function draw() {
      clear(grid);
      const C = ct.subarray(16 * target, 16 * target + 16);
      const rows = [["攻撃するブロック C", Array.from(C), null], ["中間値 D_k(C)", I, "mid"], ["平文 = 中間値 ⊕ 前のブロック", P, "pt"]];
      rows.forEach(([lab, arr, kind]) => {
        el("div", { class: "po-label" }, grid, lab);
        const r = el("div", { class: "po-row" }, grid);
        for (let k = 0; k < 16; k++) {
          const v = arr[k];
          const txt = v === null ? "??" : kind === "pt" ? (v >= 32 && v < 127 ? String.fromCharCode(v) : h2(v)) : h2(v);
          el("div", { class: "po-cell" + (k === j && kind ? " cur" : "") + (v !== null && kind ? " done" : "") }, r, txt);
        }
      });
      const all = Object.keys(recovered).length === blocks ? `<br><b style="color:var(--hot)">鍵なしで復元した平文: ${Array.from({ length: blocks }, (_, i) => recovered[i]).join("")}</b>（末尾の · はパディング）` : "";
      out.innerHTML = `<b>サーバへの問い合わせ ${queries.toLocaleString()} 回</b>　（攻撃中のブロック: ${target + 1} / ${blocks}）${all}<br>` + (logs.slice(0, 5).join("<br>") || "「1 バイト解く」を押すと、最後のバイトから順に解きます。1 バイトあたり平均 128 回の問い合わせで済みます。");
      b1.disabled = bAll.disabled = stuck || (j < 0);
    }
    b1.addEventListener("click", () => { solveByte(); draw(); });
    bAll.addEventListener("click", () => { const t = target; while (j >= 0 && !stuck && target === t) solveByte(); draw(); });
    bReset.addEventListener("click", reset); ss.addEventListener("change", reset);
    reset();
  };

  // ---------- §6 ランダムなノンスの上限 ----------
  W["nonce-budget"] = function (fig) {
    const c = frame(fig, "96 ビットのノンスを乱数で選ぶと、何回目で重複が心配になるか");
    const ql = el("label", {}, c); const qh = el("span", {}, ql, "同じ鍵で暗号化するメッセージ数 = 2^"); const qv = el("b", {}, qh, "32");
    const qr = el("input", { type: "range", min: 10, max: 60, value: 32, "aria-label": "メッセージ数" }, ql); qr.style.width = "200px";
    const out = el("div", { class: "w-out" }, fig);
    function draw() {
      const k = Number(qr.value); qv.textContent = k;
      const l = 2 * k - 97; const p = l >= 0 ? 1 : 2 ** l;
      out.innerHTML = `重複の確率 ≈ q²/2^97 = <b>${l >= -1 ? (1 - Math.exp(-(2 ** l))).toFixed(3) : "2^" + l}</b><br>` +
        (k <= 32 ? `<span style="color:var(--good)">NIST SP 800-38D の上限（ランダムな 96 ビット IV で 2^32 回まで）の範囲内。重複の確率は 2^−33 以下</span>`
          : `<span style="color:var(--hot)">上限 2^32 を超えている。鍵を替えるか、重複しないカウンタ方式のノンスにする</span>`) +
        `<br>1 秒に 1 万メッセージなら、2^${k} 回は約 ${(2 ** k / 1e4 / 86400).toLocaleString(undefined, { maximumFractionDigits: 1 })} 日分`;
    }
    qr.addEventListener("input", draw); draw();
  };

  // ---------- §7 パスワードを遅いハッシュで守る ----------
  W["kdf-cost"] = function (fig) {
    const c = frame(fig, "パスワードの推測にかかる時間は、「候補の数」と「1回の計算の重さ」の掛け算");
    const pl = el("label", {}, c, "パスワードの選び方"); const ps = el("select", { "aria-label": "パスワード" }, pl);
    [["4 桁の数字（約 13 ビット）", 13.3], ["英小文字 8 文字をランダム（約 38 ビット）", 37.6], ["辞書の単語 4 つをランダム（約 52 ビット）", 51.7], ["英数字 12 文字をランダム（約 71 ビット）", 71.4]].forEach(([t, v], i) => { const o = el("option", { value: v }, ps, t); if (i === 1) o.selected = true; });
    const hl = el("label", {}, c, "保存の仕方（1回の計算の重さ）"); const hs = el("select", { "aria-label": "保存の仕方" }, hl);
    [["SHA-256 を1回（×1）", 0], ["鍵導出を 1,000 倍重くする（×10^3）", 3], ["10 万倍重くする（×10^5）", 5], ["100 万倍重くする（×10^6）", 6]].forEach(([t, v], i) => { const o = el("option", { value: v }, hs, t); if (i === 0) o.selected = true; });
    const out = el("div", { class: "w-out" }, fig);
    const RATE = 1e10; // 仮定: 攻撃者は高速ハッシュを毎秒 100 億回計算できる
    function fmt(sec) {
      const u = [["秒", 1], ["分", 60], ["時間", 3600], ["日", 86400], ["年", 31557600]];
      let best = u[0]; for (const x of u) if (sec >= x[1]) best = x;
      const v = sec / best[1]; return (v >= 1e6 ? v.toExponential(1) : v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString()) + " " + best[0];
    }
    function draw() {
      const bits = Number(ps.value), f = Number(hs.value);
      const sec = 2 ** (bits - 1) / (RATE / 10 ** f);
      out.innerHTML = `平均で候補の半分を試すとして、推測にかかる時間は <b>${fmt(sec)}</b><br>` +
        `<span style="color:var(--muted)">仮定: 攻撃者は高速なハッシュを毎秒 10^10 回計算できる（GPU を並べた環境の桁の目安）。数字は桁を見るためのもの。</span><br>` +
        `遅いハッシュは攻撃者の手間を定数倍にするだけで、候補の数（エントロピー）が小さいパスワードは守りきれない。両方が要る。`;
    }
    ps.addEventListener("change", draw); hs.addEventListener("change", draw); draw();
  };

  for (const k in W) CE.register(k, W[k]);
})();
