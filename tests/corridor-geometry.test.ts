import { describe, it, expect } from 'vitest';
import { computeFrames } from '../src/core/corridor-geometry.js';

describe('computeFrames', () => {
  it('frame 0 spans the full canvas, centered', () => {
    const frames = computeFrames(79, 25, 1, 0.45);
    expect(frames[0]).toEqual({ top: 0, bottom: 24, left: 0, right: 78 });
  });

  it('shrinks each successive frame strictly toward the center', () => {
    const frames = computeFrames(79, 25, 6, 0.45);
    for (let i = 1; i < frames.length; i++) {
      const prev = frames[i - 1];
      const cur = frames[i];
      expect(cur.left).toBeGreaterThan(prev.left);
      expect(cur.right).toBeLessThan(prev.right);
      expect(cur.top).toBeGreaterThan(prev.top);
      expect(cur.bottom).toBeLessThan(prev.bottom);
    }
  });

  it('never collapses a frame to zero width or height', () => {
    // A large count relative to canvas size stresses the "never collapse"
    // floor the most.
    const frames = computeFrames(20, 10, 10, 0.45);
    for (const f of frames) {
      expect(f.right).toBeGreaterThan(f.left);
      expect(f.bottom).toBeGreaterThan(f.top);
    }
  });

  it('every frame stays centered on the canvas midpoint', () => {
    const width = 79, height = 25;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const frames = computeFrames(width, height, 6, 0.45);
    for (const f of frames) {
      expect(f.left + f.right).toBe(cx * 2);
      expect(f.top + f.bottom).toBe(cy * 2);
    }
  });

  it('a steeper decay shrinks frames faster', () => {
    const gentle = computeFrames(79, 25, 3, 0.2);
    const steep = computeFrames(79, 25, 3, 1.0);
    // Compare the innermost frame's width under each decay.
    const gentleWidth = gentle[2].right - gentle[2].left;
    const steepWidth = steep[2].right - steep[2].left;
    expect(steepWidth).toBeLessThan(gentleWidth);
  });
});
