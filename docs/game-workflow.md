# AA Game Workflow

AA Game uses Phaser as the runtime engine and Tiled as the level data editor.

## Phaser

Phaser still owns rendering, input, scene updates, physics, animation playback, and browser hosting.

Main runtime code:

- `src/scenes/JobScene.ts`: job gameplay orchestration.
- `src/entities/Player.ts`: player movement and animation states.
- `src/systems/WindowManager.ts`: window visuals and cleaning progress.

## Tiled

The current job level is stored here:

- `public/assets/maps/andersen-auto-service.json`

Open that file in Tiled to edit:

- `windows`: all cleanable window objects.
- `spawns`: player, van, cleaning kit, Ronny, and ladder roof position.
- `zones`: movement lane, van ladder pickup zone, and wall ladder placement zone.

Window objects use Tiled top-left coordinates. The loader converts them to center-based Phaser coordinates.

## State Machine

The shared state machine utility lives here:

- `src/systems/StateMachine.ts`

The player currently uses these states:

- `idle`
- `walking`
- `soaping`
- `squeegee`
- `ladder-idle`
- `ladder-climbing`

When adding jump, inventory, attacking, talking, or job tools, add a named state first. That keeps animation and input rules in one predictable flow.

## Addons

Lightweight project-specific addons live in:

- `src/addons`

Current addon:

- `testMode.ts`: enables fast gameplay timings when the URL has `?test=1`.

Normal game timing stays unchanged. Automated tests use fast timing so a full gameplay pass takes seconds instead of minutes.

## Test Mode

Run the app normally:

```bash
npm run dev -- --port 5173
```

Open normal mode:

```text
http://127.0.0.1:5173/
```

Open fast test mode:

```text
http://127.0.0.1:5173/?test=1
```

Run e2e:

```bash
npm run test:e2e
```

## Local Level Editor

Run the editor:

```bash
npm run editor
```

Or open it while the dev server is running:

```text
http://127.0.0.1:5173/level-editor.html
```

The editor can drag windows, spawns, and zones, validate required objects, and export the updated Tiled JSON.

Gameplay rules are documented in:

- `docs/game-mechanics-rules.md`

Shared tuning values live in:

- `src/data/gameRules.ts`
