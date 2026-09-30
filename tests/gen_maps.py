"""Generate synthetic battle maps with known grids into the current directory (run from tests/maps)."""
import numpy as np, json
from PIL import Image, ImageDraw, ImageFilter
rng=np.random.default_rng(7)
def texture(w,h,base=(110,120,90),amp=40):
    # multi-scale noise, looks like grass/stone
    img=np.zeros((h,w),dtype=np.float32)
    for sc,a in [(64,1.0),(16,0.6),(4,0.4),(1,0.25)]:
        n=rng.normal(0,1,(h//sc+2,w//sc+2)).astype(np.float32)
        n=np.array(Image.fromarray(n).resize((w,h),Image.BICUBIC))
        img+=a*n
    img=img/img.std()*amp
    rgb=np.stack([np.clip(base[i]+img*(0.8+0.2*i),0,255) for i in range(3)],-1).astype(np.uint8)
    im=Image.fromarray(rgb)
    d=ImageDraw.Draw(im)
    # some features: blobs (trees/rocks), a river
    for _ in range(int(w*h/60000)):
        x,y,r=rng.integers(0,w),rng.integers(0,h),rng.integers(15,70)
        col=tuple(int(c) for c in rng.integers(30,160,3))
        d.ellipse([x-r,y-r,x+r,y+r],fill=col)
    return im.filter(ImageFilter.GaussianBlur(1.2))
def grid(im,cell,ox=0,oy=0,color=(20,20,20),alpha=200,lw=2):
    w,h=im.size
    ov=Image.new("RGBA",(w,h),(0,0,0,0)); d=ImageDraw.Draw(ov)
    x=ox
    while x<w:
        xi=int(round(x)); d.rectangle([xi-lw//2,0,xi-lw//2+lw-1,h],fill=color+(alpha,)); x+=cell
    y=oy
    while y<h:
        yi=int(round(y)); d.rectangle([0,yi-lw//2,w,yi-lw//2+lw-1],fill=color+(alpha,)); y+=cell
    return Image.alpha_composite(im.convert("RGBA"),ov).convert("RGB")
def dungeon(w,h,tile,celltiles=1):
    im=Image.new("RGB",(w,h),(18,16,20)); d=ImageDraw.Draw(im)
    rooms=[]
    for _ in range(9):
        cw,ch=rng.integers(4,10)*tile*celltiles,rng.integers(3,8)*tile*celltiles
        x=rng.integers(0,max(1,(w-cw)//(tile*celltiles)))*tile*celltiles; y=rng.integers(0,max(1,(h-ch)//(tile*celltiles)))*tile*celltiles
        rooms.append((x,y,cw,ch))
    for (x,y,cw,ch) in rooms:
        for ty in range(y,y+ch,tile):
            for tx in range(x,x+cw,tile):
                g=int(rng.integers(95,135)); d.rectangle([tx+1,ty+1,tx+tile-2,ty+tile-2],fill=(g,g-5,g-12))
                d.rectangle([tx,ty,tx+tile-1,ty+tile-1],outline=(55,50,48))
    a=np.array(im).astype(np.float32)+rng.normal(0,7,(h,w,1))
    return Image.fromarray(np.clip(a,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
T={}
def save(name,im,truth,q=88,fmt="jpg"):
    fn=name+"."+fmt
    if fmt=="jpg": im.save(fn,quality=q)
    else: im.save(fn)
    T[fn]=dict(truth,w=im.size[0],h=im.size[1]); print(fn,im.size)
save("g70",grid(texture(1540,1120),70),{"cell":70,"kind":"grid"})
save("g140",grid(texture(2800,2100),140,lw=3),{"cell":140,"kind":"grid"})
save("g113_6",grid(texture(2840,1818),113.6,lw=3),{"cell":113.6,"kind":"grid"})
save("g25",grid(texture(750,500,amp=25),25,lw=1),{"cell":25,"kind":"grid"})
save("g64_off",grid(texture(1300,900),64,ox=17,oy=23),{"cell":64,"ox":17,"oy":23,"kind":"grid"})
save("g50_1200x900",grid(texture(1200,900),50),{"cell":50,"kind":"grid"})
save("g100_faint",grid(texture(3000,2000,amp=45),100,alpha=70,lw=2),{"cell":100,"kind":"grid"},q=75)
save("g200",grid(texture(4000,3000),200,lw=4),{"cell":200,"kind":"grid"},q=80)
save("g35_small",grid(texture(1050,700),35,lw=1),{"cell":35,"kind":"grid"})
save("g256",grid(texture(5120,3584),256,lw=4),{"cell":256,"kind":"grid"},q=80)
save("none_2000",texture(2000,1500),{"cell":0,"kind":"none"})
save("none_huge",texture(7000,5000),{"cell":0,"kind":"none"},q=80)
save("none_tiny",texture(600,400),{"cell":0,"kind":"none"})
save("tiles50",dungeon(2000,1500,50),{"cell":50,"kind":"tiles"})
save("tiles35half",dungeon(2100,1400,35,2),{"cell":35,"kind":"tiles","note":"tiles are half squares; 70 also right"})
save("tiles120",dungeon(3600,2400,120),{"cell":120,"kind":"tiles"})
im=texture(2800,2100); im=grid(im,140,alpha=60,lw=2); im=grid(im,280,alpha=230,lw=4); save("g140_heavy280",im,{"cell":140,"kind":"grid"},q=85)
im=texture(2100,1400); im=grid(im,70,alpha=90,lw=1); im=grid(im,350,alpha=255,lw=3); save("g70_major350",im,{"cell":70,"kind":"grid"},q=85)
json.dump(T,open("truth.json","w"),indent=1)
