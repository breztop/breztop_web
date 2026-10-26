import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicFiles } from './public-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = process.argv[2] ? path.resolve(process.argv[2]) : root;
const problems = [];
const content = new Map();

for (const file of publicFiles) {
  const target = path.join(directory, file);
  try {
    if (!(await lstat(target)).isFile()) throw new Error('Not a regular file');
    const text = await readFile(target, 'utf8');
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

// Resolve every local HTML reference, including anchors, against the files being published.
for (const [file, text] of content) {
  if (!file.endsWith('.html')) continue;
  for (const match of text.matchAll(/\b(?:href|src)=["']([^"']*)["']/g)) {
    const reference = match[1];
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) continue;
    const [urlPath, fragment] = reference.split('#');
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
  console.log(`PASS: ${publicFiles.length} public files; privacy rules and local HTML references verified.`);
}
