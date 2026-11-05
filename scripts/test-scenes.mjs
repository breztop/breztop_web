// Optional browser acceptance: uses Playwright from the local preview environment.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { publicFiles } from './public-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [path.join(root, '.preview'), root] }));
const output = path.join(root, '.preview/scenes-acceptance');
const allowed = new Set(publicFiles);
const types = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', png: 'image/png' };
await mkdir(output, { recursive: true });
async function resource(pathname) {
  let file = decodeURIComponent(pathname).replace(/^\/(?:breztop_web\/)?/, '');
  if (!file || file.endsWith('/')) file += 'index.html';
  const found = allowed.has(file);
  if (!found) file = '404.html';
  return { status: found ? 200 : 404, contentType: types[file.split('.').at(-1)] || 'application/octet-stream', body: await readFile(path.join(root, 'dist', file)) };
}
const server = createServer(async (request, response) => {
  try {
    const result = await resource(new URL(request.url, 'http://localhost').pathname);
    response.writeHead(result.status, { 'Content-Type': result.contentType, 'Cache-Control': 'no-store' }).end(result.body);
  } catch { response.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [], errors = [], missing = [];
const captureOnly = process.argv.includes('--capture');
function pass(name) { results.push(name); console.log(`PASS: ${name}`); }
async function open(width, height, { motion = 'reduce', javaScriptEnabled = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: motion, javaScriptEnabled, hasTouch: width <= 600, isMobile: width <= 600 });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === 'preview.github.io' || url.hostname === 'brez.top') return route.fulfill(await resource(url.pathname));
    if (url.hostname === 'space.bilibili.com') return route.fulfill({ contentType: 'text/html', body: '<title>Bilibili destination check</title>' });
    return route.abort();
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => {
      if (window.denyClipboard) throw new Error('test denied');
      window.copiedText = value;
    } } });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400 && response.request().resourceType() !== 'document') missing.push(response.url());
  });
  return { context, page };
}
async function ready(page, pathname = '/snack-town/') {
  await page.goto(origin + pathname, { waitUntil: 'networkidle' });
  if (pathname.endsWith('/')) await page.waitForFunction(() => document.documentElement.dataset.intro === 'ready');
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(output, name + '.png') }); }
async function checkButtons(page, selector) {
  const result = await page.locator(selector).evaluateAll(nodes => nodes.filter(node => !node.hidden && getComputedStyle(node).visibility !== 'hidden').map(node => {
    const rect = node.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return { id: node.id || node.getAttribute('aria-label'), box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, valid: rect.left >= -.5 && rect.right <= innerWidth + .5 && rect.top >= 0 && rect.bottom <= innerHeight + .5 && (node.disabled || node.contains(hit)) };
  }));
  assert(result.every(item => item.valid), JSON.stringify(result));
}
const logicalX = page => page.locator('#town-actor').evaluate(node => Number(node.dataset.x));
async function drag(page, selector, delta, { touch = false, cancel = false, beforeRelease } = {}) {
  const rect = await page.locator(selector).boundingBox();
  const start = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const end = { x: start.x + delta, y: start.y };
  if (touch) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let i = 1; i <= 6; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + delta * i / 6, y: start.y }] });
    await page.waitForTimeout(40);
    if (beforeRelease) await beforeRelease();
    await session.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.waitForTimeout(40);
    if (beforeRelease) await beforeRelease();
    if (cancel) await page.locator(selector).evaluate(node => node.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })));
    await page.mouse.up();
  }
}
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const sizes = process.argv.includes('--interactions') ? [] : [[320,740],[390,844],[768,900],[1024,768],[1440,900],[844,390]];
  for (const [width, height] of sizes) {
    const { context, page } = await open(width, height);
    await ready(page, '/');
    const brand = await page.locator('.brand-name').evaluate(node => getComputedStyle(node).fontSize);
    await page.locator('#park-viewport').focus();
    await page.keyboard.press('End');
    await screenshot(page, `home-day-${width}x${height}`);
    await page.locator('#fixed-phase').click(); await page.locator('#fixed-phase').click();
    await screenshot(page, `home-night-${width}x${height}`);
    await ready(page);
    assert.equal(await page.locator('html').getAttribute('data-light'), 'night', 'The town inherits the home light preference');
    await page.locator('#fixed-phase').click(); await page.locator('#fixed-phase').click();
    await screenshot(page, `town-overview-${width}x${height}`);
    assert.equal(await page.locator('.brand-name').evaluate(node => getComputedStyle(node).fontSize), brand);
    assert.equal(await page.locator('svg.town-art').count(), 1);
    for (const id of ['follow', 'message']) {
      await page.locator(`[data-walk="${id}"]`).click();
      await screenshot(page, `town-day-${id}-${width}x${height}`);
      await checkButtons(page, `.station-${id} a, .station-${id} button, .town-tools button, .town-actor button, .town-back`);
      assert(await page.locator(`.station-${id}`).evaluate(node => {
        const sign = node.getBoundingClientRect();
        const food = document.querySelector(node.classList.contains('station-follow') ? '.town-art .food-bun' : '.town-art .food-noodles').getBoundingClientRect();
        return sign.right <= food.left || sign.left >= food.right || sign.bottom <= food.top || sign.top >= food.bottom;
      }), `Food obscured by ${id} at ${width}`);
    }
    for (const phase of ['dusk', 'night', 'morning', 'day']) {
      await page.locator('#fixed-phase').click();
      assert.equal(await page.locator('html').getAttribute('data-light'), phase);
      if (phase === 'night') {
        assert.equal(await page.locator('.town-art .night-light').first().evaluate(node => getComputedStyle(node).opacity), '1');
        await checkButtons(page, '.station-message a, .station-message button, .town-tools button');
        await screenshot(page, `town-night-${width}x${height}`);
      }
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    pass(`Layout, exposed food, controls and four light phases: ${width}x${height}`);
    await context.close();
  }
  if (!captureOnly) {
    {
      const { context, page } = await open(390,844);
      await ready(page);
      const before = await logicalX(page);
      const scale = await page.locator('#town-canvas').evaluate(node => Number(node.style.getPropertyValue('--scene-scale')));
      await drag(page, '#town-player', 60, { touch: true });
      assert(Math.abs(await logicalX(page) - before - 60 / scale) < 1, 'Camera must not amplify touch dragging');
      await drag(page, '#town-player', -40);
      const beforePan = await logicalX(page);
      await page.mouse.move(300,250); await page.mouse.down(); await page.mouse.move(240,250,{steps:6}); await page.mouse.up();
      assert(Math.abs(await logicalX(page) - beforePan - 60 / scale) < 1);
      await page.locator('#town-viewport').focus();
      const beforeKey = await logicalX(page);
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(250); await page.keyboard.up('ArrowRight');
      assert(await logicalX(page) > beforeKey + 30);
      const beforeButton = await logicalX(page);
      const arrow = await page.locator('#walk-right').boundingBox();
      await page.mouse.move(arrow.x+arrow.width/2,arrow.y+arrow.height/2);
      await page.mouse.down(); await page.waitForTimeout(200); await page.mouse.up();
      assert(await logicalX(page)>beforeButton+25,'Holding the character arrow moves the character');
      await page.locator('[data-walk="message"]').click();
      await page.locator('#copy-invite').click();
      assert.equal(await page.evaluate(() => window.copiedText), '请吃饭');
      assert(await page.locator('#copy-invite').evaluate(node => node.classList.contains('is-copied')));
      await page.evaluate(() => { window.denyClipboard = true; document.execCommand = () => false; });
      await page.locator('#copy-invite').click();
      assert.match(await page.locator('#town-toast').textContent(), /直接选中/);
      assert.equal(await page.locator('#invite-word').evaluate(node => getComputedStyle(node).userSelect), 'all');
      for (const selector of ['#follow-link', '#message-link']) {
        await page.locator(selector).focus();
        const popupPromise = page.waitForEvent('popup');
        await page.locator(selector).click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        assert.equal(popup.url(), 'https://space.bilibili.com/630698674');
        await popup.close();
      }
      await page.locator('.town-back').click(); await page.waitForURL(origin + '/');
      pass('Mouse/touch dragging, background pan, keyboard, clipboard outcomes and real link clicks');
      await context.close();
    }
    {
      const { context, page } = await open(390,844,{motion:'no-preference'});
      await page.goto(origin+'/snack-town/');
      assert.equal(await page.locator('html').getAttribute('data-intro'),'playing');
      await page.mouse.click(220,240);
      assert.equal(await page.locator('html').getAttribute('data-intro'),'ready');
      assert.equal(await page.locator('#cycle-mode span').textContent(),'10');
      await page.locator('#replay-boot').click();
      await page.waitForFunction(() => document.documentElement.dataset.intro === 'ready');
      await page.locator('#town-viewport').focus();
      const before = await logicalX(page);
      await page.mouse.click(290,780);
      await page.waitForTimeout(1600);
      assert(await logicalX(page) > before + 30, 'Clicking the road moves the character');
      const animate = await page.locator('.town-cloud').evaluate(node => getComputedStyle(node).translate);
      await page.waitForTimeout(100);
      assert.notEqual(await page.locator('.town-cloud').evaluate(node => getComputedStyle(node).translate),animate);
      await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange')); });
      const clock = await page.locator('#cycle-mode').getAttribute('style');
      assert.equal(await page.locator('.town-cloud').evaluate(node => getComputedStyle(node).animationPlayState),'paused');
      await page.waitForTimeout(1100);
      assert.equal(await page.locator('#cycle-mode').getAttribute('style'),clock);
      await page.evaluate(() => { delete document.hidden;document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(1100);
      assert.notEqual(await page.locator('#cycle-mode').getAttribute('style'),clock);
      await context.close();
      pass('Opening interruption/replay, road movement, environment animation and hidden clock suspension');
    }
    {
      const { context, page } = await open(390,844,{javaScriptEnabled:false});
      await page.goto(origin+'/snack-town/',{waitUntil:'networkidle'});
      assert(await page.locator('.town-art').evaluate(node => node.complete && node.naturalWidth>0));
      await checkButtons(page,'.town-fallback a, .town-back');
      assert.match(await page.locator('.town-fallback').textContent(),/请吃饭/);
      await screenshot(page,'town-no-script');
      await page.locator('.town-fallback a').last().click(); await page.waitForURL(origin+'/');
      await context.close();
      pass('No-script artwork, invitation phrase and working fallback navigation');
    }
    for (const [width,height] of [[1440,900],[390,844]]) {
      const { context,page }=await open(width,height);
      for (const pathname of ['/not-found','/unknown/nested/page']) {
        const response=await page.goto(origin+pathname,{waitUntil:'networkidle'});
        assert.equal(response.status(),404);
        const beforeFlip=await page.locator('#boundary-player').boundingBox();
        await page.locator('#boundary-player').evaluate(node=>{node.dataset.direction='left';});
        const afterFlip=await page.locator('#boundary-player').boundingBox();
        assert(Math.abs(afterFlip.x+afterFlip.width/2-beforeFlip.x-beforeFlip.width/2)<8,'Changing direction must not shift the character');
        await page.locator('#boundary-player').evaluate(node=>{node.dataset.direction='right';});
        await screenshot(page,`404-${width}x${height}`);
        await page.waitForTimeout(50);
        assert.equal(new URL(page.url()).pathname,pathname);
        await page.locator('#boundary-scene').focus();
        await page.keyboard.down('ArrowLeft');
        await page.waitForURL(origin+'/');
        await page.keyboard.up('ArrowLeft');
      }
      await page.goto(origin+'/missing');
      const initialX=await page.locator('#boundary-player').evaluate(node=>node.transform.baseVal.getItem(0).matrix.e);
      const units=await page.locator('#boundary-scene').evaluate(node=>node.viewBox.baseVal.width/node.clientWidth);
      await drag(page,'#boundary-player',40,{touch:width<600});
      assert(Math.abs(await page.locator('#boundary-player').evaluate(node=>node.transform.baseVal.getItem(0).matrix.e)-initialX-40*units)<1,'404 camera must not amplify character dragging');
      for(let i=0;i<12;i++) {
        const playerX=await page.locator('#boundary-player').evaluate(node=>node.transform.baseVal.getItem(0).matrix.e);
        if(playerX<=120) break;
        const rect=await page.locator('#boundary-player').boundingBox();
        const units=await page.locator('#boundary-scene').evaluate(node=>node.viewBox.baseVal.width/node.clientWidth);
        const delta=-Math.min((playerX-100)/units,180,rect.x+rect.width/2-15);
        await drag(page,'#boundary-player',delta,{touch:width<600,cancel:true});
      }
      assert(await page.locator('#boundary-player').evaluate(node=>node.transform.baseVal.getItem(0).matrix.e)<=120);
      assert.equal(new URL(page.url()).pathname,'/missing');
      await page.setViewportSize({width:width+1,height});
      assert.equal(new URL(page.url()).pathname,'/missing');
      await page.setViewportSize({width,height});
      await screenshot(page,`404-exit-${width}x${height}`);
      await page.locator('#boundary-exit text').click();
      await page.waitForURL(origin+'/');
      await page.goto(origin+'/missing');
      // Move in screen-sized gestures. Character drags must navigate only on release.
      for(let i=0;i<8 && !page.url().endsWith('/');i++) {
        const rect=await page.locator('#boundary-player').boundingBox();
        const delta=-Math.min(180,rect.x+rect.width/2-15);
        await drag(page,'#boundary-player',delta,{touch:width<600,beforeRelease:async()=>assert.equal(new URL(page.url()).pathname,'/missing')});
        await page.waitForTimeout(100);
      }
      await page.waitForURL(origin+'/');
      await page.goto(origin+'/missing');
      await page.mouse.move(width/2,height/2); await page.mouse.wheel(-1600,0);
      await page.waitForURL(origin+'/');
      await context.close();
      pass(`404 status, left exit, dragging, cancellation, resize and wheel: ${width}x${height}`);
    }
    {
      const { context,page }=await open(390,844);
      await page.goto('https://preview.github.io/breztop_web/missing/deep');
      assert(await page.locator('[data-home]').evaluateAll(nodes=>nodes.every(node=>node.getAttribute('href')==='/breztop_web/')));
      await page.locator('.home').click(); await page.waitForURL('https://preview.github.io/breztop_web/');
      await page.goto('https://brez.top/missing/deep');
      assert(await page.locator('[data-home]').evaluateAll(nodes=>nodes.every(node=>node.getAttribute('href')==='https://brez.top/')));
      await page.locator('.home').click(); await page.waitForURL('https://brez.top/');
      await context.close();
      pass('404 home target on custom domain and GitHub Pages project paths');
    }
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(missing,[]);
  pass('No page errors or missing local resources');
  await writeFile(path.join(output,'results.json'),JSON.stringify({mode:captureOnly?'capture':sizes.length?'full':'interactions',results,errors,missing},null,2));
  console.log(`Screenshots: ${output}`);
} finally {
  if(browser) await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
