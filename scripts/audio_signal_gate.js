/** Offline, NON-LIVE signal-quality gate for ORIGINAL PCM16 WAV experiments.
 * Checks signal presence, duration, clipping and trailing silence.
 * It CANNOT validate language, phonemes, intelligibility or rights.
 */
'use strict';
const fs = require('node:fs');
function analyzePcm16Wav(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 44 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WAVE') throw new Error('Expected RIFF/WAVE buffer');
  if (bytes.readUInt32LE(4)!==bytes.length-8) throw new Error('Invalid RIFF size');
  let fmt=null, data=null, offset=12;
  while (offset+8<=bytes.length) {
    const tag=bytes.toString('ascii',offset,offset+4), n=bytes.readUInt32LE(offset+4), begin=offset+8;
    if (begin+n>bytes.length) throw new Error('Truncated WAV chunk');
    if (tag==='fmt ') {
      if (n<16) throw new Error('Short fmt chunk');
      fmt={codec:bytes.readUInt16LE(begin),channels:bytes.readUInt16LE(begin+2),rate:bytes.readUInt32LE(begin+4),align:bytes.readUInt16LE(begin+12),bits:bytes.readUInt16LE(begin+14)};
    }
    if (tag==='data') data=bytes.subarray(begin,begin+n);
    offset=begin+n+(n%2);
  }
  if (!fmt || !data || fmt.codec!==1 || fmt.bits!==16 || ![1,2].includes(fmt.channels) || fmt.align!==2*fmt.channels || fmt.rate<8000 || fmt.rate>192000 || data.length%fmt.align!==0) throw new Error('Unsupported or malformed PCM16 WAV');
  const frames=data.length/fmt.align;
  if (!frames) throw new Error('Empty audio');
  let sum=0, peak=0, clipped=0, lastActive=-1;
  const signedSums=Array(fmt.channels).fill(0), squaredSums=Array(fmt.channels).fill(0);
  const threshold=32768*Math.pow(10,-45/20);
  for (let frame=0;frame<frames;frame++) {
    let active=false;
    for (let c=0;c<fmt.channels;c++) {
      const sample=data.readInt16LE(frame*fmt.align+2*c), a=Math.abs(sample);
      signedSums[c]+=sample; squaredSums[c]+=sample*sample;
      sum+=a*a; peak=Math.max(peak,a); if (a>=32760) clipped++;
      if (a>threshold) active=true;
    }
    if(active) lastActive=frame;
  }
  const rms=Math.sqrt(sum/(frames*fmt.channels))/32768;
  // Remove per-channel DC offset: a constant non-audible voltage must not count as speech.
  const acPower=squaredSums.reduce((total,sq,c)=>total+Math.max(0,sq/frames-Math.pow(signedSums[c]/frames,2)),0)/fmt.channels;
  const acRms=Math.sqrt(acPower)/32768;
  const durationSeconds=frames/fmt.rate;
  const trailingSilenceSeconds=(frames-1-lastActive)/fmt.rate;
  const report={sampleRate:fmt.rate,channels:fmt.channels,durationSeconds,rmsDbfs:rms?20*Math.log10(rms):-Infinity,acRmsDbfs:acRms?20*Math.log10(acRms):-Infinity,peakDbfs:peak?20*Math.log10(peak/32768):-Infinity,clippedFraction:clipped/(frames*fmt.channels),trailingSilenceSeconds};
  const reasons=[];
  if(durationSeconds<0.2 || durationSeconds>30) reasons.push('duration-outside-0.2-to-30s');
  if(report.acRmsDbfs< -38) reasons.push('signal-too-quiet');
  if(report.clippedFraction>0.001) reasons.push('excessive-clipping');
  if(trailingSilenceSeconds>Math.max(0.5,durationSeconds*0.25)) reasons.push('long-trailing-silence');
  return { ...report,signalGatePass:reasons.length===0,reasons,pronunciationVerified:false };
}
if(require.main===module){
  const path=process.argv[2]; if(!path){console.error('Usage: node audio_signal_gate.js local-original.wav');process.exit(2);}
  try { const result=analyzePcm16Wav(fs.readFileSync(path));console.log(JSON.stringify(result,null,2));if(!result.signalGatePass)process.exitCode=1; }catch(e){console.error(e.message);process.exitCode=2;}
}
module.exports={analyzePcm16Wav};
