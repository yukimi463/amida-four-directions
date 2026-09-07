const valid=list=>[...new Set((Array.isArray(list)?list:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=100))];
export function normalizeProgress(data){
 const old=data&&data.version!==2,legacyCleared=valid(old?data.cleared:data?.legacyCleared);
 const oldUnlocks=old?Array.from({length:100},(_,i)=>i+1).filter(n=>n<=Math.min(50,data.unlocked||1)||(n>=51&&n<=Math.min(80,data.bonusUnlocked||51))):[];
 const saved={version:2,cleared:old?[]:valid(data?.cleared),legacyCleared,unlocked:valid(old?oldUnlocks:data?.unlocked),current:1};
 const n=data?.current;saved.current=Number.isInteger(n)&&isUnlocked(saved,n)?n:1;return saved;
}
export function isUnlocked(saved,n){return Number.isInteger(n)&&n>=1&&n<=100&&((n-1)%5===0||saved.unlocked.includes(n)||saved.cleared.includes(n)||(n>1&&saved.cleared.includes(n-1)));}
export function recordWin(saved,n){if(n<1||n>100)return;if(!saved.cleared.includes(n))saved.cleared.push(n);if(n<100&&!saved.unlocked.includes(n+1))saved.unlocked.push(n+1);}
