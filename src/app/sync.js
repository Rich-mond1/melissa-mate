'use strict';
/* sync.js: keep Melissa's progress the same on every device (iPad, phone...) WITHOUT losing anything.
   How it works (read docs/SYNC.md):
   - Each device writes ONLY its own file `devices/<deviceId>.json` in a private GitHub repo, so two devices can never overwrite each other.
   - Sync = read every other device's file, merge them into the local state with fixed rules, then write this device's file.
   - Stars / xp / packs are summed from per-device counters (never "last one wins"), so nothing is double spent or lost.
   - The token and the counters live in their own localStorage key (SYNC_KEY), NOT in the progress file, so export / backups never contain the token. */
const SYNC_KEY = 'matemagics_sync_v1';
const SYNC_LOOK = ['avatar', 'petAcc', 'friend', 'theme'];                 // what she looks like: the newest change wins, as one unit
const SYNC_SETTINGS = ['rewards', 'goalReward', 'shopMult', 'shopCat', 'focus'];     // grown-up settings: the newest change wins, as one unit
const SYNC_DIR = 'devices';

function syncClone(x){ return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
function syncCounters(S){ return { earned: Math.max(0, Number(S.totalStars) || 0), net: Number(S.starBalance) || 0, xp: Math.max(0, Number(S.xp) || 0), packs: Number(S.packs) || 0 }; }
function syncPick(S, keys){ const o = {}; keys.forEach(function(k){ o[k] = syncClone(S[k]); }); if(keys === SYNC_SETTINGS){ o.timer = { mode: S.timer && S.timer.mode, minutes: S.timer && S.timer.minutes }; } return JSON.stringify(o); }
function syncNewMeta(deviceId, deviceName){ return { deviceId: deviceId, deviceName: deviceName || '', own: null, last: null, lookSeen: null, lookAt: 0, setSeen: null, setAt: 0, lastSync: null }; }

/* Step 1, before merging: fold what this device did since the last sync into its own counters, and stamp look / settings changes. */
function syncBegin(S, meta, now){
  const c = syncCounters(S);
  if(!meta.own || !meta.last){ meta.own = { earned: c.earned, net: c.net, xp: c.xp, packs: c.packs }; }
  else {
    meta.own.earned += Math.max(0, c.earned - meta.last.earned); meta.own.xp += Math.max(0, c.xp - meta.last.xp);
    meta.own.net += c.net - meta.last.net; meta.own.packs += c.packs - meta.last.packs;
  }
  meta.last = { earned: c.earned, net: c.net, xp: c.xp, packs: c.packs };
  const look = syncPick(S, SYNC_LOOK), set = syncPick(S, SYNC_SETTINGS);
  if(meta.lookSeen === null) meta.lookSeen = look; else if(look !== meta.lookSeen){ meta.lookSeen = look; meta.lookAt = now; }
  if(meta.setSeen === null) meta.setSeen = set; else if(set !== meta.setSeen){ meta.setSeen = set; meta.setAt = now; }
  return meta;
}
/* What this device publishes. */
function syncPayload(S, meta, now){
  return { v: 1, deviceId: meta.deviceId, deviceName: meta.deviceName, at: new Date(now).toISOString(), own: syncClone(meta.own), lookAt: meta.lookAt, setAt: meta.setAt, state: syncClone(S) };
}
function syncValidRemote(r){
  return !!(r && r.v === 1 && typeof r.deviceId === 'string' && r.deviceId && r.state && typeof r.state === 'object' && !Array.isArray(r.state) && r.own && ['earned', 'net', 'xp', 'packs'].every(function(k){ return isFinite(Number(r.own[k])); }));
}

function syncSkillScore(r){ return [r.medal | 0, r.box | 0, Number(r.credit) || 0, r.seen | 0]; }
function syncCmp(a, b){ for(let i = 0; i < a.length; i++){ if(a[i] !== b[i]) return a[i] > b[i] ? 1 : -1; } return 0; }
function syncMergeSkill(a, b){
  if(!a) return syncClone(b); if(!b) return syncClone(a);
  const w = syncCmp(syncSkillScore(b), syncSkillScore(a)) > 0 ? b : a, o = w === a ? b : a, r = syncClone(w);
  ['lessonDone', 'placed', 'triedOut'].forEach(function(k){ if(a[k] || b[k]) r[k] = true; });
  if(a.goldFrom || b.goldFrom){ r.goldFrom = [a.goldFrom, b.goldFrom].filter(Boolean).sort()[0]; }
  if(a.last || b.last) r.last = [a.last, b.last].filter(Boolean).sort().pop();
  if(!w.due && o.due) r.due = o.due;
  return r;
}
function syncUnion(a, b, keyFn, pickFn){
  const m = {}, order = [];
  (a || []).concat(b || []).forEach(function(x){ const k = keyFn(x); if(m[k] === undefined){ m[k] = syncClone(x); order.push(k); } else if(pickFn) m[k] = pickFn(m[k], x); });
  return order.map(function(k){ return m[k]; });
}
function syncJ(x){ return JSON.stringify(x); }
function syncLogKey(l){ return [l.date, l.kind, l.skill, l.strand, l.correct, l.total, l.credit].join('|'); }
function syncDate(a, b){ return a && b ? (a > b ? a : b) : (a || b || null); }

/* Merge ONE remote device file into `base` (a state object, mutated and returned). `rm` = remote meta {lookAt, setAt}. */
function syncMergeOne(base, rs){
  const out = base;
  // skills
  const ids = {}; Object.keys(out.skills || {}).concat(Object.keys(rs.skills || {})).forEach(function(k){ ids[k] = 1; });
  Object.keys(ids).forEach(function(id){ out.skills[id] = syncMergeSkill((out.skills || {})[id], (rs.skills || {})[id]); });
  // errors: keep the highest count and the latest date
  Object.keys(rs.errors || {}).forEach(function(k){ const a = out.errors[k], b = rs.errors[k]; if(!a) out.errors[k] = syncClone(b); else { a.n = Math.max(a.n | 0, b.n | 0); a.last = syncDate(a.last, b.last); } });
  // histories
  out.evidence = syncUnion(out.evidence, rs.evidence, syncJ).sort(function(a, b){ return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }).slice(-EVIDENCE_CAP);
  out.sessionLog = syncUnion(out.sessionLog, rs.sessionLog, syncLogKey, function(a, b){ return a.mood ? a : (b.mood ? b : a); }).sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }).slice(-400);
  out.stickers = syncUnion(out.stickers, rs.stickers, function(s){ return s.id; }, function(a, b){ const r = syncClone(a); r.n = Math.max(a.n | 0, b.n | 0); r.date = syncDate(b.date, a.date) && [a.date, b.date].filter(Boolean).sort()[0]; return r; });
  ['badges', 'tricks', 'met', 'owned'].forEach(function(k){ out[k] = syncUnion(out[k], rs[k], function(x){ return String(x); }); });
  out.claims = syncUnion(out.claims, rs.claims, syncJ);
  // notes from the grown-ups: union by id; deleted / read stay so; the later answer wins
  out.notes = syncUnion(out.notes, rs.notes, function(n){ return n.id; }, function(a, b){
    const r = syncClone(a); r.del = !!(a.del || b.del); r.read = !!(a.read || b.read || (a.reply || b.reply));
    const w = (b.replyAt || '') > (a.replyAt || '') ? b : a; r.reply = w.reply || ''; r.replyAt = w.replyAt || ''; return r; });
  // preferences: keep every like / dislike either device knows; sound & voice stay as set on THIS device
  ['likes', 'dislikes'].forEach(function(k){ out.prefs[k] = syncUnion(out.prefs[k], (rs.prefs || {})[k], function(x){ return String(x); }); });
  // placement and diagnostic: whichever is further along; never go backwards
  out.placement.done = !!(out.placement.done || (rs.placement && rs.placement.done)); out.placement.started = !!(out.placement.started || (rs.placement && rs.placement.started));
  const pr = (rs.placement && rs.placement.results) || {}; Object.keys(pr).forEach(function(k){ out.placement.results[k] = Math.max(out.placement.results[k] === undefined ? -1 : out.placement.results[k], pr[k]); });
  const dn = function(d){ return d ? (d.done ? 1e6 : 0) + Object.keys(d.results || {}).length : -1; };
  if(dn(rs.diag) > dn(out.diag)) out.diag = syncClone(rs.diag);
  // today's routine, streak
  const dl = out.daily || {}, dr = rs.daily || {};
  if(dr.date && (!dl.date || dr.date > dl.date)) out.daily = syncClone(dr);
  else if(dr.date && dr.date === dl.date){ ['warmup', 'learn', 'boss', 'claimed'].forEach(function(k){ dl[k] = !!(dl[k] || dr[k]); }); dl.rounds = Math.max(dl.rounds | 0, dr.rounds | 0); out.daily = dl; }
  const sl = out.streak || {}, sr = rs.streak || {};
  if(sr.lastPlayDate && (!sl.lastPlayDate || sr.lastPlayDate > sl.lastPlayDate)) out.streak = syncClone(sr);
  else if(sr.lastPlayDate && sr.lastPlayDate === sl.lastPlayDate) sl.count = Math.max(sl.count | 0, sr.count | 0);
  ['onboardingDone', 'welcomeGift', 'hadPerfect'].forEach(function(k){ if(rs[k]) out[k] = true; });
  out.lastBackup = syncDate(out.lastBackup, rs.lastBackup);
  return out;
}

