// Local browser acceptance for the generated, continuous resume and A4 print output.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { publicFiles } from './public-files.mjs';
import { translations, featuredProjects } from '../resume/locales/translations.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [path.join(root, '.preview'), root] }));
const output = path.join(root, '.preview/resume-acceptance');
const allowed = new Set(publicFiles);
const types = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    let file = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/(?:breztop_web\/)?/, '');
    if (!file || file.endsWith('/')) file += 'index.html';
    const found = allowed.has(file);
    if (!found) file = '404.html';
    const bytes = await readFile(path.join(root, 'dist', file));
    response.writeHead(found ? 200 : 404, { 'Content-Type': types[file.split('.').at(-1)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(bytes);
  } catch { response.writeHead(500).end(); }
});
await mkdir(output, { recursive: true });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const errors = [], requests = [], results = [];
let browser;
function pass(name) { results.push(name); console.log(`PASS: ${name}`); }
async function open({ width = 390, height = 844, browserInstance = browser, ...options } = {}) {
  const context = await browserInstance.newContext({ viewport: { width, height }, locale: 'zh-CN', reducedMotion: 'reduce', ...options });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) requests.push(response.url()); });
  return { context, page };
}
async function ready(page, pathname = '/resume/') {
  await page.goto(origin + pathname, { waitUntil: 'networkidle' });
  await page.waitForSelector('html.resume-ready');
}
async function navigate(page, id) {
  const mobile = await page.locator('.menu-toggle').isVisible();
  if (mobile) await page.locator('.menu-toggle').click();
  await page.locator(`${mobile ? '.mobile-menu' : '.desktop-nav'} a[href="#${id}"]`).click();
  await page.waitForURL(`**/resume/#${id}`);
  assert.equal(await page.locator('main > section:visible').count(), 2);
  assert(await page.locator(`#${id}`).evaluate(node => {
    const heading = node.querySelector('h1, h2').getBoundingClientRect();
    const header = document.querySelector('.header-inner').getBoundingClientRect();
    return heading.top >= header.bottom - 1 && heading.bottom <= innerHeight;
  }), `Anchor heading obscured: ${id}`);
}
async function layout(page) {
  const issues = await page.evaluate(() => {
    const issues = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) {
      issues.push(`Horizontal overflow: ${document.documentElement.scrollWidth}/${innerWidth}`);
      for (const node of document.querySelectorAll('main *')) {
        const box = node.getBoundingClientRect();
        if (box.width && (box.right > innerWidth + 1 || box.left < -1)) issues.push(`${node.tagName}.${node.className}`);
      }
    }
    for (const node of document.querySelectorAll('.header-inner a, .header-inner button')) {
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      if (box.left < 0 || box.right > innerWidth + 1 || box.top < 0 || !node.contains(hit)) issues.push(node.textContent.trim());
    }
    return issues;
  });
  if (issues.length) await page.screenshot({ path: path.join(output, 'layout-failure.png'), fullPage: true });
  assert.deepEqual(issues, []);
}
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const [width, height] of [[320,740], [390,844], [768,900], [1024,768], [1440,900], [844,390]]) {
    const { context, page } = await open({ width, height });
    await ready(page);
    for (const language of ['zh', 'en', 'ja']) {
      await page.locator(`.lang-btn[data-lang="${language}"]`).click();
      assert.equal(await page.locator('html').getAttribute('lang'), { zh: 'zh-CN', en: 'en', ja: 'ja' }[language]);
      assert.equal(await page.title(), translations[language].title);
      for (const id of ['home', 'about', 'contact']) {
        await navigate(page, id);
        await layout(page);
      }
      const mismatches = await page.locator('[data-i18n]').evaluateAll((nodes, dictionary) => nodes.filter(node => {
        const expected = node.dataset.i18n.split('.').reduce((value, part) => value?.[part], dictionary);
        return typeof expected !== 'string' || node.textContent !== expected;
      }).map(node => node.dataset.i18n), translations[language]);
      assert.deepEqual(mismatches, []);
      assert.equal(await page.locator('#experience, #education, .skill-progress, .future-tab').count(), 0);
      assert.equal(await page.locator('.project-entry').count(), featuredProjects.length);
      assert.equal(await page.locator('.project-bullets li').count(), featuredProjects.length * 2);
      if (language === 'zh' && [390,1440].includes(width)) {
        await navigate(page, 'home');
        await page.mouse.move(10, height - 10);
        await page.screenshot({ path: path.join(output, `selected-projects-${width}.png`), fullPage: true });
      }
    }
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    if (await page.locator('.menu-toggle').isVisible()) {
      await page.locator('.menu-toggle').click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
      assert(await page.locator('.menu-toggle').evaluate(button => button === document.activeElement));
    }
    pass(`Selected projects, native anchors, three languages and header hit targets: ${width}x${height}`);
    await context.close();
  }
  {
    const { context, page } = await open({ locale: 'en-US' });
    await ready(page);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await navigate(page, 'about');
    await navigate(page, 'contact');
    await page.goBack();
    assert.equal(new URL(page.url()).hash, '#about');
    await page.waitForFunction(() => {
      const heading = document.querySelector('#about-title').getBoundingClientRect();
      return heading.top >= document.querySelector('.header-inner').getBoundingClientRect().bottom - 1 && heading.bottom <= innerHeight;
    });
    await page.goBack();
    assert.equal(new URL(page.url()).hash, '');
    await page.goForward();
    assert.equal(new URL(page.url()).hash, '#about');
    await page.locator('#about').evaluate(node => node.scrollIntoView());
    await page.waitForSelector('.desktop-nav a[href="#about"][aria-current="location"]', { state: 'attached' });
    await page.locator('#contact').evaluate(node => node.scrollIntoView());
    await page.waitForSelector('.desktop-nav a[href="#contact"][aria-current="location"]', { state: 'attached' });
    assert.equal(new URL(page.url()).hash, '#about', 'Manual scrolling does not rewrite history');
    await ready(page, '/breztop_web/resume/#future');
    assert(await page.locator('#about-title').evaluate(node => {
      const heading = node.getBoundingClientRect();
      return heading.top >= document.querySelector('.header-inner').getBoundingClientRect().bottom - 1 && heading.bottom <= innerHeight;
    }), 'Direct fragment links remain aligned after language initialization');
    for (const project of featuredProjects) {
      await ready(page, '/breztop_web/resume/');
      const link = page.locator(`[data-project="${project.id}"] .project-link`);
      if (!project.href) {
        assert.equal(await link.count(), 0);
        continue;
      }
      assert.equal(await link.getAttribute('href'), project.href);
      if (project.href.startsWith('https://')) {
        assert.equal(await link.getAttribute('target'), '_blank');
        assert.match(await link.getAttribute('rel'), /noopener/);
      } else {
        await link.click();
        await page.waitForURL(`**/breztop_web/project-show/projects/${project.id}/`);
      }
    }
    await ready(page, '/breztop_web/resume/');
    await page.locator('.menu-toggle').click();
    await page.locator('.mobile-menu .portfolio-link').click();
    await page.waitForURL('**/breztop_web/project-show/');
    await ready(page, '/breztop_web/resume/');
    await page.locator('.park-return').click();
    await page.waitForURL(origin + '/breztop_web/');
    await page.goto(origin + '/resume/#projects');
    await page.waitForURL('**/project-show/');
    pass('Native history, scroll highlighting, project-base links and legacy bookmarks');
    await context.close();
  }
  {
    const { context, page } = await open();
    await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage is disabled', 'SecurityError'); } }));
    await ready(page);
    await page.locator('[data-lang="en"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await navigate(page, 'contact');
    pass('Language switching and navigation without browser storage');
    await context.close();
  }
  {
    const { context, page } = await open({ javaScriptEnabled: false, width: 320 });
    await page.goto(origin + '/breztop_web/resume/');
    assert.equal(await page.locator('main > section:visible').count(), 2);
    await page.locator('.desktop-nav a[href="#contact"]').click();
    assert.equal(new URL(page.url()).hash, '#contact');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.equal(await page.locator('button:visible').count(), 0);
    pass('Complete readable Chinese resume and native anchors without JavaScript');
    await context.close();
  }
  {
    const { context, page } = await open({ width: 1440, height: 900 });
    await ready(page);
    assert.equal(await page.locator('html').evaluate(node => getComputedStyle(node).scrollBehavior), 'auto');
    await page.evaluate(() => { window.print = () => { window.printRequested = true; }; });
    await page.locator('.print-button').click();
    assert(await page.evaluate(() => window.printRequested));
    for (const language of ['zh', 'en', 'ja']) {
      const printBrowser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
      try {
        const { page: paper } = await open({ browserInstance: printBrowser, width: 1440, height: 900, locale: { zh: 'zh-CN', en: 'en-US', ja: 'ja-JP' }[language] });
        await ready(paper);
        await paper.emulateMedia({ media: 'print' });
        await paper.evaluate(async () => {
          await document.fonts.ready;
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        });
        assert.equal(await paper.locator('main > section:visible').count(), 2);
        assert.equal(await paper.locator('.site-header:visible, .print-button:visible, .project-link:visible').count(), 0);
        assert.equal(await paper.locator('#contact:visible').count(), 1);
        assert.equal(await paper.locator('body').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)');
        assert(await paper.locator('.project-name').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).color === 'rgb(17, 17, 17)')));
        await paper.screenshot({ path: path.join(output, `print-layout-${language}.png`), fullPage: true });
        await paper.pdf({ path: path.join(output, `resume-${language}.pdf`), preferCSSPageSize: true, printBackground: false, displayHeaderFooter: false });
      } finally { await printBrowser.close(); }
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await page.locator('html').evaluate(node => getComputedStyle(node).scrollBehavior), 'smooth');
    pass('Print button, A4 output in three languages and reduced-motion preference');
    await page.goto(origin + '/', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#ride-carousel a[href="./resume/"]').getAttribute('target'), null);
    assert.match(await page.locator('#ride-carousel .entry-button-label').textContent(), /暂不开放/);
    assert.equal(await page.locator('#ride-carousel a[href="./resume/"]').getAttribute('aria-disabled'), null);
    await page.locator('#guide-fixed').click();
    assert.match(await page.locator('#guide-list a[href="./resume/"]').textContent(), /暂不开放/);
    await page.locator('#guide-list a[href="./resume/"]').click();
    await page.waitForURL('**/resume/');
    assert.equal(await page.locator('main > section:visible').count(), 2);
    pass('Park guide enters the continuous resume in the same tab');
    await context.close();
  }
  assert.deepEqual(errors, [], 'Uncaught browser errors');
  assert.deepEqual(requests, [], 'Failed published resources');
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ results, errors, requests }, null, 2));
  console.log(`Resume acceptance passed; screenshots, PDFs and results: ${output}`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
