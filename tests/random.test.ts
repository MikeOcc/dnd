import { describe, it, expect } from 'vitest';
import { RNG } from '../src/core/random.js';

describe('RNG', () => {
  it('produces deterministic results from the same seed', () => {
    const r1 = new RNG(12345);
    const r2 = new RNG(12345);
    const results1 = Array.from({ length: 20 }, () => r1.die(20));
    const results2 = Array.from({ length: 20 }, () => r2.die(20));
    expect(results1).toEqual(results2);
  });

  it('produces different results from different seeds', () => {
    const r1 = new RNG(1);
    const r2 = new RNG(2);
    const r1vals = Array.from({ length: 10 }, () => r1.die(100));
    const r2vals = Array.from({ length: 10 }, () => r2.die(100));
    expect(r1vals).not.toEqual(r2vals);
  });

  it('die() returns values in range [1, sides]', () => {
    const rng = new RNG(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.die(6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it('int() returns values in [min, max] inclusive', () => {
    const rng = new RNG(99);
    for (let i = 0; i < 500; i++) {
      const v = rng.int(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('float() returns values in [0, 1)', () => {
    const rng = new RNG(7);
    for (let i = 0; i < 200; i++) {
      const v = rng.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('roll() sums dice correctly', () => {
    const rng = new RNG(55);
    for (let i = 0; i < 100; i++) {
      const r = rng.roll(3, 6);
      expect(r.dice).toHaveLength(3);
      expect(r.total).toBe(r.dice.reduce((a, b) => a + b, 0));
      expect(r.total).toBeGreaterThanOrEqual(3);
      expect(r.total).toBeLessThanOrEqual(18);
    }
  });

  it('shuffle() contains the same elements', () => {
    const rng = new RNG(123);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle([...arr]);
    expect(shuffled.sort()).toEqual(arr.sort());
  });
});
