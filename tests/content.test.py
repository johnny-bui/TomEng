import collections
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'
phrases = json.loads((CONTENT / 'phrases.v2.json').read_text(encoding='utf-8'))
categories = json.loads((CONTENT / 'categories.v2.json').read_text(encoding='utf-8'))
subcategories = json.loads((CONTENT / 'subcategories.v2.json').read_text(encoding='utf-8'))
lessons = json.loads((CONTENT / 'lessons.v2.json').read_text(encoding='utf-8'))
patterns = json.loads((CONTENT / 'patterns.v2.json').read_text(encoding='utf-8'))
legacy_ids = json.loads((CONTENT / 'legacy-ids.json').read_text(encoding='utf-8'))
legacy_baseline = json.loads((ROOT / 'tests' / 'fixtures' / 'legacy-v1.json').read_text(encoding='utf-8'))

assert len(phrases) == 1200
assert [p['id'] for p in phrases] == [f'p{i:03}' for i in range(1,1201)]
normalised = [re.sub(r'[^a-z0-9 ]', '', p['en'].lower()).strip() for p in phrases]
assert len(set(normalised)) == 1200
assert len(categories) == 7 and len(subcategories) == 53
assert len(lessons) == 240 and all(len(x['phraseIds']) == 5 for x in lessons)
assert len(patterns) == 210
assert legacy_ids == [f'p{i:03}' for i in range(1,151)]
core_fields = ('id','day','en','vi','context','follow')
assert all(all(phrases[i].get(field) == legacy_baseline[i].get(field) for field in core_fields) for i in range(150))
required = {'id','day','en','vi','context','follow','pattern','memoryTip','categoryId','subCategoryId','patternId'}
assert all(required <= p.keys() and all(str(p[k]).strip() for k in required) for p in phrases)
assert all(set(x['phraseIds']) == set(p['id'] for p in phrases[(x['day']-1)*5:x['day']*5]) for x in lessons)
assert all(x['phraseIds'] == [p['id'] for p in phrases[(x['day']-1)*5:x['day']*5]] for x in lessons)
assert all(p['day'] == i//5+1 for i,p in enumerate(phrases))
assert all(p['categoryId'] in {c['id'] for c in categories} for p in phrases)
assert all(p['subCategoryId'] in {s['id'] for s in subcategories} for p in phrases)
assert all(p['source'] == ('legacy' if i < 150 else 'v2') for i,p in enumerate(phrases))
assert all(len([p for p in phrases[150:] if p['patternId'] == family['patternId']]) == 5 for family in patterns)
assert all(sum(p['categoryId'] == c['id'] for p in phrases) == c['count'] == c['target'] for c in categories)
with (CONTENT/'phrases.v2.csv').open(encoding='utf-8-sig',newline='') as f:
    rows=list(csv.DictReader(f))
assert len(rows)==1200 and rows[0]['en']==phrases[0]['en'] and rows[-1]['id']==phrases[-1]['id']
assert all(all(str(p.get(key,'')) == row[key] for key in row) for p,row in zip(phrases,rows))
js=(ROOT/'data.js').read_text(encoding='utf-8')
assert 'window.SPEAK5_PHRASES =' in js and '\ufffd' not in js
browser_phrases=json.loads(js.split('=',1)[1].rstrip(';\n'))
assert browser_phrases==phrases
meta=(ROOT/'meta.js').read_text(encoding='utf-8')
assert 'window.TOMENG_META =' in meta
browser_meta=json.loads(meta.split('=',1)[1].rstrip(';\n'))
assert browser_meta['categories']==categories and browser_meta['subcategories']==subcategories
assert browser_meta['lessons']==lessons and browser_meta['patterns']==patterns
assert '\ufffd' not in ''.join(str(v) for p in phrases for v in p.values())
print('PASS: 1200 full phrases; legacy IDs, categories, lessons, patterns, CSV and browser assets are consistent')
