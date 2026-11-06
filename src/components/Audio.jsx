import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

const Audio = forwardRef(({ muted }, ref) => {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.22
    master.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 380
    osc1.frequency.value = 98
    osc2.frequency.value = 147
    osc1.type = 'sine'
    osc2.type = 'triangle'
    const padGain = ctx.createGain()
    padGain.gain.value = 0.07
    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(padGain)
    padGain.connect(master)
    osc1.start()
    osc2.start()

    return () => {
      osc1.stop()
      osc2.stop()
      ctx.close()
    }
  }, [])

  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = muted ? 0 : 0.22
  }, [muted])

  const playSound = (type) => {
    if (muted || !ctxRef.current) return
    const ctx = ctxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime

    if (type === 'pet') {
      osc.type = 'sine'
      osc.frequency.value = 220
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    } else if (type === 'brush') {
      osc.type = 'triangle'
      osc.frequency.value = 160
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    } else if (type === 'treat' || type === 'happy') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    } else if (type === 'feed') {
      osc.type = 'sine'
      osc.frequency.value = 180
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    }

    osc.connect(gain)
    gain.connect(masterRef.current)
    osc.start()
    osc.stop(now + 0.3)
  }

  useImperativeHandle(ref, () => ({ playSound }))

  return null
})

export default Audio
