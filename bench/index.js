'use strict';

const Benchmark = require('benchmark');
const benchmarks = require('beautify-benchmark');

const lite = require('../');
const glicko2 = require('glicko2');

const suite = new Benchmark.Suite();

suite.add('glicko2-lite', () => {
  const players = [];

  let i = 0;
  while (i++ < 1000) {
    players.push({ rating: 1500, rd: 350, vol: 0.06 });
  }

  for (let i = 1; i < players.length; i++) {
    const p1 = players[0];
    const p2 = players[i];
    players[0] = lite(p1.rating, p1.rd, p1.vol,
      [p2.rating, p2.rd, Math.floor(Math.random() * 3) / 2]);
    players[i] = lite(p2.rating, p2.rd, p2.vol,
      [p1.rating, p1.rd, Math.floor(Math.random() * 3) / 2], { tau: 0.5 });
  }

  return players[0];
});

suite.add('glicko2', () => {
  const glicko = new glicko2.Glicko2({ tau: 0.5 });

  const players = [];

  let i = 0;
  while (i++ < 1000) {
    players.push(glicko.makePlayer(1500, 350, 0.06));
  }

  const p1 = players[0];

  for (let i = 1; i < players.length; i++) {
    const p2 = players[i];
    glicko.updateRatings([[p1, p2, Math.floor(Math.random() * 3) / 2]]);
  }

  return { rating: p1.getRating(), rd: p1.getRd(), vol: p1.getVol() };
});

suite.on('cycle', (event) => {
  benchmarks.add(event.target);
});

suite.on('start', (event) => {
  /* eslint no-console: 0 */
  console.log('Starting...');
});

suite.on('complete', () => {
  benchmarks.log();
});

suite.run({ async: false });
