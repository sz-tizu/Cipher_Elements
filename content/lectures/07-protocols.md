---
title: 第7回 プロトコルと実装
step: 7
status: planned
weeks: 11〜13週
description: 部品が安全でも、組み合わせ方と実装で壊れるのが実務の現実です。
---

<div class="notice">この回の講義資料は準備中です。下は学習ガイドから抜き出したシラバスで、講義資料が公開されるとこのページが置き換わります。</div>

この Step では、これまでの部品が TLS や Signal の中でどう組まれているかを読み、実装レベルの攻撃への感覚を作ります。実務で最も価値が出る部分でもあります。

### 学ぶこと

- 認証付き鍵交換（AKE）の要件: 前方秘匿性、鍵漏洩なりすまし（KCI）耐性、ダウングレード攻撃への耐性、リプレイ対策
- TLS 1.3（RFC 8446）: 次の流れを追えるようにする
  1. ClientHello に鍵共有（ECDHE の公開値）を載せ、1往復目で共有秘密を確立する
  2. HKDF による鍵スケジュールで、ハンドシェイク用とアプリケーション用の鍵を分ける
  3. サーバ証明書と署名（CertificateVerify）でサーバを認証し、Finished で全体の改ざんを検出する
  4. 以降は AEAD のみ。RSA 鍵交換、CBC、RC4、圧縮は廃止された。0-RTT はリプレイに注意が必要
- メッセンジャー系: Signal の X3DH と Double Ratchet（過去と未来の両方向で漏洩被害を限定する）、Noise Protocol Framework、WireGuard
- パスワード認証: PAKE（SRP、OPAQUE）の目的は、パスワードそのものをサーバに渡さずに認証すること
- サイドチャネル: タイミング、キャッシュ、電力。定数時間実装と、秘密依存の分岐やテーブル参照を避ける理由
- 典型的な実装ミス: ノンス再利用、乱数不良（Debian OpenSSL の乱数バグ）、MAC の非定数時間比較、API の誤用（デフォルトが ECB など）、エラーメッセージで状態が漏れるオラクル
- 鍵管理: 鍵のライフサイクル、封筒暗号（KMS で鍵を包む構成）、HSM、鍵ローテーション。NIST SP 800-57 が基本資料
- 形式検証の入口: ProVerif や Tamarin でプロトコルを機械的に検証できることを知る（深入りは不要）

### 読む

- Aumasson, Serious Cryptography（第2版）: 実装と TLS の章。実務寄りの全体像に向く
- Ferguson, Schneier & Kohno, Cryptography Engineering: 設計判断の考え方
- RFC 8446（TLS 1.3）、Signal の X3DH と Double Ratchet の仕様書、Noise の仕様書
- Bernstein, Cache-timing attacks on AES（2005）、Al Fardan & Paterson の Lucky Thirteen 論文

### 手を動かす

1. Wireshark と SSLKEYLOGFILE で TLS 1.3 のハンドシェイクを観察し、上の1〜4と対応づける
2. ECDHE、HKDF、AEAD で小さな安全チャネルを Python で組む（学習用。本番では使わない）
3. 非定数時間の MAC 比較に対するタイミング攻撃を、ローカルサーバ相手に再現する（Cryptopals Set 4）
4. AWS KMS を使った封筒暗号の実装を試し、鍵階層とローテーションの流れを確認する

### 到達チェック

- TLS 1.3 が TLS 1.2 から何を削り、なぜそれで安全になるかを説明できる
- 前方秘匿性が、長期鍵ではなく一時鍵の DH で実現される理由を説明できる
- 暗号コードのレビューで確認する項目（乱数源、ノンス管理、比較の定数時間性、エラー処理、鍵の寿命）を列挙できる
- 「自作せず、実績あるライブラリの高水準 API を使う」を、具体的なライブラリ名つきで言える（libsodium、Tink、RustCrypto など）
