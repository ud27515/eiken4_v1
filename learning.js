function learningTier(q, records) {
 const r=records[q.id];
 if(!r||!r.attempts)return 0;
 return r.last===false?1:2;
}
function prioritizeQuestions(pool,records){
 return shuffle(pool).sort((a,b)=>learningTier(a,records)-learningTier(b,records)||(records[a.id]?.lastAt||0)-(records[b.id]?.lastAt||0)||(records[a.id]?.attempts||0)-(records[b.id]?.attempts||0));
}
function pickQuestions(pool,records,limit,groupMaterials=false){
 let ranked=prioritizeQuestions(pool,records);
 if(!groupMaterials)return ranked.slice(0,limit);
 const chosen=[];
 while(ranked.length&&chosen.length<limit){
  const first=ranked[0],tier=learningTier(first,records);
  const group=ranked.filter(q=>learningTier(q,records)===tier&&q.materialId===first.materialId);
  for(const q of group.length?group:[first]){
   if(chosen.length>=limit)break;
   chosen.push(q);ranked=ranked.filter(o=>o.id!==q.id);
  }
 }
 return chosen;
}
function normalizedSentence(text){return text.toLowerCase().replace(/[.!?,]/g,'').replace(/\s+/g,' ').trim();}
function isCorrectOrder(q,text){return(q.accepted||[q.options[0]]).some(a=>normalizedSentence(a)===normalizedSentence(text));}
