/* 知时 · 二十四节气花信主题 / 24 individual seasonal artworks.
 * Flower artwork sourced from original generated watercolor design studies;
 * scenery is illustrative, not a verified observation of actual flowering.
 * Does not overwrite weather, personal notes, calendar, or holiday logic. */
(function(){
 'use strict';
 const THEMES=[
 ['小寒','蜡梅','疏影轻寒，等一枝梅香'],['大寒','红梅','雪尽春近，梅花先报信'],
 ['立春','迎春花','东风解冻，迎春先开'],['雨水','白玉兰','春雨润枝，玉兰含香'],
 ['惊蛰','桃花','春雷始动，桃枝欲红'],['春分','樱花','昼夜均分，花开正好'],
 ['清明','海棠','细雨清明，海棠如约'],['谷雨','牡丹','谷雨花时，春色正浓'],
 ['立夏','月季','夏木初长，月季初妍'],['小满','绣球','花团锦簇，小得盈满'],
 ['芒种','栀子','草木清香，栀子如雪'],['夏至','荷花','日影渐长，荷风送香'],
 ['小暑','睡莲','莲叶轻展，暑气渐长'],['大暑','紫薇','盛夏有花，紫薇成荫'],
 ['立秋','桂花','初秋将至，收藏一缕桂香'],['处暑','紫薇','暑气渐收，紫薇仍开'],
 ['白露','木槿','白露凝珠，木槿迎晨'],['秋分','秋菊','昼夜平分，菊色渐浓'],
 ['寒露','秋海棠','秋露微凉，海棠静好'],['霜降','茶梅','霜色渐浓，茶梅含蕊'],
 ['立冬','山茶','初冬静好，山茶渐醒'],['小雪','冬青','寒意初现，冬青添红'],
 ['大雪','雪中梅','雪满枝头，暗香将至'],['冬至','水仙','白昼渐长，水仙含芳']
 ];
 const atlas='/data/solar-flora-atlas.webp?v=20261015-flora2';
 const root=document.documentElement;
 const summary=document.createElement('div');summary.className='month-work-summary';summary.id='monthWorkSummary';summary.setAttribute('aria-live','polite');
 const monthTitle=document.querySelector('.month-title');if(monthTitle)monthTitle.append(summary);
 const monthFlower=document.createElement('div');monthFlower.className='solar-flower-label';monthFlower.id='monthSolarFlowerLabel';monthTitle?.append(monthFlower);
 const groupNames=typeof categoryOptions!=='undefined'?categoryOptions:[['work','工作','#6497c7'],['life','生活','#e2a16f'],['health','健康','#78a889'],['family','纪念日','#c98dad'],['fun','兴趣','#a995ce'],['important','重要事项','#d87972']];
 function workdays(){
  const y=displayYear,m=displayMonth,days=new Date(Date.UTC(y,m,0)).getUTCDate();let work=0,off=0,makeup=0;
  for(let d=1;d<=days;d++){
   const date=iso(y,m,d);const h=holidayMap[date];const rest=isRest(date);
   if(rest)off++;else work++;
   if(h&&h.type==='work')makeup++;
  }
  summary.replaceChildren();
  const lead=document.createElement('span');lead.className='month-work-lead';lead.textContent=y===2026?'本月工作日':'本月工作日 · 暂估';
  const main=document.createElement('strong');main.textContent=work+' 天';
  const side=document.createElement('span');side.textContent='休息 '+off+' 天'+(makeup?' · 补班 '+makeup+' 天':'');
  summary.append(lead,main,side);
  summary.title=y===2026?'根据2026年中国法定放假调休与双休日统计。':'当年的官方调休方案尚未接入，按通常周末估算；请以国务院通知为准。';
 }
 function groupToday(){
  const host=document.getElementById('memoList');if(!host)return;
  const notes=memos.filter(v=>v.date===selectedISO).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  if(!notes.length)return;
  const rows=[...host.querySelectorAll(':scope > .memo-row')];
  if(rows.length!==notes.length)return;
  host.textContent='';
  const specs=groupNames.map(([k,label,color])=>({k,label,color}));
  const standardIds=new Set(specs.map(x=>x.k));
  if(notes.some(x=>!standardIds.has(x.category)))specs.push({k:'other',label:'其他',color:'#9fa49b'});
  for(const group of specs){
   const matched=notes.map((m,i)=>({memo:m,row:rows[i]})).filter(pair=>group.k==='other'?!standardIds.has(pair.memo.category):pair.memo.category===group.k);
   if(!matched.length)continue;
   const section=document.createElement('section');section.className='memo-category-group';section.dataset.category=group.k;
   const heading=document.createElement('div');heading.className='memo-category-heading';
   const mark=document.createElement('i');mark.style.background=group.color;mark.setAttribute('aria-hidden','true');
   const label=document.createElement('span');label.textContent=group.label;
   const count=document.createElement('small');count.textContent=matched.length+' 项';
   heading.append(mark,label,count);section.append(heading);
   for(const pair of matched)section.append(pair.row);
   host.append(section);
  }
 }
 const REGIONAL=[
  {season:'spring',title:'去苏州平江路穿一次汉服',place:'苏州 · 平江路',desc:'在历史街巷试试汉服换装与轻拍摄，再沿河逛手作小店。先确认店铺预约和公共场所拍摄要求。',duration:'约 1 天',tip:'上海出发：乘高铁到苏州后换乘市内交通；非当日活动公告。'},
  {season:'spring',title:'去苏州上方山寻找春天的花',place:'苏州 · 上方山国家森林公园',desc:'把半天留给山林花草，穿舒服的鞋走园路；盛花时间依气温而变。',duration:'约 1 天',tip:'出发前确认实际花期及园区预约。'},
  {season:'spring',title:'杭州西湖边来一次春日慢走',place:'杭州 · 西湖沿线',desc:'走一段湖滨或苏堤，挑人少的路休息喝茶；早春植物状态以现场为准。',duration:'约 1 天',tip:'沪杭往返可查高铁，注意返程班次。'},
  {season:'spring',title:'无锡鼋头渚看一回春色',place:'无锡 · 鼋头渚',desc:'安排充足时间游园赏季节花木，盛花期请关注官方预约和客流提示。',duration:'约 1 天',tip:'花期非固定时段，不能保证当天盛放。'},
  {season:'summer',title:'去杭州九溪十八涧走一段茶山路',place:'杭州 · 九溪十八涧',desc:'选择天气合适的时段走林荫小路，雨后注意湿滑、交通与补水。',duration:'约 1 天',tip:'炎热或强降雨时不建议徒步；先查步道开放情况。'},
  {season:'summer',title:'苏州园林里寻一池荷叶',place:'苏州 · 古典园林',desc:'选一家开放园林，看看水景和夏日庭院；提前核实门票及花期。',duration:'约 1 天',tip:'园林赏荷作为季节灵感，并非当日花讯。'},
  {season:'summer',title:'在湖州南浔古镇慢慢过一天',place:'湖州 · 南浔古镇',desc:'沿水岸散步、看桥与老宅；高温时增加室内休息和补水。',duration:'约 1 天',tip:'交通需结合到站和镇区换乘时间。'},
  {season:'summer',title:'去杭州云栖竹径感受林间清凉',place:'杭州 · 云栖竹径',desc:'在竹林里慢慢走，带好防蚊用品、饮水和舒适鞋。',duration:'约 1 天',tip:'雷雨和台风预警期间取消山林行程。'},
  {season:'autumn',title:'去苏州平江路穿汉服拍秋日街景',place:'苏州 · 平江路',desc:'给自己安排一套喜欢的汉服，在水巷和小桥间拍几张秋日照片。',duration:'约 1 天',tip:'汉服商户和拍摄规则请提前确认。'},
  {season:'autumn',title:'杭州九溪十八涧赏秋徒步',place:'杭州 · 九溪十八涧',desc:'找天气晴好的周末，沿溪谷走轻量路线，留意道路湿滑和返程时间。',duration:'约 1 天',tip:'秋叶变色与真实天气有关，以当日情况为准。'},
  {season:'autumn',title:'去苏州虎丘看古树与江南秋色',place:'苏州 · 虎丘',desc:'慢慢走园路、留意古树色彩，顺路找一家苏式茶馆休息。',duration:'约 1 天',tip:'出行前核实景区营业及预约。'},
  {season:'autumn',title:'到无锡惠山古镇慢逛一天',place:'无锡 · 惠山古镇',desc:'看古镇建筑与秋季树色，试一点无锡小吃；适合不赶行程的周末。',duration:'约 1 天',tip:'步行区域和园区开放政策以官方为准。'},
  {season:'winter',title:'到苏州留园看冬日庭院',place:'苏州 · 留园',desc:'寻找漏窗、廊道和冬季园林光影，慢慢走、不必赶景点。',duration:'约 1 天',tip:'冬季注意防风与园区开放安排。'},
  {season:'winter',title:'去杭州西湖边喝一杯热茶',place:'杭州 · 西湖周边',desc:'挑一个晴冷的日子看湖景，找家茶馆安静坐一会儿。',duration:'约 1 天',tip:'周末出发前查高铁和天气情况。'},
  {season:'winter',title:'去无锡惠山古镇寻一缕冬日暖意',place:'无锡 · 惠山古镇',desc:'挑一条短路线逛古巷，喝热茶、吃一份地方点心。',duration:'约 1 天',tip:'冬季寒潮期间可改为室内活动。'},
  {season:'winter',title:'走一回苏州平江路的冬日水巷',place:'苏州 · 平江路',desc:'用不赶时间的步速走水巷，看看冬季的屋檐与灯影。',duration:'约 1 天',tip:'地面湿滑时注意安全。'},
  {season:'all',title:'嘉兴南湖边看城市与水面',place:'嘉兴 · 南湖',desc:'看一段湖景，顺路逛街巷，给周末留一个安静的下午。',duration:'约 1 天',tip:'结合车次、天气安排往返。'},
  {season:'all',title:'苏州拙政园与周边老街慢行',place:'苏州 · 拙政园周边',desc:'赏园林建筑和古街，不急着走很多景点。',duration:'约 1 天',tip:'具体开园与门票以景区为准。'},
  {season:'all',title:'杭州良渚博物院与文化漫步',place:'杭州 · 良渚区域',desc:'找一天去看常设展与建筑，再在周边公共空间慢走。',duration:'约 1 天',tip:'提前核对休馆日期及预约要求。'},
  {season:'all',title:'苏州博物馆与平江路的一天',place:'苏州 · 姑苏区',desc:'把室内看展和街区散步搭配起来，天气不好也有安排。',duration:'约 1 天',tip:'苏州博物馆常需预约，出发前核实。'},
  {season:'all',title:'湖州南浔水乡拍一组生活照片',place:'湖州 · 南浔古镇',desc:'慢走石桥与长廊，挑几个光线柔和的街角留影。',duration:'约 1 天',tip:'交通与入园政策请提前查询。'},
  {season:'all',title:'到无锡蠡湖畔看开阔水色',place:'无锡 · 蠡湖周边',desc:'沿水岸走一段路，换个视角欣赏江南的湖景。',duration:'约 1 天',tip:'户外活动请视天气与客流调整。'}
 ];
 function seasonOfMonth(m){if(m>=3&&m<=5)return 'spring';if(m>=6&&m<=8)return 'summer';if(m>=9&&m<=11)return 'autumn';return 'winter'}
 const fallbackGetIdea=getIdea;
 getIdea=function(s,variant=0){
  const k=((Math.trunc(Number(variant)||0)%3)+3)%3;
  if(!isRest(s)||mondayIndex(s)<5)return fallbackGetIdea(s,variant);
  const p=parseISO(s),week=Math.floor((p.d-1)/7);
  // Keep original Shanghai recommendations on alternating weekends;
  // on other weekends include neighboring Jiangsu/Zhejiang cities.
  if(k===0&&week%2===1)return fallbackGetIdea(s,variant);
  const seasonal=seasonOfMonth(p.m),options=REGIONAL.filter(a=>a.season===seasonal||a.season==='all');
  const ordinal=ordinalFor(s,true),pos=(ordinal+k*7+(p.m-1))%options.length;
  const x=options[pos];
  return plan(x.title,x.desc,'周末 · 江浙沪短途',x.place,x.duration,'','',x.tip+' 此条为目的地灵感，不是已核实的临时活动。');
 };
 const oldCalendar=renderCalendar,oldDetails=renderDetails;
 renderCalendar=function(){oldCalendar();workdays()};
 renderDetails=function(){oldDetails();groupToday()};
 const panel=document.getElementById('calendarMain');
 function applyFlower(){
  const selected=root.dataset.solarTheme;
  const name=THEMES.some(t=>t[0]===selected)?selected:termForShanghaiDay(nowShanghai());
  const idx=THEMES.findIndex(x=>x[0]===name);
  if(idx<0)return;
  const [term,flower,phrase]=THEMES[idx];
  root.style.setProperty('--solar-flora-sprite',`url("${atlas}")`);
  root.style.setProperty('--solar-flora-x',((idx%6)*20)+'%');
  root.style.setProperty('--solar-flora-y',(Math.floor(idx/6)*100/3)+'%');
  root.dataset.solarFlora=term;
  monthFlower.textContent='✦ '+term+' · '+flower+'｜'+phrase;
  monthFlower.title=term+'意象花卉：'+flower+'。装饰插画非实时开花报告。';
  panel?.setAttribute('data-solar-illustration',flower);
 }
 const observer=new MutationObserver(records=>{
  if(records.some(x=>x.attributeName==='data-solar-theme'))applyFlower();
 });
 observer.observe(root,{attributes:true,attributeFilter:['data-solar-theme']});
 applyFlower();
 workdays();groupToday();
 window.ZhiShiSolarScenes={themes:THEMES.map(([term,flower,phrase],i)=>({term,flower,phrase,index:i})),refresh:applyFlower};
})();
