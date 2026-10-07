const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

const W = canvas.width;
const H = canvas.height;
const FIELD_LEFT = 55;
const FIELD_RIGHT = 1225;
const FIELD_TOP = 38;
const FIELD_BOTTOM = 612;
const QUARTER_LENGTH = 120;
const END_ZONE_DEPTH = 10;
const TOTAL_FIELD_YARDS = 100 + END_ZONE_DEPTH * 2;
const END_ZONE_WIDTH = (FIELD_RIGHT - FIELD_LEFT) * END_ZONE_DEPTH / TOTAL_FIELD_YARDS;
const PLAYFIELD_LEFT = FIELD_LEFT + END_ZONE_WIDTH;
const PLAYFIELD_RIGHT = FIELD_RIGHT - END_ZONE_WIDTH;
const LEFT_GOAL_LINE = 0;
const RIGHT_GOAL_LINE = 100;

const teams = [
  { id: 'hawks', name: 'Harbor Hawks', short: 'HH', logo: 'assets/logos/harbor-hawks.png', color: '#ff714b', dark: '#8b302b', summary: 'Fast receivers and a mobile quarterback attack every blade of grass.', stats: { speed: 90, throwPower: 72, hands: 75, cover: 76 } },
  { id: 'comets', name: 'Metro Comets', short: 'MC', logo: 'assets/logos/metro-comets.png', color: '#68d5d5', dark: '#246b6e', summary: 'A disciplined secondary and a strong arm punish predictable reads.', stats: { speed: 78, throwPower: 88, hands: 84, cover: 88 } },
  { id: 'mustangs', name: 'Mesa Mustangs', short: 'MM', logo: 'assets/logos/mesa-mustangs.png', color: '#e6ba58', dark: '#806324', summary: 'Heavy blockers and a bruising back make the power game dangerous.', stats: { speed: 72, throwPower: 80, hands: 76, cover: 69 } },
  { id: 'tides', name: 'Cobalt Tides', short: 'CT', logo: 'assets/logos/cobalt-tides.png', color: '#8f89ff', dark: '#393676', summary: 'Creative route runners create space, but the line gives up pressure.', stats: { speed: 84, throwPower: 78, hands: 82, cover: 80 } }
];

const offensePlays = [
  { id: 'slants', name: 'Quick Slants', desc: 'Fast in-breakers · hot read', icon: '↗' },
  { id: 'verts', name: 'Four Verts', desc: 'Stretch the safeties', icon: '↑' },
  { id: 'screen', name: 'RB Screen', desc: 'Let the rush come', icon: '↘' },
  { id: 'power', name: 'Power Run', desc: 'Follow the pulling guard', icon: '●' },
  { id: 'cross', name: 'Play-Action Cross', desc: 'Sell run · cross behind LB', icon: '✕' },
  { id: 'sweep', name: 'Outside Sweep', desc: 'Race to the sideline', icon: '➜' },
  { id: 'flood', name: 'Flood Left', desc: 'Three levels, one side', icon: '≋' },
  { id: 'qbDraw', name: 'QB Draw', desc: 'Clear the box · go now', icon: '◆' }
];

const defensePlays = [
  { id: 'man', name: 'Lock Man', desc: 'Mirror every route', icon: '◎' },
  { id: 'blitz', name: 'Standard Blitz', desc: 'Bring four with heat', icon: '⚡' },
  { id: 'zone', name: 'Zone Blitz', desc: 'Rotate & pressure', icon: '◇' },
  { id: 'cover2', name: 'Cover 2', desc: 'Protect the deep ball', icon: '△' },
  { id: 'spy', name: 'QB Spy', desc: 'LB shadows the scramble', icon: '◉' },
  { id: 'prevent', name: 'Prevent', desc: 'Keep it in front', icon: '▽' },
  { id: 'goalLine', name: 'Goal Line', desc: 'Pack the box tight', icon: '▣' },
  { id: 'bracket', name: 'Bracket Star', desc: 'Double the top threat', icon: '⟐' }
];

const conversionOffensePlays = [
  { id: 'xpKick', name: '1 PT · Extra Point Kick', desc: 'Split the uprights for one', icon: '◎' },
  { id: 'xpSafeKick', name: '1 PT · Safe Kick', desc: 'Protect the snap and boot it', icon: '↗' },
  { id: 'twoPointPower', name: '2 PT · Power Run', desc: 'Punch through the goal line', icon: '●' },
  { id: 'twoPointPass', name: '2 PT · Quick Pass', desc: 'Win a short goal-line window', icon: '✕' },
  { id: 'twoPointSweep', name: '2 PT · Sweep', desc: 'Race outside the goal-line box', icon: '➜' },
  { id: 'twoPointFade', name: '2 PT · Fade', desc: 'Throw high to the back corner', icon: '↑' },
  { id: 'twoPointSneak', name: '2 PT · QB Sneak', desc: 'Quarterback drives the pile', icon: '◆' },
  { id: 'twoPointBoot', name: '2 PT · Bootleg', desc: 'Sell the run and roll out', icon: '≋' }
];

const conversionDefensePlays = [
  { id: 'kickBlock', name: 'Block Kick', desc: 'Attack the one-point protection', icon: '⚡' },
  { id: 'kickSafe', name: 'Kick Safe', desc: 'Set the return wall', icon: '▽' },
  { id: 'goalLine', name: 'Goal Line', desc: 'Pack the box for two points', icon: '▣' },
  { id: 'goalBlitz', name: 'Goal-Line Blitz', desc: 'Bring pressure immediately', icon: '◇' },
  { id: 'spy', name: 'QB Spy', desc: 'Keep the quarterback contained', icon: '◉' },
  { id: 'man', name: 'Lock Man', desc: 'Mirror every conversion route', icon: '◎' },
  { id: 'zone', name: 'Red Zone Zone', desc: 'Pass off the crossing threat', icon: '△' },
  { id: 'prevent', name: 'Back Line', desc: 'Protect the back of the end zone', icon: '↔' }
];

function playDiagram(kind, playId, options = {}) {
  const offense = kind === 'offense';
  const direction = options.direction === -1 ? -1 : 1;
  const teamColor = options.teamColor || (offense ? '#ff9b58' : '#68d5d5');
  const opponentColor = options.opponentColor || (offense ? '#68d5d5' : '#ff9b58');
  const marker = `arrow-${kind}-${playId}-${direction === -1 ? 'reverse' : 'forward'}`;
  const orange = offense ? teamColor : opponentColor;
  const cyan = offense ? opponentColor : teamColor;
  const gold = '#ffd25b';
  const ink = '#b8c9c0';
  const dot = (x, y, color, label = '') => `<circle cx="${x}" cy="${y}" r="3.2" fill="${color}" stroke="#0b1718" stroke-width="1.5"/>${label ? `<text x="${x}" y="${y + 1.7}" text-anchor="middle" font-size="4.4" font-weight="800" fill="#0b1718"${direction === -1 ? ` transform="translate(${x * 2} 0) scale(-1 1)"` : ''}>${label}</text>` : ''}`;
  const path = (d, color = offense ? orange : cyan, dashed = false, arrow = true) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${dashed ? 'stroke-dasharray="3 2"' : ''} ${arrow ? `marker-end="url(#${marker})"` : ''}/>`;
  const field = `<rect x="1" y="1" width="114" height="56" rx="4" fill="#102522" stroke="#496158"/><path d="M58 2V56 M86 2V56" stroke="#527067" stroke-width=".7" stroke-dasharray="2 3"/>`;
  const defs = `<defs><marker id="${marker}" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="${offense ? orange : cyan}"/></marker></defs>`;
  let routes = '';
  if (offense) {
    const q = dot(18, 29, orange, 'Q');
    const rb = dot(20, 40, orange, 'R');
    const wr1 = dot(18, 12, orange, 'W');
    const wr2 = dot(18, 46, orange, 'W');
    const te = dot(20, 22, gold, 'T');
    const line = `<path d="M24 26h9 M24 30h9 M24 34h9" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
    const map = {
      slants: `${path('M18 12h12l12 12')} ${path('M18 46h12l12-12')} ${path('M20 22h12l7 3', gold)} ${path('M20 40h14l7 5', gold)} ${q}${rb}${wr1}${wr2}${te}${line}`,
      verts: `${path('M18 12H101')} ${path('M18 46H101')} ${path('M20 22H77', gold)} ${path('M20 40H46', gold)} ${q}${rb}${wr1}${wr2}${te}${line}`,
      screen: `${path('M18 12h23v-7', gold, true)} ${path('M18 46h23v51', gold, true)} ${path('M20 40h19l19 10', orange)} ${path('M20 22h12l9 7', gold, true)} ${q}${rb}${wr1}${wr2}${te}${line}`,
      power: `${path('M20 40h13l22 8', orange)} ${path('M24 26h18l8 5', gold)} ${path('M24 30h15l6 6', gold)} ${path('M20 22h18l8-5', gold)} ${q}${rb}${wr1}${wr2}${te}${line}`,
      cross: `${path('M18 12h17l30 34')} ${path('M18 46h17l30-34')} ${path('M20 22h25l10 8', gold)} ${path('M20 40h22l10-4', gold)} ${q}${rb}${wr1}${wr2}${te}${line}`,
      sweep: `${path('M20 40h13l10 12h43')} ${path('M18 12h21l10 8', gold, true)} ${path('M18 46h20l10-8', gold, true)} ${path('M20 22h22l12-7', gold)} ${q}${rb}${wr1}${wr2}${te}${line}`,
      flood: `${path('M18 12h20l20-7')} ${path('M20 22h25l16 13', gold)} ${path('M20 40h25l17 17', gold)} ${path('M18 46h13l11-7', orange, true)} ${q}${rb}${wr1}${wr2}${te}${line}`,
      qbDraw: `${path('M18 12h32', gold, true)} ${path('M18 46h32', gold, true)} ${path('M20 22h24l15 8', gold, true)} ${path('M18 29h23l26 0', orange)} ${path('M20 40h19v-8', gold, true)} ${q}${rb}${wr1}${wr2}${te}${line}`
    };
    routes = map[playId] || map.slants;
  } else {
    const offenseDots = `${dot(20, 12, orange)}${dot(20, 22, orange)}${dot(20, 40, orange)}${dot(20, 46, orange)}`;
    const cb1 = dot(47, 12, cyan, 'C'), cb2 = dot(47, 46, cyan, 'C'), lb = dot(43, 29, cyan, 'L'), safety = dot(88, 29, cyan, 'S');
    const rush1 = path('M47 12L28 12', cyan), rush2 = path('M47 46L28 46', cyan), rushLb = path('M43 29L26 29', cyan);
    const map = {
      man: `${path('M47 12L22 12', cyan)} ${path('M47 46L22 46', cyan)} ${path('M43 29L20 40', cyan)} ${path('M88 29L20 22', cyan, true)} ${offenseDots}${cb1}${cb2}${lb}${safety}`,
      blitz: `${rush1}${rush2}${rushLb} ${path('M88 29L20 22', cyan, true)} ${offenseDots}${cb1}${cb2}${lb}${safety}`,
      zone: `${path('M47 12L55 8', cyan)} ${path('M47 46L55 50', cyan)} ${path('M43 29L53 29', cyan)} ${path('M88 29L75 10', cyan)} ${offenseDots}${cb1}${cb2}${lb}${safety}<rect x="52" y="5" width="20" height="12" fill="none" stroke="${cyan}" stroke-dasharray="2 2" opacity=".5"/><rect x="52" y="40" width="20" height="12" fill="none" stroke="${cyan}" stroke-dasharray="2 2" opacity=".5"/>`,
      cover2: `${path('M47 12L47 6', cyan)} ${path('M47 46L47 52', cyan)} ${path('M43 29L54 34', cyan, true)} ${path('M88 29L80 7', cyan)} ${path('M88 29L80 51', cyan)} ${offenseDots}${cb1}${cb2}${lb}${safety}`,
      spy: `${path('M43 29L32 29', gold, true)} ${path('M47 12L23 12', cyan)} ${path('M47 46L23 46', cyan)} ${path('M88 29L75 29', cyan, true)} ${offenseDots}${cb1}${cb2}${lb}${safety}`,
      prevent: `${path('M47 12L64 5', cyan)} ${path('M47 46L64 53', cyan)} ${path('M43 29L68 29', cyan)} ${path('M88 29L100 29', cyan)} ${offenseDots}${cb1}${cb2}${lb}${safety}`,
      goalLine: `${path('M47 12L28 12', cyan)} ${path('M47 46L28 46', cyan)} ${path('M43 29L26 29', cyan)} ${path('M88 29L36 29', cyan)} ${offenseDots}${cb1}${cb2}${lb}${safety}<path d="M25 4V54" stroke="${gold}" stroke-width="2"/>`,
      bracket: `${path('M47 12L20 12', cyan)} ${path('M47 12L20 22', gold)} ${path('M47 46L35 46', cyan)} ${path('M43 29L28 38', cyan, true)} ${path('M88 29L70 29', cyan)} ${offenseDots}${cb1}${cb2}${lb}${safety}`
    };
    routes = map[playId] || map.man;
  }
  const transform = direction === -1 ? ' transform="translate(116 0) scale(-1 1)"' : '';
  return `<svg viewBox="0 0 116 58" role="img" aria-label="${offense ? 'Offensive' : 'Defensive'} ${playId} route diagram">${defs}<g${transform}>${field}${routes}</g></svg>`;
}

