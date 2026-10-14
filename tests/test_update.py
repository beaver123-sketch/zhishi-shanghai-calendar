import sys
from pathlib import Path
import datetime as dt
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from update_official import extract

class ExtractTest(unittest.TestCase):
    def test_extract_official_article_only(self):
        html='''<a href="/yshd/20261014/a2345234.html" title="上海秋日音乐节活动预告">摘要</a>
        <a href="https://example.com/shanghai/20261014/test.html">官方音乐会</a>
        <a href="/yshd/20240914/f000.html">往年花展活动</a>'''
        found=extract(html,'https://whlyj.sh.gov.cn/yshd/','上海文旅局',dt.date(2026,10,14))
        self.assertEqual(len(found),1)
        self.assertEqual(found[0]['publishedAt'],'2026-10-14')
        self.assertTrue(found[0]['url'].startswith('https://whlyj.sh.gov.cn/'))
    def test_invalid_date_does_not_create_event(self):
        html='<a href="/yshd/20261399/abc.html">上海音乐节活动</a>'
        self.assertEqual(extract(html,'https://whlyj.sh.gov.cn/yshd/','test',dt.date(2026,10,14)),[])

if __name__=='__main__':unittest.main()
