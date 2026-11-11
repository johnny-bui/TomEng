#!/usr/bin/env python3
import json,collections,pathlib,re
root=pathlib.Path(__file__).resolve().parent
load=lambda file:json.loads((root/file).read_text(encoding='utf-8'))
p=load('phrases.native.v3.json');lessons=load('lessons.native.v3.json');cats=load('categories.native.v3.json');subs=load('subcategories.native.v3.json');patterns=load('patterns.native.v3.json')
assert len(p)==1200 and len(lessons)==240 and len(cats)==7 and len(subs)==70 and len(patterns)==210
assert len(set(x['en'].strip().casefold() for x in p))==1200
assert len(set(x['id'] for x in p))==1200
assert set(x['id'] for x in p)=={f'p{i:03d}' for i in range(1,1201)} and [x['id'] for x in p[:150]]==[f'p{i:03d}' for i in range(1,151)]
assert all(len(ls['phraseIds'])==5 for ls in lessons)
assert all(ls['phraseIds']==[x['id'] for x in p[i*5:(i+1)*5]] for i,ls in enumerate(lessons))
assert all(ls['reviewPhraseIds']==([] if i==0 else lessons[i-1]['phraseIds']) for i,ls in enumerate(lessons))
assert all(all(x.get(k) for k in ['id','en','vi','context','follow','categoryId','subCategoryId','memoryTip']) for x in p)
assert all(x['day']==i//5+1 for i,x in enumerate(p))
assert all(x['source']=='legacy' for x in p[:150])
counts=collections.Counter(x['categoryId'] for x in p)
assert counts=={'everyday':500,'reflex':125,'meeting':145,'design':150,'business':90,'engineering':125,'leadership':65}
assert all(x['categoryId'] in {c['id'] for c in cats} and x['subCategoryId'] in {s['id'] for s in subs} for x in p)
by_id={x['id']:x for x in p}
assert all(len(f['phraseIds'])==5 and len({by_id[pid]['follow'] for pid in f['phraseIds']})==5 for f in patterns), 'each new pattern family must have five distinct follow-up turns'
assert not any('{x}' in x['en'] or '{x}' in x['vi'] for x in p)
assert not any(re.search(r'\bi haven.t had time to think about the weather\b',x['en'],re.I) for x in p)
print('PASS: 1200 unique phrases / 240 lessons / 7 categories / 70 subcategories / 210 patterns')
print('Counts:',dict(counts))
print('Note: automatic checks do not establish native-speaker editorial correctness.')
