import { create } from 'zustand'

// Storage keys keep the original app name so existing saves carry over.
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

// Accessories unlock with bond level. Head items are exclusive; neck is its own slot.
export const ACCESSORIES = [
  { id: 'bow', label: 'Ribbon bow', slot: 'head', level: 2 },
  { id: 'scarf', label: 'Cozy scarf', slot: 'neck', level: 3 },
  { id: 'crown', label: 'Flower crown', slot: 'head', level: 4 },
  { id: 'hat', label: 'Party hat', slot: 'head', level: 5 }
]

// Three daily goals are picked from this pool each day.
export const GOAL_POOL = [
  { id: 'pet', label: 'Give 30 gentle strokes', target: 30 },
  { id: 'boop', label: 'Boop the nose 3 times', target: 3 },
  { id: 'fetch', label: 'Play fetch 5 times', target: 5 },
  { id: 'treat', label: 'Share 3 carrot treats', target: 3 },
  { id: 'brush', label: 'Brush 20 strokes', target: 20 },
  { id: 'trick', label: 'Practise 3 tricks', target: 3 },
  { id: 'meal', label: 'Serve 2 meals or drinks', target: 2 }
]

const todayKey = () => new Date().toDateString()
const yesterdayKey = () => new Date(Date.now() - 864e5).toDateString()

export const TREATS = [
  { id: 'carrot', label: 'Carrot', food: 8, joy: 12 },
  { id: 'strawberry', label: 'Strawberry', food: 5, joy: 20, line: 'Strawberry! {n}\'s favourite' },
  { id: 'parsley', label: 'Parsley', food: 14, joy: 8, line: 'Fresh parsley, very healthy' },
  { id: 'banana', label: 'Banana', food: 6, joy: 16, line: 'A sweet little banana slice' }
]

export const isNightHour = (d = new Date()) => d.getHours() >= 21 || d.getHours() < 6

const SETTINGS_KEY = 'hannahsBunny.settings'
const prefersReducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
function loadSettings() {
  const def = { muted: false, music: 0.7, sfx: 0.8, haptics: true, reduceMotion: prefersReducedMotion, lowPower: false }
  try { return { ...def, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } } catch (e) { return def }
}

function newDaily() {
  const date = todayKey()
  let h = 0
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const pool = [...GOAL_POOL]
  const goals = {}
  for (let i = 0; i < 3; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    const [g] = pool.splice(h % pool.length, 1)
    goals[g.id] = 0
  }
  return { date, goals, allDone: false }
}

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
    return {
      needs: { ...DEFAULT_NEEDS }, name: 'Bun', firstVisit: true, daily: newDaily(), wardrobe: { head: null, neck: null },
      visit: { last: todayKey(), streak: 1 }, welcome: null
    }
  }
  const needs = { ...DEFAULT_NEEDS, ...saved.needs }
  const before = { ...needs }
  const awaySec = Math.max(0, (Date.now() - (saved.savedAt || Date.now())) / 1000)
  // Gentle offline decay: 6% speed, capped at 8 hours away, never below 30.
  // (Eight hours away costs roughly a fifth of food, water and joy.)
  const away = Math.min(8 * 3600, Math.max(0, (Date.now() - (saved.savedAt || Date.now())) / 1000)) * 0.06
  for (const k of Object.keys(DECAY)) {
    needs[k] = Math.max(Math.min(needs[k], 30), needs[k] + DECAY[k] * away)
  }
  const daily = saved.daily && saved.daily.date === todayKey() ? saved.daily : newDaily()
  // Daily visit streak.
  const prevVisit = saved.visit || { last: null, streak: 0 }
  const newDay = prevVisit.last !== todayKey()
  const visit = newDay
    ? { last: todayKey(), streak: prevVisit.last === yesterdayKey() ? prevVisit.streak + 1 : 1 }
    : prevVisit
  const welcome = {
    awayHours: awaySec / 3600,
    newDay,
    streak: visit.streak,
    hungry: before.food - needs.food > 8 || needs.food < 35,
    thirsty: before.water - needs.water > 8 || needs.water < 35
  }
  return {
    needs,
    name: saved.name || 'Bun',
    firstVisit: false,
    daily,
    wardrobe: { head: null, neck: null, ...saved.wardrobe },
    visit,
    welcome
  }
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
  settings: loadSettings(),
  treatKind: 'carrot',
  photo: null,
  night: isNightHour(),
  visit: init.visit,
  welcome: init.welcome,
  toasts: [],
  items: [],
  bubble: null, // transient bunny state shown above its head: 'melting' | 'tired' | null
  levelUp: 0,
  celebrate: 0,
  daily: init.daily,
  wardrobe: init.wardrobe,

  change: (delta) => {
    const prev = get().needs
    const needs = { ...prev }
    for (const k in delta) needs[k] = clamp(prev[k] + delta[k])
    const before = bondLevel(prev.bond)
    const after = bondLevel(needs.bond)
    set({ needs })
    if (after > before) {
      set({ levelUp: after })
      const unlocked = [...TRICKS, ...ACCESSORIES].filter(t => t.level === after).map(t => t.label)
      get().toast(`Bond level ${after}!${unlocked.length ? ` Unlocked: ${unlocked.join(', ')}` : ''}`, 'big')
    }
  },

  tick: (dt) => {
    const n = get().needs
    const neglected = n.food < 20 || n.water < 20 || n.clean < 15
    get().change({
      food: DECAY.food * dt,
      water: DECAY.water * dt,
      clean: DECAY.clean * dt,
      joy: DECAY.joy * dt * (neglected ? 2 : 1) * (get().night ? 0.5 : 1),
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

  // Advance a daily goal ('pet', 'boop', 'fetch', ...).
  progress: (kind, n = 1) => {
    let daily = get().daily
    if (daily.date !== todayKey()) daily = newDaily()
    if (!(kind in daily.goals)) { if (daily !== get().daily) set({ daily }); return }
    const goal = GOAL_POOL.find(g => g.id === kind)
    const before = daily.goals[kind]
    if (before >= goal.target) return
    const now = Math.min(goal.target, before + n)
    daily = { ...daily, goals: { ...daily.goals, [kind]: now } }
    set({ daily })
    if (now >= goal.target) {
      get().change({ bond: 3, joy: 8 })
      set(s => ({ celebrate: s.celebrate + 1 }))
      const all = GOAL_POOL.filter(g => g.id in daily.goals).every(g => daily.goals[g.id] >= g.target)
      if (all && !daily.allDone) {
        set({ daily: { ...daily, allDone: true } })
        get().change({ bond: 5 })
        get().toast('All daily goals done! See you tomorrow', 'big')
      } else {
        get().toast(`Goal complete: ${goal.label}`, 'big')
      }
    }
  },

  wear: (id) => {
    const acc = ACCESSORIES.find(a => a.id === id)
    if (!acc) return
    const w = get().wardrobe
    set({ wardrobe: { ...w, [acc.slot]: w[acc.slot] === id ? null : id } })
  },

  setTool: (tool) => set({ tool }),
  setSetting: (key, value) => {
    const settings = { ...get().settings, [key]: value }
    set({ settings })
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch (e) { /* ignore */ }
  },
  setTreatKind: (treatKind) => set({ treatKind }),
  setNight: (night) => { if (get().night !== night) set({ night }) },
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
    const { needs, name, daily, wardrobe, visit } = useGame.getState()
    try {
      localStorage.setItem(KEY, JSON.stringify({ needs, name, daily, wardrobe, visit, savedAt: Date.now() }))
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
