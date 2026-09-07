import assert from 'node:assert/strict';
import {makeStage,trace,displayPoints,warp,SHAPES} from '../dist/engine.mjs';
import {normalizeProgress,isUnlocked,recordWin} from '../dist/progress.mjs';
const signatures=new Set();let maxEntrances=0,minHammerCandidates=4,minClueCandidates=4;
for(let level=1;level<=100;level++){
 const s=makeStage(level),results=Array.from({length:s.n},(_,i)=>trace(s,i));maxEntrances=Math.max(maxEntrances,s.n);
 assert(s.n<=4);assert(s.bridges.every(b=>Number.isFinite(b.y)));assert(s.bridges.length<=5);assert(s.checkpoints.length+s.hammers.length+s.rocks.length+s.hazards.length<=4);
 assert.equal(results.filter(r=>r.won).length,1,`Unique solution ${level}`);assert.deepEqual(makeStage(level),s);
 for(let i=0;i<s.n;i++){
  const r=results[i];assert(r.points.every(p=>p.every(Number.isFinite)));assert.deepEqual(r.points[0],s.starts[i]);if(!r.blocked)assert.deepEqual(r.points.at(-1),s.ends[r.end]);else {assert.equal(r.end,null);assert.equal(r.events.at(-1).outcome,'blocked');}
  assert(displayPoints(s,r.points).every(p=>p.every(v=>Number.isFinite(v)&&v>=20&&v<=780)),`Bounds ${level}`);
 }
 const ports=[...s.starts,...s.ends].map(p=>warp(s,p));for(let i=0;i<ports.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(ports[i][0]-ports[j][0],ports[i][1]-ports[j][1])>=48,`Badge clearance ${level}`);
 for(const marker of [...s.checkpoints,...s.hazards,...s.hammers,...s.rocks])assert(s.bridges.every(b=>Math.abs(b.y-marker.y)>=8));
 if(level>=21){
 const unconstrained=Array.from({length:s.n},(_,i)=>trace({...s,rocks:[]},i));
 for(const label of s.required){const count=unconstrained.filter(r=>r.hits.includes(label)).length;assert(count>=2,`${label} alone must not identify winner: ${level}`);minClueCandidates=Math.min(minClueCandidates,count);}
 assert(s.goals.length>=2,`Goal alone must not identify winner: ${level}`);
 }
 if(level>=61){
 const count=results.filter(r=>r.hasHammer&&!r.blocked).length;assert(count>=2,`Hammer alone must not identify winner ${level}`);minHammerCandidates=Math.min(minHammerCandidates,count);
 assert(results.some(r=>r.hasHammer&&!r.blocked&&!r.won),`Decoy with hammer ${level}`);
 const winningStart=results.findIndex(r=>r.won),winner=results[winningStart];assert(winner.events.some(e=>e.outcome==='broken'));
 assert(trace({...s,hammers:[]},winningStart).blocked);assert(trace({...s,hammers:s.hammers.map(h=>({...h,y:500}))},winningStart).blocked);
 assert(winner.events.some(e=>e.outcome==='broken'));
 assert.deepEqual(trace(s,winningStart),winner);
 }
 if((level-1)%5===0)signatures.add(JSON.stringify(Array.from({length:20},(_,i)=>warp(s,[450,90+i*420/19]))));
}
assert.equal(maxEntrances,4);assert.equal(signatures.size,20);assert.equal(SHAPES.length,20);
let save=normalizeProgress({unlocked:24,bonusUnlocked:70,cleared:[1,2,3,51,52],current:68});assert.equal(save.current,68);assert.deepEqual(save.legacyCleared,[1,2,3,51,52]);assert(isUnlocked(save,81));recordWin(save,81);assert(isUnlocked(save,82));assert.equal(normalizeProgress(save).cleared.length,1);
const existing=normalizeProgress({version:2,cleared:[1,6,72],legacyCleared:[1,2],unlocked:[2,7,72,73],current:72});assert.deepEqual(existing.cleared,[1,6,72]);assert.equal(existing.current,72);
console.log(`PASS: 100 unique solutions; 20 shapes; up to ${maxEntrances} entrances; every hammer stage has >=${minHammerCandidates} equipment candidates; checkpoints alone leave >=${minClueCandidates} candidates; alternative goals; badge clearance; blockers and save retention.`);
const side=p=>Math.abs(p[1]-44)<1e-6?'top':Math.abs(p[0]-756)<1e-6?'right':Math.abs(p[1]-756)<1e-6?'bottom':Math.abs(p[0]-44)<1e-6?'left':'interior';
for(let level=6;level<=100;level++){
 const s=makeStage(level),entrances=s.starts.map(p=>warp(s,p)),exits=s.ends.map(p=>warp(s,p));
 assert.equal(new Set([...entrances,...exits].map(side)).size,4,`Four edges ${level}`);
 assert(![...entrances,...exits].some(p=>side(p)==='interior'));
 if(s.n>=4){assert.equal(new Set(entrances.map(side)).size,4);assert.equal(new Set(exits.map(side)).size,4);}
}
// The lightning core consists of parallel polylines with bounded slope.
// Its worst-case adjacent perpendicular spacing is dx/sqrt(1+(90/130)^2).
for(let level=51;level<=55;level++){
 const s=makeStage(level),minimum=500/(s.n-1)/Math.sqrt(1+(90/130)**2);
 assert(minimum>68,`Lightning clearance ${level}`);
 for(let i=0;i<s.n-1;i++)for(let j=0;j<=100;j++){
 const y=90+420*(.06+.88*j/100),a=warp(s,[s.xs[i],y]),b=warp(s,[s.xs[i+1],y]);assert(Math.abs(b[0]-a[0]-500/(s.n-1))<1e-8);
 }
}
console.log('PASS: ports span all four edges; both kinds span four edges for 4+ lanes; lightning core spacing exceeds 68 SVG units.');

// Reference image: previous stage 36 (4 rails, 5 bridges, 4 symbols).
// Total stroke length is an additional density guard, not a substitute for visual inspection.
import {execFileSync} from 'node:child_process';
const referenceCode=execFileSync('git',['show','cac9ab24a086703fae21ed7490ffd4860cf1d0c4:dist/engine.mjs'],{encoding:'utf8'});
const reference=await import('data:text/javascript;base64,'+Buffer.from(referenceCode).toString('base64'));
const current=await import('../dist/engine.mjs');
const length=points=>points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
function ink(s,e){return s.xs.reduce((v,x)=>v+length(e.displayPoints(s,[[x,90],[x,510]])),0)+s.bridges.reduce((v,b)=>v+length(e.displayPoints(s,e.connector(s,b))),0);}
const limit=ink(reference.makeStage(36),reference);let maximum=0;
for(let n=1;n<=100;n++){const used=ink(makeStage(n),current);assert(used<=limit,`Reference line density exceeded in ${n}`);maximum=Math.max(maximum,used);}
console.log(`PASS: <=4 entrances, <=5 bridges, <=4 symbols, maximum stroke length ${maximum.toFixed(0)} <= reference ${limit.toFixed(0)}.`);