function playInputMap(playerSide) {
  const controls = controlsFor(playerSide);
  const label = key => key.startsWith('arrow') ? ({ arrowup: '↑', arrowright: '→', arrowdown: '↓', arrowleft: '←' }[key] || key) : key.toUpperCase();
  return [
    { keys: [controls.up], label: label(controls.up) },
    { keys: [controls.right], label: label(controls.right) },
    { keys: [controls.down], label: label(controls.down) },
    { keys: [controls.left], label: label(controls.left) },
    { keys: [controls.up, controls.right], label: `${label(controls.up)} + ${label(controls.right)}` },
    { keys: [controls.down, controls.right], label: `${label(controls.down)} + ${label(controls.right)}` },
    { keys: [controls.up, controls.left], label: `${label(controls.up)} + ${label(controls.left)}` },
    { keys: [controls.down, controls.left], label: `${label(controls.down)} + ${label(controls.left)}` }
  ];
}

function isConversionPhase() {
  return state?.phase === 'conversion' || state?.phase === 'conversion-play' || state?.phase === 'conversion-kick';
}

function offenseSideForState() {
  return isConversionPhase() ? state.conversionTeam : state.possession;
}

function playsForPlayer(playerSide) {
  const offense = playerSide === offenseSideForState();
  if (isConversionPhase()) return offense ? conversionOffensePlays : conversionDefensePlays;
  return offense ? offensePlays : defensePlays;
}

function playChoiceMarkup(play, kind, playerSide, index, team) {
  const input = playInputMap(playerSide)[index] || { keys: [], label: '?' };
  const direction = offenseSideForState() === 1 ? -1 : 1;
  const opponent = playerSide === 0 ? state?.away : state?.home;
  const icon = direction === -1 ? play.icon.replace('↗', '↖').replace('↘', '↙').replace('➜', '←') : play.icon;
  const diagram = playDiagram(kind, play.id, { direction, teamColor: team.color, opponentColor: opponent?.color });
  return `<article class="play-choice" data-play="${play.id}" data-kind="${kind}" data-player="${playerSide}" role="group" aria-label="${input.label}: ${play.name}"><div class="play-art">${diagram}</div><div class="play-choice-heading"><kbd class="play-key">${input.label}</kbd><strong>${icon} ${play.name}</strong></div><span>${play.desc}</span></article>`;
}

function setPlayTeamTheme(side, team, playerNumber, role) {
  const column = $(`${side}PlayColumn`);
  column.style.setProperty('--play-team-color', team.color);
  column.style.setProperty('--play-team-dark', team.dark);
  column.classList.toggle('offense-column', role === 'offense');
  column.classList.toggle('defense-column', role === 'defense');
  const selected = Boolean(state?.playSelections?.[playerNumber - 1]);
  column.classList.toggle('player-selected', selected);
  $(`${side}PlayRole`).textContent = role.toUpperCase();
  $(`${side}PlayCallout`).textContent = `${team.name.toUpperCase()} · P${playerNumber}`;
  $(`${side}PlayStatus`).textContent = selected ? ' · SELECTED' : '';
  $(`${side}PlayStatus`).classList.toggle('visible', selected);
}

function renderTeamPlayColumn(side, team, playerNumber, role) {
  setPlayTeamTheme(side, team, playerNumber, role);
  const plays = playsForPlayer(playerNumber - 1);
  $(`${side}PlayChoices`).innerHTML = plays.map((play, index) => playChoiceMarkup(play, role, playerNumber - 1, index, team)).join('');
}

let homeIndex = 0;
let awayIndex = 1;
let state = null;
let keys = new Set();
let playHeldKeys = new Set();
let animationId = null;
let turfPattern = null;
let endZonePattern = null;

function statBar(label, value) {
  return `<div class="stat-item"><span>${label}</span><div class="stat-bar"><i style="width:${value}%"></i></div><b class="stat-value">${value}</b></div>`;
}

function applyTeamLogo(element, team) {
  element.replaceChildren();
  element.setAttribute('aria-label', `${team.name} logo`);
  element.title = team.name;
  element.style.backgroundColor = team.color;
  element.style.backgroundImage = 'none';
  const logo = document.createElement('img');
  logo.src = team.logo;
  logo.alt = `${team.name} logo`;
  logo.decoding = 'async';
  element.appendChild(logo);
}

function renderTeamPicker(side) {
  const isHome = side === 'home';
  const index = isHome ? homeIndex : awayIndex;
  const team = teams[index];
  $(`${side}TeamName`).textContent = team.name;
  applyTeamLogo($(`${side}TeamBadge`), team);
  $(`${side}TeamTabs`).innerHTML = teams.map((item, i) => `<button class="team-tab ${i === index ? 'selected' : ''}" data-side="${side}" data-index="${i}">${item.short}</button>`).join('');
  $(`${side}TeamDetails`).innerHTML = `<p class="team-summary">${team.summary}</p><div class="stat-grid">${statBar('Speed', team.stats.speed)}${statBar('Throw', team.stats.throwPower)}${statBar('Hands', team.stats.hands)}${statBar('Cover', team.stats.cover)}</div>`;
  document.querySelectorAll(`.team-tab[data-side="${side}"]`).forEach(button => button.addEventListener('click', () => {
    const next = Number(button.dataset.index);
    if (side === 'home') {
      homeIndex = next;
      if (homeIndex === awayIndex) awayIndex = (awayIndex + 1) % teams.length;
    } else {
      awayIndex = next;
      if (awayIndex === homeIndex) homeIndex = (homeIndex + 1) % teams.length;
    }
    renderTeamPicker('home');
    renderTeamPicker('away');
  }));
}

