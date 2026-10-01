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

const teams = [
  { id: 'hawks', name: 'Harbor Hawks', short: 'HH', color: '#ff714b', dark: '#8b302b', summary: 'Fast receivers and a mobile quarterback attack every blade of grass.', stats: { speed: 90, throwPower: 72, hands: 75, cover: 76 } },
  { id: 'comets', name: 'Metro Comets', short: 'MC', color: '#68d5d5', dark: '#246b6e', summary: 'A disciplined secondary and a strong arm punish predictable reads.', stats: { speed: 78, throwPower: 88, hands: 84, cover: 88 } },
  { id: 'mustangs', name: 'Mesa Mustangs', short: 'MM', color: '#e6ba58', dark: '#806324', summary: 'Heavy blockers and a bruising back make the power game dangerous.', stats: { speed: 72, throwPower: 80, hands: 76, cover: 69 } },
  { id: 'tides', name: 'Cobalt Tides', short: 'CT', color: '#8f89ff', dark: '#393676', summary: 'Creative route runners create space, but the line gives up pressure.', stats: { speed: 84, throwPower: 78, hands: 82, cover: 80 } }
];

const offensePlays = [
  { id: 'slants', name: 'Quick Slants', desc: 'Fast in-breakers · hot read', icon: '↗' },
  { id: 'verts', name: 'Four Verts', desc: 'Stretch the safeties', icon: '↑' },
  { id: 'screen', name: 'RB Screen', desc: 'Let the rush come', icon: '↘' },
  { id: 'power', name: 'Power Run', desc: 'Follow the pulling guard', icon: '●' }
];

const defensePlays = [
  { id: 'man', name: 'Lock Man', desc: 'Mirror every route', icon: '◎' },
  { id: 'blitz', name: 'Standard Blitz', desc: 'Bring four with heat', icon: '⚡' },
  { id: 'zone', name: 'Zone Blitz', desc: 'Rotate & pressure', icon: '◇' },
  { id: 'cover2', name: 'Cover 2', desc: 'Protect the deep ball', icon: '△' }
];

let homeIndex = 0;
let awayIndex = 1;
let state = null;
let keys = new Set();
let animationId = null;

function statBar(label, value) {
  return `<div class="stat-item"><span>${label}</span><div class="stat-bar"><i style="width:${value}%"></i></div><b class="stat-value">${value}</b></div>`;
}

