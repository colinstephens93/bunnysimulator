// Procedural sound engine (Web Audio). No audio files to download.
// The context is created lazily on the first user gesture, which is required
// for sound to work at all on iOS Safari.

let ctx = null
let master = null
let sfxBus = null
let musicBus = null
let reverb = null
let noiseBuf = null
let muted = false
let musicVol = 0.7
let sfxVol = 0.8
let scene = 'bedroom'
let musicTimer = null
let birdTimer = null
let windNode = null
let windGain = null

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)

function makeImpulse(seconds = 1.8, decay = 3) {
  const rate = ctx.sampleRate
  const len = Math.floor(rate * seconds)
  const buf = ctx.createBuffer(2, len, rate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return
  }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 0.9
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -14
  comp.ratio.value = 3
  master.connect(comp)
  comp.connect(ctx.destination)

  reverb = ctx.createConvolver()
  reverb.buffer = makeImpulse()
  const wet = ctx.createGain()
  wet.gain.value = 0.28
  reverb.connect(wet)
  wet.connect(master)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.85 * sfxVol
  sfxBus.connect(master)
  sfxBus.connect(reverb)

  musicBus = ctx.createGain()
  musicBus.gain.value = 0.22 * musicVol
  musicBus.connect(master)
  musicBus.connect(reverb)

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

  startAmbience()
}

export function setMuted(m) {
  muted = m
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.08)
}

export function setVolumes(music, effects) {
  musicVol = music
  sfxVol = effects
  if (!ctx) return
  musicBus.gain.setTargetAtTime(0.22 * music, ctx.currentTime, 0.05)
  sfxBus.gain.setTargetAtTime(0.85 * effects, ctx.currentTime, 0.05)
}

export function setAudioScene(s) {
  scene = s
  if (ctx) startAmbience()
}

// ---------- primitives ----------

function tone(freq, { type = 'sine', dur = 0.2, vol = 0.1, attack = 0.005, glide = null, when = 0, bus = sfxBus, vibrato = 0 } = {}) {
  if (!ctx) return
  const t = ctx.currentTime + when
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t + dur * 0.8)
  if (vibrato) {
    const lfo = ctx.createOscillator()
    const lg = ctx.createGain()
    lfo.frequency.value = 7
    lg.gain.value = vibrato
    lfo.connect(lg)
    lg.connect(osc.frequency)
    lfo.start(t)
    lfo.stop(t + dur + 0.05)
  }
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(bus)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function bell(freq, { vol = 0.08, dur = 1.2, when = 0, bus = sfxBus } = {}) {
  tone(freq, { vol, dur, when, bus })
  tone(freq * 2.01, { vol: vol * 0.35, dur: dur * 0.6, when, bus })
  tone(freq * 3.02, { vol: vol * 0.12, dur: dur * 0.35, when, bus })
}

function noise({ dur = 0.15, vol = 0.1, type = 'bandpass', freq = 1200, q = 1, sweep = null, when = 0, bus = sfxBus } = {}) {
  if (!ctx) return
  const t = ctx.currentTime + when
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.setValueAtTime(freq, t)
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur)
  f.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f)
  f.connect(g)
  g.connect(bus)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.05)
}

// ---------- sound effects ----------

