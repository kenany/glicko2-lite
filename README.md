# glicko2-lite

[![Build Status][travis-svg]][travis]

An implementation of the Glicko-2 rating algorithm written from scratch, with
the goal being to provide less conveniences than `glicko2js` in favor of faster
execution time.

Basically `glicko2-lite` does not keep track of anything for you. All it does
is calculate new ratings. At the point where I was trying to calculate ratings
for tens of thousands of players across tens of thousands of matches,
`glicko2js` only got slower and slower as more matches were added. For my case
at least, I was already saving rating information to a database so all I really
needed was the calculation part.

## Example

``` javascript
var glicko2 = require('glicko2-lite');

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
var glicko2 = require('glicko2-lite');
```

### `glicko2(rating, rd, vol, matches, [options])`

  - `rating` (_Number_)
  - `rd` (_Number_)
  - `vol` (_Number_)
  - `matches` (_Array_)
  - `options` (_Object_)


   [travis]: https://travis-ci.org/KenanY/glicko2-lite
   [travis-svg]: https://img.shields.io/travis/KenanY/glicko2-lite.svg
