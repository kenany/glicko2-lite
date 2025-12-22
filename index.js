/** @typedef {[rating: number, rd: number, vol: number]} Opponent */

/**
 * @typedef {object} ScaledOpponent
 * @property {number} muj
 * @property {number} phij
 * @property {number} gphij
 * @property {number} emmp
 * @property {number} score
 */

/**
 * @param {number} rating
 * @param {number} rd
 * @param {{ rating: number; }} options
 */
function scale(rating, rd, options) {
  const mu = (rating - options.rating) / 173.7178;
  const phi = rd / 173.7178;
  return { mu, phi };
}

/**
 * @param {number} phi
 * @returns {number}
 */
function g(phi) {
  return 1 / Math.sqrt(1 + (3 * phi ** 2) / Math.PI ** 2);
}

/**
 * @param {number} mu
 * @param {number} muj
 * @param {number} phij
 * @returns {number}
 */
function e(mu, muj, phij) {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

/**
 * @param {number} mu
 * @param {readonly Opponent[]} opponents
 * @param {{ rating: number; }} options
 * @returns {ScaledOpponent[]}
 */
function scaleOpponents(mu, opponents, options) {
  return opponents.map((opp) => {
    const scaled = scale(opp[0], opp[1], options);
    return {
      muj: scaled.mu,
      phij: scaled.phi,
      gphij: g(scaled.phi),
      emmp: e(mu, scaled.mu, scaled.phi),
      score: opp[2],
    };
  });
}

/**
 * @param {readonly ScaledOpponent[]} opponents
 * @returns {number}
 */
function updateRating(opponents) {
  return (
    1 /
    opponents.reduce(
      (sum, opp) => sum + opp.gphij ** 2 * opp.emmp * (1 - opp.emmp),
      0
    )
  );
}

/**
 * @param {number} v
 * @param {readonly ScaledOpponent[]} opponents
 * @returns {number}
 */
function computeDelta(v, opponents) {
  return (
    v *
    opponents.reduce((sum, opp) => sum + opp.gphij * (opp.score - opp.emmp), 0)
  );
}

/**
 * @param {number} phi
 * @param {number} v
 * @param {number} delta
 * @param {number} a
 * @param {{ tau: number; }} options
 */
function volF(phi, v, delta, a, options) {
  const phi2 = phi ** 2;
  const d2 = delta ** 2;

  /**
   * @param {number} x
   */
  return (x) => {
    const ex = Math.exp(x);
    const a2 = phi2 + v + ex;
    const p2 = (x - a) / options.tau ** 2;
    const p1 = (ex * (d2 - phi2 - v - ex)) / (2 * a2 ** 2);
    return p1 - p2;
  };
}

/**
 * @param {number} sigma
 * @param {number} phi
 * @param {number} v
 * @param {number} delta
 * @param {{ tau: number; }} options
 * @returns {number}
 */
function computeVolatility(sigma, phi, v, delta, options) {
  // 5.1
  let a = Math.log(sigma ** 2);
  const f = volF(phi, v, delta, a, options);

  // 5.2
  /** @type {number} */
  let b;
  if (delta ** 2 > phi ** 2 + v) {
    b = Math.log(delta ** 2 - phi ** 2 - v);
  } else {
    let k = 1;
    while (f(a - k * options.tau) < 0) {
      k++;
    }
    b = a - k * options.tau;
  }

  // 5.3
  let fa = f(a);
  let fb = f(b);

  // 5.4
  while (Math.abs(b - a) > 0.000_001) {
    /** @type {number} */
    const c = a + ((a - b) * fa) / (fb - fa);
    const fc = f(c);

    if (fc * fb <= 0) {
      a = b;
      fa = fb;
    } else {
      fa /= 2;
    }

    b = c;
    fb = fc;
  }

  // 5.5
  return Math.exp(a / 2);
}

/**
 * @param {number} sigmap
 * @param {number} phi
 * @returns {number}
 */
function phiStar(sigmap, phi) {
  return Math.sqrt(sigmap ** 2 + phi ** 2);
}

/**
 * @param {number} phis
 * @param {number} mu
 * @param {number} v
 * @param {readonly ScaledOpponent[]} opponents
 */
function newRating(phis, mu, v, opponents) {
  const phip = 1 / Math.sqrt(1 / phis ** 2 + 1 / v);
  const mup =
    mu +
    phip ** 2 *
      opponents.reduce(
        (sum, opp) => sum + opp.gphij * (opp.score - opp.emmp),
        0
      );
  return { mu: mup, phi: phip };
}

/**
 * @param {number} mup
 * @param {number} phip
 * @param {{ rating: number; }} options
 */
function unscale(mup, phip, options) {
  const rating = 173.7178 * mup + options.rating;
  const rd = 173.7178 * phip;
  return { rating, rd };
}

/**
 * @param {number} rating Rating.
 * @param {number} rd Rating deviation.
 * @param {number} sigma Rating volatility.
 * @param {readonly Opponent[]} opponents Opponents.
 * @param {{ rating?: number; tau?: number; }} [options] Options.
 * @returns {{ rating: number; rd: number; vol: number; }}
 */
function rate(rating, rd, sigma, opponents, options) {
  /** @type {{ rating: number; tau: number; }} */
  const opts = { rating: 1500, tau: 0.5, ...(options || {}) };

  // Step 2
  const scaled = scale(rating, rd, opts);
  const scaledOpponents = scaleOpponents(scaled.mu, opponents, opts);

  // Step 3
  const v = updateRating(scaledOpponents);

  // Step 4
  const delta = computeDelta(v, scaledOpponents);

  // Step 5
  const sigmap = computeVolatility(sigma, scaled.phi, v, delta, opts);

  // Step 6
  const phis = phiStar(sigmap, scaled.phi);

  // Step 7
  const updated = newRating(phis, scaled.mu, v, scaledOpponents);

  return { ...unscale(updated.mu, updated.phi, opts), vol: sigmap };
}

module.exports = rate;
