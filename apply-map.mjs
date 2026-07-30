import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const d = readFileSync("map-outline.txt", "utf8");

let out = html;

// 1) 真实国界替换原卡通轮廓
out = out.replace(/<path class="map-outline" d="[^"]*"/, `<path class="map-outline" d="${d}"`);

// 2) 删除旧的装饰性外围虚线（真实地图不需要）
out = out.replace(/<path class="map-surroundings"[^>]*\/>/g, "");

// 3) 删除旧的海岛独立路径（海南/台湾已在国界数据中）
out = out.replace(/<path class="map-island[^>]*\/>/g, "");

// 4) 海面/邻国标注重定位到真实经纬度
out = out.replace(/<text class="map-sea-label"[^>]*>东海<\/text>/, `<text class="map-sea-label" x="599.4" y="343.7">东海</text>`);
out = out.replace(/<text class="map-sea-label"[^>]*>南海<\/text>/, `<text class="map-sea-label" x="472.4" y="520">南海</text>`);
out = out.replace(/<text class="map-neighbor-label"[^>]*>蒙古<\/text>/, `<text class="map-neighbor-label" x="368.5" y="115.8">蒙古</text>`);
out = out.replace(/<text class="map-neighbor-label"[^>]*>朝鲜半岛<\/text>/, `<text class="map-neighbor-label" x="645.6" y="249.9">朝鲜半岛</text>`);

writeFileSync("index.html", out);
console.log("index.html updated, length:", out.length);
