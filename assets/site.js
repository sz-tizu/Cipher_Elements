/* Cipher Elements — 読書の進捗バーとサイト内検索
   - 進捗: 本文ページの左端に縦バーを出す。濃い部分が今の位置、薄い部分がこれまでに読んだ最大位置。
     最大位置はこのブラウザの localStorage に保存し、トップページのカードに表示する。
   - 検索: assets/search-index.json（tools/build.py が生成）を読み、節単位で部分一致検索する。 */
(function () {
  "use strict";

  const KEY = "ce:progress:";
  function loadProgress(page) {
    try { const v = Number(localStorage.getItem(KEY + page)); return Number.isFinite(v) ? v : 0; } catch (e) { return 0; }
  }
  function saveProgress(page, v) {
    try { localStorage.setItem(KEY + page, String(Math.round(v * 1000) / 1000)); } catch (e) { /* 保存できない環境では表示だけ */ }
  }
  const pct = (v) => Math.round(v * 100) + "%";

  // ---------------------------------------------------------------- 進捗バー
  function initReadbar() {
    const bar = document.querySelector(".readbar");
    const article = document.querySelector(".prose");
    const page = document.body.dataset.page;
    if (!bar || !article || !page) return;
    bar.setAttribute("aria-hidden", "false");
    bar.setAttribute("role", "navigation");
    bar.setAttribute("aria-label", "読書の進捗と節の位置");

    const track = document.createElement("div"); track.className = "readbar-track"; bar.appendChild(track);
    const maxFill = document.createElement("div"); maxFill.className = "readbar-max"; track.appendChild(maxFill);
    const fill = document.createElement("div"); fill.className = "readbar-fill"; track.appendChild(fill);
    const badge = document.createElement("div"); badge.className = "readbar-badge"; bar.appendChild(badge);

    // 上部バーの下から始める（スマホでは上部バーが2段になる）
    const topbar = document.querySelector(".topbar");
    const placeBar = () => { bar.style.top = ((topbar ? topbar.offsetHeight : 56) + 16) + "px"; };
    placeBar();
    window.addEventListener("resize", placeBar);

    let best = loadProgress(page);
    const heads = Array.from(article.querySelectorAll("h2[id]"));
    const ticks = heads.map((h) => {
      const a = document.createElement("a");
      a.className = "readbar-tick";
      a.href = "#" + h.id;
      a.setAttribute("aria-label", h.textContent);
      const label = document.createElement("span"); label.textContent = h.textContent; a.appendChild(label);
      bar.appendChild(a);
      return { a, h };
    });

    // 本文の先頭が画面上端に来た時を 0、本文の末尾が画面下端に来た時を 1 とする
    function measure() {
      const r = article.getBoundingClientRect();
      const top = r.top + window.scrollY, height = article.offsetHeight;
      const span = Math.max(1, height - window.innerHeight * 0.6);
      const start = top - 80;
      return { top, height, start, span };
    }
    let m = measure();
    function update() {
      const v = Math.min(1, Math.max(0, (window.scrollY - m.start) / m.span));
      if (v > best) { best = v; saveProgress(page, best); }
      fill.style.height = v * 100 + "%";
      maxFill.style.height = best * 100 + "%";
      badge.style.top = v * 100 + "%";
      badge.textContent = best >= 0.98 ? "読了" : pct(v);
      let current = null;
      for (const t of ticks) {
        const pos = (t.h.getBoundingClientRect().top + window.scrollY - m.start) / m.span;
        t.a.style.top = Math.min(100, Math.max(0, pos * 100)) + "%";
        t.a.classList.toggle("done", pos <= best + 0.001);
        if (t.h.getBoundingClientRect().top < window.innerHeight * 0.35) current = t;
      }
      ticks.forEach((t) => t.a.classList.toggle("here", t === current));
    }
    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", () => { m = measure(); schedule(); });
    // 図やフォントの読み込みで高さが変わるので、少し後にも測り直す
    window.addEventListener("load", () => { m = measure(); update(); });
    if (window.ResizeObserver) new ResizeObserver(() => { m = measure(); schedule(); }).observe(article);
    update();
  }

  // ---------------------------------------------------------------- トップの読了度
  function initMeters() {
    document.querySelectorAll("[data-progress-for]").forEach((el) => {
      const v = loadProgress(el.dataset.progressFor);
      if (v <= 0.01) return;
      el.classList.add("on");
      el.innerHTML = `<span class="readmeter-bar"><span style="width:${Math.round(v * 100)}%"></span></span><span class="readmeter-label">${v >= 0.98 ? "読了" : "読んだ分 " + pct(v)}</span>`;
    });
  }

  // ---------------------------------------------------------------- 検索
  function initSearch() {
    const dialog = document.querySelector("dialog.search");
    const opener = document.querySelector("[data-search-open]");
    if (!dialog || !opener) return;
    const root = dialog.dataset.root || "";
    const input = dialog.querySelector(".search-input");
    const list = dialog.querySelector(".search-results");
    const status = dialog.querySelector(".search-status");
    let index = null, loading = null, active = -1;

    const norm = (s) => s.normalize("NFKC").toLowerCase();
    const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const KIND = { lecture: "講義", note: "補足ノート", guide: "学習ガイド", lab: "ラボ" };

    function load() {
      if (index) return Promise.resolve(index);
      if (!loading) {
        loading = fetch(root + "assets/search-index.json")
          .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
          .then((data) => {
            index = data.map((e) => ({ ...e, _t: norm(e.text), _h: norm(e.section), _p: norm(e.page) }));
            return index;
          });
      }
      return loading;
    }

    function highlight(text, terms) {
      let html = escapeHtml(text);
      for (const t of terms) {
        if (!t) continue;
        const re = new RegExp(escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        html = html.replace(re, (m) => `<mark>${m}</mark>`);
      }
      return html;
    }
    function snippet(e, terms) {
      const t = e.text, low = norm(t);
      let at = -1;
      for (const q of terms) { const i = low.indexOf(q); if (i >= 0 && (at < 0 || i < at)) at = i; }
      if (at < 0) return t.slice(0, 90) + (t.length > 90 ? "…" : "");
      const s = Math.max(0, at - 36), end = Math.min(t.length, at + 70);
      return (s > 0 ? "…" : "") + t.slice(s, end) + (end < t.length ? "…" : "");
    }

    function run() {
      const q = norm(input.value.trim());
      list.innerHTML = ""; active = -1;
      if (!q) { status.textContent = "講義・補足ノート・学習ガイド・ラボを節ごとに検索します。"; return; }
      const terms = q.split(/\s+/).filter(Boolean);
      load().then((idx) => {
        const hits = [];
        for (const e of idx) {
          let score = 0, ok = true;
          for (const t of terms) {
            const inH = e._h.includes(t), inP = e._p.includes(t);
            const count = e._t.split(t).length - 1;
            if (!inH && !inP && !count) { ok = false; break; }
            score += (inH ? 8 : 0) + (inP ? 3 : 0) + Math.min(count, 5);
          }
          if (ok) hits.push({ e, score });
        }
        hits.sort((a, b) => b.score - a.score);
        const shown = hits.slice(0, 30);
        status.textContent = hits.length ? `${hits.length} 件${hits.length > shown.length ? "（上位 30 件を表示）" : ""}` : "見つかりませんでした。別の言い方や、短い語で試してください。";
        for (const { e } of shown) {
          const li = document.createElement("li");
          const href = root + e.url + (e.anchor ? "#" + e.anchor : "");
          li.innerHTML = `<a href="${escapeHtml(href)}">
<span class="sr-meta">${escapeHtml(KIND[e.kind] || "")} · ${highlight(e.page, terms)}</span>
<span class="sr-title">${highlight(e.section || e.page, terms)}</span>
<span class="sr-text">${highlight(snippet(e, terms), terms)}</span></a>`;
          li.querySelector("a").addEventListener("click", () => dialog.close());
          list.appendChild(li);
        }
      }).catch(() => { status.textContent = "検索データを読み込めませんでした。ページを再読み込みしてください。"; });
    }

    function open() {
      if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
      input.select();
      run();
      load().catch(() => {});
    }
    function move(d) {
      const items = list.querySelectorAll("a");
      if (!items.length) return;
      active = (active + d + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle("active", i === active));
      items[active].scrollIntoView({ block: "nearest" });
    }

    opener.addEventListener("click", open);
    let timer = 0;
    input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 80); });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowDown") { ev.preventDefault(); move(1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); move(-1); }
      else if (ev.key === "Enter") {
        const items = list.querySelectorAll("a");
        const target = items[Math.max(0, active)];
        if (target) { ev.preventDefault(); dialog.close(); location.href = target.href; }
      }
    });
    dialog.addEventListener("click", (ev) => { if (ev.target === dialog) dialog.close(); });
    document.addEventListener("keydown", (ev) => {
      const tag = (ev.target.tagName || "").toLowerCase();
      if (ev.key === "/" && !dialog.open && tag !== "input" && tag !== "textarea" && tag !== "select" && !ev.target.isContentEditable) {
        ev.preventDefault(); open();
      }
    });
  }

  function boot() { initReadbar(); initMeters(); initSearch(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
