"use client";

import { PointerEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

export type GlobeCity = {
  name: string;
  lat: number;
  lon: number;
  people?: number;
};

type Props = {
  cities: GlobeCity[];
  selected: string;
  onSelect: (name: string) => void;
  onProvinceSelect?: (name: string) => void;
};

const cityPositions: Record<string, { x: number; y: number }> = {
  北京: { x: 70.2, y: 29.5 },
  上海: { x: 81.8, y: 55.5 },
  杭州: { x: 78.8, y: 60.2 },
  深圳: { x: 71.5, y: 82.2 },
  广州: { x: 68.8, y: 80.6 },
  成都: { x: 52.7, y: 58.8 },
  合肥: { x: 70.4, y: 54.4 },
  重庆: { x: 57.8, y: 58.5 },
};

const cityProvinces: Record<string, string> = {
  北京: "北京",
  上海: "上海",
  杭州: "浙江",
  深圳: "广东",
  广州: "广东",
  成都: "四川",
  合肥: "安徽",
  重庆: "重庆",
};

const provinceNames: Record<string, string> = {
  anhui: "安徽", beijing: "北京", chongqing: "重庆", fujian: "福建",
  gansu: "甘肃", guangdong: "广东", guangxi: "广西", guizhou: "贵州",
  hainan: "海南", hebei: "河北", heilongjiang: "黑龙江", henan: "河南",
  hubei: "湖北", hunan: "湖南", jiangsu: "江苏", jiangxi: "江西",
  jilin: "吉林", liaoning: "辽宁", neimenggu: "内蒙古", ningxia: "宁夏",
  qinghai: "青海", shaanxi: "陕西", shandong: "山东", shanghai: "上海",
  shanxi: "山西", sichuan: "四川", tianjin: "天津", xinjiang: "新疆",
  xizang: "西藏", yunnan: "云南", zhejiang: "浙江", hongkong: "香港",
  macao: "澳门", taiwan: "台湾",
};

const suppliedProvinceNames = [
  "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
  "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南",
  "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州",
  "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆", "台湾",
  "香港", "澳门",
];

type ProvinceLabel = { name: string; x: number; y: number };

const provinceLabelOffsets: Record<string, { x: number; y: number }> = {
  北京: { x: -7, y: -7 }, 天津: { x: 10, y: 5 }, 上海: { x: 11, y: 3 },
  江苏: { x: 2, y: -5 }, 浙江: { x: 5, y: 5 }, 香港: { x: 6, y: 8 },
  澳门: { x: -8, y: 8 }, 台湾: { x: 6, y: 0 }, 海南: { x: 0, y: 4 },
  宁夏: { x: 0, y: 4 }, 重庆: { x: 2, y: 3 },
};

export default function ChinaGlobe({ cities, selected, onSelect, onProvinceSelect }: Props) {
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [mapPaths, setMapPaths] = useState<string[]>([]);
  const [provinceLabels, setProvinceLabels] = useState<ProvinceLabel[]>([]);
  const mapSheetRef = useRef<HTMLDivElement>(null);
  const provinceGroupRef = useRef<SVGGElement>(null);
  const drag = useRef({ x: 0, y: 0, shiftX: 0, shiftY: 0 });

  useEffect(() => {
    fetch("/china-map.svg")
      .then((response) => response.text())
      .then((source) => {
        const document = new DOMParser().parseFromString(source, "image/svg+xml");
        const paths = Array.from(document.querySelectorAll('path[fill="#eee"]'))
          .slice(0, suppliedProvinceNames.length)
          .map((path) => path.getAttribute("d") ?? "");
        setMapPaths(paths);
      });
  }, []);

  useLayoutEffect(() => {
    if (!mapPaths.length) return;

    let frame = 0;
    const updateLabels = () => {
      const sheet = mapSheetRef.current;
      const group = provinceGroupRef.current;
      if (!sheet || !group) return;
      const sheetRect = sheet.getBoundingClientRect();
      const paths = Array.from(group.querySelectorAll("path"));
      setProvinceLabels(paths.map((path, index) => {
        const rect = path.getBoundingClientRect();
        const name = suppliedProvinceNames[index];
        const offset = provinceLabelOffsets[name] ?? { x: 0, y: 0 };
        return {
          name,
          x: rect.left + rect.width / 2 - sheetRect.left + offset.x,
          y: rect.top + rect.height / 2 - sheetRect.top + offset.y,
        };
      }));
    };
    frame = window.requestAnimationFrame(updateLabels);
    window.addEventListener("resize", updateLabels);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateLabels);
    };
  }, [mapPaths]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      shiftX: shift.x,
      shiftY: shift.y,
    };
    setDragging(true);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const nextX = drag.current.shiftX + (event.clientX - drag.current.x) * 0.42;
    const nextY = drag.current.shiftY + (event.clientY - drag.current.y) * 0.34;
    setShift({
      x: Math.max(-46, Math.min(46, nextX)),
      y: Math.max(-28, Math.min(28, nextY)),
    });
  }

  return (
    <div
      className={dragging ? "earth-surface dragging" : "earth-surface"}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      role="application"
      aria-label="可左右拖动的弧形中国地图"
    >
      <div className="earth-glow" />
      <div
        ref={mapSheetRef}
        className="map-sheet"
        style={{ transform: `translate3d(${shift.x}px, ${shift.y}px, 0)` }}
      >
        <svg className="curved-china-map" viewBox="0 0 878 434" aria-label="中国省级地图">
          <defs>
            <pattern id="mapDots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1.6" cy="1.6" r=".58" fill="#7089b0" />
            </pattern>
            <pattern id="activeDots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1.6" cy="1.6" r=".76" fill="#285693" />
            </pattern>
            <radialGradient id="surfaceShade" cx="50%" cy="22%" r="78%">
              <stop offset="0" stopColor="#ffffff" stopOpacity=".78" />
              <stop offset=".62" stopColor="#edf3fa" stopOpacity=".45" />
              <stop offset="1" stopColor="#cfdcec" stopOpacity=".78" />
            </radialGradient>
          </defs>
          <ellipse cx="387" cy="330" rx="485" ry="310" fill="url(#surfaceShade)" />
          <g
            ref={provinceGroupRef}
            className="province-dots"
            transform="translate(439 217) scale(1.62 1.08) translate(-439 -217)"
          >
            {mapPaths.map((path, index) => {
              const label = suppliedProvinceNames[index];
              return (
                <path
                  key={label}
                  d={path}
                  className={[
                    ["北京", "上海", "浙江", "广东", "重庆"].includes(label) ? "destination" : "",
                    selectedProvince === label ? "province-selected" : "",
                  ].join(" ")}
                  role="button"
                  tabIndex={0}
                  aria-label={`选择${label}`}
                  onClick={() => {
                    setSelectedProvince(label);
                    onProvinceSelect?.(label);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedProvince(label);
                      onProvinceSelect?.(label);
                    }
                  }}
                />
              );
            })}
          </g>
        </svg>
        <div className="province-label-layer" aria-hidden="true">
          {provinceLabels.map((label) => (
            <span
              key={label.name}
              className={selectedProvince === label.name ? "selected" : ""}
              style={{ left: label.x, top: label.y }}
            >
              {label.name}
            </span>
          ))}
        </div>
      </div>
      <div className="city-switcher" aria-label="毕业人数最多的五个城市">
        <span className="city-switcher-title">热门去向 TOP 5</span>
        {cities.map((city) => (
          <button
            key={city.name}
            className={selected === city.name ? "active" : ""}
            onClick={() => {
              const province = cityProvinces[city.name] ?? city.name;
              setSelectedProvince(province);
              onProvinceSelect?.(province);
              onSelect(city.name);
            }}
            aria-pressed={selected === city.name}
          >
            <i />
            {city.name}
            {city.people !== undefined && <small>{city.people}人</small>}
          </button>
        ))}
      </div>
      <div className="province-selection">
        <span>已选择省份</span>
        <strong>{selectedProvince || "未选择"}</strong>
      </div>
    </div>
  );
}
