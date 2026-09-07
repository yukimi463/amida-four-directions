import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
class Element {constructor(){this.value='25';this.events={};}addEventListener(k,fn){this.events[k]=fn;}setAttribute(k,v){this[k]=v;}fire(k){return this.events[k]?.();}}
const elements=Object.fromEntries(['bgmToggle','bgmVolume','bgmStatus'].map(k=>[k,new Element()]));let player;class Media extends Element{constructor(){super();player=this;this.paused=true;}async play(){this.paused=false;}pause(){this.paused=true;}}
const document=new Element();document.getElementById=id=>elements[id];const window=new Element(),storage=new Map();
const source=fs.readFileSync(new URL('../dist/music.mjs',import.meta.url),'utf8').replace('import.meta.url',JSON.stringify('https://example.com/music.mjs'));
vm.runInNewContext(source,{Audio:Media,URL,document,window,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
assert(player.paused,'No automatic sound');assert(player.loop);assert.equal(player.volume,.25);
elements.bgmToggle.fire('click');await Promise.resolve();assert(!player.paused);assert.equal(elements.bgmToggle['aria-pressed'],'true');
elements.bgmVolume.value='40';elements.bgmVolume.fire('input');assert.equal(player.volume,.4);assert.equal(storage.get('amida-bgm-volume'),'40');
document.hidden=true;document.fire('visibilitychange');assert(player.paused);document.hidden=false;document.fire('visibilitychange');await Promise.resolve();assert(!player.paused);
elements.bgmToggle.fire('click');assert(player.paused);assert.equal(elements.bgmToggle['aria-pressed'],'false');
player.fire('error');assert.equal(elements.bgmToggle['aria-pressed'],'false');assert(elements.bgmStatus.textContent.includes('読み込めません'));
console.log('PASS: explicit BGM start/stop, looping, volume persistence, background pause/resume and loading error UI.');
