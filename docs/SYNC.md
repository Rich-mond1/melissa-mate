# Sync between devices (iPad, phone…)

**What it is.** A button in the parent panel (👪 → 🔄 Sincronizar dispositivos) that makes Melissa's progress, stars, purchases, stickers and avatar the same on every device. It also runs by itself when the app opens, when the screen comes back, and when the signal returns (never in the middle of a session).

**Where the data goes.** A PRIVATE GitHub repo (`Rich-mond1/matemagics-sync`). Each device writes only its own file, `devices/<deviceId>.json`, so two devices can never overwrite each other. Nothing else is stored.

**Set up (once per device).**
1. github.com → New repository → `matemagics-sync`, **Private**, empty (done once).
2. Settings → Developer settings → Fine-grained tokens → Generate: *Only select repositories* → `matemagics-sync`; permission **Contents: Read and write**; expiry 1 year.
3. In the app: parent panel → paste the token, name the device → *Activar y sincronizar*.
The token lives only in that browser's `localStorage` key `matemagics_sync_v1`. It is never in the progress, never in an export, never in the repo.

**Merge rules (src/app/sync.js, tested by tools/sync-test.js).**
| What | Rule |
|---|---|
| Stars earned, stars balance, xp, packs | each device keeps counters of what IT earned/spent; the merged value is the SUM of all devices (balance clamped to 0..total). Repeating a sync never changes anything |
| Skills | the record with the better (medal, box, credit, seen) wins; `lessonDone/placed/triedOut` are ORed; earliest `goldFrom` |
| Errors | highest count, latest date |
| Evidence, session log | union without duplicates (caps 800 / 400) |
| Stickers | union by id, highest count; badges, tricks, met, owned, claims: union |
| Notes from the grown-ups | union by id; deleted and read stay so; the later answer wins |
| Prices (general + per group) | part of the grown-up settings: newest change wins |
| Streak | the newest day wins; same day → highest count |
| Placement / diagnostic | whichever is further along; never goes back |
| Look (avatar, pet clothes, friend, theme) | the newest change wins as one unit. The FIRST time two devices have different looks, the grown-up chooses (a confirm in the parent panel) |
| Grown-up settings (prizes, prices ×, goal, focus, timer mode) | the newest change wins as one unit; same first-time choice |
| Sound/voice, today's timer | stay as set on each device |

**Safety rules.**
- Offline, bad token, wrong repo, GitHub errors: the state is never changed; a message is shown in the panel.
- If she plays while a sync is in flight, the merge result is discarded and the sync runs again 3 s later (her progress is never overwritten).
- While sync is on, *Importar*, *Deshacer importación* and *Borrar todo* are blocked (they would break the per-device counters). Turn sync off first.
- Junk or foreign files in `devices/` are ignored.

**Known limits.** (1) Two devices that both spend the same stars before syncing can overspend; the balance is clamped at 0 (nothing goes negative). (2) A streak keeps the newest device's count, so alternating days on two devices can undercount it. (3) The repo holds a copy of her progress (first name only): keep it private. (4) Token expires after the date you chose: the panel will say «El token no es válido o ha caducado».

**Tests.** `node tools/sync-test.js` (merge + fake GitHub, 47 checks), `node tools/sync-ui-test.js` (panel button in two real browsers, 18 checks). Both are in `run-all`.
