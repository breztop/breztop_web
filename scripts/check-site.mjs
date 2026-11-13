import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicFiles } from './public-files.mjs';
import { portfolioProjectIds } from './portfolio-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = process.argv[2] ? path.resolve(process.argv[2]) : root;
const problems = [];
const content = new Map();

for (const file of publicFiles) {
  const target = path.join(directory, file);
  try {
    if (!(await lstat(target)).isFile()) throw new Error('Not a regular file');
    // Raster assets are checked for presence, without interpreting binary bytes as personal data.
    const text = /\.(?:html|css|js|svg|xml|json|txt)$/.test(file) ? await readFile(target, 'utf8') : '';
    content.set(file, text);
    // Report the path only: a failing scan must never echo private values to CI logs.
    if (/(?<![\d.])(?:\+?86[ -]?)?1[3-9]\d{9}(?![\d.])/.test(text)) {
      problems.push(`${file}: possible personal phone number; review before publication`);
    }
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"']{12,}["']/i.test(text)) {
      problems.push(`${file}: possible credential; review before publication`);
    }
  } catch {
    problems.push(`${file}: missing or unreadable public file`);
  }
}

const page = content.get('personal-match-site/index.html') || '';
const script = content.get('personal-match-site/main.js') || '';
if (!/<meta\b[^>]*name="robots"[^>]*content="noindex, nofollow, noarchive"/.test(page)) {
  problems.push('Personal page must retain its search-index opt-out');
}
if (!page.includes('connect-src \'none\'') || !page.includes('form-action \'none\'')) {
  problems.push('Personal page must retain its no-collection content security policy');
}
if (!/<meta\b[^>]*name="referrer"[^>]*content="no-referrer"/.test(page)) {
  problems.push('Personal page must retain its referrer policy');
}
if (/(?:src|href)=["'](?:https?:)?\/\//i.test(page) || /<form\b|\b(?:tel|weixin|wxp):/i.test(page)) {
  problems.push('Personal page has an external asset, data form or direct private contact');
}
if (/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\b|\bdocument\.cookie|\bsendBeacon\b/.test(script)) {
  problems.push('Personal page script must keep selections in memory without collection or storage');
}
if (!(content.get('index.html') || '').includes('href="./personal-match-site/"')) {
  problems.push('Home page is missing the personal-page entrance');
}
if (!(content.get('index.html') || '').includes('href="./project-show/"')) {
  problems.push('Home page is missing its separate Project entrance');
}
for (const id of portfolioProjectIds) {
  if (!content.has(`project-show/projects/${id}/index.html`) || !content.has(`project-show/styles/${id}.css`)) {
    problems.push(`Portfolio is missing the independent ${id} page or stylesheet`);
  }
}
for (const [file, text] of content) {
  if (!file.startsWith('project-show/')) continue;
  if (/<RouterLink\b|\bv-(?:for|if|model)=|data-v-[a-f\d]{8}|__VUE__|\b(?:createApp|createRouter|defineAsyncComponent)\s*\(/.test(text)) {
    problems.push(`${file}: leftover framework code in the native portfolio`);
  }
  if (/\.(?:html|js|css|svg)$/.test(file) && /(?:[A-Z]:[\\/](?:Users|1_Code)|file:\/\/)/i.test(text)) {
    problems.push(`${file}: local workstation path must not be published`);
  }
}

// Resolve every local HTML reference, including anchors, against the files being published.
for (const [file, text] of content) {
  if (!file.endsWith('.html')) continue;
  // Inline scripts can contain assignments such as link.href=; these are not HTML attributes.
  const markup = text.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi, '<$1$2>');
  const references = [...markup.matchAll(/\b(?:href|src)=["']([^"']*)["']/g)].map(match => match[1]);
  for (const match of markup.matchAll(/\bsrcset=["']([^"']*)["']/g)) {
    references.push(...match[1].split(',').map(candidate => candidate.trim().split(/\s+/)[0]));
  }
  for (const reference of references) {
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) continue;
    const [url, fragment] = reference.split('#');
    const urlPath = url.split('?')[0];
    let resolved = urlPath.startsWith('/') ? urlPath.slice(1) : path.posix.join(path.posix.dirname(file), urlPath || path.posix.basename(file));
    if (!urlPath) resolved = file;
    if (resolved === '.' || resolved.endsWith('/') || !path.posix.extname(resolved)) resolved = path.posix.join(resolved, 'index.html');
    // Existing 404 suggestions are client-generated; only real HTML references are checked here.
    if (!content.has(resolved)) {
      problems.push(`${file}: local reference is not published: ${reference}`);
    } else if (fragment && !new RegExp(`\\bid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(content.get(resolved))) {
      problems.push(`${file}: missing anchor: ${reference}`);
    }
  }
}

// Verify crawler-facing resources against what is actually published.
const home = content.get('index.html') || '';
const head = home.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
const brand = '微风中的快乐';
const title = head.match(/<title>([^<]+)<\/title>/i)?.[1];
const meta = attribute => head.match(new RegExp(`<meta\\b[^>]*(?:name|property)="${attribute}"[^>]*content="([^"]*)"`, 'i'))?.[1];
if (!title?.startsWith(brand) || meta('author') !== brand || meta('og:site_name') !== brand) {
  problems.push('Home page must consistently identify 微风中的快乐 as its brand');
}
if (meta('og:title') !== title || meta('twitter:title') !== title
  || !meta('description')?.includes(brand) || meta('og:description') !== meta('description')
  || meta('twitter:description') !== meta('description')) {
  problems.push('Home page search and sharing metadata must stay consistent');
}
if (!/<link\b[^>]*rel="canonical"[^>]*href="https:\/\/brez\.top\/"/.test(head)
  || !/\bindex\b/.test(meta('robots') || '') || /\b(?:noindex|nofollow|none)\b/.test(meta('robots') || '')) {
  problems.push('Home page must be indexable at its canonical URL');
}
try {
  const blocks = [...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const nodes = blocks.flatMap(([, json]) => { const data = JSON.parse(json); return data['@graph'] || [data]; });
  const sites = nodes.filter(node => node['@type'] === 'WebSite');
  const person = nodes.find(node => node['@type'] === 'Person');
  const webpage = nodes.find(node => node['@type'] === 'WebPage');
  if (sites.length !== 1 || sites[0].name !== brand || sites[0].url !== 'https://brez.top/'
    || person?.name !== brand || sites[0].publisher?.['@id'] !== person?.['@id']
    || webpage?.isPartOf?.['@id'] !== sites[0]['@id'] || webpage?.author?.['@id'] !== person?.['@id']
    || webpage?.name !== title || webpage?.description !== meta('description')
    || webpage?.usageInfo !== 'https://brez.top/content-usage.txt') throw new Error();
} catch { problems.push('Home page must have valid, linked WebSite, Person and WebPage structured data'); }
const navigation = home.match(/<nav\b[^>]*id="page-navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
const destinations = [...navigation.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]);
if ((home.match(/<nav\b/g) || []).length !== 1 || destinations.length !== 8
  || new Set(destinations).size !== destinations.length) {
  problems.push('Home page must publish one complete, non-duplicated HTML navigation');
}
const robots = (content.get('robots.txt') || '').replace(/#.*$/gm, '');
if (!/^User-agent:\s*\*\s*$/im.test(robots) || !/^Allow:\s*\/\s*$/im.test(robots)
  || /^Disallow:\s*\S+/im.test(robots) || !/^Sitemap:\s*https:\/\/brez\.top\/sitemap\.xml\s*$/im.test(robots)) {
  problems.push('robots.txt must allow public crawling and advertise the canonical sitemap');
}
if (!(content.get('content-usage.txt') || '').includes(brand)
  || !(content.get('content-usage.txt') || '').includes('禁止断章取义')) {
  problems.push('Content usage terms must require attribution and preserve context');
}
for (const [file, width, height] of [['og.png', 120, 63], ['apple-touch-icon.png', 180, 180]]) {
  try {
    const bytes = await readFile(path.join(directory, file));
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) {
      problems.push(`${file}: incorrect PNG format or dimensions`);
    }
  } catch { problems.push(`${file}: missing image`); }
}
for (const [, location] of (content.get('sitemap.xml') || '').matchAll(/<loc>([^<]+)<\/loc>/g)) {
  try {
    const url = new URL(location);
    const file = path.posix.join(decodeURIComponent(url.pathname).replace(/^\//, ''), 'index.html');
    if (url.origin !== 'https://brez.top' || !content.has(file)) problems.push(`Sitemap references an unpublished page: ${location}`);
    else if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(content.get(file))) problems.push(`Sitemap includes a noindex page: ${file}`);
  } catch { problems.push('Sitemap has an invalid URL'); }
}

// Artifact directories must contain exactly the allowlist, without leftover files or symlinks.
if (directory !== root) {
  const actual = [];
  async function walk(folder, prefix = '') {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isDirectory()) await walk(path.join(folder, entry.name), relative + '/');
      else if (entry.isFile()) actual.push(relative);
      else problems.push(`${relative}: unsupported artifact type`);
    }
  }
  await walk(directory);
  for (const file of actual) if (!publicFiles.includes(file)) problems.push(`${file}: not in the publication allowlist`);
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${publicFiles.length} public files; links, SEO metadata, navigation, crawler resources, image dimensions, sitemap and privacy rules verified.`);
}
