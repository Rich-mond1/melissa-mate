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

/* ---------------- a note from a grown-up: she sees herself and her mascot, answers with a button ---------------- */
SCREENS.note = function(p){
  const n = noteById(S, p && p.id);
  if(!n || n.del) return go('hub');
  const pet = PET_NAMES[S.friend] || 'Pato', scene = function(bubbleHTML, petBubble){
    return '<div class="nscene"><div class="nme">' + avatarSVG(S.avatar, { view: 'head' }) + '</div>' + bubbleHTML + '<div class="npet' + (petBubble ? ' hop' : '') + '">' + friendImg() + '</div></div>';
  };
  if(p.sent){
    const r = noteReplyById(n.reply) || NOTE_REPLIES[0];
    R(topbar('💌 Sent!') + '<div class="card center">' + scene('<div class="bubble pop">' + r.emoji + ' ' + esc(r.text) + '</div>', true) +
      '<p class="muted" style="margin:8px 0"><b>' + esc(pet) + '</b> loves your answer!</p><button class="btn good block" data-act="go" data-to="hub">Done</button></div>');
    return;
  }
  R(topbar('💌 For you') + '<div class="card center"><p class="muted">' + (n.from ? 'From <b>' + esc(n.from) + '</b>' : 'A message for you') + '</p>' + scene('', false) +
    '<div class="bubble note-text">' + esc(n.text) + '</div><div class="gap"></div><p class="muted"><b>' + esc(pet) + '</b> is waiting. Pick your answer:</p>' +
    '<div class="chips">' + NOTE_REPLIES.map(function(r){ return '<button class="chip" style="font-size:18px" data-act="noteReply" data-id="' + esc(n.id) + '" data-r="' + r.id + '">' + r.emoji + ' ' + esc(r.text) + '</button>'; }).join('') + '</div></div>');
};
ACT.noteOpen = function(d){ if(noteById(S, d.id)) go('note', { id: d.id }); };
ACT.noteReply = function(d){ if(!answerNote(S, d.id, d.r)) return; save(); confetti(50); go('note', { id: d.id, sent: true }); };

