// The camera contains both the SVG world and its HTML character, so they zoom together.
export function initParkCamera({ root, camera, viewport, world, motionQuery, prepare, onFinish, duration = 3200, hold = 240 }) {
  let frame = 0;
  let playing = false;
  let arrivalScroll = 0;
  const interruptions = ['pointerdown', 'wheel', 'keydown', 'resize'];
  function finish() {
    if (!playing && root.dataset.intro === 'ready') return;
    cancelAnimationFrame(frame);
    frame = 0;
    playing = false;
    camera.style.removeProperty('transform');
    root.dataset.intro = 'ready';
    viewport.scrollLeft = arrivalScroll;
    interruptions.forEach(type => window.removeEventListener(type, finish, true));
    onFinish();
  }
  function play() {
    if (playing) finish();
    prepare();
    arrivalScroll = viewport.scrollLeft;
    if (motionQuery.matches || document.hidden) { finish(); return; }
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const sceneWidth = world.offsetWidth;
    const sceneHeight = world.offsetHeight;
    const overview = Math.min((width - 24) / sceneWidth, height * .65 / sceneHeight, 1);
    const started = performance.now();
    playing = true;
    root.dataset.intro = 'playing';
    interruptions.forEach(type => window.addEventListener(type, finish, { capture: true, passive: true }));
    function paint(now) {
      const t = Math.min(1, Math.max(0, (now - started - hold) / duration));
      const eased = t * t * t * (10 + t * (-15 + t * 6));
      const zoom = Math.pow(overview, 1 - eased);
      const focusX = sceneWidth / 2 + (arrivalScroll + width / 2 - sceneWidth / 2) * eased;
      // Keep the actual scene's ground at the screen edge throughout the zoom.
      const y = height * (1 - zoom);
      camera.style.transform = `translate3d(${width / 2 - focusX * zoom}px,${y}px,0) scale(${zoom})`;
      if (t < 1) frame = requestAnimationFrame(paint);
      else finish();
    }
    paint(started);
  }
  window.addEventListener('pageshow', event => { if (event.persisted) play(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) finish(); });
  motionQuery.addEventListener('change', () => { if (motionQuery.matches && playing) finish(); });
  play();
  return { play, finish };
}
