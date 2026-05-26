/**
 * An opponent represented as a tuple of rating, rating deviation, and score.
 */
export type Opponent = [rating: number, rd: number, score: number];

/** Options for the rating calculation. */
export interface RateOptions {
  /** Base rating for the rating system. Defaults to `1500`. */
  rating?: number;
  /** System constant constraining volatility change. Defaults to `0.5`. */
  tau?: number;
}

/** Result of a rating calculation. */
export interface RateResult {
  /** New rating. */
  rating: number;
  /** New rating deviation. */
  rd: number;
  /** New volatility. */
  vol: number;
}

interface ScaledOpponent {
  muj: number;
  phij: number;
  gphij: number;
  emmp: number;
  score: number;
}

interface ResolvedOptions {
  rating: number;
  tau: number;
}

function scale(
  rating: number,
  rd: number,
  options: ResolvedOptions
): { mu: number; phi: number } {
  const mu = (rating - options.rating) / 173.7178;
  const phi = rd / 173.7178;
  return { mu, phi };
}

function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi ** 2) / Math.PI ** 2);
}

function e(mu: number, muj: number, phij: number): number {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

function scaleOpponents(
  mu: number,
  opponents: readonly Opponent[],
  options: ResolvedOptions
): ScaledOpponent[] {
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

function updateRating(opponents: readonly ScaledOpponent[]): number {
  return (
    1 /
    opponents.reduce(
      (sum, opp) => sum + opp.gphij ** 2 * opp.emmp * (1 - opp.emmp),
      0
    )
  );
}

function computeDelta(v: number, opponents: readonly ScaledOpponent[]): number {
  return (
    v *
    opponents.reduce((sum, opp) => sum + opp.gphij * (opp.score - opp.emmp), 0)
  );
}

function volF(
  phi: number,
  v: number,
  delta: number,
  a: number,
  options: ResolvedOptions
): (x: number) => number {
  const phi2 = phi ** 2;
  const d2 = delta ** 2;

  return (x: number) => {
    const ex = Math.exp(x);
    const a2 = phi2 + v + ex;
    const p2 = (x - a) / options.tau ** 2;
    const p1 = (ex * (d2 - phi2 - v - ex)) / (2 * a2 ** 2);
    return p1 - p2;
  };
}

function computeVolatility(
  sigma: number,
  phi: number,
  v: number,
  delta: number,
  options: ResolvedOptions
): number {
  let a = Math.log(sigma ** 2);
  const f = volF(phi, v, delta, a, options);

  let b: number;
  if (delta ** 2 > phi ** 2 + v) {
    b = Math.log(delta ** 2 - phi ** 2 - v);
  } else {
    let k = 1;
    while (f(a - k * options.tau) < 0) {
      k++;
    }
    b = a - k * options.tau;
  }

  let fa = f(a);
  let fb = f(b);

  while (Math.abs(b - a) > 0.000_001) {
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

  return Math.exp(a / 2);
}

function phiStar(sigmap: number, phi: number): number {
  return Math.sqrt(sigmap ** 2 + phi ** 2);
}

function newRating(
  phis: number,
  mu: number,
  v: number,
  opponents: readonly ScaledOpponent[]
): { mu: number; phi: number } {
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

function unscale(
  mup: number,
  phip: number,
  options: ResolvedOptions
): { rating: number; rd: number } {
  const rating = 173.7178 * mup + options.rating;
  const rd = 173.7178 * phip;
  return { rating, rd };
}

/**
 * Calculates new Glicko-2 rating, rating deviation, and volatility for a player
 * based on their matches in a rating period.
 *
 * @param rating Current rating of the player.
 * @param rd Current rating deviation of the player.
 * @param sigma Current volatility of the player.
 * @param opponents Opponents faced in the rating period, each represented as a
 *   `[rating, rd, score]` tuple where score is `1` for a win, `0.5` for a draw,
 *   and `0` for a loss.
 * @param options Optional configuration.
 * @returns New rating, rating deviation, and volatility.
 */
export function glicko2(
  rating: number,
  rd: number,
  sigma: number,
  opponents: readonly Opponent[],
  options?: RateOptions
): RateResult {
  const opts: ResolvedOptions = { rating: 1500, tau: 0.5, ...(options || {}) };

  const scaled = scale(rating, rd, opts);
  const scaledOpponents = scaleOpponents(scaled.mu, opponents, opts);

  const v = updateRating(scaledOpponents);

  const delta = computeDelta(v, scaledOpponents);

  const sigmap = computeVolatility(sigma, scaled.phi, v, delta, opts);

  const phis = phiStar(sigmap, scaled.phi);

  const updated = newRating(phis, scaled.mu, v, scaledOpponents);

  return { ...unscale(updated.mu, updated.phi, opts), vol: sigmap };
}
