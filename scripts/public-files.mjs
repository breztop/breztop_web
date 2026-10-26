// Explicit publication boundary. Never replace this with a recursive repository copy.
import { portfolioPublicFiles } from './portfolio-files.mjs';

export const publicFiles = Object.freeze([
  'index.html',
  '404.html',
  'sitemap.xml',
  'css/index.css',
  'js/index.js',
  'personal-match-site/index.html',
  'personal-match-site/styles.css',
  'personal-match-site/main.js',
  'personal-match-site/icon.svg',
  'personal-match-site/park-scene.svg',
  ...portfolioPublicFiles,
]);
