// @ts-check

'use strict';

const Benchmark = require('benchmark');
const benchmarks = require('beautify-benchmark');
const glicko2 = require('glicko2');
const glicko2ts = require('glicko2.ts');

const lite = require('../');

const suite = new Benchmark.Suite();

// Benchmark:
//   1. Create 1000 players.
//   2. Have player 1 play a match versus every other player, in a single batch.
//   3. Get the new rating, deviation, and volatility of player 1.

/* eslint-disable no-console */

suite.add('glicko2-lite', () => {
  const players = [];

  /** @type {lite.Opponent[]} */
  const matches = [];

  let i = 0;
  while (i++ < 1000) {
    const player = { rating: 1500, rd: 350, vol: 0.06 };
    players.push(player);
    matches.push([player.rating, player.rd, Math.floor(Math.random() * 3) / 2]);
  }

  return lite(
    players[0].rating,
    players[0].rd,
    players[0].vol,
    matches,
    { tau: 0.5 }
  );
});

suite.add('glicko2', () => {
  const glicko = new glicko2.Glicko2({ tau: 0.5 });

  const p1 = glicko.makePlayer(1500, 350, 0.06);
  const players = [p1];
  const matches = [];

  let i = 1;
  while (i++ < 1000) {
    const player = glicko.makePlayer(1500, 350, 0.06);
    players.push(player);
    matches.push([p1, player, Math.floor(Math.random() * 3) / 2]);
  }

  glicko.updateRatings(matches);

  return { rating: p1.getRating(), rd: p1.getRd(), vol: p1.getVol() };
});

suite.add('glicko2.ts', () => {
  const glicko = new glicko2ts.Glicko2({ tau: 0.5 });

  const p1 = glicko.makePlayer(1500, 350, 0.06);
  const players = [p1];

  /** @type {glicko2ts.playerMatch[]} */
  const matches = [];

  let i = 1;
  while (i++ < 1000) {
    const player = glicko.makePlayer(1500, 350, 0.06);
    players.push(player);
    matches.push([p1, player, Math.floor(Math.random() * 3) / 2]);
  }

  glicko.updateRatings(matches);

  return { rating: p1.getRating(), rd: p1.getRd(), vol: p1.getVol() };
});

suite.on('cycle', (event) => {
  benchmarks.add(event.target);
});

suite.on('start', () => {
  console.log('Starting...');
});

suite.on('complete', () => {
  benchmarks.log();
});

suite.run({ async: false });
