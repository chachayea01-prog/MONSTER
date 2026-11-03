// Monster Brawl - High Performance Web Audio API Sound Engine
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.bgmPlaying = false;
    this.bgmStep = 0;
    this.bgmInterval = null;
    this.muted = false;
    this.bgmVolume = 0.35;
    this.sfxVolume = 0.6;
    this.dangerMode = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute) {
    this.muted = mute;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 1, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  setBgmVolume(val) {
    this.bgmVolume = val;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = val;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  // --- SFX Synthesizers ---

  playHitLight() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    // Punch body thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    // Snap noise
    const noise = this.createNoiseBuffer(0.06);
    if (noise) {
      const noiseSource = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();
      noiseSource.buffer = noise;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);

      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noiseSource.start(now);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playHitHeavy() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Deep sub-impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.36);

    // Crunch noise
    const noise = this.createNoiseBuffer(0.2);
    if (noise) {
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const nGain = this.ctx.createGain();
      src.buffer = noise;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.2);

      nGain.gain.setValueAtTime(0.8, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      src.start(now);
    }
  }

  playBlock() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playParry() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Bright glass metallic chime
    [880, 1320, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const dur = 0.45;
      gain.gain.setValueAtTime(0.3 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + dur);
    });
  }

  playDash() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const noise = this.createNoiseBuffer(0.18);
    if (!noise) return;
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    src.buffer = noise;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.18);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  playJump() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playFireball() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Pitch sweep + burning noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    const noise = this.createNoiseBuffer(0.3);
    if (noise) {
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const nGain = this.ctx.createGain();
      src.buffer = noise;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      nGain.gain.setValueAtTime(0.4, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      src.start(now);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.29);
  }

  playLaser() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  playElectricity() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Rapid spark blips
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400 + Math.random() * 800, now + i * 0.04);

      gain.gain.setValueAtTime(0.2, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.04);
    }
  }

  playExplosion() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Sub rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.61);

    // Blast noise
    const noise = this.createNoiseBuffer(0.5);
    if (noise) {
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const nGain = this.ctx.createGain();
      src.buffer = noise;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.5);

      nGain.gain.setValueAtTime(0.9, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      src.start(now);
    }
  }

  playRoar() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.65);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.66);
  }

  playUltimate() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Dramatic dramatic power sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.7);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    // Deep sub drop
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(220, now + 0.4);
    sub.frequency.exponentialRampToValueAtTime(30, now + 1.2);

    subGain.gain.setValueAtTime(0.9, now + 0.4);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.76);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now + 0.4);
    sub.stop(now + 1.21);
  }

  playKO() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Heavy crash impact
    this.playExplosion();

    // Dramatic brass/fanfare hit
    [130.81, 196.00, 261.63, 329.63].forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + 0.1);

      gain.gain.setValueAtTime(0.5, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + 0.1);
      osc.stop(now + 1.85);
    });
  }

  playUISelect() {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // --- Voice Announcer ---
  announce(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.05;
      utter.pitch = 0.8;
      utter.volume = 0.9;
      // Prefer an English arcade/deep voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Male') || v.name.includes('Natural')));
      if (preferred) utter.voice = preferred;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech synthesis unavailable:", e);
    }
  }

  // --- Dynamic BGM Synthesizer (Synthwave / Cyberpunk Fighting Beat) ---
  startBGM() {
    if (this.bgmPlaying) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    const tempo = 128; // BPM
    const stepDuration = 60 / tempo / 4; // 16th note in seconds

    // Bassline notes (Root: D minor / Cyber vibe: D, F, G, A, C)
    const basslineNormal = [
      73.42, 73.42, 0, 73.42,  87.31, 0, 73.42, 0,
      98.00, 0, 87.31, 73.42,  65.41, 0, 73.42, 0
    ];
    const basslineDanger = [
      73.42, 73.42, 87.31, 98.00,  110.00, 98.00, 87.31, 73.42,
      73.42, 87.31, 110.00, 130.81, 110.00, 98.00, 87.31, 65.41
    ];

    // Arpeggio Lead
    const arpNotes = [
      293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23
    ];

    let nextNoteTime = this.ctx.currentTime + 0.05;

    const scheduleBeat = () => {
      while (nextNoteTime < this.ctx.currentTime + 0.25) {
        if (!this.bgmPlaying) return;

        const currentStep16 = this.bgmStep % 16;
        const currentStep8 = this.bgmStep % 8;
        const bassNotes = this.dangerMode ? basslineDanger : basslineNormal;
        const freq = bassNotes[currentStep16];

        // 1. Kick Drum (On beats 0, 4, 8, 12)
        if (currentStep16 % 4 === 0) {
          this.triggerKick(nextNoteTime);
        }

        // 2. Snare / Clap (On beats 4, 12)
        if (currentStep16 === 4 || currentStep16 === 12) {
          this.triggerSnare(nextNoteTime);
        }

        // 3. Hi-hat (every 16th or off-beat)
        if (currentStep16 % 2 === 1 || this.dangerMode) {
          this.triggerHiHat(nextNoteTime, currentStep16 % 4 === 2);
        }

        // 4. Bassline
        if (freq > 0) {
          this.triggerBass(freq, nextNoteTime, stepDuration * 0.9);
        }

        // 5. Synth Lead Arpeggio (every 8th note)
        if (currentStep16 % 2 === 0) {
          const leadFreq = arpNotes[currentStep8];
          this.triggerLead(leadFreq, nextNoteTime, stepDuration * 1.5);
        }

        nextNoteTime += stepDuration;
        this.bgmStep++;
      }
    };

    this.bgmInterval = setInterval(scheduleBeat, 35);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  setDanger(isDanger) {
    this.dangerMode = isDanger;
  }

  triggerKick(time) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.14);
  }

  triggerSnare(time) {
    if (!this.ctx || this.muted) return;
    const noise = this.createNoiseBuffer(0.12);
    if (!noise) return;
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    src.buffer = noise;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    src.start(time);
  }

  triggerHiHat(time, accent = false) {
    if (!this.ctx || this.muted) return;
    const noise = this.createNoiseBuffer(0.04);
    if (!noise) return;
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    src.buffer = noise;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    gain.gain.setValueAtTime(accent ? 0.22 : 0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    src.start(time);
  }

  triggerBass(freq, time, dur) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.dangerMode ? 850 : 500, time);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  triggerLead(freq, time, dur) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  createNoiseBuffer(duration) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

window.soundEngine = new SoundEngine();
