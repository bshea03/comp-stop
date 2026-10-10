/**
 * Deterministic randomness for the mock adapters. Seeding from the search
 * query means the same search always returns the same comps, so prices do not
 * jump around between renders or between the page and the API route.
 *
 * Cache Components also flags `Math.random()` during prerendering; a seeded
 * generator sidesteps that entirely.
 */

/** FNV-1a, enough for turning a query string into a 32-bit seed. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type Rng = {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max]. */
  int(min: number, max: number): number;
  /** Uniform float in [min, max). */
  float(min: number, max: number): number;
  /** Standard normal sample, for price distributions that cluster. */
  normal(): number;
  pick<T>(items: readonly T[]): T;
  bool(probability: number): boolean;
};

export function createRng(seed: string | number): Rng {
  let state = (typeof seed === "number" ? seed : hashString(seed)) >>> 0;

  // mulberry32
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const float = (min: number, max: number) => min + next() * (max - min);

  return {
    next,
    float,
    int: (min, max) => Math.floor(float(min, max + 1)),
    normal: () => {
      // Box-Muller; `next()` never returns 0 twice in a row in practice, but
      // clamp anyway so `Math.log` stays finite.
      const u = Math.max(next(), Number.EPSILON);
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    pick: (items) => items[Math.floor(next() * items.length)],
    bool: (probability) => next() < probability,
  };
}
