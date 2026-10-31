'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('const CHMEDIA=[');
const end=html.indexOf('window.mediaHub=mediaHub;',start);
assert.ok(start!==-1&&end>start,'The culture and audio resource hub must exist');
const source=html.slice(start,end+'window.mediaHub=mediaHub;'.length);
function harness(){
 const APP={innerHTML:''};const calls=[];const ctx={APP,window:{},stop:()=>calls.push('stop'),guideNav:()=>'<nav>menu</nav>',esc:x=>String(x),continueLearning:()=>{},home:()=>{},screen:''};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {APP,calls,ctx};
}
test('published home and practice lead to the restored culture library',()=>{
 assert.match(html,/onclick="mediaHub\(\)">♫ Watch & Listen/);
 assert.match(html,/Audio, Videos & Culture Library/);
 assert.match(html,/onclick="mediaHub\(\)"/);
});
test('seven original audio, video and island culture publishers are discoverable',()=>{
 const h=harness();h.ctx.mediaHub();
 const expected=['colorguam.com/activity-book-audio/','archive.phonetics.ucla.edu/Language/CHA/cha.html',
  'lengguahita.com/free-beginner-chamorro-lessons/','learningchamoru.com/',
  'pbsguam.org/higher-learning/manamko-to-manhoben/','guampedia.com/explore-more/','guampedia.com/for-the-seafarers/'];
 for(const url of expected)assert.ok(h.APP.innerHTML.includes(url),url+' missing');
 assert.equal((h.APP.innerHTML.match(/class="chmedia-item"/g)||[]).length,7);
 assert.match(h.APP.innerHTML,/Our Language & Culture Library/);
});
test('external media links do not silently copy media or award mastery credit',()=>{
 const h=harness();h.ctx.mediaHub();
 assert.equal((h.APP.innerHTML.match(/rel="noopener noreferrer"/g)||[]).length,7);
 assert.doesNotMatch(source,/\bfetch\s*\(|\bnew Audio\(|localStorage\.setItem|db\.xp\s*\+?=|db\.shells\s*\+?=/);
 assert.match(h.APP.innerHTML,/not permission to use their recordings commercially/);
});
test('media page keeps Back/Next and existing practice and reader routes visible',()=>{
 const h=harness();h.ctx.mediaHub();
 assert.match(h.APP.innerHTML,/onclick="home\(\)">← Home/);
 assert.match(h.APP.innerHTML,/onclick="continueLearning\(\)">NEXT: Continue learning/);
 assert.match(h.APP.innerHTML,/onclick="guidedPractice\(\)"/);
 assert.match(h.APP.innerHTML,/onclick="readerOpen\(\)"/);
 assert.match(h.APP.innerHTML,/onclick="guidedPath\(\)"/);
});
test('old mastery gates, original starter lessons and browser storage keys remain',()=>{
 assert.match(html,/const KEY='chamoru_for_you_unit1_v15'/);
 assert.match(html,/const JOURNEY=\[/);
 assert.match(html,/function journeyOpen\(i\)/);
 assert.match(html,/if\(first!==-1 && i>first && !JOURNEY\[i\]\.done\(\)\)return/);
 assert.match(html,/function gamesHome\(/);
 assert.match(html,/function v27Start\(/);
 assert.match(html,/function readerOpen\(/);
});
