import { glicko2 } from 'glicko2-lite';
import { describe, expect, it } from 'vitest';

describe('glicko2', () => {
  it('should be a function', () => {
    expect(typeof glicko2).toBe('function');
  });

  it('should calculate new ratings', () => {
    const a = { rating: 1500, rd: 200, vol: 0.06 };
    const b = { rating: 1400, rd: 30, vol: 0.06 };
    const c = { rating: 1550, rd: 100, vol: 0.06 };
    const d = { rating: 1700, rd: 300, vol: 0.06 };

    const result = glicko2(
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

    expect(result.rating).toBeCloseTo(1464, 0);
    expect(result.rd).toBeCloseTo(151.52, 1);
    expect(result.vol).toBeCloseTo(0.059_99, 4);
  });
});
