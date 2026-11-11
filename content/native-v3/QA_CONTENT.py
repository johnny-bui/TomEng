"""Automated structural and scenario-coherence checks for TomEng V3.4.

These checks verify the authored grouping and stable-ID accounting. They do
not claim native-editor approval of every English phrase or translation.
"""
import json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
CONTENT=Path(__file__).resolve().parent
load=lambda name:json.loads((CONTENT/f'{name}.native.v3.json').read_text(encoding='utf-8'))
phrases=load('phrases');lessons=load('lessons');categories=load('categories');patterns=load('patterns')
by_id={phrase['id']:phrase for phrase in phrases}
assert len(phrases)==1200 and len(lessons)>240 and len(categories)==7 and len(patterns)==210
assert len({phrase['id'] for phrase in phrases})==1200
assert all(len(lesson['phraseIds'])==5 and len(set(lesson['phraseIds']))==5 for lesson in lessons)
candidate_ids=[phrase_id for lesson in lessons for phrase_id in lesson['candidatePhraseIds']]
assert len(candidate_ids)==1200 and len(set(candidate_ids))==1200 and set(candidate_ids)==set(by_id), 'Every catalog ID has exactly one new-introduction candidate slot.'
assert all(1<=len(lesson['candidatePhraseIds'])<=5 for lesson in lessons)
assert all('newPhraseIds' not in lesson and 'reinforcementPhraseIds' not in lesson for lesson in lessons), 'V3.4 catalog roles use explicit candidate/reuse fields only'
assert all(set(lesson['phraseIds'])==set(lesson['candidatePhraseIds'])|set(lesson['reusePhraseIds']) for lesson in lessons)
assert all(not set(lesson['candidatePhraseIds'])&set(lesson['reusePhraseIds']) for lesson in lessons)
assert all(len(lesson['steps'])==5 and [step['phraseId'] for step in lesson['steps']]==lesson['phraseIds'] for lesson in lessons)
assert sum(len({by_id[pid]['subCategoryId'] for pid in lesson['phraseIds']})>=2 for lesson in lessons[30:])>=150
assert all(len({by_id[pid]['patternId'] for pid in lesson['phraseIds']})==5 for lesson in lessons[30:])
assert all(len({step['intent'] for step in lesson['steps']})==5 for lesson in lessons[30:])
assert all(all((step['phraseId'] in lesson['candidatePhraseIds'])==(step['kind']=='new') for step in lesson['steps']) for lesson in lessons)
assert all(lesson.get('scenarioTitle') and lesson.get('scenarioGoal') and lesson.get('roleContext') and lesson.get('practicePrompt') for lesson in lessons)
assert all(all(by_id[pid]['categoryId']==lesson['primaryCategoryId'] for pid in lesson['phraseIds']) for lesson in lessons[30:])
assert all(a['primaryCategoryId']!=b['primaryCategoryId'] for a,b in zip(lessons[30:],lessons[31:]))
assert all(len({by_id[pid].get('variant') for pid in lesson['candidatePhraseIds']})==1 for lesson in lessons[30:] if len(lesson['candidatePhraseIds'])>1)
assert all(set(lesson['reusePhraseIds']).issubset(set().union(*(set(prior['candidatePhraseIds']) for prior in lessons[:index]))) for index,lesson in enumerate(lessons[30:],start=30) if lesson['reusePhraseIds'])
routes={
 'everyday':[lesson for lesson in lessons if lesson['primaryCategoryId'] in ('everyday','reflex')],
 'workplace':[lesson for lesson in lessons if lesson['primaryCategoryId'] not in ('everyday','reflex')],
 'mixed':lessons,
}
assert {key:len({pid for lesson in route for pid in lesson['candidatePhraseIds']}) for key,route in routes.items()}=={'everyday':625,'workplace':575,'mixed':1200}
assert all(len({lesson['scenarioId'] for lesson in route[:14]})==14 for route in routes.values())
assert Counter(lesson['newCount'] for lesson in lessons[30:])=={5:175,4:20,3:20,2:15,1:5}
mapping=CONTENT/'SCENARIO_MAPPING_V3_4.csv'
assert mapping.exists() and len(mapping.read_text(encoding='utf-8-sig').splitlines())==len(lessons)+1
legacy_v32=json.loads((ROOT/'legacy-lesson-plan-v3_2.js').read_text(encoding='utf8').split('=',1)[1].rstrip(';\n'))
legacy_v33=json.loads((ROOT/'legacy-lesson-plan-v3_3.js').read_text(encoding='utf8').split('=',1)[1].rstrip(';\n'))
assert len(legacy_v32['lessons'])==240 and len(legacy_v33['lessons'])==240
assert [lesson['phraseIds'] for lesson in lessons[:30]]==[lesson['phraseIds'] for lesson in legacy_v32['lessons'][:30]]
assert [lesson['phraseIds'] for lesson in lessons[:30]]==[lesson['phraseIds'] for lesson in legacy_v33['lessons'][:30]]
browser_phrases=json.loads((ROOT/'data.js').read_text().split('=',1)[1].rstrip(';\n'))
browser_meta=json.loads((ROOT/'meta.js').read_text().split('=',1)[1].rstrip(';\n'))
assert browser_phrases==phrases and browser_meta['lessons']==lessons
print(f'PASS: 1,200 unique candidate-ID slots; {len(lessons)} scenario candidates with exactly five phrases each; explicit new/reuse roles; both tracks cover all 1,200 IDs.')
print('NOTE: structural QA checks authored scenario grouping, not human/native-editor review of every English sentence and translation.')
