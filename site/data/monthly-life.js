/* ZhiShi Monthly Life · v1.0
 * Depends on the existing non-module desktop app: nowShanghai, selectedISO,
 * displayMonth/displayYear, EVENT_DATA, openEvents, memos, renderAll, showToast.
 * All personal entries stay in the current browser. No photos in this module.
 */
(function(){
'use strict';
const host=document.getElementById('lifeHub');
if(!host)return;
const STORE='zhishi-monthly-life-v1';
const svgFlower='<svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M22 19C12 12 12 7 22 5c10 2 10 7 0 14ZM25 22c7-10 12-10 14 0-2 10-7 10-14 0ZM22 25c10 7 10 12 0 14-10-2-10-7 0-14ZM19 22C12 32 7 32 5 22c2-10 7-10 14 0Z" fill="currentColor" opacity=".67"/><circle cx="22" cy="22" r="4" fill="#fff9ee"/></svg>';
const svgLetter='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="m3.5 7 8.5 6.4L20.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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
function txt(s,max=300){return String(s??'').trim().slice(0,max)}
function safeId(s){return /^[a-z0-9:_-]{1,80}$/i.test(String(s))?String(s):''}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const [y,m,d]=s.split('-').map(Number),a=new Date(Date.UTC(y,m-1,d));return a.getUTCFullYear()===y&&a.getUTCMonth()===m-1&&a.getUTCDate()===d}
function clean(input){
 const i=input&&typeof input==='object'?input:{};
 const anniversaries=(Array.isArray(i.anniversaries)?i.anniversaries:[]).slice(0,100).filter(e=>e&&validDate(e.date)&&txt(e.name,70)).map(e=>({id:safeId(e.id)||uid(),name:txt(e.name,70),date:e.date,annual:Boolean(e.annual)}));
 const wishlist=(Array.isArray(i.wishlist)?i.wishlist:[]).slice(0,150).filter(e=>e&&safeId(e.id)&&txt(e.title)).map(e=>({id:e.id,title:txt(e.title,100),kind:txt(e.kind,30),location:txt(e.location,80),start:validDate(e.start)?e.start:'',end:validDate(e.end)?e.end:'',source:/^https:\/\//.test(e.source||'')?String(e.source).slice(0,500):''}));
 const letters=(Array.isArray(i.letters)?i.letters:[]).slice(0,80).filter(e=>e&&validDate(e.openDate)&&txt(e.body,6000)).map(e=>({id:safeId(e.id)||uid(),title:txt(e.title,80)||'给未来的自己',body:txt(e.body,6000),created:validDate(e.created)?e.created:today(),openDate:e.openDate}));
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
 host.innerHTML=`<article class="life-card life-card--flowers"><div class="life-card-head"><div><div class="life-kicker">SEASONAL FLOWERS / SHANGHAI</div><h3 class="life-card-title">上海此时花开</h3><div class="life-card-sub" id="lifeFlowersMonth"></div></div><span class="life-botanical" aria-hidden="true">${svgFlower}</span></div><div class="life-list" id="lifeFlowerList"></div><p class="life-footnote">参考往年时令，并非实时花况；实际开放、园区展期请出发前核实。</p></article>
<article class="life-card"><div class="life-card-head"><div><div class="life-kicker">IMPORTANT DAYS</div><h3 class="life-card-title">重要纪念日</h3><div class="life-card-sub">让值得记住的日子有个位置</div></div><button type="button" class="life-mini-button" id="lifeAddDay">＋ 添加</button></div><div class="life-list" id="lifeDayList"></div></article>
<article class="life-card"><div class="life-card-head"><div><div class="life-kicker">MY CITY WISHLIST</div><h3 class="life-card-title">想去的上海活动</h3><div class="life-card-sub">从真实活动列表中收藏心动的去处</div></div><button type="button" class="life-mini-button" id="lifeBrowseEvents">逛活动 ↗</button></div><div class="life-list" id="lifeWishList"></div></article>
<article class="life-card life-card--letter"><div class="life-card-head"><div><div class="life-kicker">DEAR FUTURE ME</div><h3 class="life-card-title">写给未来自己的信</h3><div class="life-card-sub">把今天的心事，交给某一天的自己</div></div><button type="button" class="life-mini-button" id="lifeWriteLetter">＋ 写一封</button></div><div class="life-list" id="lifeLetterList"></div><p class="life-footnote">信保存在本机，尚未加密或云同步；到期可在这里打开，不会自动发送通知。</p></article>
<div class="life-tools"><span>知时 · 月度生活手账　｜　个人记录仅保存在此浏览器</span><span class="life-tools-group"><button type="button" id="lifeExport">↓ 备份</button><button type="button" id="lifeImport">↑ 恢复</button><input type="file" id="lifeImportFile" accept=".json,application/json" hidden></span></div>`;
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
function flowerMonth(){
 const month=typeof displayMonth==='number'?displayMonth:Number(today().slice(5,7));
 el('lifeFlowersMonth').textContent=month+'月 · 上海季节观察';const list=el('lifeFlowerList');list.replaceChildren();
 for(const [name,desc,where] of seasonal[month]||seasonal[10]){
  const row=create('div','life-flower-row');
  const svg=create('span','life-botanical');svg.innerHTML=svgFlower;
  const body=create('div','life-flower-info');body.append(create('div','life-flower-name',name));body.append(create('div','life-flower-desc',desc+' · '+where));
  const b=create('button','life-flower-action','＋ 提醒');b.type='button';b.title='为所选日期添加观察备忘';
  b.addEventListener('click',()=>{
   const day=typeof selectedISO==='string'?selectedISO:today();const title='观察上海'+name;
   if(memos.some(x=>x.date===day&&x.title===title)){toast('这条花讯已加入该日期');return}
   memos.push({id:uid(),date:day,title,detail:where+' · 花况以当日实际情况为准',category:'fun',time:'',done:false});
   if(saveMemos()){renderAll();toast('已加入 '+short(day)+' 的日历')}else memos.pop();
  });row.append(svg,body,b);list.append(row);
 }
}
function daysView(){
 const list=el('lifeDayList');list.replaceChildren();const now=today();
 const all=data.anniversaries.map(e=>({...e,next:upcomingDate(e,now)})).sort((a,b)=>{const x=diffDays(a.next,now),y=diffDays(b.next,now);return (x<0?999999+x:x)-(y<0?999999+y:y)});
 if(!all.length){list.append(empty('还没有添加纪念日。可以记生日、重要约定或值得庆祝的日子。'));return}
 for(const it of all.slice(0,4)){
  const days=diffDays(it.next,now),row=create('div','life-row');const info=create('div','life-row-info');
  info.append(create('strong','life-row-title',it.name),create('small','life-row-caption',short(it.next)+(it.annual?' · 每年重复':' · 单次')));
  const count=create('span','life-days'+(days<0?' past':''));
  if(days<0)count.textContent='已过 '+Math.abs(days)+' 天';else if(days===0)count.textContent='就是今天';else{count.textContent=String(days);count.append(create('small','','天'))}
  const more=create('button','life-text-button','···');more.type='button';more.title='编辑或删除纪念日';more.addEventListener('click',()=>editDay(it));row.append(info,count,more);list.append(row)
 }
 if(all.length>4){const link=create('button','life-text-button','查看全部 '+all.length+' 个纪念日 ↗');link.type='button';link.addEventListener('click',()=>showAllDays(all));list.append(link)}
}
function formatEvent(e){return {id:e.id,title:e.title,kind:e.kind,location:e.location,start:e.start,end:e.end,source:e.source}}
function hasWish(id){return data.wishlist.some(x=>x.id===id)}
function toggleWish(item){const i=data.wishlist.findIndex(x=>x.id===item.id);if(i>=0){data.wishlist.splice(i,1);if(save())toast('已从心愿单移除')}else{if(data.wishlist.length>=150){toast('心愿单最多可保留150项');return}data.wishlist.unshift(formatEvent(item));if(save())toast('已加入想去的上海活动')}wishView();decorateEventButtons()}
function wishView(){const list=el('lifeWishList');list.replaceChildren();const now=today();
 if(!data.wishlist.length){list.append(empty('还没有收藏活动。找到感兴趣的展览或演出，点击 ♡ 想去。'));return}
 for(const item of data.wishlist.slice(0,4)){
  const row=create('div','life-row');const body=create('div','life-row-info');
  const past=Boolean(item.end&&item.end<now);
  body.append(create('strong','life-row-title',item.title));body.append(create('small','life-row-caption',(item.kind||'上海活动')+' · '+(item.start?short(item.start):'开放时间待核实')+' · '+(item.location||'查看官方信息')));
  const actions=create('span','life-tools-group');
  if(item.source){const link=create('a','life-wish-source','详情 ↗');link.href=item.source;link.target='_blank';link.rel='noopener noreferrer';actions.append(link)}
  const remove=create('button','life-text-button','移除');remove.type='button';remove.addEventListener('click',()=>toggleWish(item));actions.append(remove);
  if(past){const tag=create('span','life-status-tag past','已过期');body.append(tag)}
  row.append(body,actions);list.append(row)
 }
 if(data.wishlist.length>4){const b=create('button','life-text-button','还有 '+(data.wishlist.length-4)+' 项 · 查看全部 ↗');b.type='button';b.addEventListener('click',showAllWishes);list.append(b)}
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
 if(!data.letters.length){list.append(empty('想对未来的自己说点什么？写一封信，约定某天再打开。'));return}
 const sorted=[...data.letters].sort((a,b)=>a.openDate.localeCompare(b.openDate));
 for(const letter of sorted.slice(0,3)){
  const unlocked=now>=letter.openDate;
  const row=create('div','life-letter-row'),mark=create('span','life-letter-envelope');mark.innerHTML=svgLetter;
  const info=create('div','life-letter-info');info.append(create('strong','',letter.title||'给未来的自己'));
  info.append(create('small','',unlocked?'已到开启日 · '+short(letter.openDate):short(letter.openDate)+' 才能打开 · 还有 '+diffDays(letter.openDate,now)+' 天'));
  const b=create('button','life-letter-open',unlocked?'打开 ↗':'已封存');b.type='button';b.disabled=!unlocked;
  b.style.opacity=unlocked?'1':'.6';b.addEventListener('click',()=>readLetter(letter.id));
  row.append(mark,info,b);list.append(row)
 }
 if(sorted.length>3){const b=create('button','life-text-button','查看全部信件 · '+sorted.length+' 封 ↗');b.type='button';b.addEventListener('click',()=>showAllLetters(sorted));list.append(b)}
}
function render(){flowerMonth();daysView();wishView();letterView()}
function openDialog(body){const dlg=el('lifeDialog');dlg.innerHTML='';dlg.append(body);dlg.showModal();return dlg}
function frame(title,subtitle){const root=create('div','life-form-frame');const close=create('button','life-dialog-close','×');close.type='button';close.title='关闭';close.addEventListener('click',()=>el('lifeDialog').close());root.append(close,create('h3','',title),create('p','',subtitle));return root}
function addField(root,label,type,required=false){const wrap=create('div','');const id=uid();const l=create('label','',label);l.htmlFor=id;const input=create('input','');input.type=type;input.id=id;input.required=required;wrap.append(l,input);root.append(wrap);return input}
function footer(root,primary,go,deleteFn){const bar=create('div','life-dialog-actions');if(deleteFn){const del=create('button','','删除');del.type='button';del.style.marginRight='auto';del.addEventListener('click',deleteFn);bar.append(del)}const cancel=create('button','','取消');cancel.type='button';cancel.addEventListener('click',()=>el('lifeDialog').close());const save=create('button','life-primary',primary);save.type='button';save.addEventListener('click',go);bar.append(cancel,save);root.append(bar)}
function editDay(existing){const item=existing?.id?data.anniversaries.find(x=>x.id===existing.id):null;const root=frame(item?'编辑纪念日':'记下重要的一天','生日、周年纪念或其他重要日期，都可以留在这里。');
 const name=addField(root,'纪念日名称','text',true),date=addField(root,'日期','date',true);name.maxLength=70;name.placeholder='例如：认识一周年';name.value=item?.name||'';date.value=item?.date||today();
 const label=create('label','life-checkbox-label');const repeat=document.createElement('input');repeat.type='checkbox';repeat.checked=item?.annual??true;label.append(repeat,document.createTextNode('每年重复提醒（闰日遇非闰年按2月28日计算）'));root.append(label);
 footer(root,item?'保存修改':'添加纪念日',()=>{
  if(!name.value.trim()||!validDate(date.value)){toast('请填写名称和有效日期');return}
  const o={id:item?.id||uid(),name:txt(name.value,70),date:date.value,annual:repeat.checked};
  if(item){const i=data.anniversaries.findIndex(x=>x.id===item.id);if(i>=0)data.anniversaries[i]=o}
  else data.anniversaries.push(o);
  if(save()){el('lifeDialog').close();daysView();toast('纪念日已保存')}
 },item?()=>{if(confirm('确定删除这个纪念日吗？')){data.anniversaries=data.anniversaries.filter(x=>x.id!==item.id);save();el('lifeDialog').close();daysView()}}:null);
 openDialog(root)
}
function writeLetter(){const root=frame('写给未来的自己','想象那一天的自己，给未来留一封真正的信。');const title=addField(root,'给这封信起个名字','text',true);title.maxLength=80;title.value='给未来的我';const date=addField(root,'约定开启日期','date',true);date.min=tomorrow(today());date.value=tomorrow(today());
 const label=create('label','','想说的话');const body=create('textarea','');body.maxLength=6000;body.placeholder='今天的心情、一个愿望，或是你想在未来记起的瞬间……';body.rows=8;root.append(label,body);
 root.append(create('p','life-note','保存后，在开启日期之前网页不会展示正文。但本机存储不加密，无法替代私密保险箱。'));
 footer(root,'封好这封信',()=>{
  if(!validDate(date.value)||date.value<=today()){toast('请选择明天或以后的日期');return}
  if(!body.value.trim()){toast('写一点话再寄给未来的自己吧');return}
  data.letters.push({id:uid(),title:txt(title.value,80)||'给未来的自己',body:txt(body.value,6000),openDate:date.value,created:today()});
  if(save()){el('lifeDialog').close();letterView();toast('信已经封存，到了约定的日子再见 ♡')}
 });openDialog(root)
}
function readLetter(id){const letter=data.letters.find(x=>x.id===id);if(!letter||today()<letter.openDate){toast('还没有到开启日期');return}
 const root=frame(letter.title,'写于 '+letter.created+' · 约定 '+letter.openDate+' 开启');root.append(create('div','life-letter-paper',letter.body));
 footer(root,'读完了',()=>el('lifeDialog').close(),()=>{if(confirm('删除这封信？内容无法找回。')){data.letters=data.letters.filter(x=>x.id!==id);save();el('lifeDialog').close();letterView()}});openDialog(root)
}
function showAllDays(items){const root=frame('所有纪念日','按照距离今天的时间排序。');for(const x of items){const button=create('button','life-row',x.name+' · '+short(x.next)+'　编辑 ↗');button.type='button';button.style.width='100%';button.style.textAlign='left';button.style.marginBottom='8px';button.addEventListener('click',()=>editDay(x));root.append(button)}footer(root,'关闭',()=>el('lifeDialog').close());openDialog(root)}
function showAllWishes(){const root=frame('所有活动心愿','从上海活动库收藏，具体日期与开放时间请到官方渠道核实。');for(const x of data.wishlist){const row=create('div','life-row');const body=create('div','life-row-info');body.append(create('strong','life-row-title',x.title),create('small','life-row-caption',short(x.start)+' · '+x.location));row.append(body);if(x.source){const a=create('a','life-wish-source','官方 ↗');a.href=x.source;a.target='_blank';a.rel='noopener noreferrer';row.append(a)}const b=create('button','life-text-button','移除');b.type='button';b.addEventListener('click',()=>{toggleWish(x);showAllWishes()});row.append(b);root.append(row)}footer(root,'关闭',()=>el('lifeDialog').close());openDialog(root)}
function showAllLetters(items){const root=frame('写给未来的信','约定的那一天到了，正文才会在页面打开。');for(const x of items){const b=create('button','life-row',x.title+' · '+short(x.openDate)+(today()>=x.openDate?' · 可开启':' · 未到期'));b.type='button';b.style.width='100%';b.style.textAlign='left';b.disabled=today()<x.openDate;b.addEventListener('click',()=>readLetter(x.id));root.append(b)}footer(root,'关闭',()=>el('lifeDialog').close());openDialog(root)}
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