# UI and animation rules

Target: a 60 FPS floor, 120 FPS on high-refresh displays. Every interaction is interruptible.

## Thread discipline

Animate on the compositor. If a value animates, it is `transform`, `opacity` or `filter`,
driven by CSS or by Motion. Never animate from a `setInterval`, and never re-render React
per frame to move something.

```tsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }} />
```

## Properties

Animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`,
`margin`, or `padding` — they force layout every frame. Size changes use `scale`.

## Curves

- Gesture-driven, and anything the user can grab: spring, continuing from release velocity.
  Never a fixed duration on a spring.
- Discrete state change (fade, colour, reveal): 150-250 ms, `easeOut`.
- Never linear, except for a continuous loop such as an ambient shimmer.
- Interruptible always. A new gesture retargets the running spring, it does not queue behind it.

## Which library

- **Motion** (`motion/react`) for React enter/exit and state transitions. This is the default.
- **CSS** for anything a `transition` or `@keyframes` already does — the modal uses
  `@starting-style` with `transition-behavior: allow-discrete` and needs no JS at all.
- **GSAP** only for an imperative timeline that Motion cannot express. If a change would
  be the first GSAP use in the codebase, it probably does not need GSAP.

## Skia

`canvaskit-wasm` draws the flowchart canvas. See `architecture.md` for the loading rules —
lazy, story-map only, labels in a DOM overlay.

- Pan and pinch are Pointer Events feeding one `{x, y, scale}` state, applied as a canvas
  transform and as a matching CSS transform on the label overlay. Set `touch-action: none`.
- Node glow, the vignette and the crimson failure spline are Skia paints and paths, not
  stacked divs with a box-shadow.
- Failure branches are a dashed crimson `Path` via `PathEffect.MakeDash`. Success is an
  emerald badge.
- Precompute layout in `useMemo` keyed on graph identity. Never build a `Path` in render.
- Every Skia object you `new` must be `delete`d. Paints and paths are wasm allocations and
  the GC will not collect them.

## React Three Fiber

The D20 roller runs `frameloop="demand"` and calls `invalidate()` only while the die is
in motion. It must not hold the GPU awake between rolls. It is lazy-loaded, because
`three` is the largest thing in the bundle.

- Geometry and procedural textures are created once in `useMemo` and reused across rolls.
- The landing face comes from the server roll, then the die is slerped to the matching
  quaternion. The tumble is decoration over an already-known result.
- `navigator.vibrate` fires on impact and on settle, never per frame. It is absent on
  desktop; guard for it rather than assuming it.

## Audio

`HTMLAudioElement` only.

- Three channels: Voice (sentence queue), Ambience (looped bed), Foley (one-shots).
- The queue advances on the `ended` event, never a poll. Handle `error` too, or one bad
  URL stalls the whole queue.
- `play()` rejects before a user gesture. Catch it; never let it become an unhandled
  rejection.
- Cinema Mode gates the typewriter on sentence audio. The next sentence reveals when the
  current clip ends, not on a timer.
- A tap anywhere reveals the full passage instantly and drops the gate.

## Accessibility

Honour `prefers-reduced-motion` through `useReducedMotion()`. Reduced motion replaces
travel with a cross-fade and skips the dice tumble straight to the result face. It never
removes information, only movement.

Controls come from `components/ui` (shadcn on Radix), never raw elements in a screen —
see `~/.claude/rules/ui-craft.md`. Radix carries the focus trap, the roving tabindex and
the ARIA wiring; a `div` with an `onClick` is a bug, not a style choice.
