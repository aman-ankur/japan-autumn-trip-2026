// Builds the public index.html from private/index.source.html.
// Real hotel, flight and rental names are replaced with codenames and the
// originals are AES-GCM encrypted into the page; script.js decrypts them
// when the passphrase is entered.
//
// Usage: node tools/build-vault.mjs <passphrase-file>
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const source = readFileSync(`${root}private/index.source.html`, 'utf8');
const { terms, hrefPatterns } = JSON.parse(readFileSync(`${root}private/vault.terms.json`, 'utf8'));
const passphrase = readFileSync(process.argv[2], 'utf8').trim();
if (passphrase.length < 12) console.warn('Warning: short passphrases can be brute-forced offline.');

const payload = { t: [], b: [], h: [] };
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sorted = Object.keys(terms).sort((a, b) => b.length - a.length);
const termRe = new RegExp(sorted.map(escapeRe).join('|'), 'g');
const plain = (s) => s.replace(termRe, (m) => terms[m]);

// 1. Lock the descriptive body of each stay card (area + price + description is guessable).
let html = source.replace(
  /(<article class="(?:booking-card|tokyo-stay-card)[^"]*">[\s\S]*?<\/h3>)([\s\S]*?)(<\/article>)/g,
  (_, head, body, close) => {
    payload.b.push(body);
    return `${head}<div class="vault-block" data-vb="${payload.b.length - 1}"><p class="vault-note">🔒 Details hidden · unlock to view</p></div>${close}`;
  },
);

// 2. Lock links that point at a booked property, airline or rental company.
const hrefTests = hrefPatterns.map((p) => new RegExp(p, 'i'));
html = html.replace(/href="([^"]*)"/g, (whole, url) => {
  if (!hrefTests.some((re) => re.test(url))) return whole;
  payload.h.push(url);
  return `href="#vault" data-vh="${payload.h.length - 1}"`;
});

// 3. Swap names: tags get plain codenames, text nodes get unlockable spans.
let inRaw = false;
html = html.replace(/<[^>]*>|[^<]+/g, (tok) => {
  if (tok.startsWith('<')) {
    if (/^<(script|style)\b/i.test(tok)) inRaw = true;
    if (/^<\/(script|style)/i.test(tok)) inRaw = false;
    return plain(tok);
  }
  if (inRaw) return tok;
  return tok.replace(termRe, (m) => {
    payload.t.push(m);
    return `<span class="vault-t" data-vt="${payload.t.length - 1}">${terms[m]}</span>`;
  });
});

const leaks = sorted.filter((t) => html.includes(t) && !Object.values(terms).some((c) => c.includes(t)));
if (leaks.length) throw new Error(`Real names still present: ${leaks.join(', ')}`);

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
  baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt'],
);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(payload))));
const b64 = (u) => Buffer.from(u).toString('base64');
const blob = JSON.stringify({ s: b64(salt), i: b64(iv), d: b64(data) });

html = html.replace('</body>', `<script type="application/json" id="vault-data">${blob}</script>\n</body>`);
writeFileSync(`${root}index.html`, html);
console.log(`Locked ${payload.t.length} names, ${payload.b.length} cards, ${payload.h.length} links.`);
