const test = require('tape');
const isFunction = require('lodash.isfunction');
const almostEqual = require('almost-equal');

const glicko2 = require('../');

test('exports a function', (t) => {
  t.plan(1);
  t.ok(isFunction(glicko2));
});

test('calculates new ratings', (t) => {
  t.plan(3);

  let a = { rating: 1500, rd: 200, vol: 0.06 };
  const b = { rating: 1400, rd: 30, vol: 0.06 };
  const c = { rating: 1550, rd: 100, vol: 0.06 };
  const d = { rating: 1700, rd: 300, vol: 0.06 };

  // a beats b
  // c beats a
  // d beats a
  a = glicko2(
    a.rating,
    a.rd,
    a.vol,
    [
      [b.rating, b.rd, 1],
      [c.rating, c.rd, 0],
      [d.rating, d.rd, 0],
    ],
    { tau: 0.5 }
  );

  t.ok(almostEqual(a.rating, 1464, 0.1), `${a.rating} ~= 1464`);
  t.ok(almostEqual(a.rd, 151.52, 0.01), `${a.rd} ~= 151.52`);
  t.ok(almostEqual(a.vol, 0.059_99, 0.000_01), `${a.vol} ~= 0.05999`);
});
