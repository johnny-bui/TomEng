import csv
import json
import re
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'content'/'native-v3'
read=lambda name:json.loads((CONTENT/f'{name}.native.v3.json').read_text(encoding='utf-8'))
phrases,categories,subcategories,lessons,patterns=map(read,('phrases','categories','subcategories','lessons','patterns'))
legacy=json.loads((ROOT/'tests'/'fixtures'/'legacy-v1.json').read_text(encoding='utf-8'))
by_id={phrase['id']:phrase for phrase in phrases}
pattern_by_id={pattern['id']:pattern for pattern in patterns}

assert len(phrases)==1200
assert set(by_id)=={f'p{i:03d}' for i in range(1,1201)}
assert [p['id'] for p in phrases[:150]]==[f'p{i:03d}' for i in range(1,151)]
assert len({re.sub(r'[^a-z0-9 ]','',p['en'].lower()).strip() for p in phrases})==1200
assert len(categories)==7 and len(subcategories)==70 and len(lessons)>240 and len(patterns)==210
assert {c['id']:c['count'] for c in categories}=={'everyday':500,'reflex':125,'meeting':145,'design':150,'business':90,'engineering':125,'leadership':65}
core=('id','day','en','vi','context','follow')
assert all(all(phrases[i][key]==legacy[i][key] for key in core) for i in range(150)), 'the original 150 phrase records remain unchanged'
required=('id','day','en','vi','context','follow','pattern','memoryTip','categoryId','subCategoryId','patternId')
assert all(all(str(p.get(key,'')).strip() for key in required) for p in phrases)
assert all(p['day']==i//5+1 for i,p in enumerate(phrases)), 'legacy physical day metadata is unchanged'

assert [lesson['id'] for lesson in lessons]==[f'day-{i:03d}' for i in range(1,len(lessons)+1)]
assert [lesson['day'] for lesson in lessons]==list(range(1,len(lessons)+1))
candidate_ids=[phrase_id for lesson in lessons for phrase_id in lesson['candidatePhraseIds']]
assert len(candidate_ids)==1200 and len(set(candidate_ids))==1200 and set(candidate_ids)==set(by_id), 'all 1,200 IDs receive exactly one new-introduction slot'
assert all(len(lesson['phraseIds'])==5 and len(set(lesson['phraseIds']))==5 for lesson in lessons), 'every scenario contains five distinct total phrases'
assert all(1<=len(lesson['candidatePhraseIds'])<=5 for lesson in lessons), 'each unfinished-catalog session can introduce one to five new phrases'
assert all('newPhraseIds' not in lesson and 'reinforcementPhraseIds' not in lesson for lesson in lessons), 'V3.4 curriculum uses explicit candidate/reuse roles'
assert all(set(lesson['phraseIds'])==set(lesson['candidatePhraseIds'])|set(lesson['reusePhraseIds']) and not set(lesson['candidatePhraseIds'])&set(lesson['reusePhraseIds']) for lesson in lessons), 'new candidates and reuse IDs remain separate'
assert all(lesson['phraseIds']==[phrase['id'] for phrase in phrases[(lesson['day']-1)*5:lesson['day']*5]] for lesson in lessons[:30]), 'the original 150 phrases retain their lesson grouping'
assert all(lesson['phraseIds']==[phrase_id for phrase_id in lesson['phraseIds']] for lesson in lessons)
assert all(all(phrase_id in by_id for phrase_id in lesson['phraseIds']) for lesson in lessons)
assert all(lesson.get('scenarioId') and lesson.get('scenarioTitle') and lesson.get('scenarioGoal') and lesson.get('roleContext') and lesson.get('difficulty') and lesson.get('scenarioContext') and lesson.get('practicePrompt') and lesson.get('whyThesePhrases') for lesson in lessons), 'all lessons contain an authored application scenario'
assert all(len(lesson.get('steps',[]))==5 and [step.get('phraseId') for step in lesson['steps']]==lesson['phraseIds'] for lesson in lessons), 'each practical task maps five explicit steps to the lesson phrases'
assert all(all(step.get('intent') and step.get('cue') and step.get('turn')==i+1 and step.get('kind') in ('new','reuse') for i,step in enumerate(lesson['steps'])) for lesson in lessons)
assert all(all((step['phraseId'] in lesson['candidatePhraseIds'])==(step['kind']=='new') for step in lesson['steps']) for lesson in lessons)
assert all(all(by_id[phrase_id]['categoryId']==lesson['primaryCategoryId'] for phrase_id in lesson['phraseIds']) for lesson in lessons[30:]), 'a scenario never mixes Everyday and Workplace tracks'
assert all(len({by_id[phrase_id]['patternId'] for phrase_id in lesson['phraseIds']})==5 for lesson in lessons[30:]), 'each scenario uses five distinct phrase patterns'
assert all(len({step['intent'] for step in lesson['steps']})==5 for lesson in lessons[30:]), 'each scenario has five distinct, labeled phrase roles'
assert all(lesson.get('familyId') for lesson in lessons[30:])
assert sum(len({by_id[pid]['subCategoryId'] for pid in lesson['phraseIds']})>=2 for lesson in lessons[30:])>=150, 'scenario sessions interleave communicative subcategories instead of presenting five adjacent paraphrases'
assert all(len({by_id[pid].get('variant') for pid in lesson['candidatePhraseIds']})==1 for lesson in lessons[30:] if len(lesson['candidatePhraseIds'])>1), 'new phrases keep a matching source variant within each scenario'
assert all(set(lesson['reusePhraseIds']).issubset(set().union(*(set(prior['candidatePhraseIds']) for prior in lessons[:index]))) for index,lesson in enumerate(lessons[30:],start=30) if lesson['reusePhraseIds']), 'scenario reuse phrases were introduced in an earlier lesson'
assert all(a['primaryCategoryId']!=b['primaryCategoryId'] for a,b in zip(lessons[30:],lessons[31:])), 'new Mixed lessons rotate primary category day to day'
assert [lesson['reviewPhraseIds'] for lesson in lessons]==[[]]+[lessons[i-1]['phraseIds'] for i in range(1,len(lessons))], 'review snapshots remain present for legacy readers'

routes={
 'everyday':[lesson for lesson in lessons if lesson['primaryCategoryId'] in ('everyday','reflex')],
 'workplace':[lesson for lesson in lessons if lesson['primaryCategoryId'] not in ('everyday','reflex')],
 'mixed':lessons,
}
assert len(routes['everyday'])+len(routes['workplace'])==len(routes['mixed']), 'track filters partition the scenario plan without losing a lesson'
assert {key:len({phrase_id for lesson in value for phrase_id in lesson['candidatePhraseIds']}) for key,value in routes.items()}=={'everyday':625,'workplace':575,'mixed':1200}, 'track candidate slots preserve the full Everyday/Workplace/Mixed phrase coverage'
for track,route in routes.items():
 sample=route[:14]
 assert len(sample)==14 and len({lesson['scenarioId'] for lesson in sample})==14, f'{track} has a varied 14-session sample'
assert len({lesson['primaryCategoryId'] for lesson in routes['mixed'][30:44]})>=5
assert all(len(pattern['phraseIds'])==5 and all(phrase_id in by_id and by_id[phrase_id]['patternId']==pattern['id'] for phrase_id in pattern['phraseIds']) for pattern in patterns)
assert all(len({by_id[phrase_id]['follow'] for phrase_id in pattern['phraseIds']})==5 for pattern in patterns), 'pattern examples retain five different follow-up examples'
assert all(sum(p['categoryId']==c['id'] for p in phrases)==c['count'] for c in categories)
assert all(p['subCategoryId'] in {sub['id'] for sub in subcategories} for p in phrases)
assert not any(bad in p['en'] for p in phrases for bad in ("I haven't had time to think about the weather","I'd like to reduce friction in the main call-to-action","Should we postpone the hotfix until the issue is fixed?"))

# Existing audited content examples remain fixed while scenario membership changes.
assert by_id['p737']['follow']=='Could you text me when it arrives?'
assert by_id['p447']['en']=="Glad your morning's off to a good start."
assert by_id['p280']['en']=='I had a pretty quiet weekend. How about you?'
assert by_id['p781']['en']=="How's your new project going?"
assert by_id['p357']['follow']=="I'll check now and let you know."
assert by_id['p405']['en']=="What's been the best part of your morning so far?"
assert by_id['p960']['follow']=='Could I get it with less sugar?'
with (CONTENT/'FINAL_CONTENT_QA_V3_2.csv').open(encoding='utf-8',newline='') as stream:
 audit=list(csv.DictReader(stream))
assert len(audit)==1200 and len({row['id'] for row in audit})==1200
assert sum(row['decision']=='FIXED' for row in audit)==165
assert all(row['decision']=='EDITORIAL REVIEW PENDING' for row in audit if not row['suggested_revision'])

with (CONTENT/'phrases.native.v3.csv').open(encoding='utf-8',newline='') as stream:
 rows=list(csv.DictReader(stream))
assert len(rows)==len(phrases)
for phrase,row in zip(phrases,rows):
 for key,value in phrase.items():
  expected=json.loads(row[key]) if isinstance(value,list) else int(row[key]) if isinstance(value,int) else row[key]
  assert expected==value,(phrase['id'],key)
browser_phrases=json.loads((ROOT/'data.js').read_text().split('=',1)[1].rstrip(';\n'))
browser_meta=json.loads((ROOT/'meta.js').read_text().split('=',1)[1].rstrip(';\n'))
assert browser_phrases==phrases
assert browser_meta=={'categories':categories,'subcategories':subcategories,'patterns':patterns,'lessons':lessons}
fingerprints=json.loads((ROOT/'legacy-v2-fingerprints.js').read_text().split('=',1)[1].rstrip(';\n'))
old=json.loads((ROOT/'content'/'phrases.v2.json').read_text())
assert fingerprints=={p['id']:p['en'] for p in old[150:]}

with (CONTENT/'SCENARIO_MAPPING_V3_4.csv').open(encoding='utf-8-sig',newline='') as stream:
 mapping=list(csv.DictReader(stream))
assert len(mapping)==len(lessons) and [row['lessonId'] for row in mapping]==[lesson['id'] for lesson in lessons]
assert all(row['phraseIds'].split(' | ')==lessons[i]['phraseIds'] and row['candidatePhraseIds'].split(' | ')==lessons[i]['candidatePhraseIds'] and (row['reusePhraseIds'].split(' | ') if row['reusePhraseIds'] else [])==lessons[i]['reusePhraseIds'] for i,row in enumerate(mapping))
assert all(row['scenarioTitle'] and row['scenarioGoal'] and row['intents'] and row['whyThesePhrases'] for row in mapping)

snapshot=(ROOT/'legacy-lesson-plan-v3_2.js').read_text(encoding='utf-8')
legacy_v32=json.loads(snapshot.split('=',1)[1].rstrip(';\n'))
assert legacy_v32['version']=='native-v3.2' and len(legacy_v32['lessons'])==240
assert [lesson['phraseIds'] for lesson in lessons[:30]]==[lesson['phraseIds'] for lesson in legacy_v32['lessons'][:30]]
legacy_v33=json.loads((ROOT/'legacy-lesson-plan-v3_3.js').read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n'))
assert legacy_v33['version']=='native-v3.3' and len(legacy_v33['lessons'])==240
assert [lesson['phraseIds'] for lesson in lessons[:30]]==[lesson['phraseIds'] for lesson in legacy_v33['lessons'][:30]]
print(f'PASS: 1,200 stable IDs / {len(lessons)} five-phrase scenario candidates / variable new-to-old ratios / track coverage / V3.2-V3.3 snapshots / mapping / synced browser data')
