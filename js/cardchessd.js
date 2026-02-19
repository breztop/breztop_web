(function () {
  'use strict';

  var PLATFORMS = {
    android: { id:'android', label:'Android', cls:'android', icon:'🤖', href:'/dl/android', ext:'APK' },
    windows: { id:'windows', label:'Windows', cls:'windows', icon:'🪟', href:'/dl/windows', ext:'EXE' }
  };

  // ── OS Detection ────────────────────────────────────────────────────────
  function detectOS() {
    var ua = navigator.userAgent;
    if (/android/i.test(ua))                         return 'android';
    if (/Win(dows|NT|32|64|CE|95|98|ME)/i.test(ua)) return 'windows';
    return 'other';
  }

  var os = detectOS();

  var osBadge = document.getElementById('os-badge');
  var dlArea  = document.getElementById('dl-area');
  var altSec  = document.getElementById('alt-section');

  // ── OS badge ─────────────────────────────────────────────────────────────
  var primary = PLATFORMS[os];
  if (primary) {
    osBadge.className = 'os-badge ' + primary.cls;
    osBadge.innerHTML = '<span aria-hidden="true">' + primary.icon + '</span>\u2002已识别：' + primary.label;
  } else {
    osBadge.className = 'os-badge other';
    osBadge.innerHTML = '<span aria-hidden="true">💻</span>\u2002未检测到支持的系统';
  }

  // ── Download SVG helper ──────────────────────────────────────────────────
  function dlIcon(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>'
      + '<polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
      + '</svg>';
  }

  // ── Primary download area ────────────────────────────────────────────────
  if (!primary) {
    dlArea.innerHTML =
      '<div class="coming-soon">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
      + '</svg>'
      + '<div><div class="coming-title">即将推出</div>'
      + '<div>iOS / macOS / Linux 版本正在开发中，敬请期待</div></div>'
      + '</div>';
  } else {
    dlArea.innerHTML =
      '<a class="dl-btn" href="' + primary.href + '" aria-label="下载 ' + primary.label + ' 版本 (' + primary.ext + ')">'
      + dlIcon(18) + '下载 ' + primary.label + ' 版</a>';
  }

  // ── Alt versions ────────────────────────────────────────────────────────
  var altKeys = Object.keys(PLATFORMS).filter(function (k) { return k !== os; });

  if (altKeys.length > 0) {
    var html = '<div class="alt-heading">其他可用版本</div>';
    altKeys.forEach(function (k) {
      var p = PLATFORMS[k];
      html +=
        '<div class="alt-row">'
        + '<span class="alt-badge ' + p.cls + '" aria-hidden="true">' + p.icon + '\u2002' + p.label + '</span>'
        + '<div class="alt-info"><div class="alt-name">' + p.label + ' 版 (' + p.ext + ')</div></div>'
        + '<a class="alt-dl-btn" href="' + p.href + '" aria-label="下载 ' + p.label + ' 版本">'
        + dlIcon(14) + '下载</a>'
        + '</div>';
    });
    altSec.innerHTML = html;
  }

}());
