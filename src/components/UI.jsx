export default function UI({
  tool, setTool, muted, setMuted,
  hunger, thirst, cleanliness, bond,
  mode, setMode, onCare, onTrick, onCall,
  bunnyName = 'Bun'
}) {
  const needColor = (v, invert = false) => {
    const val = invert ? 100 - v : v
    if (val > 70) return '#e85d4c'
    if (val > 40) return '#f0b429'
    return '#7dcea0'
  }

  return (
    <>
      {/* Name + Status */}
      <div style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top))',
        left: 'max(16px, env(safe-area-inset-left))',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: 10,
        fontSize: '12px',
        color: '#fff',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        padding: '10px 14px',
        borderRadius: '14px',
        minWidth: '110px'
      }}>
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{bunnyName}</div>
        <div style={{ color: needColor(hunger, true) }}>Hunger: {Math.round(hunger)}</div>
        <div style={{ color: needColor(thirst, true) }}>Thirst: {Math.round(thirst)}</div>
        <div style={{ color: needColor(cleanliness) }}>Coat: {Math.round(cleanliness)}</div>
        <div style={{ color: '#aed6f1' }}>Bond: {Math.round(bond)}</div>
      </div>

      {/* Mode + Call */}
      <div style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        <button onClick={() => setMode(mode === 'home' ? 'walk' : 'home')} style={careBtn}>
          {mode === 'home' ? 'Walk' : 'Home'}
        </button>
        <button onClick={onCall} style={careBtn}>Call</button>
      </div>

      {/* Care */}
      <div style={{
        position: 'fixed',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        left: 'max(16px, env(safe-area-inset-left))',
        display: 'flex',
        gap: '8px',
        zIndex: 10,
        flexWrap: 'wrap',
        maxWidth: '55%'
      }}>
        <button onClick={() => onCare('feed')} style={careBtn}>Feed</button>
        <button onClick={() => onCare('water')} style={careBtn}>Water</button>
        <button onClick={() => onCare('brush')} style={careBtn}>Brush</button>
        <button onClick={() => onCare('treat')} style={careBtn}>Treat</button>
      </div>

      {/* Tricks */}
      <div style={{
        position: 'fixed',
        bottom: 'max(72px, env(safe-area-inset-bottom) + 56px)',
        left: 'max(16px, env(safe-area-inset-left))',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        <button onClick={() => onTrick('sit')} style={careBtn}>Sit</button>
        <button onClick={() => onTrick('lie')} style={careBtn}>Lie</button>
      </div>

      {/* Tool toggle */}
      <div style={{
        position: 'fixed',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        right: 'max(16px, env(safe-area-inset-right))',
        display: 'flex',
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
        borderRadius: '999px',
        padding: '6px',
        zIndex: 10
      }}>
        <button
          onClick={() => setTool('hand')}
          style={{
            background: tool === 'hand' ? 'rgba(255,255,255,0.25)' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '999px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Hand
        </button>
        <button
          onClick={() => setTool('brush')}
          style={{
            background: tool === 'brush' ? 'rgba(255,255,255,0.25)' : 'transparent',
            border: 'none',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '999px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Brush
        </button>
      </div>

      {/* Mute */}
      <button
        onClick={() => setMuted(m => !m)}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 'max(16px, env(safe-area-inset-right))',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#fff',
          width: 36,
          height: 36,
          borderRadius: '50%',
          fontSize: '16px',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  )
}

const careBtn = {
  background: 'rgba(255,255,255,0.18)',
  border: 'none',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)'
}
