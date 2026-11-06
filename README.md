# Hannah’s Bunny Simulator

A cozy 3D bunny companion for mobile Safari (landscape or portrait) and desktop browsers.

Visit your bunny in a sunlit bedroom or a golden-hour garden. Stroke it, brush it, feed it carrots from your hand, toss a ball for it to chase, and teach it tricks as your bond grows.

## How to play

- **Pet**: stroke slowly with your finger. Forehead and cheeks are favourites, back strokes are nice, ears are sensitive, and the rump and paws are off limits. Keep a gentle streak going and the bunny melts: eyes close, ears relax, cheeks blush, and it tooth-purrs. Max out its joy and it does a binky.
- **Tap the nose** for a boop.
- **Brush** along the back to clean the coat (a scruffy coat looks dull).
- **Treat**: pick a carrot, strawberry (a favourite that sparks a binky), parsley or banana, then tap the floor to drop it or tap the bunny to hand-feed it.
- **Ball**: tap to toss a woven ball, or swipe to fling it. The bunny chases and nudges it around, and takes a breather after a while.
- **Feed / Water** place bowls next to the bunny.
- **Tricks** (Come, Sit up, Wave, Binky, Twirl) unlock with bond levels 1 to 5.
- **Daily goals** (star button): three small goals each day, each rewarding bond hearts.
- **Closet** (bow button): a ribbon bow, cozy scarf, flower crown and party hat unlock as your bond grows.
- Buttons gently bounce when the bunny needs food, water, brushing or attention. Tap a stat bar for a tip.
- **Double-tap the floor** to call the bunny over to that spot.
- **Photo mode** (camera button): the bunny poses and you can save or share the picture.
- **Re-centre** (target button) glides the camera back in front of the bunny.
- **Night time**: after 9pm the bedroom turns to moonlight and the bunny gets sleepy.
- **Visit streaks**: coming back on consecutive days gives bonus bond, and you get a note if the bunny got hungry while you were away.
- **Settings** (gear button): sound, music and effects volume, vibration (Android), reduce motion, and battery saver.
- Can be added to the home screen as an app (manifest and icons included).

Needs (food, water, coat, joy) drift down slowly over time (much more gently while you are away), and progress is saved in the browser.

## Stack

- Vite + React
- React Three Fiber, Drei, @react-three/postprocessing (bloom, vignette, ACES tone mapping)
- Zustand for game state
- Web Audio API for all sound (procedural, no audio files)

## Code layout

- `src/store.js`: needs, bond levels, tricks, toasts, persistence
- `src/world.js`: per-frame shared state (bunny position, ball, commands)
- `src/audio.js`: sound effects and ambient music box
- `src/components/Bunny.jsx`: model, animation mixer, behaviour state machine, petting
- `src/components/Toys.jsx`: ball physics, treats, bowls
- `src/components/Particles.jsx`: pooled instanced hearts, sparkles, fur puffs, confetti
- `src/components/Bedroom.jsx`, `Garden.jsx`: environments
- `src/components/UI.jsx`, `src/index.css`: HUD

## Development

```bash
npm install
npm run dev
```
