import * as THREE from 'three'

// Small procedural canvas textures (no image downloads).
const cache = {}

function canvasTex(key, size, draw, repeat = [1, 1]) {
  if (cache[key]) return cache[key]
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  draw(ctx, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.anisotropy = 4
  cache[key] = t
  return t
}

function grain(ctx, size, amount, alpha = 0.06) {
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
}

export const quiltTexture = () => canvasTex('quilt', 512, (x, s) => {
  x.fillStyle = '#f6e8dc'
  x.fillRect(0, 0, s, s)
  grain(x, s, 9000, 0.05)
  // Diamond stitching.
  x.strokeStyle = 'rgba(190,150,130,0.45)'
  x.lineWidth = 2
  x.setLineDash([7, 6])
  const step = s / 4
  for (let i = -s; i <= s * 2; i += step) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + s, s); x.stroke()
    x.beginPath(); x.moveTo(i, s); x.lineTo(i + s, 0); x.stroke()
  }
  x.setLineDash([])
  // Tiny embroidered flowers in some diamonds.
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if ((row + col) % 2) continue
      const cx = col * step + step / 2
      const cy = row * step
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2
        x.fillStyle = 'rgba(232,150,160,0.7)'
        x.beginPath(); x.arc(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 4, 0, Math.PI * 2); x.fill()
      }
      x.fillStyle = 'rgba(245,200,110,0.9)'
      x.beginPath(); x.arc(cx, cy, 3.5, 0, Math.PI * 2); x.fill()
    }
  }
}, [3, 3])

export const knitTexture = () => canvasTex('knit', 256, (x, s) => {
  x.fillStyle = '#d9a441'
  x.fillRect(0, 0, s, s)
  for (let yy = 0; yy < s; yy += 16) {
    for (let xx = 0; xx < s; xx += 16) {
      x.fillStyle = 'rgba(255,230,170,0.35)'
      x.beginPath(); x.ellipse(xx + 4, yy + 8, 3.5, 7, -0.5, 0, Math.PI * 2); x.fill()
      x.fillStyle = 'rgba(120,70,10,0.25)'
      x.beginPath(); x.ellipse(xx + 12, yy + 8, 3.5, 7, 0.5, 0, Math.PI * 2); x.fill()
    }
  }
}, [8, 2])

export const woodTexture = () => canvasTex('wood', 512, (x, s) => {
  const planks = 6
  const h = s / planks
  for (let i = 0; i < planks; i++) {
    const tone = 120 + Math.random() * 30
    x.fillStyle = `rgb(${tone + 40},${tone - 5},${tone - 45})`
    x.fillRect(0, i * h, s, h)
    for (let g = 0; g < 40; g++) {
      x.strokeStyle = `rgba(70,35,15,${0.05 + Math.random() * 0.08})`
      x.lineWidth = 1 + Math.random()
      x.beginPath()
      const y0 = i * h + Math.random() * h
      x.moveTo(0, y0)
      x.bezierCurveTo(s * 0.3, y0 + (Math.random() - 0.5) * 8, s * 0.6, y0 + (Math.random() - 0.5) * 8, s, y0)
      x.stroke()
    }
    x.fillStyle = 'rgba(40,20,10,0.5)'
    x.fillRect(0, i * h, s, 2)
    x.fillRect(((i * 197) % s), i * h, 2, h)
  }
}, [4, 4])

export const rugTexture = () => canvasTex('rug', 512, (x, s) => {
  x.fillStyle = '#c96f53'
  x.fillRect(0, 0, s, s)
  x.strokeStyle = '#f3dcc2'
  x.lineWidth = 10
  x.strokeRect(24, 24, s - 48, s - 48)
  x.lineWidth = 4
  x.strokeRect(50, 50, s - 100, s - 100)
  x.fillStyle = '#f3dcc2'
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      const cx = 100 + i * 62
      const cy = 100 + j * 62
      x.beginPath(); x.moveTo(cx, cy - 14); x.lineTo(cx + 14, cy); x.lineTo(cx, cy + 14); x.lineTo(cx - 14, cy); x.closePath(); x.fill()
    }
  }
  grain(x, s, 12000, 0.07)
})

export const ginghamTexture = () => canvasTex('gingham', 256, (x, s) => {
  x.fillStyle = '#fff6ee'
  x.fillRect(0, 0, s, s)
  const n = 8
  const w = s / n
  for (let i = 0; i < n; i += 2) {
    x.fillStyle = 'rgba(232,96,110,0.55)'
    x.fillRect(i * w, 0, w, s)
    x.fillRect(0, i * w, s, w)
  }
  grain(x, s, 4000, 0.05)
}, [3, 3])

export const plasterTexture = () => canvasTex('plaster', 256, (x, s) => {
  x.fillStyle = '#ead2bb'
  x.fillRect(0, 0, s, s)
  grain(x, s, 14000, 0.035)
}, [4, 3])

export const skyTexture = () => canvasTex('sunsetSky', 256, (x, s) => {
  const g = x.createLinearGradient(0, 0, 0, s)
  g.addColorStop(0, '#6f6fb8')
  g.addColorStop(0.35, '#e98aa0')
  g.addColorStop(0.62, '#ffb27a')
  g.addColorStop(0.8, '#ffd58f')
  g.addColorStop(1, '#ffe6b0')
  x.fillStyle = g
  x.fillRect(0, 0, s, s)
  // Sun.
  const sg = x.createRadialGradient(s * 0.35, s * 0.74, 2, s * 0.35, s * 0.74, s * 0.32)
  sg.addColorStop(0, 'rgba(255,250,225,1)')
  sg.addColorStop(0.12, 'rgba(255,235,180,0.95)')
  sg.addColorStop(1, 'rgba(255,200,140,0)')
  x.fillStyle = sg
  x.fillRect(0, 0, s, s)
  // Distant hills.
  x.fillStyle = '#b5697a'
  x.beginPath(); x.moveTo(0, s)
  for (let i = 0; i <= 20; i++) x.lineTo((i / 20) * s, s * 0.84 - Math.sin(i * 0.7) * 10 - Math.sin(i * 1.9) * 5)
  x.lineTo(s, s); x.fill()
  x.fillStyle = '#8e5470'
  x.beginPath(); x.moveTo(0, s)
  for (let i = 0; i <= 20; i++) x.lineTo((i / 20) * s, s * 0.92 - Math.sin(i * 0.9 + 2) * 8)
  x.lineTo(s, s); x.fill()
  // Wispy clouds.
  x.fillStyle = 'rgba(255,220,220,0.35)'
  for (let i = 0; i < 6; i++) {
    x.beginPath(); x.ellipse(Math.random() * s, s * (0.15 + Math.random() * 0.35), 30 + Math.random() * 40, 4 + Math.random() * 4, 0, 0, Math.PI * 2); x.fill()
  }
})

export const beamTexture = () => canvasTex('beam', 128, (x, s) => {
  const g = x.createLinearGradient(0, 0, 0, s)
  g.addColorStop(0, 'rgba(255,220,160,0.9)')
  g.addColorStop(1, 'rgba(255,220,160,0)')
  x.fillStyle = g
  x.fillRect(0, 0, s, s)
  const h = x.createLinearGradient(0, 0, s, 0)
  h.addColorStop(0, 'rgba(0,0,0,1)')
  h.addColorStop(0.2, 'rgba(0,0,0,0)')
  h.addColorStop(0.8, 'rgba(0,0,0,0)')
  h.addColorStop(1, 'rgba(0,0,0,1)')
  x.globalCompositeOperation = 'destination-out'
  x.fillStyle = h
  x.fillRect(0, 0, s, s)
})
