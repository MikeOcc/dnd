export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    // Warm up the generator
    for (let i = 0; i < 16; i++) this.next();
  }

  private next(): number {
    // Xorshift32
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  /** Float in [0, 1) */
  float(): number {
    return this.next() / 0x100000000;
  }

  /** Integer in [min, max] inclusive */
  int(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    return min + (this.next() % (max - min + 1));
  }

  /** Roll one die of given sides (1-sided) */
  die(sides: number): number {
    return 1 + (this.next() % sides);
  }

  /** Roll ndS dice and return individual results plus total */
  roll(count: number, sides: number): { dice: number[]; total: number } {
    const dice: number[] = [];
    for (let i = 0; i < count; i++) dice.push(this.die(sides));
    return { dice, total: dice.reduce((a, b) => a + b, 0) };
  }

  bool(): boolean {
    return (this.next() & 1) === 1;
  }

  /** Shuffle array in place */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Pick one element at random */
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  /** Return current state (for serialization) */
  getState(): number {
    return this.state;
  }

  static globalSeed(): number {
    return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  }
}

// Module-level seeded RNG for the game — replaced per-character
let _rng = new RNG(RNG.globalSeed());

export function setGlobalRng(rng: RNG): void {
  _rng = rng;
}

export function rng(): RNG {
  return _rng;
}

export function d6(): number {
  return _rng.die(6);
}

export function d8(): number {
  return _rng.die(8);
}

export function d20(): number {
  return _rng.die(20);
}
