// Sound Manager using Web Audio API to synthesize retro 8-bit sounds and music programmatically.

class RetroSoundManager {
  private ctx: AudioContext | null = null;
  private currentBgmInterval: any = null;
  private isMuted: boolean = false;
  private currentTrackName: 'school' | 'battle' | 'ending' | 'cafe' | '' = '';

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser policies
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      if (this.currentTrackName) {
        this.playBGM(this.currentTrackName);
      }
    }
    return this.isMuted;
  }

  public getMuteState() {
    return this.isMuted;
  }

  // Play a simple synthesized retro sound effect
  public playSFX(type: 'click' | 'text' | 'exclamation' | 'hit' | 'victory' | 'defeat') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'text': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case 'exclamation': {
        // High pitch sudden alarm sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.setValueAtTime(880, now + 0.02);
        osc.frequency.setValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'hit': {
        // Explosion noise (noise buffer or low frequency saw)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'victory': {
        // Iconic happy arpeggio: C4, E4, G4, C5
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.12;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.05, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(noteTime);
          osc.stop(noteTime + 0.25);
        });
        break;
      }
      case 'defeat': {
        // Sad descending pitch arpeggio: G4, E4, Eb4, C4 sliding down
        const notes = [392.00, 329.63, 311.13, 261.63];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.15;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);
          osc.frequency.linearRampToValueAtTime(freq - 50, noteTime + 0.2);
          gain.gain.setValueAtTime(0.08, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(noteTime);
          osc.stop(noteTime + 0.2);
        });
        break;
      }
    }
  }

  // Play a loop of basic 8-bit retro theme songs
  public playBGM(trackName: 'school' | 'battle' | 'ending' | 'cafe') {
    this.currentTrackName = trackName;
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stopBGM();

    let tempo = 120; // BPM
    let notes: { note: number; length: number }[] = [];

    if (trackName === 'school') {
      tempo = 125;
      // Cheerful, bouncy major pentatonic loop
      const melody = [
        60, 62, 64, 67, 69, 67, 64, 60,
        64, 67, 69, 72, 69, 72, 67, 64,
        60, 60, 64, 64, 67, 67, 69, 69,
        72, 69, 67, 64, 62, 60, 62, 64
      ];
      notes = melody.map(n => ({ note: n, length: 0.25 }));
    } else if (trackName === 'battle') {
      tempo = 140;
      // Tense, chromatic, driving theme
      const melody = [
        57, 57, 58, 58, 59, 59, 60, 60,
        63, 62, 63, 62, 60, 59, 58, 57,
        57, 57, 60, 60, 57, 57, 62, 62,
        63, 62, 60, 59, 60, 62, 63, 65
      ];
      notes = melody.map(n => ({ note: n, length: 0.25 }));
    } else if (trackName === 'cafe') {
      tempo = 85;
      // Chill, relaxing jazz chords
      const melody = [
        60, 64, 67, 71, 62, 65, 69, 72,
        60, 64, 67, 71, 57, 60, 64, 67,
        60, 64, 67, 71, 62, 65, 69, 72,
        71, 67, 64, 60, 62, 64, 67, 69
      ];
      notes = melody.map(n => ({ note: n, length: 0.5 }));
    } else if (trackName === 'ending') {
      tempo = 100;
      // Emotional, sweet, nostalgic melody
      const melody = [
        60, 64, 67, 72, 71, 67, 64, 60,
        69, 72, 76, 74, 72, 69, 67, 64,
        62, 66, 69, 74, 72, 69, 66, 62,
        60, 64, 67, 72, 74, 76, 79, 72
      ];
      notes = melody.map(n => ({ note: n, length: 0.5 }));
    }

    const noteDuration = 60 / tempo; // duration of quarter note in seconds
    let index = 0;

    const playNextNote = () => {
      if (!this.ctx || this.isMuted) return;

      const currentNote = notes[index];
      const freq = this.midiToFreq(currentNote.note);
      const now = this.ctx.currentTime;
      const duration = currentNote.length * noteDuration * 4;

      // Play main melody channel (square wave)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle'; // triangle is soft and pleasant
      osc1.frequency.setValueAtTime(freq, now);
      gain1.gain.setValueAtTime(0.04, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.02);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + duration);

      // Play simple bass companion (pulse/sine wave)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq / 2, now); // Octave below
      gain2.gain.setValueAtTime(0.03, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.02);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + duration);

      index = (index + 1) % notes.length;
      this.currentBgmInterval = setTimeout(playNextNote, duration * 1000);
    };

    playNextNote();
  }

  public stopBGM() {
    if (this.currentBgmInterval) {
      clearTimeout(this.currentBgmInterval);
      this.currentBgmInterval = null;
    }
  }

  private midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }
}

export const soundManager = new RetroSoundManager();