function controlsFor(side) {
  return side === 0
    ? { up: 'w', down: 's', left: 'a', right: 'd', action: 'x' }
    : { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', action: ' ' };
}

function keyForSide(side) {
  return controlsFor(side).action;
}

function playDirectionKeys(playerSide) {
  const controls = controlsFor(playerSide);
  return [controls.up, controls.right, controls.down, controls.left];
}

function syncSelectedPlayCalls() {
  if (!state) return;
  const offenseSide = offenseSideForState();
  const defenseSide = 1 - state.possession;
  state.selectedOffense = state.playSelections[offenseSide] || null;
  state.selectedDefense = state.playSelections[defenseSide] || null;
}

function playInputSetMatches(left, right) {
  return left.length === right.length && left.every(key => right.includes(key));
}

function isPlayInputKey(key) {
  return playDirectionKeys(0).concat(playDirectionKeys(1)).includes(key);
}

function choosePlayForPlayer(playerSide, playId) {
  if (!state || !playId || state.playActive || !['play', 'conversion'].includes(state.phase) || state.playSelections[playerSide]) return;
  state.playPendingInputs[playerSide] = null;
  state.playSelections[playerSide] = playId;
  syncSelectedPlayCalls();
  renderPlayOverlay();
}

function playIdForInput(playerSide, input) {
  const plays = playsForPlayer(playerSide);
  const index = playInputMap(playerSide).findIndex(candidate => playInputSetMatches(candidate.keys, input.keys));
  return plays[index]?.id || null;
}

function handlePlaySelectionInput(key) {
  if (!state || !['play', 'conversion'].includes(state.phase) || state.playActive || $('playOverlay').classList.contains('hidden')) return false;
  const playerSide = playDirectionKeys(0).includes(key) ? 0 : playDirectionKeys(1).includes(key) ? 1 : null;
  if (playerSide === null) return false;
  if (state.playSelections[playerSide]) return true;

  const held = playDirectionKeys(playerSide).filter(controlKey => playHeldKeys.has(controlKey));
  const inputMap = playInputMap(playerSide);
  if (held.length >= 2) {
    const chord = inputMap.find(input => input.keys.length === held.length && playInputSetMatches(input.keys, held));
    state.playPendingInputs[playerSide] = null;
    if (chord) choosePlayForPlayer(playerSide, playIdForInput(playerSide, chord));
    return true;
  }

  state.playPendingInputs[playerSide] = key;
  return true;
}

function handlePlaySelectionRelease(key) {
  if (!state || !['play', 'conversion'].includes(state.phase) || state.playActive || $('playOverlay').classList.contains('hidden')) return false;
  const playerSide = playDirectionKeys(0).includes(key) ? 0 : playDirectionKeys(1).includes(key) ? 1 : null;
  if (playerSide === null) return false;
  if (state.playSelections[playerSide]) return true;
  if (state.playPendingInputs[playerSide] !== key) return true;
  state.playPendingInputs[playerSide] = null;
  const single = playInputMap(playerSide).find(input => input.keys.length === 1 && input.keys[0] === key);
  if (single) choosePlayForPlayer(playerSide, playIdForInput(playerSide, single));
  return true;
}

function isRunPlay() {
  return ['power', 'sweep', 'qbDraw', 'twoPointPower', 'twoPointSweep', 'twoPointSneak'].includes(state?.selectedOffense);
}

function playerFacingAtSnap(side) {
  const attackDirection = state?.phase?.startsWith('kickoff') ? (state.kickoffTeam === 0 ? 1 : -1) : (state?.possession === 0 ? 1 : -1);
  return side === state?.possession ? attackDirection : -attackDirection;
}

function makePlayer({ id, role, side, x, y, number }) {
  const appearanceSeed = [...id].reduce((total, character) => total + character.charCodeAt(0), number);
  const skinTones = ['#7d4934', '#a96443', '#c7835f', '#dfaa82', '#f0c19a'];
  const hairTones = ['#1a1514', '#35221a', '#6b3e25', '#9a613b', '#d0a06f'];
  return { id, role, side, x, y, homeX: x, homeY: y, targetX: x, targetY: y, vx: 0, vy: 0, routePhase: 0, routeComplete: false, stride: Math.random() * Math.PI * 2, moving: false, number, action: 0, throwTimer: 0, tackleTimer: 0, tackleRole: '', tackleDir: 1, blocking: false, blockTargetId: null, blockedTimer: 0, assignmentId: null, zoneX: x, zoneY: y, reactionTimer: 0, facing: playerFacingAtSnap(side), skin: skinTones[appearanceSeed % skinTones.length], hair: hairTones[(appearanceSeed * 3) % hairTones.length], visor: appearanceSeed % 7 === 0, build: .92 + (appearanceSeed % 5) * .04, team: side === 0 ? state.home : state.away };
}

function initialState() {
  return {
    home: teams[homeIndex],
    away: teams[awayIndex],
    score: [0, 0],
    quarter: 1,
    clock: QUARTER_LENGTH,
    possession: 0,
    phase: 'kickoff',
    kickoffTeam: 0,
    conversionTeam: null,
    kickoffReturnerId: 'KR',
    kickoffTargetX: 76,
    ballYard: 25,
    down: 1,
    distance: 10,
    selectedOffense: null,
    selectedDefense: null,
    playSelections: [null, null],
    playPendingInputs: [null, null],
    passTargetId: null,
    passAim: 'up',
    playActive: false,
    playTime: 0,
    playStartYard: 25,
    ballCarrier: null,
    defenderId: 'LB1',
    throwCharge: 0,
    throwing: false,
    ball: null,
    players: [],
    tackleSequence: null,
    particles: [],
    message: 'Choose a play to start the drive.',
    note: 'Read the defense, then attack the open lane.',
    resultBannerTimer: 0,
    gameOver: false,
    lastTime: 0
  };
}

function setScreen(screen) {
  document.querySelectorAll('.screen').forEach(element => element.classList.add('hidden'));
  $(screen).classList.remove('hidden');
}

function setupScoreboard() {
  $('scoreHomeName').textContent = state.home.name.toUpperCase();
  $('scoreAwayName').textContent = state.away.name.toUpperCase();
  applyTeamLogo($('scoreHomeBadge'), state.home);
  applyTeamLogo($('scoreAwayBadge'), state.away);
  $('resultHomeName').textContent = state.home.name.toUpperCase();
  $('resultAwayName').textContent = state.away.name.toUpperCase();
  updateHud();
}

function ordinal(value) {
  return value === 1 ? '1ST' : value === 2 ? '2ND' : value === 3 ? '3RD' : '4TH';
}

function updateHud() {
  if (!state) return;
  const minutes = Math.floor(Math.max(0, state.clock) / 60);
  const seconds = Math.max(0, Math.ceil(state.clock) % 60);
  $('clockLabel').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  $('quarterLabel').textContent = state.quarter;
  $('scoreHome').textContent = state.score[0];
  $('scoreAway').textContent = state.score[1];
  $('downLabel').innerHTML = isConversionPhase() ? 'CONV' : state.down > 4 ? 'TURNOVER' : `${ordinal(state.down)} &amp; ${Math.max(1, Math.ceil(state.distance))}`;
  $('ballSpotLabel').textContent = `BALL ON ${Math.round(state.ballYard)}`;
  const possessionTeam = state.possession === 0 ? state.home.name : state.away.name;
  $('possessionHud').textContent = isConversionPhase()
    ? `${possessionTeam} CONVERSION`
    : state.phase === 'kickoff' || state.phase === 'kickoff-flight'
    ? `${possessionTeam} RECEIVES`
    : `${possessionTeam} POSSESSION`;
  $('statusText').textContent = state.message;
  $('matchNote').textContent = state.note;
  $('throwMeterFill').style.width = `${Math.round(state.throwCharge * 100)}%`;
  const action = keyForSide(state.possession);
  if (state.phase === 'kickoff') {
    $('controlText').textContent = `P${state.kickoffTeam + 1}: press ${state.kickoffTeam === 0 ? 'X' : 'SPACE'} to kick off`;
  } else if (state.phase === 'kickoff-flight') {
    $('controlText').textContent = `P${state.possession + 1}: get ready to return with ${state.possession === 0 ? 'W A S D' : 'ARROWS'}`;
  } else if (state.ballCarrier === 'KR') {
    $('controlText').textContent = `P${state.possession + 1}: return with ${state.possession === 0 ? 'W A S D' : 'ARROWS'}`;
  } else if (state.ballCarrier === 'RB') {
    $('controlText').textContent = `P${state.possession + 1}: run the back with ${state.possession === 0 ? 'W A S D' : 'ARROWS'}`;
  } else {
    $('controlText').textContent = `P${state.possession + 1}: move QB with ${state.possession === 0 ? 'W A S D' : 'ARROWS'} · move up/down to aim · hold ${action === ' ' ? 'SPACE' : 'X'} to throw`;
  }
}

function announce(message, note = state.note) {
  state.message = message;
  state.note = note;
  $('announcement').textContent = message;
  updateHud();
}

function yardToX(yard) {
  return PLAYFIELD_LEFT + (PLAYFIELD_RIGHT - PLAYFIELD_LEFT) * clamp(yard, 0, 100) / 100;
}

function laneToY(lane) {
  return FIELD_TOP + (FIELD_BOTTOM - FIELD_TOP) * clamp(lane, 0, 100) / 100;
}

function createFormation() {
  const side = state.possession;
  const direction = side === 0 ? 1 : -1;
  const line = state.ballYard;
  const off = [
    ['QB', 'QB', line - direction * 5, 50, 12],
    ['RB', 'RB', line - direction * 9, 67, 22],
    ['WR1', 'WR', line - direction * 1, 14, 84],
    ['WR2', 'WR', line - direction * 1, 86, 13],
    ['TE', 'TE', line - direction * 3, 32, 88],
    ['C', 'OL', line - direction * 1, 50, 60],
    ['G1', 'OL', line - direction * 2, 42, 64],
    ['G2', 'OL', line - direction * 2, 58, 65]
  ];
  const def = [
    ['DE1', 'DE', line + direction * 3, 28, 91],
    ['DE2', 'DE', line + direction * 3, 72, 92],
    ['LB1', 'LB', line + direction * 5, 42, 55],
    ['LB2', 'LB', line + direction * 5, 58, 56],
    ['CB1', 'CB', line + direction * 4, 14, 21],
    ['CB2', 'CB', line + direction * 4, 86, 23],
    ['S', 'S', line + direction * 14, 50, 31]
  ];
  state.players = [...off.map(([id, role, x, y, number]) => makePlayer({ id, role, side, x, y, number })), ...def.map(([id, role, x, y, number]) => makePlayer({ id, role, side: 1 - side, x, y, number }))];
  state.ballCarrier = ['power', 'sweep'].includes(state.selectedOffense) ? 'RB' : 'QB';
  state.passTargetId = getPassTargetId();
  state.defenderId = state.selectedDefense === 'blitz' ? 'LB1' : 'CB1';
  state.players.forEach(player => setRoute(player));
  assignDefensiveRoles();
}

function createKickoffFormation() {
  const kickingSide = state.kickoffTeam;
  const receivingSide = 1 - kickingSide;
  const direction = kickingSide === 0 ? 1 : -1;
  const kickX = direction === 1 ? 34 : 66;
  const returnX = direction === 1 ? 76 : 24;
  const kickers = [
    ['K', 'K', kickX, 50, 4],
    ['K1', 'DE', kickX - direction * 4, 24, 91],
    ['K2', 'DE', kickX - direction * 4, 76, 92],
    ['K3', 'LB', kickX - direction * 2, 38, 55],
    ['K4', 'LB', kickX - direction * 2, 62, 56],
    ['K5', 'CB', kickX - direction * 5, 14, 21],
    ['K6', 'CB', kickX - direction * 5, 86, 23],
    ['K7', 'S', kickX - direction * 8, 50, 31]
  ];
  const returnTeam = [
    ['KR', 'KR', returnX, 50, 1],
    ['R1', 'OL', returnX - direction * 6, 34, 60],
    ['R2', 'OL', returnX - direction * 6, 66, 64],
    ['R3', 'TE', returnX - direction * 4, 44, 88],
    ['R4', 'TE', returnX - direction * 4, 56, 89],
    ['R5', 'OL', returnX - direction * 9, 50, 65],
    ['R6', 'WR', returnX - direction * 2, 24, 13],
    ['R7', 'WR', returnX - direction * 2, 76, 84]
  ];
  state.possession = receivingSide;
  state.players = [
    ...kickers.map(([id, role, x, y, number]) => makePlayer({ id, role, side: kickingSide, x, y, number })),
    ...returnTeam.map(([id, role, x, y, number]) => makePlayer({ id, role, side: receivingSide, x, y, number }))
  ];
  state.ballCarrier = null;
  state.ball = null;
  state.defenderId = 'K1';
  state.kickoffReturnerId = 'KR';
  state.kickoffTargetX = returnX;
  state.players.forEach(player => {
    player.assignmentId = null;
    player.zoneX = player.homeX;
    player.zoneY = player.homeY;
  });
}

function assignDefensiveRoles() {
  const defenders = state.players.filter(player => player.side !== state.possession);
  const assignments = { CB1: 'WR1', CB2: 'WR2', LB1: 'RB', LB2: 'TE', DE1: 'QB', DE2: 'QB' };
  defenders.forEach(player => {
    player.assignmentId = assignments[player.id] || null;
    player.zoneX = player.homeX;
    player.zoneY = player.homeY;
    player.reactionTimer = .12 + Math.random() * .12;
  });
}

function getPassTargetId() {
  if (state.selectedOffense === 'screen') return 'RB';
  return state.passAim === 'down' ? 'WR2' : 'WR1';
}

function getPassTarget() {
  state.passTargetId = getPassTargetId();
  return state.players.find(player => player.id === state.passTargetId) || null;
}

function setPassAim(aim) {
  if (state.passAim === aim) return;
  state.passAim = aim;
  const previousTarget = state.passTargetId;
  state.passTargetId = getPassTargetId();
  if (state.playActive && !state.ball && previousTarget !== state.passTargetId) {
    const target = getPassTarget();
    state.note = `QB read: ${targetLabel(target)}. Follow the gold target line.`;
    updateHud();
  }
}

function targetLabel(target) {
  if (!target) return 'OPEN RECEIVER';
  return target.id === 'RB' ? 'RB' : target.id;
}

function setRoute(player) {
  const direction = state.possession === 0 ? 1 : -1;
  const previousTarget = `${player.targetX}:${player.targetY}`;
  player.targetX = player.homeX;
  player.targetY = player.homeY;
  const play = state.selectedOffense || 'slants';
  if (player.side === state.possession) {
    if (player.id === 'WR1') {
      player.targetX = player.homeX + direction * (play === 'verts' ? 27 : play === 'slants' ? 13 : play === 'cross' ? 18 : play === 'flood' ? 30 : 8);
      player.targetY = play === 'slants' ? 43 : play === 'cross' ? 86 : play === 'flood' ? 8 : play === 'sweep' ? 7 : play === 'qbDraw' ? 8 : 10;
    } else if (player.id === 'WR2') {
      player.targetX = player.homeX + direction * (play === 'verts' ? 27 : play === 'slants' ? 13 : play === 'cross' ? 18 : play === 'flood' ? 18 : 8);
      player.targetY = play === 'slants' ? 58 : play === 'cross' ? 14 : play === 'flood' ? 40 : play === 'sweep' ? 89 : play === 'qbDraw' ? 92 : 90;
    } else if (player.id === 'TE') {
      player.targetX = player.homeX + direction * (play === 'verts' ? 18 : play === 'power' ? 6 : play === 'cross' ? 18 : play === 'flood' ? 19 : play === 'sweep' ? 8 : 11);
      player.targetY = play === 'screen' ? 30 : play === 'cross' ? 28 : play === 'flood' ? 28 : 33;
    } else if (player.id === 'RB') {
      player.targetX = player.homeX + direction * (play === 'screen' ? 15 : play === 'power' ? 20 : play === 'sweep' ? 30 : play === 'flood' ? 12 : play === 'cross' ? 4 : 3);
      player.targetY = play === 'screen' ? 76 : play === 'sweep' ? 83 : play === 'flood' ? 72 : 66;
    } else if (player.role === 'OL') {
      player.targetX = player.homeX + direction * (play === 'power' ? 8 : play === 'sweep' ? 7 : 3);
      player.targetY = play === 'sweep' ? player.homeY + (player.id === 'G1' ? -8 : 8) : player.homeY;
    }
  }
  if (previousTarget !== `${player.targetX}:${player.targetY}`) player.routeComplete = false;
}

function setupGame() {
  cancelAnimationFrame(animationId);
  state = initialState();
  state.possession = 1;
  state.kickoffTeam = 0;
  setupScoreboard();
  setScreen('gameScreen');
  createKickoffFormation();
  announce('KICKOFF READY.', 'Player 1 kicks off. Player 2 controls the returner after the catch.');
  renderKickoffOverlay();
  animationId = requestAnimationFrame(gameLoop);
}

function renderKickoffOverlay() {
  if (!state || state.gameOver) return;
  const kickingTeam = state.kickoffTeam === 0 ? state.home : state.away;
  const returnTeam = state.possession === 0 ? state.home : state.away;
  setPlayTeamTheme('home', state.home, 1, state.kickoffTeam === 0 ? 'offense' : 'defense');
  setPlayTeamTheme('away', state.away, 2, state.kickoffTeam === 1 ? 'offense' : 'defense');
  $('playOverlay').classList.remove('hidden');
  $('playOverlay').querySelector('h2').textContent = 'Kickoff ready';
  $('possessionLabel').textContent = `${kickingTeam.name.toUpperCase()} KICKING`;
  $('possessionLabel').style.color = kickingTeam.color;
  $('possessionLabel').style.borderColor = kickingTeam.color;
  $('driveSituation').textContent = `KICKOFF · PLAYER ${state.kickoffTeam + 1} KICKS`;
  const kickDirection = state.kickoffTeam === 0 ? 1 : -1;
  const kickChoice = `<div class="play-choice" data-kind="offense"><div class="play-art">${playDiagram('offense', 'verts', { direction: kickDirection, teamColor: kickingTeam.color, opponentColor: returnTeam.color })}</div><strong>${kickDirection === -1 ? '←' : '→'} Kick deep</strong><span>Build power, then send it downfield.</span></div>`;
  const returnChoice = `<div class="play-choice" data-kind="defense"><div class="play-art">${playDiagram('defense', 'prevent', { direction: -kickDirection, teamColor: returnTeam.color, opponentColor: kickingTeam.color })}</div><strong>${kickDirection === 1 ? '←' : '→'} Set up the return</strong><span>Player 2 takes over when the catch is made.</span></div>`;
  $('homePlayChoices').innerHTML = state.kickoffTeam === 0 ? kickChoice : returnChoice;
  $('awayPlayChoices').innerHTML = state.kickoffTeam === 1 ? kickChoice : returnChoice;
  $('playerOneReadyDot').classList.add('ready');
  $('playerTwoReadyDot').classList.add('ready');
  $('playerOneReadyText').textContent = 'P1 ready';
  $('playerTwoReadyText').textContent = 'P2 ready';
  $('revokePlayerOneBtn').classList.add('hidden');
  $('revokePlayerTwoBtn').classList.add('hidden');
  $('snapBtn').disabled = false;
  $('snapBtn').innerHTML = 'KICK OFF <span>↗</span>';
  $('snapBtn').onclick = startKickoff;
}

function renderPlayOverlay() {
  if (!state || state.gameOver) return;
  const offenseSide = offenseSideForState();
  const offenseTeam = offenseSide === 0 ? state.home : state.away;
  const defenseTeam = offenseSide === 0 ? state.away : state.home;
  renderTeamPlayColumn('home', state.home, 1, offenseSide === 0 ? 'offense' : 'defense');
  renderTeamPlayColumn('away', state.away, 2, offenseSide === 1 ? 'offense' : 'defense');
  $('playOverlay').classList.remove('hidden');
  $('playOverlay').querySelector('h2').textContent = isConversionPhase() ? 'Finish the score' : 'Call the next play';
  $('snapBtn').innerHTML = `${isConversionPhase() ? 'RUN CONVERSION' : 'PLAY'} <span>↗</span>`;
  $('possessionLabel').textContent = isConversionPhase() ? `${offenseTeam.name.toUpperCase()} CONVERTING` : `${offenseTeam.name.toUpperCase()} BALL`;
  $('possessionLabel').style.color = offenseTeam.color;
  $('possessionLabel').style.borderColor = offenseTeam.color;
  $('driveSituation').textContent = isConversionPhase() ? 'TOUCHDOWN +6 · CHOOSE 1 OR 2 POINTS' : `${ordinal(state.down)} & ${Math.max(1, Math.ceil(state.distance))} · BALL ON ${Math.round(state.ballYard)}`;
  const playerOneReady = Boolean(state.playSelections[0]);
  const playerTwoReady = Boolean(state.playSelections[1]);
  $('playerOneReadyDot').classList.toggle('ready', playerOneReady);
  $('playerTwoReadyDot').classList.toggle('ready', playerTwoReady);
  $('playerOneReadyText').textContent = playerOneReady ? 'P1 selected' : 'P1 choosing…';
  $('playerTwoReadyText').textContent = playerTwoReady ? 'P2 selected' : 'P2 choosing…';
  $('revokePlayerOneBtn').classList.toggle('hidden', !playerOneReady);
  $('revokePlayerTwoBtn').classList.toggle('hidden', !playerTwoReady);
  $('revokePlayerOneBtn').onclick = () => { state.playSelections[0] = null; syncSelectedPlayCalls(); renderPlayOverlay(); };
  $('revokePlayerTwoBtn').onclick = () => { state.playSelections[1] = null; syncSelectedPlayCalls(); renderPlayOverlay(); };
  $('snapBtn').disabled = !(playerOneReady && playerTwoReady);
  $('snapBtn').onclick = startPlay;
}

function startPlay() {
  if (state.phase === 'conversion') {
    startConversionPlay();
    return;
  }
  if (!state.selectedOffense || !state.selectedDefense || state.playActive) return;
  playHeldKeys.clear();
  state.playActive = true;
  state.playTime = 0;
  state.playStartYard = state.ballYard;
  state.throwCharge = 0;
  state.throwing = false;
  state.ball = null;
  state.phase = 'play';
  state.passAim = 'up';
  createFormation();
  $('playOverlay').classList.add('hidden');
  const offense = offensePlays.find(play => play.id === state.selectedOffense);
  const defense = defensePlays.find(play => play.id === state.selectedDefense);
  const target = getPassTarget();
  const targetText = isRunPlay() ? 'Run look: follow the drawn lane and trust your blockers.' : `QB read: ${targetLabel(target)}. Follow the gold target line.`;
  announce(`${offense.name} · ${defense.name}`, targetText);
}

function createConversionKickFormation() {
  const side = state.conversionTeam;
  const direction = side === 0 ? 1 : -1;
  const goalLine = side === 0 ? RIGHT_GOAL_LINE : LEFT_GOAL_LINE;
  const kickX = goalLine - direction * 9;
  const defenseX = kickX + direction * 5;
  const offense = [
    ['K', 'K', kickX, 50, 4],
    ['LS', 'OL', kickX - direction * 3, 50, 60],
    ['G1', 'OL', kickX - direction * 4, 42, 64],
    ['G2', 'OL', kickX - direction * 4, 58, 65],
    ['TE', 'TE', kickX - direction * 5, 35, 88]
  ];
  const defense = [
    ['DE1', 'DE', defenseX, 34, 91],
    ['DE2', 'DE', defenseX, 66, 92],
    ['LB1', 'LB', defenseX + direction * 2, 44, 55],
    ['LB2', 'LB', defenseX + direction * 2, 56, 56],
    ['S', 'S', defenseX + direction * 7, 50, 31]
  ];
  state.players = [...offense.map(([id, role, x, y, number]) => makePlayer({ id, role, side, x, y, number })), ...defense.map(([id, role, x, y, number]) => makePlayer({ id, role, side: 1 - side, x, y, number }))];
  state.ballCarrier = null;
  state.ball = null;
  state.defenderId = 'LB1';
}

function startConversionPlay() {
  if (!state || state.phase !== 'conversion' || !state.selectedOffense || !state.selectedDefense || state.playActive) return;
  const offense = conversionOffensePlays.find(play => play.id === state.selectedOffense);
  const defense = conversionDefensePlays.find(play => play.id === state.selectedDefense);
  const side = state.conversionTeam;
  const direction = side === 0 ? 1 : -1;
  const goalLine = side === 0 ? RIGHT_GOAL_LINE : LEFT_GOAL_LINE;
  playHeldKeys.clear();
  state.possession = side;
  state.playActive = true;
  state.playTime = 0;
  state.ball = null;
  state.throwCharge = 0;
  state.throwing = false;
  $('playOverlay').classList.add('hidden');
  if (state.selectedOffense === 'xpKick' || state.selectedOffense === 'xpSafeKick') {
    createConversionKickFormation();
    state.phase = 'conversion-kick';
    const kicker = state.players.find(player => player.id === 'K');
    state.ball = { x: kicker.x, y: kicker.y - 2, sx: kicker.x, sy: kicker.y - 2, tx: goalLine + direction * 5, ty: 50, t: 0, duration: 1.2, z: 0, targetId: null, vx: direction * 20, power: true, conversionKick: true };
    announce('EXTRA POINT KICK!', `${offense.name} · ${defense.name}. Watch the ball sail through the uprights.`);
    return;
  }
  state.phase = 'conversion-play';
  state.ballYard = goalLine - direction * 7;
  state.passAim = 'up';
  createFormation();
  announce(`${offense.name} · ${defense.name}`, 'Two points are waiting in the end zone. Drive the runner across the goal line.');
}

function startKickoff() {
  if (!state || state.phase !== 'kickoff' || state.playActive) return;
  playHeldKeys.clear();
  const kicker = state.players.find(player => player.id === 'K');
  const returner = state.players.find(player => player.id === state.kickoffReturnerId);
  if (!kicker || !returner) return;
  const direction = state.kickoffTeam === 0 ? 1 : -1;
  state.phase = 'kickoff-flight';
  state.playActive = true;
  state.playTime = 0;
  state.playStartYard = kicker.x;
  state.ballCarrier = null;
  state.ball = { x: kicker.x, y: kicker.y - 2, sx: kicker.x, sy: kicker.y - 2, tx: state.kickoffTargetX, ty: returner.y, t: 0, duration: 1.15, z: 0, targetId: returner.id, vx: direction * 32, power: true };
  $('playOverlay').classList.add('hidden');
  announce('KICKOFF!', `The ball is in the air. Player ${state.possession + 1} is ready to return it.`);
}

function controlledPlayer() {
  return state.players.find(player => player.id === state.ballCarrier) || state.players.find(player => player.id === 'QB');
}

function controlledDefender() {
  return state.players.find(player => player.id === state.defenderId) || state.players.find(player => player.side !== state.possession);
}

function moveToward(player, targetX, targetY, dt, rate) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const length = Math.hypot(dx, dy);
  const maxSpeed = Math.min(rate, roleSpeed(player));
  if (length <= .55) {
    player.x = targetX;
    player.y = targetY;
    player.vx = 0;
    player.vy = 0;
    player.routeComplete = true;
  } else {
    const brakingSpeed = Math.sqrt(Math.max(0, 2 * 8.5 * length));
    const desiredSpeed = Math.min(maxSpeed, brakingSpeed);
    const desiredVx = dx / length * desiredSpeed;
    const desiredVy = dy / length * desiredSpeed;
    const blend = Math.min(1, dt * 8.5);
    player.vx += (desiredVx - player.vx) * blend;
    player.vy += (desiredVy - player.vy) * blend;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.routeComplete = false;
  }
  player.x = clamp(player.x, 0, 100);
  player.y = clamp(player.y, 5, 95);
}

