import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content' / 'native-v3'
read = lambda name: json.loads((CONTENT / f'{name}.native.v3.json').read_text(encoding='utf-8'))
phrases, categories, subcategories, lessons, patterns = map(read, ('phrases', 'categories', 'subcategories', 'lessons', 'patterns'))
legacy = json.loads((ROOT / 'tests' / 'fixtures' / 'legacy-v1.json').read_text(encoding='utf-8'))

assert len(phrases) == 1200
assert set(p['id'] for p in phrases) == {f'p{i:03d}' for i in range(1, 1201)}
assert [p['id'] for p in phrases[:150]] == [f'p{i:03d}' for i in range(1, 151)]
assert len({re.sub(r'[^a-z0-9 ]', '', p['en'].lower()).strip() for p in phrases}) == 1200
assert len(categories) == 7 and len(subcategories) == 70 and len(lessons) == 240 and len(patterns) == 210
assert {c['id']: c['count'] for c in categories} == {'everyday':500,'reflex':125,'meeting':145,'design':150,'business':90,'engineering':125,'leadership':65}
core = ('id', 'day', 'en', 'vi', 'context', 'follow')
assert all(all(phrases[i][key] == legacy[i][key] for key in core) for i in range(150))
required = ('id','day','en','vi','context','follow','pattern','memoryTip','categoryId','subCategoryId','patternId')
assert all(all(str(p.get(key, '')).strip() for key in required) for p in phrases)
assert all(p['day'] == i // 5 + 1 for i,p in enumerate(phrases))
assert all(l['phraseIds'] == [p['id'] for p in phrases[(l['day']-1)*5:l['day']*5]] for l in lessons)
assert all(len({next(p['topic'] for p in phrases if p['id']==pid) for pid in l['phraseIds']})==1 for l in lessons[30:])
assert all(l['reviewPhraseIds'] == ([] if l['day'] == 1 else lessons[l['day']-2]['phraseIds']) for l in lessons)
assert all(len(f['phraseIds']) == 5 and all(any(p['id']==pid and p['patternId']==f['id'] for p in phrases) for pid in f['phraseIds']) for f in patterns)
by_id={p['id']:p for p in phrases}
assert all(len({by_id[pid]['follow'] for pid in f['phraseIds']})==5 for f in patterns), 'each new phrase pattern needs five distinct follow-up turns'
assert all(sum(p['categoryId']==c['id'] for p in phrases)==c['count'] for c in categories)
assert all(p['subCategoryId'] in {s['id'] for s in subcategories} for p in phrases)
assert not any(bad in p['en'] for p in phrases for bad in ("I haven't had time to think about the weather", "I'd like to reduce friction in the main call-to-action", "Should we postpone the hotfix until the issue is fixed?"))

with (CONTENT / 'phrases.native.v3.csv').open(encoding='utf-8', newline='') as stream:
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
assert fingerprints == {p['id']:p['en'] for p in old[150:]}
print('PASS: V3 1200 phrases, 210 families, 240 lessons, 150 legacy fields, CSV and browser payload')
