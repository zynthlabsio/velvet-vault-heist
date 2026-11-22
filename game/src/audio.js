// The Velvet Vault — every sound is synthesized with WebAudio.
// No audio files are loaded; the context is created lazily on the first
// user gesture (browsers block audio before that), and shot mode never
// touches it, so headless screenshots stay silent and error-free.
export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let humNodes = null;
  let sirenTimer = 0;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(vol || 0.2, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Audio is decoration; never break the game.
    }
  }

  function noise(dur, vol, filterFreq) {
    if (!ensure() || muted) return;
    try {
      const t0 = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq || 1200;
      const gain = ctx.createGain();
      gain.gain.value = vol || 0.15;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t0);
    } catch {
      // Ignore audio failures.
    }
  }

  return {
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
      this.startHum();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.35;
      return muted;
    },
    get muted() {
      return muted;
    },
    startHum() {
      if (!ensure() || muted || humNodes) return;
      try {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 55;
        const gain = ctx.createGain();
        gain.gain.value = 0.045;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.13;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(gain);
        gain.connect(master);
        osc.start();
        lfo.start();
        humNodes = { osc, lfo, gain };
      } catch {
        humNodes = null;
      }
    },
    footstep(sneak) {
      if (sneak) noise(0.05, 0.05, 500);
      else tone(95, 0.07, 'triangle', 0.07, 70);
    },
    pickup() {
      tone(660, 0.12, 'sine', 0.22);
      setTimeout(() => tone(990, 0.18, 'sine', 0.2), 70);
    },
    diamond() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sine', 0.22), i * 80));
    },
    coin() {
      tone(1900, 0.09, 'square', 0.08, 1400);
      setTimeout(() => tone(1500, 0.08, 'square', 0.06), 120);
    },
    smoke() {
      noise(0.5, 0.16, 900);
    },
    emp() {
      tone(1400, 0.5, 'sawtooth', 0.1, 90);
    },
    alert() {
      tone(440, 0.16, 'square', 0.14, 660);
      setTimeout(() => tone(660, 0.2, 'square', 0.14, 440), 140);
    },
    busted() {
      [392, 311, 233].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'sawtooth', 0.16), i * 180));
    },
    win() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.2), i * 110));
    },
    // Call every frame while playing; wails while the alarm is high.
    sirenTick(dt, alarm) {
      if (!ensure() || muted) return;
      sirenTimer -= dt;
      if (alarm > 70 && sirenTimer <= 0) {
        sirenTimer = 0.9;
        tone(720, 0.42, 'sine', 0.07, 980);
        setTimeout(() => tone(980, 0.42, 'sine', 0.06, 720), 430);
      }
    },
  };
}