function roleSpeed(player) {
  const base = { QB: 5.25, RB: 6.8, WR: 7.25, TE: 6.1, OL: 4.15, DE: 5.45, LB: 6.05, CB: 6.9, S: 6.25 }[player.role] || 5.5;
  return base * (.88 + player.team.stats.speed / 100 * .18);
}

function nearestOffense(defender) {
  const offense = state.players.filter(player => player.side === state.possession);
  return offense.reduce((best, player) => Math.hypot(player.x - defender.x, player.y - defender.y) < Math.hypot(best.x - defender.x, best.y - defender.y) ? player : best, offense[0]);
}

function nearestDefender(player, maxDistance = 11) {
  const defenders = state.players.filter(other => other.side !== state.possession);
  if (!defenders.length) return null;
  const closest = defenders.reduce((best, defender) => {
    const distance = Math.hypot(player.x - defender.x, player.y - defender.y);
    return !best || distance < best.distance ? { player: defender, distance } : best;
  }, null);
  return closest.distance <= maxDistance ? closest.player : null;
}

function liveBall() {
  if (state.ball) return { x: state.ball.x, y: state.ball.y, airborne: true, targetId: state.ball.targetId };
  const carrier = state.players.find(player => player.id === state.ballCarrier);
  if (carrier) return { x: carrier.x, y: carrier.y, airborne: false, targetId: carrier.id };
  return { x: state.ballYard, y: 50, airborne: false, targetId: null };
}

