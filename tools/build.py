#!/usr/bin/env python3
"""Cipher Elements のサイトをビルドする。

content/ 以下の Markdown 原稿を HTML に変換し、リポジトリ直下に書き出す。
- ```latex のブロックは KaTeX でビルド時に描画する（tools/render-math.mjs）
- <figure class="widget" data-widget="..."> は assets/widgets.js が動く図に置き換える
- 原稿中の {{root}} は、そのページからサイトのルートへの相対パスになる

使い方:  python3 tools/build.py   （初回のみ: cd tools && npm install）
"""
from __future__ import annotations

import html
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import markdown
from markdown.extensions.toc import slugify_unicode

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
TOOLS = ROOT / "tools"
SITE_NAME = "Cipher Elements"
KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
FONTS = (
    "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800"
    "&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap"
)


# ---------------------------------------------------------------- pages
@dataclass
class Page:
    src: Path
    out: Path  # リポジトリ直下からの相対パス
    kind: str  # lecture | note | guide
    meta: dict
    body_md: str
    html: str = ""
    toc: list = field(default_factory=list)

    @property
    def title(self) -> str:
        return self.meta["title"]

    @property
    def step(self) -> int | None:
        return int(self.meta["step"]) if "step" in self.meta else None

    @property
    def status(self) -> str:
        return self.meta.get("status", "published")

    @property
    def root(self) -> str:
        return "../" * (len(self.out.parts) - 1)


def parse_front_matter(text: str) -> tuple[dict, str]:
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}, text
    meta = {}
    for line in m.group(1).splitlines():
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    return meta, text[m.end():]


def load_pages() -> list[Page]:
    pages = []
    for src in sorted(CONTENT.rglob("*.md")):
        rel = src.relative_to(CONTENT)
        kind = {"lectures": "lecture", "notes": "note"}.get(rel.parts[0], "guide")
        meta, body = parse_front_matter(src.read_text(encoding="utf-8"))
        pages.append(Page(src, rel.with_suffix(".html"), kind, meta, body))
    return pages


# ---------------------------------------------------------------- markdown
def slugify(value: str, separator: str) -> str:
    # 「§3 フェルマーの…」は #s3 に固定し、本文からリンクしやすくする
    m = re.match(r"§(\d+)", value)
    if m:
        return f"s{m.group(1)}"
    return slugify_unicode(value, separator)


LATEX_BLOCK = re.compile(r"^```latex\n(.*?)\n```$", re.S | re.M)


def render_markdown(page: Page, math: list[str]) -> None:
    def stash(m: re.Match) -> str:
        math.append(m.group(1).strip())
        return f'\n<div class="math" data-math="{len(math) - 1}"></div>\n'

    text = LATEX_BLOCK.sub(stash, page.body_md)
    text = text.replace("{{root}}", page.root)
    md = markdown.Markdown(
        extensions=["tables", "fenced_code", "sane_lists", "toc", "attr_list", "md_in_html"],
        extension_configs={"toc": {"slugify": slugify, "toc_depth": "2"}},
    )
    page.html = md.convert(text)
    page.toc = [(t["id"], t["name"]) for t in md.toc_tokens]


def render_math(math: list[str]) -> list[str]:
    if not math:
        return []
    proc = subprocess.run(
        ["node", str(TOOLS / "render-math.mjs")],
        input=json.dumps(math), capture_output=True, text=True, cwd=TOOLS,
    )
    if proc.returncode != 0:
        sys.exit("KaTeX の描画に失敗しました:\n" + proc.stderr)
    return json.loads(proc.stdout)


# ---------------------------------------------------------------- templates
def esc(s: str) -> str:
    return html.escape(s, quote=True)


def head(title: str, description: str, root: str, katex: bool = False) -> str:
    full = SITE_NAME if title == SITE_NAME else f"{title} | {SITE_NAME}"
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(full)}</title>
<meta name="description" content="{esc(description)}">
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
{f'<link rel="stylesheet" href="{KATEX_CSS}">' if katex else ''}
<link rel="stylesheet" href="{root}assets/site.css">
</head>"""


def topbar(root: str, active: str) -> str:
    items = [("home", "ホーム", "index.html"), ("guide", "学習ガイド", "guide.html"),
             ("lectures", "講義", "index.html#lectures"), ("lab", "ラボ", "labs/01-lab.html")]
    current = ' aria-current="page"'
    links = "".join(
        f'<a href="{root}{href}"{current if key == active else ""}>{label}</a>'
        for key, label, href in items
    )
    return f"""<header class="topbar"><div class="topbar-inner">
