export function initParkClock({ root, motionQuery, clamp }) {
  // A full loop is 3, 5 or 10 minutes: day → dusk → night → morning → day.
  // Fixed mode and reduced motion use the adjacent phase selector.
  const phases = [
    { id: 'day', name: '白天', icon: 'sun', sun: 16, moon: 0 },
    { id: 'dusk', name: '黄昏', icon: 'dusk', sun: 43, moon: .15 },
    { id: 'night', name: '夜晚', icon: 'moon', sun: 55, moon: 1 },
    { id: 'morning', name: '早晨', icon: 'dawn', sun: 29, moon: .2 },
  ];
  const colorNames = ['ink', 'muted', 'sky-top', 'sky-bottom', 'surface', 'line', 'grass', 'grass-back', 'path', 'path-line', 'hill', 'hill-back', 'tree', 'tree-dark', 'mountain-far', 'mountain-near', 'mountain-shadow', 'leaf-light', 'bark', 'wood-light', 'wood-dark', 'stone-light', 'stone-dark', 'joint', 'forest', 'forest-back', 'water', 'water-dark', 'water-shine', 'bank', 'canvas', 'canvas-shadow', 'metal-light', 'metal-mid', 'metal-dark', 'paint-rose', 'paint-lilac', 'paint-sage', 'shadow'];
  const rgb = value => {
    const hex = value.trim().replace('#', '');
    return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  };
  const palettes = phases.map(phase => {
    root.dataset.light = phase.id;
    const styles = getComputedStyle(root);
    return {
      colors: colorNames.map(name => rgb(styles.getPropertyValue(`--${name}`))),
      night: parseFloat(styles.getPropertyValue('--night-opacity')),
      day: parseFloat(styles.getPropertyValue('--day-opacity')),
      brightness: parseFloat(styles.getPropertyValue('--art-brightness')),
    };
  });
  const defaultCycle = innerWidth <= 600 ? '10' : '3';
  let cycleMode = defaultCycle;
  let fixedPhase = 'day';
  try {
    cycleMode = localStorage.getItem('breeze-cycle-mode') || defaultCycle;
    fixedPhase = localStorage.getItem('breeze-fixed-phase') || 'day';
  } catch { /* Preferences are optional when storage is unavailable. */ }
  if (!['3', '5', '10', 'infinity'].includes(cycleMode)) cycleMode = defaultCycle;
  if (!phases.some(phase => phase.id === fixedPhase)) fixedPhase = 'day';
  let cycleEpoch = performance.now();
  const modeButton = document.getElementById('cycle-mode');
  const phaseButton = document.getElementById('fixed-phase');
  const modeLabel = modeButton.querySelector('span');
  const phaseIcon = phaseButton.querySelector('use');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const mix = (a, b, t) => a + (b - a) * t;
  const duration = () => Number(cycleMode) * 60000;
  const isFixed = () => cycleMode === 'infinity' || motionQuery.matches;
  const phaseIndex = () => phases.findIndex(phase => phase.id === fixedPhase);
  const cycleProgress = now => ((now - cycleEpoch) / duration() % 1 + 1) % 1;
  const paintedLight = new Map();
  function lightProperty(name, value) {
    if (paintedLight.get(name) === value) return;
    paintedLight.set(name, value); root.style.setProperty(name, value);
  }
  function paintLight(now = performance.now()) {
    const fixed = isFixed();
    const progress = fixed ? 0 : cycleProgress(now);
    const phase = fixed ? phaseIndex() : Math.floor(progress * 4);
    const next = (phase + 1) % 4;
    let blend = fixed ? 0 : clamp((progress * 4 % 1 - .55) / .45, 0, 1);
    blend = blend * blend * (3 - 2 * blend);
    const a = palettes[phase]; const b = palettes[next];
    const light = phases[blend > .5 ? next : phase].id;
    if (root.dataset.light !== light) root.dataset.light = light;
    colorNames.forEach((name, i) => lightProperty(`--${name}`, `rgb(${a.colors[i].map((value, channel) => Math.round(mix(value, b.colors[i][channel], blend))).join(',')})`));
    lightProperty('--night-opacity', mix(a.night, b.night, blend).toFixed(3));
    lightProperty('--day-opacity', mix(a.day, b.day, blend).toFixed(3));
    lightProperty('--art-brightness', mix(a.brightness, b.brightness, blend).toFixed(3));
    lightProperty('--moon-opacity', mix(phases[phase].moon, phases[next].moon, blend).toFixed(3));
    lightProperty('--sun-top', `${mix(phases[phase].sun, phases[next].sun, blend)}%`);
    modeButton.style.setProperty('--cycle-progress', String(progress));
    const skyColor = paintedLight.get('--sky-top');
    if (themeColor.content !== skyColor) themeColor.content = skyColor;
  }
  function syncClockControls() {
    const fixed = isFixed();
    modeLabel.textContent = fixed ? '固定' : `${cycleMode} 分钟`;
    const nextMode = motionQuery.matches ? '下一时段' : cycleMode === '3' ? '5 分钟一昼夜' : cycleMode === '5' ? '10 分钟一昼夜' : cycleMode === '10' ? '固定时段' : '3 分钟一昼夜';
    const label = fixed ? '固定时段' : `${cycleMode} 分钟一昼夜`;
    modeButton.setAttribute('aria-label', `当前${label}，点击切换为${nextMode}`);
    phaseButton.hidden = !fixed;
    modeButton.setAttribute('aria-expanded', String(fixed));
    const index = phaseIndex();
    phaseIcon.setAttribute('href', `#i-${phases[index].icon}`);
    phaseButton.setAttribute('aria-label', `固定${phases[index].name}，点击切换${phases[(index + 1) % 4].name}`);
    try {
      localStorage.setItem('breeze-cycle-mode', cycleMode);
      localStorage.setItem('breeze-fixed-phase', fixedPhase);
    } catch { /* The clock continues without persistence. */ }
    paintLight();
    scheduleLight();
  }
  modeButton.addEventListener('click', () => {
    if (motionQuery.matches) { phaseButton.click(); return; }
    const now = performance.now();
    const progress = isFixed() ? phaseIndex() / 4 : cycleProgress(now);
    fixedPhase = root.dataset.light;
    cycleMode = cycleMode === '3' ? '5' : cycleMode === '5' ? '10' : cycleMode === '10' ? 'infinity' : '3';
    if (cycleMode !== 'infinity') cycleEpoch = now - progress * duration();
    syncClockControls();
  });
  phaseButton.addEventListener('click', () => {
    const index = phaseIndex();
    fixedPhase = phases[(index + 1) % 4].id;
    syncClockControls();
  });
  let lightTimer;
  function scheduleLight() {
    clearTimeout(lightTimer);
    if (document.hidden || isFixed()) return;
    lightTimer = setTimeout(() => { paintLight(); scheduleLight(); }, 1000);
  }
  syncClockControls();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) paintLight(); scheduleLight(); });
  motionQuery.addEventListener('change', syncClockControls);
}
