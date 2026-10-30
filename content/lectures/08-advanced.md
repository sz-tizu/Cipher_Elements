---
title: 第8回 発展と前回学習との接続
step: 8
status: planned
weeks: 14〜16週
description: 基礎を一巡したあとで、前回学んだ楕円曲線と耐量子暗号が、ここまでの枠組みのどこに収まるかを確認します。
---

<div class="notice">この回の講義資料は準備中です。下は学習ガイドから抜き出したシラバスで、講義資料が公開されるとこのページが置き換わります。</div>

あわせて、ゼロ知識や MPC といった応用暗号の入口に立ち、最後に総まとめの課題を置きます。

### 前回学習の位置づけ

- 楕円曲線: Step 5 の DH と Step 6 の Schnorr 署名を、群を楕円曲線に替えて実現したものが ECDH と EdDSA。安全性の議論（DLP、DDH、ノンス管理）はそのまま持ち越せる。ペアリングを使うと BLS 署名や IBE が構成できる
- 耐量子暗号: Shor のアルゴリズムは RSA、有限体 DH、楕円曲線の DLP をすべて破る。一方 Grover は共通鍵の強度を概ね半減させる程度なので、AES-256 や SHA-3 を使えば対処できる
- NIST 標準: 鍵カプセル化は ML-KEM（FIPS 203）、署名は ML-DSA（FIPS 204）と SLH-DSA（FIPS 205）。FN-DSA（Falcon ベース）などは策定が続いているため、最新状況は NIST のサイトで確認する
- 移行の実務: 従来方式と ML-KEM を併用するハイブリッド鍵交換が TLS などで先行している。組織内の暗号利用箇所の棚卸しと、方式を差し替えやすい設計（暗号アジリティ）が先に必要になる

### 学ぶこと（応用暗号の入口）

- ゼロ知識証明: Σプロトコルのシミュレータによる ZK の定義、Fiat-Shamir による非対話化、zk-SNARK の概要
- 秘密分散と MPC: Shamir 秘密分散、オブリビアス転送、Yao の garbled circuits の考え方
- 準同型暗号: 加法準同型（Paillier）から完全準同型暗号（FHE）まで
- 格子暗号の基礎: LWE 問題と、その上の Regev 型暗号化。Step 2 の帰着の考え方がそのまま使える
- 理論の入口: 一方向関数と PRG、PRF の存在の関係（Goldreich の理論体系）

### 読む

- Hoffstein, Pipher & Silverman, An Introduction to Mathematical Cryptography: 楕円曲線、格子、ペアリングの復習用
- Peikert, A Decade of Lattice Cryptography（2016）: 格子暗号の標準的な概説
- Thaler, Proofs, Arguments, and Zero-Knowledge（無料）、Evans, Kolesnikov & Rosulek, A Pragmatic Introduction to Secure Multi-Party Computation（無料）
- 理論を深めたい場合: Goldreich, Foundations of Cryptography Vol. 1 と Vol. 2
- 日本語: 縫田光司『耐量子計算機暗号』（前回の教材の補強）

### 手を動かす

1. Shamir 秘密分散を実装し、しきい値未満では情報が得られないことを確認する
2. Schnorr 識別プロトコルのシミュレータを書き、ZK の意味を体感する
3. 小さなパラメータの LWE 暗号化を実装し、ノイズが復号に与える影響を観察する
4. 総まとめ課題: 「AEAD、ECDHE、Ed25519、HKDF で構成した簡易セキュアチャネル」を設計し、脅威モデル、使用方式の選定理由、想定される攻撃への対策を A4 数枚の設計書にまとめる。Step 7 のレビュー観点で自己レビューもする

### 到達チェック

- 楕円曲線版の DH と署名の安全性が、Step 5〜6 の議論のどこから来るかを説明できる
- Shor と Grover が、それぞれどの方式にどう効くかを区別して言える
- ゼロ知識の3性質（完全性、健全性、ゼロ知識性）を、Schnorr プロトコルで説明できる
- 総まとめ課題の設計書を、他の人が読んでレビューできる水準で書ける
