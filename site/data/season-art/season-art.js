/* 知时 · 九套新节气水彩插画装配层
 * 依据现有24节气主题切换，不改写日历、待办、天气及用户数据。
 * 已有独立设计稿：春6套、秋3套。剩余15套继续复用现有24节气插画。
 * Background-size paints a 2x2 watercolor sheet; no whole-page screenshots. */
(function () {
  'use strict';
  const root=document.documentElement;
  const packs={
    '立春':{flower:'玉兰',phrase:'立春风软，玉兰初醒'},
    '雨水':{flower:'桃花与柳枝',phrase:'雨润春枝，桃花含笑'},
    '惊蛰':{flower:'桃花',phrase:'惊雷唤醒，桃红渐浓'},
    '春分':{flower:'樱花',phrase:'昼夜平分，樱花如雪'},
    '清明':{flower:'海棠',phrase:'细雨清明，海棠正好'},
    '谷雨':{flower:'牡丹',phrase:'雨生百谷，牡丹倾城'},
    '立秋':{flower:'桂花',phrase:'一缕桂香，轻启秋序'},
    '寒露':{flower:'菊花',phrase:'寒露微凉，菊影正浓'},
    '霜降':{flower:'菊花与红枫',phrase:'秋色深时，菊枫相映'}
  };
  function render(){
    const selected=root.dataset.solarTheme||'';
    const pack=packs[selected];
    if(!pack){
      root.removeAttribute('data-term-design');
      root.style.removeProperty('--term-design-sheet');
      return;
    }
    root.dataset.termDesign=selected;
    root.style.setProperty('--term-design-sheet','url("/data/season-art/'+encodeURIComponent(selected)+'.webp?v=illustrated-20261026")');
    const title=document.getElementById('monthSolarFlowerLabel');
    if(title){
      title.textContent='✦ '+selected+' · '+pack.flower+'｜'+pack.phrase;
      title.title='当前节气的水彩花信：'+pack.flower+'。插画表达节气意境，不代表当前实时花况。';
    }
    const badge=document.getElementById('solarFlowerName');
    if(badge)badge.textContent=selected+' · '+pack.flower+'水彩';
    const card=document.getElementById('lifeFlowersMonth');
    if(card){
      card.dataset.seasonNote=selected+' · '+pack.flower;
      card.title='本节气主花：'+pack.flower+'。下方列表仍展示当月上海的参考花期。';
    }
  }
  let pending=false;
  const schedule=()=>{
    if(pending)return;
    pending=true;
    queueMicrotask(()=>{pending=false;render();});
  };
  new MutationObserver(records=>{
    if(records.some(record=>record.attributeName==='data-solar-theme'))schedule();
  }).observe(root,{attributes:true,attributeFilter:['data-solar-theme']});
  render();
  window.ZhiShiDesignPackV3={available:Object.keys(packs),refresh:render};
})();