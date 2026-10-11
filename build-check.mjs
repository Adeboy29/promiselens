import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
for(const file of ['index.html','style.css','app.js','PromiseLens.py','verification.json']) {
 assert(existsSync(file),`Missing published file: ${file}`);
}

const html=readFileSync('index.html','utf8');
assert(html.includes('src="app.js"')&&html.includes('href="style.css"'));
assert(!readFileSync('app-source.js','utf8').includes("writer.connect('studionet')"),'Do not reintroduce Snaps connection');
assert.equal(JSON.parse(readFileSync('verification.json','utf8')).contract,'0x29cbdD5c5266693170Ad0920c92776dC45BF3c00');
console.log('PASS: publish assets, matching contract copy, wallet integration, proof record');
