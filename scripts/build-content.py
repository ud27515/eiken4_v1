"""Build the fixed 1,000-question original practice bank."""
import json,random,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
C=ROOT/'content'
questions=json.loads((C/'original.json').read_text())
materials={}
for q in questions:
 if q.get('passage'):
  materials.setdefault(q['passage'],f'original-reading-{len(materials)+1}')
  q.update(materialId=materials[q['passage']],materialTitle='読解トレーニング')
 if q.get('audio'):q.update(materialId=f"original-listening-{q['id']}",materialTitle='聞き取りトレーニング')
 if q.get('words'):q['accepted']=[q['options'][0]]
def add(id,cat,tag,prompt,options,explain,**extra):questions.append(dict(id=id,cat=cat,tag=tag,prompt=prompt,options=options,explain=explain,**extra))
n=0
for line in (C/'words.txt').read_text().splitlines():
 tag,data=line.split('|');rows=[x.split('=') for x in data.split(';')]
 for word,meaning in rows:
  n+=1;wrong=random.Random(n).sample([r[1] for r in rows if r[1]!=meaning],3)
  add(f'w{n:03}','word',tag,f'「{word}」の意味は？',[meaning,*wrong],f'{word} は「{meaning}」という意味です。',word=word)
n=0
for line in (C/'grammar.txt').read_text().splitlines():
 if line.startswith('# '):tag,rule=line[2:].split('|')
 elif line:
  p,a,*wrong=line.split('|');n+=1
  add(f'g{n:03}','grammar',tag,p,[a,*wrong],rule+'\n完成文：'+p.replace('(     )',a))
for n,line in enumerate((C/'conversation.txt').read_text().splitlines(),1):
 p,a,w1,w2,w3,e=line.split('|');add(f'c{n:03}','conversation','会話表現',p.replace(' / ','\n'),[a,w1,w2,w3],e)
for n,line in enumerate((C/'order.txt').read_text().splitlines(),1):
 p,a,e,*alts=[x.strip() for x in line.split('|')]
 add(f'o{n:03}','order','語順',p,[a],e,words=a.split(),accepted=[a,*alts])
for cat in ['reading','listening']:
 m=0
 for line in (C/f'{cat}.txt').read_text().splitlines():
  if line.startswith('# '):m+=1;title=line[2:];body=None;qi=0
  elif line and body is None:body=line.replace('\\n','\n')
  elif line:
   qi+=1;p,a,w1,w2,w3,e=line.split('|');extra=dict(materialId=f'{cat}-{m:02}',materialTitle=title)
   if cat=='reading':extra['passage']=body
   else:
    extra.update(script=body,audioQuestion=p,audio=body+'\nQuestion: '+p)
    p='音声を聞いて、質問の答えを選ぼう。'
   add(f'{cat[0]}{m:02}-{qi}',cat,'読解' if cat=='reading' else '聞き取り',p,[a,w1,w2,w3],e,**extra)
for q in questions:
 if not q.get('words'):continue
 accepted=q['accepted']
 for a in list(accepted):
  parts=a.split()
  if parts[0].lower()=='please':accepted.append(' '.join(parts[1:]+[parts[0]]))
 if q['options'][0]=='I was very busy yesterday':accepted.append('Yesterday I was very busy')
 if q['options'][0]=='What are you going to do tomorrow':accepted.append('Tomorrow what are you going to do')
expected=dict(word=300,grammar=200,conversation=100,order=100,reading=150,listening=150)
counts=collections.Counter(q['cat'] for q in questions)
assert counts==expected,counts
assert len({q['id'] for q in questions})==1000
assert len({q['passage'] for q in questions if q['cat']=='reading'})==50
for q in questions:
 assert q['explain'] and q['options'][0]
 if not q.get('words'):assert len(q['options'])==len(set(q['options']))==4,q['id']
 else:
  for a in q['accepted']:assert collections.Counter(w.lower() for w in a.split())==collections.Counter(w.lower() for w in q['words']),q['id']
keys=[(q['cat'],q.get('passage',''),q.get('audio',''),q['prompt']) for q in questions]
assert len(set(keys))==len(keys),'Duplicate questions'
((ROOT/'dist' if (ROOT/'dist').is_dir() else ROOT)/'data.js').write_text('/* STEP FOUR v2: fixed original practice bank. */\nconst questions = '+json.dumps(questions,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps(dict(total=len(questions),categories=counts,readingMaterials=50,listeningScenes=len({q['materialId'] for q in questions if q['cat']=='listening'})),ensure_ascii=False))
