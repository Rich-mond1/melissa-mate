/* Me (avatar + wardrobe, bought with ⭐) and Friends (original characters she meets on the way). */
let ME = { slot: 'top', prev: null };   // prev = an item she is trying on but has not bought yet (memory only)
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
SCREENS.me = function(){
  const slotDef = AV_SLOTS.filter(function(s){ return s.k === ME.slot; })[0] || AV_SLOTS[2], slot = slotDef.k;
  const av = Object.assign({}, S.avatar); if(ME.prev) av[ME.prev.slot] = ME.prev.id;
  let h = topbar('🧑‍🎤 Me', 'hub') + '<div class="avbig">' + avatarSVG(av) + '</div>';
  if(ME.prev){
    const it = avItem(ME.prev.slot, ME.prev.id), need = it.cost - S.starBalance;
    h += '<div class="card center"><b>' + esc(it.name) + '</b> · ' + it.cost + ' ⭐<div class="gap"></div>' + (need > 0 ? '<p class="muted">You need ' + need + ' more ⭐ — keep playing!</p>' : '<button class="btn block good" data-act="meBuy">Buy and wear it ✨</button>') + '<div class="gap"></div><button class="btn small block" style="background:#e9ebf7;color:var(--ink)" data-act="meCancel">Not now</button></div><div class="gap"></div>';
  }
  h += '<div class="avtabs">' + AV_SLOTS.map(function(s){ return '<button class="avtab' + (s.k === slot ? ' on' : '') + '" data-act="meSlot" data-k="' + s.k + '"><span>' + s.emoji + '</span>' + s.label + '</button>'; }).join('') + '</div>';
  h += '<div class="avgrid">' + AV_ITEMS[slot].map(function(row){
    const it = avItem(slot, row[0]), owned = avOwns(S, slot, it.id), worn = S.avatar[slot] === it.id && !(ME.prev && ME.prev.slot === slot), tried = !!(ME.prev && ME.prev.slot === slot && ME.prev.id === it.id);
    const thumb = (slot === 'hairColor' || slot === 'skin') ? '<span class="sw" style="background:' + it.c + '"></span>' : avatarSVG(Object.assign({}, S.avatar, (function(){ const o = {}; o[slot] = it.id; return o; })()), { view: slotDef.view });
    return '<button class="avitem' + (worn ? ' worn' : '') + (tried ? ' tried' : '') + (owned ? '' : ' locked') + '" data-act="meItem" data-k="' + slot + '" data-id="' + esc(it.id) + '"><div class="th">' + thumb + '</div><b>' + esc(it.name) + '</b><i>' + (worn ? 'wearing ✓' : (owned ? 'tap to wear' : '🔒 ' + it.cost + ' ⭐')) + '</i></button>';
  }).join('') + '</div>';
  R(h);
};
ACT.meSlot = function(d){ if(AV_SLOTS.some(function(s){ return s.k === d.k; })){ ME.slot = d.k; ME.prev = null; render(); } };
ACT.meItem = function(d){
  if(!avItem(d.k, d.id)) return;
  if(avOwns(S, d.k, d.id)){ avEquip(S, d.k, d.id); ME.prev = null; save(); } else ME.prev = { slot: d.k, id: d.id };
  render();
};
ACT.meBuy = function(){
  if(!ME.prev) return; const r = avBuy(S, ME.prev.slot, ME.prev.id);
  if(r === 'ok'){ ME.prev = null; save(); confetti(40); toast('Looking great! ✨'); } else if(r === 'poor') toast('Not enough ⭐ yet');
  render();
};
ACT.meCancel = function(){ ME.prev = null; render(); };
