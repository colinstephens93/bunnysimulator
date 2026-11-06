import { useGame } from './store'

// Short vibrations on devices that support it (Android browsers). iOS Safari
// does not expose vibration to web pages, so this is a silent no-op there.
export function buzz(pattern = 10) {
  if (!useGame.getState().settings.haptics) return
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
  } catch (e) { /* ignore */ }
}