function defensiveDecisionTarget(player) {
  const direction = state.possession === 0 ? 1 : -1;
  const ball = liveBall();
  const quarterback = state.players.find(candidate => candidate.id === 'QB');
  const carrier = state.players.find(candidate => candidate.id === state.ballCarrier && candidate.side === state.possession);
  const defenders = state.players.filter(candidate => candidate.side !== state.possession);
  const distanceToBall = Math.hypot(player.x - ball.x, player.y - ball.y);

  if (state.phase === 'kickoff-flight' && ball.airborne) return { x: ball.x, y: ball.y };

  if (carrier) {
    const pursuitOrder = defenders.slice().sort((a, b) => Math.hypot(a.x - carrier.x, a.y - carrier.y) - Math.hypot(b.x - carrier.x, b.y - carrier.y));
    const rank = Math.max(0, pursuitOrder.findIndex(candidate => candidate.id === player.id));
    const scramble = carrier.id === 'QB' && (state.playTime > 2.2 || Math.abs(carrier.x - state.playStartYard) > 5);
    const linebackerRush = player.role === 'LB' && (state.selectedDefense === 'blitz' && player.id === 'LB1' || scramble && state.playTime > 1.8);
    const shouldPursue = carrier.id !== 'QB' || scramble || player.role === 'DE' || linebackerRush || rank < 2 || distanceToBall < 13;
    if (shouldPursue) {
      const leverage = player.id === 'CB1' || player.id === 'LB1' ? -3 : player.id === 'CB2' || player.id === 'LB2' ? 3 : 0;
      return { x: carrier.x - direction * 1.25, y: clamp(carrier.y + leverage, 6, 94) };
    }
  }

  if (ball.airborne) {
    const target = state.players.find(candidate => candidate.id === ball.targetId);
    const targetDistance = target ? Math.hypot(target.x - player.x, target.y - player.y) : Infinity;
    if (player.role === 'S' || player.role === 'CB' || player.assignmentId === ball.targetId || targetDistance < 15) {
      return { x: ball.x, y: ball.y };
    }
  }

  if (state.selectedDefense === 'spy' && player.id === 'LB1') {
    return quarterback ? { x: quarterback.x - direction * 2.2, y: quarterback.y } : { x: player.homeX, y: player.homeY };
  }
  if (state.selectedDefense === 'goalLine') {
    return carrier ? { x: carrier.x - direction * 1.2, y: carrier.y } : { x: player.homeX - direction * 2, y: player.homeY };
  }
  if (state.selectedDefense === 'prevent') {
    if (player.role === 'CB' || player.role === 'S') return { x: player.homeX + direction * 9, y: player.homeY };
    return { x: player.homeX + direction * 2, y: player.homeY };
  }
  if (state.selectedDefense === 'bracket' && (player.id === 'CB1' || player.id === 'LB1')) {
    const star = state.players.find(candidate => candidate.id === 'WR1');
    return star ? { x: star.x - direction * 1.1, y: star.y + (player.id === 'LB1' ? 4 : -4) } : { x: player.homeX, y: player.homeY };
  }
  if (state.selectedDefense === 'blitz' && (player.id === 'LB1' || player.id === 'DE1')) {
    return quarterback ? { x: quarterback.x - direction * 1.3, y: quarterback.y } : { x: player.homeX, y: player.homeY };
  }
  if (player.role === 'DE') {
    return quarterback ? { x: quarterback.x - direction * 1.8, y: player.homeY } : { x: player.homeX, y: player.homeY };
  }

  const assignment = state.players.find(candidate => candidate.id === player.assignmentId && candidate.side === state.possession);
  if (state.selectedDefense === 'man' && assignment) {
    return { x: assignment.x - direction * 1.1, y: assignment.y };
  }
  if ((state.selectedDefense === 'zone' || state.selectedDefense === 'cover2') && assignment && Math.hypot(assignment.x - player.zoneX, assignment.y - player.zoneY) < 10) {
    return { x: assignment.x - direction * 1.1, y: assignment.y };
  }
  if (player.role === 'S') {
    return { x: player.zoneX, y: player.zoneY };
  }
  return { x: player.zoneX, y: player.zoneY };
}

function offensiveSupportTarget(player) {
  const carrier = state.players.find(candidate => candidate.id === state.ballCarrier && candidate.side === state.possession);
  if (!carrier || carrier.id === player.id) return null;
  const needsToBlock = player.role === 'OL' || player.role === 'TE' || player.role === 'RB' || (player.role === 'WR' && carrier.role !== 'QB');
  if (!needsToBlock) return null;
  const threat = nearestDefender(carrier, state.phase === 'kickoff-return' ? 30 : 14);
  if (!threat) return null;
  const direction = state.possession === 0 ? 1 : -1;
  return { threat, x: threat.x - direction * 1.3, y: threat.y };
}

function updatePlayer(player, dt) {
  const controlled = player.id === state.ballCarrier || player.id === state.defenderId;
  const isBallSide = player.side === state.possession;
  const controls = controlsFor(player.side);
  const isUserControlled = controlled && ((isBallSide && player.id === state.ballCarrier) || (!isBallSide && player.id === state.defenderId));
  let dx = 0;
  let dy = 0;
  if (isUserControlled) {
    if (keys.has(controls.left)) dx -= 1;
    if (keys.has(controls.right)) dx += 1;
    if (keys.has(controls.up)) dy -= 1;
    if (keys.has(controls.down)) dy += 1;
  }
  if (isUserControlled && isBallSide && player.id === 'QB' && state.ballCarrier === 'QB' && !state.ball && !isRunPlay()) {
    if (dy < 0) setPassAim('up');
    if (dy > 0) setPassAim('down');
  }
  if (isUserControlled && (dx || dy)) {
    const length = Math.hypot(dx, dy) || 1;
    const speed = roleSpeed(player);
    const desiredVx = dx / length * speed;
    const desiredVy = dy / length * speed;
    const blend = Math.min(1, dt * 10);
    player.vx += (desiredVx - player.vx) * blend;
    player.vy += (desiredVy - player.vy) * blend;
    player.x = clamp(player.x + player.vx * dt, 0, 100);
    player.y = clamp(player.y + player.vy * dt, 5, 95);
  } else if (state.playActive && !isBallSide && isUserControlled) {
    if (player.reactionTimer > 0) {
      player.reactionTimer = Math.max(0, player.reactionTimer - dt);
      player.vx *= Math.pow(.15, dt);
      player.vy *= Math.pow(.15, dt);
    } else {
      const target = defensiveDecisionTarget(player);
      moveToward(player, target.x, target.y, dt, roleSpeed(player) * 1.04);
    }
  } else if (isUserControlled) {
    const drag = Math.pow(.02, dt);
    player.vx *= drag;
    player.vy *= drag;
  } else if (state.playActive) {
    if (isBallSide) {
      if (state.phase === 'kickoff-flight') {
        player.blocking = false;
        player.blockTargetId = null;
        moveToward(player, player.homeX, player.homeY, dt, roleSpeed(player));
      } else {
        const support = offensiveSupportTarget(player);
        const isBlocker = player.role === 'OL' || (player.role === 'TE' && ['power', 'sweep', 'qbDraw'].includes(state.selectedOffense));
        const blockTarget = support?.threat || (isBlocker ? nearestDefender(player, 10) : null);
        if (blockTarget) {
          const direction = state.possession === 0 ? 1 : -1;
          player.blocking = true;
          player.blockTargetId = blockTarget.id;
          moveToward(player, blockTarget.x - direction * 1.3, blockTarget.y, dt, roleSpeed(player));
          if (Math.hypot(player.x - blockTarget.x, player.y - blockTarget.y) < 2.8) {
            blockTarget.blockedTimer = Math.max(blockTarget.blockedTimer, .22);
            blockTarget.vx *= .25;
            blockTarget.vy *= .25;
          }
        } else {
          player.blocking = false;
          player.blockTargetId = null;
          setRoute(player);
          moveToward(player, player.targetX, player.targetY, dt, roleSpeed(player));
        }
      }
    } else {
      if (player.blockedTimer > 0) {
        player.vx *= Math.pow(.01, dt);
        player.vy *= Math.pow(.01, dt);
      } else {
        if (player.reactionTimer > 0) {
          player.reactionTimer = Math.max(0, player.reactionTimer - dt);
        } else {
          const target = defensiveDecisionTarget(player);
          moveToward(player, target.x, target.y, dt, state.selectedDefense === 'blitz' ? roleSpeed(player) * 1.08 : roleSpeed(player));
        }
      }
    }
  }
  player.blockedTimer = Math.max(0, player.blockedTimer - dt);
  if (!player.tackleRole && Math.abs(player.vx) > .28) player.facing = Math.sign(player.vx);
  const movement = Math.hypot(player.vx, player.vy);
  player.moving = movement > 1.2;
  player.stride += dt * (player.moving ? 10 + movement * .22 : 3.5);
  player.action = Math.max(0, player.action - dt);
  player.throwTimer = Math.max(0, player.throwTimer - dt);
  player.tackleTimer = Math.max(0, player.tackleTimer - dt);
}

function launchPass() {
  const qb = state.players.find(player => player.id === 'QB');
  if (!qb || state.ballCarrier !== 'QB') return;
  const direction = state.possession === 0 ? 1 : -1;
  const targetId = getPassTargetId();
  state.passTargetId = targetId;
  const target = state.players.find(player => player.id === targetId) || state.players.find(player => player.side === state.possession && player.role === 'WR');
  const charge = Math.max(.15, state.throwCharge);
  const duration = Math.max(.52, 1.08 - charge * .33);
  state.ballCarrier = null;
  qb.throwTimer = .5;
  qb.action = .5;
  state.ball = { x: qb.x, y: qb.y - 3, sx: qb.x, sy: qb.y - 3, tx: target.targetX, ty: target.targetY, t: 0, duration, z: 0, targetId, vx: direction * (18 + charge * 15), power: charge > .7 };
  state.throwing = false;
  state.throwCharge = 0;
  announce(`${charge > .7 ? 'Deep ball!' : 'Pass in the air!'}`, `Target: ${targetLabel(target)}. Get under it and make the catch.`);
}

function updateBall(dt) {
  if (!state.ball) return;
  const ball = state.ball;
  ball.t += dt;
  const progress = clamp(ball.t / ball.duration, 0, 1);
  ball.x = lerp(ball.sx, ball.tx, progress);
  ball.y = lerp(ball.sy, ball.ty, progress);
  ball.z = Math.sin(progress * Math.PI);
  const receiver = state.players.find(player => player.id === ball.targetId);
  const defender = state.players.filter(player => player.side !== state.possession).find(player => Math.hypot(player.x - ball.x, player.y - ball.y) < 4.2);
  if (receiver && progress > .48 && Math.hypot(receiver.x - ball.x, receiver.y - ball.y) < 6.5) {
    state.ball = null;
    state.ballCarrier = receiver.id;
    if (state.phase === 'kickoff-flight') {
      state.phase = 'kickoff-return';
      state.playTime = 0;
      state.playStartYard = receiver.x;
      state.note = 'Catch made. Follow the blocks and find the crease.';
      announce('KICK RETURN!', state.note);
    } else {
      state.note = 'Catch made. Turn upfield before the defense closes.';
      announce(`${receiver.role === 'RB' ? 'RB' : 'Receiver'} catch!`, state.note);
    }
    return;
  }
  if (defender && progress > .35 && state.selectedDefense !== 'cover2' && state.phase !== 'kickoff-flight' && state.phase !== 'conversion-kick') {
    state.ball = null;
    if (state.phase === 'conversion-play') {
      finishConversion(false);
      return;
    }
    state.ballCarrier = defender.id;
    endPlay('interception', -3);
    return;
  }
  if (progress >= 1) {
    state.ball = null;
    if (state.phase === 'conversion-kick') {
      finishConversion(state.selectedDefense !== 'kickBlock', 'kick');
      return;
    }
    if (state.phase === 'conversion-play') {
      finishConversion(false);
      return;
    }
    if (state.phase === 'kickoff-flight') {
      const returner = state.players.find(player => player.id === state.kickoffReturnerId);
      state.ballCarrier = returner?.id || null;
      state.phase = 'kickoff-return';
      state.playTime = 0;
      state.playStartYard = returner?.x || state.kickoffTargetX;
      announce('KICK RETURN!', 'The return team secured the ball. Find the crease.');
    } else {
      endPlay('incomplete', 0);
    }
  }
}

function tryTackle(side) {
  if (!state || !state.playActive || side === state.possession || state.ballCarrier === null) return;
  const tackler = controlledDefender();
  const runner = controlledPlayer();
  if (tackler && runner && Math.hypot(tackler.x - runner.x, tackler.y - runner.y) < 5.2) {
    const direction = state.possession === 0 ? 1 : -1;
    const type = state.phase === 'kickoff-return' ? 'kickoff-return' : 'tackle';
    startTackleSequence(tackler, runner, Math.round((runner.x - state.playStartYard) * direction), type);
  }
}

function resolveAutomaticTackle() {
  if (state.ballCarrier === null) return;
  const runner = controlledPlayer();
  const defenders = state.players.filter(player => player.side !== state.possession);
  const tackler = defenders.find(player => Math.hypot(player.x - runner.x, player.y - runner.y) < 3.8 && (player.moving || Math.hypot(player.vx, player.vy) > 1.1));
  if (tackler && state.playTime > 1.4) {
    const yards = Math.round((runner.x - state.playStartYard) * (state.possession === 0 ? 1 : -1));
    const type = state.phase === 'kickoff-return' ? 'kickoff-return' : runner.id === 'QB' ? 'sack' : 'tackle';
    startTackleSequence(tackler, runner, yards, type);
  }
}

