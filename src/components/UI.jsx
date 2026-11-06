import { useEffect, useState } from 'react'
import { useGame, bondLevel, BOND_LEVELS, TRICKS, ACCESSORIES, GOAL_POOL, moodOf } from '../store'
import { sendCommand } from '../world'
import { placeBowl } from './Toys'
import { sfx } from '../audio'
import Icon from './Icons'

const TOOLS = [
  { id: 'pet', label: 'Pet', icon: 'hand', tip: 'Stroke slowly over the head, cheeks and back' },
  { id: 'brush', label: 'Brush', icon: 'brush', tip: 'Brush along the back to clean the coat' },
  { id: 'treat', label: 'Treat', icon: 'carrot', tip: 'Tap the bed to drop a carrot, or tap the bunny to hand-feed' },
  { id: 'toy', label: 'Ball', icon: 'ball', tip: 'Tap to toss the ball, or swipe to fling it' }
]

function Meter({ icon, label, value, hue }) {
  const low = value < 25
  return (
    <div className={`meter ${low ? 'low' : ''}`} title={`${label}: ${Math.round(value)}%`}>
      <span className="meter-icon" style={{ color: hue }}><Icon name={icon} size={15} stroke={2.2} /></span>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${value}%`, background: low ? '#ff7a6b' : hue }} />
      </div>
    </div>
  )
}

function BondHearts({ bond }) {
  const lvl = bondLevel(bond)
  const lo = BOND_LEVELS[lvl - 1]
  const hi = BOND_LEVELS[lvl] ?? 100
  const pct = lvl >= 5 ? 100 : ((bond - lo) / (hi - lo)) * 100
  return (
    <div className="bond" title={`Bond level ${lvl}`}>
      <div className="bond-hearts">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= lvl ? 'on' : ''}><Icon name="heart" size={13} fill="currentColor" stroke={1.5} /></span>
        ))}
      </div>
      <div className="bond-track"><div style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function NameTag() {
  const name = useGame((s) => s.name)
  const setName = useGame((s) => s.setName)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const save = () => {
    const v = draft.trim().slice(0, 16)
    if (v) setName(v)
    setEditing(false)
  }
  if (editing) {
    return (
      <input
        className="name-input"
        value={draft}
        maxLength={16}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
    )
  }
  return (
    <button className="name" onClick={() => { setDraft(name); setEditing(true) }} aria-label="Rename bunny">
      {name}
      <Icon name="pencil" size={12} />
    </button>
  )
}

function Toasts() {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="toasts">
      {toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}
    </div>
  )
}

function Hint() {
  const hint = useGame((s) => s.hint)
  const setHint = useGame((s) => s.setHint)
  const name = useGame((s) => s.name)
  useEffect(() => {
    if (hint !== 'tools') return
    const id = setTimeout(() => setHint(null), 7000)
    return () => clearTimeout(id)
  }, [hint, setHint])
  if (!hint) return null
  return (
    <div className="hint" onClick={() => setHint(hint === 'pet' ? 'tools' : null)}>
      {hint === 'pet' ? (
        <>
          <span className="hint-hand"><Icon name="hand" size={20} /></span>
          Slowly stroke {name}&apos;s head with your finger
        </>
      ) : (
        <>Lovely! Try the treat and ball below, and teach tricks on the right</>
      )}
    </div>
  )
}

function LevelBanner() {
  const levelUp = useGame((s) => s.levelUp)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (!levelUp) return
    setShown(levelUp)
    const id = setTimeout(() => setShown(0), 3200)
    return () => clearTimeout(id)
  }, [levelUp])
  if (!shown) return null
  return (
    <div className="level-banner">
      <div className="level-hearts">{Array.from({ length: shown }, (_, i) => <Icon key={i} name="heart" size={26} fill="currentColor" stroke={1} />)}</div>
      <div className="level-title">Bond level {shown}</div>
    </div>
  )
}

function GoalsPanel({ onClose }) {
  const daily = useGame((s) => s.daily)
  const goals = GOAL_POOL.filter((g) => g.id in daily.goals)
  return (
    <div className="card panel">
      <div className="panel-head">
        <span>Today&apos;s goals</span>
        <button className="panel-close" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
      </div>
      {goals.map((g) => {
        const v = daily.goals[g.id]
        const done = v >= g.target
        return (
          <div key={g.id} className={`goal ${done ? 'done' : ''}`}>
            <span className="goal-check">{done ? <Icon name="check" size={14} stroke={3} /> : null}</span>
            <div className="goal-body">
              <div className="goal-label">{g.label}</div>
              <div className="goal-track"><div style={{ width: `${(v / g.target) * 100}%` }} /></div>
            </div>
            <span className="goal-count">{Math.floor(v)}/{g.target}</span>
          </div>
        )
      })}
      <div className="panel-foot">{daily.allDone ? 'All done! New goals tomorrow.' : 'Each goal gives bond hearts. New goals every day.'}</div>
    </div>
  )
}

function ClosetPanel({ onClose }) {
  const wardrobe = useGame((s) => s.wardrobe)
  const bond = useGame((s) => s.needs.bond)
  const wear = useGame((s) => s.wear)
  const lvl = bondLevel(bond)
  return (
    <div className="card panel">
      <div className="panel-head">
        <span>Closet</span>
        <button className="panel-close" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
      </div>
      <div className="closet">
        {ACCESSORIES.map((a) => {
          const locked = lvl < a.level
          const on = wardrobe[a.slot] === a.id
          return (
            <button
              key={a.id}
              className={`closet-item ${on ? 'on' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => {
                if (locked) { sfx.nope(); useGame.getState().toast(`Reach bond level ${a.level} to unlock the ${a.label.toLowerCase()}`); return }
                sfx.click()
                wear(a.id)
              }}
            >
              <span className={`swatch swatch-${a.id}`}>{locked && <Icon name="lock" size={16} />}</span>
              <span>{a.label}</span>
              <small>{locked ? `Bond ${a.level}` : on ? 'Wearing' : 'Tap to wear'}</small>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function UI() {
  const needs = useGame((s) => s.needs)
  const tool = useGame((s) => s.tool)
  const setTool = useGame((s) => s.setTool)
  const scene = useGame((s) => s.scene)
  const setScene = useGame((s) => s.setScene)
  const muted = useGame((s) => s.muted)
  const setMuted = useGame((s) => s.setMuted)
  const items = useGame((s) => s.items)
  const lvl = bondLevel(needs.bond)
  const [tip, setTip] = useState(null)
  const [panel, setPanel] = useState(null)
  const daily = useGame((s) => s.daily)
  const goalsDone = Object.entries(daily.goals).filter(([id, v]) => v >= GOAL_POOL.find((g) => g.id === id).target).length
  const togglePanel = (p) => { sfx.click(); setPanel(panel === p ? null : p) }
  // Gently point at whatever the bunny needs most.
  const nudge = {
    food: needs.food < 25,
    water: needs.water < 25,
    brush: needs.clean < 25,
    pet: needs.joy < 30
  }

  const chooseTool = (t) => {
    sfx.click()
    setTool(t.id)
    setTip(t.tip)
  }
  useEffect(() => {
    if (!tip) return
    const id = setTimeout(() => setTip(null), 2600)
    return () => clearTimeout(id)
  }, [tip])

  return (
    <div className="hud">
      <div className="card status">
        <div className="status-head">
          <NameTag />
          <span className="mood">{moodOf(needs)}</span>
        </div>
        <BondHearts bond={needs.bond} />
        <div className="meters">
          <Meter icon="carrot" label="Food" value={needs.food} hue="#ffa94d" />
          <Meter icon="drop" label="Water" value={needs.water} hue="#5cc8ff" />
          <Meter icon="sparkle" label="Coat" value={needs.clean} hue="#c9a7ff" />
          <Meter icon="smile" label="Joy" value={needs.joy} hue="#ff7eb3" />
        </div>
      </div>

      <div className="top-right">
        <button
          className="round-btn"
          onClick={() => { sfx.click(); setScene(scene === 'bedroom' ? 'garden' : 'bedroom') }}
          aria-label={scene === 'bedroom' ? 'Go to the garden' : 'Go to the bedroom'}
        >
          <Icon name={scene === 'bedroom' ? 'tree' : 'home'} size={20} />
          <span>{scene === 'bedroom' ? 'Garden' : 'Bedroom'}</span>
        </button>
        <button className={`round-btn icon-only ${panel === 'goals' ? 'active' : ''}`} onClick={() => togglePanel('goals')} aria-label="Daily goals">
          <Icon name="star" size={20} />
          <span className={`badge ${goalsDone === 3 ? 'all' : ''}`}>{goalsDone}/3</span>
        </button>
        <button className={`round-btn icon-only ${panel === 'closet' ? 'active' : ''}`} onClick={() => togglePanel('closet')} aria-label="Closet">
          <Icon name="bow" size={20} />
        </button>
        <button className="round-btn icon-only" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'}>
          <Icon name={muted ? 'soundOff' : 'soundOn'} size={20} />
        </button>
      </div>

      {panel === 'goals' && <GoalsPanel onClose={() => setPanel(null)} />}
      {panel === 'closet' && <ClosetPanel onClose={() => setPanel(null)} />}
      <Toasts />
      {tip ? <div className="tool-tip">{tip}</div> : <Hint />}
      <LevelBanner />

      <div className="tricks">
        {TRICKS.map((t) => {
          const locked = lvl < t.level
          return (
            <button
              key={t.id}
              className={`trick ${locked ? 'locked' : ''}`}
              onClick={() => {
                if (locked) {
                  sfx.nope()
                  useGame.getState().toast(`Reach bond level ${t.level} to unlock ${t.label}`)
                  return
                }
                sfx.click()
                sendCommand({ type: 'trick', id: t.id })
              }}
            >
              <Icon name={locked ? 'lock' : t.id} size={16} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      <div className="bottom">
        <div className="care">
          <button className={`care-btn ${nudge.food ? 'nudge' : ''}`} disabled={items.some((i) => i.kind === 'food')} onClick={() => placeBowl('food')}>
            <Icon name="bowl" size={22} />
            <span>Feed</span>
          </button>
          <button className={`care-btn water ${nudge.water ? 'nudge' : ''}`} disabled={items.some((i) => i.kind === 'water')} onClick={() => placeBowl('water')}>
            <Icon name="drop" size={22} />
            <span>Water</span>
          </button>
        </div>
        <div className="dock">
          {TOOLS.map((t) => (
            <button key={t.id} className={`tool ${tool === t.id ? 'active' : ''} ${nudge[t.id] && tool !== t.id ? 'nudge' : ''}`} onClick={() => chooseTool(t)}>
              <Icon name={t.icon} size={24} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
