import { initParkCamera } from '../js/park-camera.js';
import { initParkClock } from '../js/park-clock.js';
import { townScene } from './art.js';

(() => {
  'use strict';
  const root = document.documentElement;
  const viewport = document.getElementById('town-viewport');
  const world = document.getElementById('town-world');
  const canvas = document.getElementById('town-canvas');
  const actor = document.getElementById('town-actor');
  const player = document.getElementById('town-player');
  const tools = document.querySelector('.town-tools');
  const status = document.getElementById('town-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const destinations = {
    follow: { x: 540, label: '到了关注小摊。在 B 站关注「微风中的快乐」。' },
    message: { x: 1340, label: '到了请吃饭邮局。复制「请吃饭」，去 B 站主页点「发消息」。' },
  };
  const worldWidth = 1880;
  const worldHeight = 900;
  const keys = new Set();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let sceneScale = 1;
  let x = 940;
  let frame = 0;
  let lastTick = 0;
  let travel = null;
  let dragging = null;
  let toastTimer = 0;
  let entrance;
  document.querySelector('.town-art').outerHTML = townScene();

  function bounds() {
    const inset = (actor.offsetWidth / 2 + 55) / sceneScale;
    return { min: inset, max: worldWidth - inset };
  }
  function layout() {
    stopWalking();
    sceneScale = Math.max(viewport.clientHeight / worldHeight, viewport.clientWidth / worldWidth, .72);
    world.style.width = `${worldWidth * sceneScale}px`;
    world.style.height = `${worldHeight * sceneScale}px`;
    world.style.top = `${viewport.clientHeight - worldHeight * sceneScale}px`;
    canvas.style.transform = `scale(${sceneScale})`;
    canvas.style.setProperty('--scene-scale', sceneScale);
    paintPlayer();
  }
  function paintPlayer() {
    const limits = bounds();
    x = clamp(x, limits.min, limits.max);
    viewport.scrollLeft = clamp(x * sceneScale - viewport.clientWidth * .48, 0, world.clientWidth - viewport.clientWidth);
    const screenX = x * sceneScale - viewport.scrollLeft;
    const groundY = viewport.clientHeight <= 500 ? 860 : viewport.clientWidth <= 600 ? 800 : 830;
    actor.style.left = `${screenX.toFixed(2)}px`;
    actor.style.top = `${viewport.clientHeight - (worldHeight - groundY) * sceneScale}px`;
    actor.dataset.x = x.toFixed(2);
    document.getElementById('walk-left').disabled = x <= limits.min + .1;
    document.getElementById('walk-right').disabled = x >= limits.max - .1;
    tools.classList.toggle('dock-left', screenX > viewport.clientWidth * .58);
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
    keys.clear();
    travel = null;
    lastTick = 0;
    cancelAnimationFrame(frame);
    frame = 0;
    const previous = dragging;
    dragging = null;
    if (previous?.element.hasPointerCapture(previous.id)) previous.element.releasePointerCapture(previous.id);
    viewport.classList.remove('is-dragging');
    actor.classList.remove('is-walking');
  }
  function requestWalk() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (document.hidden) { stopWalking(); return; }
    const dt = Math.min((now - (lastTick || now)) / 1000, .05);
    lastTick = now;
    const direction = Number(keys.has('right')) - Number(keys.has('left'));
    const before = x;
    if (direction) {
      travel = null;
      x += direction * 280 * dt;
    } else if (travel) {
      const progress = clamp((now - travel.start) / travel.duration, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      x = travel.from + (travel.to - travel.from) * eased;
      if (progress >= 1) travel = null;
    }
    if (x !== before) actor.dataset.direction = x < before ? 'left' : 'right';
    paintPlayer();
    const walking = Math.abs(x - before) > .01 || travel !== null;
    actor.classList.toggle('is-walking', walking);
    if (walking || (direction && x > bounds().min && x < bounds().max)) requestWalk();
    else lastTick = 0;
  }
  function travelTo(target) {
    entrance?.finish();
    stopWalking();
    const limits = bounds();
    target = clamp(target, limits.min, limits.max);
    actor.dataset.direction = target < x ? 'left' : 'right';
    if (reducedMotion.matches) { x = target; paintPlayer(); return; }
    travel = { from: x, to: target, start: performance.now(), duration: clamp(Math.abs(target - x) * 1.7, 350, 1700) };
    actor.classList.add('is-walking');
    requestWalk();
  }
  document.querySelectorAll('[data-walk]').forEach(button => {
    button.addEventListener('click', () => travelTo(destinations[button.dataset.walk].x));
  });
  for (const direction of ['left', 'right']) {
    const button = document.getElementById(`walk-${direction}`);
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      entrance?.finish();
      stopWalking();
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      actor.dataset.direction = direction;
      x += direction === 'left' ? -12 : 12;
      paintPlayer();
      keys.add(direction);
      requestWalk();
    });
    const release = () => { keys.delete(direction); requestWalk(); };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, release);
    button.addEventListener('click', event => {
      if (event.detail === 0) travelTo(x + (direction === 'left' ? -90 : 90));
    });
  }
  window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        !event.target.closest?.('#town-viewport, #town-actor')) return;
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      travelTo(event.key === 'Home' ? bounds().min : bounds().max);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    entrance?.finish();
    keys.add(event.key === 'ArrowLeft' ? 'left' : 'right');
    requestWalk();
  });
  window.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft') keys.delete('left');
    if (event.key === 'ArrowRight') keys.delete('right');
  });
  function startDrag(event, onPlayer) {
    if (event.button !== 0 || !event.isPrimary || (!onPlayer && event.target.closest('.station'))) return;
    entrance?.finish();
    stopWalking();
    const element = onPlayer ? player : viewport;
    element.focus({ preventScroll: true });
    dragging = { id: event.pointerId, element, onPlayer, pointerX: event.clientX, from: x, scale: sceneScale, moved: false };
    element.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function moveDrag(event) {
    if (!dragging || event.pointerId !== dragging.id) return;
    const delta = event.clientX - dragging.pointerX;
    if (Math.abs(delta) > 6) dragging.moved = true;
    if (!dragging.moved) return;
    const next = dragging.from + delta / dragging.scale * (dragging.onPlayer ? 1 : -1);
    actor.dataset.direction = next < x ? 'left' : 'right';
    x = next;
    actor.classList.add('is-walking');
    viewport.classList.toggle('is-dragging', !dragging.onPlayer);
    paintPlayer();
    event.preventDefault();
  }
  function endDrag(event) {
    if (!dragging || event.pointerId !== dragging.id) return;
    const previous = dragging;
    stopWalking();
    if (event.type !== 'pointerup' || previous.moved || previous.onPlayer) return;
    const rect = world.getBoundingClientRect();
    const y = (event.clientY - rect.top) / sceneScale;
    if (y >= 728) travelTo((event.clientX - rect.left) / sceneScale);
  }
  viewport.addEventListener('pointerdown', event => startDrag(event, false));
  player.addEventListener('pointerdown', event => startDrag(event, true));
  for (const element of [viewport, player]) {
    element.addEventListener('pointermove', moveDrag);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(type, endDrag);
    element.addEventListener('dragstart', event => event.preventDefault());
  }
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    entrance?.finish();
    stopWalking();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    actor.dataset.direction = delta < 0 ? 'left' : 'right';
    x += delta * multiplier / sceneScale;
    paintPlayer();
  }, { passive: false });
  viewport.addEventListener('focusin', event => {
    const station = event.target.closest('.station');
    if (!station) return;
    stopWalking();
    x = destinations[station.classList.contains('station-follow') ? 'follow' : 'message'].x;
    paintPlayer();
  });
  window.addEventListener('blur', stopWalking);
  window.addEventListener('resize', layout);
  reducedMotion.addEventListener('change', stopWalking);
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) stopWalking();
  });
  function toast(message, copied) {
    const element = document.getElementById('town-toast');
    const button = document.getElementById('copy-invite');
    element.textContent = message;
    element.classList.add('show');
    button.classList.toggle('is-copied', copied);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { button.classList.remove('is-copied'); element.classList.remove('show'); }, 3500);
  }
  document.getElementById('copy-invite').addEventListener('click', async () => {
    let copied = false;
    try { await navigator.clipboard.writeText('请吃饭'); copied = true; }
    catch {
      const input = document.createElement('textarea');
      input.value = '请吃饭';
      input.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(input);
      input.select();
      try { copied = document.execCommand('copy'); } catch { /* The phrase on the sign remains selectable. */ }
      input.remove();
      document.getElementById('copy-invite').focus({ preventScroll: true });
    }
    toast(copied ? '已复制「请吃饭」。去 B 站主页点「发消息」，粘贴发送就好。' : '可以直接选中「请吃饭」复制，再去 B 站发送私信。', copied);
  });
  initParkClock({ root, motionQuery: reducedMotion, clamp });
  entrance = initParkCamera({
    root, camera: document.getElementById('town-camera'), viewport, world, motionQuery: reducedMotion,
    prepare() {
      stopWalking();
      x = viewport.clientWidth <= 600 ? destinations.follow.x : 940;
      layout();
    },
    onFinish() { paintPlayer(); },
  });
  document.getElementById('replay-boot').addEventListener('click', entrance.play);
})();
