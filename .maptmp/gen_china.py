import json
from shapefile import Reader

SHP = r"c:\Users\admin\Desktop\lanshan-studio-website\.maptmp\extracted\china_SHP\国界_Project.shp"
W, H, PAD = 760, 540, 18

# 1) 读取所有点，求经纬度包围盒
sf = Reader(SHP)
minLng = minLat = float("inf")
maxLng = maxLat = float("-inf")
shapes = sf.shapes()
for shp in shapes:
    for p in shp.points:
        lng, lat = p[0], p[1]
        minLng = min(minLng, lng); maxLng = max(maxLng, lng)
        minLat = min(minLat, lat); maxLat = max(maxLat, lat)
print("bbox lng", round(minLng, 3), round(maxLng, 3), "lat", round(minLat, 3), round(maxLat, 3))

# 2) 统一比例投影（保持国界真实形状）
scale = min((W - 2 * PAD) / (maxLng - minLng), (H - 2 * PAD) / (maxLat - minLat))
offX = (W - (maxLng - minLng) * scale) / 2
offY = (H - (maxLat - minLat) * scale) / 2
def proj(lng, lat):
    return (round((lng - minLng) * scale + offX, 1),
            round((maxLat - lat) * scale + offY, 1))

# 3) 生成路径（按 parts 拆环，去重压缩）
MIN_DIST = 0.8
d = ""
pt_count = 0
for shp in shapes:
    pts = shp.points
    parts = shp.parts if hasattr(shp, "parts") else [0]
    for i in range(len(parts)):
        start = parts[i]
        end = parts[i + 1] if i + 1 < len(parts) else len(pts)
        ring = pts[start:end]
        out = []
        for p in ring:
            x, y = proj(p[0], p[1])
            if not out or ((x - out[-1][0]) ** 2 + (y - out[-1][1]) ** 2) ** 0.5 >= MIN_DIST:
                out.append((x, y))
        if len(out) >= 3:
            d += "M" + " L".join(f"{x} {y}" for x, y in out) + " Z"
            pt_count += len(out)
print("points after decimate:", pt_count, "path chars:", len(d))
with open("china-outline.txt", "w", encoding="utf-8") as f:
    f.write(d)

# 4) 城市标注同投影
cities = {
    "北京": [116.40, 39.90], "上海": [121.47, 31.23], "杭州": [120.15, 30.27],
    "深圳": [114.06, 22.54], "重庆": [106.55, 29.56],
}
print("CITIES:")
for n, (lng, lat) in cities.items():
    x, y = proj(lng, lat)
    print(f'  {{"name":"{n}","x":{x},"y":{y}}}')
