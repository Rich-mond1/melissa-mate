/* Avatar + wardrobe + friends you meet on the way. Pure logic and procedural SVG (no images needed for the avatar).
   State: S.avatar (what she wears), S.owned (bought item ids "slot:id"), S.met (friend ids). Items are bought with starBalance only. */

/* ---------- catalogue ---------- */
/* Rows are [id, name, base price in stars, extra (colour / gradient / 'img'), gold medals needed to unlock]. The 5th value makes an item "legendary": it only opens when she owns that many gold medals. */
const AV_SLOTS = [
  { k: 'hairStyle', label: 'Hair', emoji: '💇‍♀️', view: 'head' },
  { k: 'hairColor', label: 'Colour', emoji: '🎨', view: 'head' },
  { k: 'top', label: 'Tops', emoji: '👚', view: 'body' },
  { k: 'bottom', label: 'Bottoms', emoji: '👖', view: 'legs' },
  { k: 'hat', label: 'Hats', emoji: '👑', view: 'head' },
  { k: 'glasses', label: 'Glasses', emoji: '🕶️', view: 'head' },
  { k: 'neck', label: 'Jewels', emoji: '📿', view: 'head' },
  { k: 'face', label: 'Sparkle', emoji: '✨', view: 'head' },
  { k: 'wings', label: 'Wings', emoji: '🦋', view: 'full' },
  { k: 'hold', label: 'Props', emoji: '🪄', view: 'full' },
  { k: 'bg', label: 'Scenes', emoji: '🌈', view: 'full' },
  { k: 'skin', label: 'Skin', emoji: '🧑🏽', view: 'head' }
];
/* what her maths friend (the mascot) can wear and be */
const PET_SLOTS = [
  { k: 'pet', label: 'Pets', emoji: '🐾' },
  { k: 'phat', label: 'Pet hats', emoji: '🎩' },
  { k: 'pglasses', label: 'Pet shades', emoji: '😎' },
  { k: 'pneck', label: 'Pet style', emoji: '🎀' }
];
const AV_ITEMS = {
  skin: [['sk1', 'Peach', 0, '#FBD9C3'], ['sk2', 'Sand', 0, '#F2C09A'], ['sk3', 'Caramel', 0, '#D9A27A'], ['sk4', 'Cocoa', 0, '#C68B62'], ['sk5', 'Chestnut', 0, '#A9693F'], ['sk6', 'Espresso', 0, '#7B4A2B']],
  hairStyle: [['curly', 'Curly', 0], ['buns', 'Space buns', 0], ['long', 'Long', 0], ['short', 'Bob', 5], ['ponytail', 'Ponytail', 5], ['braids', 'Braids', 8], ['pigtails', 'Pigtails', 6], ['topbun', 'Top bun', 6], ['puff', 'Big puffs', 8], ['wavy', 'Wavy long', 10]],
  hairColor: [['dkbrown', 'Dark brown', 0, '#3B2417'], ['black', 'Black', 0, '#1C1517'], ['brown', 'Brown', 0, '#6B4226'], ['auburn', 'Auburn', 0, '#9A4A27'], ['blonde', 'Blonde', 5, '#E6C170'], ['pink', 'Pink', 10, '#F59AC3'], ['teal', 'Teal', 10, '#4CC9B8'], ['purple', 'Purple', 10, '#A77BE0'], ['blue', 'Blue', 12, '#4C8DF0'], ['red', 'Fire red', 12, '#D8322F'], ['silver', 'Silver', 15, '#C9CEDB'], ['rainbow', 'Rainbow', 30, '#F59AC3'], ['gold', 'Golden', 60, '#E8B63A', 4]],
  top: [['tee', 'Grey tee', 0], ['navy', 'Navy jumper', 0], ['robe', 'Fluffy robe', 10], ['hoodie', 'Pink hoodie', 12], ['sailor', 'Sailor top', 15], ['dress', 'Star dress', 18], ['parka', 'Snow parka', 20], ['jacket', 'Sparkle jacket', 25], ['stripes', 'Stripy tee', 6], ['overalls', 'Dungarees', 14], ['astro', 'Space suit', 28], ['pop', 'Pop-star jacket', 35, null, 2], ['ballgown', 'Princess gown', 45, null, 3]],
  bottom: [['joggers', 'Joggers', 0], ['shorts', 'Shorts', 8], ['jeans', 'Jeans', 8], ['skirt', 'Teal skirt', 10], ['leggings', 'Striped tights', 12], ['cargo', 'Cargo pants', 10], ['tutu', 'Pink tutu', 14], ['rainbowleg', 'Rainbow tights', 18], ['sparkle', 'Sparkle skirt', 30, null, 2]],
  hat: [['', 'No hat', 0], ['bow', 'Big bow', 6], ['cap', 'Red cap', 8], ['sailorcap', 'Sailor cap', 8], ['crown', 'Party crown', 10], ['flowers', 'Flower crown', 12], ['moon', 'Moon hat', 15], ['party', 'Party hat', 6], ['beanie', 'Beanie', 8], ['beret', 'Beret', 8], ['cowgirl', 'Cowgirl hat', 14], ['witch', 'Witch hat', 14], ['catears', 'Cat ears', 12], ['headphones', 'Headphones', 16], ['horn', 'Unicorn horn', 22], ['tiara', 'Tiara', 24], ['goldcrown', 'Golden crown', 70, null, 3]],
  glasses: [['', 'No glasses', 0], ['round', 'Round', 8], ['aviator', 'Aviators', 12], ['star', 'Star shades', 14], ['heart', 'Heart shades', 14], ['cateye', 'Cat-eye', 12], ['goggles', 'Space goggles', 16], ['rainbowg', 'Rainbow shades', 18]],
  neck: [['', 'Nothing', 0], ['choker', 'Tattoo choker', 8], ['necklace', 'Gold charm', 10], ['scarf', 'Red scarf', 12], ['bowtie', 'Bow tie', 8], ['bandana', 'Bandana', 8], ['lei', 'Flower lei', 12], ['pearls', 'Pearls', 14], ['medal', 'Champion medal', 50, null, 2]],
  face: [['', 'Nothing', 0], ['freckles', 'Freckles', 4], ['gems', 'Cheek gems', 6], ['stars', 'Star stickers', 6], ['cat', 'Kitty face', 8], ['rainbowcheek', 'Rainbow cheeks', 8], ['butterfly', 'Butterfly', 10], ['glitter', 'Glitter', 12]],
  wings: [['', 'No wings', 0], ['fairy', 'Fairy wings', 18], ['butterfly', 'Butterfly wings', 22], ['angel', 'Angel wings', 26], ['cape', 'Hero cape', 20], ['dragon', 'Dragon wings', 80, null, 5]],
  hold: [['', 'Nothing', 0], ['flower', 'Flower', 6], ['balloon', 'Balloon', 8], ['icecream', 'Ice cream', 8], ['wand', 'Star wand', 12], ['book', 'Magic book', 12], ['mic', 'Microphone', 14], ['trophy', 'Gold trophy', 60, null, 4]],
  bg: [['pink', 'Unicorn pink', 0, ['#FFD1E8', '#F8A5D2']], ['sky', 'Sky', 0, ['#C9EBFF', '#8CCBFF']], ['mint', 'Mint', 0, ['#D2F7E3', '#8FE0B9']], ['sunset', 'Sunset', 10, ['#FFD9A8', '#FF9AA8']], ['night', 'Starry night', 15, ['#2B2A5E', '#6A55B5']], ['rainbow', 'Rainbow', 20, ['#FFB3C7', '#9AD0FF']],
    ['beach', 'Beach', 18, 'img'], ['castle', 'Castle', 22, 'img'], ['candy', 'Candy land', 24, 'img'], ['forest', 'Enchanted forest', 26, 'img'], ['space', 'Outer space', 30, 'img'], ['ice', 'Ice kingdom', 30, 'img'], ['stage', 'Pop concert', 60, 'img', 3]],
  pet: [['ginger', 'Pato', 0], ['bimba', 'Bimba', 0], ['duck', 'Ducky', 0], ['unicorn', 'Sparkle the unicorn', 30], ['bunny', 'Snowy the bunny', 30], ['panda', 'Bamboo the panda', 35], ['fox', 'Rusty the fox', 35], ['penguin', 'Waddle the penguin', 35], ['dragon', 'Ember the dragon', 70, null, 2]],
  phat: [['', 'No hat', 0], ['partyhat', 'Party hat', 5], ['pbow', 'Big bow', 6], ['pberet', 'Beret', 8], ['pflowers', 'Flower crown', 9], ['ptop', 'Top hat', 10], ['pcrown', 'Little crown', 12]],
  pglasses: [['', 'No shades', 0], ['psun', 'Sunnies', 8], ['pheart', 'Heart shades', 9], ['pstar', 'Star shades', 10]],
  pneck: [['', 'Nothing', 0], ['pbowtie', 'Bow tie', 6], ['pscarf', 'Scarf', 8], ['pbell', 'Bell collar', 8], ['pmedal', 'Gold medal', 40, null, 2]]
};
const AV_DEFAULT = { skin: 'sk4', hairStyle: 'curly', hairColor: 'dkbrown', top: 'tee', bottom: 'joggers', hat: '', glasses: '', neck: '', face: '', wings: '', hold: '', bg: 'pink' };
const MASCOT_IDS = AV_ITEMS.pet.map(function(r){ return r[0]; });
const PET_ACC_SLOTS = ['phat', 'pglasses', 'pneck'];
const SHOP_MULTS = [1, 2, 3, 5, 8];     // the grown-up can make everything cost more (set in the Grown-ups panel)
/* price groups: the grown-up can set a different multiplier for each (S.shopCat[group]); a group without its own value follows the general one (S.shopMult) */
const SHOP_CATS = [
  { k: 'clothes', label: 'Ropa y pelo', slots: ['top', 'bottom', 'hairStyle', 'hairColor', 'skin'] },
  { k: 'acc', label: 'Accesorios', slots: ['hat', 'glasses', 'neck', 'face', 'wings', 'hold'] },
  { k: 'scene', label: 'Escenas', slots: ['bg'] },
  { k: 'pet', label: 'Mascotas y su ropa', slots: ['pet', 'phat', 'pglasses', 'pneck'] },
  { k: 'box', label: 'Cajas sorpresa', slots: [] }
];
const BOX_COST = 12;                    // base price of a surprise box
function avItem(slot, id){ const l = AV_ITEMS[slot] || []; for(let i = 0; i < l.length; i++) if(l[i][0] === id) return { id: l[i][0], name: l[i][1], cost: l[i][2], c: l[i][3], req: l[i][4] || 0 }; return null; }
function avOwns(state, slot, id){ const it = avItem(slot, id); if(!it) return false; return it.cost === 0 || (state.owned || []).indexOf(slot + ':' + id) > -1; }
function shopMult(state){ const m = Number(state && state.shopMult); return SHOP_MULTS.indexOf(m) > -1 ? m : 1; }
function slotCat(slot){ for(let i = 0; i < SHOP_CATS.length; i++) if(SHOP_CATS[i].slots.indexOf(slot) > -1) return SHOP_CATS[i].k; return 'acc'; }
function catMult(state, cat){ const o = state && state.shopCat && Number(state.shopCat[cat]); return SHOP_MULTS.indexOf(o) > -1 ? o : shopMult(state); }
function cleanShopCat(o){ const out = {}; if(!o || typeof o !== 'object' || Array.isArray(o)) return out; SHOP_CATS.forEach(function(c){ const v = Number(o[c.k]); if(SHOP_MULTS.indexOf(v) > -1) out[c.k] = v; }); return out; }
function avGold(state){ let n = 0; const sk = (state && state.skills) || {}; Object.keys(sk).forEach(function(k){ if(sk[k] && sk[k].medal >= 3) n++; }); return n; }
function avLocked(state, slot, id){ const it = avItem(slot, id); return !!(it && it.req > avGold(state) && !avOwns(state, slot, id)); }
function avPrice(state, slot, id){ const it = avItem(slot, id); if(!it || it.cost === 0) return 0; return Math.max(1, Math.round(it.cost * catMult(state, slotCat(slot)))); }
function defaultAvatar(){ return Object.assign({}, AV_DEFAULT); }
function cleanOwned(a){
  const out = []; if(!Array.isArray(a)) return out;
  a.forEach(function(x){ x = String(x); const i = x.indexOf(':'); if(i < 1) return; const it = avItem(x.slice(0, i), x.slice(i + 1)); if(it && it.cost > 0 && out.indexOf(x) === -1) out.push(x); });
  return out;
}
function cleanAvatar(a, owned){
  const out = defaultAvatar(); if(!a || typeof a !== 'object') return out;
  AV_SLOTS.forEach(function(sl){ const slot = sl.k;
    const id = typeof a[slot] === 'string' ? a[slot] : null; const it = id === null ? null : avItem(slot, id);
    if(it && (it.cost === 0 || owned.indexOf(slot + ':' + id) > -1)) out[slot] = id;
  });
  return out;
}
/* what each mascot wears: { ginger: { phat, pglasses, pneck }, ... } */
function cleanPetAcc(a, owned){
  const out = {}; if(!a || typeof a !== 'object') return out;
  MASCOT_IDS.forEach(function(m){ const src = a[m]; if(!src || typeof src !== 'object') return; const o = {};
    PET_ACC_SLOTS.forEach(function(sl){ const id = typeof src[sl] === 'string' ? src[sl] : ''; const it = id ? avItem(sl, id) : null; if(it && (it.cost === 0 || owned.indexOf(sl + ':' + id) > -1)) o[sl] = id; });
    if(Object.keys(o).length) out[m] = o; });
  return out;
}
function petWears(state, mascot){ const a = (state.petAcc || {})[mascot] || {}; return { phat: a.phat || '', pglasses: a.pglasses || '', pneck: a.pneck || '' }; }
function avWorn(state, slot, id){
  if(slot === 'pet') return state.friend === id;
  if(PET_ACC_SLOTS.indexOf(slot) > -1) return petWears(state, state.friend)[slot] === id;
  return (state.avatar || {})[slot] === id;
}
/* put on something she owns (pets and pet clothes apply to the mascot she has picked). Returns true on success. */
function avEquip(state, slot, id){
  if(!avOwns(state, slot, id)) return false;
  if(slot === 'pet'){ state.friend = id; return true; }
  if(PET_ACC_SLOTS.indexOf(slot) > -1){ state.petAcc = state.petAcc || {}; const w = state.petAcc[state.friend] = Object.assign(petWears(state, state.friend), {}); w[slot] = id; return true; }
  state.avatar[slot] = id; return true;
}
/* buy with stars (never touches totalStars: lifetime stars stay a record of effort). Returns 'ok' | 'owned' | 'poor' | 'locked' | 'bad'. */
function avBuy(state, slot, id){
  const it = avItem(slot, id); if(!it) return 'bad';
  if(avOwns(state, slot, id)) return 'owned';
  if(avLocked(state, slot, id)) return 'locked';
  const price = avPrice(state, slot, id);
  if(state.starBalance < price) return 'poor';
  state.starBalance -= price; state.owned.push(slot + ':' + id); avEquip(state, slot, id); return 'ok';
}
function avCost(slot, id){ const it = avItem(slot, id); return it ? it.cost : 0; }
/* every purchasable thing she could still win */
function avCandidates(state){
  const out = []; AV_SLOTS.concat(PET_SLOTS).forEach(function(sl){ (AV_ITEMS[sl.k] || []).forEach(function(r){ if(r[2] > 0 && !avOwns(state, sl.k, r[0]) && !avLocked(state, sl.k, r[0])) out.push({ slot: sl.k, id: r[0] }); }); });
  return out;
}
/* surprise box: a random item she does not own yet (and may open). Returns {slot,id} | 'poor' | 'full'. */
function avBox(state, rnd){
  const c = avCandidates(state); if(!c.length) return 'full';
  const price = boxPrice(state); if(state.starBalance < price) return 'poor';
  const w = c[Math.min(c.length - 1, Math.floor((rnd || Math.random)() * c.length))];
  state.starBalance -= price; state.owned.push(w.slot + ':' + w.id); avEquip(state, w.slot, w.id); return w;
}
function boxPrice(state){ return Math.max(1, Math.round(BOX_COST * catMult(state, 'box'))); }
/* progress through the wardrobe + the next legendary prize */
function avProgress(state){
  let total = 0, have = 0, next = null; const gold = avGold(state);
  AV_SLOTS.concat(PET_SLOTS).forEach(function(sl){ (AV_ITEMS[sl.k] || []).forEach(function(r){ if(r[2] <= 0) return; total++; if(avOwns(state, sl.k, r[0])) have++; else if(r[4] > gold && (next === null || r[4] < next.req)) next = { slot: sl.k, id: r[0], name: r[1], req: r[4] }; }); });
  return { total: total, have: have, gold: gold, next: next };
}

