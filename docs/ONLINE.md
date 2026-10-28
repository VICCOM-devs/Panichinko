# Online play (demo v0.2.0)

**Model:** peer-to-peer, host-authoritative. The host's browser runs the full simulation (the same code as offline play). Each client sends its inputs about 30 times a second and draws 20 Hz snapshots from the host, 100 ms behind with interpolation. Gore, ragdolls, blood and most sounds are simulated locally on each client from host events, because corpses never affect gameplay.

**Signalling:** Supabase Realtime on the Wobble Wheels project (`bzcseqlvfezydosdoort`), using the public anon key, broadcast and presence only. There are no tables and no data is stored.
- `pch-lobby`: hosts of quick-match rooms track presence `{code, n, v, open, host}`. Quick match reads it for 1.5 s and joins the fullest open room on the same version (`NETV`), otherwise it hosts a new room and starts a round right away.
- `pch-room-<CODE>`: `hello` → host `offer` → client `answer`, plus trickled `ice`. The host replies `nope` when the room is full or runs another version. Clients leave the room channel once the data channel opens.
- Load: a handful of messages per join, so Realtime free-tier quotas are a non-issue. Game traffic never touches Supabase.

**WebRTC:** two data channels per client. `r` (reliable) carries lobby, start, end, batched events (feed, fx, bounce, sounds, kill, tilt) and ping. `u` (unordered, no retransmits) carries snapshots and inputs. STUN: Google and Cloudflare. **There is no TURN server yet**, so players behind symmetric NAT (some mobile and corporate networks) can't connect. The client shows "One of your networks blocks peer-to-peer play". To fix it, add a TURN entry to `NETCFG.ice` (for example Cloudflare Calls TURN or metered.ca).

**Rooms:** up to 5 players (1 Biggie, 4 Tinies). Bots fill empty seats. The room creator starts as the Biggie and joiners as Tinies; anyone can switch in the lobby between rounds. People who join mid-round take a bot's seat. When someone leaves, a bot takes their seat. When the host leaves, the room closes. If the host hides the tab, a Web Worker keeps the simulation ticking.

**Snapshot:** about 3 KB of JSON at 20 Hz, so about 60 KB/s upload per client for the host.

**Known limits:**
- No client-side prediction yet: your own Tiny reacts after one round trip (usually 30–120 ms).
- No highlights on clients.
- Close-call sounds play on the host only.
- Streamer mode votes run on the host only.

**Testing:** `?sig=local` swaps Supabase for a BroadcastChannel transport, so several tabs on one machine can play together. `tests/online.spec.js` covers create/join, inputs, snapshots, kills, quick match into a running round, a remote Biggie, the round end and the host leaving.
