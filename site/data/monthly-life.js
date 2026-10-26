/* ZhiShi Monthly Life · v2.0
 * Depends on the existing non-module desktop app: nowShanghai, selectedISO,
 * displayMonth/displayYear, EVENT_DATA, openEvents, memos, renderAll, showToast.
 * All personal entries stay in the current browser. No photos in this module.
 */
(function(){
'use strict';
const host=document.getElementById('lifeHub');
if(!host)return;
const STORE='zhishi-monthly-life-v1';
const legacySvgFlower='<svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M22 19C12 12 12 7 22 5c10 2 10 7 0 14ZM25 22c7-10 12-10 14 0-2 10-7 10-14 0ZM22 25c10 7 10 12 0 14-10-2-10-7 0-14ZM19 22C12 32 7 32 5 22c2-10 7-10 14 0Z" fill="currentColor" opacity=".67"/><circle cx="22" cy="22" r="4" fill="#fff9ee"/></svg>';
const legacySvgLetter='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="m3.5 7 8.5 6.4L20.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// Month-specific Shanghai seasonal references, NOT live bloom conditions.
const seasonal={
1:[['蜡梅','冬季香花 · 寻找第一缕幽香','上海植物园、共青森林公园'],['早梅','依当年气温观察花苞','上海植物园、世纪公园']],
2:[['梅花','留意初春开放节奏','世纪公园、上海植物园'],['早春玉兰','部分早花品种或开始萌动','上海植物园、街区绿地']],
3:[['白玉兰','上海常见的早春花景','上海植物园、人民广场周边'],['樱花','实际盛放需查看实时花况','顾村公园、辰山植物园']],
4:[['海棠','春风里的柔和花色','人民公园、上海植物园'],['紫藤','通常在春季进入观赏窗口','嘉定紫藤园、上海植物园']],
5:[['月季','花色层次丰富的初夏花境','辰山植物园、上海植物园'],['绣球','留意初夏各品种花期','上海植物园、各区公园']],
6:[['荷花','初夏水面开始有绿意','古猗园、世纪公园'],['栀子','湿润季节的白色香花','居民街区、城市绿地']],
7:[['荷花','水面赏花 · 注意防晒','古猗园、辰山植物园'],['睡莲','清晨与日间观花体验','辰山植物园、上海植物园']],
8:[['睡莲','晚夏水景与花朵','辰山植物园、上海植物园'],['荷花','可能进入花期后段','古猗园、世纪公园']],
9:[['桂花','先观察花苞与气味变化','上海植物园、街区公园'],['粉黛乱子草','秋季观赏草参考期','部分市郊花园、湿地花境']],
10:[['桂花','留意金桂、银桂和丹桂的香气','上海植物园、街区绿地'],['秋菊','秋季花坛与菊花展参考期','共青森林公园、上海植物园']],
11:[['秋菊','部分菊花品种仍可观赏','共青森林公园、上海植物园'],['茶梅','深秋至初冬的花木','上海植物园、城市公园']],
12:[['茶梅','冬季花木观察','上海植物园、城市公园'],['蜡梅','观察花苞，为来年作准备','共青森林公园、上海植物园']]
};
const emptyData=()=>({anniversaries:[],wishlist:[],letters:[]});
const ART='/data/life-art/';

function txt(s,max=300){return String(s??'').trim().slice(0,max)}
function safeId(s){return /^[a-z0-9:_-]{1,80}$/i.test(String(s))?String(s):''}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const [y,m,d]=s.split('-').map(Number),a=new Date(Date.UTC(y,m-1,d));return a.getUTCFullYear()===y&&a.getUTCMonth()===m-1&&a.getUTCDate()===d}
function validStamp(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(s)&&Number.isFinite(Date.parse(s))}
function cleanReplies(value,letterDate){
 if(!Array.isArray(value))return [];
 // Unlimited reply entries per letter; trim text safely and preserve legacy letters without replies.
 const fallback=validDate(letterDate)?letterDate+'T00:00:00.000Z':new Date().toISOString();
 return value.filter(r=>r&&typeof r==='object'&&txt(r.body,3000)).map(r=>({
  id:safeId(r.id)||uid(),body:txt(r.body,3000),
  createdAt:validStamp(r.createdAt)?new Date(r.createdAt).toISOString():fallback,
  updatedAt:validStamp(r.updatedAt)?new Date(r.updatedAt).toISOString():null
 }));
}
function clean(input){
 const i=input&&typeof input==='object'?input:{};
 const anniversaries=(Array.isArray(i.anniversaries)?i.anniversaries:[]).slice(0,100).filter(e=>e&&validDate(e.date)&&txt(e.name,70)).map(e=>({id:safeId(e.id)||uid(),name:txt(e.name,70),date:e.date,annual:Boolean(e.annual),mode:['countdown','countup','anniversary'].includes(e.mode)?e.mode:'countdown'}));
 const wishlist=(Array.isArray(i.wishlist)?i.wishlist:[]).slice(0,150).filter(e=>e&&safeId(e.id)&&txt(e.title)).map(e=>({id:e.id,title:txt(e.title,100),kind:txt(e.kind,30),location:txt(e.location,80),start:validDate(e.start)?e.start:'',end:validDate(e.end)?e.end:'',source:/^https:\/\//.test(e.source||'')?String(e.source).slice(0,500):''}));
 const letters=(Array.isArray(i.letters)?i.letters:[]).slice(0,80).filter(e=>e&&validDate(e.openDate)&&txt(e.body,6000)).map(e=>({id:safeId(e.id)||uid(),title:txt(e.title,80)||'给未来的自己',body:txt(e.body,6000),created:validDate(e.created)?e.created:today(),openDate:e.openDate,replies:cleanReplies(e.replies,e.openDate)}));
 return {anniversaries,wishlist,letters};
}
function uid(){return 'li'+Date.now().toString(36)+Math.random().toString(36).slice(2,9)}
function today(){return typeof nowShanghai==='function'?nowShanghai():new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function dateUTC(d){return Date.parse(d+'T00:00:00Z')}
function diffDays(a,b){return Math.round((dateUTC(a)-dateUTC(b))/86400000)}
function tomorrow(d){const t=new Date(dateUTC(d)+86400000);return t.toISOString().slice(0,10)}
function short(d){return d?d.slice(5).replace('-','.'):'日期待定'}
function upcomingDate(item,now){
 if(!item.annual)return item.date;
 const month=item.date.slice(5,7),day=item.date.slice(8,10);
 const make=y=>{
  const realDay=month==='02'&&day==='29'&&!validDate(y+'-02-29')?'28':day;
  return y+'-'+month+'-'+realDay;
 };
 const year=Number(now.slice(0,4));const a=make(year);return a>=now?a:make(year+1);
}
let data=emptyData();
try{data=clean(JSON.parse(localStorage.getItem(STORE)||'{}'))}catch(e){}
function save(){try{localStorage.setItem(STORE,JSON.stringify(data));return true}catch(e){toast('保存失败：请检查浏览器的存储空间');return false}}
function toast(message){if(typeof showToast==='function')showToast(message);else console.log(message)}
const iconButton=(label,action)=>{const b=document.createElement('button');b.type='button';b.className='life-mini-button';b.textContent=label;b.addEventListener('click',action);return b};
const create=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e};
const el=id=>document.getElementById(id);
function initMarkup(){
 host.innerHTML=`<article class="life-card life-card--flowers" aria-labelledby="lifeFlowerTitle">
  <div class="life-card-art life-card-art--flowers" aria-hidden="true"></div>
  <div class="life-card-head"><div><div class="life-kicker">SEASONAL FLOWERS · SHANGHAI</div><h3 class="life-card-title" id="lifeFlowerTitle">上海此时花开 <span class="life-seal" aria-hidden="true">知<br>时</span></h3><div class="life-card-sub" id="lifeFlowersMonth"></div></div></div>
  <p class="life-season-poem" id="lifeSeasonPoem"></p>
  <div class="life-list" id="lifeFlowerList"></div>
  <p class="life-footnote">✳ 参考往年花期，并非实时花况；开放与园区展期请以官方消息为准。</p>
 </article>
 <article class="life-card life-card--days" aria-labelledby="lifeDaysTitle">
  <div class="life-card-head"><div><div class="life-kicker">IMPORTANT DAYS</div><h3 class="life-card-title" id="lifeDaysTitle">重要纪念日 <span class="life-seal" aria-hidden="true">留<br>念</span></h3><div class="life-card-sub">有些日子，值得慢慢数着过</div></div><button type="button" class="life-mini-button" id="lifeAddDay">＋ 添加纪念日</button></div>
  <div class="life-list life-list--days" id="lifeDayList"></div>
 </article>
 <article class="life-card life-card--wishes" aria-labelledby="lifeWishTitle">
  <div class="life-city-art" aria-hidden="true"></div>
  <div class="life-card-head"><div><div class="life-kicker">MY CITY WISHLIST</div><h3 class="life-card-title" id="lifeWishTitle">想去的上海活动 <span class="life-seal" aria-hidden="true">心<br>动</span></h3><div class="life-card-sub">把心动的展览与演出，收藏成小小的票根</div></div><button type="button" class="life-mini-button" id="lifeBrowseEvents">逛活动 ↗</button></div>
  <div class="life-list life-list--tickets" id="lifeWishList"></div>
 </article>
 <article class="life-card life-card--letter" aria-labelledby="lifeLetterTitle">
  <div class="life-card-head"><div><div class="life-kicker">DEAR FUTURE ME</div><h3 class="life-card-title" id="lifeLetterTitle">写给未来自己的信 <span class="life-seal" aria-hidden="true">见<br>字</span></h3><div class="life-card-sub">今日的心事，留到某一天慢慢打开</div></div><button type="button" class="life-mini-button" id="lifeWriteLetter">＋ 写一封</button></div>
  <div class="life-letter-stage"><div class="life-envelope-art" aria-hidden="true"></div><div class="life-list life-list--letters" id="lifeLetterList"></div></div>
  <p class="life-footnote">✳ 信保存在本机，未加密或云同步；到期可阅读，不会自动发送通知。</p>
 </article>
 <div class="life-tools"><span>知时 · 月度生活手账　|　仅保存在当前浏览器</span><span class="life-tools-group"><button type="button" id="lifeExport">↓ 备份</button><button type="button" id="lifeImport">↑ 恢复</button><input type="file" id="lifeImportFile" accept=".json,application/json" hidden></span></div>`;
 const dlg=document.createElement('dialog');dlg.id='lifeDialog';dlg.className='life-form-dialog';dlg.setAttribute('aria-label','生活手账编辑');document.body.append(dlg);
 el('lifeAddDay').addEventListener('click',()=>editDay());el('lifeBrowseEvents').addEventListener('click',()=>{if(typeof openEvents==='function')openEvents();else el('moreEvents')?.click()});
 el('lifeWriteLetter').addEventListener('click',()=>writeLetter());
 el('lifeExport').addEventListener('click',exportBackup);el('lifeImport').addEventListener('click',()=>el('lifeImportFile').click());el('lifeImportFile').addEventListener('change',importBackup);
}
function empty(message,actionName,action){
 const box=create('div','life-empty',message);
 if(actionName){const b=create('button','life-text-button',actionName);b.type='button';b.style.marginLeft='6px';b.addEventListener('click',action);box.append(b)}
 return box;
}
const FLOWER_NOTE={1:'梅香未远，春意已在枝头酝酿。',2:'风里有花讯，春天正慢慢靠近。',3:'枝头一夜春风，城市也变得温柔。',4:'看满城花事，让春天多停留一会儿。',5:'在盛放的季节，遇见轻盈的夏天。',6:'夏木成荫，荷风将起。',7:'一池清荷，半日慢时光。',8:'夏日尾声，听见叶间的风。',9:'桂花将至，去寻找入秋的第一缕香。',10:'金风送桂香，秋色满申城。',11:'深秋如画，慢慢收藏最后的花色。',12:'岁暮花信，盼一朵早梅。'};
function flowerMonth(){
 const month=typeof displayMonth==='number'?displayMonth:Number(today().slice(5,7));
 const autumn=month>=9&&month<=11;
 host.querySelector('.life-card--flowers').classList.toggle('is-autumn',autumn);
 el('lifeFlowersMonth').textContent=month+'月 · 上海季节观察';
 el('lifeSeasonPoem').textContent=FLOWER_NOTE[month]||'在城市里，等候时令的花开。';
 const list=el('lifeFlowerList');list.replaceChildren();
 for(const [index,[name,desc,where]] of (seasonal[month]||seasonal[10]).entries()){
  const row=create('div','life-flower-row');
  const thumb=create('div','life-flower-picture');
  const artName=/(桂花|金桂|银桂)/.test(name)?'osmanthus-sprig.webp':/(秋菊|菊花|茶梅)/.test(name)?'chrysanthemum.webp':'';
  if(artName){const image=document.createElement('img');image.src=ART+artName;image.alt='';image.loading='lazy';thumb.append(image)}
  else{thumb.classList.add('life-flower-picture--generic');thumb.textContent='花\n信'}
  const body=create('div','life-flower-info');body.append(create('div','life-flower-name',name));
  body.append(create('div','life-flower-desc',desc));body.append(create('small','life-flower-location',where));
  const b=create('button','life-flower-action','＋ 提醒');b.type='button';b.title='将花期观察添加到当前选中日期的备忘';
  b.addEventListener('click',()=>{
   const day=typeof selectedISO==='string'?selectedISO:today();const title='观察上海'+name;
   if(memos.some(x=>x.date===day&&x.title===title)){toast('这条花讯已经加入此日期');return}
   memos.push({id:uid(),date:day,title,detail:where+' · 实际花况以当日为准',category:'fun',time:'',done:false});
   if(saveMemos()){renderAll();toast('已加入 '+short(day)+' 的日历')}else memos.pop();
  });
  row.append(thumb,body,b);list.append(row);
 }
}
const MODES={countdown:'倒计时',countup:'正计时',anniversary:'周年纪念'};
function annivYearDate(item,y){const mm=item.date.slice(5,7),dd=item.date.slice(8);return y+'-'+mm+'-'+(mm==='02'&&dd==='29'&&!validDate(y+'-02-29')?'28':dd)}
function daySummary(item,now){
 const mode=MODES[item.mode]?item.mode:'countdown',from=item.date;
 if(mode==='countup'){
  const age=diffDays(now,from);
  return {primary:age<0?'还有 '+Math.abs(age)+' 天':'已经 '+age+' 天',secondary:age<0?'开始日还未到':'从那一天起，一直记到现在',sort:age<0?Math.abs(age):9999+age,label:MODES[mode],dateCaption:short(from)+' · 起始日',mode};
 }
 if(mode==='anniversary'){
  if(from>now){const days=diffDays(from,now);return {primary:'还有 '+days+' 天',secondary:'距离第 1 次纪念',sort:days,label:MODES[mode],dateCaption:short(from)+' · 起始日',mode};}
  const y=Number(now.slice(0,4)),birthY=Number(from.slice(0,4));
  let years=y-birthY;
  if(annivYearDate(item,y)>now)years--;
  years=Math.max(0,years);
  const next=upcomingDate({date:from,annual:true},now),days=diffDays(next,now);
  const label=days===0?'今天是第 '+(years||1)+' 周年':'已满 '+years+' 周年';
  const sub=days===0?'今天值得庆祝！':'离第 '+(years+1)+' 周年还有 '+days+' 天';
  return {primary:label,secondary:sub,sort:days,label:MODES[mode],dateCaption:short(from)+' · 起始日',mode};
 }
 const target=item.annual?upcomingDate(item,now):from;
 const days=diffDays(target,now);
 return {primary:days>0?'还有 '+days+' 天':days===0?'就是今天':'已过 '+(-days)+' 天',secondary:days>=0?'期待那一天的到来':'这一天已经过去',sort:days<0?1e6-days:days,label:MODES[mode],dateCaption:short(from)+(item.annual?' · 每年重复':' · 单次'),mode};
}
function annivPicture(item){
 const text=(item.name||'').toLowerCase();
 const img=/生日|诞生|birthday|生辰/.test(text)?'cake-watercolor.webp':/宠物|小狗|狗狗|犬|猫咪|猫猫/.test(text)?'dog-watercolor.webp':/入职|工作|公司|毕业|职场/.test(text)?'briefcase-watercolor.webp':null;
 return img?ART+img:ART+'osmanthus-sprig.webp';
}
function daysView(){
 const list=el('lifeDayList');list.replaceChildren();const now=today();
 const items=data.anniversaries.map(item=>({item,view:daySummary(item,now)})).sort((a,b)=>a.view.sort-b.view.sort);
 if(!items.length){list.append(empty('记下一天，让值得纪念的日子从这里慢慢开始。','＋ 写下第一个纪念日',()=>editDay()));return}
 for(const {item,view} of items.slice(0,3)){
  const row=create('button','life-anniv-row life-anniv-row--'+view.mode);row.type='button';
  row.title='点击编辑这条纪念日';row.addEventListener('click',()=>editDay(item));
  const pic=create('span','life-anniv-art');const image=document.createElement('img');image.src=annivPicture(item);image.alt='';image.loading='lazy';pic.append(image);
  const body=create('span','life-anniv-detail');body.append(create('strong','life-row-title',item.name),create('small','life-row-caption',view.dateCaption));
  const counter=create('span','life-anniv-counter');const badge=create('span','life-mode-pill life-mode-pill--'+view.mode,view.label);
  counter.append(badge,create('b','life-anniv-number',view.primary),create('small','life-anniv-next',view.secondary));
  row.append(pic,body,counter,create('span','life-round-arrow','→'));list.append(row);
 }
 if(items.length>3){const b=iconButton('其余 '+(items.length-3)+' 个纪念日 · 查看全部 ↗',()=>showAllDays(items));b.classList.add('life-all-days');list.append(b)}
}
function hasWish(id){return data.wishlist.some(x=>x.id===id)}
function toggleWish(item){const i=data.wishlist.findIndex(x=>x.id===item.id);if(i>=0){data.wishlist.splice(i,1);if(save())toast('已从心愿单移除')}else{if(data.wishlist.length>=150){toast('心愿单最多可保留150项');return}data.wishlist.unshift(formatEvent(item));if(save())toast('已加入想去的上海活动')}wishView();decorateEventButtons()}
function wishView(){const list=el('lifeWishList');list.replaceChildren();
 if(!data.wishlist.length){list.append(empty('还没有收藏活动。看到喜欢的展览或演出，点 ♡ 加入想去清单。','逛逛上海活动',()=>el('lifeBrowseEvents')?.click()));return}
 const sorted=[...data.wishlist].sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999'));
 for(const [idx,item] of sorted.slice(0,3).entries()){
  const past=Boolean(item.end&&item.end<today());
  const row=create('article','life-ticket life-ticket--'+(idx%3));
  const pic=create('div','life-ticket-art');pic.style.backgroundImage=`url("${ART}shanghai-watercolor.webp")`;
  const body=create('div','life-ticket-body');body.append(create('small','life-ticket-kind',item.kind||'上海活动'));
  body.append(create('strong','life-row-title',item.title));
  body.append(create('span','life-ticket-meta',short(item.start)+' · '+item.location));
  if(past)body.append(create('span','life-status-tag past','日期已过 · 请核验后续场次'));
  const controls=create('div','life-ticket-actions');
  const heart=create('button','life-ticket-heart','♥');heart.type='button';heart.title='取消收藏';heart.setAttribute('aria-label','取消收藏 '+item.title);heart.addEventListener('click',()=>toggleWish(item));
  controls.append(heart);
  if(item.source){const link=create('a','life-ticket-link','官方 ↗');link.href=item.source;link.target='_blank';link.rel='noopener noreferrer';link.title='查看活动官方信息';controls.append(link)}
  row.append(pic,body,controls);list.append(row);
 }
 if(data.wishlist.length>3){const b=iconButton('还有 '+(data.wishlist.length-3)+' 张票根 · 查看全部 ↗',showAllWishes);b.classList.add('life-all-wishes');list.append(b)}
}
function decorateEventButtons(){
 const events=typeof EVENT_DATA!=='undefined'&&Array.isArray(EVENT_DATA)?EVENT_DATA:[];
 if(!events.length)return;
 const byName=new Map(events.map(e=>[e.title,e]));
 for(const selector of ['#allEvents .full-event','#rightEvents .activity-mini']){
  document.querySelectorAll(selector).forEach(row=>{
   const title=selector.includes('full-event')?row.querySelector('h4')?.textContent:row.querySelector('.activity-body strong')?.textContent;
   const item=byName.get(title||'');if(!item)return;
   let btn=row.querySelector('.life-wish-add');
   if(!btn){btn=document.createElement('button');btn.type='button';btn.className='life-wish-add';btn.dataset.eventId=item.id;btn.addEventListener('click',()=>toggleWish(item));
    const target=selector.includes('full-event')?row.querySelector('.event-actions'):row;
    target?.append(btn);
   }
   btn.textContent=hasWish(item.id)?'♥ 已收藏':'♡ 想去';btn.classList.toggle('is-saved',hasWish(item.id));btn.setAttribute('aria-pressed',String(hasWish(item.id)));
  });
 }
}
function letterView(){const list=el('lifeLetterList');list.replaceChildren();const now=today();
 if(!data.letters.length){list.append(empty('把此刻的心情写成一封信，留给未来的自己。','写一封信',()=>writeLetter()));return}
 const sorted=[...data.letters].sort((a,b)=>a.openDate.localeCompare(b.openDate));
 for(const letter of sorted.slice(0,2)){
  const unlocked=now>=letter.openDate;
  const row=create('article','life-letter-stationery'),info=create('div','life-letter-info');
  info.append(create('strong','',letter.title||'给未来的我'));
  const replyCount=Array.isArray(letter.replies)?letter.replies.length:0;
  const desc=unlocked?'已经可以打开 · '+short(letter.openDate)+(replyCount?' · '+replyCount+' 封回信':''):short(letter.openDate)+' 才能打开 · 还有 '+diffDays(letter.openDate,now)+' 天';
  info.append(create('small','',desc));
  const btn=create('button','life-letter-open '+(unlocked?'is-open':'is-sealed'),unlocked?'打开 ↗':'已封存');btn.type='button';btn.disabled=!unlocked;
  btn.addEventListener('click',()=>readLetter(letter.id));row.append(info,btn);list.append(row);
 }
 if(sorted.length>2){const b=iconButton('其余 '+(sorted.length-2)+' 封信 · 查看全部 ↗',()=>showAllLetters(sorted));list.append(b)}
}
function render(){flowerMonth();daysView();wishView();letterView()}
function openDialog(body){const dlg=el('lifeDialog');if(dlg.open)dlg.close();dlg.replaceChildren(body);dlg.showModal();return dlg}
function frame(title,subtitle){const root=create('div','life-form-frame');const close=create('button','life-dialog-close','×');close.type='button';close.title='关闭';close.addEventListener('click',()=>el('lifeDialog').close());root.append(close,create('h3','',title),create('p','',subtitle));return root}
function addField(root,label,type,required=false){const wrap=create('div','');const id=uid();const l=create('label','',label);l.htmlFor=id;const input=create('input','');input.type=type;input.id=id;input.required=required;wrap.append(l,input);root.append(wrap);return input}
function footer(root,primary,go,deleteFn){const bar=create('div','life-dialog-actions');if(deleteFn){const del=create('button','','删除');del.type='button';del.style.marginRight='auto';del.addEventListener('click',deleteFn);bar.append(del)}const cancel=create('button','','取消');cancel.type='button';cancel.addEventListener('click',()=>el('lifeDialog').close());const save=create('button','life-primary',primary);save.type='button';save.addEventListener('click',go);bar.append(cancel,save);root.append(bar)}
function editDay(existing){
 const item=existing?.id?data.anniversaries.find(x=>x.id===existing.id):null;
 const root=frame(item?'编辑纪念日':'添加纪念日','选择计时方式，让过去与未来都有自己的位置。');
 const name=addField(root,'这个日子叫什么？','text',true),date=addField(root,'哪一天？','date',true);
 name.maxLength=70;name.placeholder='例如：我的生日、遇见你的那天';name.value=item?.name||'';date.value=item?.date||today();
 const modes=create('fieldset','life-mode-selector');const legend=create('legend','','计时方式');modes.append(legend);
 const selected=item?.mode||'countdown',radios=[];
 for(const [value,label,hint] of [['countdown','倒计时','距离未来日期还有多久'],['countup','正计时','从过去某天算到现在'],['anniversary','周年纪念','已过周年＋下次纪念日']]){
  const opt=create('label','life-mode-option');const r=document.createElement('input');r.type='radio';r.name='lifeDayMode';r.value=value;r.checked=selected===value;
  const main=create('span','');main.append(create('b','',label),create('small','',hint));opt.append(r,main);modes.append(opt);radios.push(r);
 }
 root.append(modes);
 const repeatLabel=create('label','life-checkbox-label');const repeat=document.createElement('input');repeat.type='checkbox';repeat.checked=item?.annual??true;
 repeatLabel.append(repeat,document.createTextNode('每年重复（如生日）'));root.append(repeatLabel);
 const updateVisibility=()=>{const active=radios.find(x=>x.checked)?.value||'countdown';repeatLabel.hidden=active!=='countdown';};
 radios.forEach(x=>x.addEventListener('change',updateVisibility));updateVisibility();
 root.append(create('p','life-note','2月29日的年度纪念在非闰年按2月28日显示；倒计时与周年纪念会显示明确的计时方向。'));
 footer(root,item?'保存修改':'添加纪念日',()=>{
  if(!name.value.trim()||!validDate(date.value)){toast('请填写名称和有效日期');return}
  const mode=radios.find(x=>x.checked)?.value||'countdown';
  const obj={id:item?.id||uid(),name:txt(name.value,70),date:date.value,mode,annual:mode==='anniversary'?true:mode==='countup'?false:repeat.checked};
  if(item){const i=data.anniversaries.findIndex(x=>x.id===item.id);if(i>=0)data.anniversaries[i]=obj}else data.anniversaries.push(obj);
  if(save()){el('lifeDialog').close();daysView();toast('纪念日已保存')}
 },item?()=>{if(confirm('确定删除这个纪念日吗？')){data.anniversaries=data.anniversaries.filter(x=>x.id!==item.id);save();el('lifeDialog').close();daysView()}}:null);
 openDialog(root);
}
function writeLetter(){const root=frame('写给未来的自己','想象那一天的自己，给未来留一封真正的信。');const title=addField(root,'给这封信起个名字','text',true);title.maxLength=80;title.value='给未来的我';const date=addField(root,'约定开启日期','date',true);date.min=tomorrow(today());date.value=tomorrow(today());
 const label=create('label','','想说的话');const body=create('textarea','');body.maxLength=6000;body.placeholder='今天的心情、一个愿望，或是你想在未来记起的瞬间……';body.rows=8;root.append(label,body);
 root.append(create('p','life-note','保存后，在开启日期之前网页不会展示正文。但本机存储不加密，无法替代私密保险箱。'));
 footer(root,'封好这封信',()=>{
  if(!validDate(date.value)||date.value<=today()){toast('请选择明天或以后的日期');return}
  if(!body.value.trim()){toast('写一点话再寄给未来的自己吧');return}
  data.letters.push({id:uid(),title:txt(title.value,80)||'给未来的自己',body:txt(body.value,6000),openDate:date.value,created:today(),replies:[]});
  if(save()){el('lifeDialog').close();letterView();toast('信已经封存，到了约定的日子再见 ♡')}
 });openDialog(root)
}
function replyTime(value){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return '时间待核实';
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
 const part=k=>parts.find(p=>p.type===k)?.value||'';
 return part('year')+'.'+part('month')+'.'+part('day')+'  '+part('hour')+':'+part('minute');
}
function readLetter(id){
 const letter=data.letters.find(x=>x.id===id);
 if(!letter||today()<letter.openDate){toast('还没有到开启日期');return}
 const root=frame(letter.title,'写于 '+letter.created+' · 约定 '+letter.openDate+' 开启');
 root.classList.add('life-letter-reading');
 root.append(create('div','life-letter-caption','那时的我'),create('div','life-letter-paper',letter.body));
 const section=create('section','life-reply-section');
 section.setAttribute('aria-label','来自未来的回信');
 const title=create('div','life-reply-heading');
 title.append(create('h4','', '来自未来的回信'));
 const count=create('span','life-reply-count');
 title.append(count);
 const history=create('div','life-reply-history');
 const compose=create('div','life-reply-compose');
 compose.id='lifeReplyCompose';
 compose.hidden=true;
 const prompt=create('label','','写给当时的自己');
 const textarea=create('textarea','life-reply-input');
 textarea.maxLength=3000;textarea.rows=5;
 textarea.placeholder='今天的你想对那时的自己说些什么？';
 const inputId=uid();textarea.id=inputId;prompt.htmlFor=inputId;
 const note=create('p','life-reply-hint','每次回复都会独立保存，并保留写下的时间。');
 const actions=create('div','life-reply-compose-actions');
 const cancel=create('button','life-reply-cancel','取消');cancel.type='button';
 const submit=create('button','life-reply-submit','保存回信');submit.type='button';
 actions.append(cancel,submit);compose.append(prompt,textarea,note,actions);
 const start=create('button','life-reply-start','＋ 写一封回信');start.type='button';
 start.setAttribute('aria-controls',compose.id);
 start.setAttribute('aria-expanded','false');
 let editingId=null;
 function closeCompose(){
  compose.hidden=true;textarea.value='';editingId=null;start.hidden=false;
  start.setAttribute('aria-expanded','false');submit.textContent='保存回信';
 }
 function openCompose(existing){
  editingId=existing?existing.id:null;
  textarea.value=existing?existing.body:'';
  compose.hidden=false;start.hidden=true;start.setAttribute('aria-expanded','true');
  submit.textContent=existing?'保存修改':'保存回信';
  textarea.focus();
 }
 function drawHistory(){
  history.replaceChildren();
  const entries=Array.isArray(letter.replies)?letter.replies:[];
  count.textContent=entries.length+' 封';
  if(!entries.length){
   history.append(create('p','life-reply-empty','还没有回信。某一天，你可以从这里与过去的自己重新聊聊。'));
   return;
  }
  const sorted=[...entries].sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  sorted.forEach((reply,index)=>{
   const card=create('article','life-reply-item');
   const head=create('div','life-reply-item-head');
   const stamp=create('span','life-reply-date',replyTime(reply.createdAt)+' · 第 '+(index+1)+' 封回信');
   if(reply.updatedAt){stamp.textContent+=' · 已编辑';stamp.title='最近编辑于 '+replyTime(reply.updatedAt);}
   const tools=create('div','life-reply-tools');
   const edit=create('button','','编辑');edit.type='button';
   edit.setAttribute('aria-label','编辑 '+replyTime(reply.createdAt)+' 的回信');
   edit.addEventListener('click',()=>openCompose(reply));
   const remove=create('button','','删除');remove.type='button';
   remove.setAttribute('aria-label','删除 '+replyTime(reply.createdAt)+' 的回信');
   remove.addEventListener('click',()=>{
    if(!confirm('确定删除这封回信吗？删除后无法找回，原始信件不会受到影响。'))return;
    const original=letter.replies;
    letter.replies=letter.replies.filter(r=>r.id!==reply.id);
    if(!save()){letter.replies=original;return;}
    if(editingId===reply.id)closeCompose();
    drawHistory();letterView();toast('回信已删除');
   });
   tools.append(edit,remove);head.append(stamp,tools);
   card.append(head,create('p','life-reply-body',reply.body));history.append(card);
  });
 }
 start.addEventListener('click',()=>openCompose(null));
 cancel.addEventListener('click',closeCompose);
 submit.addEventListener('click',()=>{
  const body=txt(textarea.value,3000);
  if(!body){toast('写下一些想说的话，再保存这封回信吧');textarea.focus();return;}
  const now=new Date().toISOString();
  if(editingId){
   const reply=letter.replies.find(r=>r.id===editingId);
   if(!reply){toast('回信不存在，无法编辑');closeCompose();return;}
   const previous={...reply};
   reply.body=body;reply.updatedAt=now;
   if(!save()){Object.assign(reply,previous);return;}
  }else{
   const reply={id:uid(),body,createdAt:now,updatedAt:null};
   if(!Array.isArray(letter.replies))letter.replies=[];
   letter.replies.push(reply);
   if(!save()){letter.replies.pop();return;}
  }
  closeCompose();drawHistory();letterView();toast('回信已保存');
 });
 section.append(title,history,start,compose);
 root.append(section);
 drawHistory();
 footer(root,'读完了',()=>el('lifeDialog').close(),()=>{
  if(confirm('删除这封信及其全部回信？内容无法找回。')){
   const previous=data.letters;
   data.letters=data.letters.filter(x=>x.id!==id);
   if(!save()){data.letters=previous;return;}
   el('lifeDialog').close();letterView();
  }
 });
 openDialog(root);
}
function showAllDays(items){
 const root=frame('我的纪念日','倒计时、正计时与周年纪念，轻轻收好每个重要日期。');
 for(const {item,view} of items){const b=create('button','life-anniv-row life-anniv-row--'+view.mode);b.type='button';b.style.width='100%';
  const title=create('span','life-row-info');title.append(create('strong','life-row-title',item.name),create('small','life-row-caption',view.label+' · '+view.dateCaption));
  b.append(title,create('span','life-anniv-number',view.primary));b.addEventListener('click',()=>editDay(item));root.append(b)}
 footer(root,'关闭',()=>el('lifeDialog').close());openDialog(root)
}
function showAllWishes(){const root=frame('所有活动心愿','从上海活动库收藏，具体日期与开放时间请到官方渠道核实。');for(const x of data.wishlist){const row=create('div','life-row');const body=create('div','life-row-info');body.append(create('strong','life-row-title',x.title),create('small','life-row-caption',short(x.start)+' · '+x.location));row.append(body);if(x.source){const a=create('a','life-wish-source','官方 ↗');a.href=x.source;a.target='_blank';a.rel='noopener noreferrer';row.append(a)}const b=create('button','life-text-button','移除');b.type='button';b.addEventListener('click',()=>{toggleWish(x);showAllWishes()});row.append(b);root.append(row)}footer(root,'关闭',()=>el('lifeDialog').close());openDialog(root)}
function showAllLetters(items){const root=frame('写给未来的信','约定的那一天到了，正文才会在页面打开。');for(const x of items){const b=create('button','life-row',x.title+' · '+short(x.openDate)+(today()>=x.openDate?' · 可开启'+(x.replies?.length?' · '+x.replies.length+' 封回信':''):' · 未到期'));b.type='button';b.style.width='100%';b.style.textAlign='left';b.disabled=today()<x.openDate;b.addEventListener('click',()=>readLetter(x.id));root.append(b)}footer(root,'关闭',()=>el('lifeDialog').close());openDialog(root)}
function exportBackup(){const blob=new Blob([JSON.stringify({schema:STORE,exportedAt:new Date().toISOString(),...data},null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');const link=URL.createObjectURL(blob);a.href=link;a.download='知时-月度生活手账-'+today()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(link),1500);toast('备份文件已导出，请妥善保存')}
async function importBackup(e){const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>1500000){toast('文件超过1.5MB，无法导入');return}
 try{const j=JSON.parse(await f.text());if(j.schema!==STORE)throw Error('文件格式不匹配');const next=clean(j);if(!confirm('将用备份中的纪念日、活动心愿及未来信件覆盖当前内容，确定继续吗？'))return;const old=data;data=next;if(!save()){data=old;return}render();decorateEventButtons();toast('生活手账已恢复')}catch(err){toast('无法导入：请使用本模块导出的备份文件')}
}
initMarkup();render();
// Retain existing month navigation, sidebar interactions and calendar render logic.
if(typeof renderAll==='function'){
 const original=renderAll;
 renderAll=function(){const result=original.apply(this,arguments);render();return result};
}
function processEventButtons(){decorateEventButtons()}
for(const id of ['allEvents','rightEvents']){
 const target=el(id);if(!target)continue;
 const observer=new MutationObserver(()=>{if(processEventButtons.scheduled)return;processEventButtons.scheduled=true;queueMicrotask(()=>{processEventButtons.scheduled=false;processEventButtons()})});
 observer.observe(target,{childList:true,subtree:false});
}
processEventButtons();
// Update countdowns and sealed-letter availability when crossing midnight Shanghai time.
let day=today();setInterval(()=>{const n=today();if(day!==n){day=n;daysView();letterView()}},60000);
window.zhishiLifeHub={hasWish,toggleWish,refresh:render,backup:exportBackup};
})();
