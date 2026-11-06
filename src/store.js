import { create } from 'zustand'

const KEY = 'goldenHourBunny.v2'
const LEGACY_KEY = 'goldenHourBunny'

export const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

// Bond thresholds for levels 1..5. Tricks unlock as the bond grows.
export const BOND_LEVELS = [0, 15, 35, 60, 85]
export const bondLevel = (bond) => {
  let lvl = 1
  BOND_LEVELS.forEach((t, i) => { if (bond >= t) lvl = i + 1 })
  return lvl
}

export const TRICKS = [
  { id: 'come', label: 'Come', level: 1 },
  { id: 'sit', label: 'Sit up', level: 1 },
  { id: 'wave', label: 'Wave', level: 2 },
  { id: 'binky', label: 'Binky', level: 3 },
  { id: 'twirl', label: 'Twirl', level: 4 }
]

// Per-second need changes. All needs are "higher is better".
const DECAY = { food: -0.1, water: -0.13, clean: -0.04, joy: -0.12 }

const DEFAULT_NEEDS = { food: 75, water: 75, clean: 80, joy: 55, bond: 20 }

function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
    const old = localStorage.getItem(LEGACY_KEY)
    if (old) {
      const d = JSON.parse(old)
      return {
        needs: {
          food: clamp(100 - (d.hunger ?? 30)),
          water: clamp(100 - (d.thirst ?? 25)),
          clean: clamp(d.cleanliness ?? 70),
          joy: clamp(d.comfort ?? 50),
          bond: clamp(d.bond ?? 20)
        },
        name: d.name || 'Bun',
        savedAt: Date.now()
      }
    }
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
  return null
}

function initialState() {
  const saved = loadSaved()
  if (!saved) {
    return { needs: { ...DEFAULT_NEEDS }, name: 'Bun', firstVisit: true }
  }
  const needs = { ...DEFAULT_NEEDS, ...saved.needs }
  // Gentle offline decay: a quarter speed, capped at 4 hours, never below 20.
  const away = Math.min(4 * 3600, Math.max(0, (Date.now() - (saved.savedAt || Date.now())) / 1000)) * 0.25
  for (const k of Object.keys(DECAY)) {
    needs[k] = Math.max(Math.min(needs[k], 20), needs[k] + DECAY[k] * away)
  }
  return { needs, name: saved.name || 'Bun', firstVisit: false }
}

const init = initialState()
let toastId = 0

export const useGame = create((set, get) => ({
  needs: init.needs,
  name: init.name,
  firstVisit: init.firstVisit,
  hint: init.firstVisit ? 'pet' : null,
  scene: 'bedroom',
  tool: 'pet',
  muted: false,
  toasts: [],
  items: [],
  bubble: null, // transient bunny state shown above its head: 'melting' | 'tired' | null
  levelUp: 0,

  change: (delta) => {
    const prev = get().needs
    const needs = { ...prev }
    for (const k in delta) needs[k] = clamp(prev[k] + delta[k])
    const before = bondLevel(prev.bond)
    const after = bondLevel(needs.bond)
    set({ needs })
    if (after > before) {
      set({ levelUp: after })
      const unlocked = TRICKS.filter(t => t.level === after).map(t => t.label)
      get().toast(`Bond level ${after}!${unlocked.length ? ` New trick: ${unlocked.join(', ')}` : ''}`, 'big')
    }
  },

  tick: (dt) => {
    const n = get().needs
    const neglected = n.food < 20 || n.water < 20 || n.clean < 15
    get().change({
      food: DECAY.food * dt,
      water: DECAY.water * dt,
      clean: DECAY.clean * dt,
      joy: DECAY.joy * dt * (neglected ? 2 : 1),
      bond: neglected ? -0.03 * dt : 0
    })
  },

  toast: (text, kind = 'info') => {
    const id = ++toastId
    set(s => ({ toasts: [...s.toasts.filter(t => t.text !== text).slice(-2), { id, text, kind }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), kind === 'big' ? 3600 : 2600)
  },

  addItem: (item) => {
    const id = ++toastId
    set(s => ({ items: [...s.items, { id, ...item }] }))
    return id
  },
  removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),

  setTool: (tool) => set({ tool }),
  setMuted: (muted) => set({ muted }),
  setScene: (scene) => set({ scene, items: [] }),
  setName: (name) => set({ name }),
  setHint: (hint) => set({ hint }),
  setBubble: (bubble) => { if (get().bubble !== bubble) set({ bubble }) }
}))

// Persist (throttled) whenever needs or name change.
let saveTimer = null
useGame.subscribe((s) => {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    const { needs, name } = useGame.getState()
    try {
      localStorage.setItem(KEY, JSON.stringify({ needs, name, savedAt: Date.now() }))
    } catch (e) { /* ignore quota / private mode */ }
  }, 1500)
})

export function moodOf(needs) {
  if (needs.food < 25) return 'Hungry'
  if (needs.water < 25) return 'Thirsty'
  if (needs.clean < 20) return 'Scruffy'
  if (needs.joy > 85) return 'Blissful'
  if (needs.joy > 60) return 'Happy'
  if (needs.joy > 35) return 'Content'
  return 'Wants attention'
}
