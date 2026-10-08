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

  /** A pitched tone with an optional glide: the voice of spells and growls. */
  function tone(t, { type = 'sine', freq, freqTo, dur, gain = 0.3, attack = 0.01, filter }) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqTo) osc.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      osc.connect(f);
      node = f;
    }
    node.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // What each kind of offensive spell sounds like once it's loosed.
  const SPELL_TAILS = {
    fire(t) {
      noise(t, { dur: 0.6, freq: 700, q: 0.6, type: 'lowpass', gain: 0.55, attack: 0.05, sweepTo: 250 });
      thump(t, { freq: 70, dur: 0.3, gain: 0.35 });
    },
    lightning(t) {
      for (let i = 0; i < 7; i++) {
        noise(t + i * 0.035 + Math.random() * 0.02, { dur: 0.04, freq: 3000 + Math.random() * 3000, q: 0.8, type: 'highpass', gain: 0.45 });
      }
      thump(t + 0.05, { freq: 50, dur: 0.4, gain: 0.4 });
    },
    cold(t) {
      [1760, 2217, 2637].forEach((f, i) => tone(t + i * 0.05, { type: 'triangle', freq: f, freqTo: f * 1.02, dur: 0.5, gain: 0.08 }));
      noise(t, { dur: 0.45, freq: 6000, q: 0.5, type: 'highpass', gain: 0.12, attack: 0.03 });
    },
    acid(t) {
      noise(t, { dur: 0.55, freq: 4500, q: 0.7, type: 'highpass', gain: 0.3, attack: 0.02, sweepTo: 2500 });
    },
    poison(t) {
      for (let i = 0; i < 6; i++) {
        const f = 250 + Math.random() * 350;
        tone(t + i * 0.06 + Math.random() * 0.02, { freq: f, freqTo: f * 1.8, dur: 0.07, gain: 0.15 });
      }
    },
    arcane(t) {
      [220, 277, 330, 415].forEach(f => tone(t, { type: 'sawtooth', freq: f, freqTo: f * 0.5, dur: 0.9, gain: 0.05, attack: 0.08, filter: 1500 }));
    },
  };

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

    /** A monster's crushing blow: a heavy impact with a crack in it. */
    crit() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      thump(t, { freq: 55, dur: 0.35, gain: 0.8 });
      noise(t, { dur: 0.12, freq: 900, q: 0.8, gain: 0.6 });
      noise(t + 0.02, { dur: 0.06, freq: 3500, q: 1.5, type: 'highpass', gain: 0.35 });
      thump(t + 0.09, { freq: 40, dur: 0.3, gain: 0.5 });
    },

    /** A monster's last breath: a falling growl and a body hitting stone. */
    monsterDeath() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      tone(t, { type: 'sawtooth', freq: 180, freqTo: 38, dur: 1.0, gain: 0.22, attack: 0.04, filter: 700 });
      tone(t, { type: 'sawtooth', freq: 187, freqTo: 41, dur: 1.0, gain: 0.15, attack: 0.04, filter: 600 });
      noise(t, { dur: 0.8, freq: 400, q: 0.7, type: 'lowpass', gain: 0.2, attack: 0.1, sweepTo: 120 });
      thump(t + 0.85, { freq: 60, dur: 0.25, gain: 0.55 });
    },

    /** An offensive spell: a rising swoosh as it's cast, then its element. */
    spell(element) {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      noise(t, { dur: 0.3, freq: 400, q: 1.2, gain: 0.3, attack: 0.08, sweepTo: 3200 });
      (SPELL_TAILS[element] || SPELL_TAILS.arcane)(t + 0.22);
    },

    /** A healing spell: a soft, rising chime. */
    heal() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      [523, 659, 784, 1047].forEach((f, i) => {
        tone(t + i * 0.09, { type: 'triangle', freq: f, dur: 0.7, gain: 0.12, attack: 0.03 });
        tone(t + i * 0.09, { freq: f * 2, dur: 0.5, gain: 0.03, attack: 0.03 });
      });
      noise(t + 0.2, { dur: 0.6, freq: 7000, q: 0.5, type: 'highpass', gain: 0.04, attack: 0.2 });
    },

    /** The Aboleth, close by: a deep wet drone, bubbles rising, two slow heavy
     * stirrings of water, and a whisper just under hearing. */
    aboleth() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      tone(t, { type: 'sawtooth', freq: 46, freqTo: 36, dur: 2.4, gain: 0.14, attack: 0.5, filter: 260 });
      tone(t + 0.2, { type: 'sine', freq: 73, freqTo: 61, dur: 2.0, gain: 0.08, attack: 0.4 });
      for (let i = 0; i < 7; i++) {
        const at = t + 0.15 + Math.random() * 1.6, f = 110 + Math.random() * 120;
        tone(at, { freq: f, freqTo: f * 1.9, dur: 0.07, gain: 0.07, attack: 0.01 });
      }
      for (const at of [t + 0.7, t + 1.35]) {
        noise(at, { dur: 0.6, freq: 900, q: 0.6, type: 'lowpass', gain: 0.3, attack: 0.12, sweepTo: 250 });   // water sloshing
        noise(at + 0.05, { dur: 0.3, freq: 2400, q: 0.8, gain: 0.06, attack: 0.03, sweepTo: 1200 });
      }
      noise(t + 0.3, { dur: 1.6, freq: 3200, q: 0.8, gain: 0.025, attack: 0.5, sweepTo: 1800 });
    },

    /** Drinking a potion: three gulps and a sigh of relief. */
    gulp() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      for (let i = 0; i < 3; i++) {
        const at = t + i * 0.26;
        tone(at, { freq: 190 - i * 15, freqTo: 120, dur: 0.12, gain: 0.35, attack: 0.02, filter: 600 });
        noise(at, { dur: 0.1, freq: 500, q: 3, type: 'lowpass', gain: 0.25, attack: 0.015 });
      }
      noise(t + 0.85, { dur: 0.35, freq: 1200, q: 0.6, type: 'lowpass', gain: 0.08, attack: 0.08 });
    },

    /** Snatching something up: a quick swipe and a clink. */
    snatch() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      noise(t, { dur: 0.12, freq: 1800, q: 1, gain: 0.3, attack: 0.01, sweepTo: 600 });
      tone(t + 0.1, { type: 'triangle', freq: 2093, dur: 0.18, gain: 0.08 });
      tone(t + 0.13, { type: 'triangle', freq: 2637, dur: 0.15, gain: 0.06 });
    },

    /** Each gem's magic has its own voice. */
    gem(type) {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      const sparkle = (at, n, lo, hi, gain = 0.05) => {
        for (let i = 0; i < n; i++) tone(at + Math.random() * 0.5, { type: 'triangle', freq: lo + Math.random() * (hi - lo), dur: 0.15, gain });
      };
      switch (type) {
        case 'ruby':      // the corridor folds away: a warping rise and a pop
          tone(t, { type: 'sawtooth', freq: 110, freqTo: 1760, dur: 0.7, gain: 0.12, attack: 0.05, filter: 2500 });
          noise(t, { dur: 0.7, freq: 300, q: 2, gain: 0.2, attack: 0.1, sweepTo: 4000 });
          thump(t + 0.7, { freq: 120, dur: 0.12, gain: 0.4 });
          break;
        case 'sapphire':  // cold blue light: a monster erased
          [1318, 1568, 1976].forEach((f, i) => tone(t + i * 0.04, { freq: f, freqTo: f / 2, dur: 0.9, gain: 0.08 }));
          noise(t, { dur: 0.8, freq: 5000, q: 0.5, type: 'highpass', gain: 0.1, attack: 0.05 });
          break;
        case 'diamond':   // the whole level unfolds: a bright, spreading glitter
          sparkle(t, 14, 2000, 5000, 0.05);
          tone(t, { type: 'triangle', freq: 1047, dur: 1.0, gain: 0.08, attack: 0.05 });
          break;
        case 'opal':      // a blinding flash
          noise(t, { dur: 0.25, freq: 6000, q: 0.5, type: 'highpass', gain: 0.4, attack: 0.005 });
          tone(t, { freq: 2600, freqTo: 400, dur: 0.4, gain: 0.15 });
          break;
        case 'emerald':   // a ward closing around you: a soft, rising hum
          [196, 294, 392].forEach(f => tone(t, { type: 'sine', freq: f, freqTo: f * 1.5, dur: 1.1, gain: 0.08, attack: 0.3 }));
          sparkle(t + 0.4, 5, 1500, 2500, 0.03);
          break;
      }
    },

    /** Asmodeus banished: a rumble and his howl falling away as he shrinks,
     * the rift sucking in, a boom as it snaps shut, then a dark chord. Timed
     * to the victory screen's animation (about 6 seconds). */
    banish() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.05;
      noise(t, { dur: 5.0, freq: 120, q: 0.7, type: 'lowpass', gain: 0.35, attack: 0.6 });         // the rumble
      tone(t + 0.2, { type: 'sawtooth', freq: 180, freqTo: 1800, dur: 4.4, gain: 0.07, attack: 0.3, filter: 2400 }); // the howl, rising as he shrinks
      tone(t + 0.2, { type: 'sawtooth', freq: 120, freqTo: 1300, dur: 4.4, gain: 0.05, attack: 0.3, filter: 1800 });
      noise(t + 3.2, { dur: 1.6, freq: 400, q: 2, gain: 0.3, attack: 1.2, sweepTo: 4000 });       // the rift drawing in
      thump(t + 5.05, { freq: 55, dur: 1.2, gain: 0.7 });                                         // it snaps shut
      noise(t + 5.05, { dur: 0.6, freq: 800, q: 0.8, gain: 0.4, attack: 0.005 });
      [55, 65.4, 77.8].forEach(f => tone(t + 5.4, { type: 'triangle', freq: f, dur: 3.5, gain: 0.12, attack: 0.4 }));  // a dark chord
      for (let i = 0; i < 6; i++) tone(t + 5.5 + i * 0.09, { type: 'sine', freq: 900 + Math.random() * 900, dur: 0.25, gain: 0.03 });
    },

    /** Asmodeus triumphant: hellfire roaring up, a doom chord, and his
     * laughter, a run of deep falling "HA"s, over the top. */
    triumph() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.05;
      noise(t, { dur: 3.5, freq: 300, q: 0.6, type: 'lowpass', gain: 0.3, attack: 1.5, sweepTo: 1200 });   // the fire climbing
      [41.2, 49, 58.3, 61.7].forEach(f => tone(t + 0.4, { type: 'sawtooth', freq: f, dur: 4.5, gain: 0.06, attack: 1.2, filter: 500 }));
      thump(t + 3.1, { freq: 50, dur: 1.4, gain: 0.7 });
      for (let i = 0; i < 7; i++) {   // HA. HA. HA...
        const at = t + 3.2 + i * 0.36;
        const f = 150 - i * 9;
        tone(at, { type: 'sawtooth', freq: f, freqTo: f * 0.75, dur: 0.24, gain: 0.16, attack: 0.02, filter: 900 });
        tone(at, { type: 'square', freq: f * 0.5, freqTo: f * 0.37, dur: 0.24, gain: 0.07, attack: 0.02, filter: 600 });
        noise(at, { dur: 0.2, freq: 700, q: 1.5, gain: 0.12, attack: 0.02 });
      }
    },

    /** Five fanfares, from a short nod to a full triumph for a unique lord. */
    victory(tier) {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      const C4 = 261.63;
      const note = (semis) => C4 * Math.pow(2, semis / 12);
      const play = (seq, voice = 'triangle', gain = 0.12) => {
        for (const [at, semis, dur] of seq) {
          tone(t + at, { type: voice, freq: note(semis), dur, gain, attack: 0.02 });
          tone(t + at, { type: 'sine', freq: note(semis + 12), dur: dur * 0.8, gain: gain * 0.3, attack: 0.02 });
        }
      };
      switch (tier) {
        case 1: play([[0, 7, 0.18], [0.15, 12, 0.35]]); break;
        case 2: play([[0, 0, 0.15], [0.13, 4, 0.15], [0.26, 7, 0.45]]); break;
        case 3: play([[0, 0, 0.14], [0.12, 4, 0.14], [0.24, 7, 0.14], [0.36, 12, 0.6]]); break;
        case 4:
          play([[0, 0, 0.12], [0.1, 0, 0.12], [0.2, 0, 0.12], [0.32, 7, 0.3], [0.62, 4, 0.18], [0.8, 12, 0.9]], 'sawtooth', 0.06);
          play([[0.8, 7, 0.9], [0.8, 4, 0.9]], 'triangle', 0.07);
          thump(t + 0.8, { freq: 70, dur: 0.4, gain: 0.4 });
          break;
        case 5:
          play([[0, -5, 0.2], [0.18, 0, 0.2], [0.36, 4, 0.2], [0.54, 7, 0.4], [0.94, 4, 0.18], [1.12, 7, 0.18], [1.3, 12, 1.4]], 'sawtooth', 0.06);
          play([[1.3, 7, 1.4], [1.3, 4, 1.4], [1.3, 0, 1.4]], 'triangle', 0.07);
          thump(t + 1.3, { freq: 60, dur: 0.6, gain: 0.5 });
          for (let i = 0; i < 3; i++) thump(t + 0.54 + i * 0.12, { freq: 90, dur: 0.1, gain: 0.25 });
          break;
      }
    },

    /** A war-cry to scare a monster off: a growling shout. */
    scare() {
      if (!audio()) return;
      const t = ctx.currentTime + 0.01;
      tone(t, { type: 'sawtooth', freq: 140, freqTo: 220, dur: 0.5, gain: 0.18, attack: 0.04, filter: 1200 });
      tone(t, { type: 'sawtooth', freq: 147, freqTo: 230, dur: 0.5, gain: 0.12, attack: 0.04, filter: 1000 });
      noise(t, { dur: 0.5, freq: 900, q: 1, gain: 0.25, attack: 0.04 });
      thump(t, { freq: 80, dur: 0.15, gain: 0.4 });
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
