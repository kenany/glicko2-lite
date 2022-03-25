# glicko2-lite

An implementation of the Glicko-2 rating algorithm written from scratch, with
the goal being to provide less conveniences than [`glicko2js`][1] in favor of
faster execution time.

Basically `glicko2-lite` does not keep track of anything for you. All it does
is calculate new ratings. Once I reached the point where I was trying to
calculate ratings for tens of thousands of players across tens of thousands of
matches, `glicko2js` only got slower and slower as more matches were added. For
my case at least, I was already saving rating information to a database so I had
no need for the `Player` classes that `glicko2js` provides; all I really needed
was the actual calculation of new ratings itself.

`bench/index.js` is a benchmark I wrote to demonstrate the difference in
execution time. In the benchmark, I create 1,000 players, and have the first
player play a match against each of the other 999 players. After each individual
match, I calculate the new ratings of the first player and his opponent. The
result:

``` sh
$ node bench/index.js

Starting...
  2 tests completed.

  glicko2-lite x   433 ops/sec ±0.42% (87 runs sampled)
  glicko2      x 33.84 ops/sec ±1.40% (59 runs sampled)
```

   [1]: https://github.com/mmai/glicko2js

## Example

``` javascript
const glicko2 = require('glicko2-lite');

// player A: 1500 rating, 350 rating deviation, and 0.06 volatility
// player B: 2000 rating, 70 rating deviation
// A loses to B
// new rating, rating deviation, and volatility:
glicko2(1500, 350, 0.06, [[2000, 70, 0]])
// => {
// =>   rating: 1467.5878493169462,
// =>   rd: 318.6617548537152,
// =>   vol: 0.059999457650202655
// => }
```

## Installation

``` bash
$ npm install glicko2-lite
```

## API

``` javascript
const glicko2 = require('glicko2-lite');
```

### `glicko2(rating, rd, vol, matches, [options])`

  - `rating` (_Number_)
  - `rd` (_Number_)
  - `vol` (_Number_)
  - `matches` (_Array_)
  - `options` (_Object_)