<a class="wordmark" href="{root}index.html"><span class="wm-mark" aria-hidden="true">≡</span>{SITE_NAME}</a>
<div class="topbar-right">
<nav aria-label="サイト">{links}</nav>
<button type="button" class="search-open" data-search-open aria-label="サイト内を検索"><span aria-hidden="true">⌕</span>検索<kbd>/</kbd></button>
</div>
</div></header>
<dialog class="search" data-root="{root}" aria-label="サイト内検索">
<form method="dialog" class="search-box" role="search">
<input type="search" class="search-input" placeholder="キーワードで検索（例: 逆元、IND-CPA、誕生日）" aria-label="検索語" autocomplete="off" spellcheck="false">
<button type="submit" class="search-close" aria-label="閉じる">Esc</button>
</form>
<p class="search-status" aria-live="polite"></p>
<ol class="search-results"></ol>
</dialog>"""


def footer(root: str, widgets: str = "") -> str:
    return f"""<footer class="sitefoot"><div class="sitefoot-inner">
<p>{SITE_NAME} · 暗号基礎論の学習ノート。原稿は <code>content/</code> の Markdown で、<code>tools/build.py</code> で生成しています。</p>
<p>図やラボの計算はすべてブラウザ内で行われます。教科書 RSA などの例は学習用で、実際の暗号化には使えません。</p>
</div></footer>
<script src="{root}assets/widgets.js" defer></script>
{widgets}<script src="{root}assets/site.js" defer></script>"""


STATUS_LABEL = {"published": "公開中", "planned": "準備中"}


def eyebrow(page: Page) -> str:
    parts = []
    if page.kind == "lecture":
        parts.append(f"Step {page.step}")
        if page.meta.get("weeks"):
            parts.append(page.meta["weeks"])
    elif page.kind == "note":
        parts.append(f"補足ノート · 第{page.step}回")
    else:
        parts.append("ロードマップ")
    chip = ""
    if page.kind == "lecture":
        chip = f'<span class="chip chip-{page.status}">{STATUS_LABEL[page.status]}</span>'
    return f'<div class="eyebrow">{" · ".join(parts)}{chip}</div>'


def pager(page: Page, lectures: list[Page]) -> str:
    if page.kind != "lecture":
        return ""
    i = lectures.index(page)
    cells = []
    if i > 0:
        p = lectures[i - 1]
        cells.append(f'<a class="pager-prev" href="{p.out.name}"><small>前の回</small>{esc(p.title)}</a>')
    else:
        cells.append("<span></span>")
    if i + 1 < len(lectures):
        n = lectures[i + 1]
        cells.append(f'<a class="pager-next" href="{n.out.name}"><small>次の回</small>{esc(n.title)}</a>')
    return f'<nav class="pager" aria-label="前後の回">{"".join(cells)}</nav>'


def related(page: Page, pages: list[Page]) -> str:
    if page.kind != "lecture" or page.status != "published":
        return ""
    notes = [p for p in pages if p.kind == "note" and p.step == page.step]
    if not notes:
        return ""
    items = "".join(f'<li><a href="{page.root}{p.out.as_posix()}">{esc(p.title)}</a></li>' for p in notes)
    return f'<aside class="related"><h2>この回の補足ノート</h2><ul>{items}</ul></aside>'


def page_scripts(page: Page) -> str:
    """front matter の widgets: lec01, lec02 … に対応する図のスクリプトを読み込む。"""
    names = [n.strip() for n in page.meta.get("widgets", "").split(",") if n.strip()]
    out = ""
    for n in names:
        if not (ROOT / "assets" / "w" / f"{n}.js").exists():
            sys.exit(f"{page.src}: assets/w/{n}.js がありません")
        out += f'<script src="{page.root}assets/w/{n}.js" defer></script>\n'
    return out


def render_page(page: Page, pages: list[Page], lectures: list[Page]) -> str:
    toc = ""
    if len(page.toc) > 2:
        links = "".join(f'<li><a href="#{i}">{esc(n)}</a></li>' for i, n in page.toc)
        toc = f'<aside class="toc"><details open><summary>目次</summary><ol>{links}</ol></details></aside>'
    active = {"guide": "guide", "lecture": "lectures", "note": "lectures"}[page.kind]
    return f"""{head(page.title, page.meta.get('description', ''), page.root, katex='class="math"' in page.html)}