/* Merge the local state with every remote device file. Pure: returns { state, meta, notes }.
   opts.onTie ('local' | 'remote'): who wins the very first time both devices have a DIFFERENT look / settings and neither has ever changed it since syncing. */
function syncMerge(local, meta, remotes, now, opts){
  opts = opts || {}; const notes = { lookTie: false, setTie: false, devices: remotes.length };
  const m = syncClone(meta); const S0 = syncClone(local);
  syncBegin(S0, m, now);
  let out = syncClone(local);
  const valid = remotes.filter(syncValidRemote).filter(function(r){ return r.deviceId !== m.deviceId; });
  const rems = valid.map(function(r){ return { r: r, s: mergeState(syncClone(r.state)) }; });
  rems.forEach(function(x){ syncMergeOne(out, x.s); });
  // counters: the sum of every device's own contribution
  let e = m.own.earned, n = m.own.net, xp = m.own.xp, pk = m.own.packs;
  valid.forEach(function(r){ e += Number(r.own.earned); n += Number(r.own.net); xp += Number(r.own.xp); pk += Number(r.own.packs); });
  out.totalStars = Math.max(0, Math.round(e)); out.starBalance = Math.max(0, Math.round(n)); out.xp = Math.max(0, Math.round(xp)); out.packs = Math.max(0, Math.round(pk));
  out.starBalance = Math.min(out.starBalance, out.totalStars); out.level = levelFromXp(out.xp);
  // look and settings: newest change wins; a tie with different content is decided by the caller
  const group = function(keys, seenKey, atKey, remoteAtKey, tieKey){
    let best = { at: m[atKey], from: null };
    valid.forEach(function(r, i){ if((Number(r[remoteAtKey]) || 0) > best.at){ best = { at: Number(r[remoteAtKey]) || 0, from: rems[i].s }; } });
    if(best.from){ keys.forEach(function(k){ out[k] = syncClone(best.from[k]); }); if(keys === SYNC_SETTINGS){ out.timer.mode = best.from.timer.mode; out.timer.minutes = best.from.timer.minutes; } m[atKey] = best.at; }
    else {
      const mine = syncPick(local, keys);
      const others = rems.filter(function(x){ return syncPick(x.s, keys) !== mine; });
      if(others.length && valid.every(function(r){ return (Number(r[remoteAtKey]) || 0) === 0; }) && m[atKey] === 0){
        notes[tieKey] = true;
        if(opts.onTie === 'remote'){ keys.forEach(function(k){ out[k] = syncClone(others[0].s[k]); }); if(keys === SYNC_SETTINGS){ out.timer.mode = others[0].s.timer.mode; out.timer.minutes = others[0].s.timer.minutes; } }
        m[atKey] = now;   // from now on the chosen one is the newest, so every device adopts it
      }
    }
    m[seenKey] = syncPick(out, keys);
  };
  group(SYNC_LOOK, 'lookSeen', 'lookAt', 'lookAt', 'lookTie');
  group(SYNC_SETTINGS, 'setSeen', 'setAt', 'setAt', 'setTie');
  out.petAcc = cleanPetAcc(out.petAcc, out.owned); out.avatar = cleanAvatar(out.avatar, out.owned);
  out = mergeState(out);
  m.last = syncCounters(out); m.lastSync = new Date(now).toISOString();
  return { state: out, meta: m, notes: notes };
}

