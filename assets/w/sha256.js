/* 学習用の SHA-256 実装（第4回の長さ拡張攻撃の図で使う）
   内部状態と「処理済みのバイト数」を外から与えられるようにしてある。
   これが Merkle-Damgård 構造の長さ拡張攻撃をそのまま再現する。 */
(function (root) {
  "use strict";
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  // 圧縮関数: 状態（8語）と 64 バイトのブロックから、次の状態を作る
  function compress(H, block) {
    const w = new Uint32Array(64);
    for (let i = 0; i < 16; i++) w[i] = (block[4 * i] << 24) | (block[4 * i + 1] << 16) | (block[4 * i + 2] << 8) | block[4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    return [a, b, c, d, e, f, g, h].map((v, i) => (v + H[i]) >>> 0);
  }
  // 全長 len バイトのメッセージに付くパディング（0x80、0 の並び、64 ビットのビット長）
  function padding(len) {
    const k = (55 - (len % 64) + 64) % 64, p = new Uint8Array(1 + k + 8);
    p[0] = 0x80;
    const bits = BigInt(len) * 8n;
    for (let i = 0; i < 8; i++) p[p.length - 1 - i] = Number((bits >> BigInt(8 * i)) & 0xffn);
    return p;
  }
  // 状態 H から、すでに prefixLen バイト処理した続きとして data を処理し、ダイジェストを返す
  function hashFrom(H, data, prefixLen) {
    const total = prefixLen + data.length, buf = new Uint8Array(data.length + padding(total).length);
    buf.set(data); buf.set(padding(total), data.length);
    let s = H.slice();
    for (let i = 0; i < buf.length; i += 64) s = compress(s, buf.subarray(i, i + 64));
    return s;
  }
  const digest = (data) => hashFrom(IV, data, 0);
  const toBytes = (H) => { const o = new Uint8Array(32); H.forEach((v, i) => { o[4 * i] = v >>> 24; o[4 * i + 1] = (v >>> 16) & 255; o[4 * i + 2] = (v >>> 8) & 255; o[4 * i + 3] = v & 255; }); return o; };
  const fromBytes = (b) => Array.from({ length: 8 }, (_, i) => ((b[4 * i] << 24) | (b[4 * i + 1] << 16) | (b[4 * i + 2] << 8) | b[4 * i + 3]) >>> 0);
  const hex = (a) => Array.from(a, (x) => x.toString(16).padStart(2, "0")).join("");
  const sha256 = (data) => toBytes(digest(data));
  function hmac(key, msg) {
    let k = key.length > 64 ? sha256(key) : key; const kk = new Uint8Array(64); kk.set(k);
    const ip = kk.map((b) => b ^ 0x36), op = kk.map((b) => b ^ 0x5c);
    const inner = new Uint8Array(64 + msg.length); inner.set(ip); inner.set(msg, 64);
    const outer = new Uint8Array(96); outer.set(op); outer.set(sha256(inner), 64);
    return sha256(outer);
  }
  root.SHA256 = { IV, compress, padding, hashFrom, digest, sha256, hmac, toBytes, fromBytes, hex };
})(typeof window !== "undefined" ? window : globalThis);
