# Panichinko

Asymmetric pachinko multiplayer by VICCOM: one **Biggie** drops coins, up to four **Tinies** try to survive inside the board.

| Folder | What |
|---|---|
| `demo/` | The playable HTML5 demo (single `index.html`). Used to test feel and rules, and shipped on itch.io. |
| `tools/build_itch.py` | Builds the itch.io upload: strips the test hook, writes `dist/panichinko-demo-vX.Y.Z-html5.zip`. |
| `tools/heatmap/` | Coin drop heatmap (1,000 simulated drops). |
| `tests/` | Playwright tests: streamer mode with a mocked Twitch chat, plus a smoke test for both roles. |
| `docs/HANDOVER.md` | Current state, decisions and next steps. |

The real game will be built in Godot 4 (GDScript) in this repo later.

## Run and build

```bash
npm install && npx playwright install chromium
npm test                          # tests against demo/index.html
python3 tools/build_itch.py 0.1.0 # makes dist/panichinko-demo-v0.1.0-html5.zip
npm run test:dist                 # smoke-tests the built file
```

CI (`.github/workflows/demo.yml`) runs the tests on every push and PR and attaches the itch zip as a build artifact.

## Releasing the demo

1. Bump the version in the main menu footer (`Panichinko demo vX.Y.Z` in `demo/index.html`) and add a line to `CHANGELOG.md` (Swedish + English).
2. Merge to `main`, download the `itch-html5` artifact from the CI run (or build locally).
3. Upload to itch.io (HTML, embed 1280×720, fullscreen button on).
4. Publish the same `demo/index.html` to the Claude preview artifact if it's in use.
