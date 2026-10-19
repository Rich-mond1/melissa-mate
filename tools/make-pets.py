# Builds src/app/pets.js from cartoon PNGs (white bg -> transparent, 200px webp). Usage: make-pets.py <base_dir> <new_dir> <out>
import sys, io, base64
from PIL import Image, ImageDraw
base, new, out = sys.argv[1:4]
def prep(path):
    im = Image.open(path).convert('RGBA'); w, h = im.size
    # flood fill white-ish background from all edges
    mask = Image.new('L', (w, h), 0)
    px = im.load(); seen = bytearray(w*h); st = []
    for x in range(w): st += [(x,0),(x,h-1)]
    for y in range(h): st += [(0,y),(w-1,y)]
    while st:
        x,y = st.pop()
        if x<0 or y<0 or x>=w or y>=h or seen[y*w+x]: continue
        r,g,b,a = px[x,y]
        if min(r,g,b) < 244: continue
        seen[y*w+x]=1; px[x,y]=(r,g,b,0)
        st += [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
    bb = im.getchannel('A').point(lambda v: 255 if v>8 else 0).getbbox()
    im = im.crop(bb); s = max(im.size); sq = Image.new('RGBA',(s,s),(0,0,0,0)); sq.paste(im,((s-im.width)//2,(s-im.height)//2))
    sq = sq.resize((176,176), Image.LANCZOS); b = io.BytesIO(); sq.save(b,'WEBP',quality=62,method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
groups = {'ginger': ['ginger.png'] + ['g%d.png'%i for i in range(4)] + ['s%d.png'%i for i in range(4)],
          'bimba': ['bimba.png'] + ['b%d.png'%i for i in range(8)],
          'duck': ['duck.png'] + ['d%d.png'%i for i in range(8)]}
o = ['/* Cartoon versions of the family pets (fal.ai cartoons from photos; no photos are stored). Variant 0 = mascot. */', 'const PETS = {']
tot = 0
for k, fs in groups.items():
    o.append("  %s: [" % k)
    for f in fs:
        d = prep((base if f in ('ginger.png','bimba.png','duck.png') else new) + '/' + f); tot += len(d); o.append("    '%s'," % d)
    o.append("  ],")
o.append('};'); o.append("const PET_NAMES = { ginger: 'Pato', bimba: 'Bimba', duck: 'Ducky' };")
open(out,'w').write('\n'.join(o)+'\n'); print('bytes', tot)
