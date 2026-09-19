# UI and animation rules

Target: a 60 FPS floor, 120 FPS on ProMotion. Every interaction is interruptible.

## Thread discipline

Animation runs on the UI thread. If a value animates, it is a `useSharedValue` driven
by `react-native-reanimated` worklets. Never React state, never `setInterval`, never
`Animated` from `react-native`.

```tsx
const translateY = useSharedValue(0);
const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
```

Anything that crosses back to JS with `runOnJS` happens once, at gesture end, never per frame.

## Properties

Animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`,
`margin`, or `padding` — they force layout every frame. Size changes use `scale`, or
Reanimated `entering` / `exiting` / layout presets.

## Curves

- Gesture-driven, and anything the user can grab: `withSpring`, continuing from the
  release velocity. Never a fixed duration on a spring.
- Discrete state change (fade, colour, reveal): `withTiming`, 150-250 ms,
  `Easing.out(Easing.cubic)`.
- Never linear, except for a continuous loop such as an ambient shimmer.
- Interruptible always. A new gesture retargets the running spring, it does not queue behind it.

## Skia

`@shopify/react-native-skia` draws the flowchart canvas and the card glows.

- Pan and pinch are `react-native-gesture-handler` shared values fed straight into a
  Skia `Group` transform. The canvas never re-renders React during a drag.
- Node glow, vignette, and the crimson failure spline are shaders and `Path` objects,
  not stacked views with a shadow radius.
- Failure branches are a dashed crimson `Path` with a dash path effect. Success is an
  emerald badge.
- Precompute paths in `useMemo` keyed on graph identity. Never build a `Path` inside a render.

## React Three Fiber

The D20 roller runs `frameloop="demand"` and calls `invalidate()` only while the die is
in motion. It must not hold the GPU awake between rolls.

- Geometry and procedural textures are created once in `useMemo` and reused across rolls.
- The landing face comes from the server roll, then the die is slerped to the matching
  quaternion. The tumble is decoration over an already-known result.
- `expo-haptics` fires on impact and on settle, never per frame.

## Audio

`expo-audio` only. `expo-av` is banned.

- `setAudioModeAsync` runs once at app start.
- Three channels: Voice (sentence queue), Ambience (looped bed), Foley (one-shots).
- Cinema Mode gates the typewriter on sentence audio. The next sentence reveals when the
  current clip ends, not on a timer.
- A tap anywhere reveals the full passage instantly and drops the gate.

## Accessibility

Honour `useReducedMotion()`. Reduced motion replaces travel with a cross-fade and skips
the dice tumble straight to the result face. It never removes information, only movement.
