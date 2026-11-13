import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { publicFiles } from './public-files.mjs';
import { adaptToyFiles, checkToyFiles } from './toy-adapter.mjs';
import { versionAssets } from './version-assets.mjs';

const root = new URL('../', import.meta.url);
const sources = new Map(await Promise.all(publicFiles.map(async file => [file, await readFile(new URL(file, root))])));
const toy = versionAssets(adaptToyFiles(sources));

test('the real Toy package resolves every local reference without changing native sources', () => {
  assert.deepEqual(checkToyFiles(toy), []);
  assert(sources.get('index.html').toString().includes('href="https://blog.brez.top"'));
  assert(sources.get('404.html').toString().includes('window.goatcounter'));
  assert(toy.has('content-usage.txt'));
  assert(!toy.has('robots.txt') && !toy.has('sitemap.xml'));
  assert.match(toy.get('index.html').toString(), /href="\.\/resume\/index.html"/);
  assert.match(toy.get('project-show/projects/cards/index.html').toString(), /href="\.\.\/\.\.\/index.html"/);
});

test('Toy removes outbound actions and analytics while retaining the 404 scene code', () => {
  const home = toy.get('index.html').toString();
  assert(!home.includes('href="https://blog.brez.top"'));
  assert(home.includes('href="https://space.bilibili.com/630698674"'));
  assert.match(toy.get('js/index.js').toString(), /closed: true, entryLabel: '暂未开放'/);
  assert(!toy.get('personal-match-site/main.js').toString().includes('hello.href ='));
  const boundary = toy.get('404.html').toString();
  assert(boundary.includes("const scene = document.getElementById('boundary-scene')"));
  assert(!boundary.includes('goatcounter') && !boundary.includes("location.hostname.endsWith('.github.io')"));
  assert.match(toy.get('js/park-tools.js').toString(), /https:\/\/www\.bilibili\.com\/toy\//);
});

test('Toy checks reject revived external actions and links that need directory-index redirects', () => {
  const broken = new Map(toy);
  broken.set('index.html', Buffer.from(toy.get('index.html').toString().replace('</body>',
    '<a href="https://example.com/">outbound</a><a href="./resume/">directory</a><img src="/missing.png"></body>')));
  const problems = checkToyFiles(broken).join('\n');
  assert.match(problems, /unsupported navigation: https:\/\/example.com/);
  assert.match(problems, /path depends on hosting redirects: \.\/resume\//);
  assert.match(problems, /unpublished reference: \/missing.png/);
});
