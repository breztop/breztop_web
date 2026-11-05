// Explicit publication boundary. Never replace this with a recursive repository copy.
import { portfolioPublicFiles } from './portfolio-files.mjs';

export const publicFiles = Object.freeze([
  'index.html',
  '404.html',
  'sitemap.xml',
  'og.png',
  'apple-touch-icon.png',
  'css/index.css',
  'js/index.js',
  'js/park-art.js',
  'snack-town/index.html',
  'snack-town/styles.css',
  'snack-town/main.js',
  'snack-town/street.svg',
  'personal-match-site/index.html',
  'personal-match-site/styles.css',
  'personal-match-site/main.js',
  'personal-match-site/icon.svg',
  'personal-match-site/park-scene.svg',
  ...portfolioPublicFiles,
]);