/* ---------- procedural SVG (200 x 300 canvas) ---------- */
let _avN = 0;
/* wings / cape: drawn behind the body. One side is drawn, the other is a mirror. */
function wingsSVG(id){
  if(!id) return '';
  const mir = function(d){ return d + '<g transform="translate(200,0) scale(-1,1)">' + d + '</g>'; };
  if(id === 'fairy') return mir('<path d="M88,158 C40,50 0,96 16,140 C28,166 66,172 88,170Z" fill="#CFE8FF" fill-opacity=".85" stroke="#8CB6E0" stroke-width="2.5"/><path d="M88,174 C48,168 28,204 40,232 C62,242 84,204 88,186Z" fill="#E6D4FF" fill-opacity=".85" stroke="#B59AE0" stroke-width="2.5"/><circle cx="38" cy="122" r="3" fill="#fff"/><circle cx="54" cy="146" r="2.5" fill="#fff"/>');
  if(id === 'butterfly') return mir('<path d="M88,156 C44,40 -2,76 12,128 C22,160 70,172 88,168Z" fill="#F9A8D4" stroke="#E0407F" stroke-width="2.5"/><path d="M88,174 C50,172 30,210 44,238 C66,244 86,208 88,188Z" fill="#C9A6F5" stroke="#8E6BD8" stroke-width="2.5"/><circle cx="36" cy="104" r="9" fill="#FFE27A" stroke="#E8A33D" stroke-width="1.5"/><circle cx="40" cy="206" r="6" fill="#fff" fill-opacity=".8"/>');
  if(id === 'angel') return mir('<path d="M88,160 C60,60 20,50 6,70 C18,76 22,90 20,100 C32,100 40,112 38,124 C50,124 58,136 56,148 C68,150 76,160 88,176Z" fill="#fff" stroke="#C9CDE6" stroke-width="2.5" stroke-linejoin="round"/><path d="M40,92 Q60,120 84,166 M26,84 Q50,116 80,164" stroke="#E3E6F5" stroke-width="2" fill="none"/>');
  if(id === 'dragon') return mir('<path d="M88,156 L8,52 Q18,98 6,118 Q30,112 34,134 Q52,124 62,150 Q76,160 88,176Z" fill="#7B4FC4" stroke="#4E2C8C" stroke-width="2.5" stroke-linejoin="round"/><path d="M88,160 L12,60 M88,164 L34,134 M88,168 L62,150" stroke="#4E2C8C" stroke-width="2" fill="none"/>');
  if(id === 'cape') return '<path d="M70,148 H130 L160,266 Q100,286 40,266Z" fill="#E63946" stroke="#B82633" stroke-width="2.5" stroke-linejoin="round"/><path d="M100,150 V276" stroke="#B82633" stroke-width="2" opacity=".6"/><circle cx="100" cy="150" r="6" fill="#FFD23F" stroke="#E8A33D" stroke-width="1.5"/>';
  return '';
}