export const sfx = {
  // Soft fur stroke + a little note that climbs with the petting streak.
  pet(streak = 0) {
    noise({ dur: 0.16, vol: 0.05, type: 'lowpass', freq: 900 })
    const note = 72 + PENTA[Math.min(streak, PENTA.length - 1)]
    tone(midi(note), { vol: 0.035, dur: 0.22, vibrato: 3 })
  },
  // Rabbit "tooth purr": a soft, rapid clicking.
  purr() {
    for (let i = 0; i < 14; i++) noise({ dur: 0.025, vol: 0.05, freq: 2600, q: 4, when: i * 0.045 + Math.random() * 0.01 })
  },
  brush() {
    noise({ dur: 0.22, vol: 0.07, freq: 2800, sweep: 4800, q: 0.8 })
  },
  munch() {
    for (let i = 0; i < 3; i++) noise({ dur: 0.06, vol: 0.12, freq: 1500 + Math.random() * 900, q: 1.5, when: i * 0.09 })
  },
  drink() {
    tone(620 + Math.random() * 120, { vol: 0.05, dur: 0.07, glide: 900 })
    tone(700 + Math.random() * 120, { vol: 0.04, dur: 0.07, glide: 1000, when: 0.12 })
  },
  boop() {
    tone(880, { vol: 0.09, dur: 0.12, glide: 1500 })
    tone(1320, { vol: 0.05, dur: 0.1, when: 0.07, glide: 1800 })
  },
  happy() {
    tone(midi(79), { vol: 0.06, dur: 0.14, glide: midi(84) })
    tone(midi(84), { vol: 0.05, dur: 0.18, when: 0.1, glide: midi(88) })
  },
  binky() {
    ;[72, 76, 79, 84, 88].forEach((n, i) => bell(midi(n), { vol: 0.07, dur: 0.9, when: i * 0.07 }))
  },
  levelUp() {
    ;[67, 72, 76, 79, 84, 88, 91].forEach((n, i) => bell(midi(n), { vol: 0.07, dur: 1.2, when: i * 0.09 }))
  },
  sparkle() {
    ;[96, 100].forEach((n, i) => tone(midi(n), { vol: 0.025, dur: 0.3, when: i * 0.05 }))
  },
  thump() {
    tone(90, { vol: 0.45, dur: 0.25, glide: 40 })
    noise({ dur: 0.12, vol: 0.12, type: 'lowpass', freq: 300 })
  },
  nope() {
    tone(midi(76), { vol: 0.05, dur: 0.12 })
    tone(midi(71), { vol: 0.05, dur: 0.18, when: 0.12 })
  },
  camera() {
    noise({ dur: 0.05, vol: 0.2, freq: 3000, q: 0.7 })
    noise({ dur: 0.08, vol: 0.12, freq: 1500, q: 0.7, when: 0.07 })
  },
  yawn() {
    tone(520, { vol: 0.05, dur: 0.7, glide: 300, attack: 0.15, vibrato: 4 })
  },
  squeak() {
    tone(1100, { vol: 0.08, dur: 0.12, glide: 1700, vibrato: 30 })
    tone(1500, { vol: 0.05, dur: 0.14, glide: 1100, when: 0.11, vibrato: 30 })
  },
  pop() {
    tone(600, { vol: 0.08, dur: 0.1, glide: 260 })
  },
  bounce(strength = 1) {
    tone(260 + Math.random() * 40, { type: 'triangle', vol: 0.05 * Math.min(1, strength), dur: 0.09, glide: 180 })
  },
  click() {
    tone(1400, { vol: 0.025, dur: 0.04 })
  }
}

// ---------- ambience ----------

const CHORDS = [
  [60, 64, 67, 71], // Cmaj7
  [57, 60, 64, 67], // Am7
  [53, 57, 60, 64], // Fmaj7
  [55, 59, 62, 67] // G
]

function startAmbience() {
  clearTimeout(musicTimer)
  clearTimeout(birdTimer)
  let step = 0
  const playMusic = () => {
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length]
    const note = chord[Math.floor(Math.random() * chord.length)] + (Math.random() < 0.6 ? 12 : 24)
    bell(midi(note), { vol: 0.12, dur: 2.2, bus: musicBus })
    if (step % 8 === 0) tone(midi(chord[0] - 12), { vol: 0.06, dur: 3.5, attack: 0.4, bus: musicBus })
    step++
    musicTimer = setTimeout(playMusic, 450 + Math.random() * 700)
  }
  playMusic()

  if (windNode) { windNode.stop(); windNode = null }
  if (scene === 'garden') {
    windNode = ctx.createBufferSource()
    windNode.buffer = noiseBuf
    windNode.loop = true
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 420
    windGain = ctx.createGain()
    windGain.gain.value = 0.035
    windNode.connect(f)
    f.connect(windGain)
    windGain.connect(master)
    windNode.start()
    const chirp = () => {
      const base = 2200 + Math.random() * 1600
      const n = 2 + Math.floor(Math.random() * 4)
      for (let i = 0; i < n; i++) tone(base * (1 + Math.random() * 0.2), { vol: 0.025, dur: 0.08, glide: base * 1.4, when: i * 0.11 })
      birdTimer = setTimeout(chirp, 2500 + Math.random() * 5000)
    }
    birdTimer = setTimeout(chirp, 1500)
  }
}