function startTackleSequence(tackler, runner, yards, type = 'tackle') {
  if (state.tackleSequence || !state.playActive) return;
  const direction = Math.sign(runner.x - tackler.x) || (state.possession === 0 ? 1 : -1);
  const duration = .92;
  const contactX = runner.x - direction * 1.45;
  const contactY = runner.y;
  state.playActive = false;
  state.tackleSequence = { timer: duration, duration, yards, type, direction, tacklerId: tackler.id, runnerId: runner.id, tacklerStartX: tackler.x, tacklerStartY: tackler.y, runnerStartX: runner.x, runnerStartY: runner.y, contactX, contactY };
  tackler.tackleTimer = duration;
  tackler.tackleRole = 'tackler';
  tackler.tackleDir = direction;
  tackler.facing = direction;
  tackler.action = duration;
  runner.tackleTimer = duration;
  runner.tackleRole = 'runner';
  runner.tackleDir = direction;
  runner.facing = direction;
  runner.action = duration;
  spawnImpact(runner.x, runner.y, 14);
  $('resultBannerTitle').textContent = type === 'sack' ? 'SACK!' : type === 'kickoff-return' ? 'RETURN STOPPED' : 'TACKLE!';
  $('resultBannerText').textContent = type === 'sack'
    ? `${Math.min(0, Math.round(yards))} yard loss · QB down`
    : type === 'kickoff-return'
      ? `${Math.max(0, Math.round(yards))} yard return · first down coming`
    : `${Math.max(0, Math.round(yards))} yard gain · runner down`;
  $('resultBanner').classList.remove('hidden');
  announce(type === 'sack' ? 'SACK!' : type === 'kickoff-return' ? 'KICK RETURN STOPPED.' : 'TACKLE!', type === 'sack' ? 'The pocket collapsed before the pass got away.' : type === 'kickoff-return' ? 'The return is over. Set the offense for the first down.' : 'The runner is down. Reset for the next snap.');
}

function updateTackleSequence(dt) {
  if (!state.tackleSequence) return;
  const sequence = state.tackleSequence;
  sequence.timer -= dt;
  const progress = clamp(1 - sequence.timer / sequence.duration, 0, 1);
  const approach = clamp(progress / .58, 0, 1);
  const approachEase = approach * approach * (3 - 2 * approach);
  const hit = clamp((progress - .42) / .58, 0, 1);
  const hitEase = hit * hit * (3 - 2 * hit);
  const tackler = state.players.find(player => player.id === sequence.tacklerId);
  const runner = state.players.find(player => player.id === sequence.runnerId);
  if (tackler) {
    tackler.x = lerp(sequence.tacklerStartX, sequence.contactX, approachEase);
    tackler.y = lerp(sequence.tacklerStartY, sequence.contactY, approachEase);
    tackler.vx = (sequence.contactX - sequence.tacklerStartX) / sequence.duration;
    tackler.vy = (sequence.contactY - sequence.tacklerStartY) / sequence.duration;
  }
  if (runner) {
    runner.x = sequence.runnerStartX + sequence.direction * 1.1 * hitEase;
    runner.y = sequence.runnerStartY + 1.5 * hitEase;
    runner.vx = sequence.direction * 1.1;
    runner.vy = 1.5;
  }
  state.players.forEach(player => { player.tackleTimer = Math.max(0, player.tackleTimer - dt); });
  if (state.tackleSequence.timer <= 0) {
    const yards = state.tackleSequence.yards;
    const type = state.tackleSequence.type;
    state.tackleSequence = null;
    state.players.forEach(player => { player.tackleRole = ''; player.tackleTimer = 0; });
    state.playActive = true;
    if (state.phase === 'conversion-play') finishConversion(false);
    else endPlay(type || 'tackle', yards);
  }
}

function spawnImpact(x, y, count) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({ x, y, vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12, life: .35 + Math.random() * .25, maxLife: .6, size: 1.2 + Math.random() * 2.2, type: 'impact', angle: Math.random() * Math.PI * 2 });
  }
}

function updateEffects(dt) {
  state.particles = state.particles.filter(particle => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 8 * dt;
    return particle.life > 0;
  });
}

function endPlay(reason, yards = 0) {
  if (!state.playActive) return;
  state.playActive = false;
  state.ball = null;
  state.throwing = false;
  state.throwCharge = 0;
  const direction = state.possession === 0 ? 1 : -1;
  const gained = clamp(Math.round(yards), -8, 40);
  if (reason === 'kickoff-return') {
    state.phase = 'play';
    state.ballYard = clamp(state.playStartYard + direction * gained, 5, 95);
    state.down = 1;
    state.distance = 10;
    announce(`KICK RETURN · ${Math.max(0, gained)} YARDS.`, 'First down starts at the return spot.');
    queueNextPlay(800);
    return;
  }
  if (reason === 'interception') {
    announce('INTERCEPTION!', 'The defense takes over with a short field.');
    state.possession = 1 - state.possession;
    state.phase = 'play';
    state.ballYard = clamp(state.playStartYard + direction * gained, 5, 95);
    state.down = 1;
    state.distance = 10;
    queueNextPlay(950);
    return;
  }
  if (reason === 'touchdown') {
    scoreTouchdown(state.possession);
    return;
  }
  state.phase = 'play';
  state.ballYard = clamp(state.playStartYard + direction * gained, 5, 95);
  state.distance -= gained;
  if (state.distance <= 0) {
    state.down = 1;
    state.distance = 10;
    announce(`FIRST DOWN! ${Math.max(0, gained)} yards.`, 'The chains move and the drive stays alive.');
  } else if (state.down >= 4) {
    state.possession = 1 - state.possession;
    state.down = 1;
    state.distance = 10;
    announce('TURNOVER ON DOWNS.', 'The other team takes the field.');
  } else {
    state.down += 1;
    const playMessage = reason === 'incomplete'
      ? 'INCOMPLETE PASS.'
      : reason === 'sack'
        ? `SACK · ${Math.abs(gained)} yard loss.`
        : reason === 'out'
          ? `${Math.max(0, gained)} yard gain · OUT OF BOUNDS.`
          : `${Math.max(0, gained)} yard gain.`;
    announce(playMessage, `${ordinal(state.down)} down is next.`);
  }
  queueNextPlay(650);
}

function finishConversion(success, kind = 'two-point') {
  if (!state || state.conversionTeam === null) return;
  const scoringSide = state.conversionTeam;
  const scoringTeam = scoringSide === 0 ? state.home : state.away;
  const points = success ? (kind === 'kick' ? 1 : 2) : 0;
  state.playActive = false;
  state.ball = null;
  state.throwing = false;
  state.throwCharge = 0;
  state.score[scoringSide] += points;
  state.possession = 1 - scoringSide;
  state.kickoffTeam = scoringSide;
  state.phase = 'kickoff';
  state.ballYard = 50;
  state.down = 1;
  state.distance = 10;
  state.resultBannerTimer = 1.15;
  $('resultBannerTitle').textContent = kind === 'kick'
    ? (success ? 'EXTRA POINT GOOD!' : 'KICK BLOCKED!')
    : (success ? 'CONVERSION GOOD!' : 'CONVERSION STOPPED!');
  $('resultBannerText').textContent = success
    ? `${scoringTeam.name} adds ${points}. Kickoff is next.`
    : 'The defense holds. Kickoff is next.';
  $('resultBanner').classList.remove('hidden');
  announce(success ? `${kind === 'kick' ? 'EXTRA POINT GOOD' : 'TWO-POINT CONVERSION GOOD'}!` : `${kind === 'kick' ? 'KICK BLOCKED' : 'CONVERSION STOPPED'}.`, success ? `${points} more point${points === 1 ? '' : 's'} added before the kickoff.` : 'The defense denied the conversion attempt.');
  state.conversionTeam = null;
  queueNextPlay(1450, 'kickoff');
}

function scoreTouchdown(side) {
  if (state.gameOver) return;
  state.playActive = false;
  state.ball = null;
  state.score[side] += 6;
  state.conversionTeam = side;
  state.possession = side;
  state.kickoffTeam = side;
  state.phase = 'conversion';
  state.ballYard = 50;
  state.down = 1;
  state.distance = 10;
  state.resultBannerTimer = 1.15;
  $('resultBannerTitle').textContent = 'TOUCHDOWN!';
  $('resultBannerText').textContent = `${side === 0 ? state.home.name : state.away.name} scores 6. Choose a 1-point or 2-point conversion.`;
  $('resultBanner').classList.remove('hidden');
  announce(`TOUCHDOWN! ${side === 0 ? state.home.name : state.away.name}.`, 'Six points are on the board. Choose the conversion play.');
  queueNextPlay(1250, 'conversion');
}

function queueNextPlay(delay, nextPhase = 'play') {
  playHeldKeys.clear();
  state.playSelections = [null, null];
  state.playPendingInputs = [null, null];
  state.selectedOffense = null;
  state.selectedDefense = null;
  setTimeout(() => {
    if (!state || state.gameOver) return;
    $('resultBanner').classList.add('hidden');
    state.phase = nextPhase;
    if (nextPhase === 'kickoff') {
      createKickoffFormation();
      renderKickoffOverlay();
    } else {
      createFormation();
      renderPlayOverlay();
    }
  }, delay);
}

function advanceClock(dt) {
  state.clock -= dt;
  if (state.clock > 0) return false;
  state.clock = 0;
  state.playActive = false;
  if (state.quarter >= 4) {
    finishGame();
    return true;
  }
  state.quarter += 1;
  state.clock = QUARTER_LENGTH;
  state.down = 1;
  state.distance = 10;
  announce(`END OF QUARTER · Q${state.quarter}`, 'The next quarter starts with a fresh play call.');
  queueNextPlay(750);
  return true;
}

function updateKickoff(dt) {
  if (advanceClock(dt)) return;
  state.playTime += dt;
  state.players.forEach(player => updatePlayer(player, dt));
  if (state.ball) updateBall(dt);
  if (state.ball || state.phase !== 'kickoff-return') return;
  resolveAutomaticTackle();
  if (!state.playActive) return;
  const runner = controlledPlayer();
  if (!runner) return;
  const goalLine = state.possession === 0 ? RIGHT_GOAL_LINE : LEFT_GOAL_LINE;
  if ((state.possession === 0 && runner.x >= goalLine) || (state.possession === 1 && runner.x <= goalLine)) {
    scoreTouchdown(state.possession);
    return;
  }
  if (runner.y <= 5.2 || runner.y >= 94.8) {
    const yards = Math.round((runner.x - state.playStartYard) * (state.possession === 0 ? 1 : -1));
    endPlay('kickoff-return', yards);
    return;
  }
  if (state.playTime > 8) {
    const yards = Math.round((runner.x - state.playStartYard) * (state.possession === 0 ? 1 : -1));
    endPlay('kickoff-return', yards);
  }
}

function updatePlay(dt) {
  if (advanceClock(dt)) return;
  state.playTime += dt;
  state.players.forEach(player => updatePlayer(player, dt));
  const action = keyForSide(state.possession);
  const qbActive = state.ballCarrier === 'QB' && state.possession === (state.players.find(player => player.id === 'QB')?.side ?? state.possession);
  if (qbActive && !isRunPlay()) {
    if (keys.has(action)) {
      state.throwing = true;
      state.throwCharge = Math.min(1, state.throwCharge + dt / 1.15);
    } else if (state.throwing) {
      launchPass();
    }
  }
  if (state.ball) updateBall(dt);
  resolveAutomaticTackle();
  if (state.playActive && !state.ball) resolveOutOfBounds();
  if (!state.playActive) return;
  const runner = controlledPlayer();
  if (runner && state.ballCarrier !== null) {
    const goalLine = state.possession === 0 ? RIGHT_GOAL_LINE : LEFT_GOAL_LINE;
    if ((state.possession === 0 && runner.x >= goalLine) || (state.possession === 1 && runner.x <= goalLine)) endPlay('touchdown', 100);
  }
  if (state.playActive && state.playTime > 7.8 && state.ballCarrier === 'QB' && !state.ball && !isRunPlay()) endPlay('sack', -1);
}

function updateConversionKick(dt) {
  state.playTime += dt;
  state.players.forEach(player => updatePlayer(player, dt));
  if (state.ball) updateBall(dt);
}