function avatarSVG(av, o){
  o = o || {}; av = av || AV_DEFAULT; const view = o.view || 'full', n = 'av' + (++_avN);
  const skin = (avItem('skin', av.skin) || avItem('skin', 'sk4')).c, hc = av.hairColor === 'rainbow' ? 'url(#' + n + 'hr)' : (avItem('hairColor', av.hairColor) || avItem('hairColor', 'dkbrown')).c;
  const hairDark = '#00000022';
  const bgI = avItem('bg', av.bg) || avItem('bg', 'pink'), isImg = bgI.c === 'img' && typeof SCENE_IMG !== 'undefined' && !!SCENE_IMG[bgI.id], bg = Array.isArray(bgI.c) ? bgI.c : ['#FFD1E8', '#F8A5D2'];
  let s = '';
  /* background */
  s += '<defs><linearGradient id="' + n + 'g" x1="0" y1="0" x2="0" y2="1">' + (av.bg === 'rainbow' ? '<stop offset="0" stop-color="#FFB3C7"/><stop offset=".33" stop-color="#FFE27A"/><stop offset=".66" stop-color="#A8E6A3"/><stop offset="1" stop-color="#9AD0FF"/>' : '<stop offset="0" stop-color="' + bg[0] + '"/><stop offset="1" stop-color="' + bg[1] + '"/>') + '</linearGradient></defs>';
  s += '<rect x="0" y="0" width="200" height="300" rx="22" fill="url(#' + n + 'g)"/>';
  if(isImg) s += '<clipPath id="' + n + 'c"><rect x="0" y="0" width="200" height="300" rx="22"/></clipPath><image href="' + SCENE_IMG[bgI.id] + '" x="0" y="0" width="200" height="300" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + n + 'c)"/>';
  if(av.hairColor === 'rainbow') s += '<defs><linearGradient id="' + n + 'hr" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="200"><stop offset="0" stop-color="#F55C9A"/><stop offset=".25" stop-color="#FFB84D"/><stop offset=".5" stop-color="#7FD99A"/><stop offset=".75" stop-color="#5B8BE0"/><stop offset="1" stop-color="#A77BE0"/></linearGradient></defs>';
  if(av.glasses === 'rainbowg') s += '<defs><linearGradient id="' + n + 'gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F55C9A"/><stop offset=".33" stop-color="#FFE27A"/><stop offset=".66" stop-color="#7FD99A"/><stop offset="1" stop-color="#5B8BE0"/></linearGradient></defs>';
  if(av.bg === 'night') [[30, 30], [160, 24], [175, 90], [20, 120], [150, 160], [40, 200], [170, 230], [25, 260]].forEach(function(p, i){ s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 2 ? 2 : 3) + '" fill="#fff" opacity=".9"/>'; });
  s += '<ellipse cx="100" cy="294" rx="52" ry="6" fill="#00000022"/>';
  s += wingsSVG(av.wings);
  /* hair behind the body */
  const hs = av.hairStyle;
  if(hs === 'curly') [[52, 70, 17], [44, 94, 17], [48, 118, 16], [58, 136, 14], [148, 70, 17], [156, 94, 17], [152, 118, 16], [142, 136, 14], [64, 48, 17], [82, 38, 17], [100, 34, 17], [118, 38, 17], [136, 48, 17]].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + hc + '"/>'; });
  if(hs === 'buns'){ s += '<circle cx="60" cy="38" r="21" fill="' + hc + '"/><circle cx="140" cy="38" r="21" fill="' + hc + '"/>'; }
  if(hs === 'long') s += '<path d="M50,80 Q44,140 52,196 L148,196 Q156,140 150,80Z" fill="' + hc + '"/>';
  if(hs === 'short') s += '<path d="M50,84 Q46,126 60,136 L140,136 Q154,126 150,84Z" fill="' + hc + '"/>';
  if(hs === 'ponytail') s += '<path d="M138,52 Q186,60 178,120 Q174,160 160,170 Q170,120 150,84Z" fill="' + hc + '"/>';
  if(hs === 'braids'){ [60, 140].forEach(function(x){ for(let i = 0; i < 6; i++) s += '<ellipse cx="' + x + '" cy="' + (122 + i * 16) + '" rx="9" ry="9" fill="' + hc + '" stroke="' + hairDark + '" stroke-width="1.5"/>'; s += '<circle cx="' + x + '" cy="214" r="5" fill="#F27BA8"/>'; }); }
  if(hs === 'pigtails') [0, 1].forEach(function(i){ s += '<path d="' + (i ? 'M144,84 Q172,120 158,162 Q142,152 138,100Z' : 'M56,84 Q28,120 42,162 Q58,152 62,100Z') + '" fill="' + hc + '"/>'; });
  if(hs === 'topbun') s += '<circle cx="100" cy="26" r="22" fill="' + hc + '"/>';
  if(hs === 'puff') [[48, 70, 22], [40, 98, 20], [46, 124, 17], [152, 70, 22], [160, 98, 20], [154, 124, 17], [62, 44, 22], [82, 32, 22], [100, 28, 22], [118, 32, 22], [138, 44, 22]].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + hc + '"/>'; });
  if(hs === 'wavy') s += '<path d="M50,80 Q38,112 54,140 Q40,170 56,202 L144,202 Q160,170 146,140 Q162,112 150,80Z" fill="' + hc + '"/>';
  /* legs + shoes */
  const bottom = av.bottom, top = av.top, dress = top === 'dress' || top === 'ballgown';
  s += '<rect x="82" y="214" width="15" height="72" rx="7" fill="' + skin + '"/><rect x="103" y="214" width="15" height="72" rx="7" fill="' + skin + '"/>';
  s += '<ellipse cx="89" cy="291" rx="15" ry="7" fill="#fff" stroke="#B8B2C8" stroke-width="2"/><ellipse cx="111" cy="291" rx="15" ry="7" fill="#fff" stroke="#B8B2C8" stroke-width="2"/><path d="M76,293 H102 M98,293 H124" stroke="#F27BA8" stroke-width="3"/>';
  /* bottoms */
  if(!dress){
    if(bottom === 'joggers') s += '<rect x="70" y="204" width="60" height="26" rx="8" fill="#6F7280"/><rect x="72" y="214" width="26" height="68" rx="9" fill="#7C7F90"/><rect x="102" y="214" width="26" height="68" rx="9" fill="#7C7F90"/><path d="M96,214 V232 M104,214 V232" stroke="#4E5160" stroke-width="2"/><rect x="72" y="274" width="26" height="8" rx="4" fill="#5E6170"/><rect x="102" y="274" width="26" height="8" rx="4" fill="#5E6170"/>';
    if(bottom === 'jeans') s += '<rect x="70" y="204" width="60" height="26" rx="8" fill="#4F7FD0"/><rect x="73" y="214" width="24" height="70" rx="8" fill="#5B8BE0"/><rect x="103" y="214" width="24" height="70" rx="8" fill="#5B8BE0"/><path d="M100,214 V240" stroke="#3E67B0" stroke-width="2"/>';
    if(bottom === 'shorts') s += '<rect x="70" y="204" width="60" height="26" rx="8" fill="#F2B632"/><rect x="72" y="214" width="26" height="36" rx="8" fill="#FFC94D"/><rect x="102" y="214" width="26" height="36" rx="8" fill="#FFC94D"/>';
    if(bottom === 'skirt') s += '<path d="M72,206 H128 L146,262 Q100,276 54,262Z" fill="#4CC9B8"/><path d="M60,252 Q100,268 140,252" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="4 5"/>';
    if(bottom === 'leggings'){ s += '<rect x="70" y="204" width="60" height="26" rx="8" fill="#7B4FC4"/><rect x="80" y="214" width="19" height="70" rx="8" fill="#8E63D8"/><rect x="101" y="214" width="19" height="70" rx="8" fill="#8E63D8"/>'; for(let i = 0; i < 6; i++) s += '<path d="M80,' + (224 + i * 10) + ' H99 M101,' + (224 + i * 10) + ' H120" stroke="#2A2340" stroke-width="3"/>'; }
  }
  if(!dress){
    if(bottom === 'cargo') s += '<rect x="70" y="204" width="60" height="26" rx="8" fill="#7E8450"/><rect x="72" y="214" width="26" height="68" rx="9" fill="#8A9058"/><rect x="102" y="214" width="26" height="68" rx="9" fill="#8A9058"/><rect x="75" y="236" width="14" height="14" rx="3" fill="#7E8450"/><rect x="111" y="236" width="14" height="14" rx="3" fill="#7E8450"/>';
    if(bottom === 'tutu') s += '<rect x="70" y="204" width="60" height="10" rx="5" fill="#E552A8"/><path d="M68,210 H132 Q164,240 152,254 Q100,268 48,254 Q36,240 68,210Z" fill="#F9A8D4"/><path d="M62,238 Q100,258 138,238 Q150,248 144,254 Q100,266 56,254 Q50,248 62,238Z" fill="#FBC9E4"/>';
    if(bottom === 'rainbowleg'){ s += '<rect x="70" y="204" width="60" height="26" rx="8" fill="#F55C9A"/>'; [80, 101].forEach(function(x){ ['#F55C9A', '#FFB84D', '#FFE27A', '#7FD99A', '#5B8BE0', '#A77BE0', '#F55C9A'].forEach(function(c, i){ s += '<rect x="' + x + '" y="' + (214 + i * 10) + '" width="19" height="' + (i === 6 ? 14 : 10) + '" fill="' + c + '"/>'; }); }); }
    if(bottom === 'sparkle') s += '<path d="M72,206 H128 L148,264 Q100,278 52,264Z" fill="#B9A6F0"/><path d="M60,254 Q100,270 140,254" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="4 5"/>' + [[84, 228], [112, 240], [98, 256], [128, 226], [74, 250]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="#fff"/>'; }).join('');
  }
  /* neck + arms (skin), then the top over them */
  s += '<rect x="90" y="124" width="20" height="30" rx="8" fill="' + skin + '"/>';
  s += '<circle cx="44" cy="206" r="9" fill="' + skin + '"/><circle cx="156" cy="206" r="9" fill="' + skin + '"/>';
  const sleeve = function(col, long, w){ w = w || 20; const e = long ? 198 : 176; return '<path d="M72,156 L' + (long ? 46 : 54) + ',' + e + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"/><path d="M128,156 L' + (long ? 154 : 146) + ',' + e + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"/>'; };
  const torso = function(col, h, rx){ return '<rect x="66" y="142" width="68" height="' + (h || 70) + '" rx="' + (rx || 12) + '" fill="' + col + '"/>'; };
  if(top === 'tee') s += sleeve('#C9CCD6', false) + torso('#C9CCD6') + '<path d="M86,146 Q100,162 114,146" stroke="#fff" stroke-width="5" fill="none"/>';
  if(top === 'navy') s += sleeve('#2B3A67', true) + torso('#2B3A67') + '<path d="M88,146 Q100,158 112,146" stroke="#3B4D85" stroke-width="5" fill="none"/>' + [[80, 170], [100, 182], [118, 168], [90, 196], [112, 200], [74, 190]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="#4A5E9E"/>'; }).join('');
  if(top === 'robe') s += sleeve('#D77A9A', true, 22) + torso('#D77A9A', 86, 14) + '<path d="M100,146 L86,212 M100,146 L114,212" stroke="#B85E7E" stroke-width="3"/><rect x="66" y="188" width="68" height="8" fill="#B85E7E"/>' + [[78, 170], [122, 172], [84, 206], [116, 208], [72, 190]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#E99BB6"/>'; }).join('');
  if(top === 'hoodie') s += '<path d="M72,134 Q100,170 128,134 Q122,150 100,158 Q78,150 72,134Z" fill="#E0609A"/>' + sleeve('#F27BA8', true) + torso('#F27BA8') + '<path d="M80,142 Q100,172 120,142 Q112,150 100,154 Q88,150 80,142Z" fill="#E0609A"/><rect x="82" y="188" width="36" height="16" rx="6" fill="#E0609A"/><path d="M94,156 V178 M106,156 V178" stroke="#fff" stroke-width="2"/>';
  if(top === 'sailor') s += sleeve('#fff', false) + '<path d="M72,156 L54,176 M128,156 L146,176" stroke="#2B3A67" stroke-width="3" stroke-dasharray="3 3"/>' + torso('#fff') + '<path d="M72,142 L100,176 L128,142 L118,142 L100,164 L82,142Z" fill="#2B3A67"/><path d="M92,164 L100,186 L108,164Z" fill="#E63946"/>';
  if(top === 'dress') s += sleeve('#8E6BD8', false) + '<path d="M66,142 H134 L152,262 Q100,276 48,262Z" fill="#8E6BD8"/><path d="M86,146 Q100,160 114,146" stroke="#fff" stroke-width="4" fill="none"/><path d="M52,252 Q100,268 148,252" stroke="#C9B3F5" stroke-width="4" fill="none"/>' + [[84, 190], [118, 200], [100, 230], [76, 244], [126, 238]].map(function(p){ return '<path d="M' + p[0] + ',' + (p[1] - 6) + ' l2,5 5,0 -4,3 2,5 -5,-3 -5,3 2,-5 -4,-3 5,0Z" fill="#FFE27A"/>'; }).join('');
  if(top === 'parka') s += sleeve('#9FD3F2', true, 22) + torso('#9FD3F2', 76, 14) + '<ellipse cx="100" cy="146" rx="26" ry="11" fill="#fff"/><path d="M100,156 V212" stroke="#7FB8DE" stroke-width="3"/>' + [[82, 180], [118, 186], [90, 204]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#fff"/>'; }).join('');
  if(top === 'jacket') s += sleeve('#DDE1EE', true) + torso('#B9A6F0') + '<path d="M66,142 H96 L92,212 H66Z M134,142 H104 L108,212 H134Z" fill="#DDE1EE"/>' + [[76, 160], [124, 168], [80, 190], [122, 196], [70, 176], [130, 150]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="#fff"/>'; }).join('');
  if(top === 'stripes'){ s += sleeve('#fff', false) + torso('#fff'); for(let i = 0; i < 5; i++) s += '<rect x="66" y="' + (152 + i * 12) + '" width="68" height="5" fill="#E552A8"/>'; s += '<path d="M86,146 Q100,162 114,146" stroke="#E552A8" stroke-width="5" fill="none"/>'; }
  if(top === 'overalls') s += sleeve('#F9E3F0', true) + torso('#F9E3F0') + '<path d="M82,162 L78,142 M118,162 L122,142" stroke="#4F7FD0" stroke-width="7" stroke-linecap="round"/><rect x="76" y="160" width="48" height="56" rx="8" fill="#4F7FD0"/><rect x="88" y="178" width="24" height="16" rx="4" fill="#5B8BE0"/><circle cx="82" cy="166" r="2.6" fill="#FFD23F"/><circle cx="118" cy="166" r="2.6" fill="#FFD23F"/>';
  if(top === 'astro') s += sleeve('#F2F4FA', true, 22) + torso('#F2F4FA') + '<ellipse cx="100" cy="146" rx="28" ry="10" fill="none" stroke="#9AA6C8" stroke-width="5"/><rect x="82" y="166" width="36" height="24" rx="6" fill="#C9D2E8"/><circle cx="90" cy="178" r="3.4" fill="#F55C9A"/><circle cx="100" cy="178" r="3.4" fill="#FFD23F"/><circle cx="110" cy="178" r="3.4" fill="#5B8BE0"/><rect x="70" y="198" width="14" height="8" rx="2" fill="#5B8BE0"/>';
  if(top === 'pop') s += sleeve('#7B4FC4', true) + torso('#F55C9A') + '<path d="M66,142 H96 L92,212 H66Z M134,142 H104 L108,212 H134Z" fill="#7B4FC4"/>' + [[78, 160], [124, 168], [80, 190], [122, 196], [72, 176], [128, 150]].map(function(p){ return '<path d="M' + p[0] + ',' + (p[1] - 5) + ' l1.6,3.6 3.8,.4 -2.9,2.5 .9,3.8 -3.4,-2 -3.4,2 .9,-3.8 -2.9,-2.5 3.8,-.4Z" fill="#FFD23F"/>'; }).join('');
  if(top === 'ballgown') s += '<path d="M66,142 H134 L162,268 Q100,288 38,268Z" fill="#F9B8DA"/><path d="M50,258 Q100,278 150,258 M60,230 Q100,248 140,230 M70,200 Q100,214 130,200" stroke="#fff" stroke-width="3" fill="none" opacity=".85"/><circle cx="62" cy="152" r="13" fill="#F9B8DA"/><circle cx="138" cy="152" r="13" fill="#F9B8DA"/><path d="M86,146 Q100,160 114,146" stroke="#fff" stroke-width="4" fill="none"/>' + [[84, 188], [118, 206], [96, 236], [72, 250], [128, 244]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="#fff"/>'; }).join('');
  /* neck accessory */
  const nk = av.neck;
  if(nk === 'choker') s += '<path d="M88,142 Q100,150 112,142" stroke="#E552A8" stroke-width="5" fill="none"/><path d="M88,146 Q100,154 112,146" stroke="#9AA3B5" stroke-width="3" fill="none"/>';
  if(nk === 'necklace') s += '<path d="M84,142 Q100,184 116,142" stroke="#E8B63A" stroke-width="2.5" fill="none"/><circle cx="100" cy="174" r="5" fill="#FFD866" stroke="#E8B63A" stroke-width="1.5"/>';
  if(nk === 'scarf') s += '<rect x="80" y="140" width="40" height="14" rx="7" fill="#E63946"/><path d="M108,150 L116,184 L102,180Z" fill="#C92E3B"/>';
  const neckDots = function(cols, r){ let o = ''; for(let i = 0; i < 9; i++){ const t = i / 8, x = 84 + 32 * t, y = 142 * (1 - t) * (1 - t) + 2 * 188 * t * (1 - t) + 142 * t * t; o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="' + cols[i % cols.length] + '"/>'; } return o; };
  if(nk === 'bowtie') s += '<path d="M100,152 L80,140 V164Z M100,152 L120,140 V164Z" fill="#E63946" stroke="#B82633" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="152" r="5" fill="#B82633"/>';
  if(nk === 'bandana') s += '<path d="M78,140 H122 L100,180Z" fill="#E63946" stroke="#B82633" stroke-width="2" stroke-linejoin="round"/>' + [[92, 150], [108, 150], [100, 164]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="#fff"/>'; }).join('');
  if(nk === 'lei') s += neckDots(['#F55C9A', '#FFB84D', '#fff', '#FFE27A'], 5.4);
  if(nk === 'pearls') s += neckDots(['#FFFFFF'], 4.6).replace(/fill="#FFFFFF"/g, 'fill="#FFFFFF" stroke="#D5D9E8" stroke-width="1.2"');
  if(nk === 'medal') s += '<path d="M88,140 L100,176 L112,140" stroke="#5B8BE0" stroke-width="8" fill="none" stroke-linejoin="round"/><circle cx="100" cy="182" r="11" fill="#FFD23F" stroke="#E8A33D" stroke-width="2.5"/><path d="M100,175 l2.4,5 5.4,.6 -4,3.7 1.1,5.3 -4.9,-2.7 -4.9,2.7 1.1,-5.3 -4,-3.7 5.4,-.6Z" fill="#fff"/>';
  /* props she holds in her right hand */
  const hd = av.hold;
  if(hd === 'flower') s += '<path d="M156,206 V166" stroke="#4CB89A" stroke-width="4" stroke-linecap="round"/><path d="M156,190 Q146,184 142,176 Q152,176 156,186Z" fill="#7FD99A"/>' + [0, 1, 2, 3, 4].map(function(k){ const a = k * 1.2566; return '<circle cx="' + (156 + Math.cos(a) * 8).toFixed(1) + '" cy="' + (160 + Math.sin(a) * 8).toFixed(1) + '" r="6.5" fill="#F55C9A"/>'; }).join('') + '<circle cx="156" cy="160" r="5" fill="#FFD23F"/>';
  if(hd === 'balloon') s += '<path d="M156,206 Q150,184 164,150" stroke="#9AA3B5" stroke-width="2" fill="none"/><ellipse cx="166" cy="128" rx="20" ry="24" fill="#F55C9A" stroke="#C93475" stroke-width="2"/><ellipse cx="159" cy="120" rx="5" ry="8" fill="#fff" opacity=".45"/><path d="M166,152 l-4,6 h8Z" fill="#C93475"/>';
  if(hd === 'icecream') s += '<path d="M146,176 L156,212 L166,176Z" fill="#E8B26A" stroke="#C98A4B" stroke-width="2" stroke-linejoin="round"/><circle cx="156" cy="170" r="12" fill="#F9A8D4"/><circle cx="156" cy="156" r="10" fill="#FFF3C9"/><circle cx="156" cy="146" r="4" fill="#E63946"/>';
  if(hd === 'wand') s += '<path d="M156,214 L164,160" stroke="#B9A6F0" stroke-width="5" stroke-linecap="round"/><path d="M165,136 l5,11 12,1.4 -9,8 3,12 -11,-6.4 -11,6.4 3,-12 -9,-8 12,-1.4Z" fill="#FFD23F" stroke="#E8A33D" stroke-width="2" stroke-linejoin="round"/>';
  if(hd === 'book') s += '<rect x="136" y="178" width="38" height="46" rx="5" fill="#8E6BD8" stroke="#5E3FAA" stroke-width="2.5" transform="rotate(8 155 200)"/><rect x="142" y="184" width="26" height="6" rx="2" fill="#FFD23F" transform="rotate(8 155 200)"/><path d="M148,200 l3,6 6.6,.8 -4.8,4.4 1.3,6.4 -6.1,-3.3 -6.1,3.3 1.3,-6.4 -4.8,-4.4 6.6,-.8Z" fill="#fff" transform="translate(7 -6) rotate(8 155 200)"/>';
  if(hd === 'mic') s += '<rect x="153" y="176" width="7" height="40" rx="3.5" fill="#5E6275"/><circle cx="156.5" cy="168" r="11" fill="#C9CDE6" stroke="#8F99AE" stroke-width="2.5"/><path d="M147,168 H166 M149,162 H164 M149,174 H164" stroke="#8F99AE" stroke-width="1.4"/>';
  if(hd === 'trophy') s += '<path d="M142,150 H172 Q172,184 157,188 Q142,184 142,150Z" fill="#FFD23F" stroke="#E8A33D" stroke-width="2.5" stroke-linejoin="round"/><path d="M142,156 Q130,156 134,170 Q138,176 146,176 M172,156 Q184,156 180,170 Q176,176 168,176" stroke="#E8A33D" stroke-width="3" fill="none"/><rect x="153" y="186" width="8" height="14" fill="#E8A33D"/><rect x="144" y="198" width="26" height="8" rx="3" fill="#B9822A"/>';
  /* head */
  s += '<circle cx="54" cy="92" r="8" fill="' + skin + '"/><circle cx="146" cy="92" r="8" fill="' + skin + '"/><ellipse cx="100" cy="88" rx="46" ry="48" fill="' + skin + '"/>';
  /* face */
  s += '<circle cx="72" cy="108" r="8" fill="#F2748C" opacity=".28"/><circle cx="128" cy="108" r="8" fill="#F2748C" opacity=".28"/>';
  s += '<ellipse cx="82" cy="92" rx="6" ry="7.5" fill="#2A1A14"/><ellipse cx="118" cy="92" rx="6" ry="7.5" fill="#2A1A14"/><circle cx="84" cy="89" r="2.2" fill="#fff"/><circle cx="120" cy="89" r="2.2" fill="#fff"/>';
  s += '<path d="M72,78 Q82,72 92,77 M108,77 Q118,72 128,78" stroke="' + hc + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M97,104 Q100,107 103,104" stroke="#00000044" stroke-width="2" fill="none" stroke-linecap="round"/>';
  s += '<path d="M82,114 Q100,132 118,114 Q100,120 82,114Z" fill="#B8323F" stroke="#B8323F" stroke-width="2" stroke-linejoin="round"/><path d="M95,117 Q100,120 105,117 L105,121 Q100,123 95,121Z" fill="#fff"/>';
  const fc = av.face;
  if(fc === 'freckles') [[88, 102], [94, 106], [100, 101], [106, 106], [112, 102], [92, 99], [108, 99]].forEach(function(p){ s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4" fill="#8A4E2E" opacity=".8"/>'; });
  if(fc === 'gems') s += '<path d="M130,100 l4,-5 4,5 -4,5Z" fill="#CFE8FF" stroke="#8CB6E0" stroke-width="1"/><path d="M137,90 l3,-4 3,4 -3,4Z" fill="#E6D4FF" stroke="#B59AE0" stroke-width="1"/><path d="M70,100 l3,-4 3,4 -3,4Z" fill="#CFE8FF" stroke="#8CB6E0" stroke-width="1"/>';
  if(fc === 'stars') [[70, 104], [130, 104]].forEach(function(p){ s += '<path d="M' + p[0] + ',' + (p[1] - 7) + ' l2,5 5.5,0 -4.4,3.4 1.7,5.4 -4.8,-3.2 -4.8,3.2 1.7,-5.4 -4.4,-3.4 5.5,0Z" fill="#FFD23F" stroke="#E8A33D" stroke-width="1"/>'; });
  if(fc === 'cat') s += '<path d="M96,100 H104 L100,106Z" fill="#F2748C"/>' + [[60, 102, 84, 106], [58, 110, 84, 110], [62, 118, 84, 114], [140, 102, 116, 106], [142, 110, 116, 110], [138, 118, 116, 114]].map(function(l){ return '<path d="M' + l[0] + ',' + l[1] + ' L' + l[2] + ',' + l[3] + '" stroke="#5A3A2A" stroke-width="1.8" stroke-linecap="round"/>'; }).join('');
  if(fc === 'rainbowcheek') [72, 128].forEach(function(x){ ['#F55C9A', '#FFC94D', '#5B8BE0'].forEach(function(c, i){ const r = 9 - i * 3; s += '<path d="M' + (x - r) + ',116 A' + r + ',' + r + ' 0 0 1 ' + (x + r) + ',116" stroke="' + c + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; }); });
  if(fc === 'butterfly') s += '<g transform="translate(130 100)"><ellipse cx="-5" cy="-3" rx="6" ry="5" fill="#F9A8D4" stroke="#E0407F" stroke-width="1"/><ellipse cx="5" cy="-3" rx="6" ry="5" fill="#F9A8D4" stroke="#E0407F" stroke-width="1"/><ellipse cx="-4" cy="4" rx="4" ry="3.4" fill="#C9A6F5"/><ellipse cx="4" cy="4" rx="4" ry="3.4" fill="#C9A6F5"/><rect x="-1" y="-6" width="2" height="12" rx="1" fill="#5A3A2A"/></g>';
  if(fc === 'glitter') [[68, 100, '#FFD23F'], [76, 112, '#fff'], [132, 112, '#FFD23F'], [124, 100, '#F59AC3'], [100, 62, '#fff'], [86, 66, '#FFD23F'], [114, 66, '#F59AC3'], [60, 114, '#F59AC3'], [140, 100, '#fff']].forEach(function(p){ s += '<path d="M' + p[0] + ',' + (p[1] - 4.5) + ' l1.3,3.2 3.2,1.3 -3.2,1.3 -1.3,3.2 -1.3,-3.2 -3.2,-1.3 3.2,-1.3Z" fill="' + p[2] + '" stroke="#00000022" stroke-width=".6"/>'; });
  /* hair in front of the head */
  const cap = function(col){ return '<path d="M52,92 Q46,36 100,34 Q154,36 148,92 Q138,62 100,62 Q62,62 52,92Z" fill="' + col + '"/>'; };
  if(hs === 'curly' || hs === 'puff'){ s += cap(hc); [[68, 62], [80, 58], [92, 62], [108, 62], [120, 58], [132, 62]].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="11" fill="' + hc + '"/>'; }); }
  if(hs === 'buns') s += cap(hc) + '<path d="M100,34 V60" stroke="' + hairDark + '" stroke-width="3"/><circle cx="60" cy="52" r="4" fill="#F27BA8"/><circle cx="140" cy="52" r="4" fill="#F27BA8"/>';
  if(hs === 'long') s += cap(hc) + '<path d="M100,34 Q76,56 56,90 L52,92 Q46,36 100,34Z" fill="' + hairDark + '"/>';
  if(hs === 'short') s += cap(hc) + '<path d="M48,96 Q44,76 52,70 L56,110Z M152,96 Q156,76 148,70 L144,110Z" fill="' + hc + '"/>';
  if(hs === 'ponytail') s += cap(hc) + '<circle cx="146" cy="62" r="5" fill="#F27BA8"/>';
  if(hs === 'braids') s += cap(hc) + '<path d="M100,34 V60" stroke="' + hairDark + '" stroke-width="3"/>';
  if(hs === 'pigtails') s += cap(hc) + '<path d="M100,34 V60" stroke="' + hairDark + '" stroke-width="3"/><circle cx="56" cy="86" r="5" fill="#F27BA8"/><circle cx="144" cy="86" r="5" fill="#F27BA8"/>';
  if(hs === 'topbun') s += cap(hc) + '<ellipse cx="100" cy="44" rx="15" ry="4.5" fill="#F27BA8"/>';
  if(hs === 'wavy') s += cap(hc) + '<path d="M100,34 Q76,56 56,90 L52,92 Q46,36 100,34Z" fill="' + hairDark + '"/>';
  /* glasses */
  const gl = av.glasses;
  if(gl === 'round') s += '<circle cx="82" cy="92" r="15" fill="#ffffff22" stroke="#F27BA8" stroke-width="3"/><circle cx="118" cy="92" r="15" fill="#ffffff22" stroke="#F27BA8" stroke-width="3"/><path d="M97,92 H103 M67,90 L54,88 M133,90 L146,88" stroke="#F27BA8" stroke-width="3"/>';
  if(gl === 'aviator') s += '<path d="M64,84 Q64,110 82,110 Q98,110 98,86 Q98,80 90,80 H70 Q64,80 64,84Z M102,86 Q102,110 118,110 Q136,110 136,84 Q136,80 130,80 H110 Q102,80 102,86Z" fill="#8F99AE" fill-opacity=".85" stroke="#D8DCE8" stroke-width="3"/><path d="M98,84 H102 M64,84 L54,82 M136,84 L146,82" stroke="#D8DCE8" stroke-width="3"/><path d="M70,88 L78,84 M108,88 L116,84" stroke="#fff" stroke-width="2" opacity=".7"/>';
  if(gl === 'star') [82, 118].forEach(function(x){ s += '<path d="M' + x + ',74 l5,11 12,1 -9,8 3,12 -11,-6 -11,6 3,-12 -9,-8 12,-1Z" fill="#FFD23F" fill-opacity=".85" stroke="#E8A33D" stroke-width="2.5" stroke-linejoin="round"/>'; }); if(gl === 'star') s += '<path d="M98,92 H102" stroke="#E8A33D" stroke-width="3"/>';
  if(gl === 'heart') [82, 118].forEach(function(x){ s += '<path d="M' + x + ',108 C' + (x - 22) + ',92 ' + (x - 10) + ',74 ' + x + ',86 C' + (x + 10) + ',74 ' + (x + 22) + ',92 ' + x + ',108Z" fill="#F55C9A" fill-opacity=".85" stroke="#C93475" stroke-width="2.5" stroke-linejoin="round"/>'; }); if(gl === 'heart') s += '<path d="M98,88 H102" stroke="#C93475" stroke-width="3"/>';
  if(gl === 'cateye') s += '<path d="M60,78 L98,88 Q98,110 80,110 Q62,108 60,78Z M140,78 L102,88 Q102,110 120,110 Q138,108 140,78Z" fill="#2B2B3A" fill-opacity=".82" stroke="#E552A8" stroke-width="3.2" stroke-linejoin="round"/><path d="M98,92 H102" stroke="#E552A8" stroke-width="3"/>';
  if(gl === 'goggles') s += '<circle cx="82" cy="92" r="17" fill="#BFE8FF" fill-opacity=".55" stroke="#7B4FC4" stroke-width="4.5"/><circle cx="118" cy="92" r="17" fill="#BFE8FF" fill-opacity=".55" stroke="#7B4FC4" stroke-width="4.5"/><path d="M99,92 H101 M65,92 H52 M135,92 H148" stroke="#7B4FC4" stroke-width="5"/><path d="M72,84 Q76,80 82,80" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>';
  if(gl === 'rainbowg') s += '<circle cx="82" cy="92" r="15" fill="url(#' + n + 'gr)" fill-opacity=".8" stroke="#fff" stroke-width="3"/><circle cx="118" cy="92" r="15" fill="url(#' + n + 'gr)" fill-opacity=".8" stroke="#fff" stroke-width="3"/><path d="M97,92 H103 M67,90 L54,88 M133,90 L146,88" stroke="#fff" stroke-width="3"/>';
  /* hats */
  const ht = av.hat;
  if(ht === 'bow') s += '<path d="M138,48 L162,34 L162,64Z M138,48 L114,34 L114,64Z" fill="#F55C9A" stroke="#C93475" stroke-width="2" stroke-linejoin="round"/><circle cx="138" cy="48" r="8" fill="#E0407F" stroke="#C93475" stroke-width="2"/>';
  if(ht === 'cap') s += '<path d="M54,64 Q58,22 100,22 Q142,22 146,64Z" fill="#E63946"/><path d="M50,64 H150 Q152,74 100,74 Q48,74 50,64Z" fill="#B82633"/><circle cx="100" cy="22" r="5" fill="#B82633"/>';
  if(ht === 'sailorcap') s += '<path d="M56,62 Q60,26 100,26 Q140,26 144,62Z" fill="#fff" stroke="#D6D9E6" stroke-width="2"/><rect x="54" y="56" width="92" height="12" rx="4" fill="#2B3A67"/><path d="M96,62 l4,-5 4,5 -4,5Z" fill="#fff"/>';
  if(ht === 'crown'){ s += '<path d="M60,58 L66,22 L84,44 L100,14 L116,44 L134,22 L140,58Z" fill="#8FE3C7" stroke="#4CB89A" stroke-width="2.5" stroke-linejoin="round"/>'; [[66, 22, '#FFD23F'], [100, 14, '#F55C9A'], [134, 22, '#5B8BE0']].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="6" fill="' + c[2] + '"/>'; }); [[78, 50, '#F55C9A'], [100, 52, '#FFD23F'], [122, 50, '#fff']].forEach(function(c){ s += '<rect x="' + (c[0] - 4) + '" y="' + (c[1] - 3) + '" width="8" height="6" rx="1.5" fill="' + c[2] + '"/>'; }); }
  if(ht === 'flowers') [[62, 56, '#F55C9A'], [76, 44, '#FFD23F'], [92, 38, '#fff'], [108, 38, '#F55C9A'], [124, 44, '#fff'], [138, 56, '#FFD23F']].forEach(function(c){ for(let k = 0; k < 5; k++){ const a = k * 1.2566; s += '<circle cx="' + (c[0] + Math.cos(a) * 6).toFixed(1) + '" cy="' + (c[1] + Math.sin(a) * 6).toFixed(1) + '" r="4.5" fill="' + c[2] + '" stroke="#00000018" stroke-width=".8"/>'; } s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3.4" fill="#E8A33D"/>'; });
  if(ht === 'moon') s += '<path d="M58,62 Q100,38 142,62 Q130,40 114,12 Q108,2 98,10 Q76,38 58,62Z" fill="#F4E3B0" stroke="#D8C07A" stroke-width="2" stroke-linejoin="round"/><path d="M96,40 a9,9 0 1 0 8,12 a7,7 0 1 1 -8,-12Z" fill="#8E6BD8"/><circle cx="112" cy="12" r="5" fill="#FFD23F"/>';
  if(ht === 'party') s += '<path d="M100,6 L134,64 H66Z" fill="#F59AC3" stroke="#C93475" stroke-width="2.5" stroke-linejoin="round"/><circle cx="100" cy="6" r="6" fill="#FFD23F"/>' + [[92, 40], [108, 30], [100, 52], [84, 58], [118, 54]].map(function(p, i){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="' + (i % 2 ? '#fff' : '#5B8BE0') + '"/>'; }).join('');
  if(ht === 'beanie') s += '<path d="M54,66 Q56,22 100,22 Q144,22 146,66Z" fill="#5B8BE0"/><rect x="50" y="56" width="100" height="14" rx="6" fill="#2F6BD0"/><circle cx="100" cy="18" r="9" fill="#fff"/>' + [70, 84, 98, 112, 126].map(function(x){ return '<path d="M' + x + ',58 V68" stroke="#4A7FE0" stroke-width="2"/>'; }).join('');
  if(ht === 'beret') s += '<ellipse cx="94" cy="42" rx="46" ry="19" transform="rotate(-8 94 42)" fill="#C0392B"/><rect x="92" y="20" width="5" height="9" rx="2" fill="#8E2A20" transform="rotate(-8 94 42)"/>';
  if(ht === 'cowgirl') s += '<path d="M70,60 Q72,24 100,28 Q128,24 130,60Z" fill="#C98A4B"/><ellipse cx="100" cy="60" rx="68" ry="12" fill="#B8793F"/><rect x="70" y="50" width="60" height="7" fill="#7A4A22"/><path d="M96,53 l4,-5 4,5 -4,5Z" fill="#FFD23F"/>';
  if(ht === 'witch') s += '<ellipse cx="100" cy="58" rx="64" ry="11" fill="#3A2A55"/><path d="M72,58 Q92,30 98,2 Q116,22 128,58Z" fill="#4A3470"/><rect x="74" y="48" width="52" height="9" fill="#8E6BD8"/><path d="M100,52 l3,-5 3,5 -3,4Z" fill="#FFD23F"/>';
  if(ht === 'catears') s += '<path d="M60,58 L62,14 L92,40Z M140,58 L138,14 L108,40Z" fill="' + hc + '"/><path d="M66,48 L67,26 L82,40Z M134,48 L133,26 L118,40Z" fill="#F9A8D4"/>';
  if(ht === 'horn') s += '<path d="M90,44 L100,-2 L110,44Z" fill="#FFD23F" stroke="#E8A33D" stroke-width="2.5" stroke-linejoin="round"/><path d="M93,34 L107,30 M95,24 L105,20 M97,14 L103,12" stroke="#E8A33D" stroke-width="2"/>';
  if(ht === 'headphones') s += '<path d="M52,92 Q50,20 100,20 Q150,20 148,92" stroke="#7B4FC4" stroke-width="8" fill="none"/><rect x="42" y="80" width="16" height="34" rx="7" fill="#F55C9A" stroke="#C93475" stroke-width="2"/><rect x="142" y="80" width="16" height="34" rx="7" fill="#F55C9A" stroke="#C93475" stroke-width="2"/>';
  if(ht === 'tiara') s += '<path d="M62,56 L72,34 L88,48 L100,24 L112,48 L128,34 L138,56Z" fill="#EDEBFB" stroke="#B9B4E6" stroke-width="2.5" stroke-linejoin="round"/><circle cx="100" cy="34" r="5" fill="#F55C9A"/><circle cx="76" cy="44" r="3" fill="#5B8BE0"/><circle cx="124" cy="44" r="3" fill="#5B8BE0"/>';
  if(ht === 'goldcrown'){ s += '<path d="M58,60 L58,18 L78,40 L100,6 L122,40 L142,18 L142,60Z" fill="#FFD23F" stroke="#E8A33D" stroke-width="3" stroke-linejoin="round"/><rect x="58" y="52" width="84" height="10" fill="#E8A33D"/>'; [[58, 18, '#E63946'], [100, 6, '#5B8BE0'], [142, 18, '#7FD99A'], [100, 56, '#F55C9A']].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="5.5" fill="' + c[2] + '" stroke="#fff" stroke-width="1.5"/>'; }); }
  const vb = view === 'head' ? '30 8 140 150' : (view === 'body' ? '36 122 128 112' : (view === 'legs' ? '40 196 120 104' : '0 0 200 300'));
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="Avatar" style="width:100%;height:100%;display:block">' + s + '</svg>';
}


/* ---------- pet clothes: SVG drawn over the mascot picture (100 x 100 box). Anchors = where each animal's head is. ---------- */
const PET_ANCH = {   // x = head centre, top = top of head, eye = eye line, chin = where a collar goes, w = head width, ex = half the distance between the eyes
  ginger: { x: 50, top: 10, eye: 31, chin: 47, w: 62, ex: 11 }, bimba: { x: 41, top: 9, eye: 32, chin: 47, w: 50, ex: 11 },
  duck: { x: 52, top: 19, eye: 33, chin: 54, w: 46, ex: 11, noHat: true, noGlasses: true },
  unicorn: { x: 48, top: 14, eye: 43, chin: 63, w: 42, ex: 10 }, dragon: { x: 45, top: 19, eye: 37, chin: 62, w: 56, ex: 17 },
  bunny: { x: 49, top: 30, eye: 52, chin: 66, w: 44, ex: 12 }, panda: { x: 50, top: 7, eye: 36, chin: 56, w: 70, ex: 13 },
  fox: { x: 38, top: 10, eye: 34, chin: 50, w: 58, ex: 11 }, penguin: { x: 50, top: 5, eye: 34, chin: 50, w: 60, ex: 13 }
};
function petCan(id, slot){ const a = PET_ANCH[id]; if(!a) return false; if(slot === 'phat' && a.noHat) return false; if(slot === 'pglasses' && a.noGlasses) return false; return true; }
function petAccSVG(id, w){
  const a = PET_ANCH[id]; if(!a || !w) return '';
  let s = '';
  if(w.pneck && petCan(id, 'pneck')){
    const k = a.w / 60; let g = '';
    if(w.pneck === 'pbowtie') g = '<path d="M0,0 L-12,-7 V7Z M0,0 L12,-7 V7Z" fill="#E63946" stroke="#B82633" stroke-width="1.4" stroke-linejoin="round"/><circle r="3.2" fill="#B82633"/>';
    if(w.pneck === 'pscarf') g = '<rect x="-26" y="-4" width="52" height="9" rx="4.5" fill="#E63946" stroke="#B82633" stroke-width="1.2"/><path d="M8,3 L14,20 L4,18Z" fill="#C92E3B"/>';
    if(w.pneck === 'pbell') g = '<path d="M-22,-3 Q0,9 22,-3" stroke="#E63946" stroke-width="3.6" fill="none"/><circle cx="0" cy="7" r="4.4" fill="#FFD23F" stroke="#E8A33D" stroke-width="1.2"/>';
    if(w.pneck === 'pmedal') g = '<path d="M-6,-6 L0,10 L6,-6" stroke="#5B8BE0" stroke-width="4" fill="none"/><circle cy="13" r="6.4" fill="#FFD23F" stroke="#E8A33D" stroke-width="1.6"/>';
    s += '<g transform="translate(' + a.x + ' ' + a.chin + ') scale(' + k.toFixed(3) + ')">' + g + '</g>';
  }
  if(w.pglasses && petCan(id, 'pglasses')){
    const k = a.ex / 11; let g = '';
    if(w.pglasses === 'psun') g = '<circle cx="-11" r="6.6" fill="#2B2B3A" fill-opacity=".92" stroke="#F5C84C" stroke-width="1.6"/><circle cx="11" r="6.6" fill="#2B2B3A" fill-opacity=".92" stroke="#F5C84C" stroke-width="1.6"/><path d="M-4.4,0 H4.4" stroke="#F5C84C" stroke-width="1.6"/><path d="M-14,-3 l4,-2" stroke="#fff" stroke-width="1.2" opacity=".7"/>';
    if(w.pglasses === 'pheart') g = [-11, 11].map(function(x){ return '<g transform="translate(' + x + ' 0) scale(.66)"><path d="M0,8 C-11,0 -5,-9 0,-3 C5,-9 11,0 0,8Z" fill="#F55C9A" fill-opacity=".92" stroke="#C93475" stroke-width="1.8" stroke-linejoin="round"/></g>'; }).join('');
    if(w.pglasses === 'pstar') g = [-11, 11].map(function(x){ return '<g transform="translate(' + x + ' 0) scale(.62)"><path d="M0,-9 l2.6,5.6 6,.7 -4.5,4 1.3,6 -5.4,-3 -5.4,3 1.3,-6 -4.5,-4 6,-.7Z" fill="#FFD23F" fill-opacity=".95" stroke="#E8A33D" stroke-width="1.8" stroke-linejoin="round"/></g>'; }).join('');
    s += '<g transform="translate(' + a.x + ' ' + a.eye + ') scale(' + k.toFixed(3) + ')">' + g + '</g>';
  }
  if(w.phat && petCan(id, 'phat')){
    const k = a.w / 60; let g = '';
    if(w.phat === 'partyhat') g = '<g transform="rotate(-10)"><path d="M0,-34 L16,2 H-16Z" fill="#F59AC3" stroke="#C93475" stroke-width="1.6" stroke-linejoin="round"/><circle cy="-35" r="3.6" fill="#FFD23F"/><circle cx="-4" cy="-14" r="2" fill="#fff"/><circle cx="5" cy="-6" r="2" fill="#5B8BE0"/><circle cx="-8" cy="-2" r="1.8" fill="#FFD23F"/></g>';
    if(w.phat === 'pbow') g = '<g transform="translate(15 -1) rotate(14)"><path d="M0,0 L16,-10 V10Z M0,0 L-16,-10 V10Z" fill="#F55C9A" stroke="#C93475" stroke-width="1.6" stroke-linejoin="round"/><circle r="4.4" fill="#E0407F" stroke="#C93475" stroke-width="1.4"/></g>';
    if(w.phat === 'pberet') g = '<ellipse cx="-2" cy="-5" rx="23" ry="10" transform="rotate(-8 -2 -5)" fill="#C0392B"/><rect x="-3" y="-16" width="3.4" height="6" rx="1.4" fill="#8E2A20"/>';
    if(w.phat === 'ptop') g = '<ellipse cy="1" rx="22" ry="4.6" fill="#2B2B3A"/><rect x="-14" y="-27" width="28" height="28" rx="2" fill="#2B2B3A"/><rect x="-14" y="-9" width="28" height="6" fill="#E63946"/>';
    if(w.phat === 'pcrown') g = '<path d="M-17,3 L-19,-15 L-9,-7 L0,-20 L9,-7 L19,-15 L17,3Z" fill="#FFD23F" stroke="#E8A33D" stroke-width="1.6" stroke-linejoin="round"/><circle cy="-8" r="2.4" fill="#F55C9A"/><circle cx="-10" cy="-2" r="1.8" fill="#5B8BE0"/><circle cx="10" cy="-2" r="1.8" fill="#7FD99A"/>';
    if(w.phat === 'pflowers') g = [[-22, 2, '#F55C9A'], [-11, -4, '#FFD23F'], [0, -6, '#fff'], [11, -4, '#F55C9A'], [22, 2, '#FFD23F']].map(function(c){ let o = ''; for(let i = 0; i < 5; i++){ const an = i * 1.2566; o += '<circle cx="' + (c[0] + Math.cos(an) * 3.6).toFixed(1) + '" cy="' + (c[1] + Math.sin(an) * 3.6).toFixed(1) + '" r="3.1" fill="' + c[2] + '"/>'; } return o + '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="2.1" fill="#F2A33A"/>'; }).join('');
    s += '<g transform="translate(' + a.x + ' ' + (a.top + 3) + ') scale(' + k.toFixed(3) + ')">' + g + '</g>';
  }
  return s;
}

/* ---------- friends you meet on the way (original characters; art lives in friends-art.js) ---------- */
const FRIENDS = [
  { id: 'hoot', name: 'Professor Hoot', theme: 'The number owl', line: 'Whooo loves maths? You do! Seven is my favourite number.' },
  { id: 'nox', name: 'Nox & Raven', theme: 'Spooky-cute pattern spotters', line: 'Raven can spot a pattern in the dark. 2, 4, 6… what comes next?' },
  { id: 'maren', name: 'Maren the Sailor', theme: 'Ocean explorer', line: 'I measure the sea with my compass. Care to sail through some sums?' },
  { id: 'nevia', name: 'Nevia', theme: 'Snow-crystal friend', line: 'Every snowflake has 6 arms. That is a lovely number to multiply!' },
  { id: 'lumi', name: 'Lumi', theme: 'Sleepy moon fairy', line: 'The moon is out. A little brain boost before bed? ✨' },
  { id: 'blip', name: 'Blip', theme: 'Alien from Planet Zog', line: 'On Planet Zog, 2 + 2 is also 4! Teach me more, please.' },
  { id: 'pups', name: 'The Scout Pups', theme: 'Three adventure pups', line: 'Three pups with three backpacks. How many backpacks? 3 × 1… easy!' },
  { id: 'starbeat', name: 'Star Beat', theme: 'Pop star', line: 'Every song has a beat. Count with me: 1, 2, 3, 4!' },
  { id: 'tilly', name: 'Tilly', theme: 'Bunny with a pocket watch', line: 'Tick-tock! A quarter of an hour is 15 minutes. Can you tell me the time?' },
  { id: 'rocco', name: 'Rocco', theme: 'Friendly number robot', line: 'Beep boop! My buttons count 0 to 9. What number shall we make?' },
  { id: 'dina', name: 'Dina', theme: 'Baby dinosaur explorer', line: 'I measured my footprint with my ruler. How long is yours?' },
  { id: 'coral', name: 'Coral', theme: 'Octopus of the reef', line: 'Eight arms, eight shells! Count in eights with me: 8, 16, 24, 32!' },
  { id: 'abra', name: 'Abra', theme: 'Fox magician', line: 'Pick a number, double it, add ten… ta-da! Maths is full of magic tricks.' },
  { id: 'bea', name: 'Bea', theme: 'Honeycomb bee', line: 'Every cell in my honeycomb has 6 sides. Spot the pattern with me!' },
  { id: 'zara', name: 'Zara', theme: 'Little pizza chef', line: 'I cut my pizza into 8 equal slices. If you eat 2, what fraction is left?' },
  { id: 'dot', name: 'Dot', theme: 'Detective dalmatian', line: 'Every puzzle has a clue. Let us look closely and solve it together!' }
];
function friendById(id){ for(let i = 0; i < FRIENDS.length; i++) if(FRIENDS[i].id === id) return FRIENDS[i]; return null; }
function cleanMet(a){ const out = []; if(!Array.isArray(a)) return out; a.forEach(function(x){ x = String(x); if(friendById(x) && out.indexOf(x) === -1) out.push(x); }); return out; }
/* p = chance of meeting someone new. The very first meeting is guaranteed so she learns the feature exists. Returns the friend or null. */
function meetFriend(state, p){
  const unmet = FRIENDS.filter(function(f){ return state.met.indexOf(f.id) === -1; }); if(!unmet.length) return null;
  if(state.met.length === 0 || chance(p)){ const f = pick(unmet); state.met.push(f.id); return f; }
  return null;
}
if(typeof module !== 'undefined') module.exports = { AV_SLOTS, PET_SLOTS, AV_ITEMS, AV_DEFAULT, MASCOT_IDS, PET_ACC_SLOTS, SHOP_MULTS, SHOP_CATS, slotCat, catMult, cleanShopCat, BOX_COST, PET_ANCH, shopMult, avGold, avLocked, avPrice, avWorn, avCandidates, avBox, boxPrice, avProgress, cleanPetAcc, petWears, petCan, petAccSVG, avItem, avOwns, avEquip, avBuy, avCost, cleanAvatar, cleanOwned, defaultAvatar, avatarSVG, FRIENDS, friendById, cleanMet, meetFriend };
