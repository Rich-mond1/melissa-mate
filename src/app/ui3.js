/* Me (avatar + wardrobe, bought with ⭐) and Friends (original characters she meets on the way). */
let ME = { slot: 'top', prev: null, won: null };   // prev = an item she is trying on but has not bought yet (memory only)
function friendPic(id, cls){ const f = friendById(id); return FRIEND_IMG[id] ? '<img class="' + (cls || 'fimg') + '" alt="' + esc(f ? f.name : '') + '" src="' + FRIEND_IMG[id] + '">' : ''; }
function friendCardHTML(f){
  return '<div class="card center friendcard"><p class="muted">You met a new friend on the way! 💜</p>' + friendPic(f.id, 'fimg big') + '<h3>' + esc(f.name) + '</h3><p class="muted">' + esc(f.theme) + '</p><p style="margin-top:6px">“' + esc(f.line) + '”</p>' +
    '<div class="gap"></div><button class="btn small block" data-act="go" data-to="friends">See all my friends</button></div><div class="gap"></div>';
}
SCREENS.friends = function(){
  let h = topbar('🤝 Friends', 'hub') + '<div class="card center"><p class="qprompt">' + S.met.length + ' of ' + FRIENDS.length + ' friends met</p><p class="muted">Finish missions and open sticker packs — new friends turn up on the way!</p></div><div class="gap"></div><div class="fgrid">';
  FRIENDS.forEach(function(f){
    const met = S.met.indexOf(f.id) > -1;
    h += met ? '<button class="fcard" data-act="friendOpen" data-id="' + f.id + '">' + friendPic(f.id) + '<b>' + esc(f.name) + '</b></button>' : '<div class="fcard locked"><div class="fimg qmark">❓</div><b>???</b></div>';
  });
  R(h + '</div>');
};
ACT.friendOpen = function(d){ if(friendById(d.id) && S.met.indexOf(d.id) > -1) go('friendMeet', { id: d.id }); };
SCREENS.friendMeet = function(p){
  const f = friendById(p.id); if(!f) return go('friends');
  R(topbar(esc(f.name), 'friends') + '<div class="card center">' + friendPic(f.id, 'fimg huge') + '<h3>' + esc(f.name) + '</h3><p class="muted">' + esc(f.theme) + '</p><div class="gap"></div><p class="qprompt">“' + esc(f.line) + '”</p></div>');
};
/* ---------------- Me: avatar, mascot and their wardrobe (bought with ⭐; legendary things open with gold medals) ---------------- */
function meSlots(){ return AV_SLOTS.concat(PET_SLOTS); }
function meIsPet(slot){ return slot === 'pet' || PET_ACC_SLOTS.indexOf(slot) > -1; }
function meThumb(slot, it, slotDef){
  if(slot === 'hairColor' || slot === 'skin') return '<span class="sw" style="background:' + it.c + '"></span>';
  if(slot === 'pet') return petPic(it.id, petWears(S, it.id));
  if(PET_ACC_SLOTS.indexOf(slot) > -1){ const w = { phat: '', pglasses: '', pneck: '' }; w[slot] = it.id; return petPic(S.friend, petCan(S.friend, slot) ? w : null); }
  const o = {}; o[slot] = it.id; return avatarSVG(Object.assign({}, S.avatar, o), { view: slotDef.view });
}
SCREENS.me = function(){
  const slots = meSlots(), slotDef = slots.filter(function(s){ return s.k === ME.slot; })[0] || AV_SLOTS[2], slot = slotDef.k, pet = meIsPet(slot), prev = ME.prev;
  let h = topbar('🧑‍🎤 Me', 'hub');
  if(pet){
    const pid = (prev && prev.slot === 'pet') ? prev.id : S.friend, w = petWears(S, pid); if(prev && PET_ACC_SLOTS.indexOf(prev.slot) > -1) w[prev.slot] = prev.id;
    h += '<div class="avbig petbig" style="background:linear-gradient(180deg,' + ((avItem('bg', S.avatar.bg) || {}).c instanceof Array ? avItem('bg', S.avatar.bg).c.join(',') : '#FFD1E8,#F8A5D2') + ')">' + petPic(pid, w) + '</div><p class="center white" style="font-weight:900">' + esc(PET_NAMES[pid]) + '</p><div class="gap"></div>';
  } else {
    const av = Object.assign({}, S.avatar); if(prev) av[prev.slot] = prev.id;
    h += '<div class="avbig">' + avatarSVG(av) + '</div>';
  }
  const pg = avProgress(S);
  h += '<div class="card"><div class="row" style="align-items:center;gap:10px"><div class="grow"><b>🎒 ' + pg.have + ' / ' + pg.total + '</b><div class="xpbar" style="margin-top:4px"><i style="width:' + Math.round(pg.have / pg.total * 100) + '%"></i></div></div><button class="btn small" data-act="meBox" aria-label="Surprise box">🎁 ' + boxPrice(S) + ' ⭐</button></div>' +
    '<p class="muted" style="margin-top:6px;font-size:13px">' + (pg.next ? '🏆 Next legendary: <b>' + esc(pg.next.name) + '</b> — win ' + pg.next.req + ' gold 🥇 (you have ' + pg.gold + '). 🎁 = surprise item!' : 'Every legendary prize is open — you are a maths legend! 🏆') + '</p></div><div class="gap"></div>';
  if(ME.won){ const w = avItem(ME.won.slot, ME.won.id); if(w) h += '<div class="card center win"><p class="muted">The surprise box had…</p><b style="font-size:20px">✨ ' + esc(w.name) + ' ✨</b><p class="muted">It is on already! Look at the picture 👆</p></div><div class="gap"></div>'; }
  if(prev){
    const it = avItem(prev.slot, prev.id), price = avPrice(S, prev.slot, prev.id), need = price - S.starBalance, lock = avLocked(S, prev.slot, prev.id);
    h += '<div class="card center"><b>' + esc(it.name) + '</b> · ' + price + ' ⭐<div class="gap"></div>' + (lock ? '<p class="muted">🏆 Legendary! Win <b>' + it.req + '</b> gold 🥇 medals to unlock it (you have ' + avGold(S) + '). Gold = master a skill, then remember it another day.</p>' : (need > 0 ? '<p class="muted">You need ' + need + ' more ⭐ — keep playing!</p>' : '<button class="btn block good" data-act="meBuy">Buy and wear it ✨</button>')) + '<div class="gap"></div><button class="btn small block" style="background:#e9ebf7;color:var(--ink)" data-act="meCancel">Not now</button></div><div class="gap"></div>';
  }
  h += '<div class="avtabs">' + slots.map(function(s){ return '<button class="avtab' + (s.k === slot ? ' on' : '') + '" data-act="meSlot" data-k="' + s.k + '"><span>' + s.emoji + '</span>' + s.label + '</button>'; }).join('') + '</div>';
  if(PET_ACC_SLOTS.indexOf(slot) > -1 && !petCan(S.friend, slot)){
    h += '<div class="card center"><p class="qprompt">' + esc(PET_NAMES[S.friend]) + ' ' + (slot === 'phat' ? 'already wears a wizard hat 🧙' : 'is a little shy about glasses 😅') + '</p><p class="muted">Try another pet or another style!</p></div>';
  } else {
    h += '<div class="avgrid">' + AV_ITEMS[slot].map(function(row){
      const it = avItem(slot, row[0]), owned = avOwns(S, slot, it.id), worn = avWorn(S, slot, it.id) && !(prev && prev.slot === slot), tried = !!(prev && prev.slot === slot && prev.id === it.id), lock = avLocked(S, slot, it.id);
      return '<button class="avitem' + (worn ? ' worn' : '') + (tried ? ' tried' : '') + (owned ? '' : ' locked') + (lock ? ' legend' : '') + '" data-act="meItem" data-k="' + slot + '" data-id="' + esc(it.id) + '"><div class="th">' + meThumb(slot, it, slotDef) + '</div><b>' + esc(it.name) + '</b><i>' + (worn ? 'wearing ✓' : (owned ? 'tap to wear' : (lock ? '🏆 ' + it.req + ' 🥇' : '🔒 ' + avPrice(S, slot, it.id) + ' ⭐'))) + '</i></button>';
    }).join('') + '</div>';
  }
  R(h);
};
ACT.meSlot = function(d){ if(meSlots().some(function(s){ return s.k === d.k; })){ ME.slot = d.k; ME.prev = null; ME.won = null; render(); } };
ACT.meItem = function(d){
  if(!avItem(d.k, d.id)) return;
  ME.won = null;
  if(avOwns(S, d.k, d.id)){ avEquip(S, d.k, d.id); ME.prev = null; save(); } else ME.prev = { slot: d.k, id: d.id };
  render();
};
ACT.meBuy = function(){
  if(!ME.prev) return; const r = avBuy(S, ME.prev.slot, ME.prev.id);
  if(r === 'ok'){ ME.prev = null; save(); confetti(40); toast('Looking great! ✨'); } else if(r === 'poor') toast('Not enough ⭐ yet'); else if(r === 'locked') toast('Win more gold 🥇 medals to unlock it');
  render();
};
ACT.meBox = function(){
  const r = avBox(S);
  if(r === 'full') toast('You already have everything that is open — win gold 🥇 medals for legendary prizes!');
  else if(r === 'poor') toast('A surprise box costs ' + boxPrice(S) + ' ⭐');
  else { ME.slot = r.slot; ME.prev = null; ME.won = r; save(); confetti(60); }
  render();
};
ACT.meCancel = function(){ ME.prev = null; render(); };
