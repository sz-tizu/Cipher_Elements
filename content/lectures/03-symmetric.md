---
title: 第3回 共通鍵暗号
step: 3
status: planned
weeks: 5〜6週
description: ブロック暗号を PRP（疑似ランダム置換）として扱い、その上に運用モードを載せて IND-CPA を示す、という流れを押さえるのがこの Step の中心です。
---

<div class="notice">この回の講義資料は準備中です。下は学習ガイドから抜き出したシラバスで、講義資料が公開されるとこのページが置き換わります。</div>

AES の内部は「理解して一度実装する」までやり、運用では必ずライブラリを使います。

### 学ぶこと

- PRF と PRP: 鍵付き関数と鍵付き置換。PRF/PRP スイッチング補題により、q 回のクエリで区別できる確率は約 q^2 / 2^(n+1) になる。この式が「1つの鍵で暗号化してよい量の上限」の根拠になる
- ブロック暗号の構造: SPN（AES）と Feistel（DES）。Feistel は段数が足りれば PRP になる（Luby-Rackoff）
- AES の4操作: SubBytes、ShiftRows、MixColumns、AddRoundKey。鍵長128/192/256bit でラウンド数は10/12/14。S-box は GF(2^8) の逆元に基づく
- 解読法の考え方: 差分解読と線形解読。AES の wide trail 戦略は、これらの攻撃が成り立ちにくいように拡散層を設計する発想
- 運用モード: ECB（使ってはいけない）、CBC（IV は予測不能なランダム）、CTR（ノンスは一意）、XTS（ストレージ向け）。CBC と CTR は IND-CPA 安全だが、改ざんには無力（CCA 安全ではない）
- ストリーム暗号: ChaCha20（ARX 構造）。RC4 は出力の偏りで破られた
- 64bit ブロックの限界: 3DES は誕生日攻撃（Sweet32）で実用上の脆弱性が出るため廃止方向

### 読む

- Katz & Lindell: 共通鍵暗号の実用的構成の章、運用モードの節
- Boneh & Shoup, A Graduate Course in Applied Cryptography（無料）: ブロック暗号、CPA 安全な暗号化の章
- Daemen & Rijmen, The Design of Rijndael: AES 設計者による解説。拡散層の考え方に絞って読めば十分
- 一次資料: FIPS 197（AES）、NIST SP 800-38A（運用モード）、RFC 8439（ChaCha20）
- 日本語: 結城浩『暗号技術入門 第3版』で全体像を再確認

### 手を動かす

1. AES-128 を一から実装し、FIPS 197 付録のテストベクタで検証する（Python で十分。余力があれば Rust でも）
2. CBC、CTR を自分で実装する（ブロック暗号は上の AES を使う）
3. Cryptopals: ECB の byte-at-a-time 復号（Set 2）と CBC のビット反転攻撃（Set 2）
4. ChaCha20 のクォーターラウンドを実装し、RFC 8439 のテストベクタで確認する

### 到達チェック

- ECB が IND-CPA を満たさない理由と、CBC で IV が予測可能だと破れる理由（BEAST の原理）を説明できる
- CTR でノンスを再利用すると何が漏れるかを式で書ける
- 同一鍵で安全に暗号化できる量が、ブロック長 n に対して約 2^(n/2) ブロックで頭打ちになる理由を説明できる
- 「暗号化したのに改ざんされる」問題を、CBC のビット反転で具体的に示せる
