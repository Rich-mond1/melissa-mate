/* Avatar + wardrobe + friends you meet on the way. Pure logic and procedural SVG (no images needed for the avatar).
   State: S.avatar (what she wears), S.owned (bought item ids "slot:id"), S.met (friend ids). Items are bought with starBalance only. */

/* ---------- catalogue ---------- */
const AV_SLOTS = [
  { k: 'hairStyle', label: 'Hair', emoji: '💇‍♀️', view: 'head' },
  { k: 'hairColor', label: 'Colour', emoji: '🎨', view: 'head' },
  { k: 'top', label: 'Tops', emoji: '👚', view: 'body' },
  { k: 'bottom', label: 'Bottoms', emoji: '👖', view: 'legs' },
  { k: 'hat', label: 'Hats', emoji: '👑', view: 'head' },
  { k: 'glasses', label: 'Glasses', emoji: '🕶️', view: 'head' },
  { k: 'neck', label: 'Jewels', emoji: '📿', view: 'head' },
  { k: 'face', label: 'Sparkle', emoji: '✨', view: 'head' },
  { k: 'bg', label: 'Scenes', emoji: '🌈', view: 'full' },
  { k: 'skin', label: 'Skin', emoji: '🧑🏽', view: 'head' }
];
const AV_ITEMS = {
  skin: [['sk1', 'Peach', 0, '#FBD9C3'], ['sk2', 'Sand', 0, '#F2C09A'], ['sk3', 'Caramel', 0, '#D9A27A'], ['sk4', 'Cocoa', 0, '#C68B62'], ['sk5', 'Chestnut', 0, '#A9693F'], ['sk6', 'Espresso', 0, '#7B4A2B']],
  hairStyle: [['curly', 'Curly', 0], ['buns', 'Space buns', 0], ['long', 'Long', 0], ['short', 'Bob', 5], ['ponytail', 'Ponytail', 5], ['braids', 'Braids', 8]],
  hairColor: [['dkbrown', 'Dark brown', 0, '#3B2417'], ['black', 'Black', 0, '#1C1517'], ['brown', 'Brown', 0, '#6B4226'], ['auburn', 'Auburn', 0, '#9A4A27'], ['blonde', 'Blonde', 5, '#E6C170'], ['pink', 'Pink', 10, '#F59AC3'], ['teal', 'Teal', 10, '#4CC9B8'], ['purple', 'Purple', 10, '#A77BE0']],
  top: [['tee', 'Grey tee', 0], ['navy', 'Navy jumper', 0], ['robe', 'Fluffy robe', 10], ['hoodie', 'Pink hoodie', 12], ['sailor', 'Sailor top', 15], ['dress', 'Star dress', 18], ['parka', 'Snow parka', 20], ['jacket', 'Sparkle jacket', 25]],
  bottom: [['joggers', 'Joggers', 0], ['shorts', 'Shorts', 8], ['jeans', 'Jeans', 8], ['skirt', 'Teal skirt', 10], ['leggings', 'Striped tights', 12]],
  hat: [['', 'No hat', 0], ['bow', 'Big bow', 6], ['cap', 'Red cap', 8], ['sailorcap', 'Sailor cap', 8], ['crown', 'Party crown', 10], ['flowers', 'Flower crown', 12], ['moon', 'Moon hat', 15]],
  glasses: [['', 'No glasses', 0], ['round', 'Round', 8], ['aviator', 'Aviators', 12], ['star', 'Star shades', 14], ['heart', 'Heart shades', 14]],
  neck: [['', 'Nothing', 0], ['choker', 'Tattoo choker', 8], ['necklace', 'Gold charm', 10], ['scarf', 'Red scarf', 12]],
  face: [['', 'Nothing', 0], ['freckles', 'Freckles', 4], ['gems', 'Cheek gems', 6], ['stars', 'Star stickers', 6]],
  bg: [['pink', 'Unicorn pink', 0, ['#FFD1E8', '#F8A5D2']], ['sky', 'Sky', 0, ['#C9EBFF', '#8CCBFF']], ['mint', 'Mint', 0, ['#D2F7E3', '#8FE0B9']], ['sunset', 'Sunset', 10, ['#FFD9A8', '#FF9AA8']], ['night', 'Starry night', 15, ['#2B2A5E', '#6A55B5']], ['rainbow', 'Rainbow', 20, ['#FFB3C7', '#9AD0FF']]]
};
const AV_DEFAULT = { skin: 'sk4', hairStyle: 'curly', hairColor: 'dkbrown', top: 'tee', bottom: 'joggers', hat: '', glasses: '', neck: '', face: '', bg: 'pink' };
function avItem(slot, id){ const l = AV_ITEMS[slot] || []; for(let i = 0; i < l.length; i++) if(l[i][0] === id) return { id: l[i][0], name: l[i][1], cost: l[i][2], c: l[i][3] }; return null; }
function avOwns(state, slot, id){ const it = avItem(slot, id); if(!it) return false; return it.cost === 0 || (state.owned || []).indexOf(slot + ':' + id) > -1; }
function defaultAvatar(){ return Object.assign({}, AV_DEFAULT); }
function cleanOwned(a){
  const out = []; if(!Array.isArray(a)) return out;
  a.forEach(function(x){ x = String(x); const i = x.indexOf(':'); if(i < 1) return; const it = avItem(x.slice(0, i), x.slice(i + 1)); if(it && it.cost > 0 && out.indexOf(x) === -1) out.push(x); });
  return out;
}
function cleanAvatar(a, owned){
  const out = defaultAvatar(); if(!a || typeof a !== 'object') return out;
  Object.keys(AV_ITEMS).forEach(function(slot){
    const id = typeof a[slot] === 'string' ? a[slot] : null; const it = id === null ? null : avItem(slot, id);
    if(it && (it.cost === 0 || owned.indexOf(slot + ':' + id) > -1)) out[slot] = id;
  });
  return out;
}
/* equip something she owns. Returns true on success. */
function avEquip(state, slot, id){ if(!avOwns(state, slot, id)) return false; state.avatar[slot] = id; return true; }
/* buy with stars (never touches totalStars: lifetime stars stay a record of effort). Returns 'ok' | 'owned' | 'poor' | 'bad'. */
function avBuy(state, slot, id){
  const it = avItem(slot, id); if(!it) return 'bad';
  if(avOwns(state, slot, id)) return 'owned';
  if(state.starBalance < it.cost) return 'poor';
  state.starBalance -= it.cost; state.owned.push(slot + ':' + id); state.avatar[slot] = id; return 'ok';
}
function avCost(slot, id){ const it = avItem(slot, id); return it ? it.cost : 0; }

