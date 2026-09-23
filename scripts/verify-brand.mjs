import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir = 'public/assets/brand-official/';
const manifest = JSON.parse(fs.readFileSync(dir + 'manifest.json', 'utf8'));
assert.equal(Object.keys(manifest).length, 4);
for (const [file, sha] of Object.entries(manifest)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(dir + file)).digest('hex'), sha, `Original altered: ${file}`);
}
for (const file of ['index.html', 'src/components/MarcaVert.tsx', 'src/components/Hero.tsx', 'src/components/Header.tsx', 'src/components/Rodape.tsx', 'styles.css', 'public/brand.css']) {
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('/assets/marca/'), `Unapproved derivative in ${file}`);
  assert(!/maskImage|mask-image|mix-blend-mode/.test(source), `Logo transformation in ${file}`);
}
console.log('Approved brand: four SHA-256 originals verified; no legacy logo or recoloring in public components.');
