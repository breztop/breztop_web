import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { translations, featuredProjects } from '../resume/locales/translations.js';
import { renderResume, validateTranslations, checkResumeHtml } from './render-resume.mjs';

test('three complete languages render selected project responsibilities without personal placeholders', () => {
  assert.deepEqual(featuredProjects.map(project => project.id), ['cards', 'breconn', 'breflow']);
  for (const language of ['zh', 'en', 'ja']) {
    const html = renderResume(language);
    assert.equal((html.match(/class="project-entry"/g) || []).length, featuredProjects.length);
    for (const project of featuredProjects) if (project.href) assert(html.includes(`href="${project.href}"`));
    assert.doesNotMatch(html, /href="null"/);
    assert.equal((html.match(/class="project-link"/g) || []).length, featuredProjects.filter(project => project.href).length);
    for (const id of ['home', 'about', 'future', 'contact']) assert(html.includes(`id="${id}"`));
    assert.doesNotMatch(html, /id="(?:experience|education)"|skill-progress|future-tab|hero-headline|personal-note|undefined/);
    assert.equal((html.match(/data-i18n="projects.items.\d.bullets.\d"/g) || []).length, featuredProjects.length * 2);
  }
  assert.doesNotMatch(JSON.stringify(translations), /Beijing|北京|5年|5 Years|2018|2021|2024|2025|学士|Bachelor|某.*公司|A\/V Tech Company|把底层能力|继续构建|Start a conversation|breinput|元素人/);
});
test('missing translated project facts and required fields fail before generation', () => {
  const incomplete = structuredClone(translations);
  delete incomplete.en.projects.items[1].bullets[1];
  assert.throws(() => validateTranslations(incomplete), /Incomplete resume language/);
  const missing = structuredClone(translations);
  for (const dictionary of Object.values(missing)) delete dictionary.home.role;
  assert.throws(() => validateTranslations(missing), /Missing resume field/);
  const partial = structuredClone(translations);
  for (const dictionary of Object.values(partial)) dictionary.projects.items[0].bullets.pop();
  assert.throws(() => validateTranslations(partial), /Incomplete project entry/);
});
test('project copy is escaped in visible HTML and metadata attributes', () => {
  const dictionaries = structuredClone(translations);
  dictionaries.zh.projects.items[0].bullets[0] = '<img src=x onerror="alert(1)"> & text';
  dictionaries.zh.description = '" onload="alert(1)';
  const html = renderResume('zh', dictionaries);
  assert(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; text'));
  assert(html.includes('content="&quot; onload=&quot;alert(1)"'));
  assert.doesNotMatch(html, /<img|content="" onload=/);
});
test('generated HTML is synchronized and stale manual changes are rejected', async () => {
  const actual = await readFile(new URL('../resume/index.html', import.meta.url), 'utf8');
  checkResumeHtml(actual);
  checkResumeHtml(actual.replace(/\r?\n/g, '\r\n'));
  assert.throws(() => checkResumeHtml(actual.replace('breztop@qq.com', 'stale@example.com')), /Resume HTML is stale/);
});
