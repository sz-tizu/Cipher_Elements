/* Cipher Elements — 図の共通部品
   原稿中の <figure class="widget" data-widget="名前"> を見つけて、登録済みの描画関数で描く。
   回ごとの図は assets/w/lecNN.js が CE.register で登録する（build.py が front matter の widgets から読み込む）。
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
  function register(name, fn) { W[name] = fn; }

  // ---------- 汎用: シーケンス図 ----------
  // spec = { title, actors: ["A","B"], steps: [{from:0,to:1,label:"…",note:"…"} | {note:"…", at:0|1|"both"}], caption }
  // 「次へ」で1手ずつ進められる。各手の note がキャプションに出る。
  function seq(fig, spec) {
    const c = frame(fig, spec.title);
    const back = button(c, "戻る"), next = button(c, "次へ", "primary"), all = button(c, "全部表示");
    const n = spec.actors.length, W0 = 640, colW = (W0 - 80) / (n - 1 || 1), top = 54, rowH = spec.rowH || 46;
    const H = top + spec.steps.length * rowH + 24;
    const svg = svgEl("svg", { class: "w-svg", viewBox: `0 0 ${W0} ${H}`, role: "img", "aria-label": spec.title }, fig);
    const cap = el("p", { class: "w-cap" }, fig);
    const aid = nextId("seq");
    let k = spec.start ?? spec.steps.length;
    const X = (i) => 40 + i * colW;
    function draw() {
      clear(svg); arrowDefs(svg, aid, "var(--accent)");
      spec.actors.forEach((a, i) => {
        const w = Math.max(90, a.length * 13 + 24);
        svgEl("rect", { x: X(i) - w / 2, y: 8, width: w, height: 30, rx: 8, fill: "var(--accent-soft)", stroke: "var(--accent)" }, svg);
        svgEl("text", { x: X(i), y: 28, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "var(--ink)" }, svg, a);
        svgEl("line", { x1: X(i), x2: X(i), y1: 38, y2: H - 10, stroke: "var(--line)", "stroke-dasharray": "4 4" }, svg);
      });
      spec.steps.forEach((s, j) => {
        if (j >= k) return;
        const y = top + j * rowH + rowH / 2, on = j === k - 1;
        const color = on ? "var(--hot)" : "var(--accent)";
        if (s.from !== undefined) {
          const x1 = X(s.from), x2 = X(s.to), dir = Math.sign(x2 - x1) || 1;
          svgEl("path", { d: `M${x1 + dir * 4} ${y + 6}H${x2 - dir * 6}`, stroke: color, "stroke-width": on ? 2 : 1.4, fill: "none", "marker-end": `url(#${aid})` }, svg);
          svgEl("text", { x: (x1 + x2) / 2, y: y - 2, "text-anchor": "middle", "font-size": 12.5, class: s.mono ? "mono" : "", fill: "var(--ink)", "font-weight": on ? 700 : 400 }, svg, s.label);
        } else {
          const at = s.at === "both" ? null : (s.at ?? 0);
          const x = at === null ? (X(0) + X(n - 1)) / 2 : X(at);
          const t = svgEl("text", { x, y: y + 4, "text-anchor": at === null ? "middle" : at === 0 ? "start" : at === n - 1 ? "end" : "middle", "font-size": 12, fill: on ? "var(--hot)" : "var(--muted)", "font-weight": on ? 700 : 400 }, svg, s.label);
          if (at === 0) t.setAttribute("x", x + 10); else if (at === n - 1) t.setAttribute("x", x - 10);
          const bb = { w: s.label.length * 12 + 14 };
          const rx = at === null ? x - bb.w / 2 : at === 0 ? x + 4 : at === n - 1 ? x - 4 - bb.w : x - bb.w / 2;
          const r = svgEl("rect", { x: rx, y: y - 12, width: bb.w, height: 24, rx: 6, fill: "var(--bg)", stroke: on ? "var(--hot)" : "var(--line)" }, null);
          svg.insertBefore(r, t);
        }
      });
      const cur = spec.steps[k - 1];
      cap.innerHTML = k === 0 ? (spec.intro || "「次へ」で1手ずつ進めます。") : `<b>手順 ${k} / ${spec.steps.length}</b>　${cur.note || ""}`;
      if (k === spec.steps.length && spec.caption) cap.innerHTML += `<br>${spec.caption}`;
      back.disabled = k === 0; next.disabled = k === spec.steps.length;
    }
    back.addEventListener("click", () => { if (k > 0) { k--; draw(); } });
    next.addEventListener("click", () => { if (k < spec.steps.length) { k++; draw(); } });
    all.addEventListener("click", () => { k = spec.steps.length; draw(); });
    draw();
  }

  window.CE = { svgEl, el, clear, mod, minus, paren, gcd, divisors, bpow, intInput, button, arrowDefs, nextId, frame, register, seq };

  // ---------- boot ----------
  // defer で読み込まれる回ごとのスクリプトが登録を終えてから描く
  function boot() {
    document.querySelectorAll("figure.widget[data-widget]").forEach((fig) => {
      const fn = W[fig.dataset.widget];
      if (!fn) { fig.textContent = "（図「" + fig.dataset.widget + "」が見つかりません）"; return; }
      try { fn(fig); } catch (err) { console.error(err); fig.textContent = "図を表示できませんでした: " + err.message; }
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
