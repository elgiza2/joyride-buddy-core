export type Composition = {
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  chords: string[]; // e.g. ["Am", "F", "C", "G"]
  melody: number[]; // MIDI note numbers, 0 = rest
  description: string;
  lyrics?: string[];
  hook?: string;
};

const NOTE_INDEX: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function chordNotes(chord: string): number[] {
  const match = /^([A-G][#b]?)(m|min|maj|dim|sus4|7|m7|maj7)?/.exec(chord.trim());
  const root = NOTE_INDEX[match?.[1] ?? "C"] ?? 0;
  const quality = match?.[2] ?? "";
  const minor = quality.startsWith("m") && !quality.startsWith("maj");
  const base = 48 + root; // C3 area
  const third = base + (minor ? 3 : 4);
  const fifth = base + 7;
  const notes = [base, third, fifth];
  if (quality.includes("7")) notes.push(base + (minor ? 10 : 11));
  return notes;
}

export class TrackPlayer {
  private ctx: AudioContext | null = null;
  private stopFlag = false;
  private master: GainNode | null = null;

  async play(comp: Composition, onEnd?: () => void) {
    this.stop();
    this.stopFlag = false;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.9;
    const comp2 = ctx.createDynamicsCompressor();
    master.connect(comp2).connect(ctx.destination);
    this.master = master;

    const bpm = Math.min(180, Math.max(60, comp.bpm || 90));
    const beat = 60 / bpm;
    const bar = beat * 4;
    const start = ctx.currentTime + 0.15;
    const bars = Math.max(4, comp.chords.length) * 2;

    for (let b = 0; b < bars; b++) {
      const chord = comp.chords[b % comp.chords.length] ?? "Am";
      const t0 = start + b * bar;
      // pad chord
      for (const n of chordNotes(chord)) {
        this.tone(ctx, master, midiToFreq(n), t0, bar * 0.98, 0.09, "sawtooth", 1200);
      }
      // bass
      const bassFreq = midiToFreq((chordNotes(chord)[0] ?? 48) - 12);
      this.tone(ctx, master, bassFreq, t0, beat * 0.9, 0.22, "triangle", 400);
      this.tone(ctx, master, bassFreq, t0 + beat * 2, beat * 0.9, 0.18, "triangle", 400);
      // drums
      for (let s = 0; s < 8; s++) {
        const t = t0 + s * (beat / 2);
        if (s % 4 === 0) this.kick(ctx, master, t);
        if (s % 4 === 2) this.noise(ctx, master, t, 0.16, 1800);
        this.noise(ctx, master, t, 0.045, 7000, 0.03);
      }
      // melody
      const notes = comp.melody.length ? comp.melody : [69, 72, 76, 74];
      for (let s = 0; s < 8; s++) {
        const n = notes[(b * 8 + s) % notes.length];
        if (!n) continue;
        this.tone(ctx, master, midiToFreq(n), t0 + s * (beat / 2), beat * 0.45, 0.13, "square", 2600);
      }
    }

    const total = bars * bar + 0.6;
    setTimeout(() => {
      if (!this.stopFlag) {
        this.stop();
        onEnd?.();
      }
    }, total * 1000);
    return total;
  }

  private tone(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    t: number,
    dur: number,
    gain: number,
    type: OscillatorType,
    cutoff: number,
  ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter).connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private kick(ctx: AudioContext, dest: AudioNode, t: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  private noise(ctx: AudioContext, dest: AudioNode, t: number, dur: number, cutoff: number, gain = 0.12) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(dest);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  stop() {
    this.stopFlag = true;
    if (this.master) this.master.gain.value = 0;
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
  }
}
