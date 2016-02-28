'use strict';

var assign = require('lodash.assign');
var map = require('lodash.map');
var reduce = require('lodash.reduce');

function scale(rating, rd, options) {
  var mu = (rating - options.rating) / 173.7178;
  var phi = rd / 173.7178;
  return {mu: mu, phi: phi};
}

function g(phi) {
  return 1 / Math.sqrt(1 + 3 * Math.pow(phi, 2) / Math.pow(Math.PI, 2));
}

function e(mu, muj, phij) {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

function scaleOpponents(mu, opponents, options) {
  return map(opponents, function(opp) {
    var scaled = scale(opp[0], opp[1], options);
    return {
      muj: scaled.mu,
      phij: scaled.phi,
      gphij: g(scaled.phi),
      emmp: e(mu, scaled.mu, scaled.phi),
      score: opp[2]
    };
  });
}

function updateRating(opponents) {
  return 1 / reduce(opponents, function(sum, opp) {
    return sum + Math.pow(opp.gphij, 2) * opp.emmp * (1 - opp.emmp);
  }, 0);
}

function computeDelta(v, opponents) {
  return v * reduce(opponents, function(sum, opp) {
    return sum + opp.gphij * (opp.score - opp.emmp);
  }, 0);
}

function volF(phi, v, delta, a, options) {
  var phi2 = Math.pow(phi, 2);
  var d2 = Math.pow(delta, 2);
  return function(x) {
    var ex = Math.exp(x);
    var a2 = phi2 + v + ex;
    var p2 = (x - a) / Math.pow(options.tau, 2);
    var p1 = (ex * (d2 - phi2 - v - ex)) / (2 * Math.pow(a2, 2));
    return p1 - p2;
  };
}

function computeVolatility(sigma, phi, v, delta, options) {
  // 5.1
  var a = Math.log(Math.pow(sigma, 2));
  var f = volF(phi, v, delta, a, options);

  // 5.2
  var b;
  if (Math.pow(delta, 2) > Math.pow(phi, 2) + v) {
    b = Math.log(Math.pow(delta, 2) - Math.pow(phi, 2) - v);
  }
  else {
    var k = 1;
    while (f(a - k * options.tau) < 0) {
      k++;
    }
    b = a - k * options.tau;
  }

  // 5.3
  var fa = f(a);
  var fb = f(b);

  // 5.4
  while (Math.abs(b - a) > 0.000001) {
    var c = a + (a - b) * fa / (fb - fa);
    var fc = f(c);

    if (fc * fb < 0) {
      a = b;
      fa = fb;
    }
    else {
      fa /= 2;
    }

    b = c;
    fb = fc;
  }

  // 5.5
  return Math.exp(a / 2);
}

function phiStar(sigmap, phi) {
  return Math.sqrt(Math.pow(sigmap, 2) + Math.pow(phi, 2));
}

function newRating(phis, mu, v, opponents) {
  var phip = 1 / Math.sqrt(1 / Math.pow(phis, 2) + 1 / v);
  var mup = mu + Math.pow(phip, 2) * reduce(opponents, function(sum, opp) {
    return sum + opp.gphij * (opp.score - opp.emmp);
  }, 0);
  return {mu: mup, phi: phip};
}

function unscale(mup, phip, options) {
  var rating = 173.7178 * mup + options.rating;
  var rd = 173.7178 * phip;
  return {rating: rating, rd: rd};
}

function rate(rating, rd, sigma, opponents, options) {
  options = assign({}, {rating: 1500, tau: 0.5}, options || {});

  // Step 2
  var scaled = scale(rating, rd, options);
  var scaledOpponents = scaleOpponents(scaled.mu, opponents, options);

  // Step 3
  var v = updateRating(scaledOpponents);

  // Step 4
  var delta = computeDelta(v, scaledOpponents);

  // Step 5
  var sigmap = computeVolatility(sigma, scaled.phi, v, delta, options);

  // Step 6
  var phis = phiStar(sigmap, scaled.phi);

  // Step 7
  var updated = newRating(phis, scaled.mu, v, scaledOpponents);

  var unscaled = unscale(updated.mu, updated.phi, options);
  unscaled.vol = sigmap;
  return unscaled;
}

module.exports = rate;
