#!/usr/bin/env python3
"""Validate public calendar JSON, fail build on risky unverified event shapes."""
import json
from pathlib import Path
import re
from datetime import date
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]/'site'/'data'
events=json.loads((ROOT/'events.json').read_text(encoding='utf-8'))
assert events['schemaVersion']==1 and isinstance(events['events'],list)
seen=set()
for event in events['events']:
    assert event['id'] not in seen,event['id']
    seen.add(event['id'])
    assert all(isinstance(event.get(k),str) and event[k] for k in ('id','title','kind','location','source'))
    u=urlparse(event['source'])
    assert u.scheme=='https' and u.hostname,event
    st,en=event.get('start'),event.get('end')
    assert (st is None and en is None) or (st and en and date.fromisoformat(st)<=date.fromisoformat(en))
for name in ('leads.json','update-status.json'):
    json.loads((ROOT/name).read_text(encoding='utf-8'))
print('VALID:',len(seen),'reviewed sample events')

auto=json.loads((ROOT/'events-auto.json').read_text(encoding='utf-8'))
assert auto['schemaVersion']==1 and auto.get('status') in ('pending','success','stale')
assert isinstance(auto.get('events'),list)
for e in auto['events']:
    assert all(isinstance(e.get(k),str) and e[k] for k in ('id','title','kind','location','start','end','source'))
    assert date.fromisoformat(e['start'])<=date.fromisoformat(e['end'])
    assert urlparse(e['source']).hostname=='www.shcstheatre.com'
print('VALID:',len(auto['events']),'auto-dated venue programmes')
