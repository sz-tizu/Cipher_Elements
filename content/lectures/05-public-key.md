---
title: 第5回 公開鍵暗号
step: 5
status: planned
weeks: 8〜9週
description: 教科書 RSA は暗号方式ではなく「素材」にすぎない、という感覚をここで掴みます。
---

<div class="notice">この回の講義資料は準備中です。下は学習ガイドから抜き出したシラバスで、講義資料が公開されるとこのページが置き換わります。</div>

安全な公開鍵暗号は、素材にパディングや KEM の構造を足して、CCA 安全まで持っていったものです。

### 学ぶこと

- 困難性仮定の階層: 離散対数（DLP）、計算 DH（CDH）、決定 DH（DDH）、RSA 仮定、素因数分解。仮定が強いほど証明できることが増えるが、破られるリスクも上がる
- Diffie-Hellman 鍵交換: 受動的盗聴者には安全だが、中間者には無力（認証が別途必要）
- 公開鍵暗号の定義と IND-CPA / IND-CCA2: 公開鍵では攻撃者が自分で暗号化できるため、決定的な暗号化は IND-CPA を満たせない
- ElGamal: DDH 仮定下で IND-CPA。ただし展性があり CCA 安全ではない
- RSA: 教科書 RSA の問題（決定的、展性、小さい e への攻撃）、PKCS#1 v1.5 と Bleichenbacher 攻撃、RSA-OAEP（ランダムオラクルモデルで IND-CCA2）
- KEM/DEM とハイブリッド暗号: 公開鍵で共通鍵を運び、データは AEAD で暗号化する。現代の標準形で、HPKE（RFC 9180）もこの構造
- Cramer-Shoup: ランダムオラクルなしで CCA 安全を示した方式。構成の発想を知る程度でよい
- 最良攻撃と鍵長: RSA と有限体 DH には数体ふるい法などの準指数時間攻撃があり、楕円曲線では一般的な攻撃が約 √q 止まり。このため RSA は2048bit以上、楕円曲線は256bitで同程度の強度を狙う

### 読む

- Katz & Lindell: 公開鍵暗号の章、数論的仮定の章
- Boneh & Shoup: 公開鍵暗号の章群（ElGamal、RSA、CCA 安全性）
- Boneh, Twenty Years of Attacks on the RSA Cryptosystem（1999）: 実装ミス由来の攻撃の俯瞰として優れている
- Bleichenbacher (1998) の原論文、RFC 8017（PKCS#1 v2.2）、RFC 9180（HPKE）

### 手を動かす

1. 教科書 RSA を実装し、同じ平文が同じ暗号文になること、2つの暗号文の積が平文の積に対応すること（展性）を確認する
2. RSA のブロードキャスト攻撃（e=3、同一平文を3宛先に送信）を CRT で破る（Cryptopals Set 5）
3. PKCS#1 v1.5 のパディングオラクル攻撃を実装する（Cryptopals Set 6 の Bleichenbacher 系課題。簡易版でよい）
4. DH で小さい部分群へ誘導する攻撃（small subgroup attack）を試し、公開鍵検証の必要性を体感する

### 到達チェック

- 「RSA は暗号化に使える」が不正確な理由と、実務で RSA-OAEP や KEM を使う理由を説明できる
- CDH と DDH の違い、DDH が成り立たない群の例を挙げられる
- Bleichenbacher 攻撃が「復号エラーの違い」という1ビットの情報で成立する理由を説明できる
- 公開鍵暗号でデータを直接暗号化せず、ハイブリッドにする理由を3つ挙げられる
