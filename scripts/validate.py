#!/usr/bin/env python3
"""Validate a self-contained audience deck before publishing."""
import hashlib, json, re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
BANNED=re.compile(r'(^|/)(learn|rehearsal|audience-collector|presentation-remote|presenter-remote|presenter-media|remote|\.env|speaker-notes|notes)([./-]|$)|\.bak(?:\.|$)|\.map$|\.pptx$',re.I)
TOP={'audience-video.js','index.html','deck.css','deck.js','cursor.js','README.md','.nojekyll','public-manifest.json','THIRD_PARTY.md','scripts/validate.py','.github/workflows/pages.yml'}
def check(condition,message):
 if not condition:raise SystemExit('PUBLIC EXPORT CHECK FAILED: '+message)
def local(ref,base):
 u=urlsplit(ref)
 if u.scheme or u.netloc or not u.path:return
 check(not u.path.startswith('/'),'root-relative asset: '+ref)
 dest=(base.parent/unquote(u.path)).resolve()
 check(dest.is_relative_to(ROOT),'path escapes export: '+ref)
 check(dest.is_file(),'missing local asset: '+str(dest.relative_to(ROOT)))
 check(not BANNED.search(str(dest.relative_to(ROOT))),'private file reference: '+ref)
class Audit(HTMLParser):
 def __init__(self,base):super().__init__();self.base=base;self.slides=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  check(not(tag=='aside' and 'notes' in a.get('class','').split()),'speaker notes in HTML')
  check('data-notes' not in a,'data-notes attribute')
  check(not any(k.startswith('data-presenter') for k in a),'presenter data attribute')
  if tag=='section' and 'data-n' in a:self.slides+=1
  for k,v in attrs:
   if k in ('src','href','poster','data-src','data-embed') and v:local(v,self.base)
 def handle_comment(self,text):check(False,'HTML comments must be removed')
manifest=json.loads((ROOT/'public-manifest.json').read_text())
actual={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.relative_to(ROOT).parts}
check(actual==set(manifest['files'])|{'public-manifest.json'},'unexpected or missing files versus manifest')
for name in sorted(actual):
 p=ROOT/name
 check(not p.is_symlink(),'symlink: '+name)
 check(not BANNED.search(name),'private filename: '+name)
 check(name in TOP or (name.startswith(('assets/','media/','fonts/','vendor/')) and (p.suffix.lower() in {'.jpg','.jpeg','.png','.svg','.woff2','.mp3','.mp4','.css','.js'} or p.name in {'LICENSE','OFL.txt'})), 'file outside audience allowlist: '+name)
 check(p.stat().st_size<100*1024*1024,'file exceeds GitHub normal file limit: '+name)
 if name!='public-manifest.json':check(hashlib.sha256(p.read_bytes()).hexdigest()==manifest['files'][name],'checksum mismatch: '+name)
 if p.suffix=='.html':
  parser=Audit(p);parser.feed(p.read_text());check(parser.slides==manifest['slides'],'slide count mismatch')
 if p.suffix=='.css':
  for ref in re.findall(r'url\(\s*[\'"]?([^\)\'"\s]+)',p.read_text()):local(ref,p)
 if p.suffix in {'.html','.css','.js','.svg','.md','.yml','.json'} and name!='scripts/validate.py':
  t=p.read_text()
  check(not re.search(r'(/opt/|/home/admin/|wowmoments\.firebots\.cloud/(?:jfall|next)|rehearsal\.html|speaker-notes\.(?:json|md)|learn/cards\.json|presenter-(?:remote|media)|/jfall/remote|Suggested speaker words|Delivery guidance)',t),'presenter content in '+name)
  if name in {'index.html','deck.js','cursor.js'}:check('RevealNotes' not in t and '/plugin/notes/' not in t,'notes plugin remains')
print(f"Audience export verified: {manifest['slides']} slides, {len(actual)} files; no presenter files or missing local assets.")
