import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePages,encode64,decode64,generatePassword,colorValues} from '../src/core.js';
test('PDF page ranges preserve requested order, deduplicate and reject invalid selections',()=>{assert.deepEqual(parsePages('3, 1-2, 3',5),[2,0,1]);for(const value of ['0','9','3-1','1-x',''])assert.throws(()=>parsePages(value,5));});
test('Base64 round-trips Arabic and emoji without losing UTF-8',()=>{const input='السلام عليكم 🌤️';assert.equal(decode64(encode64(input)),input);assert.throws(()=>decode64('%%%'));});
test('password generator uses requested length and validates limits',()=>{const a=generatePassword(64),b=generatePassword(64);assert.equal(a.length,64);assert.notEqual(a,b);assert.throws(()=>generatePassword(7));assert.throws(()=>generatePassword(999));});
test('hex color conversion handles short hex and grayscale',()=>{assert.equal(colorValues('#fff'),'#FFFFFF\nrgb(255, 255, 255)\nhsl(0, 0%, 100%)');assert.match(colorValues('f00'),/hsl\(0, 100%, 50%\)/);assert.throws(()=>colorValues('javascript:'));});