<body class="page-{page.kind}" data-page="{page.out.as_posix()}">
<div class="readbar" aria-hidden="true"></div>
{topbar(page.root, active)}
<main class="doc">
<div class="doc-grid">
<header class="doc-head">
{eyebrow(page)}
<h1>{esc(page.title)}</h1>
<p class="doc-lead">{esc(page.meta.get('description', ''))}</p>
</header>
{toc}
<article class="prose">
{page.html}
{related(page, pages)}
{pager(page, lectures)}
</article>
</div>
</main>
{footer(page.root, page_scripts(page))}
</body>
</html>
"""


# ---------------------------------------------------------------- index
def render_index(pages: list[Page], lectures: list[Page]) -> str:
    notes = [p for p in pages if p.kind == "note"]
    published = sum(1 for p in lectures if p.status == "published")

    steps = "".join(
        f'<a class="track-step track-{p.status}" href="{p.out.as_posix()}" title="{esc(p.title)}">'
        f'<span class="track-n">{p.step}</span></a>'
        for p in lectures
    )
    cards = []
    for p in lectures:
        cards.append(f"""<li class="lec lec-{p.status}">
<a href="{p.out.as_posix()}">
<span class="lec-n">{p.step:02d}</span>
<span class="lec-body">
<span class="lec-meta">{esc(p.meta.get('weeks', ''))}<span class="chip chip-{p.status}">{STATUS_LABEL[p.status]}</span></span>
<span class="lec-title">{esc(p.title.split(' ', 1)[-1])}</span>
<span class="lec-desc">{esc(p.meta.get('description', ''))}</span>
<span class="readmeter" data-progress-for="{p.out.as_posix()}"></span>
</span></a></li>""")
    note_items = "".join(
        f'<li><a href="{p.out.as_posix()}"><span class="note-title">{esc(p.title)}</span>'
        f'<span class="note-desc">{esc(p.meta.get("description", ""))}</span>'
        f'<span class="readmeter" data-progress-for="{p.out.as_posix()}"></span></a></li>'
        for p in notes
    )
    return f"""{head(SITE_NAME, '暗号基礎論を、数を動かしながら学ぶ学習ノート。16週・8ステップの講義資料とラボ。', '')}
<body class="page-home">
{topbar('', 'home')}
<main class="home">
<section class="hero">
<p class="eyebrow">暗号基礎論 · 学習ノート</p>
<h1>Cipher Elements</h1>
<p class="hero-lead">一暗号技術者として働ける水準をめざして、暗号の土台を数学から順に積み上げる講義資料です。各回は講義資料・補足ノート・ブラウザで動くラボの3点で構成しています。</p>
<div class="track" aria-label="進捗: 全8回中 {published} 回公開">
<div class="track-row">{steps}</div>
<p class="track-cap">全8回 · 公開 {published} 回 · 約16週の計画</p>
</div>
<div class="hero-actions">
<a class="btn" href="{lectures[0].out.as_posix()}">第1回から読む</a>
<a class="btn ghost" href="guide.html">学習ガイドを見る</a>
</div>
</section>

<section class="block" id="lectures">
<h2>講義</h2>
<p class="block-lead">Step 1 から順に進む前提で組んでいます。各回は「この回の地図」で問いと流れを示してから本論に入り、動かせる図と解答つきの演習を添えています。</p>
<ol class="lec-list">{''.join(cards)}</ol>
</section>

<section class="block two">
<div>
<h2>補足ノート</h2>
<p class="block-lead">講義で引っかかりやすい箇所を、1つの問いに絞って掘り下げたノートです。</p>
<ul class="note-list">{note_items}</ul>
</div>
<div>
<h2>ラボ</h2>
<a class="lab-card" href="labs/01-lab.html">
<span class="lab-tag">第1回 付属</span>
<span class="lab-title">暗号数学ラボ</span>
<span class="lab-desc">時計算術、拡張互除法、square-and-multiply とおもちゃの RSA、中国剰余定理、巡回群、誕生日攻撃、無視できる関数。数字を変えると図と計算がその場で変わります。</span>
<code class="lab-sample">3^13 mod 7 = 3　·　7⁻¹ ≡ 23 (mod 40)</code>
</a>
</div>
</section>

