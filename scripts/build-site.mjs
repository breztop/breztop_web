import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { publicFiles } from './public-files.mjs';
import { versionAssets } from './version-assets.mjs';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(root, 'dist');
const artworkCheck = spawnSync(process.execPath, [path.join(root, 'scripts/render-town-art.mjs'), '--check'], { cwd: root, stdio: 'inherit' });
if (artworkCheck.status !== 0) process.exit(artworkCheck.status || 1);
const check = spawnSync(process.execPath, [path.join(root, 'scripts/check-site.mjs')], { cwd: root, stdio: 'inherit' });
if (check.status !== 0) process.exit(check.status || 1);

// Check the absolute deletion target and reject a redirected dist before rebuilding it.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Invalid output directory');
try {
  const existing = await lstat(output);
  if (!existing.isDirectory() || existing.isSymbolicLink() || await realpath(output) !== output) {
    throw new Error('The output directory must be a normal directory within this checkout');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await rm(output, { recursive: true, force: true });
await mkdir(output);
const sources = new Map(await Promise.all(publicFiles.map(async file => [file, await readFile(path.join(root, file))])));
for (const [file, bytes] of versionAssets(sources)) {
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}
const artifactCheck = spawnSync(process.execPath, [path.join(root, 'scripts/check-site.mjs'), output], { cwd: root, stdio: 'inherit' });
if (artifactCheck.status !== 0) process.exit(artifactCheck.status || 1);
console.log(`Static site built at ${output}`);
