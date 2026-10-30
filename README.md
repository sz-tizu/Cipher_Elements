# Cipher Elements

暗号基礎論の学習ノートです。一暗号技術者として働ける水準をめざして、暗号の土台を数学から順に積み上げます。各回は講義資料・補足ノート・ブラウザで動くラボで構成しています。

GitHub Pages: https://sz-tizu.github.io/cipher_elements/

## 構成

| 回 | 内容 | 状態 |
| --- | --- | --- |
| 第1回 | 数学的基盤（整数論・代数・確率・計算量） | 公開 |
| 第2回 | 暗号の形式的基礎（安全性定義・帰着） | シラバスのみ |
| 第3回 | 共通鍵暗号（PRF/PRP・AES・運用モード） | シラバスのみ |
| 第4回 | ハッシュ・MAC・AEAD | シラバスのみ |
| 第5回 | 公開鍵暗号（RSA・DH・CCA・KEM） | シラバスのみ |
| 第6回 | 署名・PKI・ランダムオラクル | シラバスのみ |
| 第7回 | プロトコルと実装（TLS 1.3・サイドチャネル） | シラバスのみ |
| 第8回 | 発展と、楕円曲線・耐量子暗号との接続 | シラバスのみ |

補足ノート: 拡張ユークリッドの互除法、gcd(a, b) = gcd(b, r) の証明。
ラボ: 第1回の §1〜§7 に対応した実験ページ（`labs/01-lab.html`）。

## ディレクトリ

```
content/          原稿（ここを編集する）
  guide.md        学習ガイド
  lectures/       各回の講義資料。front matter の status: published | planned
  notes/          補足ノート
  labs/           ラボの HTML（そのままコピーされる）
assets/           共通 CSS、動く図（widgets.js）、favicon
tools/build.py    content/ → HTML のビルド
*.html            生成物（GitHub Pages が配信する）
```

## ビルド

```sh
cd tools && npm install && cd ..   # 初回のみ（数式描画用の KaTeX）
python3 tools/build.py             # pip install markdown が必要
```

原稿の書き方:

- 数式は ```` ```latex ```` のコードブロックに書くと、ビルド時に KaTeX で描画されます
- 動く図は `<figure class="widget" data-widget="名前"></figure>` で置きます（名前は `assets/widgets.js` を参照）
- 他のページへのリンクは `{{root}}lectures/…` のように書くと、相対パスに直されます
- 新しい回を公開するときは、`content/lectures/` の該当ファイルを本文に置き換え、`status: published` にします

## GitHub Pages の設定

Settings → Pages で、Source を「Deploy from a branch」、Branch を `main` / `/ (root)` にします。
