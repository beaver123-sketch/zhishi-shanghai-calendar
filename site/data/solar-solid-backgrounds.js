/* ZhiShi · pure solid 24-term background / Shanghai day-based automatic switching. */
(function(){
 'use strict';
 const ds=window.ZHISHI_DESIGN_SYSTEM||{};
 const themes=ds.themes||{};
 const names=['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
 const known=['01-05','01-20','02-04','02-18','03-05','03-20','04-05','04-20','05-05','05-21','06-05','06-21','07-07','07-23','08-07','08-23','09-07','09-23','10-08','10-23','11-07','11-22','12-07','12-22'];
 const offset=[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
 const pageColors={
  '小寒':'#EAF0F2','大寒':'#EDF0F2','立春':'#E9F3E7','雨水':'#E9F2F3',
  '惊蛰':'#F0F3E3','春分':'#F6EBEA','清明':'#E7F2EB','谷雨':'#EAF1E5',
  '立夏':'#E6F3E9','小满':'#F3F4E4','芒种':'#F8F1DF','夏至':'#E7F2F5',
  '小暑':'#E8F4F2','大暑':'#E7EFF4','立秋':'#F8F0DE','处暑':'#F5EEDF',
  '白露':'#EDF1F2','秋分':'#F6EEDC','寒露':'#F0F1E6','霜降':'#F5EADD',
  '立冬':'#EBF0ED','小雪':'#E9F1F6','大雪':'#E7EFF5','冬至':'#F1F0E9'
 };
 const flowers=['蜡梅','红梅','迎春花','白玉兰','桃花','樱花','海棠','牡丹','月季','绣球','栀子','荷花','睡莲','紫薇','桂花','紫薇','木槿','秋菊','秋海棠','茶梅','山茶','冬青','雪中梅','水仙'];
 const mobile=!!document.querySelector('.app');
 const root=document.documentElement;
 const pad=n=>String(n).padStart(2,'0');
 function currentDate(){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const v=k=>parts.find(p=>p.type===k).value;
  return v('year')+'-'+v('month')+'-'+v('day');
 }
 function datesFor(year){
  return names.map((name,i)=>{
   if(year===2026)return year+'-'+known[i];
   const at=new Date(31556925974.7*(year-1900)+offset[i]*60000+Date.UTC(1900,0,6,2,5));
   return year+'-'+pad(at.getUTCMonth()+1)+'-'+pad(at.getUTCDate());
  });
 }
 function termOn(date){
  const year=Number(date.slice(0,4));
  const all=[];
  for(const y of [year-1,year])datesFor(y).forEach((day,i)=>all.push([day,names[i]]));
  all.sort((a,b)=>a[0].localeCompare(b[0]));
  let active='冬至';
  for(const [day,name] of all){if(day>date)break;active=name;}
  return active;
 }
 function mode(){
  try{return localStorage.getItem('zhishi-solar-theme-mode-v1')||'auto';}
  catch(e){return 'auto';}
 }
 function paint(){
  const active=termOn(currentDate());
  const stored=mode();
  // The desktop app already owns the existing theme picker; respect it.
  let selected=mobile?(stored==='neutral'?'neutral':themes[stored]?stored:active):(root.dataset.solarTheme||active);
  if(selected!=='neutral'&&!themes[selected])selected=active;
  const def=ds.neutral||{bg:'#F7F8F7',surface:'#EDF2EE',primary:'#728A80',accent:'#B8C7B7'};
  const t=selected==='neutral'?def:themes[selected];
  if(!t)return;
  const color=selected==='neutral'?'#F1F3F1':pageColors[selected];
  const vals={
   '--solid-page':color,
   '--solid-surface':t.surface,
   '--solid-soft':selected==='neutral'?'#F8FAF8':t.bg,
   '--solid-primary':t.primary,
   '--solid-deep':'color-mix(in srgb,'+t.primary+' 73%,#1D2C24)',
   '--solid-ink':'#35413C',
   '--solid-border':'color-mix(in srgb,'+t.primary+' 18%,#e9e9e2)'
  };
  // For pure-color surfaces the soft token is a solid tint, not a gradient.
  vals['--solid-soft']='color-mix(in srgb,'+t.surface+' 52%,#fffefa)';
  for(const [key,value] of Object.entries(vals))root.style.setProperty(key,value);
  root.dataset.solidTerm=selected;
  root.dataset.solidActualTerm=active;
  if(mobile){
   root.style.setProperty('--season-primary',t.primary);
   root.style.setProperty('--season-surface',t.surface);
   root.style.setProperty('--season-bg',color);
   const ix=names.indexOf(selected);
   const flower=flowers[ix>=0?ix:names.indexOf(active)];
   const intro=document.querySelector('.app .intro');
   if(intro){
    let badge=intro.querySelector('.solid-term-badge');
    if(!badge){badge=document.createElement('div');badge.className='solid-term-badge';intro.appendChild(badge);}
    badge.textContent=selected==='neutral'?'简约纯色主题':selected+' · '+flower+' · 节气配色';
   }
   updateWorkSummary();
  }
 }
 function updateWorkSummary(){
  const target=document.querySelector('#screen-calendar .month-tools');
  if(!target||typeof month!=='string'||typeof isRest!=='function')return;
  let el=document.getElementById('mobileWorkSummary');
  if(!el){el=document.createElement('div');el.className='month-solid-work';el.id='mobileWorkSummary';target.insertAdjacentElement('afterend',el);}
  const [y,m]=month.split('-').map(Number),days=new Date(Date.UTC(y,m,0)).getUTCDate();
  let work=0,rest=0,makeup=0;
  for(let d=1;d<=days;d++){
   const date=y+'-'+pad(m)+'-'+pad(d);
   if(isRest(date))rest++;else work++;
   if(typeof holiday==='object'&&holiday[date]&&holiday[date].kind==='班')makeup++;
  }
  el.replaceChildren();
  const caption=document.createElement('span');caption.textContent=y===2026?'本月工作日':'本月工作日（周末估算）';
  const main=document.createElement('strong');main.textContent=work+' 天';
  const tail=document.createElement('span');tail.textContent='休息 '+rest+' 天'+(makeup?' · 补班 '+makeup+' 天':'');
  el.append(caption,main,tail);
 }
 function groupMemoList(container){
  if(!container)return;
  const rows=Array.from(container.querySelectorAll(':scope > .todo-row'));
  if(!rows.length)return;
  const order=['work','life','fun','health','family','important'];
  const groups=new Map();
  // We attach a category marker directly on the row in memoEl's existing factory.
  for(const row of rows){
   const cat=row.dataset.memoCategory||'life';
   if(!groups.has(cat))groups.set(cat,[]);
   groups.get(cat).push(row);
  }
  if(groups.size===0)return;
  const out=document.createDocumentFragment();
  for(const id of order){
   const list=groups.get(id);
   if(!list||!list.length)continue;
   const meta=(typeof cats==='object'&&cats[id])||[id,'#7D8B67'];
   const label=document.createElement('div');
   label.className='solid-memo-heading';
   label.style.setProperty('--memo-color',meta[1]);
   const name=document.createElement('span');name.textContent=meta[0];
   const count=document.createElement('small');count.textContent=list.length+' 项';
   label.append(name,count);out.append(label,...list);
  }
  container.replaceChildren(out);
 }
 function wrapMobileMemos(){
  if(!mobile||typeof memoEl!=='function'||typeof renderMemosHome!=='function')return;
  const originalMemo=memoEl;
  memoEl=function(record){
   const row=originalMemo(record);
   row.dataset.memoCategory=record.category||'life';
   return row;
  };
  const originalHome=renderMemosHome;
  renderMemosHome=function(){originalHome();groupMemoList(document.getElementById('homeMemos'));};
  if(typeof renderNotes==='function'){
   const originalNotes=renderNotes;
   renderNotes=function(){
    originalNotes();
    const boxes=document.querySelectorAll('#allNotes .todo-box');
    boxes.forEach(groupMemoList);
   };
  }
  if(typeof renderMonth==='function'){
   const originalMonth=renderMonth;
   renderMonth=function(){originalMonth();updateWorkSummary();};
  }
 }
 wrapMobileMemos();
 // Initial inline render happened before this enhancement loaded.
 if(mobile){renderMemosHome();renderNotes();}
 paint();
 window.setInterval(paint,60000);
 window.addEventListener('focus',paint);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint();});
 if(!mobile){
  new MutationObserver(records=>{
   if(records.some(r=>r.attributeName==='data-solar-theme'))paint();
  }).observe(root,{attributes:true,attributeFilter:['data-solar-theme']});
 }
 window.ZhiShiSolidTheme={refresh:paint,currentTerm:()=>termOn(currentDate()),palette:pageColors};
})();