(() => {
  'use strict';

  // One source of truth for artwork, signs, the directory and navigation.
  // The last five attractions are scenery until real destinations are provided.
  const rides = [
    { id: 'ferris', size: 1.2, base: 520, name: '摩天轮', title: 'Blog', subtitle: '博客 · 记录技术与生活', href: 'https://blog.brez.top', color: '#ab98cb', x: 422 },
    { id: 'coaster', size: 1.1, base: 538, name: '过山车', title: 'CardChess', subtitle: '游戏 · 下一步，出奇制胜', href: 'https://cardchess.brez.top', color: '#90afb0', x: 970 },
    { id: 'carousel', size: 0.94, base: 566, name: '旋转木马', title: 'Resume', subtitle: '简历 · 认识一下我', href: 'https://resume.brez.top', color: '#d2a69b', x: 1750 },
    { id: 'pirate', size: 0.94, base: 552, name: '海盗船', title: 'Account', subtitle: '账号 · 欢迎回来', href: 'https://account.brez.top', color: '#bca17e', x: 2500 },
    { id: 'teacups', size: 0.9, base: 585, name: '旋转茶杯', title: 'Download', subtitle: '下载 · 带走一点灵感', href: 'https://download.brez.top', color: '#b4a1cc', x: 3300 },
    { id: 'windmill', size: 0.86, base: 548, name: '风车塔', color: '#a0bdba', x: 4150 },
    { id: 'haunted', size: 0.76, base: 578, name: '幽灵小屋', color: '#a09bb8', x: 1265 },
    { id: 'bumper', size: 1, base: 580, name: '碰碰车', color: '#d2ac7f', x: 4950 },
    { id: 'waterslide', size: 0.92, base: 552, name: '激流勇进', color: '#91bfc6', x: 5850 },
    { id: 'airplanes', size: 0.91, base: 585, name: '小小飞行家', color: '#b0b5d2', x: 6750 },
  ];
  const WORLD_WIDTH = 7800;
  const WORLD_HEIGHT = 760;
  const root = document.documentElement;
  const viewport = document.getElementById('park-viewport');
  const world = document.getElementById('park-world');
  const sloth = document.getElementById('sloth');
  const leftButton = document.getElementById('move-left');
  const rightButton = document.getElementById('move-right');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
  const circle = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const bulbRow = (x, y, count, spacing = 15) => range(count, i => circle(x + i * spacing, y, 2.5, '#ffedb7', 'class="ride-bulb"'));

  const bolts = (x, y, count, gap = 12) => range(count, i => circle(x + i * gap, y, 1.5, '#7d8c89', 'stroke="none"'));
  function entryButton(ride, x, y, width = 142, label = '点击进入 ↗') {
    return `<a class="page-entry" href="${ride.href}" target="_blank" rel="noopener noreferrer" aria-label="在新标签页打开 ${ride.title || ride.name}">
      <rect class="entry-button" x="${x - width / 2}" y="${y}" width="${width}" height="25" rx="8"/>
      <text class="entry-button-label" x="${x}" y="${y + 17}" text-anchor="middle">${label}</text>
    </a>`;
  }
  function sign(ride, x, y, width = 170, classes = '') {
    const scenic = !ride.href;
    const height = scenic ? 64 : 94;
    return `<g transform="translate(${x} ${y})"><g class="${scenic ? 'scenic-sign' : ''} ${classes}">
      <rect class="sign-board" x="${-width / 2}" y="0" width="${width}" height="${height}" rx="10"/>
      <rect x="${-width / 2 + 5}" y="5" width="${width - 10}" height="${height - 10}" rx="7" fill="none" stroke="var(--ride-color)" stroke-width=".7" opacity=".45"/>
      ${classes.includes('mesh-sign') ? `<rect x="${-width / 2 + 5}" y="5" width="${width - 10}" height="${height - 10}" rx="7" fill="url(#sign-mesh)"/>` : ''}
      ${classes.includes('wood-grain') ? `<path d="M${-width / 2 + 10} 12h24m8-2h18M${width / 2 - 43} ${height - 10}h30" fill="none" stroke="#94704c" stroke-width=".8" opacity=".4"/>` : ''}
      ${circle(-width / 2 + 9, 9, 1.7, '#b8ae9c')}${circle(width / 2 - 9, 9, 1.7, '#b8ae9c')}
      <text class="sign-title" x="0" y="29" text-anchor="middle">${ride.title || ride.name}</text>
      <text class="sign-subtitle" x="0" y="${scenic ? 47 : 46}" text-anchor="middle">${ride.subtitle || '游乐设施'}</text>
      ${scenic ? '' : entryButton(ride, 0, 57, width - 24)}
      <g class="night-light">${bulbRow(-width / 2 + 13, height - 4, Math.floor((width - 18) / 15))}</g>
    </g></g>`;
  }
  function ferris(ride) {
    const cabins = ['#ae9ac8', '#a1bbb3', '#cbb698', '#c4a4ad'];
    return `<ellipse class="ride-shadow" cy="502" rx="184" ry="16"/>
      <g class="ride-outline">
        <path d="m-107 491 93-240h28l93 240-24 4L0 284-83 495Z" fill="url(#steel)"/>
        <path d="M-84 481 0 269l84 212M-63 436H63M-47 392h94M-62 436 45 392m-90 0 107 44" fill="none" stroke="#91a59d" stroke-width="2"/>
        <path d="M-120 489h45v11h-45Zm195 0h45v11H75Z" fill="url(#stone)"/>
        ${bolts(-111, 495, 3)}${bolts(84, 495, 3)}
        <g transform="translate(0 253)"><circle cx="-7" cy="-4" r="165" fill="none" stroke="#a4b2af" stroke-width="3"/>
          <g class="wheel-spin">
            <circle r="165" fill="none" stroke="url(#steel)" stroke-width="8"/>
            <circle r="155" fill="none" stroke="#a5b4b0" stroke-width="2"/>
            ${range(24, i => { const a = i * Math.PI / 12; const b = a + Math.PI / 12; return `<path d="M${Math.sin(a) * 155} ${Math.cos(a) * 155} 0 0 ${Math.sin(b) * 165} ${Math.cos(b) * 165}" fill="none" stroke="#adbbb7" stroke-width="1.1"/><path d="M${Math.sin(a) * 155} ${Math.cos(a) * 155} ${Math.sin(b) * 165} ${Math.cos(b) * 165}" stroke="#b7c4bd" fill="none" stroke-width="1"/>`; })}
            <circle r="165" fill="none" stroke="#fff8df" stroke-width="2" class="rim-shimmer"/>
            ${range(12, i => { const a = i * Math.PI / 6; return `<g transform="translate(${Math.sin(a) * 165} ${Math.cos(a) * 165})"><g class="cabin-upright">
              <path d="M0 0v13m-7 1 7-6 7 6" fill="none" stroke="#7c9190" stroke-width="2"/>
              <path d="M-23 22q0-10 11-12h24q11 2 11 12v20q0 9-10 10h-26q-10-1-10-10Z" fill="${cabins[i % 4]}"/>
              <path d="M-21 20h42M-20 43h40" stroke="#f7f0db" stroke-width="1.3" opacity=".7"/>
              <rect x="-17" y="21" width="34" height="20" rx="5" fill="url(#glass)" stroke="#839b9b" stroke-width=".8"/>
              <path d="M0 21v20m-14-15 7-2m10 0 9-1" stroke="#f5f8e9" stroke-width="1" opacity=".75"/>
              <path d="M-12 37v-5q3-5 6 0v5m9 0v-5q3-5 6 0v5" fill="#7d8b93" opacity=".4" stroke="none"/>
              ${bolts(-13, 47, 3, 13)}<g class="night-light"><path d="M-19 44h38" stroke="#ffe0a0" stroke-width="2"/></g>
            </g></g>`; })}
            <g class="night-light"><circle r="160" class="hub-lights" fill="none" stroke="#ffe0a4" stroke-width="3"/>${range(12, i => circle(Math.sin(i * Math.PI / 6) * 165, Math.cos(i * Math.PI / 6) * 165, 2.5, '#ffe7aa', 'class="ride-bulb"'))}</g>
          </g><circle r="24" fill="url(#lavender-paint)"/><circle r="15" fill="url(#brass)"/><circle r="7" fill="url(#steel)"/>
          ${range(6, i => circle(Math.sin(i * Math.PI / 3) * 19, Math.cos(i * Math.PI / 3) * 19, 1.3, '#7c8190', 'stroke="none"'))}
        </g>
        <path d="M-53 279v21m106-21v21" stroke="#9b9c90" fill="none"/>
        <path d="M-135 485v-36h50m170 0h50v36m-260-17h45m170 0h45" fill="none" stroke="#a3b2a3" stroke-width="2"/>
      </g>${sign(ride, 0, 300, 166, 'hanging-sign')}`;
  }

  const COASTER_TRACK = 'M-234 388 C-181 386-169 178-99 186 C-32 193-30 389 40 386 C100 382 119 276 161 278 C217 283 195 411 245 414 C275 475-220 491-234 388Z';
  function coaster(ride) {
    return `<ellipse class="ride-shadow" cy="506" rx="253" ry="15"/><g class="ride-outline">
      ${range(9, i => { const x = -205 + i * 53; const y = [330, 239, 196, 271, 369, 379, 310, 290, 373][i]; return `<path d="M${x - 4} 490V${y}h8V490Z" fill="url(#steel)" stroke="none"/><path d="M${x} ${y}V490m-13 0h26" fill="none" stroke="#8caaa4" stroke-width="2"/><rect x="${x - 11}" y="489" width="22" height="8" rx="2" fill="#c4c6b4"/>`; })}
      <path d="M-205 489-152 240m0 250 53-290m53 70 53 220m52-110 53 110m0-180 53 180" fill="none" stroke="#aec1b7" stroke-width="2"/>
      <path d="${COASTER_TRACK}" transform="translate(0 11)" fill="none" stroke="#789993" stroke-width="2.5"/>
      <g id="coaster-sleepers" stroke="#8ba49b" stroke-width="2" fill="none"></g>
      <path d="${COASTER_TRACK}" fill="none" stroke="#7fa59f" stroke-width="8"/>
      <path id="coaster-track" d="${COASTER_TRACK}" fill="none" stroke="#e9e1c6" stroke-width="2.3"/>
      <g class="night-light"><path id="coaster-track-lights" d="${COASTER_TRACK}" fill="none" stroke="#ffe4a1" stroke-width="2.3" stroke-dasharray="2 18"/></g>
      <g id="coaster-train"><g id="coaster-air-position"><g class="coaster-air" fill="none" stroke="#a9bfc0" stroke-width="1.2"><path d="M-16-17h-25m22 8h-33m33-26h-18"/></g></g>
        ${range(3, i => `<g class="coaster-car" transform="translate(${-i * 29} 0)"><path d="M-13-17q13-7 27 0l-2 14q-11 5-23 0Z" fill="url(#lavender-paint)"/><path d="M-12-16h26m-22 8h17" stroke="#ece2ef" stroke-width="1.5"/><path d="M-9-19v-8h8v8m7 0v-8h7v8" fill="#677786"/>
          ${circle(-5, -30, 3.8, '#dcc0a4', 'stroke="none"')}${circle(9, -30, 3.8, '#c7ae95', 'stroke="none"')}<path d="M-7-23h18" fill="none" stroke="#c7cdd0" stroke-width="2"/>
          ${circle(-7, 0, 3.5, '#515e64')}${circle(9, 0, 3.5, '#515e64')}${circle(-7, 0, 1.2, '#c5d2ce', 'stroke="none"')}${circle(9, 0, 1.2, '#c5d2ce', 'stroke="none"')}</g>`)}
      </g>
      <path d="M-179 431v67m138-67v67" stroke="#829b91" stroke-width="4"/>
      <path d="m-198 421 89-31 90 31-9 10h-161Z" fill="url(#sage-paint)"/><path d="M-183 422h147" stroke="#e3e8cd"/>
      <path d="M-205 492h187m-173-33v30m31-30v30m31-30v30m31-30v30m31-30v30" fill="none" stroke="#b1bba6" stroke-width="1.5"/>
    </g><g transform="rotate(-3 -108 426)"><g class="coaster-station">${sign(ride, -108, 427, 176)}</g></g>`;
  }

  function horse(color, className) {
    return `<g class="carousel-horse ${className}" stroke-width="1.1">
      <path d="M-29 5q-10-20-19-13 2 12 13 14" fill="#bda58b"/>
      <path d="M-30 0q12-10 29-7l14 4 6-19q-2-13 9-19l13 9-7 6 8 7-4 8-13-2-5 23q-15 10-38 3l-14-4Z" fill="url(#ivory-paint)"/>
      <path d="m-23 12-4 12 10 13h-6l-12-12 4-16m38 4 5 22h6L17 8M-5 15l-1 22H0l3-22" fill="#e4d4b5"/>
      <path d="M17-19q-3-18 10-23l2 8-6 6 3 10-7 9" fill="#a89176" stroke="none"/>
      <path d="M-20-3H3v13q-11 6-23-2Z" fill="${color}"/><path d="M-17 0H0v7h-17" fill="none" stroke="#e2c98f"/>
      <path d="m27-37 1-9 5 8M25-17l12 5m-8 0L10 7" fill="none" stroke="#a98461"/>
      ${circle(32, -29, 1.3, '#55646b', 'stroke="none"')}<path d="m-16 38-6 0m36-2h6m-20 2H6" stroke="#87776e" stroke-width="2"/>
    </g>`;
  }
  function carousel(ride) {
    return `<ellipse class="ride-shadow" cy="510" rx="192" ry="14"/><g class="ride-outline">
      <path d="M-171 473v19q171 48 342 0v-19" fill="url(#brass)"/><ellipse cy="473" rx="171" ry="27" fill="#f0dfc6"/>
      <ellipse cy="473" rx="154" ry="20" fill="url(#rose-paint)"/>
      <ellipse class="carousel-base-turn" cy="485" rx="169" ry="25" fill="none" stroke="#8d79a5" stroke-width="5" stroke-dasharray="5 24"/>
      <path d="M-16 269h32v196h-32Z" fill="url(#brass)"/><path d="M-10 277h20v175h-20Z" fill="url(#glass)"/>
      <path d="M-16 320h32m-32 74h32" stroke="#f5e7bd" stroke-width="3"/>
      ${[-105, 0, 105].map((x, i) => `<g class="carousel-seat" transform="translate(${x} 400)"><path d="M0-112V54" stroke="url(#brass)" stroke-width="3.5"/>${horse(['#a391b5', '#bf9b86', '#8cafa7'][i], ['horse-one', 'horse-two', 'horse-three'][i])}</g>`).join('')}
      <g class="carousel-canopy"><path d="M-178 290Q-134 264-81 253T0 202q30 34 81 51t97 37Z" fill="url(#rose-paint)"/>
        ${[-1, 1].map(dir => `<path d="M0 202Q${dir * 39} 251 ${dir * 90} 289h${dir * 53}Q${dir * 68} 248 0 202Z" fill="#f0dfb7"/>`).join('')}
        <ellipse cy="291" rx="179" ry="14" fill="#e8cda8"/><path d="M-178 291v17q20 17 40-1 20 17 40-1 20 17 40-1 20 17 40-1 20 17 40-1 20 17 40-1 20 17 40-1 20 17 40-1 17 15 34-1v-15" fill="url(#ivory-paint)"/>
        <ellipse cy="291" rx="177" ry="12" fill="none" stroke="#ad8d74" stroke-width="2"/>
        <g class="night-light"><ellipse class="carousel-trim" cy="292" rx="177" ry="12" fill="none" stroke="#ffe3a1" stroke-width="3"/></g>
      </g><path d="M0 200v-38" fill="none" stroke="url(#brass)" stroke-width="3"/><circle cy="199" r="7" fill="url(#brass)"/>
      <path class="flag-wave" d="M0 163q23-10 41 0l-12 10 12 8q-22-8-41 0Z" fill="#a38dbd"/>
      <path d="M69 305v36m123-36v36" fill="none" stroke="#b5a282"/>
    </g><g class="carousel-sign">${sign(ride, 131, 342, 154)}</g>`;
  }
  function pirate(ride) {
    return `<ellipse class="ride-shadow" cy="508" rx="209" ry="15"/><g class="ride-outline">
      <path d="m-184 494 95-363h178l95 363m-340-2 80-330m272 330L68 162" fill="none" stroke="#8da7a2" stroke-width="9"/>
      <path d="m-184 492 95-361m178 0 95 361" fill="none" stroke="#e1e7d7" stroke-width="2"/>
      <path d="M-103 131h206" stroke="url(#steel)" stroke-width="15"/>
      ${[-190, -155, 155, 190].map(x => `<path d="M${x - 8} 494h16v8h-16Z" fill="#bdc2b2"/>`).join('')}
      <g class="ship-swing"><path d="m-117 345 99-213m135 213L18 132" fill="none" stroke="#9a8f7a" stroke-width="2.2"/>
        <path d="M-172 333q53 39 173 35 117 4 171-35-21 95-171 107-147-8-173-107Z" fill="url(#wood-hull)"/>
        <path d="M-158 369q158 76 317-1l-15 27q-144 75-288 0Z" fill="#718c92" stroke="none"/>
        <path d="M-161 356q161 68 322 0m-151 39q-6 23-11 39m-110-45 10 35m208-35-10 35" fill="none" stroke="#c9ae7f" stroke-width="1.5"/>
        <path d="M-171 334q171 69 343 0" fill="none" stroke="url(#brass)" stroke-width="6"/>
        ${[-105, -63, -21, 21, 63, 105].map(x => `<g transform="translate(${x} ${400 + (1 - Math.abs(x) / 140) * 13})"><circle r="8" fill="url(#brass)"/><circle r="4.8" fill="url(#glass)"/></g>`).join('')}
        <path d="M-125 343v-31m250 31v-31m-250 1q125 46 250 0" fill="none" stroke="#bca47e" stroke-width="2"/>
        ${range(9, i => `<path d="M${-120 + i * 30} ${320 + Math.sin(i / 8 * Math.PI) * 20}v24" stroke="#aa987e" stroke-width="1.4"/>`)}
        <path d="M-18 365v-86" stroke="url(#brass)" stroke-width="3"/><path d="M-16 280q26 20 53 9l-6 48q-26 10-47-5Z" fill="#e2d9be"/>
        <path d="m0 294 0 30m-8-19h17" stroke="#a4a18a" stroke-width="1"/>
        <g class="night-light"><g class="ship-lights"><path d="M-147 395q147 76 295 0m-263-54 97-207m135 207L18 134" stroke="#ffdfa3" stroke-width="2" fill="none"/></g></g>
        <g class="wood-sign" transform="translate(75 346) scale(.82)">${sign(ride, 0, 0, 157, 'wood-grain')}</g>
      </g><circle cy="131" r="16" fill="url(#brass)"/><circle cy="131" r="7" fill="url(#steel)"/>
    </g>`;
  }
  function cup(ride, color, withSign) {
    return `<g class="cup-wobble"><g class="ride-outline"><path d="M47-12q34-9 32 16-2 25-31 22" fill="none" stroke="#8faaa6" stroke-width="8"/><path d="M49-12q27-5 25 16-2 18-24 18" fill="none" stroke="#e6e8d2" stroke-width="4"/>
      <path d="M-54-19q4 68 54 72 49-2 54-72Z" fill="${color}"/><path d="M-47-11q4 41 30 52" fill="none" stroke="#fff8e7" stroke-width="4" opacity=".38"/>
      <ellipse cy="-19" rx="54" ry="12" fill="url(#ivory-paint)"/><ellipse cy="-20" rx="43" ry="7" fill="#a3978a"/>
      <path d="M-38-18h76" stroke="#dac3a9" stroke-width="2"/>
      <path d="M-34 21q34 18 68 0m-28-8 4-8m-19 15-3-8m-13 11-2-8" fill="none" stroke="#f5ebcf" stroke-width="1.5"/>
      <ellipse cy="54" rx="43" ry="7" fill="url(#brass)"/><g class="night-light"><ellipse class="cup-rim-light" cy="-19" rx="53" ry="11" fill="none" stroke="#ffe3ad" stroke-width="2"/></g>
    </g>${withSign ? `<g transform="translate(0 0) scale(.79)">${sign(ride, 0, 0, 171)}</g>` : ''}</g>`;
  }
  function teacups(ride) {
    return `<ellipse class="ride-shadow" cy="516" rx="224" ry="15"/><g class="ride-outline">
      <path d="M-208 459v15q208 81 416 0v-15" fill="url(#sage-paint)"/><ellipse cy="459" rx="208" ry="46" fill="url(#ivory-paint)"/><ellipse cy="459" rx="171" ry="34" fill="none" stroke="#c9bba0"/>
      <ellipse cy="459" rx="119" ry="24" fill="none" stroke="#c2acbd" stroke-dasharray="3 12"/>
      <path d="M-26 415q-29-4-36-34-4-16 7-24 16 4 13 18m64 30 34-47 17-1-27 31" fill="url(#ivory-paint)"/>
      <path d="M-35 389q-6-42 35-43 43 0 37 43-2 35-37 36-32-1-35-36Z" fill="url(#rose-paint)"/>
      <ellipse cy="347" rx="32" ry="8" fill="url(#ivory-paint)"/><path d="M-29 345q29-22 58 0" fill="#d7bcaa"/><circle cy="331" r="5" fill="url(#brass)"/>
      <path d="M-27 371q-4 17 6 28" fill="none" stroke="#fff1df" stroke-width="3" opacity=".6"/>
    </g><g id="teacup-orbits" transform="translate(0 421)">
      <g class="cup-orbit">${cup(ride, '#d3a99a', false)}</g>
      <g class="cup-orbit">${cup(ride, '#a3bbb1', false)}</g>
      <g class="cup-orbit">${cup(ride, '#b5a1c7', true)}</g>
    </g>`;
  }

  function windmill(ride) {
    return `<ellipse class="ride-shadow" cy="509" rx="128" ry="13"/><g class="ride-outline">
      <path d="M-83 500-47 209H46l38 291Z" fill="url(#stone)"/><path d="M-83 500-47 209h24L-49 500Z" fill="#b5bfa9" opacity=".45" stroke="none"/>
      <path d="M-67 279h132m-141 64h149m-158 65H80m-121-130-7 65m70-65 8 65m-45 1-3 64" fill="none" stroke="#d0cfba" stroke-width=".8"/>
      <path d="M-68 217 0 141l68 76Z" fill="url(#sage-paint)"/><path d="M-65 218H65m-58-58 34 40" stroke="#e4e8d3" stroke-width="2" fill="none"/>
      <path d="M-21 500v-46q21-25 42 0v46Z" fill="#7c9590"/><path d="M-15 499v-43q15-17 30 0v43m-15-51v49" fill="none" stroke="#c5d0b8" stroke-width="1"/>
      <path d="M-14 277v-25q14-18 28 0v25Z" fill="url(#glass)"/><path d="M0 244v32m-14-13h28" stroke="#e8dfc6"/>
      <g class="windmill-blades">${range(4, i => `<g transform="rotate(${i * 90} 0 180)"><path d="M-4 181-13 25h6L4 181Z" fill="url(#brass)"/><path d="M-10 31h40l-9 118H-5Z" fill="${i % 2 ? '#aac1b5' : '#c1cdb6'}"/>
        <path d="M1 35v110m12-110-3 110m14-91h-34m32 20H-8m29 20H-7m27 20H-6m25 20H-5" fill="none" stroke="#eee9ce" stroke-width="1.2"/>
        <g class="night-light"><path class="blade-light" style="animation-delay:-${i}s" d="M-9 32h38l-9 115H-5Z" stroke="#ffe1a6" stroke-width="1.5" fill="none"/></g>
      </g>`)}
      </g><circle cy="180" r="19" fill="url(#brass)"/><circle cy="180" r="11" fill="url(#steel)"/>${range(6, i => circle(Math.sin(i * Math.PI / 3) * 15, 180 + Math.cos(i * Math.PI / 3) * 15, 1.4, '#859390', 'stroke="none"'))}
      <path d="M-90 500H90" stroke="#b7b7a2" stroke-width="7"/>
    </g><g class="scenic-sign"><rect class="sign-board tower-sign" x="-36" y="310" width="72" height="119" rx="10"/>
      <text class="sign-title" x="0" y="337" text-anchor="middle"><tspan x="0">风</tspan><tspan x="0" dy="26">车</tspan><tspan x="0" dy="26">塔</tspan></text><text class="sign-subtitle" x="0" y="417" text-anchor="middle">BREEZE PARK</text>
      <g class="night-light"><path class="track-lights" d="M-33 324v91q0 11 11 11h44q11 0 11-11v-91q0-11-11-11h-44q-11 0-11 11Z" stroke="#ffe3ac" stroke-width="2" fill="none"/></g></g>`;
  }
  function haunted(ride) {
    return `<ellipse class="ride-shadow" cy="510" rx="193" ry="16"/><g class="ride-outline">
      <path d="M82 228v-77h29v94" fill="url(#stone)"/><path d="M77 150h39v10H77Z" fill="#a89998"/><path d="M83 175h26m-26 17h26m-13-32v15m-8 0v16" stroke="#c8bcb0" stroke-width="1"/>
      <g fill="#b6b5ae" stroke="none"><ellipse class="chimney-smoke" cx="95" cy="130" rx="16" ry="12"/><ellipse class="chimney-smoke smoke-two" cx="95" cy="130" rx="12" ry="10"/></g>
      <path d="M-151 491V290l51-54 50 37 67-67 120 87v198Z" fill="url(#lavender-paint)"/>
      <path d="M-151 491V290l17-18v219m141-264 10-21v285" fill="#8e96a6" stroke="none" opacity=".3"/>
      <path d="m-164 296 64-83 56 51 61-82 138 113-14 15-122-88-60 74-57-48-55 62Z" fill="url(#slate-roof)"/>
      <path d="m-148 293 50-64 53 48m65-79 118 96M-92 246h25m-35 10h47m63-35 49 1m-57 13 76 1m-87 12 103 1m-113 11 128 2" fill="none" stroke="#a1adb5" stroke-width=".8"/>
      <path d="M-151 307h68m95 3h125M-146 367h56m118 0h108m-275 34h42m126 0h109m-277 36h43m126 0h108" fill="none" stroke="#d6cbd1" stroke-width=".8" opacity=".65"/>
      ${[-121, 61].map((x, i) => `<g transform="translate(${x} ${i ? 273 : 302})"><path d="M-23 49V4q23-30 46 0v45Z" fill="#626c7d"/><path class="haunted-window" d="M-17 44V6q17-21 34 0v38Z" fill="#ead394"/><path d="M0-5v49m-18-22h36" fill="none" stroke="#c5bda5" stroke-width="2"/><path d="M-28 51h56" stroke="#d4c6bd" stroke-width="4"/></g>`).join('')}
      <path d="M-75 491v-86q0-37 35-37t35 37v86" fill="#3c4655"/><g class="haunted-door"><path d="M-71 491v-86q0-30 31-32v118Z" fill="#9b8c8e"/><path d="M-64 407v36h17v-43m-17 53v30h17v-30Z" fill="none" stroke="#b8a59f" stroke-width="1"/><circle cx="-49" cy="446" r="2.5" fill="url(#brass)"/></g>
      <path d="M-103 392H23l-15-27H-88Z" fill="url(#slate-roof)"/><path d="M-95 393v98m110-98v98" stroke="#bfaeaa" stroke-width="5"/>
      <path d="M-90 399h101m-101 8 13-8m88 8-13-8" stroke="#d7cab8" fill="none"/>
      <path d="M-148 491h288v9h-288Z" fill="url(#stone)"/><path d="M-87 500H9v7h-96Z" fill="#b1b3ab"/>
      <path d="M108 491q-12-32 8-45-4 17 9 25 17-22 27-14-7 13-6 34" fill="#849c8d"/>
      <path d="M-148 309q30 0 30 26m-30-17q20 0 20 17m-20-7q10 0 10 7m-10-27v27h29" fill="none" stroke="#d4d6c6" stroke-width=".7" opacity=".6"/>
    </g><g class="haunted-sign wood-sign">${sign(ride, -39, 323, 152, 'wood-grain')}<g class="night-light">${bulbRow(-103, 327, 9)}</g></g>`;
  }
  function bumperCar(color, className) {
    return `<g class="${className}"><g class="ride-outline">
      <path d="M15-15v-64l7-7" stroke="#91a5a4" stroke-width="1.8" fill="none"/><ellipse cx="23" cy="-86" rx="6" ry="2" fill="#879d97"/>
      <path d="M-26-7v-23q12-12 24 0v16" fill="#667b7e"/><path d="M-49-5q2-19 34-22 32-6 56 18l5 19h-94Z" fill="${color}"/>
      <path d="M-41-10q34-18 73 3" stroke="#f7edda" stroke-width="2" fill="none" opacity=".7"/>
      <ellipse cy="13" rx="50" ry="10" fill="#58666a"/><ellipse cy="13" rx="44" ry="6" fill="none" stroke="#8b9998" stroke-width="1.5"/>
      <path d="M-9-18q4-13 15-8" stroke="#6a797b" stroke-width="2.5" fill="none"/><path d="M-31-3h12m32 0h13" stroke="#ffe5aa" stroke-width="3"/>
      ${circle(-16, -37, 4.8, '#d7bba0', 'stroke="none"')}<path d="M-21-31q-8 7-3 13h15l2-11" fill="#a497b1" stroke="none"/>
      <path d="M-39 3h8m47 2h12" stroke="#d5dfd5" stroke-width="1"/>
    </g></g>`;
  }
  function bumper(ride) {
    return `<ellipse class="ride-shadow" cy="511" rx="238" ry="15"/><g class="ride-outline">
      <path d="M-221 465v19q221 67 442 0v-19" fill="url(#steel)"/><ellipse cy="461" rx="221" ry="42" fill="url(#arena-floor)"/>
      <path d="M-179 319v124m358-124v124" stroke="#abbab1" stroke-width="5"/>
      <path d="M-232 305Q0 241 232 305l-9 18h-446Z" fill="url(#sage-paint)"/><path d="M-228 306h456v18h-456Z" fill="url(#brass)"/>
      <path d="M-203 323h406m-203 20h406m-406 20h406M-199 323v89m40-89v89m40-89v89m40-89v89m40-89v89m40-89v89m40-89v89m40-89v89m40-89v89m40-89v89m40-89v89" stroke="#9daea5" stroke-width=".7" opacity=".65" fill="none"/>
      <path d="M-209 302 0 252l209 50m-209-50 6 51m-106-27 21 27m185-27-21 27" stroke="#dce1ce" stroke-width="1.1" fill="none"/>
      <g class="night-light">${bulbRow(-216, 315, 30)}</g>
    </g><g transform="translate(0 411)">${bumperCar('#b09dc0', 'bumper-one')}${bumperCar('#c9a580', 'bumper-two')}${bumperCar('#97b6af', 'bumper-three')}
      <g class="night-light"><g class="collision-sparks" stroke="#ffd389" stroke-width="2" fill="none"><path d="m20-8 6-14m2 21 13-5m-12-12 10-10m-22 8-4-10"/></g></g></g>
      <g class="ride-outline"><path d="M-205 461V320m410 141V320" stroke="url(#steel)" stroke-width="7"/><path d="M-219 463q220 70 439 0" stroke="#8da49e" stroke-width="2" fill="none"/></g>
      <path d="M-169 408v102" stroke="#9aaea2" stroke-width="4"/>
      ${sign(ride, -159, 380, 140, 'mesh-sign')}<g class="night-light"><g class="bumper-sign-lights">${bulbRow(-217, 438, 9)}</g></g>`;
  }
  const SLIDE_TRACK = 'M-164 200C-115 201-138 282-82 294S-30 383 32 389S83 449 168 454';
  function waterslide(ride) {
    return `<ellipse class="ride-shadow" cy="512" rx="234" ry="15"/><g class="ride-outline">
      <path d="M-191 487V190h50v297m-43-37h37m-37-30h37m-37-30h37m-37-30h37m-37-30h37m-37-30h37m-37-30h37m-37-30h37m-37-30h37" stroke="#9cb2ab" stroke-width="3" fill="none"/>
      <path d="M-194 198v-28h58v28m-58-16h58" stroke="#a7bcb1" stroke-width="2" fill="none"/>
      <path d="M-83 304v188m115-95v95m95-48v48m-215-25h10m100 0h10m85 0h10" stroke="url(#steel)" stroke-width="5" fill="none"/>
      <path d="${SLIDE_TRACK}" fill="none" stroke="#80a8aa" stroke-width="40"/><path d="${SLIDE_TRACK}" transform="translate(0 -4)" fill="none" stroke="#d3e4d9" stroke-width="31"/>
      <path id="slide-track" d="${SLIDE_TRACK}" fill="none" stroke="url(#flume-water)" stroke-width="19"/>
      <path class="slide-water" d="${SLIDE_TRACK}" fill="none" stroke="#eef9eb" stroke-width="2"/>
      <path d="M-105 280q11 12 25 12m49 75q10 15 21 17m60 23q7 6 15 16" stroke="#a9c2b9" stroke-width="3" fill="none"/>
      <ellipse cx="145" cy="478" rx="110" ry="32" fill="url(#stone)"/><ellipse cx="145" cy="473" rx="99" ry="25" fill="url(#pool-water)"/><ellipse cx="145" cy="472" rx="94" ry="21" fill="none" stroke="#ddf0e0" stroke-width="1.5"/>
      <path d="M82 478q28-8 56 0t56 0" stroke="#e4f1e4" stroke-width="1.5" fill="none" opacity=".7"/>
      <g class="night-light"><path class="slide-water" d="${SLIDE_TRACK}" stroke="#c5eee1" stroke-width="2" fill="none"/></g>
      <g id="log-boat"><path d="M-30-14q30-12 60 0L22-1q-22 8-44 0Z" fill="url(#wood-hull)"/><path d="M-25-13H25m-38-5v9m13-12v12m13-9v9" stroke="#d2ba8e" stroke-width="1.2" fill="none"/>
        ${circle(-12, -25, 4, '#d9bd9e', 'stroke="none"')}${circle(2, -25, 4, '#d9bd9e', 'stroke="none"')}<path d="M-18-20h12v6h-12m14-6h12v6H-4" fill="#8a9f9c" stroke="none"/></g>
      <g class="water-splash" fill="none" stroke="#d5f0e7" stroke-linecap="round"><path d="M168 454q-53-11-65-58m65 58q-33-28-30-76m30 76q8-53 35-73m-35 73q33-28 62-27" stroke-width="4"/>
        <path d="M168 454q-55-20-71-40m71 40q33-4 64-13m-64 13q-7-42-1-66" stroke-width="2"/>
        ${circle(102, 387, 3, '#d6eee6', 'stroke="none"')}${circle(137, 367, 3, '#d6eee6', 'stroke="none"')}${circle(206, 375, 3, '#d6eee6', 'stroke="none"')}${circle(237, 420, 2.5, '#d6eee6', 'stroke="none"')}</g>
      <ellipse class="ripple" cx="168" cy="458" rx="48" ry="9" fill="none" stroke="#ecf7e9" stroke-width="1.8"/>
      <path d="M-82 447v62" stroke="#9cafa4" stroke-width="4"/>
    </g><g transform="rotate(-7 -76 414)">${sign(ride, -76, 400, 150)}<g class="slide-sign-ripple" stroke="#b5e3e0" fill="none"><ellipse cx="-76" cy="426" rx="59" ry="18"/><ellipse cx="-76" cy="426" rx="44" ry="10"/></g></g>`;
  }
  function plane(color, withSign, ride) {
    return `<g class="plane-float"><g class="ride-outline">
      <path d="M-61 2q30-19 75-15L48-5q18 1 18 9-5 10-22 10l-89-2Z" fill="${color}"/>
      <path d="M-45-4q45-11 85 0" fill="none" stroke="#f1edda" stroke-width="1.5"/>
      <path d="M-13-11q2-23 19-23 17 1 20 26Z" fill="url(#glass)"/><path d="M5-31v20" fill="none" stroke="#d9e7de" stroke-width="1"/>
      <path d="m-12-3-25-26q15-9 27 1L22-3Zm-1 10 19 29q23 4 27-5L14 5Z" fill="url(#ivory-paint)"/>
      <path d="m-37-23 24 15m20 19 16 17" stroke="#b5a98e" stroke-width="1" fill="none"/>
      <path d="M-56 0-68-25q9-7 16 1l13 19m-10 10-20 12h17l20-9" fill="${color}"/>
      <path d="M-28 4h15" stroke="#e8d6a1" stroke-width="2.5"/>
      <ellipse cx="66" cy="2" rx="6" ry="27" fill="#cbded3" stroke="none" opacity=".3"/>
      <g class="plane-propeller"><path d="M66-23V27" stroke="#8ea7a0" stroke-width="3"/><circle cx="66" cy="2" r="3.5" fill="url(#brass)"/></g>
      <g class="night-light"><ellipse class="plane-halo" cx="66" cy="2" rx="6" ry="26" fill="none" stroke="#ffe3ac" stroke-width="1.7"/></g>
    </g>${withSign ? `<path d="M-41 17v15m82-15v15" stroke="#a9a58e" stroke-width="1" fill="none"/><g class="hanging-sign">${sign(ride, 0, 33, 149)}</g>` : ''}</g>`;
  }
  function airplanes(ride) {
    return `<ellipse class="ride-shadow" cy="510" rx="225" ry="14"/><g class="ride-outline">
      <path d="M-210 474v11q210 54 420 0v-11" fill="url(#sage-paint)"/><ellipse cy="474" rx="210" ry="28" fill="url(#ivory-paint)"/>
      <ellipse cy="473" rx="174" ry="19" fill="none" stroke="#c3bba4" stroke-dasharray="3 12"/>
      <path d="M-26 466-15 309h30l12 157Z" fill="url(#lavender-paint)"/><ellipse cy="310" rx="28" ry="14" fill="url(#steel)"/><ellipse cy="463" rx="34" ry="10" fill="url(#steel)"/>
      <path d="m-151 372 151-48 151 48m-151-48v108" stroke="url(#steel)" stroke-width="5" fill="none"/>
      <path d="M-27 349h54m-55 83h56" stroke="#ede6d4" stroke-width="2"/>
      <path d="M0 294v-39" stroke="url(#brass)" stroke-width="2.5" fill="none"/><path class="flag-wave" d="M0 257h36l-11 9 11 9H0Z" fill="#b19dbf"/>
      <path d="M-205 468v-20m410 20v-20m-410 1q205 53 410 0" stroke="#a9b8a6" stroke-width="1.8" fill="none"/>
    </g><g id="airplane-orbits" transform="translate(0 348)">
      <g class="airplane-orbit">${plane('#c9ad9e', false, ride)}</g>
      <g class="airplane-orbit">${plane('#9bb9b0', false, ride)}</g>
      <g class="airplane-orbit">${plane('#a8a8c4', true, ride)}</g>
    </g>`;
  }

  function tree(x, y, size = 1, rounded = true) {
    return `<g class="decor-cluster" data-left="${x - 65 * size}" data-right="${x + 65 * size}" transform="translate(${x} ${y}) scale(${size})" aria-hidden="true"><path class="tree-trunk" d="M0 0v-75m0 37-17-19m17 5 16-20"/>
      <g class="tree-sway" style="animation-delay:-${Math.abs(x % 7)}s">${rounded
      ? '<path class="tree-crown" d="M-36-49q-23-19-5-37-12-24 13-32 4-27 28-22 25-7 32 19 28 7 16 32 22 24-1 41-20 15-42 3-23 12-41-4Z"/><path d="M-14-102q-10 12-8 25m29-51q10 4 13 16" fill="none" stroke="#e7edce" stroke-width="2" opacity=".5"/>'
      : '<path class="tree-crown-dark" d="M0-157-47-69h22l-32 39H57L25-69h22Z"/><path d="M0-139v93" stroke="#e4e8cd" opacity=".35" fill="none"/>'}</g></g>`;
  }

  function balloons(x, y) {
    return `<g class="decor-cluster" data-left="${x - 45}" data-right="${x + 45}" transform="translate(${x} ${y})" aria-hidden="true"><g class="balloon-sway"><path d="m0 0-18-95m18 95 24-100M0 0v-123" fill="none" stroke="#b4af9b" stroke-width="1"/>
      <ellipse cx="-19" cy="-110" rx="16" ry="21" fill="#ccb7d5"/><ellipse cx="22" cy="-115" rx="15" ry="20" fill="#dcbba4"/><ellipse cy="-140" rx="17" ry="23" fill="#adc7b9"/>
      <path d="m-24-122-3 7m44-10-3 6m-17-25-3 8" fill="none" stroke="#fff6e1" stroke-width="2.5" opacity=".7"/>
      <path d="m-19-88-3 5h6Zm41-7-3 5h6ZM0-115l-3 5h6Z" fill="#b9aaac"/></g></g>`;
  }

  function bench(x) {
    return `<g class="decor-cluster" data-left="${x - 42}" data-right="${x + 42}" transform="translate(${x} 630)" stroke="#8c9580" stroke-width="2" fill="#c3ba99" aria-hidden="true"><path d="M-30-27h60v18h-60Zm-5 22h70v7h-70Z"/><path d="M-25 1v11m50-11v11M-26-9v5m52-5v5" fill="none" stroke-width="3"/></g>`;
  }

  function lamp(x) {
    return `<g class="decor-cluster" data-left="${x - 16}" data-right="${x + 42}" transform="translate(${x} 612)" stroke="#7f9182" stroke-width="2" fill="none" aria-hidden="true"><path d="M0 0v-111q0-18 14-18h8m-22 14h-8"/><path d="M14-129h17l-3 21H17Z" fill="#e9dfbe"/><path d="M10-129h25l-6-9H17Z" fill="#9daa97"/><path d="M-7 0H7" stroke-width="5"/><g class="night-light"><ellipse cx="22" cy="-113" rx="22" ry="30" fill="url(#lamp-glow)" stroke="none"/><path d="M18-125h9v16h-9Z" fill="#ffe4a2" stroke="none"/></g></g>`;
  }

  function shrub(x, y, size = 1) {
    return `<g transform="translate(${x} ${y}) scale(${size})" class="vegetation decor-cluster" data-left="${x - 65 * size}" data-right="${x + 65 * size}"><g class="shrub-sway" style="animation-delay:-${x % 5}s">
      <path class="tree-crown-dark" d="M-55 0q-16-27 11-33-6-27 21-27 15-23 34-3 30-10 35 17 31 6 20 35L53 0Z"/>
      <path class="tree-crown" d="M-51-3q-7-23 16-27-4-22 18-20 11-18 25-1 25-8 30 15 23 8 15 33Z"/>
      <path d="m-24-17 5 6m12-26 4 9m23 2-4 7m15 2-5 6" stroke="#eef0cd" stroke-width="2" opacity=".45" fill="none"/>
    </g></g>`;
  }
  function flowerbed(x, y, size = 1) {
    const colors = ['#d4afc6', '#ebd8a6', '#b9acd6', '#e7bda7'];
    return `<g transform="translate(${x} ${y}) scale(${size})" class="vegetation decor-cluster" data-left="${x - 50 * size}" data-right="${x + 50 * size}"><path d="M-40 0q40-13 80 0" stroke="#a8b78c" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${range(7, i => { const px = -36 + i * 12; const py = -17 - i % 3 * 9; return `<g class="flower-sway" style="animation-delay:-${i / 2}s"><path d="M${px} 0V${py}m0 10q-10-14-13-7m13 10q10-16 13-9" stroke="#92aa7b" stroke-width="1.7" fill="none"/><g transform="translate(${px} ${py})">${range(5, p => circle(Math.sin(p * Math.PI * 2 / 5) * 4, Math.cos(p * Math.PI * 2 / 5) * 4, 3.5, colors[i % 4]))}${circle(0, 0, 2.5, '#fff0b6')}</g></g>`; })}
    </g>`;
  }
  // Set href later to activate a destination. A null href keeps the robot in this park.
  const ROBOT_CONFIG = { href: null, onActivate: null, cuteMs: 10000, evilMs: 1000 };
  function parkRobot() {
    return `<g id="park-robot" class="park-robot decor-cluster" data-left="270" data-right="430" data-world-x="350" role="button" tabindex="0" aria-label="入口巡逻机器人" transform="translate(350 640) scale(.76)">
      <title>入口巡逻机器人</title>
      <g class="robot-patrol"><ellipse cx="0" cy="1" rx="34" ry="7" fill="#698c7b" opacity=".14"/>
        <g class="robot-walk" stroke="#829795" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <g class="robot-leg robot-leg-left"><path d="M-12-28v19" stroke="url(#steel)" stroke-width="9"/><rect x="-24" y="-10" width="22" height="9" rx="4" fill="#b2c4b8"/></g>
          <g class="robot-leg robot-leg-right"><path d="M12-28v19" stroke="url(#steel)" stroke-width="9"/><rect x="2" y="-10" width="22" height="9" rx="4" fill="#b2c4b8"/></g>
          <g class="robot-upper">
            <path class="robot-arm robot-arm-left" d="M-27-61q-13 5-11 25" fill="none" stroke="url(#steel)" stroke-width="8"/>
            <path class="robot-arm robot-arm-right" d="M27-61q13 5 11 25" fill="none" stroke="url(#steel)" stroke-width="8"/>
            <rect x="-27" y="-72" width="54" height="45" rx="15" fill="url(#robot-shell)"/><rect x="-17" y="-60" width="34" height="21" rx="7" fill="#dce3cf"/>
            <circle cy="-49" r="6" fill="#ad9bc5" stroke="#f8f4e5" stroke-width="2"/>
            <path d="M-8-33H8" stroke="#a3b5a5" stroke-width="2"/>
            <rect x="-43" y="-103" width="9" height="22" rx="4" fill="url(#brass)"/><rect x="34" y="-103" width="9" height="22" rx="4" fill="url(#brass)"/>
            <path d="M0-117v-13" stroke="#afbdab" stroke-width="3"/><circle cy="-133" r="5" fill="#b8a5cf" stroke="#ece6d4"/>
            <rect x="-37" y="-117" width="74" height="49" rx="19" fill="url(#robot-shell)"/>
            <rect x="-29" y="-108" width="58" height="31" rx="12" fill="#3d5359" stroke="#a9bcb1"/>
            <path d="M-25-104q19-6 44 0" stroke="#90a8a5" stroke-width="1" fill="none" opacity=".45"/>
            <g class="robot-cute-face" stroke="none"><circle class="robot-eye" cx="-12" cy="-95" r="4"/><circle class="robot-eye" cx="12" cy="-95" r="4"/><path d="M-7-87q7 6 14 0" stroke="#f1c2b2" stroke-width="1.7" fill="none"/><circle cx="-21" cy="-87" r="2.5" fill="#b68986" opacity=".65"/><circle cx="21" cy="-87" r="2.5" fill="#b68986" opacity=".65"/></g>
            <g class="robot-evil-face"><path class="robot-evil-eye" d="m-21-101 17 6-15 3Zm42 0-17 6 15 3Z" stroke="none"/><path d="m-10-85 4-3 3 3 3-3 3 3 3-3 4 3" stroke="#ff7278" stroke-width="1.5" fill="none"/></g>
            <path class="robot-evil-edge" d="M-34-103q-1-11 10-11h48q10 0 10 11m-53 46h38" stroke="#ff6175" stroke-width="2" fill="none"/>
          </g>
        </g>
      </g>
    </g>`;
  }
  function entrance() {
    return `<g id="entrance-scene" class="entrance-scene" data-left="0" data-right="1120">
      <g class="entrance-garden vegetation" aria-hidden="true">
        <ellipse cx="385" cy="565" rx="393" ry="85" fill="var(--path-line)" opacity=".38"/>
        <ellipse cx="385" cy="556" rx="381" ry="77" fill="url(#plaza-paving)"/>
        <path d="M35 568q352-83 705 0m-619 30q266-57 533 0" stroke="#f8f3de" stroke-width="2" fill="none" opacity=".7"/>
        <path d="M0 541q34-59 93-51l-9 45q-36 1-65 30Z" fill="#d0c9ae"/><path d="M4 537q31-47 86-45l-9 36q-39 0-64 28Z" fill="url(#entry-hedge)"/>
        <path d="M605 588q97-28 176 30l-9 28q-80-52-167-27Z" fill="#b8bc9f"/><path d="M608 582q94-24 170 26l-5 24q-80-50-167-22Z" fill="url(#entry-hedge)"/>
        ${tree(53, 530, .9)}${tree(1010, 578, .86)}${shrub(596, 548, .65)}${flowerbed(47, 561, .7)}${flowerbed(665, 556, .85)}
        <path d="M64 420v119m610-119v119" stroke="#adbaaa" stroke-width="7"/>
        <path d="M64 420Q371 333 674 420" stroke="#a6b296" stroke-width="1.5" fill="none"/>
        <g class="entrance-pennants">${range(15, i => { const x = 77 + i * 41; const y = 416 - Math.sin(i / 14 * Math.PI) * 43; return `<path class="entry-pennant" style="animation-delay:-${i / 4}s" d="m${x} ${y} 9 24 11-20Z" fill="${['#baacd3', '#d6b99a', '#a5bfb1'][i % 3]}"/>`; })}</g>
        <g class="night-light">${range(17, i => circle(68 + i * 37, 420 - Math.sin(i / 16 * Math.PI) * 44, 2.6, '#ffe6ab', 'class="ride-bulb"'))}</g>
        <path d="M548 566V438q0-16 15-16h13" stroke="#8fa49a" stroke-width="2.5" fill="none"/>
        <path d="M544 422h38l-4 26h-30Z" stroke="#8fa49a" stroke-width="2" fill="url(#brass)"/>
        <g class="night-light"><ellipse cx="563" cy="441" rx="23" ry="34" fill="url(#lamp-glow)"/><path d="M551 427h24v16h-24" fill="#ffe1a2" stroke="none"/></g>
      </g>
      <g id="guide-open" class="entrance-action" role="button" tabindex="0" aria-label="打开园区导览" aria-haspopup="dialog" transform="translate(169 548)" style="--ride-color:#ab9ac5">
        <title>园区导览</title>
        <g class="ride-outline">
          <ellipse cy="8" rx="116" ry="15" fill="#607c6919" stroke="none"/>
          <path d="M-91-208V2m182-210V2" stroke="url(#brass)" stroke-width="5"/>
          <path d="M-111-211q111-72 222 0v13q-14 13-28 0-14 13-28 0-14 13-28 0-14 13-28 0-14 13-28 0-14 13-28 0-14 13-28 0-14 13-26 0Z" fill="url(#ivory-paint)"/>
          <path d="M-111-211q111-72 222 0" stroke="#a393b4" stroke-width="3" fill="none"/>
          ${[-1, 1].map(direction => `<path d="M0-247q${direction * 29} 10 ${direction * 38} 42h${direction * 25}q${-direction * 17} -29 ${-direction * 63} -42Z" fill="#b7a7cc" stroke="none"/>`).join('')}
          <path d="M0-210v18" stroke="#b6a98c" stroke-width="1.5"/><circle cy="-178" r="15" fill="url(#ivory-paint)"/><path class="entry-clock-hand" d="M0-178v-9m0 9h6" stroke="#a695b8" stroke-width="2" fill="none"/><path d="M-83-137H83v121H-83Z" fill="url(#robot-shell)"/>
          <rect x="-70" y="-124" width="140" height="65" rx="7" fill="url(#glass)"/>
          <path d="M-62-105q40-31 74-7t48-2m-106 36q32-27 62-7t40-13" stroke="#e2ecd4" stroke-width="4" fill="none"/>
          <path d="M-44-112v45m87-51v50" stroke="#e9e4cc" stroke-width="3"/>
          <path d="M-91-14H91v15H-91Z" fill="url(#stone)"/>
          <path d="M-86-16H86" stroke="#f6efda" stroke-width="4"/>
        </g>
        <rect class="sign-board" x="-79" y="-53" width="158" height="48" rx="9"/>
        <svg x="-63" y="-43" width="24" height="24" fill="none" stroke="#9a87b0" stroke-width="1.6"><use href="#i-map"/></svg>
        <text class="sign-title" x="12" y="-23" text-anchor="middle" style="font-size:20px">园区导览 →</text>
        <g class="night-light">${bulbRow(-68, -8, 10)}</g>
      </g>
      <g id="bilibili-sign" aria-label="bilibili B 站" transform="translate(352 459)" style="--ride-color:#cda2b6">
        <title>bilibili · B 站</title><path d="M0 78v23m-23 0h46" stroke="#a2ad97" stroke-width="5" stroke-linecap="round" fill="none"/>
        <rect x="-79" y="-3" width="158" height="89" rx="14" fill="#c4b29d" opacity=".28" transform="translate(3 3)"/>
        <rect class="sign-board" x="-79" y="-5" width="158" height="88" rx="12"/>
        <path d="m-19 5-6-8m31 8 6-8" fill="none" stroke="#bb8ca7" stroke-width="2" stroke-linecap="round"/>
        <text class="sign-title" y="25" text-anchor="middle" style="fill:#af809b">bilibili</text><text class="sign-subtitle" y="42" text-anchor="middle">B 站 · 微风放映室</text>${entryButton({title: 'bilibili', href: 'https://space.bilibili.com/630698674'}, 0, 51, 136)}
        <g class="night-light">${bulbRow(-66, 79, 9)}</g>
      </g>
      <g class="entrance-balloons vegetation" aria-hidden="true">${balloons(58, 402)}${balloons(468, 515)}${balloons(704, 479)}</g>
      <g class="entrance-drifters vegetation" aria-hidden="true">${range(9, i => `<path class="entry-seed" style="animation-delay:-${i * 1.3}s;animation-duration:${9 + i % 3}s" d="M${75 + i * 71} ${376 + i % 3 * 31}q9-13 16-3-9 9-16 3Z" fill="${i % 2 ? '#d5b9ce' : '#d4dcaf'}" opacity=".6"/>`)}</g>
      ${parkRobot()}
    </g>`;
  }

  function materialDefs() {
    const gradient = (id, colors, horizontal = false) => `<linearGradient id="${id}" x1="0%" y1="0%" x2="${horizontal ? '100%' : '20%'}" y2="${horizontal ? '20%' : '100%'}">${colors.map((color, i) => `<stop offset="${i / (colors.length - 1)}" stop-color="${color}"/>`).join('')}</linearGradient>`;
    return `${gradient('robot-shell', ['#faf5df', '#e0e4d0', '#bccdbd'])}${gradient('plaza-paving', ['#f6eedb', '#e9dfc3', '#d9d3b7'])}${gradient('entry-hedge', ['#c7d7ad', '#a6bf93', '#90ad85'])}${gradient('steel', ['#e5e9dc', '#a5b9b3', '#d2ddd1', '#859e9a'], true)}
      ${gradient('brass', ['#f2e1b6', '#c5ad7c', '#e2ce9d', '#a48c64'], true)}
      ${gradient('glass', ['#e0ebe5', '#b6cfcd', '#85a8b0'])}
      ${gradient('lavender-paint', ['#d0c4da', '#afa1bd', '#8f87a0'])}
      ${gradient('sage-paint', ['#d1dfcf', '#a3bcb0', '#7f9f98'])}
      ${gradient('rose-paint', ['#e7c8b8', '#cfa697', '#ad8e89'])}
      ${gradient('ivory-paint', ['#fff4db', '#e8d8b6', '#cabb9e'])}
      ${gradient('wood-hull', ['#d9bb89', '#b7976e', '#7f7768'])}
      ${gradient('stone', ['#e0dfcf', '#c7c9b9', '#a9b5a7'])}
      ${gradient('slate-roof', ['#a1abb6', '#7f8e9d', '#677b87'])}
      ${gradient('arena-floor', ['#d3d8c9', '#b6c4b7', '#9bb4aa'])}
      ${gradient('flume-water', ['#b4d9d2', '#8cbcc3', '#79a8b5'])}
      <clipPath id="ride-envelope" clipPathUnits="userSpaceOnUse"><rect x="-310" y="0" width="620" height="555" rx="8"/></clipPath>
      ${gradient('pool-water', ['#a9d0ca', '#8fbfc1', '#7baab5'])}
      ${gradient('mountain-wash', ['var(--mountain-far)', 'var(--mountain-near)'])}
      <linearGradient id="valley-mist" x2="0" y2="1"><stop stop-color="var(--grass-back)" stop-opacity="0"/><stop offset="1" stop-color="var(--grass-back)" stop-opacity=".85"/></linearGradient>
      <linearGradient id="sign-face" x2="0" y2="1"><stop stop-color="#fffbed"/><stop offset="1" stop-color="#eee4cc"/></linearGradient>
      <radialGradient id="lamp-glow"><stop stop-color="#ffe4a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe4a0" stop-opacity="0"/></radialGradient>
      <pattern id="sign-mesh" width="8" height="8" patternUnits="userSpaceOnUse"><path d="m0 0 8 8m0-8-8 8m16-8-8 8" stroke="#a4aca0" stroke-width=".5" opacity=".3"/></pattern>`;
  }
  function landscape() {
    const peaks = [225, 168, 268, 201, 252, 156, 232, 185, 267, 149, 218, 176, 244, 195];
    const ridge = range(peaks.length, i => { const x = -650 + i * 600; const h = peaks[i]; return `Q${x - 175} ${h + 74} ${x} ${h}Q${x + 93} ${h + 97} ${x + 255} 357`; });
    return `<g id="mountain-layer" class="scene-layer mountain-layer" data-depth="0.16" aria-hidden="true">
      <path d="M-1100 480V347${ridge}L7900 501H-1100Z" fill="url(#mountain-wash)" opacity=".73"/>
      ${range(peaks.length, i => { const x = -650 + i * 600; const h = peaks[i]; return `<path d="M${x} ${h}q93 97 255 ${357 - h}l-178 118Z" fill="var(--mountain-shadow)" opacity=".14"/>`; })}
      <path d="M-1000 494V386Q-720 285-400 380T180 355T790 372T1380 340T1990 379T2580 352T3190 381T3780 347T4390 377T4980 351T5590 377T6200 347T6800 383T7500 350V502Z" fill="var(--mountain-near)" opacity=".7"/>
      <g fill="var(--mountain-shadow)" opacity=".3">${range(100, i => { const x = -300 + i * 74; const y = 438 + Math.sin(i * .7) * 9; const h = 16 + i % 5 * 6; return `<path d="M${x} ${y - h}l-${h / 3} ${h * .7}h${h / 6}l-${h / 4} ${h * .4}h${h * .8}l-${h / 4}-${h * .4}h${h / 6}Z"/>`; })}</g>
      <path d="M-1100 297H7900V503H-1100Z" fill="url(#valley-mist)"/>
    </g>
    <g class="scene-layer park-ground" aria-hidden="true">
      <path class="grass-back" d="M0 438Q650 414 1300 438T2600 438T3900 438T5200 438T6500 438T7800 438V760H0Z"/>
      ${range(30, i => tree(42 + i * 270, 475 + Math.sin(i * 1.7) * 9, .27 + i % 4 * .05, i % 3 !== 0))}
      <path class="grass" d="M0 515Q650 497 1300 515T2600 515T3900 515T5200 515T6500 515T7800 515V760H0Z"/>
      ${rides.map(ride => `<path d="M${ride.x + 24} 660Q${ride.x - 40} 613 ${ride.x} ${ride.base + 7}" fill="none" stroke="var(--path-line)" stroke-width="34"/><path d="M${ride.x + 24} 660Q${ride.x - 40} 613 ${ride.x} ${ride.base + 7}" fill="none" stroke="var(--path)" stroke-width="31"/>
        <ellipse cx="${ride.x}" cy="${ride.base + 5}" rx="${214 * ride.size}" ry="${30 * ride.size}" fill="var(--path)" stroke="var(--path-line)" stroke-width="1" opacity=".9"/>`).join('')}
      <path class="park-path" d="M0 651Q650 635 1300 651T2600 651T3900 651T5200 651T6500 651T7800 651V760H0Z"/>
      <path d="M0 747H7800" stroke="#fff8e5" stroke-dasharray="2 35" stroke-width="1" opacity=".4"/>
      ${range(100, i => `<path d="M${i * 79} ${614 + Math.sin(i) * 8}l-3-5m3 5 4-6" stroke="#a6b687" stroke-width=".8" fill="none" opacity=".6"/>`)}
    </g>`;
  }

  const drawings = { ferris, coaster, carousel, pirate, teacups, windmill, haunted, bumper, waterslide, airplanes };
  const scenery = [1420,2140,3030,3970,4880,5850,6860,7700].map((x,i) => tree(x, 594 + i % 3 * 6, .55 + i % 3 * .08, i % 3 !== 0)).join('');
  const gardens = range(27, i => shrub(38 + i * 287, 588 + i % 2 * 7, .4 + i % 3 * .12));
  const flowerbeds = range(29, i => { const x = 62 + i * 271; return x > 200 && x < 800 ? '' : flowerbed(x, 634 + i % 2 * 4, .5 + i % 3 * .09); });
  world.innerHTML = `<svg class="park-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}" width="${WORLD_WIDTH}" height="${WORLD_HEIGHT}" aria-label="游乐园，十座持续运转的游乐设施">
    <defs>${materialDefs()}</defs>
    ${landscape()}
    <g aria-hidden="true" class="vegetation">${gardens}</g>
    <g id="ride-layer" class="scene-layer ride-layer" data-depth="1">
      ${[...rides].sort((a, b) => a.base - b.base).map(ride => `<g id="ride-${ride.id}" class="ride" role="group" aria-label="${ride.name}${ride.title ? ` · ${ride.title}` : ''}" style="--ride-color:${ride.color}" data-ride="${ride.id}">
        <title>${ride.name}${ride.title ? ` · 入口按钮打开 ${ride.title}` : ' · 游乐设施'}</title>
        <g class="ride-placement" clip-path="url(#ride-envelope)" transform="translate(${ride.x} ${ride.base - 500 * ride.size}) scale(${ride.size})"><g class="ride-body">
          ${drawings[ride.id](ride)}
        </g></g>
      </g>`).join('')}
    </g>
    ${entrance()}
    <g aria-hidden="true" class="vegetation">${scenery}${flowerbeds}${[845, 2150, 3550, 4950, 6350, 7670].map(bench).join('')}${[1420, 2140, 3970, 4880, 6860, 7710].map(lamp).join('')}${balloons(1460, 526)}${balloons(3540, 517)}${balloons(5650, 518)}</g>
    <rect id="park-walkway" x="0" y="652" width="${WORLD_WIDTH}" height="108" fill="transparent" style="cursor:crosshair"><title>点击道路，让树懒滑过去</title></rect>
  </svg>`;

  document.getElementById('stars').innerHTML = range(55, i => `<i class="star" style="left:${(i * 37.7) % 100}%;top:${(i * 17.3) % 62 + 4}%;--duration:${2 + i % 5}s;animation-delay:-${i % 6}s"></i>`);
  const bilibili = { id: 'bilibili', name: 'B 站', title: 'bilibili', href: 'https://space.bilibili.com/630698674', color: '#cf9fb9', x: 352 };
  const stops = [{ id: 'entrance', name: '园区入口', x: 190 }, bilibili, ...rides].sort((a, b) => a.x - b.x);
  const guide = document.getElementById('park-guide');
  const entries = [bilibili, ...rides];
  document.getElementById('guide-list').innerHTML = entries.map((ride, i) => `<div class="guide-row guide-ticket" style="--ride-color:${ride.color}">
    <${ride.href ? 'a' : 'div'} class="guide-destination" ${ride.href ? `href="${ride.href}" target="_blank" rel="noopener noreferrer" aria-label="在新标签页打开 ${ride.title}"` : ''}>
      <span class="guide-number">${String(i + 1).padStart(2, '0')}</span><span><strong>${ride.title || ride.name}</strong><small>${ride.title ? `${ride.name} · 打开页面` : '游乐设施'}</small></span>${ride.href ? '<span class="guide-arrow" aria-hidden="true">↗</span>' : ''}
    </${ride.href ? 'a' : 'div'}>
    <button class="guide-skate" type="button" data-skate="${ride.id}" aria-label="滑着滑板前往${ride.title || ride.name}"><svg aria-hidden="true"><use href="#i-skate"/></svg><span>滑板前往</span></button>
  </div>`).join('');

  function mapIcon(id, color) {
    const artwork = {
      entrance: '<path d="M-20 19v-27q20-29 40 0v27m-43-29q23-31 46 0"/><path d="M-13 19V5h26v14"/>',
      bilibili: '<rect x="-22" y="-14" width="44" height="32" rx="6"/><path d="m-10-14-6-7m26 7 6-7M-13-2l7 2m12 0 7-2m-18 10 5 3 5-3"/>',
      ferris: '<circle cy="-3" r="21"/><circle cy="-3" r="3"/><path d="M-12 24 0-3 12 24m-33-27h42M0-24v42m-15-36 30 30m-30 0 30-30"/>',
      coaster: '<path d="M-25 17C-12 17-18-23-2-20S9 20 18 8s4-12 9-8M-20 21V6m16 15v-38m14 38V7m13 14V1"/><path d="m-13-9 9-5 3 7-9 4Z" fill="currentColor"/>',
      carousel: '<path d="m-26-4 26-20 26 20Z" fill="currentColor" fill-opacity=".2"/><path d="M-26-4h52m-23-9L0-24 11-6M-21-4v26m42-26v26M0-4v26m-26 0h52M-14 5v10m28-10v10"/><path d="M-18 7h9v6h-9m27-6h9v6H9"/>',
      pirate: '<path d="m-26 24 13-45h26l13 45M-17 6 0-19 17 6M-23 5q23 17 46 0-6 23-23 23T-23 5Z"/><path d="M-12 14h24"/>',
      teacups: '<ellipse cy="21" rx="27" ry="5"/><path d="M-20-12q0 28 20 28t20-28m-4 6q19-6 15 7-3 8-13 7"/><ellipse cy="-12" rx="20" ry="5"/>',
      windmill: '<path d="m-13 24 4-39H9l4 39Zm13-35-7-15h13L0-11l24-6v12L0-11 6 12H-6L0-11l-24 6v-12Z"/>',
      haunted: '<path d="M-22 24V-5l22-18 22 18v29Zm-4-29L0-28 26-5M-6 24V10H6v14M-15-2h9v8h-9m21-8h9v8H6m6-18v-8h6v13"/>',
      bumper: '<path d="M-25 23V-8h50v31m-52-31L0-23 27-8ZM-18 11q2-9 12-7 12-2 20 7v7h-32Zm19-7v-12"/><ellipse cy="18" rx="19" ry="4"/>',
      waterslide: '<path d="M-23 24V-24h9v48m-9-35h9m-9 12h9M-13-20C0-20-7 5 7 5s4 16 18 16" stroke-width="5"/><path d="M-13-20C0-20-7 5 7 5s4 16 18 16" stroke="#fff7e6"/><ellipse cx="17" cy="25" rx="17" ry="4"/>',
      airplanes: '<path d="M-26 2q23-14 49-5 8 6 0 10h-49Zm11-6-7-14h11L3-4M-4 6l10 17h12L10 5m-29-2-9-12h10m43-13v38M0 12v16"/>',
    };
    return `<g transform="scale(.78)" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${artwork[id]}</g>`;
  }
  let mapCompact = null;
  function renderGuideMap() {
    if (!guide.open) return;
    const compact = innerWidth <= 600;
    if (mapCompact === compact) return;
    mapCompact = compact;
    const tour = [{ id: 'entrance', title: '园区入口', color: '#92a582' }, ...entries];
    const columns = compact ? 4 : 6;
    const width = compact ? 408 : 760;
    const height = compact ? 366 : 268;
    const points = tour.map((stop, i) => {
      const row = Math.floor(i / columns);
      const column = row % 2 ? columns - 1 - i % columns : i % columns;
      return { ...stop, x: compact ? 51 + column * 102 : 65 + column * 126, y: compact ? 64 + row * 112 : 68 + row * 128 };
    });
    const road = points.map((point, i) => {
      if (!i) return `M${point.x} ${point.y}`;
      const previous = points[i - 1];
      if (point.y === previous.y) return `L${point.x} ${point.y}`;
      const bend = point.x > width / 2 ? 37 : -37;
      return `C${previous.x + bend} ${previous.y + 37} ${point.x + bend} ${point.y - 37} ${point.x} ${point.y}`;
    }).join('');
    document.getElementById('guide-map').innerHTML = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="游乐园手绘路线图，选择一站滑板前往">
      <path d="M0 ${height * .6}Q${width * .2} ${height * .28} ${width * .42} ${height * .61}T${width} ${height * .5}V${height}H0Z" fill="#e5e9cf"/>
      <path d="M0 ${height * .83}Q${width * .3} ${height * .6} ${width * .57} ${height * .86}T${width} ${height * .75}V${height}H0Z" fill="#d9e3bf"/>
      <path d="M15 24Q${width / 2} 42 ${width - 15} 24" fill="none" stroke="#c5b998" stroke-width="1"/>
      ${range(compact ? 9 : 15, i => `<path d="m${24 + i * (width - 48) / (compact ? 8 : 14)} ${28 + Math.sin(i / 2) * 6} 7 13 7-13Z" fill="${['#c5b0d3', '#d8bc9c', '#afc8b2'][i % 3]}"/>`)}
      <path d="${road}" fill="none" stroke="#fdf9eb" stroke-width="29" stroke-linecap="round"/>
      <path d="${road}" fill="none" stroke="#d7c8a4" stroke-width="20" stroke-linecap="round"/>
      <path d="${road}" fill="none" stroke="#fff6df" stroke-width="1.5" stroke-dasharray="3 8"/>
      ${range(compact ? 8 : 12, i => { const x = 18 + i * (width - 36) / (compact ? 7 : 11); const y = height - 14 - i % 3 * 6; return `<g transform="translate(${x} ${y})"><path d="M0 0v-13" stroke="#9eab81" stroke-width="2"/><path d="M0-26-8-9H8Z" fill="#b2c39a"/><circle cx="9" cy="-3" r="3" fill="#cfb8d4"/></g>`; })}
      ${points.map((stop, i) => `<g class="map-stop" role="button" tabindex="0" data-skate="${stop.id}" aria-label="滑板前往${stop.title || stop.name}" transform="translate(${stop.x} ${stop.y})">
        <rect x="-45" y="-32" width="90" height="88" rx="16" fill="transparent"/>
        <circle cy="-1" r="28" fill="#fffbef" stroke="${stop.color}" stroke-width="1.3"/>
        <circle cy="-1" r="24" fill="${stop.color}" opacity=".08"/>
        ${mapIcon(stop.id, stop.color)}
        <circle cx="24" cy="-23" r="8" fill="${stop.color}"/><text x="24" y="-20" text-anchor="middle" font-size="8" fill="#fffdf2">${i === 0 ? '始' : i}</text>
        <text y="43" text-anchor="middle" font-size="${compact ? 13 : 12}" fill="#657260" font-family="inherit">${stop.title || stop.name}</text>
      </g>`).join('')}
    </svg>`;
  }

  renderGuideMap();
  const proximityNodes = rides.map(ride => ({ ride, node: document.getElementById(`ride-${ride.id}`), visible: true, proximity: '' }));
  const tools = document.querySelector('.park-tools');
  const mountainLayer = document.getElementById('mountain-layer');
  const status = document.getElementById('travel-status');
  const activeRides = new Set();
  const decorativeItems = [...world.querySelectorAll('.decor-cluster, #entrance-scene')].map(node => ({ node, left: Number(node.dataset.left), right: Number(node.dataset.right), visible: true }));
  let visibleSlice = '';
  let motionReady = false;
  let layoutMetrics = { width: 0, height: 0, half: 60, compact: false };
  let lastActorTransform = '';
  function updateVisibility(force = false) {
    const left = viewport.scrollLeft / scale;
    const right = left + layoutMetrics.width / scale;
    const slice = `${Math.floor(left / 70)}:${Math.ceil(right / 70)}`;
    if (!force && slice === visibleSlice) return;
    visibleSlice = slice;
    const margin = 115;
    proximityNodes.forEach(item => {
      const visible = item.ride.x + 315 * item.ride.size >= left - margin && item.ride.x - 315 * item.ride.size <= right + margin;
      if (visible) activeRides.add(item.ride.id); else activeRides.delete(item.ride.id);
      if (item.visible !== visible) { item.node.classList.toggle('is-offscreen', !visible); item.visible = visible; }
    });
    decorativeItems.forEach(item => {
      const visible = item.right >= left - margin && item.left <= right + margin;
      if (item.visible !== visible) { item.node.classList.toggle('is-offscreen', !visible); item.visible = visible; }
    });
    if (motionReady) syncAnimation();
  }
  let scale = 1;
  let initialized = false;
  let scrollFrame = 0;
  let movingTimer;
  let suppressClick = false;
  let clickTimer;
  let drag = null;
  let actorDrag = null;
  let travel = null;
  let travelFrame = 0;
  let cameraUntil = 0;
  let actorScreenX = 190;
  const actor = { x: 190, y: 710 };
  let paused = motionQuery.matches;
  let animationFrame = 0;
  const character = document.getElementById('sloth-drag');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function actorBounds() {
    const padding = (layoutMetrics.half + (layoutMetrics.compact ? 39 : 52) + 10) / scale;
    return { min: padding, max: WORLD_WIDTH - padding };
  }
  function updatePosition() {
    scrollFrame = 0;
    const before = [...stops].reverse().find(stop => stop.x < actor.x - 18);
    const after = stops.find(stop => stop.x > actor.x + 18);
    leftButton.hidden = !before;
    rightButton.hidden = !after;
    if (before) leftButton.setAttribute('aria-label', `滑向${before.title || before.name}`);
    if (after) rightButton.setAttribute('aria-label', `滑向${after.title || after.name}`);
  }
  function renderActor(follow = false) {
    if (follow) {
      const pixelX = actor.x * scale - viewport.scrollLeft;
      const margin = layoutMetrics.half + (layoutMetrics.compact ? 48 : 64);
      const approach = clamp((actor.x - 190) / 260, 0, 1);
      const lower = Math.max(margin, layoutMetrics.width * .28 + Math.max(0, 190 * scale - layoutMetrics.width * .28) * (1 - approach));
      const upper = Math.min(layoutMetrics.width - margin, layoutMetrics.width * .72);
      if (pixelX < lower || pixelX > upper) {
        cameraUntil = performance.now() + 120;
        viewport.scrollLeft = actor.x * scale - clamp(pixelX, lower, upper);
      }
    }
    actorScreenX = actor.x * scale - viewport.scrollLeft;
    const top = layoutMetrics.height - (WORLD_HEIGHT - actor.y) * scale;
    const transform = `translate3d(${actorScreenX.toFixed(2)}px,${top.toFixed(2)}px,0) translate(-50%,-90.5%)`;
    if (transform !== lastActorTransform) { sloth.style.transform = transform; lastActorTransform = transform; }
    tools.classList.toggle('dock-left', layoutMetrics.compact && actorScreenX >= layoutMetrics.width / 2 - .5);
    const mountainOffset = motionQuery.matches ? 0 : viewport.scrollLeft / scale * .84;
    mountainLayer.setAttribute('transform', `translate(${mountainOffset.toFixed(2)} 0)`);
    root.style.setProperty('--sky-pan', `${motionQuery.matches ? 0 : -viewport.scrollLeft * .025}px`);
    updateVisibility();
    proximityNodes.forEach(item => {
      const closeness = motionQuery.matches || !item.visible ? 0 : Math.max(0, 1 - Math.abs(actor.x - item.ride.x) / 360);
      const eased = closeness * closeness * (3 - 2 * closeness);
      const value = (1 + eased * .035).toFixed(3);
      if (item.proximity !== value) { item.node.style.setProperty('--proximity-scale', value); item.proximity = value; }
    });
    updatePosition();
  }
  function layout() {
    renderGuideMap();
    layoutMetrics = { width: viewport.clientWidth, height: viewport.clientHeight, half: sloth.offsetWidth / 2, compact: innerWidth <= 600 };
    scale = Math.min((viewport.clientHeight - 76) / WORLD_HEIGHT, innerWidth <= 600 ? Math.min(.9, viewport.clientWidth / 480) : 1.3);
    scale = Math.max(.36, scale);
    world.style.width = `${WORLD_WIDTH * scale}px`;
    world.style.height = `${WORLD_HEIGHT * scale}px`;
    if (!initialized) { viewport.scrollLeft = 0; initialized = true; }
    const bounds = actorBounds();
    actor.x = clamp(actor.x, bounds.min, bounds.max);
    updateVisibility(true);
    renderActor(true);
  }
  function stopTravel() {
    cancelAnimationFrame(travelFrame);
    travelFrame = 0;
    travel = null;
    if (!actorDrag) sloth.classList.remove('is-moving');
  }
  function travelTo(x, y = actor.y, label = '') {
    stopTravel();
    const bounds = actorBounds();
    x = clamp(x, bounds.min, bounds.max);
    y = clamp(y, 678, 724);
    sloth.dataset.direction = x < actor.x ? 'left' : 'right';
    if (motionQuery.matches) {
      actor.x = x; actor.y = y; renderActor(true);
      if (label) status.textContent = `已到达${label}`;
      return;
    }
    travel = { fromX: actor.x, fromY: actor.y, toX: x, toY: y, label, start: performance.now(), duration: clamp(Math.abs(x - actor.x) * 1.7, 500, 3600) };
    sloth.classList.add('is-moving');
    function skate(now) {
      if (!travel) return;
      const t = clamp((now - travel.start) / travel.duration, 0, 1);
      const eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      actor.x = travel.fromX + (travel.toX - travel.fromX) * eased;
      actor.y = travel.fromY + (travel.toY - travel.fromY) * eased;
      renderActor(true);
      if (t < 1) travelFrame = requestAnimationFrame(skate);
      else {
        if (travel.label) status.textContent = `已到达${travel.label}`;
        travel = null; travelFrame = 0; sloth.classList.remove('is-moving');
      }
    }
    travelFrame = requestAnimationFrame(skate);
  }
  function goTo(id) {
    const stop = stops.find(item => item.id === id);
    if (stop) travelTo(stop.x, 710, stop.title || stop.name);
  }
  function move(direction) {
    const x = travel ? travel.toX : actor.x;
    const stop = direction > 0 ? stops.find(item => item.x > x + 18) : [...stops].reverse().find(item => item.x < x - 18);
    if (stop) goTo(stop.id);
  }
  leftButton.addEventListener('click', () => move(-1));
  rightButton.addEventListener('click', () => move(1));
  document.getElementById('home-button').addEventListener('click', () => goTo('entrance'));
  function selectMapStop(id) {
    guide.close();
    goTo(id);
    character.focus({ preventScroll: true });
  }
  guide.addEventListener('click', event => {
    const button = event.target.closest('[data-skate]');
    if (button) selectMapStop(button.dataset.skate);
  });
  guide.addEventListener('keydown', event => {
    const button = event.target.closest('.map-stop');
    if (button && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); selectMapStop(button.dataset.skate);
    }
  });
  viewport.addEventListener('scroll', () => {
    if (scrollFrame || travel || actorDrag) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (performance.now() > cameraUntil) {
        const bounds = actorBounds();
        actor.x = clamp((viewport.scrollLeft + actorScreenX) / scale, bounds.min, bounds.max);
      }
      renderActor();
      sloth.classList.add('is-moving');
      clearTimeout(movingTimer);
      movingTimer = setTimeout(() => { if (!travel && !actorDrag) sloth.classList.remove('is-moving'); }, 150);
    });
  }, { passive: true });
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    if (viewport.scrollWidth <= viewport.clientWidth + 2) return;
    stopTravel();
    event.preventDefault();
    const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    viewport.scrollLeft += event.deltaY * multiplier;
  }, { passive: false });
  function onNavigationKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const keys = { ArrowLeft: -1, ArrowRight: 1, PageUp: -1, PageDown: 1 };
    if (event.key in keys) { event.preventDefault(); move(keys[event.key]); }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); goTo(event.key === 'Home' ? 'entrance' : 'airplanes');
    }
  }
  viewport.addEventListener('keydown', onNavigationKey);
  character.addEventListener('keydown', onNavigationKey);
  // Scene drags pan the camera; direct character drags work with mouse, pen and touch.
  viewport.addEventListener('pointerdown', event => {
    stopTravel();
    if (event.pointerType === 'touch' || event.button !== 0) return;
    clearTimeout(clickTimer); suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, scroll: viewport.scrollLeft, moved: false };
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) > 6) {
      drag.moved = true; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging');
    }
    if (drag.moved) { event.preventDefault(); viewport.scrollLeft = drag.scroll - delta; }
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove('is-dragging'); drag = null;
    clickTimer = setTimeout(() => { suppressClick = false; }, 0);
  }
  window.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', event => { if (drag) endDrag(event); });
  viewport.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  character.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    stopTravel();
    actorDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, fromX: actor.x, fromY: actor.y, scroll: viewport.scrollLeft };
    character.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  character.addEventListener('pointermove', event => {
    if (!actorDrag || actorDrag.id !== event.pointerId) return;
    const bounds = actorBounds();
    const x = clamp(actorDrag.fromX + (event.clientX - actorDrag.x + viewport.scrollLeft - actorDrag.scroll) / scale, bounds.min, bounds.max);
    sloth.dataset.direction = x < actor.x ? 'left' : 'right';
    actor.x = x;
    actor.y = clamp(actorDrag.fromY + (event.clientY - actorDrag.y) / scale, 678, 724);
    sloth.classList.add('is-moving'); renderActor(true);
    event.preventDefault();
  });
  function endActorDrag(event) {
    if (!actorDrag || actorDrag.id !== event.pointerId) return;
    actorDrag = null;
    if (character.hasPointerCapture(event.pointerId)) character.releasePointerCapture(event.pointerId);
    sloth.classList.remove('is-moving');
  }
  character.addEventListener('pointerup', endActorDrag);
  character.addEventListener('pointercancel', endActorDrag);
  character.addEventListener('lostpointercapture', endActorDrag);
  document.getElementById('park-walkway').addEventListener('click', event => {
    if (suppressClick) return;
    const x = (event.clientX + viewport.scrollLeft) / scale;
    const y = WORLD_HEIGHT - (viewport.clientHeight - event.clientY) / scale;
    travelTo(x, y);
  });
  viewport.addEventListener('focusin', event => {
    const ride = event.target.closest('.ride');
    if (!ride) return;
    const bounds = ride.getBoundingClientRect();
    if (bounds.left < 0 || bounds.right > viewport.clientWidth) goTo(ride.id.replace('ride-', ''));
  });
  new ResizeObserver(layout).observe(viewport);
  layout();

  // Sample each path once on first use, then animate only the rides near the viewport.
  const coasterPath = document.getElementById('coaster-track');
  const coasterCars = [...document.querySelectorAll('.coaster-car')];
  const coasterLength = coasterPath.getTotalLength();
  const coasterLights = document.getElementById('coaster-track-lights');
  const coasterAir = document.getElementById('coaster-air-position');
  const coasterStation = document.querySelector('.coaster-station');
  const slidePath = document.getElementById('slide-track');
  const logBoat = document.getElementById('log-boat');
  const slideLength = slidePath.getTotalLength();
  const carouselSeats = [...document.querySelectorAll('.carousel-seat')];
  const cups = [...document.querySelectorAll('.cup-orbit')];
  const planes = [...document.querySelectorAll('.airplane-orbit')];
  let coasterSamples = null;
  let slideSamples = null;
  let motionEpoch = performance.now();
  let lastMotionPaint = 0;
  let stationPassing = false;
  function samplePath(path, length, count = 180) {
    const points = Array.from({ length: count + 1 }, (_, i) => path.getPointAtLength(i / count * length));
    return points.map((point, i) => {
      const a = points[Math.max(0, i - 1)]; const b = points[Math.min(count, i + 1)];
      return { x: point.x, y: point.y, angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    });
  }
  function placeOnSamples(element, samples, fraction, keepUpright = false) {
    const step = Math.max(0, Math.min(.999999, fraction)) * (samples.length - 1);
    const index = Math.floor(step); const t = step - index;
    const a = samples[index]; const b = samples[index + 1];
    const x = a.x + (b.x - a.x) * t; const y = a.y + (b.y - a.y) * t;
    const turn = ((b.angle - a.angle + 540) % 360) - 180;
    let angle = a.angle + turn * t;
    let direction = 1;
    if (keepUpright && (angle > 90 || angle < -90)) { angle += angle > 90 ? -180 : 180; direction = -1; }
    element.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${direction} 1)`);
    return { x, y };
  }
  function drawMotion(time) {
    if (activeRides.has('coaster')) {
      if (!coasterSamples) {
        coasterSamples = samplePath(coasterPath, coasterLength);
        document.getElementById('coaster-sleepers').innerHTML = coasterSamples.filter((_, i) => i % 2 === 0).map(p => {
          const angle = (p.angle + 90) * Math.PI / 180;
          return `<path d="M${p.x - Math.cos(angle) * 4} ${p.y - Math.sin(angle) * 4}l${Math.cos(angle) * 15} ${Math.sin(angle) * 15}"/>`;
        }).join('');
      }
      const phase = (time % 11000) / 11000;
      const progress = phase < .35 ? phase * .65 : .2275 + (phase - .35) * (.7725 / .65);
      let head;
      coasterCars.forEach((car, i) => {
        const fraction = ((progress - i * 29 / coasterLength) % 1 + 1) % 1;
        const point = placeOnSamples(car, coasterSamples, fraction, true);
        if (i === 0) head = point;
      });
      placeOnSamples(coasterAir, coasterSamples, ((progress - 70 / coasterLength) % 1 + 1) % 1);
      coasterLights.setAttribute('stroke-dashoffset', (-coasterLength * progress).toFixed(1));
      const passing = Math.hypot(head.x + 108, head.y - 435) < 98;
      if (passing !== stationPassing) { coasterStation.classList.toggle('is-passing', passing); stationPassing = passing; }
    }
    if (activeRides.has('waterslide')) {
      if (!slideSamples) slideSamples = samplePath(slidePath, slideLength, 100);
      const phase = (time % 9000) / 9000;
      placeOnSamples(logBoat, slideSamples, Math.min(1, Math.pow(phase / .76, 1.7)));
      logBoat.style.opacity = phase < .78 ? '1' : String(Math.max(0, 1 - (phase - .78) / .07));
    }
    if (activeRides.has('carousel')) carouselSeats.forEach((seat, i) => {
      const angle = time / 12000 * Math.PI * 2 + i * Math.PI * 2 / 3;
      const depth = Math.cos(angle);
      seat.setAttribute('transform', `translate(${(Math.sin(angle) * 94).toFixed(2)} ${(399 + depth * 13).toFixed(2)}) scale(${(.92 + depth * .06).toFixed(3)})`);
    });
    if (activeRides.has('teacups')) cups.forEach((cup, i) => {
      const angle = time / 16000 * Math.PI * 2 + i * Math.PI * 2 / 3;
      const depth = Math.cos(angle);
      cup.setAttribute('transform', `translate(${(Math.sin(angle) * 101).toFixed(2)} ${(depth * 17).toFixed(2)}) scale(${(.91 + depth * .08).toFixed(3)})`);
    });
    if (activeRides.has('airplanes')) planes.forEach((plane, i) => {
      const angle = time / 14000 * Math.PI * 2 + i * Math.PI * 2 / 3;
      const depth = Math.cos(angle);
      plane.setAttribute('transform', `translate(${(Math.sin(angle) * 114).toFixed(2)} ${(depth * 22).toFixed(2)}) scale(${(.91 + depth * .07).toFixed(3)})`);
    });
  }
  function needsMotionFrame() {
    return ['coaster', 'waterslide', 'carousel', 'teacups', 'airplanes'].some(id => activeRides.has(id));
  }
  function tick(time) {
    if (paused || document.hidden || !needsMotionFrame()) { animationFrame = 0; return; }
    if (time - lastMotionPaint >= 32) { drawMotion(time - motionEpoch); lastMotionPaint = time; }
    animationFrame = requestAnimationFrame(tick);
  }
  function syncAnimation() {
    root.classList.toggle('motion-paused', paused);
    root.classList.toggle('page-hidden', document.hidden);
    if (paused || document.hidden || !needsMotionFrame()) {
      cancelAnimationFrame(animationFrame); animationFrame = 0;
      if (paused && motionReady) drawMotion(0);
    } else if (!animationFrame) {
      drawMotion(performance.now() - motionEpoch);
      animationFrame = requestAnimationFrame(tick);
    }
  }
  motionReady = true;
  drawMotion(0);
  syncAnimation();
  motionQuery.addEventListener('change', () => { paused = motionQuery.matches; syncAnimation(); renderActor(); });
  document.addEventListener('visibilitychange', syncAnimation);

  const robot = document.getElementById('park-robot');
  robot.style.setProperty('--robot-cycle', `${ROBOT_CONFIG.cuteMs + ROBOT_CONFIG.evilMs}ms`);
  let robotGreetingTimer;
  function activateRobot(originalEvent) {
    const detail = { robot, href: ROBOT_CONFIG.href, originalEvent };
    if (!robot.dispatchEvent(new CustomEvent('park:robot-activate', { bubbles: true, cancelable: true, detail }))) return;
    if (typeof ROBOT_CONFIG.onActivate === 'function' && ROBOT_CONFIG.onActivate(detail) === false) return;
    if (ROBOT_CONFIG.href) window.open(ROBOT_CONFIG.href, '_blank', 'noopener,noreferrer');
    else {
      robot.classList.add('is-greeting');
      clearTimeout(robotGreetingTimer);
      robotGreetingTimer = setTimeout(() => robot.classList.remove('is-greeting'), 1000);
    }
  }
  robot.addEventListener('click', event => { if (!suppressClick) activateRobot(event); });
  robot.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); activateRobot(event); }
  });
  window.breezePark = Object.freeze({
    setRobotDestination(value) {
      if (!value) { ROBOT_CONFIG.href = null; return null; }
      const url = new URL(value, location.href);
      if (!['https:', 'http:'].includes(url.protocol)) throw new TypeError('Robot destinations must use HTTP or HTTPS');
      ROBOT_CONFIG.href = url.href;
      return ROBOT_CONFIG.href;
    },
    getRobotDestination: () => ROBOT_CONFIG.href,
  });

  // A full loop is 3 or 5 minutes: day → dusk → night → morning → day.
  // In fixed mode the adjacent icon chooses a single phase. No text is needed on it.
  const phases = [
    { id: 'day', name: '白天', icon: 'sun', sun: 16, moon: 0 },
    { id: 'dusk', name: '黄昏', icon: 'dusk', sun: 43, moon: .15 },
    { id: 'night', name: '夜晚', icon: 'moon', sun: 55, moon: 1 },
    { id: 'morning', name: '早晨', icon: 'dawn', sun: 29, moon: .2 },
  ];
  const colorNames = ['ink', 'muted', 'sky-top', 'sky-bottom', 'surface', 'line', 'grass', 'grass-back', 'path', 'path-line', 'hill', 'hill-back', 'tree', 'tree-dark', 'mountain-far', 'mountain-near', 'mountain-shadow'];
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
    };
  });
  let cycleMode = '3';
  let fixedPhase = 'day';
  try {
    cycleMode = localStorage.getItem('breeze-cycle-mode') || '3';
    fixedPhase = localStorage.getItem('breeze-fixed-phase') || 'day';
  } catch { /* Preferences are optional when storage is unavailable. */ }
  if (!['3', '5', 'infinity'].includes(cycleMode)) cycleMode = '3';
  if (!phases.some(phase => phase.id === fixedPhase)) fixedPhase = 'day';
  let cycleEpoch = performance.now();
  const modeButton = document.getElementById('cycle-mode');
  const phaseButton = document.getElementById('fixed-phase');
  const mix = (a, b, t) => a + (b - a) * t;
  const duration = () => Number(cycleMode) * 60000;
  const paintedLight = new Map();
  function lightProperty(name, value) {
    if (paintedLight.get(name) === value) return;
    paintedLight.set(name, value); root.style.setProperty(name, value);
  }
  function paintLight(now = performance.now()) {
    const progress = cycleMode === 'infinity' ? 0 : ((now - cycleEpoch) / duration() % 1 + 1) % 1;
    const phase = cycleMode === 'infinity' ? phases.findIndex(item => item.id === fixedPhase) : Math.floor(progress * 4);
    const next = (phase + 1) % 4;
    let blend = cycleMode === 'infinity' ? 0 : clamp((progress * 4 % 1 - .55) / .45, 0, 1);
    blend = blend * blend * (3 - 2 * blend);
    const a = palettes[phase]; const b = palettes[next];
    const light = phases[blend > .5 ? next : phase].id;
    if (root.dataset.light !== light) root.dataset.light = light;
    colorNames.forEach((name, i) => lightProperty(`--${name}`, `rgb(${a.colors[i].map((value, channel) => Math.round(mix(value, b.colors[i][channel], blend))).join(',')})`));
    lightProperty('--night-opacity', mix(a.night, b.night, blend).toFixed(3));
    lightProperty('--day-opacity', mix(a.day, b.day, blend).toFixed(3));
    lightProperty('--moon-opacity', mix(phases[phase].moon, phases[next].moon, blend).toFixed(3));
    lightProperty('--sun-top', `${mix(phases[phase].sun, phases[next].sun, blend)}%`);
    modeButton.style.setProperty('--cycle-progress', String(cycleMode === 'infinity' ? 0 : progress));
    const skyColor = paintedLight.get('--sky-top');
    if (document.querySelector('meta[name="theme-color"]').content !== skyColor) document.querySelector('meta[name="theme-color"]').content = skyColor;
  }
  function syncClockControls() {
    const fixed = cycleMode === 'infinity';
    modeButton.querySelector('span').textContent = fixed ? '♾' : cycleMode;
    const nextMode = cycleMode === '3' ? '5 分钟一昼夜' : cycleMode === '5' ? '固定时段' : '3 分钟一昼夜';
    const label = fixed ? '固定时段' : `${cycleMode} 分钟一昼夜`;
    modeButton.dataset.hint = `${label} · 点击切换为${nextMode}`;
    modeButton.removeAttribute('title');
    modeButton.setAttribute('aria-label', `当前${label}，点击切换为${nextMode}`);
    phaseButton.hidden = !fixed;
    modeButton.setAttribute('aria-expanded', String(fixed));
    const index = phases.findIndex(phase => phase.id === fixedPhase);
    phaseButton.querySelector('use').setAttribute('href', `#i-${phases[index].icon}`);
    phaseButton.dataset.hint = `固定${phases[index].name} · 点击切换${phases[(index + 1) % 4].name}`;
    phaseButton.removeAttribute('title');
    phaseButton.setAttribute('aria-label', phaseButton.dataset.hint);
    try {
      localStorage.setItem('breeze-cycle-mode', cycleMode);
      localStorage.setItem('breeze-fixed-phase', fixedPhase);
    } catch { /* The clock continues without persistence. */ }
    paintLight();
  }
  modeButton.addEventListener('click', () => {
    const now = performance.now();
    const progress = cycleMode === 'infinity' ? phases.findIndex(phase => phase.id === fixedPhase) / 4 : ((now - cycleEpoch) / duration() % 1 + 1) % 1;
    fixedPhase = root.dataset.light;
    cycleMode = cycleMode === '3' ? '5' : cycleMode === '5' ? 'infinity' : '3';
    if (cycleMode !== 'infinity') cycleEpoch = now - progress * duration();
    syncClockControls();
  });
  phaseButton.addEventListener('click', () => {
    const index = phases.findIndex(phase => phase.id === fixedPhase);
    fixedPhase = phases[(index + 1) % 4].id;
    syncClockControls();
  });
  syncClockControls();
  setInterval(() => { if (!document.hidden && cycleMode !== 'infinity') paintLight(); }, 200);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) paintLight(); });

  const guideOpen = document.getElementById('guide-open');
  function openGuide() { guide.showModal(); renderGuideMap(); }
  guideOpen.addEventListener('click', openGuide);
  guideOpen.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGuide(); }
  });
  document.getElementById('guide-close').addEventListener('click', () => guide.close());
  guide.addEventListener('click', event => {
    if (event.target !== guide) return;
    const bounds = guide.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) guide.close();
  });

  let toastTimer;
  function toast(message) {
    const element = document.getElementById('toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
  }
  document.getElementById('share-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast('微风已打包，链接已复制。');
    } catch {
      const input = document.createElement('textarea');
      input.value = location.href;
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
    fullscreenButton.dataset.hint = full ? '退出全屏' : '全屏';
  });

})();
