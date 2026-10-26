'use strict';
// Unit 2 randomized recall, first-attempt scoring, preserved rewards and remedial feedback.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const from=html.indexOf("const FAMILY_KEY='chamoru-family-words-v40'");
const to=html.indexOf('function journeyCurrent()',from);
assert.ok(from>0&&to>from,'Unit 2 must be present');
const source=html.slice(from,to).replace(/window\.familyWordsBegin[\s\S]*$/,'');
function setup(){
 const storage=new Map(),localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const APP={innerHTML:''},db={xp:0,shells:0};
 let persisted=0;
 const make=new Function('localStorage','APP','db','stop','save','guideNav','esc','guidedPath','continueLearning',
   source+';return {begin:familyWordsBegin,open:familyOpen,start:familyStart,select:familySelect,check:familyCheck,next:familyNext,questions:FAMILY_CHECK,questionOrder:()=>familyQuestionOrder,optionOrder:()=>familyChoiceOrder,at:()=>familyAt,phase:()=>familyPhase,state:familyWordsState,answers:()=>familyAnswers};');
 const game=make(localStorage,APP,db,()=>{},()=>{persisted++},()=>'',String,()=>{},()=>{});
 function start(){game.begin();for(let i=0;i<4;i++)game.open(i);game.start()}
 function complete(incorrect=new Set()){
  for(let i=0;i<5;i++){
   const q=game.questionOrder()[game.at()],correct=game.questions[q][2],opts=game.optionOrder()[q];
   const choice=opts.indexOf(incorrect.has(i)?(correct+1)%3:correct);
   game.select(choice);game.check();game.next();
  }
 }
 return {game,APP,db,storage,start,complete,persisted:()=>persisted};
}
test('new test attempts permute all five questions and three answer choices',()=>{
 const h=setup();h.start();
 assert.deepEqual([...h.game.questionOrder()].sort((a,b)=>a-b),[0,1,2,3,4]);
 for(const choices of h.game.optionOrder())assert.deepEqual([...choices].sort((a,b)=>a-b),[0,1,2]);
});
test('five first-try correct answers earn one-time reward and save pass',()=>{
 const h=setup();h.start();h.complete();
 assert.equal(h.game.state.lastScore,5);assert.equal(h.game.state.passed,true);
 assert.equal(h.db.xp,20);assert.equal(h.db.shells,4);assert.equal(h.persisted(),1);
 assert.equal(JSON.parse(h.storage.get('chamoru-family-words-v40')).passed,true);
 h.start();h.complete();
 assert.equal(h.db.xp,20);assert.equal(h.db.shells,4);
});
test('three of five is not mastery, review meanings appear only after checkpoint',()=>{
 const h=setup();h.start();
 for(let i=0;i<5;i++){
  const q=h.game.questionOrder()[h.game.at()],correct=h.game.questions[q][2],opts=h.game.optionOrder()[q];
  h.game.select(opts.indexOf(i<2?(correct+1)%3:correct));
  h.game.check();
  if(i===0)assert.doesNotMatch(h.APP.innerHTML,/Review these meanings next/);
  h.game.next();
 }
 assert.equal(h.game.state.lastScore,3);assert.notEqual(h.game.state.passed,true);
 assert.equal(h.db.xp,0);assert.match(h.APP.innerHTML,/Review these meanings next/);
 assert.equal(h.game.state.lastReview.length,2);
});
test('four of five passes once and stores targeted review skills',()=>{
 const h=setup();h.start();h.complete(new Set([2]));
 assert.equal(h.game.state.lastScore,4);assert.equal(h.game.state.passed,true);
 assert.equal(h.game.state.lastReview.length,1);
 assert.equal(h.db.shells,4);
});
