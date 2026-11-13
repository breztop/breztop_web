import path from 'node:path';
import { publicFiles } from './public-files.mjs';

const creatorUrl = 'https://space.bilibili.com/630698674';
export const toyPublicFiles = Object.freeze([
  ...publicFiles.filter(file => !['robots.txt', 'sitemap.xml'].includes(file)),
  'toy.css',
]);

function replaceRequired(text, before, after, file) {
  if (!text.includes(before)) throw new Error(`${file}: Toy adaptation no longer matches its source`);
  return text.replace(before, after);
}

// Resolve paths within the upload package, without relying on directory-index redirects.
export function toyReference(file, value) {
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value;
  const [, pathname, suffix] = value.match(/^([^?#]*)([\s\S]*)$/);
  if (!pathname) return value;
  let target = pathname.startsWith('/') ? pathname.slice(1) : path.posix.join(path.posix.dirname(file), pathname);
  if (pathname.endsWith('/') || !path.posix.extname(target)) target = path.posix.join(target, 'index.html');
  const relative = path.posix.relative(path.posix.dirname(file), target);
  return (relative.startsWith('.') ? relative : './' + relative) + suffix;
}

function destination(file, value) {
  if (value === creatorUrl) return value;
  if (/^https:\/\/brez\.top(?:\/|$)/i.test(value)) {
    const url = new URL(value);
    const target = url.pathname.endsWith('/') ? url.pathname.slice(1) + 'index.html' : url.pathname.slice(1);
    if (publicFiles.includes(target)) return toyReference(file, '/' + target + url.search + url.hash);
  }
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return null;
  return toyReference(file, value);
}

export function adaptToyFiles(sources) {
  const output = new Map();
  for (const [file, bytes] of sources) {
    if (['robots.txt', 'sitemap.xml'].includes(file)) continue;
    if (!/\.(?:html|js)$/.test(file)) { output.set(file, bytes); continue; }
    let text = bytes.toString();
    if (file.endsWith('.html')) {
      text = text.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (tag, attributes, body) => {
        if (/data-goatcounter|stats\.brez\.top/.test(attributes)) return '';
        const cleaned = body.replace(/\s*window\.goatcounter\s*=\s*\{[^\n]*\};?/g, '');
        return cleaned === body ? tag : cleaned.trim() ? `<script${attributes}>${cleaned}</script>` : '';
      });
      text = text.replace(/\s*<link\b[^>]*rel="sitemap"[^>]*>/gi, '');
      // Keep external text and styling, while removing the actual outbound action.
      text = text.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (tag, attributes, body) => {
        const href = attributes.match(/\bhref=(["'])(.*?)\1/i);
        if (!href) return tag;
        const url = destination(file, href[2]);
        if (url !== null) return `<a${attributes.replace(href[0], `href="${url}"`)}>${body}</a>`;
        const remaining = attributes.replace(/\s+(?:href|target|rel)=(["']).*?\1/gi, '');
        return `<span${remaining} aria-disabled="true"${/\btitle=/.test(remaining) ? '' : ' title="暂未开放"'}>${body}</span>`;
      });
      text = text.replace(/(<[^>]+\s(?:href|src)=["'])([^"']+)(["'][^>]*>)/g,
        (_, before, url, after) => before + toyReference(file, url) + after);
      text = text.replace('</head>', `  <link rel="stylesheet" href="${toyReference(file, '/toy.css')}" />\n</head>`);
    }
    if (file === 'js/index.js') {
      text = text.replace(/\bhref:\s*(['"])(https?:\/\/[^'"]+)\1/g, (property, quote, url) =>
        url === creatorUrl ? property : "closed: true, entryLabel: '暂未开放'");
      text = text.replace(/(\bhref:\s*)(['"])(\.\.?\/[^'"]*)\2/g,
        (_, before, quote, url) => before + quote + toyReference('index.html', url) + quote);
      text = replaceRequired(text,
        "if (!['https:', 'http:'].includes(url.protocol)) throw new TypeError('Robot destinations must use HTTP or HTTPS');",
        `if (url.href !== '${creatorUrl}') throw new TypeError('Robot destination must be the creator’s Bilibili profile');`, file);
    }
    if (file === 'js/park-tools.js') {
      text = replaceRequired(text, "const url = document.querySelector('link[rel=\"canonical\"]').href;",
        `const toyPath = location.pathname.match(/\\/toy\\/([^/]+)/);
    const url = toyPath ? 'https://www.bilibili.com/toy/' + toyPath[1] + '/index.html'
      : new URL('./index.html', location.href).href;`, file);
    }
    if (file === 'resume/js/app.js') {
      text = replaceRequired(text, "new URL('../project-show/', location.href)", "new URL('../project-show/index.html', location.href)", file);
    }
    if (file === 'personal-match-site/main.js') {
      text = replaceRequired(text, 'hello.href = `mailto:${email}?subject=${subject}&body=${body}`;',
        '// Contact actions stay unavailable in the Toy edition.', file);
    }
    if (file === '404.html') {
      const start = text.indexOf("    if (location.hostname.endsWith('.github.io')) {");
      const end = text.indexOf('    (() => {', start);
      if (start < 0 || end < 0) throw new Error('404.html: could not adapt the home-link initialization');
      text = text.slice(0, start) + text.slice(end);
    }
    output.set(file, Buffer.from(text));
  }
  output.set('toy.css', Buffer.from('[aria-disabled="true"] { cursor: default; }\nspan.button[aria-disabled="true"], .guide-destination[aria-disabled="true"] { opacity: .65; }\n'));
  return output;
}

export function checkToyFiles(files) {
  const problems = [];
  if (!files.has('index.html') || files.get('index.html').length > 1024 * 1024) problems.push('Toy requires an index.html no larger than 1 MB');
  for (const name of toyPublicFiles) if (!files.has(name)) problems.push(`Missing Toy file: ${name}`);
  for (const [file, bytes] of files) {
    if (!toyPublicFiles.includes(file)) problems.push(`Unexpected Toy file: ${file}`);
    if (!/\.(?:html|css|js)$/.test(file)) continue;
    const text = bytes.toString();
    if (/data-goatcounter|stats\.brez\.top|window\.goatcounter/.test(text)) problems.push(`${file}: third-party analytics remain`);
    if (file.endsWith('.html')) {
      const markup = text.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi, '<$1$2>');
      for (const [, attributes] of markup.matchAll(/<a\b([^>]*)>/gi)) {
        const href = attributes.match(/\bhref=(["'])(.*?)\1/i)?.[2];
        if (href && destination(file, href) !== href) problems.push(`${file}: unsupported navigation: ${href}`);
      }
      for (const [, attributes] of markup.matchAll(/<(?:script|img|iframe)\b([^>]*)>/gi)) {
        const src = attributes.match(/\bsrc=(["'])(.*?)\1/i)?.[2];
        if (src && /^(?:https?:)?\/\//i.test(src)) problems.push(`${file}: external embedded resource: ${src}`);
      }
      for (const [, reference] of markup.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) checkReference(file, reference);
      for (const [, srcset] of markup.matchAll(/\bsrcset=["']([^"']+)["']/g)) {
        for (const candidate of srcset.split(',')) checkReference(file, candidate.trim().split(/\s+/)[0]);
      }
    } else if (file.endsWith('.js')) {
      for (const [, , reference] of text.matchAll(/\b(?:from|import)\s*(['"])(\.[^'"]+)\1/g)) checkReference(file, reference);
    } else {
      for (const [, , quoted, unquoted] of text.matchAll(/url\(\s*(?:(["'])([\s\S]*?)\1|([^)'"\s]+))\s*\)/g)) checkReference(file, quoted ?? unquoted);
    }
  }
  function checkReference(file, reference) {
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) return;
    const pathname = reference.split(/[?#]/)[0];
    if (reference.startsWith('/') || pathname.endsWith('/')) problems.push(`${file}: path depends on hosting redirects: ${reference}`);
    const target = path.posix.join(path.posix.dirname(file), pathname);
    if (!files.has(target)) problems.push(`${file}: unpublished reference: ${reference}`);
  }
  return problems;
}
