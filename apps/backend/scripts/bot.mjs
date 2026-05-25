#!/usr/bin/env node
// Phase 2 smoke bot — connects to a room and plays through automatically.
// Usage:
//   node scripts/bot.mjs <CODE> <name> [hostmode] [voice|text] [flow]
//
// Examples:
//   node scripts/bot.mjs L9SX "Bot 1"                       # plain guest
//   node scripts/bot.mjs L9SX "Host Bot" host voice single  # full 2-bot smoke
//
// hostmode: if "host", the bot sends START_GAME once 2+ players are in the room.
// voice|text: voiceMode flag for START_GAME (default: text)
// flow: all-guess | single-guess (default: single-guess)
//
// The bot is dumb on purpose: it picks a random angle every time it's
// asked to guess and immediately readies up for the next round.

import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';

const HOST = process.env.PARTYKIT_HOST ?? 'localhost:1999';
const COLORS = ['#74B9FF', '#AAC573', '#A29BFE', '#FF6B6B', '#55EFC4', '#F8E71C', '#E84393'];

const args = process.argv.slice(2);
const code = (args[0] ?? '').toUpperCase();
const name = args[1] ?? `Bot-${Math.random().toString(36).slice(2, 5)}`;
const isHostMode = args[2] === 'host';
const voiceMode = args[3] === 'voice';
const roundFlow = args[4] === 'all-guess' ? 'all-guess' : 'single-guess';

// Tiny built-in spectrum pool — enough to play through a 3-point game.
const SPECTRUM_POOL = [
  { left: 'frio', right: 'quente' },
  { left: 'barato', right: 'caro' },
  { left: 'normal', right: 'esquisito' },
  { left: 'fácil', right: 'difícil' },
  { left: 'pequeno', right: 'grande' },
  { left: 'silencioso', right: 'barulhento' },
];

if (!code) {
  console.error('Usage: node scripts/bot.mjs <CODE> [name] [host?]');
  process.exit(1);
}

const playerId = randomUUID();
const color = COLORS[Math.floor(Math.random() * COLORS.length)];
const url = `ws://${HOST}/parties/main/${code}`;
console.log(`[bot] connecting ${url} as ${name} (${playerId.slice(0, 8)})`);

const ws = new WebSocket(url);

function send(msg) {
  ws.send(JSON.stringify(msg));
}

ws.on('open', () => {
  console.log('[bot] open');
  send({ type: 'JOIN', code, playerId, name, color });
  // Always auto-ready so a human host can start without prompting the bot.
  setTimeout(() => send({ type: 'READY', isReady: true }), 200);
});

let lastPhase = null;
let lastSubmittedRound = -1;
let lastReadyRound = -1;
let startSent = false;
let currentTarget = null;

// Maps a target angle (0-180) + spectrum poles into a Portuguese clue
// that hints at the position. Templates work for both 1-word and
// phrase-style spectrum poles. Adds noise to the target so the bot
// guesses like a human — its dica points at a fuzzy region, not the
// exact angle (real cluers don't have a protractor either).
function clueFor(angle, spectrum) {
  const L = spectrum.left;
  const R = spectrum.right;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ±18° noise — about one score zone of imprecision
  const noisy = angle + (Math.random() * 36 - 18);
  const a = Math.max(0, Math.min(180, noisy));

  if (a <= 20) return pick([`bem no extremo de "${L}"`, `tudo "${L}"`, `quase no canto do "${L}"`, `100% pro lado de "${L}"`]);
  if (a <= 45) return pick([`bem perto de "${L}"`, `forte pro lado de "${L}"`, `inclinado pra "${L}"`, `mais pro "${L}" que pro meio`]);
  if (a <= 75) return pick([`meio puxado pra "${L}"`, `levinho pro "${L}"`, `mais "${L}" que "${R}"`, `entre o meio e "${L}"`]);
  if (a <= 88) return pick([`quase no meio, lado "${L}"`, `pertinho do centro, tendendo a "${L}"`, `quase equilibrado, com um quê de "${L}"`]);
  if (a < 92) return pick([`bem no meio`, `exato entre os dois`, `equilíbrio total`, `meio termo`]);
  if (a < 105) return pick([`quase no meio, lado "${R}"`, `pertinho do centro, tendendo a "${R}"`, `quase equilibrado, com um quê de "${R}"`]);
  if (a < 135) return pick([`meio puxado pra "${R}"`, `levinho pro "${R}"`, `mais "${R}" que "${L}"`, `entre o meio e "${R}"`]);
  if (a < 160) return pick([`bem perto de "${R}"`, `forte pro lado de "${R}"`, `inclinado pra "${R}"`, `mais pro "${R}" que pro meio`]);
  return pick([`bem no extremo de "${R}"`, `tudo "${R}"`, `quase no canto do "${R}"`, `100% pro lado de "${R}"`]);
}

