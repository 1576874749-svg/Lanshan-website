import re

HTML = r"c:\Users\admin\Desktop\lanshan-studio-website\index.html"
with open(HTML, "r", encoding="utf-8") as f:
    html = f.read()

# 1) 用标准国界轮廓替换 map-outline 的 d
with open(r"c:\Users\admin\Desktop\lanshan-studio-website\.maptmp\china-outline.txt", "r", encoding="utf-8") as f:
    new_d = f.read().strip()
html = re.sub(r'(<path class="map-outline" d=")[^"]*(")',
              lambda m: m.group(1) + new_d + m.group(2), html, count=1)

# 2) 移除装饰性虚线外框（旧坐标，与新地图冲突）
html = re.sub(r"\s*<g class=\"map-surroundings\"[^>]*>.*?</g>", "", html, flags=re.DOTALL)

# 3) 移除独立岛屿路径（真实国界已含海南/台湾/南海界限）
html = re.sub(r'\s*<path class="map-island[^>]*>\s*', "", html)

# 4) 重定位海面/邻国标注到真实投影位置
labels = {
    '<text class="map-sea-label" x="615" y="392">东海</text>':
        '<text class="map-sea-label" x="600" y="285">东海</text>',
    '<text class="map-sea-label" x="520" y="472">南海</text>':
        '<text class="map-sea-label" x="470" y="500">南海</text>',
    '<text class="map-neighbor-label" x="318" y="57">蒙古</text>':
        '<text class="map-neighbor-label" x="360" y="86">蒙古</text>',
    '<text class="map-neighbor-label" x="657" y="183">朝鲜半岛</text>':
        '<text class="map-neighbor-label" x="623" y="195">朝鲜半岛</text>',
}
for a, b in labels.items():
    html = html.replace(a, b)

with open(HTML, "w", encoding="utf-8") as f:
    f.write(html)
print("index.html updated. map-outline d length:", len(new_d))
print("map-surroundings removed:", 'map-surroundings' not in html)
print("map-island removed:", 'map-island' not in html)
