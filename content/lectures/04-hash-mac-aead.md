---
title: 第4回 ハッシュ・MAC・AEAD
step: 4
status: planned
weeks: 7週
description: 機密性だけでは不十分で、改ざん検知まで含めた AEAD（認証付き暗号）を標準にするのが現代の実務です。
---

<div class="notice">この回の講義資料は準備中です。下は学習ガイドから抜き出したシラバスで、講義資料が公開されるとこのページが置き換わります。</div>

この Step は共通鍵の仕上げで、同時にパディングオラクルなど実攻撃の理解に直結します。

### 学ぶこと

- ハッシュ関数の3要件: 原像困難性、第二原像困難性、衝突困難性。誕生日攻撃により n ビット出力の衝突耐性は約 n/2 ビット
- Merkle-Damgård 構造（MD5、SHA-1、SHA-2）: 長さ拡張攻撃が可能で、H(k || m) は MAC として使えない。SHA-1 では衝突が実際に作られている
- スポンジ構造（SHA-3 / Keccak）: capacity により長さ拡張が構造上起きない
- MAC と EUF-CMA: HMAC の構成と安全性、CBC-MAC が可変長メッセージで破れる理由と CMAC による修正
- Carter-Wegman 型 MAC: GHASH、Poly1305 はユニバーサル性を持つハッシュで長いメッセージを圧縮し、短い値だけを暗号化して高速化する発想
- 暗号化と認証の合成順序: Encrypt-then-MAC が安全で、MAC-then-Encrypt は padding oracle や Lucky13 の温床になる
- AEAD: AES-GCM、ChaCha20-Poly1305、AES-GCM-SIV（ノンス誤用耐性）。関連データ（AD）の役割
- KDF とパスワード: HKDF（extract-then-expand）、PBKDF2、bcrypt、scrypt、Argon2 とメモリハード関数の発想
- 乱数: CSPRNG、OS の乱数源（getrandom）、乱数不良が鍵全体を壊す実例

### 読む

- Katz & Lindell: ハッシュ関数と MAC の各章
- Boneh & Shoup: メッセージ完全性、認証付き暗号の章
- 論文: Bellare & Namprempre (2000) と Krawczyk (2001) は合成順序の議論の原典。どちらも短く読める
- 一次資料: RFC 2104（HMAC）、RFC 5869（HKDF）、NIST SP 800-38D（GCM）、FIPS 202（SHA-3）、RFC 8439

### 手を動かす

1. SHA-256 に対する長さ拡張攻撃で、H(k || m) 型の MAC を偽造する（Cryptopals Set 4 に類題あり）
2. HMAC を標準ライブラリを使わず自作し、RFC のテストベクタと照合する。定数時間比較も実装する
3. AES-GCM でノンスを再利用した2つの暗号文から、認証鍵 H が復元できることを確認する（選択課題。多項式の根を求める発想）
4. Argon2 のメモリ・反復パラメータを変え、自分の環境で1回あたりの所要時間を測る

### 到達チェック

- 長さ拡張攻撃の仕組みと、HMAC がそれを防ぐ理由を説明できる
- Encrypt-then-MAC が安全で MAC-then-Encrypt が危うい理由を、攻撃者が観測できる情報の違いで説明できる
- GCM のノンス再利用が「機密性」だけでなく「認証」まで壊す理由を言える
- ユースケースごと（通信、ディスク、パスワード保存、鍵導出）に使うべき関数を選べる
