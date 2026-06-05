# Contributing to Immersions

## Running locally

1. Clone the repo
2. Start a local web server from the **parent** of `immersion_engine/`: `python3 -m http.server 9000`
3. Open `localhost:9000/immersion_engine/examples/demo/index.html` in your browser
4. Open the browser developer console (cache disabled) to debug

No build step — the engine is plain JavaScript that runs directly in the browser.

## File map

| File | Purpose |
|------|---------|
| `immersion_engine/immersion.js` | Core `Immersion` class extending `BABYLON.Scene`; initialization, navigation, XR, collectables |
| `immersion_engine/immersionUI.js` | Full-screen overlay — navigation buttons, collectable badges, sound controls |
| `immersion_engine/stands/Stand.js` | Base stand class (mesh, label, camera animation) |
| `immersion_engine/stands/Display.js` | Stand + 3D text window + audio button |
| `immersion_engine/stands/Plinth.js` | Display + 3D exhibit model |
| `immersion_engine/stands/Teleporter.js` | Stand + in-scene navigation to another stand |
| `immersion_engine/stands/Link.js` | Stand + external URL opener |
| `immersion_engine/immersion.json` | Default UI text strings (en/fr) |
| `immersion_engine/characters/character.js` | `Character` helper — loads VRM humanoid avatars, exposes poses and talking animation |
| `examples/demo/` | Comprehensive demo covering every stand type — test surface and usage reference |
| `examples/template/` | Minimal skeleton for starting new immersions |

For usage examples, see [`examples/demo/demo.js`](./examples/demo/demo.js) and [`examples/demo/demo.json`](./examples/demo/demo.json).

## Code conventions

- No framework, no build step — plain ES5-compatible JavaScript
- Class names: PascalCase (`MyImmersion`, `Stand`, `Display`)
- Stand IDs in JSON: camelCase strings (`"myStand"`, `"introDisplay"`)
- Asset paths: relative to the immersion folder (`./assets/file.mp3`)
- Avoid `var` in new code — use `const` / `let` and arrow functions in callbacks
- No `console.log` in committed code

## How to add a new stand type

1. Create `stands/MyStand.js` extending `Display` (or `Stand` for simpler types)
2. Add a `<script>` tag for it in each immersion's `index.html`, after `Display.js`
3. Register the type string in `immersion.js` `importData()` so JSON can reference it
4. Add an example stand in `examples/demo/demo.json` and wire it in `demo.js`
5. Document the new type in the file map above

## Running tests

Tests are run using the Playwright MCP browser. See [TESTING.md](./TESTING.md) for step-by-step instructions.

Start a local server first:
```bash
python3 -m http.server 8080
```

Then follow the test cases in TESTING.md using Playwright MCP tools (`browser_navigate`, `browser_evaluate`, `browser_console_messages`).

## License

This project is licensed under the [Apache 2.0 License](./LICENSE).

The [NOTICE](./NOTICE) file lists attribution requirements. Any published immersion must include a visible link back to the project homepage — see NOTICE for the exact wording.
