import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { publicFiles } from './public-files.mjs';
import { versionAssets } from './version-assets.mjs';
import { adaptToyFiles, checkToyFiles } from './toy-adapter.mjs';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(root, 'dist-toy');
const archive = path.join(root, 'brez-toy.zip');
const nativeBuild = spawnSync(process.execPath, [path.join(root, 'scripts/build-site.mjs')], { cwd: root, stdio: 'inherit' });
if (nativeBuild.error) throw nativeBuild.error;
if (nativeBuild.status !== 0) process.exit(nativeBuild.status || 1);

const sources = new Map(await Promise.all(publicFiles.map(async file => [file, await readFile(path.join(root, file))])));
const files = versionAssets(adaptToyFiles(sources));
const problems = checkToyFiles(files);
if (problems.length) throw new Error(problems.join('\n'));
try {
  const existing = await lstat(archive);
  if (!existing.isFile() || existing.isSymbolicLink()) throw new Error('brez-toy.zip must be a regular file');
} catch (error) { if (error.code !== 'ENOENT') throw error; }

// Only rebuild the fixed, ignored artifact directory; never follow a redirected output.
try {
  const existing = await lstat(output);
  if (!existing.isDirectory() || existing.isSymbolicLink() || await realpath(output) !== output) throw new Error('dist-toy must be a normal directory');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const [file, bytes] of files) {
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}
const zip = spawnSync('python3', ['-c', `
import pathlib, sys, zipfile
folder = pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2], 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(folder.rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(folder))
`, output, archive], { stdio: 'inherit' });
if (zip.error) throw zip.error;
if (zip.status !== 0) process.exit(zip.status || 1);
console.log(`PASS: ${files.size} Toy files; relative paths, local references and outbound links verified.`);
console.log(`Toy directory: ${output}`);
console.log(`Upload ZIP: ${archive}`);
