const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const base=fs.existsSync('dist/app.js')?'dist/':'';
const elements=new Map(),stored=new Map();stored.set('step4-record-v1',JSON.stringify({1:{attempts:3,correct:2,last:false},31:{attempts:2,correct:2,last:true}}));
function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'1',classList:{add(){}},querySelectorAll(){return[]}});return elements.get(key)}
const ctx={console,document:{querySelector:el},window:{scrollTo(){}},localStorage:{getItem(k){return stored.get(k)||null},setItem(k,v){stored.set(k,v)}},confirm(){return true},assert};
vm.createContext(ctx);for(const f of ['data.js','learning.js','app.js'])vm.runInContext(fs.readFileSync(base+f,'utf8'),ctx);
ctx.original=JSON.parse(fs.readFileSync('content/original.json','utf8'));
vm.runInContext(`
assert.equal(questions.length,1000);
for(const old of original){const q=questions.find(q=>q.id===old.id);for(const f of ['cat','prompt','options','explain'])assert.equal(JSON.stringify(q[f]),JSON.stringify(old[f]),'Original changed: '+old.id);}
assert.equal(record[1].attempts,3);assert.equal(record[31].last,true);assert.equal(stats().unseen,998);
const expected={word:300,grammar:200,conversation:100,order:100,reading:150,listening:150};
for(const [cat,n] of Object.entries(expected))assert.equal(questions.filter(q=>q.cat===cat).length,n);
for(const q of questions){assert.ok(q.explain);assert.ok(q.options[0]);if(q.words){for(const a of q.accepted)assert.ok(isCorrectOrder(q,a));assert.equal(isCorrectOrder(q,'completely wrong'),false);}else{assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);}}
for(const cat of Object.keys(expected)){
 const pool=questions.filter(q=>q.cat===cat),r={};let seen=new Set();
 while(seen.size<pool.length){const next=pickQuestions(pool,r,10,['reading','listening'].includes(cat));assert.equal(new Set(next.map(q=>q.id)).size,next.length);let firstReviewed=false;
 for(const q of next){if(seen.has(q.id))firstReviewed=true;else{assert.equal(firstReviewed,false,'Unseen after reviewed');seen.add(q.id);r[q.id]={attempts:1,last:true,lastAt:seen.size};}}}
 assert.equal(seen.size,pool.length);
}
const pool=questions.slice(0,4),r={};r[pool[0].id]={attempts:2,last:true,lastAt:1};r[pool[1].id]={attempts:2,last:false,lastAt:20};r[pool[2].id]={attempts:1,last:false,lastAt:10};
assert.equal(pickQuestions(pool,r,4).map(q=>q.id).join(','),[pool[3],pool[2],pool[1],pool[0]].map(q=>q.id).join(','));
record={};for(const mode of Object.keys(categories)){start(mode);assert.ok(session.queue.length>0);assert.ok(session.queue.length<=10);assert.ok(session.queue.every(q=>q.cat===mode));}
start('mix');assert.equal(session.queue.length,10);assert.equal(new Set(session.queue.map(q=>q.id)).size,10);assert.equal(session.queue.some(q=>q.audio),false);
const first=session.queue[0];answer(false,'wrong');answer(true,first.options[0]);assert.equal(record[first.id].attempts,1);assert.equal(stats().weak.length,1);
start('review');assert.equal(session.queue[0].id,first.id);answer(true,first.options[0]);assert.equal(stats().weak.length,0);assert.ok(record[first.id].lastAt);
for(const q of questions){start(q.cat,[q]);answer(true,q.options[0]);assert.equal(session.answers[0].correct,true);result();assert.ok(app.innerHTML.includes('1<small> / 1'));}
home();start('review');assert.equal(session,null);
console.log('PASS: 1000-question bank, legacy record compatibility, full unseen coverage, review ordering, alternate answers, rendering and scoring.');
`,ctx);
