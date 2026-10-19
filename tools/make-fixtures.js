#!/usr/bin/env node
/* Regenerates tools/fixtures/state-v4-*.json with the REAL engine and a fixed seed (synthetic learners, not real data).
   Replace/add a real export from the iPad as tools/fixtures/state-v4-real-*.json: state-test.js picks up every state-v4-*.json. */
const fs = require('fs'), path = require('path'); const E = require('./lib/load-engine')();
E.setSeed(2026);
const out = path.join(__dirname, 'fixtures');
// fresh: onboarding done, nothing learned
{ const s = E.defaultState(); s.onboardingDone = true; s.theme = 'ocean'; fs.writeFileSync(path.join(out, 'state-v4-fresh.json'), JSON.stringify(s, null, 1)); }
// progress: ~25 skills at mixed medals, errors, history, stickers, badges, custom prize, focus
{
  const s = E.defaultState(); s.onboardingDone = true; s.theme = 'unicorn'; s.name = 'Melissa'; s.friend = 'bimba';
  s.prefs.likes = ['contar', 'formas']; s.prefs.dislikes = ['multiplicar'];
  const ids = E.SKILLS.map(k => k.id); const days = ['2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05', '2026-10-09', '2026-10-12', '2026-10-16'];
  const picked = ids.filter((id, i) => i % 2 === 0 || ['multdiv-3', 'multdiv-4', 'addsub-sub-column'].indexOf(id) > -1);
  picked.forEach((id, i) => {
    const d = days[i % days.length]; const st = E.skillState(s, id); st.lessonDone = true;
    E.applySkillResult(s, id, 'guided', [1, 1, 0.6, 1], d);
    if(i % 3 !== 2) E.applySkillResult(s, id, 'practice', [1, 1, 1, 0.6, 1, 1], d);
    if(i % 3 === 0) E.applySkillResult(s, id, 'challenge', [1, 1, 1, 1, 0.6], d);
    if(i % 7 === 0) E.applySkillResult(s, id, 'review', [0], '2026-10-17');
    s.tricks.push(id);
    s.sessionLog.push({ date: d, kind: 'practice', strand: E.SKILLS.filter(k => k.id === id)[0].strand, skill: id, correct: 5, total: 6, credit: 0.9, mood: ['happy', 'ok', 'hard'][i % 3] });
  });
  E.recordError(s, 'multdiv-3', 'You added instead of multiplying.', '2026-10-05'); E.recordError(s, 'multdiv-3', 'You added instead of multiplying.', '2026-10-09');
  E.recordError(s, 'addsub-sub-column', 'You took the smaller digit from the bigger one.', '2026-10-12');
  s.placement.done = true; s.placement.started = true; ['number-place-value', 'time-quarters', 'frac-read'].forEach(id => E.placementRecord(s, id, 1));
  s.totalStars = 212; s.starBalance = 57; s.xp = 380; s.level = 4; s.packs = 2; s.streak = { count: 5, lastPlayDate: '2026-10-16' };
  s.claims = [{ id: 'snack', title: 'A healthy snack you choose', emoji: '🥨', cost: 30, date: '2026-10-10' }];
  s.rewards.push({ id: 'r1', emoji: '🎠', title: 'Fairground trip', cost: 400 }); s.goalReward = 'icecream'; s.focus = 'multdiv';
  s.timer = { mode: 'limit', minutes: 25, debtSeconds: 0, used: { date: '2026-10-16', sec: 540 } };
  s.hadPerfect = true; s.comeback = true; s.legacy = { migratedFrom: 3, date: '2026-09-27' };
  for(let k = 0; k < 14; k++){ s.packs++; E.openPack(s); }
  E.checkBadges(s);
  fs.writeFileSync(path.join(out, 'state-v4-progress.json'), JSON.stringify(s, null, 1));
}
console.log('fixtures written:', fs.readdirSync(out).join(', '));
