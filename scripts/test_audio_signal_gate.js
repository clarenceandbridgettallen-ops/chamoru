'use strict';
const assert=require('node:assert/strict');
const {analyzePcm16Wav}=require('./audio_signal_gate');
function wav({seconds=1,rate=16000,channels=1,amplitude=10000,activeSeconds=seconds,clipped=false}={}){
 const frames=Math.round(seconds*rate), len=frames*channels*2, b=Buffer.alloc(44+len);
 b.write('RIFF',0);b.writeUInt32LE(36+len,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels*2,28);b.writeUInt16LE(channels*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(len,40);
 for(let i=0;i<frames;i++){let v=i<activeSeconds*rate?(clipped?32767:Math.round(amplitude*Math.sin(2*Math.PI*440*i/rate))):0;for(let c=0;c<channels;c++)b.writeInt16LE(v,44+(i*channels+c)*2);}return b;
}
const checks=[
 ['one-second original synthetic tone passes signal gate',()=>{let r=analyzePcm16Wav(wav());assert.equal(r.signalGatePass,true);assert.equal(r.pronunciationVerified,false);} ],
 ['digital silence rejected',()=>assert.ok(analyzePcm16Wav(wav({amplitude:0})).reasons.includes('signal-too-quiet'))],
 ['long trailing silence rejected',()=>assert.ok(analyzePcm16Wav(wav({seconds:2,activeSeconds:.7})).reasons.includes('long-trailing-silence'))],
 ['clipping rejected',()=>assert.ok(analyzePcm16Wav(wav({clipped:true})).reasons.includes('excessive-clipping'))],
 ['stereo PCM supported',()=>assert.equal(analyzePcm16Wav(wav({channels:2})).channels,2)],
 ['short recording rejected',()=>assert.ok(analyzePcm16Wav(wav({seconds:.1})).reasons.includes('duration-outside-0.2-to-30s'))],
 ['malformed header rejected',()=>assert.throws(()=>analyzePcm16Wav(Buffer.alloc(44)))],
 ['truncated chunk rejected',()=>{let b=wav();b.writeUInt32LE(999999,40);assert.throws(()=>analyzePcm16Wav(b));}],
 ['unsupported sample format rejected',()=>{let b=wav();b.writeUInt16LE(3,20);assert.throws(()=>analyzePcm16Wav(b));}],
 ['zero frames rejected',()=>{let b=wav({seconds:0});assert.throws(()=>analyzePcm16Wav(b));}]
];
for(const [name,fn] of checks){fn();console.log('PASS',name)}
console.log(checks.length+'/'+checks.length+' local signal tests passed');
