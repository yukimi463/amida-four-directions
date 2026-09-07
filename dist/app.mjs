import {makeStage,connector,railIn,railOut,trace,path,rotate,warp,displayPoints,SHAPES} from './engine.mjs';
import {normalizeProgress,isUnlocked,recordWin} from './progress.mjs';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
let saved=normalizeProgress(null);
try{saved=normalizeProgress(JSON.parse(localStorage.getItem('amida-four-v1')));}catch{}
let level=saved.current,stage,selected=null,failed=[],state='choose',animation=null,finishNow=null;
function save(){saved.current=level;try{localStorage.setItem('amida-four-v1',JSON.stringify(saved));}catch{$('saved').textContent='このブラウザでは進行状況を保存できません';}}
function svg(tag,attrs,parent=$('board')){const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);parent.append(el);return el;}
function textAt(p,label,cls,parent){const el=svg('text',{x:p[0],y:p[1],class:cls},parent);el.textContent=label;return el;}
function boardPath(points){return path(displayPoints(stage,points));}
function markerPosition(marker){return rotate(warp(stage,[stage.xs[marker.lane],marker.y]),stage.rotation);}
function draw(){
 $('board').replaceChildren();const defs=svg('defs',{}),arrow=svg('marker',{id:'directionArrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:5,markerHeight:5,orient:'auto'},defs);svg('path',{d:'M 0 0 L 10 5 L 0 10',fill:'none',stroke:'#e5efeb','stroke-width':2},arrow);const group=svg('g',{transform:`rotate(${stage.rotation} 300 300)`});
 for(let i=0;i<stage.n;i++){const d=boardPath([...railIn(stage,i),...railOut(stage,i)]);svg('path',{d,fill:'none',stroke:'#162630','stroke-width':9,'stroke-linejoin':'round'},group);svg('path',{d,class:'rail'},group);}
 for(const b of stage.bridges){svg('path',{d:boardPath(connector(stage,b)),class:'bridge'},group);for(const lane of [b.lane,b.lane+1])svg('circle',{cx:warp(stage,[stage.xs[lane],b.y])[0],cy:warp(stage,[stage.xs[lane],b.y])[1],r:3.5,class:'junction'},group);}
 for(let i=0;i<stage.n;i++)for(const y of [108,248,488])svg('path',{d:boardPath([[stage.xs[i],y],[stage.xs[i],y+7]]),fill:'none',stroke:'#dbece5','stroke-width':2,'marker-end':'url(#directionArrow)'},group);
 svg('g',{id:'trail',transform:`rotate(${stage.rotation} 300 300)`});
 for(let i=0;i<stage.n;i++){
 const p=rotate(warp(stage,stage.starts[i]),stage.rotation),end=rotate(warp(stage,stage.ends[i]),stage.rotation),chosen=selected===i;
 const hit=svg('g',{'aria-hidden':'true',style:'cursor:pointer'});svg('circle',{cx:p[0],cy:p[1],r:24,fill:chosen?'#adf4d3':'#203640',stroke:chosen?'#adf4d3':'#73939c','stroke-width':2},hit);
 const number=textAt(p,i+1,'endpoint',hit);if(chosen)number.setAttribute('style','fill:#10281f');hit.addEventListener('click',()=>choose(i));
 svg('rect',{x:end[0]-23,y:end[1]-23,width:46,height:46,rx:12,fill:stage.goals.includes(i)?'#463c24':'#1c3039',stroke:stage.goals.includes(i)?'#f1cf7c':'#405861','stroke-width':stage.goals.includes(i)?2:1});textAt(end,stage.goals.includes(i)?(stage.goals.length>1?'旗':'当'):'×',stage.goals.includes(i)?'endpoint goaltext':'endpoint');
 }
 for(const [kind,markers] of [['checkpoint',stage.checkpoints],['hazard',stage.hazards],['hammer',stage.hammers],['rock',stage.rocks]])for(const marker of markers){const p=markerPosition(marker),g=svg('g',{id:'marker-'+marker.id,class:'marker '+kind});svg('circle',{cx:p[0],cy:p[1],r:kind==='rock'?15:14},g);textAt(p,kind==='hazard'?'!':kind==='hammer'?'🔨':kind==='rock'?'岩':marker.label,'marker-text',g);const title=svg('title',{},g);title.textContent=kind==='hammer'?'ハンマーを拾う':kind==='rock'?'岩：ハンマーが必要':kind==='hazard'?'危険地点':`チェックポイント ${marker.label}`;}

}
function choices(){const parent=$('choices');parent.replaceChildren();for(let i=0;i<stage.n;i++){const b=document.createElement('button');b.className='choice'+(selected===i?' selected':'')+(failed.includes(i)?' wrong':'');b.textContent=i+1;b.setAttribute('aria-label',`スタート ${i+1}${failed.includes(i)?' はずれ':''}`);b.setAttribute('aria-pressed',String(selected===i));b.disabled=state!=='choose'||failed.includes(i);b.onclick=()=>choose(i);parent.append(b);}}
function choose(i){if(state!=='choose'||failed.includes(i))return;selected=i;draw();choices();$('go').disabled=false;$('go').textContent=`${i+1}番で進む`;$('message').textContent=`${i+1}番から出発しますか？`;}
function updateMission(){
 $('mission').classList.remove('hidden');
 const conditions=[];if(stage.checkpoints.length)conditions.push(stage.required.join(' → ')+' を通過');if(stage.hazards.length)conditions.push('! を避ける');if(stage.hammers.length)conditions.push('🔨 ハンマーを拾い、岩を壊す');
 $('missionText').textContent=(conditions.length?conditions.join('。')+'。':'')+(stage.goals.length>1?'どれかの旗へ到達しよう。':'「当」の出口へ到達しよう。');
 $('missionStatus').textContent=stage.hammers.length?'ハンマー：未所持':stage.checkpoints.length?'チェックポイント：未通過':'番号から矢印の向きに進もう';
}
function load(n){
 if(animation)cancelAnimationFrame(animation);animation=null;finishNow=null;level=n;stage=makeStage(n);selected=null;failed=[];state='choose';
 $('level').textContent=String(n).padStart(2,'0');$('chapter').textContent=`${SHAPES[stage.group]} · ${(n-1)%5+1} / 5`;
 $('progress').textContent=`${saved.cleared.length} / 100 クリア`;$('bar').style.width=`${saved.cleared.length/100*100}%`;
 $('direction').textContent=stage.group===0?'上から下へ':'上下左右の番号から出発';
 $('goalHint').textContent=stage.goals.length>1?'条件を満たして旗へ':'当たりを目指そう';$('shape').textContent=`${stage.n}本の主線 · ${stage.bridges.length}本の接続線`;$('lives').textContent='選び直し あと1回';
 $('message').textContent=stage.goals.length>1?'条件を満たす番号は？':'当たりにつながる番号は？';$('detail').textContent='主線を矢印に沿って進み、接続線では隣へ渡ろう。';if(saved.legacyCleared.length)$('saved').textContent=`旧版の${saved.legacyCleared.length}面クリア記録を保管 · 新版は別集計`;
 $('go').textContent='番号を選んでください';$('go').disabled=true;$('skipAnimation').classList.add('hidden');updateMission();choices();draw();save();
}
function complete(result){
 state=result.won?'won':failed.length===0?'retry':'lost';$('skipAnimation').classList.add('hidden');$('go').disabled=false;
 if(state==='won'){
 recordWin(saved,level);save();$('progress').textContent=`${saved.cleared.length} / 100 クリア`;
 $('message').textContent=saved.cleared.length===100?'全100ステージ、踏破！':level%5===0?'この形を攻略！':'条件達成！ お見事。';$('detail').textContent=level===100?'ほかの未クリア面にも挑戦してみよう。':level%5===0?`次は「${SHAPES[stage.group+1]}」の盤面です。`:'道を読み解きました。次の籤へ進みましょう。';$('go').textContent=level===100?'ステージ一覧へ':'次のステージへ';$('bar').style.width=`${saved.cleared.length}%`;

 }else{failed.push(selected);$('message').textContent=state==='retry'?'はずれ。でも、もう一度。':'今回はここまで。';$('detail').textContent=state==='retry'?'一度だけ復活できます。別の番号を選んで挑戦しよう。':'経路を振り返って、同じステージに再挑戦できます。';$('detail').textContent=(result.blocked?'ハンマーを持っていないため、岩で止まりました。':result.dangerHits.length?'危険地点を通ってしまいました。':result.hits.length<stage.required.length?'チェックポイントをすべて通れませんでした。':'当たりとは別の出口でした。')+(state==='retry'?' 一度だけ復活できます。':' 再挑戦してみよう。');$('go').textContent=state==='retry'?'復活して選び直す':'このステージに再挑戦';$('lives').textContent='選び直し あと0回';}choices();
}
function run(){
 if(selected===null||state!=='choose')return;state='running';choices();$('go').disabled=true;$('go').textContent='線をたどっています…';$('message').textContent='どこにたどり着くかな？';$('detail').textContent='光る線が選んだ経路をたどります。';
 const result=trace(stage,selected),el=svg('path',{d:boardPath(result.points),class:'trace'},$('trail')),length=el.getTotalLength();el.style.strokeDasharray=length;el.style.strokeDashoffset=length;
 const eventDistances=result.events.map(e=>{const temp=svg('path',{d:boardPath(result.points.slice(0,e.pointIndex+1))},$('trail')),distance=temp.getTotalLength();temp.remove();return {...e,distance};});
 const showEvents=distance=>{const passed=eventDistances.filter(e=>e.distance<=distance+0.1);for(const e of passed){const marker=$('marker-'+e.id);marker?.classList.add('visited');if(e.outcome==='broken')marker?.classList.add('broken');if(e.outcome==='blocked')marker?.classList.add('blocked');}
 const info=stage.required.map(label=>`${label} ${passed.some(e=>e.kind==='checkpoint'&&e.label===label)?'通過 ✓':'未通過'}`);if(stage.hammers.length)info.push('ハンマー：'+(passed.some(e=>e.kind==='hammer')?'所持 🔨':'未所持'));const broken=passed.filter(e=>e.outcome==='broken').length;if(broken)info.push(`岩を${broken}個破壊`);if(passed.some(e=>e.outcome==='blocked'))info.push('岩で停止');if(passed.some(e=>e.kind==='hazard'))info.push('危険地点に接触');$('missionStatus').textContent=info.join(' / ')||'矢印に沿って進行中';};
 const dot=svg('circle',{r:7,fill:'#fff6ce'},$('trail'));let done=false;
 finishNow=()=>{if(done)return;done=true;if(animation)cancelAnimationFrame(animation);el.style.strokeDashoffset=0;const p=el.getPointAtLength(length);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);finishNow=null;showEvents(length);complete(result);};
 const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(11000,2500+length*2),start=performance.now();
 function step(time){const fraction=Math.min(1,(time-start)/duration),p=el.getPointAtLength(length*fraction);el.style.strokeDashoffset=length*(1-fraction);showEvents(length*fraction);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);if(fraction<1)animation=requestAnimationFrame(step);else finishNow?.();}
 $('skipAnimation').classList.remove('hidden');animation=requestAnimationFrame(step);
}
function openStages(){
 if(state==='running')return;$('clearCount').textContent=`${saved.cleared.length} / 100 クリア · 各グループの最初の面から遊べます`;$('stageGrid').replaceChildren();
 for(let n=1;n<=100;n++){
 if((n-1)%5===0){const h=document.createElement('h3');h.className='course-title';h.textContent=`${String(n).padStart(2,'0')}–${n+4} · ${SHAPES[Math.floor((n-1)/5)]}`;$('stageGrid').append(h);}
 const b=document.createElement('button');b.textContent=String(n).padStart(2,'0');b.className=n===level?'current':saved.cleared.includes(n)?'cleared':'';b.disabled=!isUnlocked(saved,n);b.setAttribute('aria-label',`ステージ${n}${saved.cleared.includes(n)?' クリア済み':''}${b.disabled?' 未解放':''}`);b.onclick=()=>{$('stageDialog').close();load(n);};$('stageGrid').append(b);
 }$('stageDialog').showModal();
}
$('go').onclick=()=>{if(state==='choose')run();else if(state==='won'){if(level===100)openStages();else load(level+1);}else if(state==='retry'){state='choose';selected=null;draw();choices();updateMission();$('go').disabled=true;$('go').textContent='別の番号を選んでください';$('message').textContent='もう一度、線を読もう。';$('detail').textContent='はずれだった番号以外を選んでください。';}else if(state==='lost')load(level);};
$('bonus').onclick=()=>{if(state!=='running')load(81);};
$('skipAnimation').onclick=()=>finishNow?.();$('stages').onclick=openStages;$('help').onclick=()=>$('helpDialog').showModal();document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));load(level);

$('zoom').onclick=()=>{const zoomed=$('boardViewport').classList.toggle('zoomed');$('zoom').textContent=zoomed?'全体を表示':'盤面を拡大';$('zoom').setAttribute('aria-pressed',String(zoomed));};
