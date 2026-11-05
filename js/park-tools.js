export function initParkTools(root) {
  let toastTimer;
  function toast(message) {
    const element = document.getElementById('toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
  }
  document.getElementById('share-btn').addEventListener('click', async () => {
    const url = document.querySelector('link[rel="canonical"]').href;
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('微风已打包，链接已复制。');
    } catch {
      const input = document.createElement('textarea');
      input.value = url;
      input.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(input);
      input.select();
      try { toast(document.execCommand('copy') ? '微风已打包，链接已复制。' : '请从地址栏复制主页链接。'); }
      catch { toast('请从地址栏复制主页链接。'); }
      input.remove();
      document.getElementById('share-btn').focus();
    }
  });
  const fullscreenButton = document.getElementById('fs-toggle');
  if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.requestFullscreen();
    } catch { toast('当前浏览器暂时无法进入全屏。'); }
  });
  document.addEventListener('fullscreenchange', () => {
    const full = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute('aria-pressed', String(full));
    fullscreenButton.setAttribute('aria-label', full ? '退出全屏' : '进入全屏');
  });
}
