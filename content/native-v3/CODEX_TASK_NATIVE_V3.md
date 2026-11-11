# CODEX MASTER TASK — TOMENG NATIVE V3

**Repo:** `johnny-bui/TomEng`  
**Language for reporting:** Vietnamese  
**Status:** Content package ready for staged integration; **do not treat AI draft as independently native-speaker-certified**.  
**Do not push directly to production/main before review.**

## 1. Product goal (non-negotiable)

Turn TomEng into a practical **English Reflex Coach**, not a textbook. Daily study is **5 useful spoken chunks**, always review the preceding day's 5 chunks before unlocking the next 5. Make content primarily useful in real life, travel, everyday errands, and conversations, while keeping essential workplace/UI/UX/BA vocabulary.

**Editorial standard:** Natural spoken U.S. English, easy to remember, short enough to say in conversation, appropriate for the situation, idiomatic (not word-for-word Vietnamese translation), no unnecessary academic grammar. A natural shorter phrase beats a long "correct" but stilted sentence. Avoid mass-producing trivial noun substitutions. Useful real-life variations are intentional; repetitive filler is not.

## 2. Source of truth

Use only data from this attachment for V3:

- `phrases.native.v3.json` — **1,200 canonical records** (150 legacy + 1,050 new or revised)
- `categories.native.v3.json` — seven categories / target counts
- `subcategories.native.v3.json` — 70 subcategories including 30 legacy day groupings
- `patterns.native.v3.json` — 210 pattern families for new content, 5 variants each
- `lessons.native.v3.json` — 240 ordered lessons, five `phraseIds` each and previous-day `reviewPhraseIds`
- `phrases.native.v3.csv` — convenient editorial review in Excel
- `QA_SUMMARY.json` — automatic checks and editorial limitations
- `NATIVE_STYLE_GUIDE.md` — quality rules and concrete corrections
- `REVIEW_NATIVE_V3.html` — offline editorial preview

**Do NOT import the old `TomEng-Content-V2` dataset: V3 replaces its new-content order and categorization.** The first 150 published phrase IDs and their English, Vietnamese, context and follow fields are preserved. From `p151` onwards, the order and meanings differ from previous **unpublished** V2 draft, so never migrate tentative V2 learned IDs by numeric ID if that V2 corpus was already tested outside production. Determine whether those IDs were released and reconcile by English phrase fingerprint if needed.

No remote API needed for core offline learning. `phrases.native.v3.js` uses `window.TOMENG_PHRASES_NATIVE_V3`; map it explicitly or read JSON; don't assume the existing app's `window.SPEAK5_PHRASES` will magically change.

## 3. New taxonomy and scope

| ID | Category | Phrases |
|---|---|---:|
| everyday | Đời sống hằng ngày: dining, coffee, groceries, shopping, payment, directions, taxis, hotel, plans, family, symptoms, tech help, appointment, delivery, urgent assistance | **500** |
| reflex | Listening, clarification, buying time, asking to repeat | **125** |
| meeting | Meeting & team communication | **145** |
| design | UI/UX & product design | **150** |
| business | BA/business rules/workflows | **90** |
| engineering | Developer, QA and release | **125** |
| leadership | Priorities, decisions and leadership | **65** |
| | **TOTAL** | **1,200** |

Display Everyday and Reflex prominently in navigation, not as two minor categories. Show situation labels rather than academic difficulty headings. Provide search by English, Vietnamese, scenario and keyword; category and subcategory filters; saved phrases.

## 4. Essential Daily Engine (P0)

- **Day 1:** learn five phrases, practise recall before completion.
- **Day N (N > 1):** first review exactly five phrases of Day N-1 (must present all five), then unlock today's five phrases. The user cannot bypass yesterday's review by just entering the Library or marking random cards as learned. Let the user use Library freely without changing daily lesson progression.
- Each review card: Vietnamese situation -> learner speaks or types English -> reveal model answer -> choose **Nhớ ngay / Cần gợi ý / Chưa nhớ**. The app should not claim the user "knows" a phrase simply because the reveal button was pressed.
- Store date-scoped completed sessions independently from learned phrase count, so `dayNumber()` no longer depends on `store.learned.length / 5`. Fix Day 30 cap. Support all **240 days** and correctly show completed when finished, with continuing spaced reviews.
- Smart repetition: suggested intervals **1, 3, 7, 14, 30 days**, adjusted to learner rating. Retest missed items the next day, while keeping the required previous-five review distinct. Don't overwhelm with accumulated reviews; cap optional backlog per session and preserve remaining due cards.
- One locale-based calendar day should not create unlimited new lessons. Missed days should not destroy previous progress or deceptively preserve streak; users may make up an unfinished lesson voluntarily, but don't auto-unlock many days.
- Persist progress by **stable phrase ID** with content version metadata. Avoid deleting user's `tomeng_notebook_v2` and `speak5_data_v1` data; create additive migration, test fresh and migrated accounts.
- Correct streak from completed learning dates, not initialized constant 1. Track due, attempted, remembered and usable-in-speaking separately; a page opened is not a mastered phrase.

## 5. Phrase card UX (P0)

A phrase card must show, in this order:

