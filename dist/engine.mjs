export const TOTAL_STAGES=100;
export const SHAPES=['はしご','ダイヤ','五芒星','UFO','六角形','ハート','三角形','ウェーブ','砂時計','円環','稲妻','花びら','八角形','矢印','蝶','盾','歯車','ロケット','八芒星','土星'];
export function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const regular=(n,inner=1)=>Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n;const r=i%2?inner:1;return [r*Math.cos(a),r*Math.sin(a)];});
function outline(group){
 switch(group){
 case 1:return [[1,0],[0,1],[-1,0],[0,-1]];
 case 2:return regular(10,.48);
 case 3:return [[1,0],[.6,.3],[.25,.36],[-.25,.36],[-.6,.3],[-1,0],[-.5,-.12],[-.38,-.52],[-.2,-.7],[0,-.76],[.2,-.7],[.38,-.52],[.5,-.12]];
 case 4:return regular(6);
 case 5:return Array.from({length:120},(_,i)=>{const t=i*2*Math.PI/120;return [Math.pow(Math.sin(t),3),-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/18];});
 case 6:return regular(3);
 case 8:return [[1,-1],[.6,0],[1,1],[-1,1],[-.6,0],[-1,-1]];
 case 9:return regular(120);
 case 10:return [[.15,-1],[-.75,.15],[-.1,.1],[-.2,1],[.85,-.2],[.12,-.1]];
 case 11:return Array.from({length:180},(_,i)=>{const a=i*2*Math.PI/180,r=.78+.2*Math.cos(5*a);return [r*Math.cos(a),r*Math.sin(a)];});
 case 12:return regular(8);
 case 13:return [[1,0],[.1,1],[.1,.42],[-1,.42],[-1,-.42],[.1,-.42],[.1,-1]];
 case 14:return [[1,-.8],[.7,0],[1,.8],[.25,.55],[0,.2],[-.25,.55],[-1,.8],[-.7,0],[-1,-.8],[-.25,-.55],[0,-.2],[.25,-.55]];
 case 15:return [[1,-.75],[.85,.35],[.4,.8],[0,1],[-.4,.8],[-.85,.35],[-1,-.75],[0,-1]];
 case 16:return Array.from({length:48},(_,i)=>{const a=i*2*Math.PI/48,r=i%4<2?1:.78;return [r*Math.cos(a),r*Math.sin(a)];});
 case 17:return [[0,-1],[.45,-.45],[.45,.3],[.85,.75],[.25,.55],[.25,1],[-.25,1],[-.25,.55],[-.85,.75],[-.45,.3],[-.45,-.45]];
 case 18:return regular(16,.58);
 case 19:return [[1,-.35],[.5,-.18],[.32,-.7],[0,-.85],[-.32,-.7],[-.5,-.18],[-1,.35],[-.5,.18],[-.32,.7],[0,.85],[.32,.7],[.5,.18]];
 default:return regular(4);
 }
}
function contour(group){
 let vertices=outline(group); // Open the perimeter at its right-most point.
 let right=0;vertices.forEach((p,i)=>{if(p[0]>vertices[right][0])right=i;});vertices=[...vertices.slice(right),...vertices.slice(0,right)];
 const lengths=[0];for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];lengths.push(lengths.at(-1)+Math.hypot(b[0]-a[0],b[1]-a[1]));}
 return {vertices,lengths,total:lengths.at(-1)};
}
export function laneAt(s,start,y){let lane=start;for(const b of s.bridges){if(b.y>=y)break;if(b.lane===lane)lane++;else if(b.lane+1===lane)lane--;}return lane;}
export function makeStage(level){
 if(!Number.isInteger(level)||level<1||level>100)throw new RangeError('Stage must be 1–100');
 const group=Math.floor((level-1)/5),step=(level-1)%5,rand=random(level*23887+4004),detailed=![0,1,6,7,10].includes(group),n=level<=5?2:(!detailed&&step>=3?4:3);
 const xs=Array.from({length:n},(_,i)=>150+i*300/(n-1)),s={level,group,n,xs,rotation:0,four:false,layout:SHAPES[group],contour:contour(group),starts:xs.map(x=>[x,90]),ends:xs.map(x=>[x,510]),checkpoints:[],required:[],hazards:[],hammers:[],rocks:[]};
 // Both kinds of port are spread around the four edges, with reserved corner space.
 const ports=Array.from({length:n*2},(_,i)=>{const side=i%4,rank=Math.floor(i/4),count=Math.ceil((n*2-side)/4),v=100+(rank+1)*600/(count+1);return side===0?[v,44]:side===1?[756,v]:side===2?[800-v,756]:[44,800-v];});
 s.startPorts=ports.slice(0,n);s.endPorts=ports.slice(n);
 // Shared opening phase keeps bridges short; edge ports remain distributed.
 s.corePhases=Array.from({length:n},()=>-.25+(step%4)*.25);
 const shuffle=list=>{for(let i=list.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;};
 const rows=[150,190,230,270,310,350,390,430,470],count=Math.max(2,Math.min([0,7,10].includes(group)?5:4,n-1+step%3)),lanes=shuffle(Array.from({length:n-1},(_,i)=>i));
 s.bridges=Array.from({length:count},(_,i)=>({lane:i<lanes.length?lanes[i]:Math.floor(rand()*(n-1)),y:rows[Math.round(i*8/(count-1))],type:group===0?0:Math.floor(rand()*4)}));
 const winner=Math.floor(rand()*n),all=Array.from({length:n},(_,i)=>i);s.target=laneAt(s,winner,511);s.goals=[s.target];
 if(level>=21){
 const others=shuffle(all.filter(i=>i!==winner)),decoy=others[0],other=others[1];
 const marker=(start,y,id,label)=>({id,label,start,lane:laneAt(s,start,y),y});
 // No more than four symbols on any board. Each clue leaves two candidates.
 if(level<=35){
 s.required=['A'];s.checkpoints=[winner,decoy].map(i=>marker(i,210,`A-${i}`,'A'));s.goals=[winner,other].map(i=>laneAt(s,i,511));
 }else if(level<=45){
 s.required=['A'];s.checkpoints=[winner,decoy].map(i=>marker(i,210,`A-${i}`,'A'));s.hazards=[marker(decoy,370,'X-0','!')];s.goals=all.map(i=>laneAt(s,i,511));
 }else if(level<=60){
 s.required=['A','B'];s.checkpoints=[...([winner,decoy].map(i=>marker(i,210,`A-${i}`,'A'))),...([winner,other].map(i=>marker(i,410,`B-${i}`,'B')))];s.goals=all.map(i=>laneAt(s,i,511));
 }else if(level<=90){
 s.hammers=[winner,decoy].map(i=>marker(i,130,`H-${i}`,'🔨'));s.rocks=[marker(winner,330,'R-0','岩'),marker(other,410,'R-1','岩')];s.goals=[winner,other].map(i=>laneAt(s,i,511));
 }else{
 s.hammers=[winner,decoy].map(i=>marker(i,130,`H-${i}`,'🔨'));s.rocks=[marker(winner,330,'R-0','岩')];s.hazards=[marker(decoy,410,'X-0','!')];s.goals=[winner,decoy].map(i=>laneAt(s,i,511));
 }
 }

 // Stagger nearby symbols in the bridge-free interval to keep sparse boards legible.
 const placed=[];
 for(const m of [...s.hammers,...s.checkpoints,...s.hazards,...s.rocks]){
 const base=130+Math.round((m.y-130)/40)*40;let best=null;
 for(const offset of [0,-12,12,-6,6]){const y=base+offset,lane=laneAt(s,m.start,y),p=warp(s,[s.xs[lane],y]);const distance=placed.length?Math.min(...placed.map(q=>Math.hypot(q[0]-p[0],q[1]-p[1]))):1000;const score=Math.min(distance,38)-Math.abs(offset)*.01;if(!best||score>best.score)best={y,lane,p,score};}
 m.y=best.y;m.lane=best.lane;placed.push(best.p);
 }
 return s;
}
export function connector(s,b){const a=s.xs[b.lane],w=s.xs[b.lane+1]-a,p=[];for(let i=0;i<=60;i++){const t=i/60;let x=a+w*t,dy=0;if(b.type===1)dy=Math.sin(t*Math.PI*2)*5;if(b.type===2)dy=2/Math.PI*Math.asin(Math.sin(t*Math.PI*2))*6;if(b.type===3)dy=Math.sin(t*Math.PI)*8;p.push([x,b.y+dy]);}return p;}
export function railIn(s,i){return [s.starts[i]];}
export function railOut(s,i){return [s.ends[i]];}
export function warp(s,p){
 const lane=(p[0]-150)/300,t=(p[1]-90)/420;
 if(s.group===0)return [100+500*lane,70+660*t];
 const mix=(a,b,f)=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
 const index=Math.max(0,Math.min(s.n-2,Math.floor(lane*(s.n-1)))),fraction=lane*(s.n-1)-index;
 const start=mix(s.startPorts[index],s.startPorts[index+1],fraction),end=mix(s.endPorts[index],s.endPorts[index+1],fraction);
 if(t<=0)return start;
 if(t>=1)return end;
 const pointAt=u=>{
 if(s.group===10){
 // Parallel zigzags, not scaled copies of a thin concave lightning outline.
 const k=Math.min(3,Math.floor(u*4)),f=u*4-k,offsets=[45,-45,45,-45,45],offset=offsets[k]+(offsets[k+1]-offsets[k])*f;
 return [130+500*lane+offset,140+520*u];
 }
 if(s.group===7)return [130+500*lane+40*Math.sin(u*Math.PI*4),140+520*u];
 const phase=s.corePhases[index]+(s.corePhases[index+1]-s.corePhases[index])*fraction;
 const {vertices,lengths,total}=s.contour,at=(((phase+.84*u)%1+1)%1)*total;
 let i=0;while(i<vertices.length-1&&lengths[i+1]<at)i++;
 const f=(at-lengths[i])/(lengths[i+1]-lengths[i]),a=vertices[i],b=vertices[(i+1)%vertices.length],scale=110+190*lane;
 return [400+scale*(a[0]+(b[0]-a[0])*f),400+scale*(a[1]+(b[1]-a[1])*f)];
 };
 if(t<.06)return mix(start,pointAt(0),t/.06);
 if(t>.94)return mix(pointAt(1),end,(t-.94)/.06);
 return pointAt((t-.06)/.88);
}
export function displayPoints(s,points){const out=[];for(let i=0;i<points.length;i++){if(i===0){out.push(warp(s,points[i]));continue;}const a=points[i-1],b=points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.65));for(let j=1;j<=steps;j++)out.push(warp(s,[a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]));}return out;}
export function trace(s,start){
 let lane=start,hasHammer=false,blocked=false;const points=[...railIn(s,lane)],hits=[],dangerHits=[],events=[];
 const kinds=[['bridge',s.bridges],['checkpoint',s.checkpoints],['hazard',s.hazards],['hammer',s.hammers],['rock',s.rocks]];
 const actions=kinds.flatMap(([kind,list])=>list.map(b=>({...b,kind}))).sort((a,b)=>a.y-b.y);
 for(const b of actions){
 if(b.kind==='bridge'){if(b.lane===lane||b.lane+1===lane){points.push([s.xs[lane],b.y]);const c=connector(s,b);points.push(...(lane===b.lane?c:c.slice().reverse()));lane=lane===b.lane?lane+1:lane-1;}continue;}
 if(b.lane!==lane)continue;points.push([s.xs[lane],b.y]);let outcome='passed';
 if(b.kind==='checkpoint')hits.push(b.label);
 if(b.kind==='hazard')dangerHits.push(b.id);
 if(b.kind==='hammer'){hasHammer=true;outcome='collected';}
 if(b.kind==='rock'){outcome=hasHammer?'broken':'blocked';blocked=!hasHammer;}
 events.push({id:b.id,label:b.label,kind:b.kind,outcome,hasHammer,pointIndex:points.length-1});if(blocked)break;
 }
 if(!blocked)points.push(...railOut(s,lane));const won=!blocked&&s.goals.includes(lane)&&s.required.every((label,i)=>hits[i]===label)&&dangerHits.length===0;
 return {end:blocked?null:lane,points,hits,dangerHits,events,won,blocked,hasHammer};
}
export function path(points){return points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(' ')).join(' ');}
export function rotate(p,degrees){const a=degrees*Math.PI/180,x=p[0]-300,y=p[1]-300;return [300+x*Math.cos(a)-y*Math.sin(a),300+x*Math.sin(a)+y*Math.cos(a)];}
