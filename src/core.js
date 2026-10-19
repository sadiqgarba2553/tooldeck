import {catalog} from './catalog.js';
export const tools=catalog.map(t=>[t.id,t.name,t.category,t.description]);
export function parsePages(input, total) {
  if (!Number.isInteger(total) || total < 1) throw Error('This PDF has no pages.');
  if (!input.trim()) throw Error('Enter pages, for example 1, 3-5.');
  const pages = [];
  for (const part of input.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw Error('Use page numbers and ranges such as 1, 3-5.');
    const first = Number(match[1]), last = Number(match[2] || first);
    if (first < 1 || last > total || first > last) throw Error(`Pages must be between 1 and ${total}, in ascending ranges.`);
    for (let i = first; i <= last; i++) if (!pages.includes(i - 1)) pages.push(i - 1);
  }
  return pages;
}
export function encode64(text) { return btoa(Array.from(new TextEncoder().encode(text), n => String.fromCharCode(n)).join('')); }
export function decode64(text) { return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0))); }
export function generatePassword(length, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*-_=+') {
  if (!Number.isInteger(length) || length < 8 || length > 256) throw Error('Choose a password length between 8 and 256.');
  let result = ''; const max = 256 - (256 % alphabet.length);
  while (result.length < length) { const bytes = crypto.getRandomValues(new Uint8Array(length * 2)); for (const n of bytes) if (n < max && result.length < length) result += alphabet[n % alphabet.length]; }
  return result;
}
export function colorValues(input) {
  let hex = input.trim().replace(/^#/, '');
  if (/^[a-f\d]{3}$/i.test(hex)) hex = [...hex].map(c => c + c).join('');
  if (!/^[a-f\d]{6}$/i.test(hex)) throw Error('Enter a three- or six-digit hex color.');
  const rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  const [r, g, b] = rgb.map(v => v / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, light = (max + min) / 2;
  let hue = delta === 0 ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (Math.round(hue * 60) + 360) % 360;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * light - 1));
  return `#${hex.toUpperCase()}\nrgb(${rgb.join(', ')})\nhsl(${hue}, ${Math.round(saturation * 100)}%, ${Math.round(light * 100)}%)`;
}
