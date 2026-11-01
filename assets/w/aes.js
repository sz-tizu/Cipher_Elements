/* 学習用の AES-128 実装（第3回・第4回の図で共有）
   FIPS 197 のとおりに書いた素直な実装。テーブル参照が秘密に依存するので、
   実務で使うとキャッシュタイミング攻撃の対象になる。暗号化に使ってはいけない。 */
(function (root) {
  "use strict";
  // GF(2^8) の掛け算（既約多項式 x^8 + x^4 + x^3 + x + 1）
  function xtime(a) { a <<= 1; return a & 0x100 ? a ^ 0x11b : a; }
  function gmul(a, b) { let r = 0; while (b) { if (b & 1) r ^= a; a = xtime(a); b >>= 1; } return r; }
  // S-box: GF(2^8) の逆元にアフィン変換を合成して作る
  const SBOX = new Uint8Array(256), INV = new Uint8Array(256);
  for (let x = 0; x < 256; x++) {
    let inv = 0;
    if (x) for (let y = 1; y < 256; y++) if (gmul(x, y) === 1) { inv = y; break; }
    const rotl = (v, s) => ((v << s) | (v >> (8 - s))) & 0xff;
    const s = inv ^ rotl(inv, 1) ^ rotl(inv, 2) ^ rotl(inv, 3) ^ rotl(inv, 4) ^ 0x63;
    SBOX[x] = s; INV[s] = x;
  }
  const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

  // 鍵拡張: 16 バイトの鍵から 11 個のラウンド鍵（各 16 バイト）を作る
  function expandKey(key) {
    const w = [];
    for (let i = 0; i < 4; i++) w.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);
    for (let i = 4; i < 44; i++) {
      let t = w[i - 1].slice();
      if (i % 4 === 0) { t = [t[1], t[2], t[3], t[0]].map((b) => SBOX[b]); t[0] ^= RCON[i / 4 - 1]; }
      w.push(w[i - 4].map((b, j) => b ^ t[j]));
    }
    const rk = [];
    for (let r = 0; r < 11; r++) rk.push(Uint8Array.from([].concat(w[4 * r], w[4 * r + 1], w[4 * r + 2], w[4 * r + 3])));
    return rk;
  }
  // 状態は FIPS 197 と同じく列優先: state[r + 4c]
  const subBytes = (s) => s.map((b) => SBOX[b]);
  const invSubBytes = (s) => s.map((b) => INV[b]);
  function shiftRows(s) { const o = new Uint8Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[r + 4 * c] = s[r + 4 * ((c + r) % 4)]; return o; }
  function invShiftRows(s) { const o = new Uint8Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[r + 4 * ((c + r) % 4)] = s[r + 4 * c]; return o; }
  function mixColumns(s) {
    const o = new Uint8Array(16);
    for (let c = 0; c < 4; c++) {
      const a = [s[4 * c], s[4 * c + 1], s[4 * c + 2], s[4 * c + 3]];
      o[4 * c] = gmul(a[0], 2) ^ gmul(a[1], 3) ^ a[2] ^ a[3];
      o[4 * c + 1] = a[0] ^ gmul(a[1], 2) ^ gmul(a[2], 3) ^ a[3];
      o[4 * c + 2] = a[0] ^ a[1] ^ gmul(a[2], 2) ^ gmul(a[3], 3);
      o[4 * c + 3] = gmul(a[0], 3) ^ a[1] ^ a[2] ^ gmul(a[3], 2);
    }
    return o;
  }
  function invMixColumns(s) {
    const o = new Uint8Array(16);
    for (let c = 0; c < 4; c++) {
      const a = [s[4 * c], s[4 * c + 1], s[4 * c + 2], s[4 * c + 3]];
      o[4 * c] = gmul(a[0], 14) ^ gmul(a[1], 11) ^ gmul(a[2], 13) ^ gmul(a[3], 9);
      o[4 * c + 1] = gmul(a[0], 9) ^ gmul(a[1], 14) ^ gmul(a[2], 11) ^ gmul(a[3], 13);
      o[4 * c + 2] = gmul(a[0], 13) ^ gmul(a[1], 9) ^ gmul(a[2], 14) ^ gmul(a[3], 11);
      o[4 * c + 3] = gmul(a[0], 11) ^ gmul(a[1], 13) ^ gmul(a[2], 9) ^ gmul(a[3], 14);
    }
    return o;
  }
  const addRoundKey = (s, k) => s.map((b, i) => b ^ k[i]);

  // 途中経過つきの暗号化（図で使う）
  function encryptTrace(block, key) {
    const rk = expandKey(key), trace = [];
    let s = Uint8Array.from(block);
    trace.push({ round: 0, step: "入力", state: s });
    s = addRoundKey(s, rk[0]); trace.push({ round: 0, step: "AddRoundKey", state: s });
    for (let r = 1; r <= 10; r++) {
      s = subBytes(s); trace.push({ round: r, step: "SubBytes", state: s });
      s = shiftRows(s); trace.push({ round: r, step: "ShiftRows", state: s });
      if (r < 10) { s = mixColumns(s); trace.push({ round: r, step: "MixColumns", state: s }); }
      s = addRoundKey(s, rk[r]); trace.push({ round: r, step: "AddRoundKey", state: s });
    }
    return { trace, roundKeys: rk };
  }
  function encryptBlock(block, rk) {
    let s = addRoundKey(Uint8Array.from(block), rk[0]);
    for (let r = 1; r <= 10; r++) { s = shiftRows(subBytes(s)); if (r < 10) s = mixColumns(s); s = addRoundKey(s, rk[r]); }
    return s;
  }
  function decryptBlock(block, rk) {
    let s = addRoundKey(Uint8Array.from(block), rk[10]);
    for (let r = 9; r >= 0; r--) { s = invSubBytes(invShiftRows(s)); s = addRoundKey(s, rk[r]); if (r > 0) s = invMixColumns(s); }
    return s;
  }
  const xor = (a, b) => a.map((v, i) => v ^ b[i]);
  // 運用モード（data は 16 バイトの倍数とする）
  function ecb(data, rk) { const o = new Uint8Array(data.length); for (let i = 0; i < data.length; i += 16) o.set(encryptBlock(data.subarray(i, i + 16), rk), i); return o; }
  function cbcEnc(data, rk, iv) { const o = new Uint8Array(data.length); let prev = iv; for (let i = 0; i < data.length; i += 16) { prev = encryptBlock(xor(data.subarray(i, i + 16), prev), rk); o.set(prev, i); } return o; }
  function cbcDec(data, rk, iv) { const o = new Uint8Array(data.length); let prev = iv; for (let i = 0; i < data.length; i += 16) { const c = data.subarray(i, i + 16); o.set(xor(decryptBlock(c, rk), prev), i); prev = c; } return o; }
  function ctr(data, rk, nonce) {
    const o = new Uint8Array(data.length), cnt = Uint8Array.from(nonce);
    for (let i = 0; i < data.length; i += 16) {
      const ks = encryptBlock(cnt, rk);
      for (let j = 0; j < 16 && i + j < data.length; j++) o[i + j] = data[i + j] ^ ks[j];
      for (let j = 15; j >= 0; j--) { cnt[j] = (cnt[j] + 1) & 0xff; if (cnt[j]) break; }
    }
    return o;
  }
  const hex = (a) => Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  const fromHex = (h) => Uint8Array.from((h.replace(/[^0-9a-f]/gi, "").match(/../g) || []).map((x) => parseInt(x, 16)));
  root.AES = { SBOX, INV, gmul, xtime, expandKey, encryptTrace, encryptBlock, decryptBlock, subBytes, shiftRows, mixColumns, addRoundKey, ecb, cbcEnc, cbcDec, ctr, hex, fromHex, xor };
})(typeof window !== "undefined" ? window : globalThis);