/* ---------- procedural SVG (200 x 300 canvas) ---------- */
let _avN = 0;
function avatarSVG(av, o){
  o = o || {}; av = av || AV_DEFAULT; const view = o.view || 'full', n = 'av' + (++_avN);
  const skin = (avItem('skin', av.skin) || avItem('skin', 'sk4')).c, hc = (avItem('hairColor', av.hairColor) || avItem('hairColor', 'dkbrown')).c;
  const hairDark = '#00000022';
  const bgI = avItem('bg', av.bg) || avItem('bg', 'pink'), bg = bgI.c;
  let s = '';
  /* background */
  s += '<defs><linearGradient id="' + n + 'g" x1="0" y1="0" x2="0" y2="1">' + (av.bg === 'rainbow' ? '<stop offset="0" stop-color="#FFB3C7"/><stop offset=".33" stop-color="#FFE27A"/><stop offset=".66" stop-color="#A8E6A3"/><stop offset="1" stop-color="#9AD0FF"/>' : '<stop offset="0" stop-color="' + bg[0] + '"/><stop offset="1" stop-color="' + bg[1] + '"/>') + '</linearGradient></defs>';
  s += '<rect x="0" y="0" width="200" height="300" rx="22" fill="url(#' + n + 'g)"/>';
  if(av.bg === 'night') [[30, 30], [160, 24], [175, 90], [20, 120], [150, 160], [40, 200], [170, 230], [25, 260]].forEach(function(p, i){ s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 2 ? 2 : 3) + '" fill="#fff" opacity=".9"/>'; });
  s += '<ellipse cx="100" cy="294" rx="52" ry="6" fill="#00000022"/>';
  /* hair behind the body */
  const hs = av.hairStyle;
  if(hs === 'curly') [[52, 70, 17], [44, 94, 17], [48, 118, 16], [58, 136, 14], [148, 70, 17], [156, 94, 17], [152, 118, 16], [142, 136, 14], [64, 48, 17], [82, 38, 17], [100, 34, 17], [118, 38, 17], [136, 48, 17]].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + hc + '"/>'; });
  if(hs === 'buns'){ s += '<circle cx="60" cy="38" r="21" fill="' + hc + '"/><circle cx="140" cy="38" r="21" fill="' + hc + '"/>'; }
  if(hs === 'long') s += '<path d="M50,80 Q44,140 52,196 L148,196 Q156,140 150,80Z" fill="' + hc + '"/>';
  if(hs === 'short') s += '<path d="M50,84 Q46,126 60,136 L140,136 Q154,126 150,84Z" fill="' + hc + '"/>';
  if(hs === 'ponytail') s += '<path d="M138,52 Q186,60 178,120 Q174,160 160,170 Q170,120 150,84Z" fill="' + hc + '"/>';
  if(hs === 'braids'){ [60, 140].forEach(function(x){ for(let i = 0; i < 6; i++) s += '<ellipse cx="' + x + '" cy="' + (122 + i * 16) + '" rx="9" ry="9" fill="' + hc + '" stroke="' + hairDark + '" stroke-width="1.5"/>'; s += '<circle cx="' + x + '" cy="214" r="5" fill="#F27BA8"/>'; }); }
  /* legs + shoes */
  const bottom = av.bottom, top = av.top, dress = top === 'dress';
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
  /* neck accessory */
  const nk = av.neck;
  if(nk === 'choker') s += '<path d="M88,142 Q100,150 112,142" stroke="#E552A8" stroke-width="5" fill="none"/><path d="M88,146 Q100,154 112,146" stroke="#9AA3B5" stroke-width="3" fill="none"/>';
  if(nk === 'necklace') s += '<path d="M84,142 Q100,184 116,142" stroke="#E8B63A" stroke-width="2.5" fill="none"/><circle cx="100" cy="174" r="5" fill="#FFD866" stroke="#E8B63A" stroke-width="1.5"/>';
  if(nk === 'scarf') s += '<rect x="80" y="140" width="40" height="14" rx="7" fill="#E63946"/><path d="M108,150 L116,184 L102,180Z" fill="#C92E3B"/>';
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
  /* hair in front of the head */
  const cap = function(col){ return '<path d="M52,92 Q46,36 100,34 Q154,36 148,92 Q138,62 100,62 Q62,62 52,92Z" fill="' + col + '"/>'; };
  if(hs === 'curly'){ s += cap(hc); [[68, 62], [80, 58], [92, 62], [108, 62], [120, 58], [132, 62]].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="11" fill="' + hc + '"/>'; }); }
  if(hs === 'buns') s += cap(hc) + '<path d="M100,34 V60" stroke="' + hairDark + '" stroke-width="3"/><circle cx="60" cy="52" r="4" fill="#F27BA8"/><circle cx="140" cy="52" r="4" fill="#F27BA8"/>';
  if(hs === 'long') s += cap(hc) + '<path d="M100,34 Q76,56 56,90 L52,92 Q46,36 100,34Z" fill="' + hairDark + '"/>';
  if(hs === 'short') s += cap(hc) + '<path d="M48,96 Q44,76 52,70 L56,110Z M152,96 Q156,76 148,70 L144,110Z" fill="' + hc + '"/>';
  if(hs === 'ponytail') s += cap(hc) + '<circle cx="146" cy="62" r="5" fill="#F27BA8"/>';
  if(hs === 'braids') s += cap(hc) + '<path d="M100,34 V60" stroke="' + hairDark + '" stroke-width="3"/>';
  /* glasses */
  const gl = av.glasses;
  if(gl === 'round') s += '<circle cx="82" cy="92" r="15" fill="#ffffff22" stroke="#F27BA8" stroke-width="3"/><circle cx="118" cy="92" r="15" fill="#ffffff22" stroke="#F27BA8" stroke-width="3"/><path d="M97,92 H103 M67,90 L54,88 M133,90 L146,88" stroke="#F27BA8" stroke-width="3"/>';
  if(gl === 'aviator') s += '<path d="M64,84 Q64,110 82,110 Q98,110 98,86 Q98,80 90,80 H70 Q64,80 64,84Z M102,86 Q102,110 118,110 Q136,110 136,84 Q136,80 130,80 H110 Q102,80 102,86Z" fill="#8F99AE" fill-opacity=".85" stroke="#D8DCE8" stroke-width="3"/><path d="M98,84 H102 M64,84 L54,82 M136,84 L146,82" stroke="#D8DCE8" stroke-width="3"/><path d="M70,88 L78,84 M108,88 L116,84" stroke="#fff" stroke-width="2" opacity=".7"/>';
  if(gl === 'star') [82, 118].forEach(function(x){ s += '<path d="M' + x + ',74 l5,11 12,1 -9,8 3,12 -11,-6 -11,6 3,-12 -9,-8 12,-1Z" fill="#FFD23F" fill-opacity=".85" stroke="#E8A33D" stroke-width="2.5" stroke-linejoin="round"/>'; }); if(gl === 'star') s += '<path d="M98,92 H102" stroke="#E8A33D" stroke-width="3"/>';
  if(gl === 'heart') [82, 118].forEach(function(x){ s += '<path d="M' + x + ',108 C' + (x - 22) + ',92 ' + (x - 10) + ',74 ' + x + ',86 C' + (x + 10) + ',74 ' + (x + 22) + ',92 ' + x + ',108Z" fill="#F55C9A" fill-opacity=".85" stroke="#C93475" stroke-width="2.5" stroke-linejoin="round"/>'; }); if(gl === 'heart') s += '<path d="M98,88 H102" stroke="#C93475" stroke-width="3"/>';
  /* hats */
  const ht = av.hat;
  if(ht === 'bow') s += '<path d="M138,48 L162,34 L162,64Z M138,48 L114,34 L114,64Z" fill="#F55C9A" stroke="#C93475" stroke-width="2" stroke-linejoin="round"/><circle cx="138" cy="48" r="8" fill="#E0407F" stroke="#C93475" stroke-width="2"/>';
  if(ht === 'cap') s += '<path d="M54,64 Q58,22 100,22 Q142,22 146,64Z" fill="#E63946"/><path d="M50,64 H150 Q152,74 100,74 Q48,74 50,64Z" fill="#B82633"/><circle cx="100" cy="22" r="5" fill="#B82633"/>';
  if(ht === 'sailorcap') s += '<path d="M56,62 Q60,26 100,26 Q140,26 144,62Z" fill="#fff" stroke="#D6D9E6" stroke-width="2"/><rect x="54" y="56" width="92" height="12" rx="4" fill="#2B3A67"/><path d="M96,62 l4,-5 4,5 -4,5Z" fill="#fff"/>';
  if(ht === 'crown'){ s += '<path d="M60,58 L66,22 L84,44 L100,14 L116,44 L134,22 L140,58Z" fill="#8FE3C7" stroke="#4CB89A" stroke-width="2.5" stroke-linejoin="round"/>'; [[66, 22, '#FFD23F'], [100, 14, '#F55C9A'], [134, 22, '#5B8BE0']].forEach(function(c){ s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="6" fill="' + c[2] + '"/>'; }); [[78, 50, '#F55C9A'], [100, 52, '#FFD23F'], [122, 50, '#fff']].forEach(function(c){ s += '<rect x="' + (c[0] - 4) + '" y="' + (c[1] - 3) + '" width="8" height="6" rx="1.5" fill="' + c[2] + '"/>'; }); }
  if(ht === 'flowers') [[62, 56, '#F55C9A'], [76, 44, '#FFD23F'], [92, 38, '#fff'], [108, 38, '#F55C9A'], [124, 44, '#fff'], [138, 56, '#FFD23F']].forEach(function(c){ for(let k = 0; k < 5; k++){ const a = k * 1.2566; s += '<circle cx="' + (c[0] + Math.cos(a) * 6).toFixed(1) + '" cy="' + (c[1] + Math.sin(a) * 6).toFixed(1) + '" r="4.5" fill="' + c[2] + '" stroke="#00000018" stroke-width=".8"/>'; } s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3.4" fill="#E8A33D"/>'; });
  if(ht === 'moon') s += '<path d="M58,62 Q100,38 142,62 Q130,40 114,12 Q108,2 98,10 Q76,38 58,62Z" fill="#F4E3B0" stroke="#D8C07A" stroke-width="2" stroke-linejoin="round"/><path d="M96,40 a9,9 0 1 0 8,12 a7,7 0 1 1 -8,-12Z" fill="#8E6BD8"/><circle cx="112" cy="12" r="5" fill="#FFD23F"/>';
  const vb = view === 'head' ? '30 8 140 150' : (view === 'body' ? '36 122 128 112' : (view === 'legs' ? '40 196 120 104' : '0 0 200 300'));
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="Avatar" style="width:100%;height:100%;display:block">' + s + '</svg>';
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
  { id: 'starbeat', name: 'Star Beat', theme: 'Pop star', line: 'Every song has a beat. Count with me: 1, 2, 3, 4!' }
];
function friendById(id){ for(let i = 0; i < FRIENDS.length; i++) if(FRIENDS[i].id === id) return FRIENDS[i]; return null; }
function cleanMet(a){ const out = []; if(!Array.isArray(a)) return out; a.forEach(function(x){ x = String(x); if(friendById(x) && out.indexOf(x) === -1) out.push(x); }); return out; }
/* p = chance of meeting someone new. The very first meeting is guaranteed so she learns the feature exists. Returns the friend or null. */
function meetFriend(state, p){
  const unmet = FRIENDS.filter(function(f){ return state.met.indexOf(f.id) === -1; }); if(!unmet.length) return null;
  if(state.met.length === 0 || chance(p)){ const f = pick(unmet); state.met.push(f.id); return f; }
  return null;
}
if(typeof module !== 'undefined') module.exports = { AV_SLOTS, AV_ITEMS, AV_DEFAULT, avItem, avOwns, avEquip, avBuy, avCost, cleanAvatar, cleanOwned, defaultAvatar, avatarSVG, FRIENDS, friendById, cleanMet, meetFriend };
