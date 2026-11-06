# Golden Hour Bunny

A cozy 3D bunny companion for mobile Safari (landscape or portrait) and desktop browsers.

Visit your bunny in a sunlit bedroom or a golden-hour garden. Stroke it, brush it, feed it carrots from your hand, toss a ball for it to chase, and teach it tricks as your bond grows.

## How to play

- **Pet**: stroke slowly with your finger. Forehead and cheeks are favourites, back strokes are nice, ears are sensitive, and the rump and paws are off limits. Keep a gentle streak going and the bunny melts: eyes close, ears relax, cheeks blush, and it tooth-purrs. Max out its joy and it does a binky.
- **Tap the nose** for a boop.
- **Brush** along the back to clean the coat (a scruffy coat looks dull).
- **Treat**: tap the bed or grass to drop a carrot, or tap the bunny to hand-feed it.
- **Ball**: tap to toss a woven ball, or swipe to fling it. The bunny chases and nudges it around, and takes a breather after a while.
- **Feed / Water** place bowls next to the bunny.
- **Tricks** (Come, Sit up, Wave, Binky, Twirl) unlock with bond levels 1 to 5.
- **Daily goals** (star button): three small goals each day, each rewarding bond hearts.
- **Closet** (bow button): a ribbon bow, cozy scarf, flower crown and party hat unlock as your bond grows.
- Buttons gently bounce when the bunny needs food, water, brushing or attention.

Needs (food, water, coat, joy) drift down slowly over time and progress is saved in the browser.

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
