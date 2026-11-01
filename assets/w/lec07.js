/* 第7回 プロトコルと実装 の図 */
(function () {
  "use strict";
  const { svgEl, el, clear, button, arrowDefs, nextId, frame } = CE;
  const W = {};

  // ---------- §1 素朴なプロトコルへの反射攻撃 ----------
  W["reflection"] = (fig) => CE.seq(fig, {
    title: "素朴な相互認証: 「同じ鍵で、相手の問題に答える」だけだと、相手自身に答えさせられる",
    actors: ["攻撃者（アリスのふり）", "ボブ（鍵 k）"],
    start: 1,
    rowH: 44,
    steps: [
      { from: 0, to: 1, label: "セッション1: 「アリスです。問題 N₁ を解いて」", note: "攻撃者は k を知らない。まずボブに問題を出す。" },
      { from: 1, to: 0, label: "MAC_k(N₁) と、問題 N₂", note: "ボブは N₁ に答え、逆に攻撃者へ問題 N₂ を出す。攻撃者は MAC_k(N₂) を作れない。" },
      { from: 0, to: 1, label: "セッション2: 「アリスです。問題 N₂ を解いて」", note: "別のセッションを開き、ボブ自身に N₂ を出題する。" },
      { from: 1, to: 0, label: "MAC_k(N₂) と、問題 N₃", note: "ボブは素直に N₂ の答えを返してしまう。" },
      { from: 0, to: 1, label: "セッション1に MAC_k(N₂) を返す", note: "攻撃者は k を知らないまま、セッション1 でアリスとして認証された。" },
    ],
    caption: "対策は、MAC の中に「誰から誰へ」「どのセッションの何番目か」を入れること。TLS 1.3 はやり取り全体のハッシュ（トランスクリプト）に署名・MAC する。",
  });

  // ---------- §2 TLS 1.3 ハンドシェイク ----------
  W["tls13"] = (fig) => CE.seq(fig, {
    title: "TLS 1.3 の完全なハンドシェイク（1-RTT）。{ } は暗号化されている",
    actors: ["クライアント", "サーバ"],
    start: 1,
    rowH: 42,
    steps: [
      { from: 0, to: 1, label: "ClientHello + key_share（g^a）", note: "対応する暗号スイートと、DH の公開値を最初から送る（推測して送るので1往復で済む）。耐量子ではここに ML-KEM の公開鍵も入る。" },
      { from: 1, to: 0, label: "ServerHello + key_share（g^b）", note: "サーバも DH の公開値を返す。ここで両者が g^ab を計算でき、以降はすべて暗号化される。" },
      { from: 1, to: 0, label: "{EncryptedExtensions}", note: "追加の設定。TLS 1.2 と違い、平文では送らない。" },
      { from: 1, to: 0, label: "{Certificate}", note: "サーバの証明書チェーン（第6回）。暗号化されているので、盗聴者にはどのサイトの証明書か見えない。" },
      { from: 1, to: 0, label: "{CertificateVerify}", note: "ここまでのやり取り全体のハッシュに、証明書の秘密鍵で署名する。これで「g^b を送ったのは証明書の持ち主」と分かり、中間者攻撃が防がれる。" },
      { from: 1, to: 0, label: "{Finished}", note: "ハンドシェイク全体への MAC。途中で何か書き換えられていれば一致しない。" },
      { from: 0, to: 1, label: "{Finished}", note: "クライアントも同じ確認をする。" },
      { from: 0, to: 1, label: "[アプリのデータ]", note: "アプリ用の鍵（Master Secret から導出）で AEAD 暗号化して送る。サーバは2つ目のメッセージの直後から送れる。" },
    ],
    caption: "DH（第5回）で鍵を作り、署名（第6回）で相手を確かめ、HKDF（第4回）で鍵を分け、AEAD（第4回）でデータを守る。部品が全部そろっている。",
  });

  // ---------- §3 鍵スケジュール ----------
  W["key-schedule"] = function (fig) {
    const c = frame(fig, "鍵スケジュール: 攻撃者がどの秘密を知っていると、どこまで計算できるか");
    const st = { psk: false, dh: false, sig: false };
    const labels = { psk: "事前共有鍵（PSK、再接続用）", dh: "このセッションの DH 秘密 g^ab", sig: "サーバの長期の署名鍵" };
    const box = el("div", { class: "w-chips cert-opts" }, c);
    for (const k of ["sig", "psk", "dh"]) {
      const lab = el("label", { class: "w-chip" }, box);
      const cb = el("input", { type: "checkbox" }, lab);
      lab.appendChild(document.createTextNode(" 攻撃者が知っている: " + labels[k]));
      cb.addEventListener("change", () => { st[k] = cb.checked; draw(); });
    }
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 400", role: "img", "aria-label": "TLS 1.3 鍵スケジュール" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    const aid = nextId("ks");
    function node(x, y, w, t, sub, known) {
      svgEl("rect", { x: x - w / 2, y: y - 17, width: w, height: 34, rx: 8, fill: known ? "var(--hot-soft)" : "var(--panel)", stroke: known ? "var(--hot)" : "var(--line)", "stroke-width": known ? 2 : 1.2 }, svg);
      svgEl("text", { x, y: sub ? y - 2 : y + 4, "text-anchor": "middle", "font-size": 12.5, "font-weight": 700, fill: "var(--ink)" }, svg, t);
      if (sub) svgEl("text", { x, y: y + 12, "text-anchor": "middle", "font-size": 10.5, fill: "var(--muted)" }, svg, sub);
    }
    function input(x, y, t, known) {
      svgEl("text", { x, y: y + 4, "text-anchor": "end", "font-size": 12, fill: known ? "var(--hot)" : "var(--muted)", "font-weight": known ? 700 : 400 }, svg, t);
    }
    const line = (d) => svgEl("path", { d, stroke: "var(--muted)", "stroke-width": 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
    function draw() {
      clear(svg); arrowDefs(svg, aid, "var(--muted)");
      const early = st.psk || true; // PSK なしなら Early Secret は公開の 0 から作られる
      const earlyKnown = early;
      const hs = earlyKnown && st.dh, ms = hs;
      const X0 = 260;
      input(170, 40, st.psk ? "PSK（漏洩）" : "PSK なし → 0（公開）", st.psk);
      line("M175 40H200");
      node(X0, 40, 120, "Early Secret", "HKDF-Extract", earlyKnown);
      line(`M${X0} 57V108`);
      input(170, 125, st.dh ? "g^ab（漏洩）" : "g^ab（DH 秘密）", st.dh);
      line("M175 125H200");
      node(X0, 125, 120, "Handshake Secret", "HKDF-Extract", hs);
      line(`M${X0 + 60} 125H418`);
      node(510, 125, 180, "ハンドシェイク鍵", "証明書や Finished を暗号化", hs);
      line(`M${X0} 142V203`);
      input(170, 220, "0", false);
      line("M175 220H200");
      node(X0, 220, 120, "Master Secret", "HKDF-Extract", ms);
      line(`M${X0 + 60} 220H418`);
      node(510, 220, 180, "アプリのトラフィック鍵", "データを AEAD で暗号化", ms);
      line(`M${X0} 237V298`);
      node(X0, 315, 160, "再開用の秘密", "次回の PSK になる", ms);
      svgEl("text", { x: 510, y: 300, "text-anchor": "middle", "font-size": 11.5, fill: "var(--muted)" }, svg, "各段で、やり取り全体のハッシュ");
      svgEl("text", { x: 510, y: 316, "text-anchor": "middle", "font-size": 11.5, fill: "var(--muted)" }, svg, "（トランスクリプト）も混ぜる");
      svgEl("text", { x: 20, y: 372, "font-size": 12, fill: st.sig ? "var(--hot)" : "var(--muted)", "font-weight": st.sig ? 700 : 400 }, svg,
        st.sig ? "署名鍵は鍵スケジュールのどこにも入らない → 過去の通信は読めない。ただし今後はサーバになりすませる" : "署名鍵は、CertificateVerify の署名にだけ使われ、鍵の計算には入らない");
      let msg;
      if (ms) msg = '<b style="color:var(--hot)">このセッションは読める</b>: DH 秘密が漏れると、その下の鍵がすべて計算できる。だから DH の秘密は使い終わったらすぐ消す';
      else if (st.psk) msg = '<b>Early Secret だけ計算できる</b>: PSK が漏れると、0-RTT で送られた早期データは読まれる。ただし DH を併用していれば、本体のデータは守られる';
      else msg = '<b style="color:var(--good)">このセッションは読めない</b>: 長期の鍵が漏れても、毎回使い捨てる DH 秘密がなければ鍵にたどり着けない（前方秘匿性）。Early Secret が赤いのは、PSK がないと公開の 0 から作られ、誰でも計算できるから';
      out.innerHTML = msg;
    }
    draw();
  };

  // ---------- §4 前方秘匿性 ----------
  W["forward-secrecy"] = function (fig) {
    const c = frame(fig, "前方秘匿性: 長期の鍵が漏れたとき、録画しておいた過去の通信は読めるか");
    const modes = { rsa: "RSA 鍵輸送（TLS 1.2 の古い方式）", dhe: "使い捨ての DH（TLS 1.3 は必ずこれ）" };
    let mode = "rsa", leaked = false;
    const sel = el("select", { "aria-label": "鍵交換の方式" }, el("label", {}, c, "鍵交換の方式"));
    for (const k in modes) el("option", { value: k }, sel, modes[k]);
    const leak = button(c, "6日目: サーバの秘密鍵が漏れた", "primary");
    const reset = button(c, "最初から");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 190", role: "img", "aria-label": "セッションの一覧" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    function draw() {
      clear(svg);
      for (let d = 1; d <= 7; d++) {
        const x = 20 + (d - 1) * 88, past = d < 6;
        const readable = leaked && (mode === "rsa" ? true : d >= 6 ? "imp" : false);
        const col = !leaked ? "var(--line)" : readable === true ? "var(--hot)" : readable === "imp" ? "var(--warn, #b7791f)" : "var(--good)";
        svgEl("rect", { x, y: 40, width: 76, height: 70, rx: 8, fill: leaked ? (readable === true ? "var(--hot-soft)" : readable === "imp" ? "var(--panel)" : "var(--good-soft)") : "var(--panel)", stroke: col, "stroke-width": 1.8 }, svg);
        svgEl("text", { x: x + 38, y: 64, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "var(--ink)" }, svg, `${d}日目`);
        svgEl("text", { x: x + 38, y: 86, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" }, svg, past ? "録画済み" : "これから");
        if (leaked) svgEl("text", { x: x + 38, y: 102, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: col }, svg, readable === true ? "読める" : readable === "imp" ? "なりすまし可" : "読めない");
      }
      if (leaked) {
        svgEl("path", { d: "M460 30V130", stroke: "var(--hot)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
        svgEl("text", { x: 466, y: 145, "font-size": 12, fill: "var(--hot)", "font-weight": 700 }, svg, "鍵の漏洩");
      }
      svgEl("text", { x: 20, y: 172, "font-size": 12, fill: "var(--muted)" }, svg, "攻撃者は1日目から、暗号化された通信をすべて録画している");
      out.innerHTML = !leaked ? "方式を選んで、鍵を漏らしてみてください。"
        : mode === "rsa" ? '<b style="color:var(--hot)">過去の通信もすべて読める</b>: RSA 鍵輸送では、セッション鍵をサーバの公開鍵で暗号化して送っていた。録画した暗号文をサーバの秘密鍵で開けば、過去のセッション鍵が全部出てくる'
        : '<b style="color:var(--good)">過去の通信は読めない</b>: セッション鍵は毎回使い捨ての DH 秘密から作られ、使ったあとは消されている。漏れた署名鍵でできるのは、これからサーバになりすますこと（中間者攻撃）だけ';
    }
    sel.addEventListener("change", () => { mode = sel.value; draw(); });
    leak.addEventListener("click", () => { leaked = true; draw(); });
    reset.addEventListener("click", () => { leaked = false; draw(); });
    draw();
  };

  // ---------- §5 ダブルラチェット ----------
  W["ratchet"] = function (fig) {
    const c = frame(fig, "ダブルラチェット: 端末の中身が盗まれても、過去は守られ、未来は回復する");
    const send = button(c, "同じ人が続けて送る", "primary");
    const reply = button(c, "相手が返信する（新しい DH）");
    const steal = button(c, "今、端末の鍵が盗まれた");
    const reset = button(c, "最初から");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 200", role: "img", "aria-label": "メッセージ鍵の状態" }, fig);
    const out = el("div", { class: "w-out" }, fig);
    let msgs, epoch, stolenAt;
    function init() { msgs = []; epoch = 0; stolenAt = null; for (let i = 0; i < 3; i++) msgs.push({ epoch: 0, who: 0 }); draw(); }
    let stolenEpoch = 0;
    function draw() {
      clear(svg);
      const n = msgs.length, w = Math.min(70, 600 / Math.max(n, 1));
      msgs.forEach((m, i) => {
        const s = stolenAt === null ? "none" : i < stolenAt ? "past" : m.epoch === stolenEpoch ? "read" : "healed";
        const x = 20 + i * w, y = m.who === 0 ? 50 : 112;
        const fill = { none: "var(--panel)", past: "var(--good-soft)", read: "var(--hot-soft)", healed: "var(--good-soft)" }[s];
        const stroke = { none: "var(--line)", past: "var(--good)", read: "var(--hot)", healed: "var(--good)" }[s];
        svgEl("rect", { x, y, width: w - 8, height: 36, rx: 6, fill, stroke, "stroke-width": 1.6 }, svg);
        svgEl("text", { x: x + (w - 8) / 2, y: y + 15, "text-anchor": "middle", "font-size": 11, fill: "var(--ink)", "font-weight": 700 }, svg, `#${i + 1}`);
        svgEl("text", { x: x + (w - 8) / 2, y: y + 29, "text-anchor": "middle", "font-size": 10, fill: "var(--muted)" }, svg, `鎖${m.epoch + 1}`);
      });
      svgEl("text", { x: 20, y: 40, "font-size": 11.5, fill: "var(--muted)" }, svg, "アリスが送信");
      svgEl("text", { x: 20, y: 106, "font-size": 11.5, fill: "var(--muted)" }, svg, "ボブが送信");
      if (stolenAt !== null) {
        const x = 20 + stolenAt * w - 4;
        svgEl("path", { d: `M${x} 30V160`, stroke: "var(--hot)", "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
        svgEl("text", { x: x + 4, y: 178, "font-size": 12, fill: "var(--hot)", "font-weight": 700 }, svg, "盗まれた時点");
      }
      const read = stolenAt === null ? 0 : msgs.filter((m, i) => i >= stolenAt && m.epoch === stolenEpoch).length;
      out.innerHTML = stolenAt === null
        ? "送信のたびに、鎖の鍵を一方向の KDF で1歩進め、そこからメッセージ鍵を作ります（対称ラチェット）。返信のたびに新しい DH で鎖を作り直します（DH ラチェット）。"
        : `<span class="lbl">過去</span>盗まれる前のメッセージは読めない。鎖の鍵は一方向にしか進まないので、今の鍵から昔の鍵は戻せない（前方秘匿性）<br>` +
          `<span class="lbl">同じ鎖</span>盗まれた鎖の続き ${read} 通は読まれる（赤）<br>` +
          `<span class="lbl">回復</span>相手が返信して新しい DH が混ざると、攻撃者の知らない秘密が入り、以後は読めなくなる（侵害後の安全性）`;
    }
    send.addEventListener("click", () => { const last = msgs[msgs.length - 1]; msgs.push({ epoch, who: last ? last.who : 0 }); if (msgs.length > 9) msgs.shift(), stolenAt !== null && stolenAt--; draw(); });
    reply.addEventListener("click", () => { epoch++; const last = msgs[msgs.length - 1]; msgs.push({ epoch, who: last ? 1 - last.who : 1 }); if (msgs.length > 9) msgs.shift(), stolenAt !== null && stolenAt--; draw(); });
    steal.addEventListener("click", () => { stolenAt = msgs.length; stolenEpoch = epoch; draw(); });
    reset.addEventListener("click", init);
    init();
  };

  // ---------- §6 タイミング攻撃 ----------
  W["timing"] = function (fig) {
    const c = frame(fig, "タイミング攻撃: 比較が「違った所で止まる」と、正しいタグを1バイトずつ当てられる");
    const ct = el("input", { type: "checkbox" }, el("label", { class: "w-check" }, c, ""));
    ct.parentNode.appendChild(document.createTextNode(" 定数時間の比較にする"));
    const step = button(c, "次の1バイトを当てる", "primary");
    const all = button(c, "最後まで");
    const reset = button(c, "最初から");
    const svg = svgEl("svg", { class: "w-svg", viewBox: "0 0 640 170", role: "img", "aria-label": "候補ごとの応答時間" }, fig);
    const out = el("div", { class: "w-out cbc" }, fig);
    const LEN = 4, SAMPLES = 50;
    let secret, guess, queries, last;
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    function serverTime(tag) {
      // 1バイト比べるごとに 20 単位かかる。雑音は標準偏差 25
      let cost;
      if (ct.checked) cost = LEN * 20;
      else { cost = 0; for (let i = 0; i < LEN; i++) { if (tag[i] !== secret[i]) break; cost += 20; } }
      queries++;
      return 100 + cost + gauss() * 25;
    }
    function init() { secret = Array.from(crypto.getRandomValues(new Uint8Array(LEN))); guess = []; queries = 0; last = null; draw(); }
    function next() {
      if (guess.length >= LEN) return;
      const pos = guess.length, avg = new Array(256).fill(0);
      for (let b = 0; b < 256; b++) {
        const tag = guess.concat([b], new Array(LEN - pos - 1).fill(0));
        let s = 0; for (let k = 0; k < SAMPLES; k++) s += serverTime(tag);
        avg[b] = s / SAMPLES;
      }
      let best = 0; for (let b = 1; b < 256; b++) if (avg[b] > avg[best]) best = b;
      guess.push(best); last = { avg, best, pos }; draw();
    }
    const h2 = (b) => b.toString(16).padStart(2, "0");
    function draw() {
      clear(svg);
      if (last) {
        const mn = Math.min(...last.avg), mx = Math.max(...last.avg);
        last.avg.forEach((v, b) => {
          const hgt = 10 + ((v - mn) / (mx - mn || 1)) * 110;
          const isS = b === secret[last.pos], isB = b === last.best;
          svgEl("rect", { x: 20 + b * 2.35, y: 140 - hgt, width: 1.9, height: hgt, fill: isB ? (isS ? "var(--good)" : "var(--hot)") : "var(--accent)", opacity: isB ? 1 : 0.45 }, svg);
        });
        svgEl("text", { x: 20, y: 160, "font-size": 11.5, fill: "var(--muted)" }, svg, `${last.pos + 1} バイト目の候補 00〜ff と、平均の応答時間（各 ${SAMPLES} 回測定）。一番長い候補を採用`);
      } else svgEl("text", { x: 320, y: 85, "text-anchor": "middle", "font-size": 13, fill: "var(--muted)" }, svg, "「次の1バイトを当てる」を押してください");
      const okAll = guess.length === LEN && guess.every((g, i) => g === secret[i]);
      out.innerHTML = `<span class="lbl">正しいタグ</span>${secret.map(h2).join(" ")}（攻撃者には見えない）<br>` +
        `<span class="lbl">推測</span>${guess.map((g, i) => `<b style="color:${g === secret[i] ? "var(--good)" : "var(--hot)"}">${h2(g)}</b>`).join(" ")}${" __".repeat(LEN - guess.length)}<br>` +
        `<span class="lbl">問い合わせ</span>${queries.toLocaleString()} 回（総当たりなら 2^32 ≈ 43 億通り）` +
        (guess.length === LEN ? `<br><span class="lbl">結果</span>${okAll ? '<b style="color:var(--hot)">タグを当てた。偽造したメッセージが受理される</b>' : (ct.checked ? '<b style="color:var(--good)">外れ。時間に差がないので、手がかりがない</b>' : '<b>外れ。雑音に負けた。測定回数を増やせば当たる</b>')}` : "");
    }
    step.addEventListener("click", next);
    all.addEventListener("click", () => { while (guess.length < LEN) next(); });
    reset.addEventListener("click", init);
    ct.addEventListener("change", init);
    init();
  };

  for (const k in W) CE.register(k, W[k]);
})();
