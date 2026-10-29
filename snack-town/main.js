(() => {
  'use strict';
  const boot = document.getElementById('town-boot');
  const shell = document.getElementById('town-shell');
  const viewport = document.getElementById('town-viewport');
  const world = document.getElementById('town-world');
  const canvas = document.getElementById('town-canvas');
  const player = document.getElementById('town-player');
  const status = document.getElementById('town-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const destinations = {
    follow: { x: 650, label: '到了关注小摊。在 B 站关注「微风中的快乐」。' },
    message: { x: 1220, label: '到了请吃饭邮局。复制「请吃饭」，去 B 站主页点「发消息」。' },
  };
  const bootScenes = [
    { title: '欢迎来到<br>好吃小镇', duration: 1600 },
    { title: '我有一个<br>吃遍世界的梦。', duration: 2000 },
    { title: '今天，<br>请我吃饭。', duration: 1800 },
  ];
  let booting = true;
  let bootTimer = 0;
  const worldWidth = 1880;
  const worldHeight = 900;
  let sceneScale = 1;
  let x = 940;
  let frame = 0;
  let lastTick = 0;
  let travel = null;
  let dragging = null;
  let toastTimer = 0;
  const keys = new Set();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function layout() {
    sceneScale = Math.max(viewport.clientHeight / worldHeight, viewport.clientWidth / worldWidth, .72);
    world.style.width = `${worldWidth * sceneScale}px`;
    world.style.height = `${worldHeight * sceneScale}px`;
    world.style.top = `${viewport.clientHeight - worldHeight * sceneScale}px`;
    canvas.style.transform = `scale(${sceneScale})`;
    canvas.style.setProperty('--scene-scale', sceneScale);
    paintPlayer();
  }
  function paintPlayer(follow = true) {
    x = clamp(x, 55, worldWidth - 55);
    player.style.transform = `translateX(${(x - 40).toFixed(2)}px)`;
    if (follow) viewport.scrollLeft = clamp(x * sceneScale - viewport.clientWidth * .48, 0, world.clientWidth - viewport.clientWidth);
    let nearby = null;
    for (const [id, destination] of Object.entries(destinations)) {
      const active = Math.abs(x - destination.x) < 145;
      const button = document.querySelector(`[data-walk="${id}"]`);
      if (active) { button.setAttribute('aria-current', 'location'); nearby = destination; }
      else button.removeAttribute('aria-current');
    }
    const label = nearby?.label || '先去关注小摊，再到邮局说声「请吃饭」。';
    if (status.textContent !== label) status.textContent = label;
  }
  function stopWalking() {
    keys.clear(); travel = null; dragging = null; lastTick = 0;
    cancelAnimationFrame(frame); frame = 0;
    player.classList.remove('is-walking');
  }
  function tick(now) {
    frame = 0;
    if (booting || document.hidden) { stopWalking(); return; }
    const dt = Math.min((now - (lastTick || now)) / 1000, .05);
    lastTick = now;
    const direction = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    if (direction) { travel = null; x += direction * 220 * dt; player.dataset.direction = direction < 0 ? 'left' : 'right'; }
    else if (travel) {
      const progress = clamp((now - travel.start) / travel.duration, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      x = travel.from + (travel.to - travel.from) * eased;
      if (progress >= 1) travel = null;
    }
    paintPlayer();
    const walking = direction !== 0 || travel !== null;
    player.classList.toggle('is-walking', walking);
    if (walking) frame = requestAnimationFrame(tick); else lastTick = 0;
  }
  function requestWalk() { if (!frame && !booting) frame = requestAnimationFrame(tick); }
  function walkTo(id) {
    if (booting || !destinations[id]) return;
    const target = destinations[id].x;
    stopWalking();
    player.dataset.direction = target < x ? 'left' : 'right';
    if (reducedMotion.matches) { x = target; paintPlayer(); return; }
    travel = { from: x, to: target, start: performance.now(), duration: clamp(Math.abs(target - x) * 1.7, 550, 1700) };
    player.classList.add('is-walking'); requestWalk();
  }
  function finishBoot() {
    clearTimeout(bootTimer); booting = false;
    boot.hidden = true; shell.hidden = false;
    document.body.classList.remove('is-booting');
    x = viewport.clientWidth <= 600 ? destinations.follow.x : 940;
    layout(); viewport.focus({ preventScroll: true });
  }
  function showBootPhase(index) {
    clearTimeout(bootTimer);
    if (index >= bootScenes.length) { finishBoot(); return; }
    const scene = bootScenes[index];
    boot.dataset.phase = String(index + 1);
    document.getElementById('boot-title').innerHTML = scene.title;
    const center = document.querySelector('.boot-center');
    center.classList.remove('is-changing'); void center.offsetWidth; center.classList.add('is-changing');
    bootTimer = setTimeout(() => showBootPhase(index + 1), scene.duration);
  }
  function startBoot() {
    stopWalking(); booting = true; shell.hidden = true; boot.hidden = false;
    document.body.classList.add('is-booting');
    if (reducedMotion.matches) { finishBoot(); return; }
    showBootPhase(0); document.getElementById('skip-boot').focus({ preventScroll: true });
  }
  document.getElementById('skip-boot').addEventListener('click', finishBoot);
  document.getElementById('replay-boot').addEventListener('click', startBoot);
  document.querySelectorAll('[data-walk]').forEach(button => button.addEventListener('click', () => walkTo(button.dataset.walk)));
  for (const direction of ['left', 'right']) {
    const button = document.getElementById(`walk-${direction}`);
    button.addEventListener('pointerdown', event => {
      if (booting || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      player.dataset.direction = direction;
      x += direction === 'left' ? -12 : 12; paintPlayer();
      keys.add(direction); requestWalk();
    });
    const release = () => { keys.delete(direction); requestWalk(); };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, release);
    button.addEventListener('click', event => {
      if (event.detail === 0) { stopWalking(); x += direction === 'left' ? -90 : 90; player.dataset.direction = direction; paintPlayer(); }
    });
  }
  window.addEventListener('keydown', event => {
    if (booting || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); keys.add(event.key === 'ArrowLeft' ? 'left' : 'right'); requestWalk();
  });
  window.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft') keys.delete('left');
    if (event.key === 'ArrowRight') keys.delete('right');
    if (keys.size) requestWalk();
  });
  window.addEventListener('blur', stopWalking);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopWalking(); });
  player.addEventListener('pointerdown', event => {
    if (booting || (event.pointerType === 'mouse' && event.button !== 0)) return;
    stopWalking(); dragging = { id: event.pointerId, pointerX: event.clientX, from: x };
    player.setPointerCapture(event.pointerId); event.preventDefault();
  });
  player.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragging.id) return;
    const next = dragging.from + (event.clientX - dragging.pointerX) / sceneScale;
    player.dataset.direction = next < x ? 'left' : 'right'; x = next;
    player.classList.add('is-walking'); paintPlayer(); event.preventDefault();
  });
  const releasePlayer = () => { dragging = null; player.classList.remove('is-walking'); };
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) player.addEventListener(event, releasePlayer);
  window.addEventListener('resize', () => { if (!booting) layout(); });
  reducedMotion.addEventListener('change', () => { stopWalking(); if (reducedMotion.matches && booting) finishBoot(); });
  function toast(message, copied) {
    const element = document.getElementById('town-toast');
    element.textContent = message;
    const button = document.getElementById('copy-invite');
    button.classList.toggle('is-copied', copied);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => button.classList.remove('is-copied'), 3500);
  }
  document.getElementById('copy-invite').addEventListener('click', async () => {
    let copied = false;
    try { await navigator.clipboard.writeText('请吃饭'); copied = true; }
    catch {
      const input = document.createElement('textarea');
      input.value = '请吃饭'; input.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(input); input.select();
      try { copied = document.execCommand('copy'); } catch { /* The phrase on the sign remains selectable. */ }
      input.remove(); document.getElementById('copy-invite').focus({ preventScroll: true });
    }
    toast(copied ? '已复制「请吃饭」。去 B 站主页点「发消息」，粘贴发送就好。' : '可以直接选中「请吃饭」复制，再去 B 站发送私信。', copied);
  });
  startBoot();
})();
