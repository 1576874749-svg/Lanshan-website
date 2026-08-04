"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ChinaGlobe, { GlobeCity } from "./ChinaGlobe";

type City = GlobeCity & {
  company: string;
  people: number;
  roles: string;
  members: string[];
};

const navigation = ["首页", "关于蓝山", "部门", "项目", "毕业去向", "加入我们"];

type Alumni = {
  id: string;
  name: string;
  school: string;
  destination: string;
  city: string;
  type: string;
};

const initialAlumni: Alumni[] = [
  { name: "黄一峰", school: "计算机学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "万子渝", school: "计算机学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "潘麒麟", school: "计算机学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "唐华洋", school: "计算机学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "赵锡军", school: "计算机学院", destination: "腾讯 WXG", city: "深圳", type: "就业" },
  { name: "李恩熙", school: "计算机学院", destination: "京东", city: "北京", type: "就业" },
  { name: "杨璟轩", school: "计算机学院", destination: "保研华南理工", city: "广州", type: "升学" },
  { name: "蔡学长", school: "计算机科学与技术学院", destination: "曼彻斯特大学", city: "海外", type: "升学" },
  { name: "彭学长", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "肖学长", school: "计算机科学与技术学院", destination: "腾讯", city: "深圳", type: "就业" },
  { name: "熊学长", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "李学长①", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "冯学长", school: "计算机科学与技术学院", destination: "四川烟草", city: "成都", type: "就业" },
  { name: "王学长", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "唐学长①", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "袁学长", school: "计算机科学与技术学院", destination: "美团", city: "北京", type: "就业" },
  { name: "杨学长", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "罗学长", school: "计算机科学与技术学院", destination: "科大讯飞", city: "合肥", type: "就业" },
  { name: "唐学长②", school: "计算机科学与技术学院", destination: "深信服", city: "深圳", type: "就业" },
  { name: "刘学长", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "李学长②", school: "计算机科学与技术学院", destination: "字节跳动", city: "北京", type: "就业" },
  { name: "谭学长", school: "人工智能学院", destination: "腾讯", city: "深圳", type: "就业" },
  { name: "付学长", school: "人工智能学院", destination: "中通服", city: "北京", type: "就业" },
  { name: "林学长", school: "自动化学院", destination: "华南理工大学", city: "广州", type: "升学" },
  { name: "吴学长", school: "生物学院", destination: "大疆", city: "深圳", type: "就业" },
  { name: "梁学长", school: "安法学院", destination: "重庆邮电大学", city: "重庆", type: "升学" },
  { name: "唐学长③", school: "安法学院", destination: "腾讯音乐", city: "深圳", type: "就业" },
].map((person, index) => ({ ...person, id: `alumni-${index + 1}` }));

const requiredImports = initialAlumni.slice(0, 7);

const coordinates: Record<string, { lat: number; lon: number }> = {
  北京: { lat: 39.9, lon: 116.4 },
  深圳: { lat: 22.5, lon: 114.1 },
  广州: { lat: 23.1, lon: 113.3 },
  成都: { lat: 30.6, lon: 104.1 },
  合肥: { lat: 31.8, lon: 117.2 },
  重庆: { lat: 29.6, lon: 106.6 },
  上海: { lat: 31.2, lon: 121.5 },
  杭州: { lat: 30.3, lon: 120.2 },
};

const cityProvince: Record<string, string> = {
  北京: "北京", 深圳: "广东", 广州: "广东", 成都: "四川",
  合肥: "安徽", 重庆: "重庆", 上海: "上海", 杭州: "浙江",
};

const emptyForm = { name: "", school: "", destination: "", city: "北京", type: "就业" };

