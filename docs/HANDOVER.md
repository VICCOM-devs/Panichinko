# Panichinko – handover (updated 2026-10-28)

## Where things live
- **Repo: `VICCOM-devs/panichinko` (source of truth since 2026-10-28).** `demo/index.html` is the playable demo, `tools/build_itch.py` builds the itch zip, `tools/heatmap/` holds the drop heatmap, `tests/` has the Playwright tests, and CI is in `.github/workflows/demo.yml`.
- GDD (Claude Doc): https://claude.ai/artifact/D4UfVajWPZuoE9kdZb4dc1
- Claude preview of the demo (artifact, version 1793185312-61d1 = v0.1.0): https://claude.ai/artifact/8mVqBQW2tH3fU8yJxBq4Jy. It's a copy for quick play in the browser; edit the repo first.
- itch.io build: `panichinko-demo-v0.1.0-html5.zip`, built by CI (artifact `itch-html5`) or with `python3 tools/build_itch.py 0.1.0`.

## Core design
- 1 Biggie (pachinko player) vs up to 4 Tinies inside the board. 2-minute rounds. Coin:Tiny scale 1:5 minimum, with a slider.
- PC first (16:9/16:10 full screen, wider screens supported in settings), itch.io demo, then Steam, then mobile.
- Engine for the real game: Godot 4 + GDScript. The HTML demo is for testing feel and rules only.

## Scoring (current numbers)
- Tinies: no death penalty. Death = about 5 s respawn with no scoring, and the streak resets.
- Survival: 2 pts/s × zone multiplier × streak (streak +0.25 every 10 s alive, max ×2.5).
- Zones: rectangles with ×0 to ×10. Where zones overlap the lower value wins. Exceptions: spinner top, tulips and ghost pegs override.
- Tiny extras: flips +5, coin surfing +12/s, shinies +25, close calls, spinner and tulip bonuses.
- Biggie: kill = 60 × credit × multikill multiplier. Falls caused by a coin hit or tilt give partial credit. Tulip catch +5. Tilt has 3 charges and regains 1 every 15 s.
- Max 9 coins on the board at once.

## Tiny controls
- A/D move, Space jump, Shift dash, E or click to grapple (aims at the mouse), W/S reel in and out, Q power.
- Grapple lasts 4 s and reloads instantly. You can't grab the same anchor twice in a row. The rope needs line of sight (rails don't block it).

## Boards
- Classic, Clean White, Neon (moving pegs), Haunted (disappearing pegs), Tunnels (coin holes in the walls with short ramps; about a third of coins tunnel and none get stuck in simulation).

## Streamer mode (v0.1.0, decided 2026-10-28: itch.io build first, local multiplayer later)
- Main menu → Streamer mode: Twitch channel name, on/off, "Chat helps" (both sides / Biggie / Tinies), vote every 20–90 s (default 35), vote lasts 10–30 s (default 15), "Practice with fake chat".
- Reads chat anonymously over Twitch IRC WebSocket (`wss://irc-ws.chat.twitch.tv`, justinfan login). No OAuth or tokens, and it never posts. It reconnects with backoff and auto-connects on launch if a channel is saved.
- Viewers type 1, 2 or 3 (also `!1`, `#1`, `!vote 1`). One vote per viewer and the last one counts. A tie is broken at random. With no votes, nothing happens. No votes start in the last ~20 s of a round.
- Pool: Biggie = double coins, 2x drop speed, slow Tinies, board shake, refill tilts, coin rain (3 coins, respects the 9-coin cap). Tinies = second chance for all, powerups for all, shiny shower, instant respawn, heal + 3 s shield. Neutral = 2 mystery orbs. Chaos mode always offers at least one Biggie and one Tiny option.
- Panel on the left side in Twitch purple. It shrinks below 700 px height and is hidden on touch devices.
- Covered by `tests/streamer.spec.js` (mocked IRC). Not yet tested against real Twitch chat; the artifact sandbox probably blocks the WebSocket, so test it on itch.

## Feel, gore and presentation
- Ragdoll corpses with dismemberment, bleeding and gibs. Blood accumulates on pegs and fills the slots. Corpses never affect gameplay. Confetti mode replaces gore.
- Cel-shaded art with per-board themes. Respawn beam in the Tiny's colour.
- Procedural audio and music. Four Tiny voices (low male, high male, low female, high female). Four death screams, never the same twice in a row. The Biggie hears a lowered scream over a wet squish. Three hurt grunts. Rare Tarzan yell on swings.
- No instant replays. Highlights play on the score screen. Multikills frame the coin and all its victims with a smooth camera. Multi-evades follow the Tiny.
- Optional weak CRT look (WebGL chromatic aberration, vignette, scanlines) that switches itself to a cheaper version if the frame rate drops.
- Offline play uses bots. Tiny bots are a mix of easy, normal and hard. The Biggie bot can be set to easy, normal or brutal. First-time hints are on.

## Open decisions
- Online play is built in Godot. Hosting is open: relay or dedicated server.
- iOS build machine: Mac or cloud Mac.
- The demo is English only. House rule is Swedish + English, so a language toggle is needed before a public itch launch (or the page is marked as an English-only test build).
- itch.io page: restricted (testers only, secret URL) or public.

## Next steps
1. Victor creates the itch.io project (HTML5, embed 1280×720, fullscreen button on, mobile-friendly off), uploads the zip and tests streamer mode on VICCOM_Games.
2. Victor playtests and gives feedback on the vote options and timing.
3. Swedish/English language toggle for the demo.
4. Victor installs Godot 4.
5. Godot vertical slice in this repo (`game/`): board, coin physics, one Tiny, one Biggie, local play. Then the online prototype. Local multiplayer (mouse vs gamepads) comes later.
