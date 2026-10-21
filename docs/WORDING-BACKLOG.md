# Wording backlog (found in the October 2026 full text review, NOT yet fixed)

Four independent readers proofread all ~10 500 distinct child-visible texts (explanations, option feedback). Items marked FIXED were corrected in the same session. Everything below is still open: none of it is a wrong answer, but it is clumsy, ambiguous or pedagogically weak for an 8-year-old. To re-find the exact line, run `node tools/text-dump.js /tmp/txt` and grep the quoted snippet, then locate the generator in `src/skills/`.

## Still open (suggested order of value)
1. **Worked answers that keep a "?"**: e.g. "250 + 300 = ? … The jug has 550 ml." (measure-capacity, measure-length, measure-mass, measure-perimeter, measure-units, data-pictograms, data-tally-tables). Show the result: "250 + 300 = 550".
2. **Steps after the ✅**: some explanations continue after the ✅ marker (number-10-100, number-decimals, number-place-value, number-round, time-duration, measure-area). The ✅ should end the text. Opposite: some lines miss the final ✅ (time-five-minutes "Reading…", number-place-value "value of the N").
3. **Unstated direction in ordering answers**: "In order: 8, 0, −6, −7" (number-negative, number-decimals, number-roman-100, measure-units). Say "from greatest to smallest".
4. **Number words that need a singular guard**: "1 jumps", "1 times", "each of the 1 toppings", "1 groups of 4" in multdiv-tables-*, logic-strategies. Use `plural()`/`nnoun()`.
5. **Unexplained digit rules**: "Digit check: 3 + 3 = 6, in the 3 times table ✓" (multdiv-3, 6-9, bridge-tables). Add one sentence of why, or drop.
6. **Roman clock (time-roman)**: "The short hand is on or near II" for 2:40+ (it is nearer III); "points to XII (12 × 5 = 60)" vs XII = 0 minutes.
7. **Clock "0"**: "long hand points to the 0" (time-minutes, time-quarters). Say 12.
8. **logic-sorting**: double negatives "Is 25 not a multiple of 5? No ❌"; "The rectangle has sides of different lengths ❌" (true statement marked ❌); "pointy triangle"/"lopsided triangle" names; 3s/4s tables listed only to 36/48.
9. **logic-strategies**: "Strategy: trial and improvement with a list" label mismatch; handshake rule hides the number of friends.
10. **multdiv-2-5-10 / measure-units**: "put a 0 on the end" / "the number adds two zeros" contradicts the place-value method taught in multdiv-10-100. Prefer "digits move left".
11. **Geometry**: isosceles/scalene described as "no right angles" in some distractors (an isosceles triangle can have a right angle); cube vs cuboid "the others have different numbers" when both are options; kite/trapezium claims only hold for the drawn shape.
12. **measure-length**: "much more than a metre rule" for a door (about 2 m); "how big a walk to school is" should be "how far".
13. **time-duration**: February always "28 days" even though leap years exist elsewhere; "On at 4:30 it is not…" wording.
14. **Column working**: after an exchange the reduced digit appears without explanation ("Tens: 4 − 3 = 1") in addsub-sub-column; add-column "write 11" in the hundreds column (correct but may confuse).
15. **Teacher aside**: "Year 4 bridge" wording was removed from angle titles; check other titles for adult-only jargon ("unit fraction", "boundary", "inverse").

## FIXED in this review (for the record)
Empty lists ("Change all to ml: .", "30 = 30 + 0 → XXX and ."), "1 tenths", "1 little marks", "carried 1 tens", "1 extra shapes", "22th", "there are 1", "A octagon", "boxe", "left over do not", "They weigh…/The pencil is longer" stray capitals, "lunchs", "the A multiple of 5 box", leaked variable text "The fact t × n = p…", false statements (12:40 "is NOON", "30 is half of 60, and only half a day", the 200 ÷ 50 check, "Half of 8" for 9), "Centi means a hundred", clock lesson "short hand just past the 9 at 9:45", "17 + -7", "Take away 5 to 54", "a m number", "X is the hours in a day", geo-lines subject–verb and "Neither lines are not parallel", geo-turns muddled wrong-way text, Roman "BEFORE a bigger one" shown for numerals without subtraction, "Sum: 92 − 13" for subtractions, machine-readable lints added to the suite.