function renderTeamPicker(side) {
  const isHome = side === 'home';
  const index = isHome ? homeIndex : awayIndex;
  const team = teams[index];
  $(`${side}TeamName`).textContent = team.name;
  $(`${side}TeamBadge`).textContent = team.short;
  $(`${side}TeamBadge`).style.background = team.color;
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

function makePlayer({ id, role, side, x, y, number }) {
  return { id, role, side, x, y, homeX: x, homeY: y, targetX: x, targetY: y, vx: 0, vy: 0, routePhase: 0, routeComplete: false, stride: Math.random() * Math.PI * 2, moving: false, number, action: 0, tackleTimer: 0, tackleRole: '', tackleDir: 1, blocking: false, blockTargetId: null, blockedTimer: 0, assignmentId: null, zoneX: x, zoneY: y, reactionTimer: 0, team: side === 0 ? state.home : state.away };
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
    kickoffReturnerId: 'KR',
    kickoffTargetX: 76,
    ballYard: 25,
    down: 1,
    distance: 10,
    selectedOffense: null,
    selectedDefense: null,
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
  $('scoreHomeBadge').textContent = state.home.short;
  $('scoreAwayBadge').textContent = state.away.short;
  $('scoreHomeBadge').style.background = state.home.color;
  $('scoreAwayBadge').style.background = state.away.color;
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
  $('downLabel').innerHTML = state.down > 4 ? 'TURNOVER' : `${ordinal(state.down)} &amp; ${Math.max(1, Math.ceil(state.distance))}`;
  $('ballSpotLabel').textContent = `BALL ON ${Math.round(state.ballYard)}`;
  const possessionTeam = state.possession === 0 ? state.home.name : state.away.name;
  $('possessionHud').textContent = state.phase === 'kickoff' || state.phase === 'kickoff-flight'
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
  return FIELD_LEFT + (FIELD_RIGHT - FIELD_LEFT) * clamp(yard, 0, 100) / 100;
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
  state.ballCarrier = state.selectedOffense === 'power' ? 'RB' : 'QB';
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
      player.targetX = player.homeX + direction * (play === 'verts' ? 27 : play === 'slants' ? 13 : 8);
      player.targetY = play === 'slants' ? 43 : 10;
    } else if (player.id === 'WR2') {
      player.targetX = player.homeX + direction * (play === 'verts' ? 27 : play === 'slants' ? 13 : 8);
      player.targetY = play === 'slants' ? 58 : 90;
    } else if (player.id === 'TE') {
      player.targetX = player.homeX + direction * (play === 'verts' ? 18 : play === 'power' ? 6 : 11);
      player.targetY = play === 'screen' ? 30 : 33;
    } else if (player.id === 'RB') {
      player.targetX = player.homeX + direction * (play === 'screen' ? 15 : play === 'power' ? 20 : 5);
      player.targetY = play === 'screen' ? 76 : 66;
    } else if (player.role === 'OL') {
      player.targetX = player.homeX + direction * (play === 'power' ? 8 : 3);
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
  $('playOverlay').classList.remove('hidden');
  $('possessionLabel').textContent = 'KICKOFF';
  $('offenseCallout').textContent = `PLAYER ${state.kickoffTeam + 1} · KICKER`;
  $('defenseCallout').textContent = `PLAYER ${state.possession + 1} · RETURN TEAM`;
  $('driveSituation').textContent = `KICKOFF · PLAYER ${state.kickoffTeam + 1} KICKS`;
  $('offensePlayChoices').innerHTML = '<div class="play-choice selected offense"><strong>↗ Kick deep</strong><span>Build power, then send it downfield.</span></div>';
  $('defensePlayChoices').innerHTML = '<div class="play-choice selected defense"><strong>↘ Set up the return</strong><span>Player 2 takes over when the catch is made.</span></div>';
  $('offenseReadyDot').classList.add('ready');
  $('defenseReadyDot').classList.add('ready');
  $('offenseReadyText').textContent = 'Kicker ready';
  $('defenseReadyText').textContent = 'Returner ready';
  $('snapBtn').disabled = false;
  $('snapBtn').innerHTML = 'KICK OFF <span>↗</span>';
  $('snapBtn').onclick = startKickoff;
}

function renderPlayOverlay() {
  if (!state || state.gameOver) return;
  $('playOverlay').classList.remove('hidden');
  $('snapBtn').innerHTML = 'SNAP IT <span>↗</span>';
  $('possessionLabel').textContent = `${state.possession === 0 ? 'HOME' : 'AWAY'} BALL`;
  $('offenseCallout').textContent = `PLAYER ${state.possession + 1}`;
  $('defenseCallout').textContent = `PLAYER ${2 - state.possession}`;
  $('driveSituation').textContent = `${ordinal(state.down)} & ${Math.max(1, Math.ceil(state.distance))} · BALL ON ${Math.round(state.ballYard)}`;
  $('offensePlayChoices').innerHTML = offensePlays.map(play => `<button class="play-choice ${state.selectedOffense === play.id ? 'selected offense' : ''}" data-play="${play.id}"><strong>${play.icon} ${play.name}</strong><span>${play.desc}</span></button>`).join('');
  $('defensePlayChoices').innerHTML = defensePlays.map(play => `<button class="play-choice ${state.selectedDefense === play.id ? 'selected defense' : ''}" data-play="${play.id}"><strong>${play.icon} ${play.name}</strong><span>${play.desc}</span></button>`).join('');
  document.querySelectorAll('#offensePlayChoices .play-choice').forEach(button => button.addEventListener('click', () => { state.selectedOffense = button.dataset.play; createFormation(); renderPlayOverlay(); }));
  document.querySelectorAll('#defensePlayChoices .play-choice').forEach(button => button.addEventListener('click', () => { state.selectedDefense = button.dataset.play; createFormation(); renderPlayOverlay(); }));
  const offenseReady = Boolean(state.selectedOffense);
  const defenseReady = Boolean(state.selectedDefense);
  $('offenseReadyDot').classList.toggle('ready', offenseReady);
  $('defenseReadyDot').classList.toggle('ready', defenseReady);
  $('offenseReadyText').textContent = offenseReady ? 'Offense locked in' : 'Offense choosing…';
  $('defenseReadyText').textContent = defenseReady ? 'Defense locked in' : 'Defense choosing…';
  $('snapBtn').disabled = !(offenseReady && defenseReady);
  $('snapBtn').onclick = startPlay;
}

function startPlay() {
  if (!state.selectedOffense || !state.selectedDefense || state.playActive) return;
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
  const targetText = state.selectedOffense === 'power' ? 'Run look: follow the pulling guard.' : `QB read: ${targetLabel(target)}. Follow the gold target line.`;
  announce(`${offense.name} · ${defense.name}`, targetText);
}

function startKickoff() {
  if (!state || state.phase !== 'kickoff' || state.playActive) return;
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
  player.x = clamp(player.x, 2, 98);
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
  if (isUserControlled && isBallSide && player.id === 'QB' && state.ballCarrier === 'QB' && !state.ball && state.selectedOffense !== 'power') {
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
    player.x = clamp(player.x + player.vx * dt, 2, 98);
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
        const isBlocker = player.role === 'OL' || (player.role === 'TE' && state.selectedOffense === 'power');
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
  const movement = Math.hypot(player.vx, player.vy);
  player.moving = movement > 1.2;
  player.stride += dt * (player.moving ? 10 + movement * .22 : 3.5);
  player.action = Math.max(0, player.action - dt);
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
  if (defender && progress > .35 && state.selectedDefense !== 'cover2' && state.phase !== 'kickoff-flight') {
    state.ball = null;
    state.ballCarrier = defender.id;
    endPlay('interception', -3);
    return;
  }
  if (progress >= 1) {
    state.ball = null;
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
  if (tackler && runner && Math.hypot(tackler.x - runner.x, tackler.y - runner.y) < 9) {
    const direction = state.possession === 0 ? 1 : -1;
    const type = state.phase === 'kickoff-return' ? 'kickoff-return' : 'tackle';
    startTackleSequence(tackler, runner, Math.round((runner.x - state.playStartYard) * direction), type);
  }
}

function resolveAutomaticTackle() {
  if (state.ballCarrier === null) return;
  const runner = controlledPlayer();
  const defenders = state.players.filter(player => player.side !== state.possession);
  const tackler = defenders.find(player => Math.hypot(player.x - runner.x, player.y - runner.y) < 5.2);
  if (tackler && state.playTime > 1.4) {
    const yards = Math.round((runner.x - state.playStartYard) * (state.possession === 0 ? 1 : -1));
    const type = state.phase === 'kickoff-return' ? 'kickoff-return' : runner.id === 'QB' ? 'sack' : 'tackle';
    startTackleSequence(tackler, runner, yards, type);
  }
}

function startTackleSequence(tackler, runner, yards, type = 'tackle') {
  if (state.tackleSequence || !state.playActive) return;
  const direction = Math.sign(runner.x - tackler.x) || (state.possession === 0 ? 1 : -1);
  const duration = .62;
  state.playActive = false;
  state.tackleSequence = { timer: duration, yards, type };
  tackler.tackleTimer = duration;
  tackler.tackleRole = 'tackler';
  tackler.tackleDir = direction;
  tackler.action = duration;
  runner.tackleTimer = duration;
  runner.tackleRole = 'runner';
  runner.tackleDir = direction;
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
  state.tackleSequence.timer -= dt;
  state.players.forEach(player => { player.tackleTimer = Math.max(0, player.tackleTimer - dt); });
  if (state.tackleSequence.timer <= 0) {
    const yards = state.tackleSequence.yards;
    const type = state.tackleSequence.type;
    state.tackleSequence = null;
    state.players.forEach(player => { player.tackleRole = ''; player.tackleTimer = 0; });
    state.playActive = true;
    endPlay(type || 'tackle', yards);
  }
}

function spawnImpact(x, y, count) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({ x, y, vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12, life: .35 + Math.random() * .25, maxLife: .6, size: 1.2 + Math.random() * 2.2 });
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

function scoreTouchdown(side) {
  if (state.gameOver) return;
  state.playActive = false;
  state.ball = null;
  state.score[side] += 7;
  state.possession = 1 - side;
  state.kickoffTeam = side;
  state.phase = 'kickoff';
  state.ballYard = 50;
  state.down = 1;
  state.distance = 10;
  state.resultBannerTimer = 1.15;
  $('resultBannerTitle').textContent = 'TOUCHDOWN!';
  $('resultBannerText').textContent = `${side === 0 ? state.home.name : state.away.name} cashes in for 7.`;
  $('resultBanner').classList.remove('hidden');
  announce(`TOUCHDOWN! ${side === 0 ? state.home.name : state.away.name}.`, 'New drive coming up after the celebration.');
  queueNextPlay(1250, 'kickoff');
}

function queueNextPlay(delay, nextPhase = 'play') {
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
  const goalLine = state.possession === 0 ? 98 : 2;
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
  if (qbActive && state.selectedOffense !== 'power') {
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
    const goalLine = state.possession === 0 ? 98 : 2;
    if ((state.possession === 0 && runner.x >= goalLine) || (state.possession === 1 && runner.x <= goalLine)) endPlay('touchdown', 100);
  }
  if (state.playActive && state.playTime > 7.8 && state.ballCarrier === 'QB' && !state.ball && state.selectedOffense !== 'power') endPlay('sack', -1);
}

function resolveOutOfBounds() {
  const runner = controlledPlayer();
  if (!runner || state.ballCarrier === null || state.playTime < .65) return;
  if (runner.y <= 5.2 || runner.y >= 94.8) {
    const yards = Math.round((runner.x - state.playStartYard) * (state.possession === 0 ? 1 : -1));
    endPlay('out', yards);
  }
}

function drawField() {
  const fieldGradient = ctx.createLinearGradient(0, 0, 0, H);
  fieldGradient.addColorStop(0, '#267645');
  fieldGradient.addColorStop(1, '#174f35');
  ctx.fillStyle = '#0b1715';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = fieldGradient;
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - FIELD_TOP);
  ctx.fillStyle = state.home.color;
  ctx.globalAlpha = .78;
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, (FIELD_RIGHT - FIELD_LEFT) * .1, FIELD_BOTTOM - FIELD_TOP);
  ctx.fillStyle = state.away.color;
  ctx.fillRect(FIELD_RIGHT - (FIELD_RIGHT - FIELD_LEFT) * .1, FIELD_TOP, (FIELD_RIGHT - FIELD_LEFT) * .1, FIELD_BOTTOM - FIELD_TOP);
  ctx.globalAlpha = 1;
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
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '800 11px DM Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.home.short, yardToX(5), FIELD_TOP + 118);
  ctx.fillText(state.away.short, yardToX(95), FIELD_TOP + 118);
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
  if (!state.playActive || state.selectedOffense === 'power' || !state.players.length) return;
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
  const running = player.moving;
  const stride = running ? Math.sin(player.stride) : 0;
  const strideBack = running ? Math.sin(player.stride + Math.PI) : 0;
  const tackleProgress = player.tackleTimer > 0 ? 1 - player.tackleTimer / .62 : 0;
  const isRunnerTackled = player.tackleRole === 'runner';
  const isTackler = player.tackleRole === 'tackler';
  ctx.save();
  ctx.translate(x, y);
  if (isRunnerTackled) {
    ctx.translate(player.tackleDir * tackleProgress * 9, tackleProgress * 12);
    ctx.rotate(player.tackleDir * tackleProgress * .95);
  } else if (isTackler) {
    ctx.translate(player.tackleDir * tackleProgress * 7, -tackleProgress * 3);
    ctx.rotate(-player.tackleDir * tackleProgress * .35);
  }
  if (active) {
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.moveTo(-8, -28); ctx.lineTo(8, -28); ctx.lineTo(0, -20); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.save();
  ctx.scale(1 + (isRunnerTackled ? tackleProgress * .35 : 0), 1);
  ctx.beginPath(); ctx.ellipse(0, 16, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  const legLift = isRunnerTackled ? -3 : stride * 8;
  const legLiftBack = isRunnerTackled ? 3 : strideBack * 8;
  ctx.fillStyle = '#16232a';
  ctx.save();
  ctx.translate(-7, 5); ctx.rotate(legLift * .045); ctx.fillRect(-4, 0, 7, 15); ctx.fillRect(-7, 14, 10, 4); ctx.restore();
  ctx.save();
  ctx.translate(7, 5); ctx.rotate(legLiftBack * .045); ctx.fillRect(-3, 0, 7, 15); ctx.fillRect(-3, 14, 10, 4); ctx.restore();
  ctx.fillStyle = player.team.color;
  ctx.strokeStyle = '#101a1f';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-15, -15, 30, 25, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.fillRect(-11, -12, 3, 19);
  const armSwing = isRunnerTackled ? 0 : strideBack * 7;
  ctx.strokeStyle = '#e4aa7e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-13, -9); ctx.lineTo(-20 - armSwing, 2 + armSwing * .35); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13, -9); ctx.lineTo(20 + armSwing, 2 - armSwing * .35); ctx.stroke();
  ctx.fillStyle = '#f3f0d9';
  ctx.font = '900 11px Barlow Condensed, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(player.number, 0, 2);
  ctx.fillStyle = '#e4aa7e';
  ctx.beginPath(); ctx.arc(0, -23, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = player.team.dark;
  ctx.beginPath(); ctx.arc(0, -26, 12, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#e1e5d7';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(6, -23); ctx.lineTo(14, -19); ctx.lineTo(7, -15); ctx.stroke();
  if (player.id === state.ballCarrier && !state.ball) drawMiniBall(18, -5, player.side === 0 ? 1 : -1);
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
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = '#fff1bd';
    ctx.beginPath(); ctx.arc(yardToX(particle.x), laneToY(particle.y), particle.size, 0, Math.PI * 2); ctx.fill();
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

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (event.repeat) return;
  keys.add(key);
  if (!state) return;
  if (state.playActive && state.ballCarrier === 'QB' && !state.ball && state.selectedOffense !== 'power') {
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

window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));

$('startGameBtn').addEventListener('click', setupGame);
$('resetGameBtn').addEventListener('click', () => { cancelAnimationFrame(animationId); state = null; setScreen('setupScreen'); });
$('rematchBtn').addEventListener('click', () => { renderTeamPicker('home'); renderTeamPicker('away'); setScreen('setupScreen'); });

renderTeamPicker('home');
renderTeamPicker('away');
