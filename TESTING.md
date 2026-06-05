# Testing

Run with Playwright MCP. Start a local server first (e.g. `npx serve . -p 8080` from the repo root).

## 1. Page load
- `browser_navigate` → `http://localhost:8080/examples/demo/index.html`
- `browser_wait_for` → `BABYLON.Engine.LastCreatedEngine?.scenes?.[0]?.isReady?.()` (timeout 15s)
- Wait ~4s for assets to finish loading
- `browser_console_messages` (level: error) → assert empty (ignore: "immersive-vr", "favicon")

## 2. UI buttons
- `browser_evaluate` → check all buttons exist and are initialised:
  ```js
  const ui = BABYLON.Engine.LastCreatedEngine.scenes[0].immersionUI;
  return { sound: !!ui.soundButton, about: !!ui.aboutButton, exit: !!ui.exitButton,
           next: !!ui.nextButton, prev: !!ui.previousButton, current: !!ui.currentButton,
           fullImmersionVisible: ui.fullImmersionButton?.isVisible, lockBadges: ui.lockBadges.length }
  ```
- Assert all buttons truthy, fullImmersionVisible false, lockBadges > 0

## 3. Sound button toggle
- `browser_evaluate` → get icon source before: `BABYLON.Engine.LastCreatedEngine.scenes[0].immersionUI.soundButton.image.source`
- `browser_evaluate` → trigger click: `BABYLON.Engine.LastCreatedEngine.scenes[0].immersionUI.soundButton.onPointerUpObservable.notifyObservers({})`
- `browser_evaluate` → get icon source after
- Assert icon changed
- `browser_evaluate` → trigger click again to restore state

## 4. Navigation through all stands
- `browser_evaluate` → go to first stand: `BABYLON.Engine.LastCreatedEngine.scenes[0].setCurrentStand('entrance')`
- `browser_evaluate` → loop through all stands (stops at last non-Link stand):
  ```js
  const scene = BABYLON.Engine.LastCreatedEngine.scenes[0];
  const visited = [scene.currentStandIndex];
  for (let i = 0; i < scene.stands.length - 1; i++) {
    scene.goNextStand();
    visited.push(scene.currentStandIndex);
  }
  return visited;
  ```
- Assert visited goes 0→7 (Link stands at index 8–9 are skipped)
- `browser_console_messages` (level: error) → assert no new errors

## 5. URL modes
For each mode in `dvp`, `screenshot`, `menu`, `cinematic`:
- `browser_navigate` → `http://localhost:8080/examples/demo/index.html?mode=<mode>`
- `browser_wait_for` → scene ready
- Wait ~4s
- `browser_console_messages` (level: error) → assert no new errors

## 6. dest param
- `browser_navigate` → `http://localhost:8080/examples/demo/index.html?dest=entrance`
- `browser_wait_for` → scene ready
- Wait ~4s
- `browser_console_messages` (level: error) → assert no new errors
