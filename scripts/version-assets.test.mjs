import { test } from 'node:test';
import assert from 'node:assert/strict';
import { versionAssets } from './version-assets.mjs';

function fixture() {
  return new Map(Object.entries({
    'index.html': '<link href="css/main.css"><script src="js/main.js"></script><a href="./town/">town</a><a href="https://example.com/style.css">external</a><img srcset="images/cover.webp 640w, images/large.webp 1280w">',
    'town/index.html': '<script src="../js/main.js"></script>',
    'js/main.js': 'import { draw } from "./art.js"; import "./clock.js";',
    'js/art.js': 'export const draw = () => {};',
    'js/clock.js': 'console.log("clock");',
    'css/main.css': 'body { background: url(../images/cover.webp#scene); } .icon { background: url("data:image/svg+xml,svg"); }',
    'images/cover.webp': 'original-image-bytes',
    'images/large.webp': 'large-image-bytes',
  }).map(([file, text]) => [file, Buffer.from(text)]));
}

test('pages, CSS assets and transitive module imports share one version; navigation stays native', () => {
  const files = fixture();
  const output = versionAssets(files);
  const home = output.get('index.html').toString();
  const version = home.match(/css\/main\.css\?v=([a-f\d]{12})/)[1];
  assert.ok(home.includes(`js/main.js?v=${version}`));
  assert.ok(home.includes(`images/cover.webp?v=${version} 640w, images/large.webp?v=${version} 1280w`));
  assert.ok(home.includes('href="./town/"'));
  assert.ok(home.includes('href="https://example.com/style.css"'));
  assert.ok(output.get('town/index.html').toString().includes(`../js/main.js?v=${version}`));
  assert.ok(output.get('js/main.js').toString().includes(`./art.js?v=${version}`));
  assert.ok(output.get('js/main.js').toString().includes(`./clock.js?v=${version}`));
  assert.ok(output.get('css/main.css').toString().includes(`../images/cover.webp?v=${version}#scene`));
  assert.ok(output.get('css/main.css').toString().includes('url("data:image/svg+xml,svg")'));
  assert.deepEqual(output.get('images/cover.webp'), files.get('images/cover.webp'));
  assert.ok(!files.get('index.html').toString().includes('?v='));
});

test('changing an imported module invalidates the page and its dependencies', () => {
  const files = fixture();
  const before = versionAssets(files);
  files.set('js/art.js', Buffer.from('export const draw = () => "updated";'));
  const after = versionAssets(files);
  assert.notDeepEqual(before.get('index.html'), after.get('index.html'));
  assert.notDeepEqual(before.get('js/main.js'), after.get('js/main.js'));
  assert.deepEqual(after.get('index.html'), versionAssets(files).get('index.html'));
});
