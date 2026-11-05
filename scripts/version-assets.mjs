import { createHash } from 'node:crypto';
import path from 'node:path';

// Keep each published page and its module graph on the same CDN cache version.
export function versionAssets(files) {
  const hash = createHash('sha256');
  for (const [file, bytes] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    hash.update(file).update('\0').update(bytes);
  }
  const version = hash.digest('hex').slice(0, 12);
  const output = new Map(files);
  for (const [file, bytes] of files) {
    if (!/\.(?:html|css|js)$/.test(file)) continue;
    const reference = value => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value;
      const [url, fragment] = value.split('#');
      const [assetPath, query = ''] = url.split('?');
      if (!/\.(?:css|js|svg|png|webp)$/.test(assetPath)) return value;
      const resolved = assetPath.startsWith('/') ? assetPath.slice(1) : path.posix.join(path.posix.dirname(file), assetPath);
      if (!files.has(resolved)) return value;
      const params = new URLSearchParams(query);
      params.set('v', version);
      return `${assetPath}?${params}${fragment === undefined ? '' : `#${fragment}`}`;
    };
    let text = bytes.toString();
    if (file.endsWith('.html')) {
      text = text.replace(/(\b(?:src|href)=["'])([^"']+)(["'])/g, (_, before, value, after) => before + reference(value) + after);
      text = text.replace(/(\bsrcset=["'])([^"']+)(["'])/g, (_, before, value, after) => before + value.split(',').map(candidate => candidate.replace(/^(\s*)(\S+)/, (_, space, url) => space + reference(url))).join(',') + after);
    } else if (file.endsWith('.js')) {
      text = text.replace(/(\bfrom\s*|\bimport\s*)(["'])(\.[^"']+)\2/g, (_, before, quote, value) => before + quote + reference(value) + quote);
    } else {
      text = text.replace(/url\((["']?)([^)'"\s]+)\1\)/g, (_, quote, value) => `url(${quote}${reference(value)}${quote})`);
    }
    output.set(file, Buffer.from(text));
  }
  return output;
}
