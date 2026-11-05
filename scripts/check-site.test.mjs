import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { publicFiles } from './public-files.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'breztop-check-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const file of publicFiles) {
    await mkdir(path.dirname(path.join(dir, file)), { recursive: true });
    await cp(path.join(root, file), path.join(dir, file));
  }
  return dir;
}
function check(dir) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/check-site.mjs'), dir], { encoding: 'utf8' });
}
test('inline JavaScript href assignments do not become HTML links after minification', async t => {
  const dir = await fixture(t);
  const file = path.join(dir, '404.html');
  await writeFile(file, (await readFile(file, 'utf8')).replace('</body>', '<script>const link={};link.href="/breztop_web/";</script></body>'));
  const result = check(dir);
  assert.equal(result.status, 0, result.stderr);
});
test('real unpublished HTML links still fail validation', async t => {
  const dir = await fixture(t);
  const file = path.join(dir, '404.html');
  await writeFile(file, (await readFile(file, 'utf8')).replace('</body>', '<a href="./missing/">missing</a></body>'));
  const result = check(dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /local reference is not published: .\/missing\//);
});
test('noindex pages cannot enter the sitemap', async t => {
  const dir = await fixture(t);
  const file = path.join(dir, 'sitemap.xml');
  await writeFile(file, (await readFile(file, 'utf8')).replace('</urlset>', '<url><loc>https://brez.top/personal-match-site/</loc></url></urlset>'));
  assert.match(check(dir).stderr, /Sitemap includes a noindex page/);
});
test('incorrect social image dimensions fail validation', async t => {
  const dir = await fixture(t);
  const file = path.join(dir, 'og.png');
  const image = await readFile(file);
  image.writeUInt32BE(640, 16);
  await writeFile(file, image);
  assert.match(check(dir).stderr, /incorrect PNG format or dimensions/);
});
