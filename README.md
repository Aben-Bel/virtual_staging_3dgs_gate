# Venue Virtual Staging

Import a Gaussian splat of a venue, fly to an angle, capture it, describe the
event, and let Gemini stage the space — for hotel/venue owners to let event
planners visualize quickly.

Pure browser SPA: the user brings their own Gemini API key; the browser calls
Gemini directly. No server.

```bash
npm install
npm run dev      # http://localhost:5173
```

Paste a Gemini key (top-right), import a `.splat`, orbit to an angle, **Capture
angle**, pick presets / edit the prompt, **Stage**.

## Architecture

Strict separation — components are pure UI; everything else is layered.

```
src/
  app/         App.tsx (composition), providers.tsx (provider mounting)
  components/  PURE UI — props in, callbacks out. zero fetch, zero business state
    ui/        Button, Chip
    views/     SplatViewer (R3F), ViewThumbnails, ViewsPanel
    stage/     Original/SplatViewer + ResultPane, StageView
    config/    ApiKeyField, PresetGroup, PromptBox, ConfigPanel
  hooks/       ALL behavior — useStaging, useConnectivity, useViews, usePrompt, useApiKey
  state/
    store.ts   app data (context + reducer)
    selectors.ts
    machines/  pure (state,event)=>state: staging, connectivity, splat
  services/    swappable side-effects behind interfaces
    staging/   StagingProvider (type) + GeminiProvider (impl) + context
    splat/     SplatRenderer contract + capture context
  config/      presets.ts — chip groups, data-driven
  styles/      tokens.css (the only raw values) + global.css; components use CSS modules
  types/       shared types
```

### State machines (hand-rolled, pure)

- **staging**: `empty → ready ⇄ debouncing → loading → result | error`, with
  retry. Abort on resubmit, 300ms input debounce, 60s timeout, auto-retry on
  rate-limit (backoff) and on reconnect. Every state renders a distinct UI.
- **connectivity**: `online ⇄ offline → reconnected`; gates the Stage button.
- **splat**: load lifecycle for the viewer.

### Swappable seams (each is one file)

- `services/staging/GeminiProvider.ts` — change the backend; `Providers` injects it.
- `services/splat/SplatRenderer.ts` — the viewer/capture contract.
- `config/presets.ts` — add/edit preset groups without touching UI.

## Notes / scope

- **2D-per-angle** staging (matches "choose an angle, prompt to stage"): the
  staged image is per captured view, not inserted into the 3D splat.
- `@react-three/drei`'s `Splat` is tuned for `.splat`; `.ply`/`.ksplat` may need
  conversion. The renderer is behind a seam if you swap it.
- Matterport import is stubbed (button placeholder) per "nice-to-have later".
- API key is in-memory only (cleared on refresh).
```
