(function(){
  const btn = document.getElementById('fs-toggle');
  if(!btn) return;
  function update(){
    const is = !!document.fullscreenElement;
    btn.setAttribute('aria-pressed', String(is));
    btn.textContent = is ? '退出全屏' : '全屏';
  }
  btn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen API error:', err);
      alert('当前浏览器不支持全屏或已被限制。');
    }
  });
  document.addEventListener('fullscreenchange', update);
})();