export default function Home() {
  const [alumni, setAlumni] = useState<Alumni[]>(initialAlumni);
  const [selectedName, setSelectedName] = useState("北京");
  const [selectedProvince, setSelectedProvince] = useState("北京");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const saved = window.localStorage.getItem("lanshan-destinations");
    if (saved) {
      try {
        const existing = JSON.parse(saved) as Alumni[];
        const existingNames = new Set(existing.map((person) => person.name));
        setAlumni([
          ...existing,
          ...requiredImports.filter((person) => !existingNames.has(person.name)),
        ]);
      } catch { /* 保留默认数据 */ }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("lanshan-destinations", JSON.stringify(alumni));
  }, [alumni]);

  const allDomesticCities = useMemo(() => Object.entries(
    alumni.filter((person) => person.city !== "海外" && coordinates[person.city])
      .reduce<Record<string, Alumni[]>>((groups, person) => {
        (groups[person.city] ??= []).push(person);
        return groups;
      }, {}),
  ).map(([name, people]) => ({
    name,
    ...coordinates[name],
    people: people.length,
    company: [...new Set(people.map((person) => person.destination))].join("、"),
    roles: [...new Set(people.map((person) => person.type))].join(" / "),
    members: people.map((person) => person.name),
  })).sort((a, b) => b.people - a.people), [alumni]);

  const cities: City[] = allDomesticCities.slice(0, 5);
  const provinceAlumni = alumni.filter((person) => cityProvince[person.city] === selectedProvince);
  const selected = {
    name: selectedProvince,
    people: provinceAlumni.length,
    company: [...new Set(provinceAlumni.map((person) => person.destination))].join("、") || "暂无记录",
    roles: [...new Set(provinceAlumni.map((person) => person.type))].join(" / ") || "—",
    members: provinceAlumni.map((person) => person.name),
  };
  const totals = useMemo(
    () => [
      { value: allDomesticCities.length, label: "国内城市" },
      { value: alumni.length, label: "毕业成员" },
      { value: new Set(alumni.map((person) => person.destination)).size, label: "去向单位" },
      { value: new Set(alumni.map((person) => person.type)).size, label: "去向类型" },
    ],
    [alumni, allDomesticCities],
  );

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function openEdit(person: Alumni) {
    setEditingId(person.id);
    setForm({ name: person.name, school: person.school, destination: person.destination, city: person.city, type: person.type });
  }

  function savePerson(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.school.trim() || !form.destination.trim()) return;
    if (editingId) {
      setAlumni((items) => items.map((item) => item.id === editingId ? { ...item, ...form } : item));
    } else {
      setAlumni((items) => [...items, { id: `alumni-${Date.now()}`, ...form }]);
    }
    openNew();
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="蓝山工作室首页">
          <span className="mountain-mark"><i /><i /><i /></span>
          <span><strong>蓝山工作室</strong><small>LANSHAN STUDIO</small></span>
        </a>
        <nav aria-label="主导航">
          {navigation.map((item) => (
            <button className={item === "毕业去向" ? "active" : ""} key={item}>{item}</button>
          ))}
        </nav>
        <button className="settings" aria-label="数据管理" onClick={() => setEditorOpen(true)}>✎</button>
      </header>

      <section className="hero">
        <div className="intro">
          <p className="eyebrow">WHERE WE GO</p>
          <h1>毕业去向</h1>
          <p>从蓝山出发，在不同城市继续创造价值</p>
        </div>

        <div className="stats" aria-label="毕业去向统计">
          {totals.map((item) => (
            <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>
          ))}
        </div>

        <div className="map-stage globe-stage">
          <div className="map-copy">
            <span>当前地区</span>
            <h2>{selected?.name ?? "暂无数据"}</h2>
            <dl>
              <div><dt>毕业成员</dt><dd>{selected?.people ?? 0} 人</dd></div>
              <div><dt>代表企业</dt><dd>{selected?.company ?? "—"}</dd></div>
              <div><dt>去向类型</dt><dd>{selected?.roles ?? "—"}</dd></div>
            </dl>
            <div className="member-list">
              {selected?.members.map((name, index) => <b key={`${name}-${index}`}>{name}</b>)}
            </div>
            <p>当前共导入 {alumni.length} 条数据，海外去向另计。</p>
          </div>

          <ChinaGlobe
            cities={cities}
            selected={selectedName}
            onProvinceSelect={setSelectedProvince}
            onSelect={(city) => {
              setSelectedName(city);
              setSelectedProvince(cityProvince[city] ?? city);
            }}
          />
          <div className="globe-hint">拖动地图 · 点击任意省份或城市查看</div>
        </div>
      </section>

      <button className="join">加入蓝山 <span>↗</span></button>

      {editorOpen && (
        <div className="editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditorOpen(false)}>
          <section className="data-editor" aria-label="毕业去向数据管理">
            <header>
              <div><span>DATA MANAGER</span><h2>毕业去向数据</h2></div>
              <button onClick={() => setEditorOpen(false)} aria-label="关闭">×</button>
            </header>

            <form className="editor-form" onSubmit={savePerson}>
              <label>姓名<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label>学院<input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} required /></label>
              <label>去向单位<input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></label>
              <label>地区
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                  {[...Object.keys(coordinates), "海外"].map((city) => <option key={city}>{city}</option>)}
                </select>
              </label>
              <label>类型
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>就业</option><option>升学</option><option>创业</option><option>其他</option>
                </select>
              </label>
              <div className="form-actions">
                <button type="submit">{editingId ? "保存修改" : "添加记录"}</button>
                {editingId && <button type="button" onClick={openNew}>取消编辑</button>}
              </div>
            </form>

            <div className="editor-list">
              {alumni.map((person) => (
                <article key={person.id}>
                  <div><strong>{person.name}</strong><span>{person.school}</span></div>
                  <div><b>{person.destination}</b><span>{person.city} · {person.type}</span></div>
                  <div className="row-actions">
                    <button onClick={() => openEdit(person)}>编辑</button>
                    <button onClick={() => setAlumni((items) => items.filter((item) => item.id !== person.id))}>删除</button>
                  </div>
                </article>
              ))}
            </div>
            <footer><span>共 {alumni.length} 条记录</span><button onClick={() => setAlumni(initialAlumni)}>恢复初始数据</button></footer>
          </section>
        </div>
      )}
    </main>
  );
}
