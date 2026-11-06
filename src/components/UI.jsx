export default function UI({ tool, setTool, muted, setMuted }) {
  return (
    <>
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

      {/* Audio toggle */}
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
