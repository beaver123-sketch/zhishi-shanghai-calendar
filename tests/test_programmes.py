import datetime as dt
import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from update_programmes import parse

class ProgrammeTests(unittest.TestCase):
    def test_dated_programmes_are_extracted(self):
        html='''<h3>粤语音乐剧《边城》</h3><p>类型：音乐剧</p>
        <p>日期：2026.11.20-2026.11.22</p><a>立即购票</a>
        <h3>中文原创音乐剧《海上钢琴师》</h3>
        <p>日期：2026.11.27-2026.11.29</p><a>立即购票</a>'''
        items=parse(html,dt.date(2026,10,19))
        self.assertEqual(len(items),2)
        self.assertEqual(items[0]['start'],'2026-11-20')
        self.assertEqual(items[1]['end'],'2026-11-29')
        self.assertTrue(all(x['source'].startswith('https://www.shcstheatre.com/') for x in items))
    def test_undated_article_and_expired_show_are_not_events(self):
        html='''<h3>新的艺术节正式开幕</h3><p>大量展览吸引游客</p><a>立即购票</a>
        <h3>过期舞剧《往事》</h3><p>日期：2026.09.10-2026.09.11</p><a>立即购票</a>'''
        self.assertEqual(parse(html,dt.date(2026,10,19)),[])
    def test_calendar_date_rejects_invalid_days(self):
        html='<h3>音乐剧《幻想》</h3><p>日期：2026.11.99-2026.12.01</p><a>立即购票</a>'
        self.assertEqual(parse(html,dt.date(2026,10,19)),[])
if __name__=='__main__':unittest.main()