ws.on('message', (raw) => {
  let msg;
  try { msg = JSON.parse(raw.toString()); } catch { return; }

  if (msg.type === 'ERROR') {
    console.log(`[bot] ERROR ${msg.code}: ${msg.message}`);
    return;
  }
  if (msg.type === 'PRIVATE_TARGET') {
    currentTarget = msg.angle;
    console.log(`[bot] PRIVATE_TARGET ${msg.angle.toFixed?.(0) ?? msg.angle}`);
    return;
  }
  if (msg.type !== 'STATE') return;

  const s = msg.state;
  if (s.phase !== lastPhase) {
    console.log(`[bot] phase: ${lastPhase ?? '?'} → ${s.phase} (round ${s.roundNumber})`);
    lastPhase = s.phase;
  }

  const me = s.players.find((p) => p.id === playerId);
  if (!me) return;

  if (s.phase === 'lobby') {
    // Host bot: as soon as we see 2+ players, fire START_GAME (once).
    if (isHostMode && me.isHost && s.players.length >= 2 && !startSent) {
      startSent = true;
      console.log(`[bot] host → START_GAME (voice=${voiceMode}, flow=${roundFlow})`);
      send({
        type: 'START_GAME',
        voiceMode,
        spectrumPool: SPECTRUM_POOL,
        settings: {
          gameMode: 'individual',
          scoringTarget: 'cluer',
          roundFlow,
          winningScore: 3,
          skipsPerPlayer: 0,
          playerNames: s.players.map((p) => p.name),
          playerColors: s.players.map((p) => p.color),
          customSpectrums: [],
          teams: [
            { name: 'T1', players: [], color: '#74B9FF' },
            { name: 'T2', players: [], color: '#D3773F' },
          ],
        },
      });
    }
    return;
  }

  const round = s.round;
  if (!round) return;
  const isCluer = round.cluerId === playerId;

  // If the bot ended up as cluer, auto-submit a clue so the game can move.
  // Real testing will have the human as cluer; this only happens in pure-bot smokes.
  if (s.phase === 'clue' && isCluer && lastSubmittedRound !== s.roundNumber) {
    lastSubmittedRound = s.roundNumber;
    setTimeout(() => {
      if (s.voiceMode) {
        console.log('[bot] cluer → CLUE_SAID');
        send({ type: 'CLUE_SAID' });
      } else {
        const clue = currentTarget != null && round?.spectrum
          ? clueFor(currentTarget, round.spectrum)
          : `dica bot ${s.roundNumber}`;
        console.log(`[bot] cluer → SUBMIT_CLUE_TEXT "${clue}" (target=${currentTarget?.toFixed?.(0) ?? currentTarget})`);
        send({ type: 'SUBMIT_CLUE_TEXT', text: clue });
      }
    }, 500);
  }

  if (s.phase === 'guess' && !isCluer && round.expectedGuessIds.includes(playerId)) {
    if (lastSubmittedRound !== s.roundNumber) {
      lastSubmittedRound = s.roundNumber;
      const angle = Math.floor(Math.random() * 160) + 10;
      console.log(`[bot] guesser → SUBMIT_GUESS ${angle}°`);
      setTimeout(() => send({ type: 'SUBMIT_GUESS', angle }), 800);
    }
  }

  if (s.phase === 'result' && lastReadyRound !== s.roundNumber) {
    lastReadyRound = s.roundNumber;
    setTimeout(() => {
      console.log('[bot] result → READY_NEXT_ROUND');
      send({ type: 'READY_NEXT_ROUND' });
    }, 1500);
  }

  if (s.phase === 'gameover') {
    const winner = s.players.find((p) => p.id === s.winnerId);
    console.log(`[bot] gameover. winner: ${winner?.name ?? '?'}`);
  }
});

ws.on('close', () => {
  console.log('[bot] closed');
  process.exit(0);
});

ws.on('error', (e) => {
  console.error('[bot] error', e.message);
});

process.on('SIGINT', () => {
  console.log('\n[bot] bye');
  ws.close();
});
