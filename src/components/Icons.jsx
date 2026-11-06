// Small inline SVG icon set (stroke icons, inherit currentColor).
const P = {
  hand: <><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5" /><path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M17 11.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.6 15.6a1.6 1.6 0 0 1 2.5-2L8 15.5" /></>,
  brush: <><path d="M14 4l6 6" /><path d="M12.5 5.5l6 6-7 7a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8z" /><path d="M8 14l-1 1M10 16l-1 1M6 12l-1 1" /></>,
  carrot: <><path d="M15.5 8.5L4 20c-.5.5 0 1 .5.5L16 9" /><path d="M15.5 8.5c2-2 4.5-2 5.5-1-1 1-1 3.5-3 5.5" /><path d="M15.5 8.5c-2 2-5 6.5-7 9" /><path d="M16 3c0 2 .5 3.5 1.5 4.5M21 8c-2 0-3.5-.5-4.5-1.5" /></>,
  ball: <><circle cx="12" cy="12" r="9" /><path d="M5 6c4 2 6 7 5 15M19 6c-4 2-6 7-5 15M3.5 10c5 1.5 12 1.5 17 0" /></>,
  bowl: <><path d="M3 11h18a9 9 0 0 1-18 0z" /><path d="M8 8c0-1 1-2 2-2M12 8c0-1.5 1-3 2.5-3M16 8c0-.8.6-1.5 1.5-1.5" /></>,
  drop: <path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12z" />,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" /></>,
  heart: <path d="M12 20s-7.5-4.6-9-9.5C2 7 4.5 4.5 7.5 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3 0 5.5 2.5 4.5 6-1.5 4.9-9 9.5-9 9.5z" />,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2" /><path d="M9 9.5h.01M15 9.5h.01" /></>,
  soundOn: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>,
  soundOff: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M17 9l5 6M22 9l-5 6" /></>,
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></>,
  tree: <><path d="M12 22v-6" /><path d="M12 3c-3.5 0-6 2.7-6 6 0 1 .3 2 .8 2.8A4 4 0 0 0 9 18.5h6a4 4 0 0 0 2.2-6.7c.5-.8.8-1.8.8-2.8 0-3.3-2.5-6-6-6z" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  come: <><path d="M12 4v13" /><path d="M6 12l6 6 6-6" /></>,
  sit: <><path d="M7 20h10" /><path d="M9 20v-6a3 3 0 0 1 6 0v6" /><circle cx="12" cy="7" r="3" /></>,
  wave: <><path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.2 0-3.8-1-5-3l-2-3.5a1.5 1.5 0 0 1 2.5-1.6L7 13" /><path d="M18 3c1.5.8 2.5 2.2 3 4" /></>,
  binky: <><path d="M4 20c2-6 5-9 8-9s6 3 8 9" /><path d="M12 3v4M8.5 5l1 2.5M15.5 5l-1 2.5" /></>,
  twirl: <><path d="M20 12a8 8 0 1 1-3-6.2" /><path d="M17 2v4h4" /></>,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  bow: <><path d="M12 12L4.5 7.5v9zM12 12l7.5-4.5v9z" /><circle cx="12" cy="12" r="1.8" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  zzz: <path d="M5 6h6l-6 8h6M14 4h5l-5 6h5" />
}

export default function Icon({ name, size = 22, stroke = 2, fill = 'none', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
      {P[name]}
    </svg>
  )
}
