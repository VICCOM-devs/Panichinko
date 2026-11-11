# Panichinko – handover (updated 2026-11-11, v0.3.0)

## Where things live
- **Repo: `VICCOM-devs/panichinko` (source of truth since 2026-10-28).** `demo/index.html` is the playable demo, `tools/build_itch.py` builds the itch zip, `tools/heatmap/` holds the drop heatmap, `tests/` has the Playwright tests (`flow.spec.js` covers the hook, shelter, progression), and CI is in `.github/workflows/demo.yml`.
- GDD (Claude Doc): https://claude.ai/artifact/D4UfVajWPZuoE9kdZb4dc1
- Claude preview of the demo: https://claude.ai/artifact/8mVqBQW2tH3fU8yJxBq4Jy. It's a copy for quick play in the browser; edit the repo first. Online play and Twitch probably don't work inside the artifact sandbox.
- itch.io build: `panichinko-demo-v0.3.0-html5.zip`, built by CI (artifact `itch-html5`) or with `python3 tools/build_itch.py 0.3.0`. Page: viccom-games.itch.io/panichinko.

## Core design
- 1 Biggie (pachinko player) vs up to 4 Tinies inside the board. 2-minute rounds. Coin:Tiny scale 1:5 minimum, with a slider.
- PC first (16:9/16:10 full screen, wider screens supported in settings), itch.io demo, then Steam, then mobile.
- Engine for the real game: Godot 4 + GDScript. The HTML demo is the public itch.io demo and the place to test feel and rules.

## Online play (v0.2.0, decided 2026-10-28: online from the start)
- Peer-to-peer WebRTC, host-authoritative. Supabase Realtime on the Wobble Wheels project is used only for signalling (broadcast + presence, no tables). Room codes (4 letters) + quick match. Up to 5 players, and bots fill empty seats. Details and limits: `docs/ONLINE.md`.
- No TURN server yet, so roughly 1 in 10 players on strict networks can't connect. Add TURN when that shows up in feedback.
- Tested over a same-origin test transport (`?sig=local`). **Not yet tested over real Supabase or between two real networks.** That's the first thing to check on itch.

## Scoring (current numbers)
- Tinies: no death penalty. Death = about 5 s respawn with no scoring, and the streak resets.
- Survival: 2 pts/s × zone multiplier × streak (streak +0.25 every 10 s alive, max ×2.5).
- Zones: rectangles with ×0 to ×10. Where zones overlap the lower value wins. Exceptions: spinner top, tulips and ghost pegs override.
- Tiny extras: flips +5, coin surfing +12/s, shinies +25, close calls, spinner and tulip bonuses.
- Biggie: kill = 60 × credit × multikill multiplier. Falls caused by a coin hit or tilt give partial credit. Tulip catch +5. Tilt has 3 charges and regains 1 every 15 s.
- Max 9 coins on the board at once.

## Tiny controls
- A/D move, Space jump, Shift dash, click to shoot the grappling hook (E works too), W/S reel in and out, Q power.
- **Aimed hook (v0.3.0, default with a mouse):** the hook is a projectile (1150 u/s, range 3 peg gaps) that flies exactly where the cursor points and sticks to the first thing it hits: pegs, walls, rails, ramps, dividers, the floor, tulips, shelter lids and spinner blades. On a spinner it attaches to the exact point it hit and that point turns with the spinner. Out of range (or out the open top) is a miss and costs a 0.35 s reload. A dashed aim line shows the path and rings the point it would hit. Climbing on top with jump only works on pegs and caps, not on surface points. Hooking again before landing gives a chain bonus (+1 to +5), shots over 2.2 peg gaps give Long shot +3. The old rope stays attached until the new hook lands.
- Assisted hook (the old snap-to-peg version) is still there: Settings → Grapple hook. Touch, keyboard-only play and bots always use it. It gets no chain or long-shot bonus.
- Grapple lasts 4 s. The rope needs line of sight (rails and shelter lids don't block it).
- Shelter power: the lid blocks coins but is a one-way hatch for Tinies. Jump up through it, stand on it, hold S to drop back in.

## Animation (v0.3.0)
- Tinies: pose states cross-fade instead of snapping (`poseBlend`), the air pose is continuous from take-off to fall, squash-and-stretch spring on jump and landing, head nod from acceleration, quick turn when facing flips, blinking, rope sag, throwing arm follows the hook.
- Hand: pinches the next coin, lets go with a recoil, reaches up for a new coin during the cooldown, and leans against its movement on a spring. Hand movement eases into the target instead of stopping dead. All of it is draw-side (`handVis`), so online clients get it for free.

## Progression (v0.3.0, local storage `pch_prog`)
- XP per finished round: 20 + score/10, +25 for a new personal best, day-streak bonus (15 × streak, max 7) on the first round of the day, plus challenge rewards. Level L ends at 50·L·(L+1) XP.
- Three daily challenges, seeded by the date (one Tiny, one Biggie, one any). Progress adds up over the day.
- Unlocks in Main menu → Locker & challenges: 9 hats (level 2–16, a 3-day streak, 8 challenges) and 7 coin skins (level 3–14, 20 challenges). Hats and the Biggie's coin skin sync online. Bots wear random hats and a bot Biggie uses a random coin skin, to show them off.
- Not done yet: accounts or cloud save (progress is per browser), online leaderboards, unlockable boards and pegs.

## Spawning
- Tinies only spawn in the bottom third of the board (spawn points with y ≥ 67 % of the height), still picking the spot furthest from falling coins. Shinies still appear all over the board.

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
- Online play in Godot later: keep the same P2P + signalling model, or move to a relay or dedicated server for Steam (Steam has its own P2P networking).
- TURN provider for players who can't connect peer-to-peer (Cloudflare or metered.ca).
- iOS build machine: Mac or cloud Mac.
- The demo is English only. House rule is Swedish + English, so a language toggle is needed before a public itch launch (or the page is marked as an English-only test build).
- itch.io page: restricted (testers only, secret URL) or public.

## Next steps
0. Victor merges the v0.3.0 PR, playtests the aimed hook (range, hook speed, reload time, whether the aim line makes it too easy, and whether hooking walls and the floor makes climbing too easy) and the XP pace.
1. Victor creates the itch.io project (HTML5, embed 1280×720, fullscreen button on, mobile-friendly off) as Restricted, uploads the v0.3.0 zip and tests online play on two different networks (PC + phone hotspot laptop, or a friend) and streamer mode on VICCOM_Games.
2. Victor playtests and gives feedback on the vote options and timing.
3. Swedish/English language toggle for the demo.
4. Victor installs Godot 4.
5. Client-side prediction for your own Tiny if the input delay feels bad.
6. Godot vertical slice in this repo (`game/`). Local multiplayer (mouse vs gamepads) comes later.
