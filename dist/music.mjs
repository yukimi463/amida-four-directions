// HTML media playback starts only from an explicit button gesture.
const button=document.getElementById('bgmToggle'),volume=document.getElementById('bgmVolume'),status=document.getElementById('bgmStatus');
const player=new Audio(new URL('./audio/starlit-path.mp3',import.meta.url).href);player.preload='none';player.loop=true;
let desired=false,requestId=0;
try{const v=Number(localStorage.getItem('amida-bgm-volume'));if(localStorage.getItem('amida-bgm-volume')!==null&&Number.isFinite(v))volume.value=String(Math.max(0,Math.min(100,v)));}catch{}
player.volume=Number(volume.value)/100;
function display(){button.textContent=desired?'♫ BGMを停止':'♫ BGMを再生';button.setAttribute('aria-pressed',String(desired));}
async function play(){const id=++requestId;status.textContent='BGMを準備中…';try{await player.play();if(id!==requestId||!desired){if(!desired)player.pause();return;}status.textContent='再生中 · 星めぐりの小径';}catch{if(id!==requestId)return;desired=false;display();status.textContent='再生できませんでした。もう一度お試しください。';}}
button.addEventListener('click',()=>{desired=!desired;display();if(desired)void play();else{requestId++;player.pause();status.textContent='停止中 · 星めぐりの小径';}});
volume.addEventListener('input',()=>{player.volume=Number(volume.value)/100;try{localStorage.setItem('amida-bgm-volume',volume.value);}catch{}});
player.addEventListener('error',()=>{desired=false;requestId++;display();status.textContent='BGMを読み込めませんでした。接続を確認してください。';});
document.addEventListener('visibilitychange',()=>{if(document.hidden){requestId++;player.pause();if(desired)status.textContent='BGMを一時停止中';}else if(desired)void play();});
window.addEventListener('pagehide',()=>{requestId++;player.pause();});
