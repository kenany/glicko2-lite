const Benchmark = require('benchmark');
const benchmarks = require('beautify-benchmark');
const glicko2 = require('glicko2');
const glicko2ts = require('glicko2.ts');

const lite = require('../');

const suite = new Benchmark.Suite();

// Benchmark:
//   1. Create two players.
//   2. Have player 1 win a match against player 2.
//   3. Get the new rating, deviation, and volatility of both players.

suite.add('glicko2-lite', () => {
  // 1. Create two players.
  const player1 = { rating: 1500, rd: 350, vol: 0.06 };
  const player2 = { rating: 1500, rd: 350, vol: 0.06 };

  // 2. Have player 1 win a match against player 2.
  // 3. Get the new rating, deviation, and volatility of both players.
  const _new1 = lite(
    player1.rating,
    player1.rd,
    player1.vol,
    [[player2.rating, player2.rd, 1]],
    { tau: 0.5 }
  );
  const _new2 = lite(
    player2.rating,
    player2.rd,
    player2.vol,
    [[player1.rating, player1.rd, 0]],
    { tau: 0.5 }
  );
});

suite.add('glicko2', () => {
  // 1. Create two players.
  const glicko = new glicko2.Glicko2({ tau: 0.5 });
  const player1 = glicko.makePlayer(1500, 350, 0.06);
  const player2 = glicko.makePlayer(1500, 350, 0.06);

  // 2. Have player 1 win a match against player 2.
  glicko.updateRatings([[player1, player2, 1]]);

  // 3. Get the new rating, deviation, and volatility of both players.
  const _new1 = {
    rating: player1.getRating(),
    rd: player1.getRd(),
    vol: player1.getVol(),
  };
  const _new2 = {
    rating: player2.getRating(),
    rd: player2.getRd(),
    vol: player2.getVol(),
  };
});

suite.add('glicko2.ts', () => {
  // 1. Create two players.
  const glicko = new glicko2ts.Glicko2({ tau: 0.5 });
  const player1 = glicko.makePlayer(1500, 350, 0.06);
  const player2 = glicko.makePlayer(1500, 350, 0.06);

  // 2. Have player 1 win a match against player 2.
  glicko.updateRatings([[player1, player2, 1]]);

  // 3. Get the new rating, deviation, and volatility of both players.
  const _new1 = {
    rating: player1.getRating(),
    rd: player1.getRd(),
    vol: player1.getVol(),
  };
  const _new2 = {
    rating: player2.getRating(),
    rd: player2.getRd(),
    vol: player2.getVol(),
  };
});

suite.on('cycle', (event) => {
  benchmarks.add(event.target);
});

suite.on('start', () => {
  // biome-ignore lint/suspicious/noConsole: n/a
  console.log('Starting...');
});

suite.on('complete', () => {
  benchmarks.log();
});

suite.run({ async: false });