<section class="block">
<h2>進め方</h2>
<ol class="howto">
<li><b>定義から読む。</b>何を安全と呼ぶか（攻撃者が何をできて、何をすれば勝ちか）を最初に押さえます。</li>
<li><b>手で計算し、ラボで確かめる。</b>小さな数で手計算したあと、ラボで数を変えて規則を確認します。</li>
<li><b>到達チェックに文章で答える。</b>答えられないうちは次の回に進みません。</li>
<li><b>壊れた例を1つ再現する。</b>毎週、その回の攻撃を1つ実装して再現します。</li>
</ol>
</section>
</main>
{footer('')}
</body>
</html>
"""


# ---------------------------------------------------------------- lab
def build_lab() -> None:
    src = (CONTENT / "labs" / "01-lab.html")
    text = src.read_text(encoding="utf-8")
    head_part, _, body_part = text.partition('<div class="wrap">')
    head_part = head_part.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
    out = f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
{head_part.strip()}
</head>
<body>
<div class="wrap">{body_part}
</body>
</html>
"""
    dest = ROOT / "labs" / "01-lab.html"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(out, encoding="utf-8")


# ---------------------------------------------------------------- search index
def plain_text(fragment: str) -> str:
    fragment = re.sub(r'<div class="math">.*?</div>\s*(?=<|$)', " ", fragment, flags=re.S)  # KaTeX の HTML は除く
    fragment = re.sub(r"<figure.*?</figure>", " ", fragment, flags=re.S)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def search_entries(page: Page) -> list[dict]:
    """ページを h2 / h3 ごとの節に分けて、検索用の文書にする。"""
    entries = []
    head = {"page": page.title, "url": page.out.as_posix(), "kind": page.kind}
    parts = re.split(r'(<h[23] id="[^"]+">.*?</h[23]>)', page.html, flags=re.S)
    intro = plain_text(parts[0])
    entries.append({**head, "section": "", "anchor": "", "text": (page.meta.get("description", "") + " " + intro).strip()})
    h2 = ""
    for i in range(1, len(parts), 2):
        m = re.match(r'<h([23]) id="([^"]+)">(.*?)</h[23]>', parts[i], re.S)
        level, anchor, title = m.group(1), m.group(2), plain_text(m.group(3))
        if level == "2":
            h2 = title
            section = title
        else:
            section = f"{h2} › {title}" if h2 else title
        entries.append({**head, "section": section, "anchor": anchor, "text": plain_text(parts[i + 1])})
    return entries


def lab_entries() -> list[dict]:
    text = (CONTENT / "labs" / "01-lab.html").read_text(encoding="utf-8")
    entries = []
    for m in re.finditer(r'<section class="view" id="v-(\w+)".*?<h2>(.*?)</h2>\s*<p class="lead">(.*?)</p>', text, re.S):
        entries.append({"page": "暗号数学ラボ 第1回", "url": "labs/01-lab.html", "kind": "lab",
                        "section": plain_text(m.group(2)), "anchor": m.group(1), "text": plain_text(m.group(3))})
    return entries


def write_search_index(pages: list[Page]) -> int:
    entries = [e for p in pages for e in search_entries(p)] + lab_entries()
    entries = [e for e in entries if e["text"] or e["section"]]
    (ROOT / "assets" / "search-index.json").write_text(
        json.dumps(entries, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return len(entries)


# ---------------------------------------------------------------- main
def main() -> None:
    pages = load_pages()
    lectures = sorted((p for p in pages if p.kind == "lecture"), key=lambda p: p.step)

    math: list[str] = []
    for page in pages:
        render_markdown(page, math)
    rendered = render_math(math)
    for page in pages:
        page.html = re.sub(
            r'<div class="math" data-math="(\d+)"></div>',
            lambda m: f'<div class="math">{rendered[int(m.group(1))]}</div>',
            page.html,
        )

    for page in pages:
        dest = ROOT / page.out
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(render_page(page, pages, lectures), encoding="utf-8")
    (ROOT / "index.html").write_text(render_index(pages, lectures), encoding="utf-8")
    build_lab()
    n = write_search_index(pages)
    print(f"built {len(pages) + 2} pages ({len(math)} formulas, {n} search entries)")


if __name__ == "__main__":
    main()