/* ---------------- puzzle: pieces turn over as she earns stars ---------------- */
const PUZZLE_NAMES = ['Rainbow day', 'Magic castle', 'Rocket to the stars', 'Under the sea', 'Flower garden', 'Beach sunset'];
const PUZZLE_ART = [
  function(){ return '<rect width="120" height="90" fill="#BFE8FF"/><circle cx="100" cy="16" r="9" fill="#FFD84D"/><g fill="none" stroke-width="5"><path d="M10 78 A50 50 0 0 1 110 78" stroke="#EB5757"/><path d="M15 78 A45 45 0 0 1 105 78" stroke="#F2994A"/><path d="M20 78 A40 40 0 0 1 100 78" stroke="#F2C94C"/><path d="M25 78 A35 35 0 0 1 95 78" stroke="#27AE60"/><path d="M30 78 A30 30 0 0 1 90 78" stroke="#4F8FE8"/><path d="M35 78 A25 25 0 0 1 85 78" stroke="#BB6BD9"/></g><ellipse cx="60" cy="92" rx="80" ry="20" fill="#7BCB6B"/><g fill="#fff"><ellipse cx="14" cy="64" rx="13" ry="7"/><ellipse cx="24" cy="60" rx="9" ry="7"/><ellipse cx="104" cy="66" rx="13" ry="7"/><ellipse cx="94" cy="62" rx="9" ry="7"/></g>'; },
  function(){ return '<rect width="120" height="90" fill="#FFD1E8"/><circle cx="20" cy="15" r="2" fill="#fff"/><circle cx="98" cy="12" r="2" fill="#fff"/><circle cx="60" cy="8" r="1.6" fill="#fff"/><ellipse cx="60" cy="92" rx="90" ry="22" fill="#8FD97A"/><rect x="38" y="42" width="44" height="40" fill="#E4D4F5"/><rect x="28" y="30" width="16" height="52" fill="#D2BDF0"/><rect x="76" y="30" width="16" height="52" fill="#D2BDF0"/><polygon points="26,30 36,10 46,30" fill="#9B6BDC"/><polygon points="74,30 84,10 94,30" fill="#9B6BDC"/><polygon points="46,42 60,22 74,42" fill="#B88CEB"/><path d="M52 82 V66 A8 8 0 0 1 68 66 V82Z" fill="#7A4B2A"/><rect x="33" y="44" width="6" height="9" rx="3" fill="#4F8FE8"/><rect x="81" y="44" width="6" height="9" rx="3" fill="#4F8FE8"/><path d="M36 10 V2 L44 5 L36 8" fill="#EB5757"/>'; },
  function(){ return '<rect width="120" height="90" fill="#1F2A5C"/><g fill="#fff"><circle cx="12" cy="14" r="1.4"/><circle cx="40" cy="8" r="1.2"/><circle cx="72" cy="18" r="1.5"/><circle cx="108" cy="10" r="1.3"/><circle cx="96" cy="40" r="1.2"/><circle cx="14" cy="52" r="1.3"/><circle cx="30" cy="80" r="1.4"/><circle cx="104" cy="82" r="1.2"/></g><circle cx="94" cy="26" r="13" fill="#F2994A"/><ellipse cx="94" cy="26" rx="21" ry="4.5" fill="none" stroke="#FFD84D" stroke-width="2.4" transform="rotate(-18 94 26)"/><g transform="rotate(25 50 50)"><ellipse cx="50" cy="48" rx="10" ry="24" fill="#F4F4F8"/><polygon points="40,28 50,10 60,28" fill="#EB5757"/><circle cx="50" cy="44" r="5" fill="#4F8FE8" stroke="#fff" stroke-width="1.6"/><polygon points="40,62 28,76 41,70" fill="#EB5757"/><polygon points="60,62 72,76 59,70" fill="#EB5757"/><polygon points="44,72 50,88 56,72" fill="#FFD84D"/></g>'; },
  function(){ return '<rect width="120" height="90" fill="#7FD1F0"/><rect y="74" width="120" height="16" fill="#F6E1A6"/><g fill="none" stroke="#2E9E5B" stroke-width="3" stroke-linecap="round"><path d="M16 78 q-6 -10 0 -20 q6 -10 0 -18"/><path d="M104 78 q6 -10 0 -18 q-6 -8 0 -16"/></g><g><ellipse cx="42" cy="38" rx="14" ry="9" fill="#F2994A"/><polygon points="55,38 68,28 68,48" fill="#F2994A"/><circle cx="34" cy="35" r="2.4" fill="#fff"/><circle cx="34" cy="35" r="1.1" fill="#222"/></g><g><ellipse cx="86" cy="58" rx="10" ry="6" fill="#BB6BD9"/><polygon points="76,58 66,51 66,65" fill="#BB6BD9"/><circle cx="91" cy="56" r="1.8" fill="#fff"/><circle cx="91" cy="56" r="0.8" fill="#222"/></g><g fill="none" stroke="#fff" stroke-width="1.4"><circle cx="26" cy="22" r="3"/><circle cx="32" cy="12" r="2"/><circle cx="78" cy="30" r="2.6"/><circle cx="100" cy="26" r="3.4"/></g><polygon points="58,84 60,78 62,84 68,84 63,88 65,94 60,90 55,94 57,88 52,84" fill="#EB5757" transform="scale(.7) translate(25 34)"/>'; },
  function(){ return '<rect width="120" height="90" fill="#CFEFFF"/><circle cx="18" cy="16" r="9" fill="#FFD84D"/><rect y="62" width="120" height="28" fill="#7BCB6B"/><g stroke="#2E9E5B" stroke-width="2.4"><path d="M22 90 V56"/><path d="M52 90 V48"/><path d="M84 90 V54"/><path d="M106 90 V60"/></g><g><circle cx="22" cy="52" r="9" fill="#EB5757"/><circle cx="52" cy="44" r="10" fill="#F2C94C"/><circle cx="84" cy="50" r="9" fill="#BB6BD9"/><circle cx="106" cy="56" r="7" fill="#F59AC3"/></g><g fill="#7A4B2A"><circle cx="22" cy="52" r="3.6"/><circle cx="52" cy="44" r="4"/><circle cx="84" cy="50" r="3.6"/><circle cx="106" cy="56" r="3"/></g><g transform="translate(70 22)"><ellipse cx="-4" cy="0" rx="6" ry="4" fill="#F2994A"/><ellipse cx="4" cy="0" rx="6" ry="4" fill="#F2994A"/><rect x="-1" y="-5" width="2" height="10" rx="1" fill="#333"/></g>'; },
  function(){ return '<defs><linearGradient id="pzs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8F6B"/><stop offset="1" stop-color="#FFD59A"/></linearGradient></defs><rect width="120" height="90" fill="url(#pzs)"/><circle cx="60" cy="52" r="18" fill="#FFF3B0"/><rect y="52" width="120" height="20" fill="#3E8FD6"/><g stroke="#fff" stroke-width="1.2" opacity=".7"><path d="M44 58 h32"/><path d="M50 63 h20"/></g><path d="M0 72 Q60 62 120 72 V90 H0Z" fill="#F6E1A6"/><g><path d="M96 80 Q98 56 92 38" fill="none" stroke="#7A4B2A" stroke-width="3.4" stroke-linecap="round"/><path d="M92 38 q-14 -6 -20 4 M92 38 q12 -10 22 -2 M92 38 q-4 -14 6 -18 M92 38 q10 -8 14 4" fill="none" stroke="#2E9E5B" stroke-width="3" stroke-linecap="round"/></g><g><path d="M18 66 h20 l-4 7 h-12z" fill="#EB5757"/><path d="M28 66 V50 L38 64Z" fill="#fff"/></g>'; }
];
function puzzleSVG(pic, tiles){
  let cover = '';
  for(let i = 0; i < PUZZLE_TILES; i++){
    const x = (i % 4) * 30, y = Math.floor(i / 4) * 30;
    if(tiles.indexOf(i) === -1) cover += '<rect x="' + x + '" y="' + y + '" width="30" height="30" fill="#8E7CC3"/><text x="' + (x + 15) + '" y="' + (y + 21) + '" font-size="14" text-anchor="middle" fill="#fff" opacity=".85">🧩</text>';
  }
  return '<svg viewBox="0 0 120 90" class="puz" role="img" aria-label="' + esc(PUZZLE_NAMES[pic]) + ' puzzle">' + PUZZLE_ART[pic]() + cover + '<g stroke="#ffffffaa" stroke-width=".6">' + [30, 60, 90].map(function(x){ return '<path d="M' + x + ' 0V90"/>'; }).join('') + [30, 60].map(function(y){ return '<path d="M0 ' + y + 'H120"/>'; }).join('') + '</g></svg>';
}
SCREENS.puzzle = function(){
  const z = puzzleInfo(S);
  R(topbar('🧩 My puzzle') + '<div class="card center"><p class="qprompt">' + esc(PUZZLE_NAMES[z.pic]) + '</p>' + puzzleSVG(z.pic, z.shown) + '<div class="gap"></div>' +
    (z.complete ? '<p class="qprompt">🎉 You finished it!</p><button class="btn good block" data-act="puzzleCollect">Collect a sticker pack ✨</button>'
      : '<p class="qprompt">' + z.tiles + ' / ' + PUZZLE_TILES + ' pieces</p><p class="muted">Win <b>' + z.toNext + ' ⭐</b> more to turn over the next piece. Every ' + PUZZLE_STEP + ' stars you earn gives a piece!</p>') + '</div>');
};
ACT.puzzleCollect = function(){ if(!puzzleCollect(S)) return; save(); confetti(70); toast('+1 sticker pack ✨ — a new picture is waiting!'); render(); };