function updateConversionPlay(dt) {
  state.playTime += dt;
  state.players.forEach(player => updatePlayer(player, dt));
  const action = keyForSide(state.possession);
  const qbActive = state.ballCarrier === 'QB' && state.possession === (state.players.find(player => player.id === 'QB')?.side ?? state.possession);
  if (qbActive && !state.ball && !isRunPlay()) {
    if (keys.has(action)) {
      state.throwing = true;
      state.throwCharge = Math.min(1, state.throwCharge + dt / 1.05);
    } else if (state.throwing) {
      launchPass();
    }
  }
  if (state.ball) updateBall(dt);
  resolveAutomaticTackle();
  if (!state.playActive) return;
  const runner = controlledPlayer();
  const direction = state.conversionTeam === 0 ? 1 : -1;
  const goalLine = state.conversionTeam === 0 ? RIGHT_GOAL_LINE : LEFT_GOAL_LINE;
  if (runner && state.ballCarrier !== null && ((direction === 1 && runner.x >= goalLine) || (direction === -1 && runner.x <= goalLine))) {
    finishConversion(true);
    return;
  }
  if (runner && (runner.y <= 5.2 || runner.y >= 94.8) || state.playTime > 5.5) {
    finishConversion(false);
  }
}

function resolveOutOfBounds() {
  const runner = controlledPlayer();
  if (!runner || state.ballCarrier === null || state.playTime < .65) return;
  if (runner.y <= 5.2 || runner.y >= 94.8) {
    const yards = Math.round((runner.x - state.playStartYard) * (state.possession === 0 ? 1 : -1));
    endPlay('out', yards);
  }
}

function getTurfPattern() {
  if (turfPattern) return turfPattern;
  const texture = document.createElement('canvas');
  texture.width = 180;
  texture.height = 96;
  const textureCtx = texture.getContext('2d');
  textureCtx.clearRect(0, 0, texture.width, texture.height);
  for (let i = 0; i < 240; i += 1) {
    const x = (i * 67) % texture.width;
    const y = (i * 41) % texture.height;
    const length = 2 + (i % 4);
    textureCtx.strokeStyle = i % 3 === 0 ? 'rgba(200, 244, 164, .12)' : 'rgba(6, 57, 34, .16)';
    textureCtx.lineWidth = i % 5 === 0 ? 1.2 : .7;
    textureCtx.beginPath();
    textureCtx.moveTo(x, y + 2);
    textureCtx.lineTo(x + (i % 2 ? -1 : 1), y - length);
    textureCtx.stroke();
  }
  turfPattern = ctx.createPattern(texture, 'repeat');
  return turfPattern;
}

function getEndZonePattern() {
  if (endZonePattern) return endZonePattern;
  const texture = document.createElement('canvas');
  texture.width = 36;
  texture.height = 36;
  const textureCtx = texture.getContext('2d');
  textureCtx.strokeStyle = 'rgba(255, 255, 255, .16)';
  textureCtx.lineWidth = 2;
  for (let x = -36; x < 72; x += 12) {
    textureCtx.beginPath();
    textureCtx.moveTo(x, 36);
    textureCtx.lineTo(x + 36, 0);
    textureCtx.stroke();
  }
  endZonePattern = ctx.createPattern(texture, 'repeat');
  return endZonePattern;
}

function drawField() {
  const fieldGradient = ctx.createLinearGradient(0, 0, 0, H);
  fieldGradient.addColorStop(0, '#267645');
  fieldGradient.addColorStop(1, '#174f35');
  const stadiumGradient = ctx.createRadialGradient(W / 2, H * .35, 60, W / 2, H * .45, W * .75);
  stadiumGradient.addColorStop(0, '#142c2a');
  stadiumGradient.addColorStop(.55, '#091817');
  stadiumGradient.addColorStop(1, '#040b0d');
  ctx.fillStyle = stadiumGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = fieldGradient;
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - FIELD_TOP);
  for (let stripe = 0; stripe < 10; stripe += 1) {
    ctx.fillStyle = stripe % 2 ? 'rgba(223, 255, 191, .045)' : 'rgba(0, 42, 28, .045)';
    ctx.fillRect(yardToX(stripe * 10), FIELD_TOP, yardToX((stripe + 1) * 10) - yardToX(stripe * 10), FIELD_BOTTOM - FIELD_TOP);
  }
  ctx.globalAlpha = .85;
  ctx.fillStyle = getTurfPattern();
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - FIELD_TOP);
  ctx.globalAlpha = 1;
  const homeEndZoneGradient = ctx.createLinearGradient(FIELD_LEFT, 0, PLAYFIELD_LEFT, 0);
  homeEndZoneGradient.addColorStop(0, state.home.dark);
  homeEndZoneGradient.addColorStop(1, state.home.color);
  ctx.fillStyle = homeEndZoneGradient;
  ctx.globalAlpha = .78;
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, END_ZONE_WIDTH, FIELD_BOTTOM - FIELD_TOP);
  const awayEndZoneGradient = ctx.createLinearGradient(PLAYFIELD_RIGHT, 0, FIELD_RIGHT, 0);
  awayEndZoneGradient.addColorStop(0, state.away.color);
  awayEndZoneGradient.addColorStop(1, state.away.dark);
  ctx.fillStyle = awayEndZoneGradient;
  ctx.fillRect(PLAYFIELD_RIGHT, FIELD_TOP, END_ZONE_WIDTH, FIELD_BOTTOM - FIELD_TOP);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.globalAlpha = .52;
  ctx.fillStyle = getEndZonePattern();
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, END_ZONE_WIDTH, FIELD_BOTTOM - FIELD_TOP);
  ctx.fillRect(PLAYFIELD_RIGHT, FIELD_TOP, END_ZONE_WIDTH, FIELD_BOTTOM - FIELD_TOP);
  ctx.restore();
  ctx.fillStyle = 'rgba(235, 255, 213, .22)';
  ctx.fillRect(FIELD_LEFT - 8, FIELD_TOP, 6, FIELD_BOTTOM - FIELD_TOP);
  ctx.fillRect(FIELD_RIGHT + 2, FIELD_TOP, 6, FIELD_BOTTOM - FIELD_TOP);
  ctx.strokeStyle = 'rgba(245, 250, 224, .82)';
  ctx.lineWidth = 2;
  for (let yard = 0; yard <= 100; yard += 5) {
    const x = yardToX(yard);
    ctx.beginPath(); ctx.moveTo(x, FIELD_TOP); ctx.lineTo(x, FIELD_BOTTOM); ctx.stroke();
    if (yard % 10 === 0 && yard > 0 && yard < 100) {
      ctx.fillStyle = 'rgba(245,250,224,.65)';
      ctx.font = '800 27px Barlow Condensed, sans-serif';
      ctx.textAlign = 'center';
      const number = yard <= 50 ? yard : 100 - yard;
      ctx.fillText(number, x, FIELD_TOP + 48);
      ctx.fillText(number, x, FIELD_BOTTOM - 24);
    }
  }
  for (let yard = 5; yard < 100; yard += 5) {
    const x = yardToX(yard);
    ctx.fillStyle = 'rgba(245,250,224,.65)';
    for (const lane of [34, 50, 66]) {
      const y = laneToY(lane);
      ctx.fillRect(x - 1, y - 10, 2, 20);
    }
  }
  ctx.strokeStyle = '#f4f5df';
  ctx.lineWidth = 5;
  ctx.strokeRect(FIELD_LEFT, FIELD_TOP, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - FIELD_TOP);
  ctx.strokeStyle = 'rgba(255, 245, 190, .98)';
  ctx.lineWidth = 4;
  [LEFT_GOAL_LINE, RIGHT_GOAL_LINE].forEach(yard => {
    const x = yardToX(yard);
    ctx.beginPath(); ctx.moveTo(x, FIELD_TOP); ctx.lineTo(x, FIELD_BOTTOM); ctx.stroke();
  });
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '800 11px DM Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.home.short, FIELD_LEFT + END_ZONE_WIDTH / 2, FIELD_TOP + 118);
  ctx.fillText(state.away.short, PLAYFIELD_RIGHT + END_ZONE_WIDTH / 2, FIELD_TOP + 118);
  if (state.players.length) drawRoutes();
  drawPassPrediction();
  if (state.playActive || state.selectedOffense) {
    ctx.strokeStyle = 'rgba(255,213,80,.95)';
    ctx.lineWidth = 3;
    const line = yardToX(state.ballYard);
    ctx.beginPath(); ctx.moveTo(line, FIELD_TOP); ctx.lineTo(line, FIELD_BOTTOM); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,136,64,.95)';
    const gain = state.possession === 0 ? state.ballYard + state.distance : state.ballYard - state.distance;
    const toGain = yardToX(clamp(gain, 0, 100));
    ctx.beginPath(); ctx.moveTo(toGain, FIELD_TOP); ctx.lineTo(toGain, FIELD_BOTTOM); ctx.stroke();
  }
}

function drawPassPrediction() {
  if (!state.playActive || isRunPlay() || !state.players.length) return;
  const qb = state.players.find(player => player.id === 'QB');
  const target = getPassTarget();
  if (!qb || !target) return;
  const startX = yardToX(qb.x);
  const startY = laneToY(qb.y - 2);
  const targetX = yardToX(target.targetX);
  const targetY = laneToY(target.targetY);
  const pulse = 1 + Math.sin(performance.now() / 150) * .08;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 213, 80, .96)';
  ctx.fillStyle = 'rgba(255, 213, 80, .98)';
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 7]);
  ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(targetX, targetY); ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(targetY - startY, targetX - startX);
  ctx.beginPath();
  ctx.moveTo(targetX, targetY);
  ctx.lineTo(targetX - Math.cos(angle - .5) * 13, targetY - Math.sin(angle - .5) * 13);
  ctx.lineTo(targetX - Math.cos(angle + .5) * 13, targetY - Math.sin(angle + .5) * 13);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 243, 196, .95)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(targetX, targetY, 19 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.font = '900 13px DM Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`TARGET ${targetLabel(target)}`, (startX + targetX) / 2, (startY + targetY) / 2 - 12);
  ctx.restore();
}

function drawRoutes() {
  if (state.playActive || !state.selectedOffense) return;
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = 'rgba(255,255,255,.72)';
  ctx.lineWidth = 2;
  state.players.filter(player => player.side === state.possession && ['WR', 'TE', 'RB'].includes(player.role)).forEach(player => {
    setRoute(player);
    ctx.beginPath(); ctx.moveTo(yardToX(player.homeX), laneToY(player.homeY)); ctx.lineTo(yardToX(player.targetX), laneToY(player.targetY)); ctx.stroke();
  });
  ctx.restore();
}

