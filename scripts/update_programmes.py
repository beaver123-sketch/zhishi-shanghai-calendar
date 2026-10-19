#!/usr/bin/env python3
"""Sync Shanghai Culture Square dates, separate from undated municipal article leads.
Only publish dated venue-listed shows; retain last successful snapshot on failure.
"""
from __future__ import annotations
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.error import HTTPError,URLError
from urllib.request import Request,urlopen
from zoneinfo import ZoneInfo

DATA=Path(__file__).resolve().parents[1]/'site'/'data'
VENUE="https://www.shcstheatre.com/program/programlist_easy.aspx"
SH=ZoneInfo('Asia/Shanghai')
DATE_RE=re.compile(r'(?:日期|Date)\s*[:：]?\s*(20\d{2})\s*[./年]\s*(\d{1,2})\s*[./月]\s*(\d{1,2})\s*日?\s*[-–—~至]+\s*(20\d{2})\s*[./年]\s*(\d{1,2})\s*[./月]\s*(\d{1,2})',re.I)
IGNORE=re.compile(r'^(价格|Price|立即购票|Buy Tickets|时间|Time|地点|Venue|类型|Category|Image|了解详情|订票热线)',re.I)

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts=[]
        self.ignore=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.ignore+=1
        if tag in ('br','p','li','h2','h3','h4','div','section','article','tr'):self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.ignore=max(0,self.ignore-1)
        if tag in ('p','li','h2','h3','h4','div','section','article','tr'):self.parts.append('\n')
    def handle_data(self,value):
        if not self.ignore and value.strip():self.parts.append(value.strip())

def parse(html,today):
    parser=VisibleText();parser.feed(html)
    text='\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())
    found=[]
    for chunk in re.split(r'立即购票|Buy Tickets',text,flags=re.I):
        match=DATE_RE.search(chunk)
        if not match:continue
        try:
            y,m,d,Y,M,D=map(int,match.groups())
            start,end=dt.date(y,m,d),dt.date(Y,M,D)
        except ValueError:continue
        if end<today or end<start or start>today+dt.timedelta(days=400):continue
        lines=[line.strip() for line in chunk[:match.start()].splitlines() if line.strip()]
        titles=[line for line in lines if '《' in line and '》' in line and not IGNORE.match(line)]
        if not titles:continue
        title=re.sub(r'\s+',' ',titles[-1])
        if not 4<=len(title)<=145:continue
        kind='音乐剧' if '音乐剧' in title else '音乐会' if '音乐会' in title else '舞剧' if ('芭蕾' in title or '舞剧' in title) else '演出'
        key=re.sub(r'[\s（）()·：:《》]','',title)+'_'+str(start)
        found.append({
            'id':'theatre_'+hashlib.sha256(key.encode()).hexdigest()[:16],
            'title':title,'kind':kind,'location':'上海文化广场 · 主剧场',
            'start':start.isoformat(),'end':end.isoformat(),
            'time':'具体场次请以场馆官方排期为准','area':'黄浦区',
            'note':'由剧院公开节目列表自动提取；演出变动、票务请以官方为准。',
            'source':VENUE,'icon':'♫','outdoor':False,
            'review':'场馆官方排期自动同步 · 出行前复核',
            'autoSource':'上海文化广场官方节目列表'
        })
    return sorted({e['id']:e for e in found}.values(),key=lambda e:(e['start'],e['title']))

def refresh(fetcher=None,today=None):
    now=dt.datetime.now(SH);today=today or now.date()
    target=DATA/'events-auto.json'
    try:prev=json.loads(target.read_text(encoding='utf-8'))
    except (OSError,ValueError):prev={'schemaVersion':1,'events':[]}
    try:
        if fetcher:
            html=fetcher(VENUE)
        else:
            request=Request(VENUE,headers={'User-Agent':'Mozilla/5.0 (compatible; ZhishiCalendar/1.0)','Accept':'text/html'})
            with urlopen(request,timeout=24) as res:
                raw=res.read(2000000)
                charset=res.headers.get_content_charset() or 'utf-8'
            html=raw.decode(charset,errors='replace')
        events=parse(html,today)
        if len(events)<2:raise ValueError('未解析出至少2条当前或未来节目；保留旧版缓存')
        data={'schemaVersion':1,'checkedAt':now.isoformat(timespec='seconds'),
              'status':'success','source':VENUE,'events':events}
    except (HTTPError,URLError,TimeoutError,OSError,ValueError,UnicodeError) as exc:
        data={**prev,'status':'stale','lastAttemptAt':now.isoformat(timespec='seconds'),
              'lastError':str(exc)[:160]}
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return {'status':data.get('status'),'events':len(data.get('events',[]))}

if __name__=='__main__':
    print(json.dumps(refresh(),ensure_ascii=False))