1. **Real-life scenario** in natural Vietnamese.
2. Short **English chunk** (US conversational), with audio play/replay and slow speed toggle.
3. Natural Vietnamese meaning.
4. **Mẹo nhớ:** a one-breath memory cue / phrase pattern. Don't show abstract grammar trees as the main content.
5. 2-3 useful variations (could be pre-authored via the pattern family's 5 variants, but choose meaningful variations instead of blindly listing replacements).
6. **Say this next**: a learner-side follow-up, not a waiter/shop assistant's response. `follow` in the source is a learner-side suggestion; review cases where it doesn't fit.
7. Controls: Saved, Know It, Needs Practice, Play, Next. Avoid too many permanent buttons in a single narrow mobile row.

UI should offer **Rescue Mode** ('Tôi cần nói gì bây giờ?') for: didn't catch what they said, need more time, disagree politely, ordering at a cafe, asking directions, payment issue, appointment and urgent help. Retrieve short phrases by situation with one-tap audio.

## 6. Speaking (P1 — only claim capabilities actually tested)

- `speechSynthesis` (TTS) is available as offline-ish browser speech where supported; voice quality differs by OS/device. Offer en-US voice selection, user-initiated playback, 0.8x and 1.0x controls and an unsupported-device message. **Do not label system TTS as 'native-speaker recording'.**
- Optional Web Speech API speech recognition **only on compatible browsers with clear mic consent**. Keep a fallback self-rating flow; no paid API, no claims of automatic pronunciation scoring unless implemented and measured.
- A speaking challenge should provide a realistic short scenario, capture speech or self-response, then show a concise native-like model reply and supportive alternatives. For speech recognition, separate transcript matching from pronunciation quality.

## 7. Content QA Gate (mandatory before merge)

- All 1,200 records compile with IDs unique, 240 lessons × 5, 7 categories, 70 subcategories, no empty fields and zero exact EN duplicates.
- **Manual semantic review** of every pattern family **and all five variants**: grammar, idiomatic usage, real-life plausibility, en/vi agreement, context and follow-up consistency, register appropriateness. Fix questionable or awkward lines instead of forcing counts. Never silently mark AI copy as native-speaker certified.
- Specifically flag awkward constructions (prior examples): 'I haven\'t had time to think about the weather', 'I\'d like to reduce friction in the main call-to-action', 'Should we postpone the hotfix until the issue is fixed?'. Confirm these do not occur in released content.
- Disallow assistant/merchant/driver reply as learner-side `follow` unless explicitly represented as a two-person dialogue.
- If a phrase or variant is wrong, rewrite English, Vietnamese, memory tip, context and follow **together**, not English alone. Maintain IDs and lesson order once public.
- Put ambiguous flags in `CONTENT_QA_ISSUES.md` with exact ID, reason, proposed wording and disposition; show a count of reviewed/changed/blocked.
- Prefer short **A2-B1** usable phrases. Ensure capitalization, punctuation, pronoun agreement, sentence-level natural Vietnamese. Avoid false claims of correctness. Document whether any external native-speaker review took place.

## 8. Engineering guardrails

- Existing app uses static categories and a 30-day cap. Refactor categories and calendar/lesson logic to data-driven modules, don't hard-code count 1,200/240 in many places.
- Keep PWA working offline, increment service worker cache version and provide controlled cache refresh. Test first load, updated load and offline re-open, especially mobile Safari.
- Backup/export/import user progress with schema version; no backend required. Make imports validation-safe and backward compatible. Keep memoryTip and categorization searchable.
- Accessibility: 44px touch targets; keyboard/focus for modal; no 2nd-level scroll trap; responsive 360px, 768px and 1440px; avoid TTS autoplay.
- Add automated unit checks for data, lesson completeness, review gating, streak and migration. Run build smoke tests and verify all supported browsers; clearly separate tested vs untested.

## 9. Acceptance scenarios

1. Fresh install shows Day 1, learns exactly 5 and cannot advance by clicking five random phrases in Library.
2. Next day, exactly Day 1's five are reviewed **before** Day 2 unlocks. Clicking reveal alone never counts as mastering.
3. Missed phrase rated 'Chưa nhớ' reappears on next appropriate review; previously remembered phrase still appears in scheduled spaced review.
4. Existing localStorage `tomeng_notebook_v2` with 50 learned legacy IDs preserves saved and learned statuses; days and streak not fabricated.
5. Day 30 advances to Day 31; Day 240 completes without error, while Review remains available.
6. Each Everyday category opens the right filters; 'coffee', 'thanh toán', 'airport', 'mua sắm', 'xin nhắc lại' find valid content.
7. Text 'native speaker audio' never appears unless a recorded human native voice asset is actually included.
8. PR checklist shows content audit outcomes, screenshots, responsive tests, migration tests and limitations.

## 10. Delivery

Create a branch `feat/tomeng-native-v3` and a pull request; report in **Vietnamese**:
- Changes in architecture/content and QA counts
- Learning flow screenshots/videos and tested cases
- Exactly what is implemented versus deferred
- Issues requiring human language review
- No merge without confirmation

**Implement the app changes, not only a speculative plan.**
