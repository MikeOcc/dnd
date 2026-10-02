// Sound effects, synthesized with the Web Audio API so there are no sound
// files to fetch or license. Each level has its own footing: dry stone above,
// mud in the warrens, gravel in the caverns, ash in the dragon depths, water
// in the abyss. Muting is remembered per browser.

const SFX = (() => {
  const MUTE_KEY = 'sevenLevels.muted';
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let stepCount = 0;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* storage blocked */ }

  // Browsers only allow audio after a key press or click, so the context is
  // made on first use (always inside one of those handlers).
  function audio() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** A burst of filtered noise: the body of most footfalls. */
  function noise(t, { dur, freq, q = 1, type = 'bandpass', gain = 0.6, attack = 0.004, sweepTo }) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(freq, t);
    if (sweepTo) filt.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(g).connect(master);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  }

  /** A short falling tone: the weight of a foot or a body hitting stone. */
  function thump(t, { freq = 90, dur = 0.08, gain = 0.5 }) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  const SURFACES = {
    stone(t, v) {
      thump(t, { freq: 85 * v, dur: 0.07, gain: 0.45 });
      noise(t, { dur: 0.06, freq: 1400 * v, q: 1.2, gain: 0.35 });
    },
    crypt(t, v) {  // stone, with the echo of an empty tomb
      SURFACES.stone(t, v);
      noise(t + 0.13, { dur: 0.05, freq: 1300 * v, q: 1.5, gain: 0.09 });
      noise(t + 0.26, { dur: 0.05, freq: 1200 * v, q: 1.5, gain: 0.04 });
    },
    mud(t, v) {
      thump(t, { freq: 70 * v, dur: 0.09, gain: 0.4 });
      noise(t, { dur: 0.16, freq: 500 * v, q: 2, type: 'lowpass', gain: 0.5, attack: 0.02, sweepTo: 220 });
    },
    gravel(t, v) {
      thump(t, { freq: 80 * v, dur: 0.06, gain: 0.35 });
      for (let i = 0; i < 4; i++) {
        noise(t + i * 0.018 + Math.random() * 0.01, { dur: 0.03, freq: (2200 + Math.random() * 1500) * v, q: 3, gain: 0.22 });
      }
    },
    ash(t, v) {
      thump(t, { freq: 75 * v, dur: 0.06, gain: 0.3 });
      noise(t, { dur: 0.12, freq: 3200 * v, q: 0.7, type: 'highpass', gain: 0.18, attack: 0.015 });
    },
    water(t, v) {
      thump(t, { freq: 65 * v, dur: 0.07, gain: 0.25 });
      noise(t, { dur: 0.22, freq: 2600 * v, q: 0.9, gain: 0.4, attack: 0.01, sweepTo: 700 });
      noise(t + 0.05, { dur: 0.14, freq: 1100 * v, q: 4, gain: 0.12, sweepTo: 1900 });
    },
    brimstone(t, v) {
      SURFACES.stone(t, v * 0.9);
      noise(t + 0.02, { dur: 0.1, freq: 4500 * v, q: 0.8, type: 'highpass', gain: 0.07 });
    },
  };
  const LEVEL_SURFACE = { 1: 'stone', 2: 'mud', 3: 'crypt', 4: 'gravel', 5: 'ash', 6: 'water', 7: 'brimstone' };

  return {
    get muted() { return muted; },

    setMuted(m) {
      muted = m;
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* storage blocked */ }
      if (m && ctx) ctx.suspend();
    },

    /** One footfall; left and right feet alternate a little in pitch. */
    step(level) {
      if (!audio()) return;
      const v = (stepCount++ % 2 ? 0.92 : 1.0) * (0.97 + Math.random() * 0.06);
      (SURFACES[LEVEL_SURFACE[level]] || SURFACES.stone)(ctx.currentTime + 0.01, v);
    },

    /** Walking into a wall. */
    bump() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      thump(t, { freq: 60, dur: 0.15, gain: 0.6 });
      noise(t, { dur: 0.08, freq: 400, q: 1, type: 'lowpass', gain: 0.4 });
    },
  };
})();