function drawPlayer(player) {
  const x = yardToX(player.x);
  const y = laneToY(player.y);
  const active = player.id === state.ballCarrier || player.id === state.defenderId;
  const running = player.moving && !player.tackleRole;
  const stride = running ? Math.sin(player.stride) : 0;
  const strideBack = running ? Math.sin(player.stride + Math.PI) : 0;
  const tackleDuration = state.tackleSequence?.duration || .92;
  const tackleProgress = player.tackleTimer > 0 ? 1 - player.tackleTimer / tackleDuration : 0;
  const tackleEase = tackleProgress * tackleProgress * (3 - 2 * tackleProgress);
  const throwProgress = player.throwTimer > 0 ? 1 - player.throwTimer / .5 : 0;
  const isRunnerTackled = player.tackleRole === 'runner';
  const isTackler = player.tackleRole === 'tackler';
  const facing = player.facing || playerFacingAtSnap(player.side);
  const bodyScale = (player.build || 1) * 1.08;
  const uniform = player.team.color;
  const uniformDark = player.team.dark;
  const skin = player.skin || '#c7835f';
  const hair = player.hair || '#35221a';
  const legLift = isRunnerTackled ? -4 : stride * 8;
  const legLiftBack = isRunnerTackled ? 4 : strideBack * 8;
  const armSwing = isRunnerTackled ? 0 : strideBack * 7;
  const drawLimb = (points, width = 6, color = skin) => {
    ctx.strokeStyle = '#080e13';
    ctx.lineWidth = width + 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
    ctx.stroke();
  };
  ctx.save();
  ctx.translate(x, y);
  if (isRunnerTackled) {
    ctx.translate(player.tackleDir * tackleEase * 10, tackleEase * 15);
    ctx.rotate(player.tackleDir * tackleEase * 1.16);
  } else if (isTackler) {
    ctx.translate(player.tackleDir * tackleEase * 7, -tackleEase * 3);
    ctx.rotate(-player.tackleDir * tackleEase * .48);
  }
  ctx.scale(facing, 1);
  ctx.scale(bodyScale, bodyScale);
  if (active) {
    ctx.strokeStyle = 'rgba(255, 243, 184, .88)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(0, -4, 28 + Math.sin(performance.now() / 180) * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  const shadowGradient = ctx.createRadialGradient(0, 16, 2, 0, 16, 23);
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, .48)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGradient;
  ctx.save();
  ctx.scale(1 + (isRunnerTackled ? tackleEase * .4 : 0), 1);
  ctx.beginPath(); ctx.ellipse(0, 17, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  if (running && !isRunnerTackled && !isTackler) {
    ctx.globalAlpha = .18;
    ctx.strokeStyle = uniform;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(-24 - i * 4, -5 + i * 4); ctx.lineTo(-34 - i * 5, -5 + i * 4); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const pantsGradient = ctx.createLinearGradient(-10, 2, 10, 22);
  pantsGradient.addColorStop(0, '#fffdf2');
  pantsGradient.addColorStop(.55, '#d8e0dc');
  pantsGradient.addColorStop(1, '#87959a');
  const drawLeg = (side, lift) => {
    ctx.save();
    ctx.translate(side * 7, 6);
    ctx.rotate(lift * .045);
    ctx.fillStyle = '#080e13';
    ctx.beginPath(); ctx.roundRect(-7, -2, 14, 16, 4); ctx.fill();
    ctx.fillStyle = pantsGradient;
    ctx.beginPath(); ctx.roundRect(-5, 0, 10, 13, 3); ctx.fill();
    ctx.fillStyle = uniform;
    ctx.fillRect(-5, 7, 10, 2);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.roundRect(-4, 10, 8, 8, 3); ctx.fill();
    ctx.fillStyle = '#f3f0d9';
    ctx.fillRect(-4, 10, 8, 3);
    ctx.fillStyle = '#111a21';
    ctx.beginPath(); ctx.ellipse(side * 2, 18, 8, 3.5, side * .08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dbe7dc';
    ctx.fillRect(side * 2 - 4, 17, 4, 1.5);
    ctx.restore();
  };
  drawLeg(-1, legLift);
  drawLeg(1, legLiftBack);

  // Shoulder pads and jersey give the silhouette a readable football shape.
  const jerseyGradient = ctx.createLinearGradient(-17, -17, 18, 14);
  jerseyGradient.addColorStop(0, '#ffffff');
  jerseyGradient.addColorStop(.08, uniform);
  jerseyGradient.addColorStop(.58, uniform);
  jerseyGradient.addColorStop(1, uniformDark);
  ctx.fillStyle = 'rgba(7,14,18,.6)';
  ctx.beginPath(); ctx.ellipse(-15, -8, 9, 7, -.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(15, -8, 9, 7, .2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = jerseyGradient;
  ctx.strokeStyle = '#101a1f';
  ctx.lineWidth = 1.5;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-16, -16, 32, 30, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.ellipse(-12, -10, 6, 7, -.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(12, -10, 6, 7, .35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(7,14,18,.18)';
  ctx.fillRect(-14, 5, 28, 5);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillRect(-12, -13, 4, 2);
  ctx.fillRect(8, -13, 4, 2);
  ctx.strokeStyle = 'rgba(255,255,255,.38)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-5, -9); ctx.lineTo(0, -7); ctx.lineTo(5, -9); ctx.lineTo(8, -14); ctx.stroke();
  ctx.strokeStyle = 'rgba(8,14,19,.72)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-6, -10); ctx.lineTo(0, -8); ctx.lineTo(6, -10); ctx.lineTo(10, -14); ctx.stroke();

  if (isTackler) {
    drawLimb([[-12, -8], [-4, -2], [13 + tackleEase * 13, 2 + tackleEase * 5]], 7);
    drawLimb([[12, -8], [7, 0], [20 + tackleEase * 10, 8 + tackleEase * 6]], 7);
    ctx.fillStyle = '#f1f5e8';
    ctx.beginPath(); ctx.arc(13 + tackleEase * 13, 2 + tackleEase * 5, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20 + tackleEase * 10, 8 + tackleEase * 6, 3.2, 0, Math.PI * 2); ctx.fill();
  } else if (isRunnerTackled) {
    drawLimb([[-12, -8], [-18, -15 + tackleEase * 10], [-24, -20 + tackleEase * 16]], 7);
    drawLimb([[12, -8], [19, -13 + tackleEase * 12], [25, -8 + tackleEase * 16]], 7);
  } else if (player.id === 'QB' && (state.throwing || player.throwTimer > 0)) {
    const followThrough = player.throwTimer > 0 ? throwProgress : state.throwCharge;
    drawLimb([[-12, -8], [-18 + followThrough * 24, -16 + followThrough * 20], [-22 + followThrough * 27, -11 + followThrough * 18]], 7);
    drawLimb([[12, -8], [18 + followThrough * 8, -2 + followThrough * 8], [23 + followThrough * 8, 2 + followThrough * 7]], 7);
  } else {
    drawLimb([[-13, -8], [-18, -1 + armSwing * .35], [-20 - armSwing, 3 + armSwing * .35]], 6.5);
    drawLimb([[13, -8], [18, -1 - armSwing * .35], [20 + armSwing, 3 - armSwing * .35]], 6.5);
    ctx.fillStyle = '#f1f5e8';
    ctx.beginPath(); ctx.arc(-20 - armSwing, 3 + armSwing * .35, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20 + armSwing, 3 - armSwing * .35, 3.2, 0, Math.PI * 2); ctx.fill();
  }

  // Jersey number, collar and side stripe add material detail at game scale.
  ctx.fillStyle = '#f3f0d9';
  ctx.font = '900 11px Barlow Condensed, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 2;
  ctx.fillText(player.number, 0, 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.66)';
  ctx.fillRect(-13, 0, 2, 7);
  ctx.fillRect(11, 0, 2, 7);

  // Exposed face, hair, helmet shell and facemask turn with the player.
  ctx.fillStyle = skin;
  ctx.strokeStyle = '#080e13';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-10, -31, 20, 17, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = player.hair || hair;
  ctx.beginPath(); ctx.arc(-1, -29, 9, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.arc(-5, -29, 3, Math.PI * 1.05, Math.PI * 1.75); ctx.fill();
  ctx.fillStyle = uniformDark;
  ctx.strokeStyle = '#080e13';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, -30, 15, 11, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = uniform;
  ctx.beginPath(); ctx.arc(0, -31, 12, Math.PI + .12, -.12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.fillRect(-8, -38, 6, 2.5);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(9.5, -23, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#171718';
  ctx.beginPath(); ctx.arc(3.2, -25, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7.2, -25, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = hair;
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(2, -27.5); ctx.lineTo(4.5, -28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -28); ctx.lineTo(8.5, -27.5); ctx.stroke();
  ctx.fillStyle = '#351c1a';
  ctx.fillRect(4.5, -19.5, 5, 1.1);
  if (player.visor) {
    ctx.fillStyle = 'rgba(34,56,72,.72)';
    ctx.beginPath(); ctx.roundRect(4, -26, 7, 4, 1.5); ctx.fill();
  }
  ctx.strokeStyle = '#080e13';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(8, -24); ctx.lineTo(16, -21); ctx.lineTo(9, -15); ctx.stroke();
  ctx.strokeStyle = '#c5ced0';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(8, -24); ctx.lineTo(16, -21); ctx.lineTo(9, -15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -21); ctx.lineTo(16, -21); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(16, -18); ctx.stroke();

  if (isTackler) {
    ctx.strokeStyle = 'rgba(255, 241, 186, .78)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(8, -1, 20 + tackleEase * 9, -.9, .9); ctx.stroke();
  }
  if (player.id === state.ballCarrier && !state.ball) drawMiniBall(19, -5, 1);
  ctx.restore();
}

function drawMiniBall(x, y, direction) {
  ctx.save(); ctx.translate(x * direction, y); ctx.rotate(direction * .35); ctx.fillStyle = '#8b4b28'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f7d9a0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.stroke(); ctx.restore();
}

function drawBall() {
  if (!state.ball) return;
  const ball = state.ball;
  const x = yardToX(ball.x);
  const y = laneToY(ball.y) - ball.z * 70;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(ball.ty - ball.y, ball.tx - ball.x) * .35);
  if (ball.power) { ctx.shadowColor = '#ffd45c'; ctx.shadowBlur = 18; }
  ctx.fillStyle = '#8b4b28'; ctx.strokeStyle = '#4b291e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#f7d9a0'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
  for (let i = -3; i <= 3; i += 3) { ctx.beginPath(); ctx.moveTo(i, -3); ctx.lineTo(i, 3); ctx.stroke(); }
  ctx.restore();
}

function drawEffects() {
  state.particles.forEach(particle => {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    const x = yardToX(particle.x);
    const y = laneToY(particle.y);
    ctx.globalAlpha = alpha;
    if (particle.type === 'impact') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(particle.angle);
      ctx.strokeStyle = '#fff1bd';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(9 + (1 - alpha) * 8, 0); ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = '#fff1bd';
      ctx.beginPath(); ctx.arc(x, y, particle.size, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

function drawScene() {
  drawField();
  drawEffects();
  state.players.forEach(drawPlayer);
  drawBall();
}

function gameLoop(now) {
  if (!state) return;
  const dt = Math.min(.04, (now - (state.lastTime || now)) / 1000 || 0);
  state.lastTime = now;
  if (!state.gameOver) {
    updateEffects(dt);
    if (state.tackleSequence) updateTackleSequence(dt);
    else if (state.playActive && (state.phase === 'kickoff-flight' || state.phase === 'kickoff-return')) updateKickoff(dt);
    else if (state.playActive && state.phase === 'conversion-kick') updateConversionKick(dt);
    else if (state.playActive && state.phase === 'conversion-play') updateConversionPlay(dt);
    else if (state.playActive) updatePlay(dt);
  }
  drawScene();
  if (!state.gameOver) animationId = requestAnimationFrame(gameLoop);
}

function finishGame() {
  state.gameOver = true;
  const title = state.score[0] === state.score[1] ? 'Dead even.' : `${state.score[0] > state.score[1] ? state.home.name : state.away.name} wins.`;
  $('resultTitle').textContent = title;
  $('resultSummary').textContent = `Final after four quarters · ${state.home.name} ${state.score[0]} — ${state.score[1]} ${state.away.name}`;
  $('resultHomeScore').textContent = state.score[0];
  $('resultAwayScore').textContent = state.score[1];
  setScreen('resultScreen');
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function normalizePlayKey(event) {
  const codeMap = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'arrowup', ArrowRight: 'arrowright', ArrowDown: 'arrowdown', ArrowLeft: 'arrowleft' };
  const rawKey = typeof event.key === 'string' ? event.key.toLowerCase() : '';
  return codeMap[event.code] || rawKey;
}

window.addEventListener('keydown', event => {
  const key = normalizePlayKey(event);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (event.repeat) return;
  keys.add(key);
  if (!state) return;
  const playWindowOpen = state.phase === 'play' && !state.playActive && !$('playOverlay').classList.contains('hidden');
  if (playWindowOpen && isPlayInputKey(key)) {
    playHeldKeys.add(key);
  }
  if (handlePlaySelectionInput(key)) {
    event.preventDefault();
    return;
  }
  if (state.playActive && state.ballCarrier === 'QB' && !state.ball && !isRunPlay()) {
    const qbControls = controlsFor(state.possession);
    if (key === qbControls.up) setPassAim('up');
    if (key === qbControls.down) setPassAim('down');
  }
  if (state.phase === 'kickoff' && key === keyForSide(state.kickoffTeam)) {
    startKickoff();
    return;
  }
  if (!state.playActive) return;
  if (key === keyForSide(0) || key === keyForSide(1)) {
    const side = key === keyForSide(0) ? 0 : 1;
    if (side !== state.possession) tryTackle(side);
  }
});

window.addEventListener('keyup', event => {
  const key = normalizePlayKey(event);
  handlePlaySelectionRelease(key);
  keys.delete(key);
  playHeldKeys.delete(key);
});

$('startGameBtn').addEventListener('click', setupGame);
$('resetGameBtn').addEventListener('click', () => { cancelAnimationFrame(animationId); state = null; setScreen('setupScreen'); });
$('rematchBtn').addEventListener('click', () => { renderTeamPicker('home'); renderTeamPicker('away'); setScreen('setupScreen'); });

renderTeamPicker('home');
renderTeamPicker('away');
