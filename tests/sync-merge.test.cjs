const assert = require('node:assert/strict');
const { canonical, mergeStores } = require('../sync-merge.js');

const local = {
  schemaVersion: 7,
  cloudUpdatedAt: '2026-11-14T10:00:00.000Z',
  saved: ['p2'],
  learned: ['p3'],
  introducedPhraseIds: ['p3'],
  activityDates: ['2026-11-14'],
  syncMeta: { saved: { p1: { value: false, at: '2026-11-14T10:00:00.000Z' } } },
  completions: {
    lesson_1: {
      lessonId: 'lesson_1',
      completedAt: '2026-11-14T10:00:00.000Z',
      catalogCandidatePhraseIds: ['p1', 'p2'],
      practicedPhraseIds: ['p2'],
      newPhraseIds: ['p2'],
    },
  },
  reviews: { p3: { lastRating: 'good', syncModifiedAt: '2026-11-14T10:00:00.000Z' } },
  sessions: [{ date: '2026-11-14', lessonId: 'lesson_1', sessionSequence: 1, phraseIds: ['p2'], newPhraseIds: ['p2'] }],
  activeSession: { lessonId: 'lesson_2', learnIndex: 2 },
  migration: { unresolvedIds: ['old-1'] },
};

const remote = {
  schemaVersion: 7,
  cloudUpdatedAt: '2026-11-13T10:00:00.000Z',
  saved: ['p1', 'p4'],
  learned: ['p4'],
  introducedPhraseIds: ['p4'],
  activityDates: ['2026-11-13'],
  syncMeta: { saved: { p1: { value: true, at: '2026-11-13T10:00:00.000Z' }, p4: { value: true, at: '2026-11-13T10:00:00.000Z' } } },
  completions: {
    lesson_1: {
      lessonId: 'lesson_1',
      completedAt: '2026-11-13T10:00:00.000Z',
      catalogCandidatePhraseIds: ['p1', 'p2', 'p3'],
      practicedPhraseIds: ['p1'],
      newPhraseIds: ['p1', 'p2', 'p3'],
    },
  },
  reviews: { p3: { lastRating: 'again', syncModifiedAt: '2026-11-13T10:00:00.000Z' } },
  sessions: [
    { date: '2026-11-14', lessonId: 'lesson_1', sessionSequence: 1, phraseIds: ['p1'], newPhraseIds: ['p1'] },
    { date: '2026-11-13', lessonId: 'lesson_0', sessionSequence: 1, phraseIds: ['p4'], newPhraseIds: ['p4'] },
  ],
  activeSession: { lessonId: 'lesson_2', learnIndex: 1 },
  migration: { unresolvedIds: ['old-2'] },
};

const merged = mergeStores(local, remote);
assert.deepEqual(new Set(merged.saved), new Set(['p2', 'p4']), 'newer bookmark deletion wins while remote bookmarks are retained');
assert.deepEqual(new Set(merged.learned), new Set(['p3', 'p4']), 'learned phrase IDs merge across devices');
assert.deepEqual(new Set(merged.introducedPhraseIds), new Set(['p3', 'p4']), 'introduced phrase IDs are never dropped');
assert.deepEqual(new Set(merged.activityDates), new Set(['2026-11-13', '2026-11-14']), 'activity dates merge across devices');
assert.deepEqual(new Set(merged.completions.lesson_1.practicedPhraseIds), new Set(['p1', 'p2']), 'concurrent lesson completions preserve both practiced phrase sets');
assert.deepEqual(new Set(merged.completions.lesson_1.newPhraseIds), new Set(['p1', 'p2', 'p3']), 'completion candidate IDs are unioned without losing newly introduced phrases');
assert.equal(merged.reviews.p3.lastRating, 'good', 'the later spaced-repetition result wins');
assert.equal(merged.activeSession.learnIndex, 2, 'the latest active session is preserved');
assert.equal(merged.sessions.length, 3, 'same-day sessions with different phrase snapshots do not collide');
assert.deepEqual(new Set(merged.migration.unresolvedIds), new Set(['old-1', 'old-2']), 'migration recovery metadata merges');
assert.equal(canonical({ z: 1, a: { y: 2, x: 3 } }), canonical({ a: { x: 3, y: 2 }, z: 1 }), 'canonical comparison ignores object key order');

console.log('TomEng sync merge regression tests passed.');
