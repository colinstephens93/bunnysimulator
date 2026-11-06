import { useEffect, useRef } from 'react'

export default function Audio({ muted, onStroke, tool }) {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.25
    master.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master

    // Simple warm ambient pad (lo-fi style placeholder)
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420
    osc1.frequency.value = 110
    osc2.frequency.value = 165
    osc1.type = 'sine'
    osc2.type = 'triangle'
    const padGain = ctx.createGain()
    padGain.gain.value = 0.08
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
    if (masterRef.current) {
      masterRef.current.gain.value = muted ? 0 : 0.25
    }
  }, [muted])

  // Expose stroke sound
  useEffect(() => {
    if (!onStroke || !ctxRef.current) return
    // This is called from parent; we can attach a method if needed
  }, [onStroke])

  // Simple petting noise on demand (called via ref if extended)
  const playPet = (isBrush = false) => {
    if (muted || !ctxRef.current) return
    const ctx = ctxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = isBrush ? 180 : 90
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc.connect(gain)
    gain.connect(masterRef.current)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  }

  return null
}
