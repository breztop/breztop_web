(function(){
  // Fetch stats from GoatCounter
  async function fetchStats(path, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    // 如果你有 API Token，填在这里。如果没有且统计是公开的，API 可能不需要 Token。
    const API_TOKEN = ""; 
    const SITE_URL = "https://stats.brez.top";
    
    try {
      // 这里的 path 是在 GoatCounter 中记录的路径，可能是 'blog.brez.top' 或 '/blog'
      const response = await fetch(`${SITE_URL}/api/v0/stats/hits/${encodeURIComponent(path)}`, {
        headers: API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        el.textContent = data.total || 0;
      } else {
        // 降级方案：如果 API 不可用且是公开统计，尝试通过公共 JSON 获取
        const publicRes = await fetch(`${SITE_URL}/counter/${encodeURIComponent(path)}.json`);
        const publicData = await publicRes.json();
        el.textContent = publicData.count || '...';
      }
    } catch (err) {
      console.warn('Stats fetch error:', err);
      el.textContent = '...';
    }
  }

  // 初始化获取
  fetchStats('blog.brez.top', 'blog-stats');

  // Fullscreen toggle
  const btn = document.getElementById('fs-toggle');
  if(btn){
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
  }
  
  // Share button - copy current URL to clipboard
  const shareBtn = document.getElementById('share-btn');
  if(shareBtn){
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('链接已复制到剪贴板');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          showToast('链接已复制到剪贴板');
        } catch (e) {
          showToast('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
      }
    });
  }
  
  // Toast notification helper
  function showToast(message){
    let toast = document.getElementById('share-toast');
    if(!toast){
      toast = document.createElement('div');
      toast.id = 'share-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
})();
