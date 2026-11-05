import { readFile, writeFile } from 'node:fs/promises';
import { townScene } from '../snack-town/art.js';

// Refresh the no-script image from the same artwork used by the live page.
const css = (await readFile(new URL('../css/index.css', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const palette = css.match(/:root\s*\{[^}]+\}/)[0];
const style = `${palette} text{font-family:inherit;stroke:none}.ride-outline{stroke:var(--metal-dark);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}.ride-shadow{fill:var(--shadow);opacity:.18}.night-light,.town-night{display:none}`;
const svg = townScene().replace(/(<svg\b[^>]*>)/, `$1<style>${style}</style>`).replace(/[ \t]+$/gm, '');
const target = new URL('../snack-town/street.svg', import.meta.url);
const expected = svg + '\n';
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')).replace(/\r\n/g, '\n') !== expected) {
    throw new Error('Town fallback artwork is stale; run node scripts/render-town-art.mjs');
  }
  console.log('PASS: town fallback artwork matches its source');
} else {
  await writeFile(target, expected);
  console.log('Updated snack-town/street.svg from shared town artwork');
}
