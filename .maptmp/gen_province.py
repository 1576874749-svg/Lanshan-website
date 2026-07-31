import re
from shapefile import Reader

BASE = r"c:\Users\admin\Desktop\lanshan-studio-website"
NATION_SHP = BASE + r"\.maptmp\extracted\china_SHP\国界_Project.shp"
PROV_SHP = BASE + r"\.maptmp\extracted\china_SHP\省界_Project.shp"
HTML = BASE + r"\index.html"
W, H, PAD = 760, 540, 18

# 1) 用国界 shp 求 bbox，保证与 map-outline 完全同一投影
sf = Reader(NATION_SHP)
minLng = minLat = float("inf")
maxLng = maxLat = float("-inf")
for shp in sf.shapes():
    for p in shp.points:
        minLng = min(minLng, p[0]); maxLng = max(maxLng, p[0])
        minLat = min(minLat, p[1]); maxLat = max(maxLat, p[1])
scale = min((W - 2 * PAD) / (maxLng - minLng), (H - 2 * PAD) / (maxLat - minLat))
offX = (W - (maxLng - minLng) * scale) / 2
offY = (H - (maxLat - minLat) * scale) / 2
def proj(lng, lat):
    return (round((lng - minLng) * scale + offX, 1),
            round((maxLat - lat) * scale + offY, 1))

# 2) 投影省界（polyline，不闭合），抽稀降体积
MIN_DIST = 1.6
d_parts = []
pt_count = 0
psf = Reader(PROV_SHP)
print("province shapeType:", psf.shapeType)
for shp in psf.shapes():
    pts = shp.points
    parts = list(shp.parts) if hasattr(shp, "parts") else [0]
    for i in range(len(parts)):
        start = parts[i]
        end = parts[i + 1] if i + 1 < len(parts) else len(pts)
        seg = pts[start:end]
        out = []
        for p in seg:
            x, y = proj(p[0], p[1])
            if not out or ((x - out[-1][0]) ** 2 + (y - out[-1][1]) ** 2) ** 0.5 >= MIN_DIST:
                out.append((x, y))
        # 保留末点，保证边界段闭合到端点
        if seg:
            x, y = proj(seg[-1][0], seg[-1][1])
            if out and (x, y) != out[-1]:
                out.append((x, y))
        if len(out) >= 2:
            d_parts.append("M" + " L".join(f"{x} {y}" for x, y in out))
            pt_count += len(out)
d = "".join(d_parts)
print("province points:", pt_count, "path chars:", len(d))

# 3) 写入 index.html：先清掉旧 map-province，再插到 map-outline 之后
with open(HTML, "r", encoding="utf-8") as f:
    html = f.read()
html = re.sub(r'\s*<path class="map-province"[^>]*/?>(?:</path>)?', "", html)
m = re.search(r'<path class="map-outline" d="[^"]*"\s*/?>(?:</path>)?', html)
if not m:
    raise SystemExit("map-outline not found!")
insert = m.group(0) + '\n                  <path class="map-province" d="' + d + '"></path>'
html = html[:m.start()] + insert + html[m.end():]
with open(HTML, "w", encoding="utf-8") as f:
    f.write(html)
print("inserted map-province AFTER map-outline. html size:", len(html))