/* ---------- transport: GitHub contents API (browser) ---------- */
function syncB64(str){ return btoa(unescape(encodeURIComponent(str))); }
function syncErr(kind, msg){ const e = new Error(msg || kind); e.kind = kind; return e; }
async function syncGh(cfg, method, path, body, raw){
  let res;
  try {
    res = await fetch('https://api.github.com/repos/' + cfg.repo + '/contents/' + path, {
      method: method, cache: 'no-store',
      headers: Object.assign({ 'Authorization': 'Bearer ' + cfg.token, 'Accept': raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
  } catch(e){ throw syncErr('offline', 'Sin conexión'); }
  return res;
}
function syncHttpError(res){
  if(res.status === 401) return syncErr('token', 'El token no es válido o ha caducado');
  if(res.status === 403) return syncErr('token', 'GitHub no permite esta acción (permisos del token o límite de uso)');
  if(res.status === 404) return syncErr('repo', 'No encuentro el repositorio. Revisa el nombre y que el token lo incluya');
  return syncErr('http', 'GitHub respondió ' + res.status);
}
async function syncList(cfg){
  const res = await syncGh(cfg, 'GET', SYNC_DIR);
  if(res.status === 404){ const t = await res.text().catch(function(){ return ''; }); if(/empty|Not Found/i.test(t) && !/Bad credentials/i.test(t)){ return []; } throw syncHttpError(res); }
  if(!res.ok) throw syncHttpError(res);
  const j = await res.json(); return Array.isArray(j) ? j.filter(function(f){ return f.type === 'file' && /\.json$/.test(f.name); }) : [];
}
async function syncRead(cfg, file){
  const res = await syncGh(cfg, 'GET', SYNC_DIR + '/' + file.name, null, true);
  if(!res.ok) throw syncHttpError(res);
  try { return JSON.parse(await res.text()); } catch(e){ return null; }
}
async function syncWrite(cfg, payload, sha){
  const name = SYNC_DIR + '/' + cfg.deviceId + '.json';
  const res = await syncGh(cfg, 'PUT', name, { message: 'sync ' + (cfg.deviceName || cfg.deviceId), content: syncB64(JSON.stringify(payload)), sha: sha || undefined });
  if(res.status === 409 || res.status === 422) return 'stale';
  if(!res.ok) throw syncHttpError(res);
  return 'ok';
}
/* One full sync. cfg = { repo, token, deviceId, deviceName }; returns { state, meta, notes }. The caller stores them. */
async function syncRun(cfg, S, meta, now, opts){
  let files = await syncList(cfg);
  const remotes = [];
  for(const f of files){ if(f.name === cfg.deviceId + '.json') continue; const r = await syncRead(cfg, f); if(r) remotes.push(r); }
  let res = syncMerge(S, meta, remotes, now, opts);
  if((res.notes.lookTie || res.notes.setTie) && opts && opts.askTie){
    const c = await opts.askTie(res.notes);
    if(c === 'abort') throw syncErr('tie', 'Los dos dispositivos tienen un avatar o ajustes distintos. Elígelo desde el panel de padres con «Sincronizar ahora»');
    if(c === 'remote') res = syncMerge(S, meta, remotes, now, Object.assign({}, opts, { onTie: 'remote' }));
  }
  const payload = syncPayload(res.state, res.meta, now);
  let own = files.filter(function(f){ return f.name === cfg.deviceId + '.json'; })[0];
  let r = await syncWrite(cfg, payload, own && own.sha);
  if(r === 'stale'){ files = await syncList(cfg); own = files.filter(function(f){ return f.name === cfg.deviceId + '.json'; })[0]; r = await syncWrite(cfg, payload, own && own.sha); if(r !== 'ok') throw syncErr('http', 'No pude guardar. Prueba otra vez'); }
  res.notes.pushed = true; return res;
}

if(typeof module !== 'undefined') module.exports = { SYNC_KEY, SYNC_LOOK, SYNC_SETTINGS, syncNewMeta, syncBegin, syncPayload, syncMerge, syncValidRemote, syncRun, syncCounters };
